import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const frames = [], wraps = [], groups = [], observers = [], mutations = [], fontReady = [];

class Element {
  dataset = {};
  visible = true;
  height = 0;
  offsetHeight = 108;
  clientHeight = 108;
  properties = new Map();
  listeners = new Map();
  writes = 0;
  style = {
    getPropertyValue: key => this.properties.get(key) || '',
    setProperty: (key, value) => { this.properties.set(key, value); this.writes++; },
    removeProperty: key => { this.properties.delete(key); this.writes++; }
  };
  addEventListener(name, callback) {
    const callbacks = this.listeners.get(name) || [];
    callbacks.push(callback); this.listeners.set(name, callbacks);
  }
  emit(name) { this.listeners.get(name)?.forEach(callback => callback()); }
  getBoundingClientRect() { return {top: 0, height: this.height, bottom: this.height}; }
  getClientRects() { return this.visible ? [this.getBoundingClientRect()] : []; }
  querySelector(selector) { return selector === ':scope > table' ? this.table || null : null; }
  querySelectorAll(selector) { return selector === '.table-wrap' ? this.wraps || [] : []; }
  closest(selector) {
    if (selector === '[data-table-height-group]') return this.group || null;
    if (selector === '.table-block') return this.block || null;
    return null;
  }
}
class ResizeObserver {
  targets = new Set();
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
}
class MutationObserver {
  constructor(callback) { this.callback = callback; mutations.push(this); }
  observe(root, options) { this.options = options; }
}
const document = Object.assign(new Element(), {readyState: 'loading', documentElement: new Element()});
document.querySelectorAll = selector => selector === '.table-wrap' ? wraps : selector === '[data-table-height-group="smallest"]' ? groups : [];
document.fonts = Object.assign(new Element(), {ready: {then(callback) { fontReady.push(callback); }}});
const window = Object.assign(new Element(), {innerHeight: 900, scrollY: 0, visualViewport: new Element()});
window.visualViewport.height = 900;
window.getComputedStyle = element => ({
  borderBottomWidth: '1px',
  getPropertyValue: key => element.properties.get(key) || ({'--table-height-group-min-height': '108px', '--table-wrap-readable-rows': '6', '--table-wrap-bottom-space': '24px'}[key] || '')
});
vm.runInNewContext(await read('assets/js/ui.js'), {window, document, ResizeObserver, MutationObserver, requestAnimationFrame: callback => frames.push(callback)});
const ui = window.BNTUI;
const flush = () => { let count = 0; while (frames.length) { assert.ok(++count < 30); frames.shift()(); } };
function groupWithHeights(heights) {
  const group = new Element(); group.dataset.tableHeightGroup = 'smallest';
  group.wraps = heights.map(height => {
    const wrap = new Element(); wrap.group = group;
    wrap.table = Object.assign(new Element(), {height, tBodies: []});
    wrap.block = wrap.parentElement = new Element();
    wraps.push(wrap); return wrap;
  });
  groups.push(group); return group;
}
const height = group => parseFloat(group.style.getPropertyValue('--table-height-group-height'));
const group = groupWithHeights([210, 160]);
ui.bindTableViewports(); flush();
assert.equal(height(group), 160, 'The shorter table defines the shared viewport height');
assert.ok(group.wraps[0].table.height > height(group), 'The longer table overflows');
assert.ok(group.wraps[1].table.height <= height(group), 'The shorter table does not overflow');
assert.ok(observers[0].targets.has(group));
assert.ok(observers[0].targets.has(group.wraps[0].table));
const writes = group.writes;
observers[0].callback(); flush();
assert.equal(group.writes, writes, 'Unchanged measurements do not rewrite group styles');

for (const [a, b, expected] of [[210, 80, 108], [70, 80, 108], [252.75, 162.5, 163], [350, 190, 190], [144, 300, 144]]) {
  group.wraps[0].table.height = a; group.wraps[1].table.height = b;
  window.emit('resize'); flush();
  assert.equal(height(group), expected);
  assert.ok(Math.min(a, b) <= height(group), 'The shorter table stays visible without vertical overflow');
}
group.wraps[0].table.height = 250; group.wraps[1].table.height = 160;
group.wraps[1].offsetHeight = 112;
window.visualViewport.emit('resize'); flush();
assert.equal(height(group), 164, 'Horizontal scrollbar height is included');
group.wraps[1].offsetHeight = 108;
group.wraps[1].table.height = 120;
document.fonts.emit('loadingdone'); flush();
assert.equal(height(group), 120, 'Loaded fonts and text wrapping recalculate natural table height');
group.wraps[1].table.height = 130;
fontReady.forEach(callback => callback()); flush();
assert.equal(height(group), 130);
group.wraps[1].table.height = 145;
mutations[0].callback(); flush();
assert.equal(height(group), 145, 'Content mutations recalculate the group');
assert.equal(mutations[0].options.characterData, true);
assert.ok(mutations[0].options.attributeFilter.includes('data-table-height-group'));
assert.ok(!mutations[0].options.attributeFilter.includes('style'));

group.wraps[1].visible = false; mutations[0].callback(); flush();
assert.equal(height(group), 250, 'Hidden tables are excluded');
group.wraps[1].visible = true;
const nested = groupWithHeights([40]);
group.wraps.push(nested.wraps[0]);
ui.updateTableHeightGroup(group);
assert.equal(height(group), 145, 'Nested groups do not change the outer minimum');
group.wraps.pop();
group.wraps.forEach(wrap => { wrap.visible = false; });
ui.updateTableHeightGroup(group);
assert.equal(group.style.getPropertyValue('--table-height-group-height'), '', 'An empty group clears stale measurements');
group.wraps.forEach(wrap => { wrap.visible = true; });
ui.updateTableHeightGroup(group);
assert.equal(height(group), 145);
groups.splice(0); wraps.splice(0); mutations[0].callback(); flush();
assert.ok(!observers[0].targets.has(group), 'Removed groups release their observers');

const css = await read('assets/css/components.css');
const rule = css.match(/\[data-table-height-group="smallest"\] \.table-wrap\s*\{([^}]+)\}/)[1];
assert.match(rule, /height: var\(--table-height-group-height, var\(--table-height-group-min-height\)\)/);
assert.match(rule, /max-height: var\(--table-height-group-height, var\(--table-height-group-min-height\)\)/);
assert.match(css, /\.table-wrap\s*\{[^}]*overflow: auto;/);
assert.match(await read('assets/css/tokens.css'), /--table-height-group-min-height: 108px;/);
console.log('Table height groups: shorter natural table, 108px floor, fractional rows, horizontal scrollbar, resize, fonts, content, hidden/nested groups, idempotence and observer cleanup. Browser pixels excluded.');
