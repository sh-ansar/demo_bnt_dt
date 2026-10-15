import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const tokens = await read('assets/css/tokens.css');
const shellCss = await read('assets/css/shell-v91.css');
const components = await read('assets/css/components.css');
const shellJs = await read('assets/js/shell.js');

assert.match(tokens, /--ui-scale-unit:\s*1vw/);
assert.match(tokens, /@media \(width > 1440px\)[\s\S]*?:root\[data-ui-scale="fixed"\]\s*\{\s*--ui-scale-unit:\s*14\.4px/);
for (const path of ['assets/css/tokens.css', 'assets/css/shell-v91.css', 'assets/css/components.css', 'assets/css/pages/dispatcher-3d.css', 'assets/css/layout.css']) {
  const css = await read(path);
  assert.doesNotMatch(css, /clamp\([^)]*\b\d*\.?\d+vw\s*,/, `${path}: scalable clamps use the shared unit`);
}
assert.match(tokens, /--typography-label-base-size:\s*clamp\(16px, calc\(1\.111111 \* var\(--ui-scale-unit\)\), 21\.333333px\)/);
assert.match(shellCss, /--sidebar:\s*clamp\(264px, calc\(18\.333333 \* var\(--ui-scale-unit\)\), 352px\)/);
assert.match(shellCss, /\.sidebar-scale-control\s*\{\s*display:\s*none/);
assert.match(shellCss, /@media \(width > 1440px\)[\s\S]*?body:not\(\.shell-sidebar-collapsed\) \.app-sidebar \.sidebar-scale-control\s*\{\s*display:\s*block/);
assert.match(shellCss, /\.sidebar-scale-control \.dt3-risk-toggle__label\s*\{[^}]*color:\s*var\(--text-tertiary\)/);
for (const [property, token] of [
  ['font-family', '--font-family-primary'],
  ['font-size', '--typography-body-smallest-size'],
  ['line-height', '--typography-body-smallest-line-height'],
  ['font-weight', '--typography-body-smallest-weight'],
  ['letter-spacing', '--typography-body-smallest-letter-spacing'],
]) {
  assert.match(shellCss, new RegExp(`\\.sidebar-scale-control \\.dt3-risk-toggle__label\\s*\\{[^}]*${property}:\\s*var\\(${token}\\)`));
}
assert.match(shellJs, /Данные обновляются[\s\S]*?sidebar-scale-control[\s\S]*?renderToggle\(/);
assert.match(shellJs, /document\.documentElement\.dataset\.uiScale = scaleEnabled \? "fluid" : "fixed"/);
assert.match(shellJs, /window\.localStorage\.setItem\(scaleKey, scaleEnabled \? "on" : "off"\)/);
assert.match(components, /:root\[data-ui-scale="fixed"\] :is\(table/);

const pages = (await readdir(new URL('..', import.meta.url))).filter(name => name.endsWith('.html'));
pages.push('legacy/report-studio-v5/index.html');
for (const page of pages) {
  const html = await read(page);
  for (const [asset, version] of [
    ['tokens.css', '38'], ['layout.css', '4'], ['components.css', '349'],
    ['shell-v91.css', '9143'], ['shell.js', '9126'], ['dispatcher-3d.css', '10052'],
  ]) {
    if (html.includes(`${asset}?v=`)) assert.ok(html.includes(`${asset}?v=${version}`), `${page}: ${asset} cache version`);
  }
}

console.log('Shell scaling: shared control, XL-only visibility, typography and geometry, saved choice, and cache versions passed.');
