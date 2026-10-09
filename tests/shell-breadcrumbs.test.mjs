import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('assets/js/shell.js');
const start = source.indexOf('  function setBreadcrumbs(');
const end = source.indexOf('  const main = document.createElement("div");', start);
assert.ok(start > 0 && end > start);

const breadcrumbs = {
  markup: '', links: [],
  set innerHTML(markup) {
    this.markup = markup;
    this.links = [...markup.matchAll(/data-shell-breadcrumb="(\d+)"/g)].map(match => ({
      dataset: {shellBreadcrumb: match[1]},
      addEventListener(type, handler) { assert.equal(type, 'click'); this.click = handler; }
    }));
  },
  querySelectorAll(selector) { assert.equal(selector, '[data-shell-breadcrumb]'); return this.links; }
};
const window = {
  BNTShell: {existing: true},
  BNTUI: {escape: value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[char]))}
};
const enterprise = {label: 'Предприятие', defaultPage: 'dispatcher', defaultHref: '/digital-twin'};
const management = {label: 'Управление', defaultPage: 'reports', defaultHref: '/reports'};
const activeGroup = {...management};
vm.runInNewContext(source.slice(start, end), {
  window,
  activeGroup, nav: {groups: [enterprise, management], pages: {dispatcher: ['Цифровой двойник']}},
  contextbar: {querySelector: selector => { assert.equal(selector, '.shell-breadcrumbs'); return breadcrumbs; }},
  currentItem: ['builder', '/builder', 'Конструктор'], meta: ['Fallback'],
  routeHref: href => href === '/' ? href : `${href}.html`,
  icon: () => '<svg data-home></svg>', shellIcon: () => '<svg data-separator></svg>'
});
assert.equal(window.BNTShell.existing, true);
const initial = breadcrumbs.markup;
assert.match(initial, /class="context-home" href="\/digital-twin\.html" aria-label="Цифровой двойник"/);
assert.match(initial, /<a href="\/reports\.html">Управление<\/a>/);
assert.doesNotMatch(initial, /Главная|href="\/"/);
assert.match(initial, /<span aria-current="page">Конструктор<\/span>/);
assert.equal((initial.match(/aria-current="page"/g) || []).length, 1);

let returned = 0, prevented = 0;
window.BNTShell.setBreadcrumbs([{label: 'Конструктор', href: '/builder', onClick: () => returned++}, {label: 'Предпросмотр'}]);
assert.match(breadcrumbs.markup, /href="\/builder\.html" data-shell-breadcrumb="1">Конструктор<\/a>/);
assert.match(breadcrumbs.markup, /<span aria-current="page">Предпросмотр<\/span>/);
assert.equal((breadcrumbs.markup.match(/class="breadcrumb-segment"/g) || []).length, 3);
assert.equal((breadcrumbs.markup.match(/aria-current="page"/g) || []).length, 1);
const click = {button: 0, preventDefault() { prevented++; }};
breadcrumbs.links[0].click(click);
assert.equal(returned, 1);
assert.equal(prevented, 1);
for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) breadcrumbs.links[0].click({...click, [modifier]: true});
breadcrumbs.links[0].click({...click, button: 1});
assert.equal(returned, 1, 'Modified clicks retain native link behavior');
assert.equal(prevented, 1);
window.BNTShell.setBreadcrumbs();
assert.equal(breadcrumbs.markup, initial, 'Reset restores the original section and removes stale callbacks');
assert.equal(breadcrumbs.links.length, 0);
window.BNTShell.setBreadcrumbs([{label: '<Constructor & "test">', href: '/builder?name="test"'}, {label: '<Preview>'}]);
assert.match(breadcrumbs.markup, /&lt;Constructor &amp; &quot;test&quot;&gt;/);
assert.match(breadcrumbs.markup, /&lt;Preview&gt;/);
assert.doesNotMatch(breadcrumbs.markup, /<Preview>|<Constructor/);
Object.assign(activeGroup, enterprise);
window.BNTShell.setBreadcrumbs([{label: 'Активы'}]);
assert.match(breadcrumbs.markup, /<a href="\/digital-twin\.html">Предприятие<\/a>/);
assert.match(breadcrumbs.markup, /class="context-home" href="\/digital-twin\.html"/);
assert.match(breadcrumbs.markup, /<span aria-current="page">Активы<\/span>/);
Object.assign(activeGroup, management);
window.BNTShell.setBreadcrumbs();
assert.equal(breadcrumbs.markup, initial, 'The section follows the active navigation group, including reset and previews');

let version;
for (const page of (await readdir(new URL('../', import.meta.url))).filter(name => name.endsWith('.html'))) {
  const html = await read(page);
  const match = html.match(/shell\.js\?v=(\d+)/);
  if (!match) continue;
  version ??= match[1];
  assert.equal(match[1], version, `${page}: shared shell version`);
}
assert.ok(version);
const shellCss = await read('assets/css/shell-v91.css');
const hiddenContextbar = shellCss.match(/\.app-main > \.app-contextbar\.is-hidden\s*\{([^}]*)\}/)[1];
assert.match(hiddenContextbar, /transform: translateY\(-100%\) !important;/, 'Hidden breadcrumbs leave no gutter-sized strip below the topbar');
assert.match(hiddenContextbar, /opacity: 0 !important;/, 'The hidden breadcrumb surface cannot overlay the scrolled heading');
assert.match(hiddenContextbar, /pointer-events: none !important;/);
console.log('Shell breadcrumbs: section-aware root, enterprise twin home, in-place callbacks, native modified clicks, current-page ARIA, escaping, reset and shared cache versions passed.');
