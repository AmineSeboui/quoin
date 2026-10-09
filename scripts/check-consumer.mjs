import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const work = mkdtempSync(join(tmpdir(), 'quoin-consumer-'));
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

run('npm', ['pack', '--pack-destination', work], root);
const tarball = readdirSync(work).find((name) => name.endsWith('.tgz'));

writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'quoin-consumer', private: true, type: 'module' }));
run(
  'npm',
  [
    'install', '--no-audit', '--no-fund', `./${tarball}`,
    'react@19', 'react-dom@19', '@types/react@19', '@types/react-dom@19', 'lucide-react@^1',
    'typescript@5.4',
  ],
  work,
);

const samples = join(work, 'samples');
mkdirSync(samples);
cpSync(join(root, 'consumer-check', 'consumer.tsx'), join(samples, 'consumer.tsx'));

// The README is the package's front door, so its samples are typechecked against the packed build too.
const readme = readFileSync(join(root, 'README.md'), 'utf8');
[...readme.matchAll(/```(tsx?)\n([\s\S]*?)```/g)].forEach(([, lang, code], i) => {
  writeFileSync(join(samples, `readme-${i + 1}.${lang}`), code);
});

writeFileSync(
  join(work, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'bundler',
      jsx: 'react-jsx', strict: true, noEmit: true, skipLibCheck: false, isolatedModules: true, types: [],
    },
    include: ['samples'],
  }),
);
run(join(work, 'node_modules', '.bin', 'tsc'), ['-p', '.'], work);
console.log('The packed package typechecks for a consumer on TypeScript 5.4, README samples included.');
