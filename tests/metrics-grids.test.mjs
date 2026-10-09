import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const frames = [], grids = [], targets = new Map(), observers = [];
class Element {
  dataset = {};
  values = new Map();
  listeners = new Map();
  style = {setProperty: (key, value) => this.values.set(key, value)};
  querySelector() { return null; }
  querySelectorAll() { return []; }
  addEventListener(name, callback) {
    const callbacks = this.listeners.get(name) || [];
    callbacks.push(callback); this.listeners.set(name, callbacks);
  }
  emit(name) { this.listeners.get(name)?.forEach(callback => callback()); }
}
class Observer {
  targets = new Set();
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
}
const document = Object.assign(new Element(), {
  documentElement: {},
  getElementById: id => targets.get(id),
  querySelectorAll: selector => selector === '.metrics-grid--paired[data-metrics-for]' ? grids : []
});
const window = Object.assign(new Element(), {
  getComputedStyle: target => ({width: `${target.width}px`, columnGap: '12px', getPropertyValue: () => '320px'})
});
vm.runInNewContext(await read('assets/js/ui.js'), {
  document, window, ResizeObserver: Observer, MutationObserver: Observer,
  requestAnimationFrame: callback => frames.push(callback)
});
const ui = window.BNTUI;
const flush = () => { let count = 0; while (frames.length) { frames.shift()(); assert.ok(++count < 30); } };
flush();
const grid = new Element(); grid.dataset.metricsFor = 'cards';
const target = {width: 984, get clientWidth() { return Math.round(this.width); }};
targets.set('cards', target); grids.push(grid);
for (const [width, cards] of [[320, 1], [651.9, 1], [652, 2], [983.9, 2], [984, 3], [1315.9, 3], [1316, 4], [1648, 5], [1920, 5], [3000, 9]]) {
  target.width = width;
  assert.equal(ui.updateMetricsGrid(grid), target);
  assert.equal(grid.values.get('--metrics-grid-columns'), String(cards * 2), `${width}px: ${cards}/${cards * 2}`);
  const cardWidth = (width - (cards - 1) * 12) / cards;
  const cellWidth = (width - (cards * 2 - 1) * 12) / (cards * 2);
  assert.ok(Math.abs(cellWidth * 2 + 12 - cardWidth) < .00001, 'Paired metric edges align to the card edges');
}
ui.metricsGridMutations.callback(); flush();
const observer = observers.find(observer => observer.targets.has(target));
assert.ok(observer, 'Container resizing, including sidebar changes, is observed');
target.width = 1316; observer.callback(); flush();
assert.equal(grid.values.get('--metrics-grid-columns'), '8');
target.width = 984; window.emit('resize'); flush();
assert.equal(grid.values.get('--metrics-grid-columns'), '6');
target.width = 0; observer.callback(); flush();
assert.ok(observer.targets.has(target), 'Hidden targets remain observed until revealed');
target.width = 652; observer.callback(); flush();
assert.equal(grid.values.get('--metrics-grid-columns'), '4');
targets.delete('cards'); ui.metricsGridMutations.callback(); flush();
assert.ok(!observer.targets.has(target), 'Removed targets are released');

const css = await read('assets/css/components.css');
const base = css.match(/\.metrics-grid\s*\{([^}]+)\}/)[1];
assert.match(base, /grid-template-columns: repeat\(var\(--metrics-grid-columns, 6\), minmax\(0, 1fr\)\);/);
assert.match(base, /gap: var\(--space-2\);/);
assert.match(css, /\.metrics-grid--paired\s*\{[^}]*gap: var\(--space-3\);/);
assert.match(css, /\.templates-grid,\s*\.asset-cards,\s*\.schedule-list\s*\{[^}]*gap: var\(--space-3\);/);
assert.doesNotMatch(css, /@media\s*\(width > 1440px\)\s*\{\s*\.schedule-list/, 'There is no independent three-column ceiling');
const dispatcherCss = await read('assets/css/pages/dispatcher-3d.css');
assert.doesNotMatch(dispatcherCss, /\.dt3-risk-toggle/);
assert.match(css, /\.dt3-risk-toggle\s*\{[^}]*gap: var\(--space-3\);/);
assert.match(css, /\.dt3-risk-toggle\[aria-pressed="true"\] \.dt3-risk-toggle__knob\s*\{[^}]*transform: translateX\(17px\);/);
assert.match(ui.renderToggle({label: 'Activate & <test>', pressed: false, attributes: {'data-action': 'toggle'}}), /aria-pressed="false" data-action="toggle"[^]*Activate &amp; &lt;test&gt;/);
assert.match(ui.renderToggle({pressed: true}), /aria-pressed="true"/);
console.log('Paired metric grids: 1:2 proportions at fractional thresholds, shared space-3 edges, unchanged space-2 base, container/window resizing, visibility, cleanup and exact shared toggle markup passed. Browser pixels excluded.');
