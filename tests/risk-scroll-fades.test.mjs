import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const frames = [], columns = [], observers = [];
class Element {
  children = [];
  classes = new Set();
  listeners = new Map();
  scrollHeight = 0;
  clientHeight = 0;
  scrollTop = 0;
  classList = {toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name)};
  addEventListener(name, callback, capture) {
    const list = this.listeners.get(name) || [];
    list.push({callback, capture}); this.listeners.set(name, list);
  }
  emit(name, target = this) { this.listeners.get(name)?.forEach(({callback}) => callback({target})); }
  querySelector(selector) { return selector === '.payment-risk-map__scroller' ? this.scroller || null : null; }
  querySelectorAll() { return []; }
  matches(selector) { return selector === '.payment-risk-map__scroller' && !!this.column; }
  closest(selector) { return selector === '.payment-risk-map__risk-column' ? this.column || null : null; }
}
class Observer {
  targets = new Set();
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
}
let finishFonts;
const fonts = Object.assign(new Element(), {ready: new Promise(resolve => { finishFonts = resolve; })});
const document = Object.assign(new Element(), {
  readyState: 'loading', documentElement: {}, fonts,
  querySelectorAll: selector => selector === '.payment-risk-map__risk-column' ? columns : []
});
const window = new Element();
vm.runInNewContext(await read('assets/js/ui.js'), {window, document, ResizeObserver: Observer, MutationObserver: Observer, requestAnimationFrame: callback => frames.push(callback)});
const ui = window.BNTUI;
const flush = () => { let count = 0; while (frames.length) { frames.shift()(); assert.ok(++count < 20); } };
const column = new Element(), scroller = new Element(), row = new Element();
column.scroller = scroller; scroller.column = column; scroller.children = [row];
assert.equal(ui.updateRiskScrollFades(new Element()), null);
assert.equal(ui.updateRiskScrollFades(column), scroller);
assert.equal(column.classes.size, 0, 'A short list has no fade');
scroller.clientHeight = 200; scroller.scrollHeight = 500;
ui.updateRiskScrollFades(column);
assert.deepEqual([...column.classes], ['has-fade-bottom']);
scroller.scrollTop = 140; ui.updateRiskScrollFades(column);
assert.ok(column.classes.has('has-fade-top') && column.classes.has('has-fade-bottom'));
scroller.scrollTop = 300; ui.updateRiskScrollFades(column);
assert.deepEqual([...column.classes], ['has-fade-top']);
scroller.scrollTop = 1; ui.updateRiskScrollFades(column);
assert.ok(!column.classes.has('has-fade-top'), 'A fractional edge uses the master one-pixel tolerance');
columns.push(column);
ui.bindRiskScrollFades(); flush();
const resize = observers.find(observer => observer.targets.has(column));
assert.ok(resize.targets.has(scroller) && resize.targets.has(row), 'Both viewport size and content wrapping update the fade');
assert.equal(document.listeners.get('scroll')[0].capture, true, 'Nested non-bubbling scroll events are handled by the shared binding');
scroller.scrollTop = 300; document.emit('scroll', scroller);
assert.deepEqual([...column.classes], ['has-fade-top']);
scroller.scrollTop = 0; scroller.clientHeight = 500; resize.callback(); flush();
assert.equal(column.classes.size, 0, 'Expansion removes both fades');
scroller.clientHeight = 200; resize.callback(); resize.callback();
assert.equal(frames.length, 1, 'Resize work is batched'); flush();
assert.deepEqual([...column.classes], ['has-fade-bottom']);
scroller.clientHeight = 500; window.emit('resize'); flush();
assert.equal(column.classes.size, 0, 'Window resize also updates the shared mask');
finishFonts(); await Promise.resolve(); flush();
assert.equal(column.classes.size, 0);
scroller.clientHeight = 200; fonts.emit('loadingdone'); flush();
assert.deepEqual([...column.classes], ['has-fade-bottom']);
const next = new Element(); scroller.children = [next]; ui.riskScrollMutations.callback(); flush();
assert.ok(!resize.targets.has(row) && resize.targets.has(next), 'Replaced rows release stale observations');
const bindings = document.listeners.get('scroll').length;
ui.bindRiskScrollFades(); assert.equal(document.listeners.get('scroll').length, bindings, 'Binding is idempotent');
columns.length = 0; ui.riskScrollMutations.callback(); flush();
assert.equal(resize.targets.size, 0, 'Removed columns release all observations');

const css = await read('assets/css/components.css');
assert.match(css, /\.payment-risk-map__risk-column\.has-fade-top\s*\{\s*--payment-risk-scroll-fade-top: transparent;/);
assert.match(css, /\.payment-risk-map__risk-column\.has-fade-bottom\s*\{\s*--payment-risk-scroll-fade-bottom: transparent;/);
const viewport = css.match(/\.payment-risk-map__scroller\s*\{([^}]+)\}/)[1];
assert.match(viewport, /position: absolute;\s*inset: 0;/);
assert.match(viewport, /-webkit-mask-image: linear-gradient\(/);
assert.match(viewport, /\n\s*mask-image: linear-gradient\(/);
assert.doesNotMatch(viewport, /background:|#fff|rgba\(255/, 'An alpha mask reveals the actual themed surface without a light overlay');
assert.match(css, /\.payment-risk-map__scroller\.logistics-alert-list\s*\{\s*padding: 0;/);
for (const page of ['budget-payments', 'procurement']) assert.doesNotMatch(await read(`assets/js/pages/${page}.js`), /updateRiskScrollFades|has-fade-top|has-fade-bottom/, `${page}: no local duplicate of the shared behavior`);
console.log('Risk scroll fades: shared alpha mask, fixed heading and card padding, top/middle/bottom, resize/fonts, nested scroll, batching, insertion/removal, idempotence and cleanup passed. Browser rendering excluded.');
