// CI: a pull request must raise the version, so every deploy has a new number.
// Usage: node scripts/check-version-bump.mjs <base version.js contents file>
import { readFileSync } from 'node:fs';

const pick = (s) => /APP_VERSION = '(\d+)\.(\d+)\.(\d+)'/.exec(s)?.slice(1).map(Number);
const base = pick(readFileSync(process.argv[2], 'utf8')) || [0, 0, 0];
const head = pick(readFileSync(new URL('../version.js', import.meta.url), 'utf8'));
const cmp = head[0] - base[0] || head[1] - base[1] || head[2] - base[2];
if (cmp <= 0) {
  console.error(`Version ${head.join('.')} is not higher than main's ${base.join('.')}. Run: npm run bump -- patch (or minor)`);
  process.exit(1);
}
console.log(`Version ${base.join('.')} -> ${head.join('.')}`);
