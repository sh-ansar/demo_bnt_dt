import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const tokens = await read('assets/css/tokens.css');
const css = await read('assets/css/components.css');
const properties = body => Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
const light = properties(tokens.match(/:root\s*\{([^}]+)\}/)[1]);
const dark = {...light, ...properties(tokens.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)[1])};
function resolve(values, name) {
  const value = values[name];
  assert.ok(value, name);
  const alias = value.match(/^var\((--[\w-]+)\)$/);
  return alias ? resolve(values, alias[1]) : value.toLowerCase();
}
for (const values of [light, dark]) {
  assert.equal(resolve(values, '--background-octonary'), '#f7f7f7');
  assert.equal(resolve(values, '--progress-bar-thumb-background'), '#f7f7f7');
}
assert.doesNotMatch(tokens, /--background-surface-neutral/, 'Use the exact guideline token without a duplicate alias');
const knob = css.match(/(?:^|\n)\.dt3-risk-toggle__knob\s*\{([^}]+)\}/)[1];
assert.match(knob, /background: var\(--progress-bar-thumb-background\);/);
const pressed = css.match(/\.dt3-risk-toggle\[aria-pressed="true"\] \.dt3-risk-toggle__knob\s*\{([^}]+)\}/)[1];
assert.match(pressed, /transform: translateX\(17px\);/);
assert.doesNotMatch(pressed, /background:|background-color:/, 'Both toggle states inherit the same neutral knob fill');
assert.match(css, /\.dt3-risk-toggle\s*\{[^}]*--toggle-active-background: var\(--background-brand-solid\)/);
assert.match(css, /\.dt3-risk-toggle--positive\s*\{[^}]*--toggle-active-background: var\(--system-elements-semantic-positive-primary\)/);
for (const path of [
  'assets/css/components.css',
  'assets/css/pages/analytics-v91.css',
  'assets/css/pages/dispatcher-3d.css',
  'assets/css/pages/operations.css'
]) {
  const source = await read(path);
  const thumbs = [...source.matchAll(/[^{}]*::-(?:webkit-slider|moz-range)-thumb\s*\{([^}]+)\}/g)];
  assert.equal(thumbs.length, 2, `${path}: both browser engines covered`);
  for (const [, body] of thumbs) assert.match(body, /background: var\(--progress-bar-thumb-background\);/);
}
const pages = (await readdir(new URL('../', import.meta.url))).filter(path => path.endsWith('.html')).concat('legacy/report-studio-v5/index.html');
let tokenVersion, componentVersion;
for (const path of pages) {
  const html = await read(path);
  const token = html.match(/tokens\.css\?v=(\d+)/);
  const component = html.match(/components\.css\?v=(\d+)/);
  if (token) {
    tokenVersion ??= token[1];
    assert.equal(token[1], tokenVersion, `${path}: tokens cache version`);
  }
  if (component) {
    componentVersion ??= component[1];
    assert.equal(component[1], componentVersion, `${path}: components cache version`);
  }
}
assert.ok(tokenVersion && componentVersion);
console.log('Control knobs: Background/octonary #F7F7F7 in Light and Dark, both toggle states, unchanged semantic tracks, zoom and range thumbs in both engines, synchronized resource versions.');
