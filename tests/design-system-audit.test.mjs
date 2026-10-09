import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const deployment = JSON.parse(await read('vercel.json'));
const pages = [...new Set(deployment.rewrites.map(route => route.destination.slice(1)))];
const resources = new Map();
const versions = new Map();
for (const page of pages) {
  const html = await read(page);
  resources.set(page, html);
  const base = new URL(html.match(/<base\s+href="([^"]+)/)?.[1] || '/' + page, 'http://bnt.test');
  for (const [, source] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (!/\.(?:css|js)(?:\?|$)/.test(source) || /^https?:/.test(source)) continue;
    const url = new URL(source, base);
    const path = url.pathname.slice(1);
    if (!resources.has(path)) resources.set(path, await read(path));
    if (!versions.has(path)) versions.set(path, new Set());
    versions.get(path).add(url.searchParams.get('v'));
  }
}
assert.equal(pages.length, 20);
for (const [path, values] of versions) assert.equal(values.size, 1, path + ': mixed resource versions');

const definitions = new Set();
for (const source of resources.values()) {
  for (const [, name] of source.matchAll(/(--[\w-]+)\s*:/g)) definitions.add(name);
  for (const [, name] of source.matchAll(/setProperty\(['"](--[\w-]+)['"]/g)) definitions.add(name);
}
for (const [path, source] of resources) {
  for (const [, name] of source.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
    assert.ok(definitions.has(name), path + ': undefined custom property without fallback ' + name);
  }
  if (!path.endsWith('.css') || path === 'assets/css/tokens.css' || path.startsWith('legacy/')) continue;
  const colors = [...source.matchAll(/#[\da-f]{3,8}\b|rgba?\([^)]*\)/gi)].map(match => match[0]);
  // Black in alpha masks controls coverage, not a visible chart backing color.
  assert.ok(colors.every(color => path === 'assets/css/components.css' && color === '#000'), path + ': literal UI colors outside tokens ' + colors.join(', '));
}

const enterprise = await read('assets/css/pages/enterprise.css');
assert.doesNotMatch(enterprise, /\.(?:hero-band|module-launcher|launch-card|toir-actions?)\b/);
for (const selector of ['trigger', 'menu']) {
  const body = enterprise.match(new RegExp('\\.toir-form-menu \\.dt3-search-scope-' + selector + '\\s*\\{([^}]+)\\}'))?.[1];
  assert.doesNotMatch(body, /border-radius:/, 'TOiR scope ' + selector + ' inherits the shared radius');
}
assert.doesNotMatch(await read('assets/css/pages/dispatcher-3d.css'), /var\(--color\)/);
assert.doesNotMatch(await read('digital-twin.html'), /(?:fill|stroke)="#[\da-f]+"/i);
assert.match(await read('assets/3d/terminal-scene-realistic.js'), /\['#29AAE1','#FFB228','#55C98C','#A782EF'\]/);
console.log(`Design-system audit: ${pages.length} active pages, ${versions.size} local CSS/JS resources, synchronized versions, no undefined required variables or literal corporate CSS colors. Alpha masks, isolated legacy and physical 3D remain separate contracts.`);
