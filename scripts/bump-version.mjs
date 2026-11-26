// Bump the app version everywhere it lives: version.js, service-worker.js and package.json.
// Usage: npm run bump -- patch | minor | major | 3.4.0
import { readFileSync, writeFileSync } from 'node:fs';

const arg = process.argv[2] || 'patch';
const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const write = (f, s) => writeFileSync(new URL(`../${f}`, import.meta.url), s);

const current = /APP_VERSION = '(\d+\.\d+\.\d+)'/.exec(read('version.js'))[1];
const [maj, min, pat] = current.split('.').map(Number);
const next = /^\d+\.\d+\.\d+$/.test(arg) ? arg
  : arg === 'major' ? `${maj + 1}.0.0`
  : arg === 'minor' ? `${maj}.${min + 1}.0`
  : `${maj}.${min}.${pat + 1}`;
const today = new Date().toISOString().slice(0, 10);

write('version.js', read('version.js')
  .replace(/APP_VERSION = '[^']+'/, `APP_VERSION = '${next}'`)
  .replace(/APP_RELEASED = '[^']+'/, `APP_RELEASED = '${today}'`));
write('service-worker.js', read('service-worker.js').replace(/APP_VERSION = '[^']+'/, `APP_VERSION = '${next}'`));
const pkg = JSON.parse(read('package.json'));
pkg.version = next;
write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`${current} -> ${next}. Add a line for it at the top of CHANGELOG.md.`);
