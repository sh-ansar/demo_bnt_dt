import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const property = '--card-with-image-body-min-height';
const frames = [], groups = [], resizeObservers = [], fontsReady = [];

class Target {
  listeners = new Map();
  addEventListener(name, callback) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(callback); this.listeners.set(name, listeners);
  }
  emit(name, event = {}) { for (const callback of this.listeners.get(name) || []) callback(event); }
  querySelectorAll() { return []; }
}
class Group extends Target {
  visible = true;
  cards = [];
  values = new Map();
  style = {
    setProperty: (name, value) => this.values.set(name, value),
    removeProperty: name => this.values.delete(name),
    getPropertyValue: name => this.values.get(name) || ''
  };
  getClientRects() { return this.visible ? [{}] : []; }
  querySelectorAll(selector) {
    if (selector === ':scope > .card-with-image') return this.cards;
    if (selector === ':scope > .card-with-image > .card-with-image__body') return this.cards.map(card => card.body);
    return [];
  }
}
function card(group, height) {
  const body = {
    height, visible: true,
    getClientRects() { return this.visible && group.visible ? [this.getBoundingClientRect()] : []; },
    getBoundingClientRect() { return {height: Math.max(this.height, parseFloat(group.values.get(property)) || 0)}; }
  };
  const item = {parentElement: group, body, querySelector: selector => selector === ':scope > .card-with-image__body' ? body : null};
  group.cards.push(item);
  return item;
}
class ResizeObserver {
  targets = new Set();
  constructor(callback) { this.callback = callback; resizeObservers.push(this); }
  observe(element) { this.targets.add(element); }
  unobserve(element) { this.targets.delete(element); }
}
class MutationObserver {
  constructor(callback) { this.callback = callback; }
  observe(root, options) { this.root = root; this.options = options; }
}
const document = Object.assign(new Target(), {readyState: 'loading', documentElement: {}});
document.querySelectorAll = selector => selector === '.card-with-image' ? groups.flatMap(group => group.cards) : [];
document.fonts = Object.assign(new Target(), {ready: {then(callback) { fontsReady.push(callback); }}});
const window = Object.assign(new Target(), {visualViewport: new Target()});
vm.runInNewContext(await read('assets/js/ui.js'), {
  window, document, ResizeObserver, MutationObserver, console,
  requestAnimationFrame: callback => { frames.push(callback); return frames.length; }
});
const ui = window.BNTUI;
function flush() {
  let iterations = 0;
  while (frames.length) {
    assert.ok(++iterations < 30, 'Card updates converge');
    frames.shift()();
  }
}

assert.equal(ui.imageCardsBound, undefined);
document.emit('DOMContentLoaded'); flush();
assert.equal(ui.imageCardsBound, true, 'The shared binding starts automatically');
assert.ok(!resizeObservers.some(observer => observer.targets.size === 0), 'No empty card resize observer is created');
const mutations = ui.imageCardMutations;
assert.equal(mutations.root, document.documentElement);
assert.equal(mutations.options.characterData, true);
assert.ok(!mutations.options.attributeFilter.includes('style'), 'Height writes do not retrigger the mutation binding');

const templates = new Group(), equipment = new Group();
groups.push(templates, equipment);
const short = card(templates, 160.25), tall = card(templates, 224.375), nextRow = card(templates, 180);
card(equipment, 100); card(equipment, 120);
mutations.callback(); mutations.callback();
assert.equal(frames.length, 1, 'Multiple content mutations are batched'); flush();
assert.equal(templates.values.get(property), '224.375px');
assert.equal(equipment.values.get(property), '120.000px', 'Separate card grids have independent heights');
assert.equal(short.body.getBoundingClientRect().height, tall.body.getBoundingClientRect().height);
assert.equal(nextRow.body.getBoundingClientRect().height, tall.body.getBoundingClientRect().height, 'Later rows share the same body level');
const observer = resizeObservers.find(item => item.targets.has(templates));
assert.ok(observer.targets.has(tall.body));
const count = resizeObservers.length, resizeListeners = window.listeners.get('resize').length;
ui.bindImageCards();
assert.equal(resizeObservers.length, count);
assert.equal(window.listeners.get('resize').length, resizeListeners, 'The binding is idempotent');

tall.body.height = 300.5; observer.callback(); flush();
assert.equal(templates.values.get(property), '300.500px', 'Growing content raises the shared body height');
tall.body.height = 140; nextRow.body.height = 120; short.body.height = 100;
window.emit('resize'); flush();
assert.equal(templates.values.get(property), '140.000px', 'Removing the old constraint lets card groups shrink');
tall.body.visible = false; mutations.callback(); flush();
assert.equal(templates.values.get(property), '120.000px', 'Hidden cards do not inflate the group');
tall.body.visible = true; mutations.callback(); flush();
assert.equal(templates.values.get(property), '140.000px');
templates.visible = false; tall.body.height = 230;
mutations.callback(); flush();
assert.equal(templates.values.get(property), '140.000px', 'Hidden groups retain their previous measurement');
templates.visible = true; mutations.callback(); flush();
assert.equal(templates.values.get(property), '230.000px', 'Opening a group measures its current content');
tall.body.height = 210; fontsReady.forEach(callback => callback()); flush();
assert.equal(templates.values.get(property), '210.000px');
tall.body.height = 220; document.fonts.emit('loadingdone'); flush();
assert.equal(templates.values.get(property), '220.000px', 'Later font loading also recomputes wrapping');
tall.body.height = 240;
document.emit('load', {target: {closest: () => tall}}); flush();
assert.equal(templates.values.get(property), '240.000px', 'Media loading remeasures its card group');

