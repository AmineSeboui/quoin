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
  console.error(`${file} paints elements by type, which would restyle markup the host wrote:`);
  for (const o of offenders) console.error(`  ${o.selector} { ${o.declarations.join('; ')} }`);
  process.exit(1);
}
// Class names are not namespaced and cannot be: a utility such as .hidden matches the host's own
// markup by design. Keeping that from deciding the cascade is the quoin layer's job, below.
console.log(`${file}: no rule paints by element type; a class, id or attribute selects every painted rule.`);

function* topLevelLayers(source) {
  let i = 0;
  let depth = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (depth === 0 && source.startsWith('@layer', i)) {
      const open = source.indexOf('{', i);
      const end = source.indexOf(';', i);
      if (open !== -1 && (end === -1 || open < end)) {
        let inner = 0;
        let close = open;
        for (; close < source.length; close += 1) {
          if (source[close] === '{') inner += 1;
          else if (source[close] === '}' && (inner -= 1) === 0) break;
        }
        yield { name: source.slice(i + '@layer'.length, open).trim(), body: source.slice(open + 1, close) };
        i = close;
      }
    }
    i += 1;
  }
}

function paintsSomething(body) {
  for (const { body: declarations } of rules(body)) {
    if (declarations.split(';').some((d) => d.trim() && !d.trim().startsWith('--'))) return true;
  }
  return false;
}

// A host decides layer order by first appearance, so a package rule in a layer the host also
// uses lands wherever that host's layer sits. Everything this package paints belongs under one
// top-level `quoin` layer the host can place. Tailwind's own `properties` layer stays outside
// it and is tolerated: it only seeds --tw-* custom properties and paints nothing.
const layered = [...topLevelLayers(css)];
const quoin = layered.filter(({ name }) => name === 'quoin' || name.startsWith('quoin.'));
const strays = layered.filter(({ name }) => !(name === 'quoin' || name.startsWith('quoin.')));
const painting = strays.filter(({ body }) => paintsSomething(body));

if (quoin.length === 0) {
  console.error(`${file} emits nothing inside a top-level "quoin" layer, so a host cannot order it.`);
  process.exit(1);
}
if (painting.length) {
  console.error(`${file} paints from outside the quoin layer, where a host's own rules cannot outrank it:`);
  for (const { name } of painting) console.error(`  @layer ${name}`);
  process.exit(1);
}
console.log(
  `${file}: every painted rule is under the single top-level "quoin" layer (${quoin.map((l) => l.name).join(', ')}).`,
);

// Every custom property the package declares or reads is one it owns. A bare name is one a host
// may already keep for something else, and in either direction the two collide: reading the host's
// --accent drew the selected palette row on the Vite template's bright purple, around 3.2:1, and
// declaring --spacing on :root resized every `p-4` on the host's page, not only the editor's.
// --tw-* belong to Tailwind's own internals and --radix-* are written at runtime by Radix, so both
// are the host's problem with or without this package.
const OWNED = /^(quoin-|tw-|radix-)/;

const declared = new Set([...css.matchAll(/--([a-zA-Z0-9_-]+)\s*:/g)].map((m) => m[1]));
const read = new Set([...css.matchAll(/var\(\s*--([a-zA-Z0-9_-]+)/g)].map((m) => m[1]));
const foreign = [...new Set([...declared, ...read])].filter((name) => !OWNED.test(name)).sort();

if (foreign.length) {
  console.error(`${file} declares or reads custom properties the package does not own:`);
  for (const name of foreign) {
    const how = [declared.has(name) && 'declares', read.has(name) && 'reads'].filter(Boolean).join(' and ');
    console.error(`  --${name} (${how})`);
  }
  process.exit(1);
}
console.log(`${file}: every custom property it declares and reads is its own (--quoin-, --tw- or --radix-).`);
