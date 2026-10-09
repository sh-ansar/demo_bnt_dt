import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {readFile, readdir} from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const deployment = JSON.parse(await read('vercel.json'));
const routes = new Map(deployment.rewrites.map(route => [route.source, route.destination]));
const redirects = new Set(deployment.redirects.map(route => route.source));
const context = {window: {}};
vm.runInNewContext(await read('assets/js/navigation.js'), context);
const navigation = context.window.BNTNavigation;

function checkNavigation(items) {
  for (const item of items) {
    if (Array.isArray(item)) assert.ok(routes.has(item[1]), `Missing navigation route: ${item[1]}`);
    else checkNavigation(item.children || []);
  }
}
for (const group of navigation.groups) checkNavigation(group.items);
assert.ok(routes.has('/equipment-detail'), 'Keep the linked equipment passport');
assert.ok(redirects.has('/dispatcher'), 'Keep the old dispatcher URL as a working redirect');
assert.ok(!routes.has('/operations_archiv'));
assert.ok(!navigation.pages['operations-archive']);

let references = 0;
const pages = [...new Set(deployment.rewrites.map(route => route.destination.slice(1)))];
assert.equal(pages.length, 20);
for (const page of pages) {
  const html = await read(page);
  const baseHref = html.match(/<base\s+href=["']([^"']+)/i)?.[1] || `/${page}`;
  const base = new URL(baseHref, 'http://bnt.test');
  for (const [, value] of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    if (/^(?:#|data:|https?:|mailto:|javascript:)/i.test(value) || value.includes('${')) continue;
    const url = new URL(value, base);
    const path = routes.get(url.pathname) || url.pathname;
    if (redirects.has(url.pathname)) continue;
    assert.ok(existsSync(new URL(path.replace(/^\//, ''), root)), `${page}: missing local reference ${value}`);
    references += 1;
  }
  assert.match(html, /tokens\.css\?v=37/);
  assert.match(html, /components\.css\?v=336/);
  assert.match(html, /ui\.js\?v=61/);
  if (html.includes('chart-donut.js')) assert.match(html, /chart-donut\.js\?v=14/);
  assert.match(html, /navigation\.js\?v=12002/);
}

const retired = [
  'app.js', 'styles.css', 'operations_archiv.html',
  'assets/css/shell-v87.css', 'assets/css/pages/analytics-v88.css',
  'assets/css/pages/overview-v86.css', 'assets/css/pages/overview-v90.css',
  'assets/css/pages/dispatcher.css', 'assets/js/pages/dispatcher.js',
  ...[86, 87, 90].flatMap(version => [
    `assets/css/pages/dispatcher-v${version}.css`,
    `assets/js/pages/dispatcher-v${version}.js`
  ]),
  'assets/js/data/operations.js', 'assets/3d/terminal-scene.js'
];
for (const file of retired) assert.ok(!existsSync(new URL(file, root)), `Retired implementation returned: ${file}`);

const ui = await read('assets/js/ui.js');
const components = await read('assets/css/components.css');
assert.doesNotMatch(ui, /\bmodal\(\{title/);
assert.doesNotMatch(components, /\.modal-(?:backdrop|card)\b/);
assert.doesNotMatch(await read('assets/css/shell-v91.css'), /\.modal-(?:backdrop|card)\b/);
assert.match(ui, /renderDrawer\(/);
assert.ok(existsSync(new URL('legacy/report-studio-v5/app.js', root)), 'Keep the live reporting implementation');
assert.ok(existsSync(new URL('assets/3d/terminal-scene-realistic.js', root)), 'Keep the live 3D scene');
assert.ok((await readdir(new URL('tests/', root))).includes('dispatcher-3d.test.mjs'));
console.log(`UI reachability: ${pages.length} active pages, ${references} local references, 17 retired files and shared drawer passed.`);