for (const theme of ['light', 'dark']) {
  document.documentElement.dataset = {theme};
  for (const width of [390, 768, 1200, 1439, 1440, 1441, 1920, 2560]) {
    window.innerWidth = width;
    const lineHeight = width > 1440 ? 21.333333 : 16;
    short.body.height = 80 + lineHeight;
    tall.body.height = 80 + lineHeight * 3;
    window.visualViewport.emit('resize'); flush();
    assert.equal(templates.values.get(property), `${tall.body.height.toFixed(3)}px`, `${theme}, ${width}px: the tallest current body wins`);
  }
}
templates.cards.splice(templates.cards.indexOf(tall), 1); mutations.callback(); flush();
assert.ok(!observer.targets.has(tall.body), 'Removed cards release their resize observation');
groups.splice(groups.indexOf(templates), 1); mutations.callback(); flush();
assert.ok(!observer.targets.has(templates));
assert.ok(!observer.targets.has(short.body));
assert.ok(observer.targets.has(equipment), 'Unrelated card groups remain observed');
equipment.cards = []; mutations.callback(); flush();
assert.ok(!observer.targets.has(equipment), 'Empty groups are released');
assert.equal(ui.updateImageCardBodies(equipment), 0);
assert.equal(equipment.values.has(property), false, 'Empty groups clear their stale height');

const css = await read('assets/css/components.css'), tokens = await read('assets/css/tokens.css');
assert.match(tokens, /--card-with-image-min-height: 340px;/);
assert.match(tokens, /--card-with-image-min-width: 320px;/);
const grid = css.match(/\.templates-grid,\s*\.asset-cards,\s*\.schedule-list\s*\{[^}]*\}/)[0];
assert.match(grid, /grid-template-columns: repeat\(auto-fill, minmax\(var\(--card-with-image-min-width\), 1fr\)\);/);
for (const [width, expected] of [[320, 1], [651, 1], [652, 2], [983, 2], [984, 3], [1315, 3], [1316, 4], [1440, 4], [1648, 5], [1920, 5], [3000, 9], [4000, 12]]) {
  const minimum = 320;
  const columns = Math.floor((width + 12) / (minimum + 12));
  assert.equal(columns, expected, `${width}px: uncapped columns, 320px minimum`);
}
const shell = await read('assets/css/shell-v91.css');
const page = shell.match(/^#page-content\s*\{[^}]*\}/m)[0];
assert.match(page, /max-width: none !important;/, 'The legacy 1760px cap must not leave space on wide screens');
assert.match(page, /padding: 0 var\(--shell-gutter\) var\(--shell-gutter\) !important;/, 'Shared page gutters are preserved');
assert.match(grid, /grid-auto-rows: 1fr;/);
assert.match(grid, /gap: var\(--space-3\);/);
const base = css.match(/\.card-with-image\s*\{[^}]*\}/)[0];
assert.match(base, /min-width: var\(--card-with-image-min-width\);/);
assert.match(base, /min-height: var\(--card-with-image-min-height\);/);
assert.match(base, /height: auto;/);
assert.match(base, /flex-direction: column;/);
const body = css.match(/\.card-with-image__body\s*\{[^}]*\}/)[0];
assert.match(body, /min-height: var\(--card-with-image-body-min-height, 0px\);/);
assert.match(body, /flex: none;/);
assert.match(body, /margin-top: auto;/);
assert.match(body, /border-radius: var\(--space-3\) var\(--space-3\) 0 0;/);
assert.match(css, /\.card-with-image__body > :is\(\.card-with-image__actions, \.card-with-image__progress\)\s*\{\s*margin-top: auto;/);
for (const [name, lines] of [['eyebrow', 2], ['title', 3], ['description', 3]]) {
  const rule = css.match(new RegExp(`\\.card-with-image__${name}\\s*\\{[^}]*\\}`))[0];
  assert.ok(rule.includes(`-webkit-line-clamp: ${lines};`));
  assert.match(rule, /display: -webkit-box;/);
  assert.match(rule, /overflow: hidden;/);
  assert.match(rule, /-webkit-box-orient: vertical;/);
}
const media = css.match(/\.card-with-image--template \.card-with-image__media\s*\{[^}]*\}/)[0];
assert.match(media, /flex: 1 0 auto;/);
assert.match(media, /padding-bottom: var\(--space-3\);/);
assert.match(media, /margin-bottom: calc\(-1 \* var\(--space-3\)\);/);
assert.match(css, /\.template-mock\s*\{[^}]*gap: var\(--space-1\);/);
assert.match(css, /\.template-meta\s*\{[^}]*margin: 0 0 var\(--space-2\);/);
assert.match(css, /\.card-with-image > \.badge,\s*\.card-with-image__visual > \.badge\s*\{[^}]*top: var\(--space-3\);/);
assert.match(css, /\.card-with-image__preview\s*\{\s*padding: calc\(var\(--space-3\) \* 2 \+ var\(--pill-badge-height, var\(--space-5\)\)\)/);
for (const badgeHeight of [24, 28]) assert.equal(12 * 2 + badgeHeight - (12 + badgeHeight), 12, 'Badge-to-preview gap stays space-3 at either breakpoint');
assert.doesNotMatch(await read('assets/css/pages/report-studio.css'), /\.templates-grid\s*\{/);
assert.doesNotMatch(await read('assets/css/pages/enterprise.css'), /\.asset-cards\b/, 'Equipment has no local grid override');
console.log('Shared image-card sizes, text limits, spacing and body alignment passed.');
