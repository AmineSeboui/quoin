import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'dist/styles.css';
const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const SKIPPED_AT_RULES = /^@(property|keyframes|font-face|counter-style)/;

function splitSelectors(list) {
  const out = [];
  let depth = 0;
  let current = '';
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth += 1;
    if (ch === ')' || ch === ']') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
    } else current += ch;
  }
  out.push(current.trim());
  return out.filter(Boolean);
}

function* rules(source) {
  const stack = [];
  let prelude = '';
  let body = '';
  let nested = false;
  for (const ch of source) {
    if (ch === '{') {
      const text = prelude.trim();
      if (stack.length && !stack[stack.length - 1].atRule) stack[stack.length - 1].nested = true;
      stack.push({ text, atRule: text.startsWith('@'), body: '', nested: false });
      prelude = '';
    } else if (ch === '}') {
      const top = stack.pop();
      if (top && !top.atRule && !top.nested && !stack.some((frame) => SKIPPED_AT_RULES.test(frame.text) || SKIPPED_AT_RULES.test(top.text))) {
        yield { selector: top.text, body: top.body };
      }
      prelude = '';
    } else if (stack.length && !stack[stack.length - 1].atRule) {
      stack[stack.length - 1].body += ch;
    } else {
      prelude += ch;
    }
  }
}

const offenders = [];
for (const { selector, body } of rules(css)) {
  const declarations = body.split(';').map((d) => d.trim()).filter(Boolean);
  const visual = declarations.filter((d) => !d.startsWith('--'));
  if (visual.length === 0) continue;
  for (const one of splitSelectors(selector)) {
    if (!/[.#[]/.test(one)) offenders.push({ selector: one, declarations: visual.slice(0, 3) });
  }
}

if (offenders.length) {
  console.error(`${file} styles elements that are not scoped to a class, which would restyle the host page:`);
  for (const o of offenders) console.error(`  ${o.selector} { ${o.declarations.join('; ')} }`);
  process.exit(1);
}
console.log(`${file}: every rule that sets a visual property is scoped to a class.`);
