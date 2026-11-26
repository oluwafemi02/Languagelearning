// The app's version. Bump it for every change that ships (CI fails a pull request that doesn't):
//   npm run bump -- minor   (new feature)   or   npm run bump -- patch   (fix)
// The same number is in service-worker.js and package.json; the bump script keeps all three in step.
const APP_VERSION = '3.0.0';
const APP_RELEASED = '2026-11-26';

if (typeof window !== 'undefined') {
  window.APP_VERSION = APP_VERSION;
  window.APP_RELEASED = APP_RELEASED;
}
if (typeof module !== 'undefined') {
  module.exports = { APP_VERSION, APP_RELEASED };
}
