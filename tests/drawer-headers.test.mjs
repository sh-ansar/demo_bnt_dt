import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const frames = [], headers = [], resizeObservers = [], fontsReady = [];

class Element {
  listeners = new Map();
  classes = new Set();
  visible = true;
  height = 20;
  lineHeight = '20px';
  writes = 0;
  classList = {
    contains: name => this.classes.has(name),
    toggle: (name, on) => { this.writes++; if (on) this.classes.add(name); else this.classes.delete(name); }
  };
  addEventListener(name, callback) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(callback); this.listeners.set(name, listeners);
  }
  emit(name) { for (const callback of this.listeners.get(name) || []) callback(); }
  querySelector(selector) { return selector === '.filter-modal__title' ? this.title || null : null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return {height: this.height}; }
  getClientRects() { return this.visible ? [this.getBoundingClientRect()] : []; }
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
const document = Object.assign(new Element(), {readyState: 'loading', documentElement: new Element()});
document.querySelectorAll = selector => selector === '.filter-modal__head' ? headers : [];
document.fonts = Object.assign(new Element(), {ready: {then(callback) { fontsReady.push(callback); }}});
const window = Object.assign(new Element(), {
  visualViewport: new Element(),
  getComputedStyle: title => ({lineHeight: title.lineHeight})
});
vm.runInNewContext(await read('assets/js/ui.js'), {
  window, document, ResizeObserver, MutationObserver, console,
  requestAnimationFrame: callback => { frames.push(callback); return frames.length; }
});
const ui = window.BNTUI;
function flush() {
  let iterations = 0;
  while (frames.length) {
    assert.ok(++iterations < 20, 'Header updates converge');
    frames.shift()();
  }
}
function header(height, lineHeight = '20px') {
  const head = new Element();
  head.title = Object.assign(new Element(), {height, lineHeight});
  headers.push(head);
  return head;
}
const multiline = head => head.classList.contains('is-title-long');
assert.equal(ui.drawerHeadersBound, undefined, 'Binding waits for the DOM');
document.emit('DOMContentLoaded'); flush();
assert.equal(ui.drawerHeadersBound, true);
assert.equal(resizeObservers.length, 1, 'No drawer resize observer is needed before a drawer exists');
const mutations = ui.drawerHeaderMutations;
assert.equal(mutations.root, document.documentElement);
assert.equal(mutations.options.characterData, true, 'Title text edits are observed');
assert.deepEqual(Array.from(mutations.options.attributeFilter), ['hidden'], 'Alignment class writes do not trigger their own mutation updates');

const single = header(20), double = header(40), triple = header(60);
mutations.callback(); mutations.callback();
assert.equal(frames.length, 1, 'Multiple drawer mutations are batched');
flush();
assert.equal(multiline(single), false);
assert.equal(multiline(double), true);
assert.equal(multiline(triple), true);
const observer = resizeObservers.find(item => item.targets.has(single.title));
assert.ok(observer.targets.has(double.title));
assert.ok(observer.targets.has(triple.title));
const observerCount = resizeObservers.length;
ui.bindDrawerHeaders();
assert.equal(resizeObservers.length, observerCount, 'The shared binding is idempotent');

const writes = headers.map(head => head.writes);
observer.callback(); flush();
assert.deepEqual(headers.map(head => head.writes), writes, 'Unchanged line counts do not rewrite classes');
single.title.height = 40; observer.callback(); flush();
assert.equal(multiline(single), true, 'A wrapped title aligns at the top after resize');
double.title.height = 20; window.emit('resize'); flush();
assert.equal(multiline(double), false, 'A title returning to one line restores baseline alignment');
double.title.height = 40; window.visualViewport.emit('resize'); flush();
assert.equal(multiline(double), true);

const hidden = header(40); hidden.title.visible = false;
mutations.callback(); flush();
assert.equal(hidden.writes, 0, 'Hidden titles are not measured as single-line text');
assert.ok(observer.targets.has(hidden.title), 'Hidden titles are observed for opening');
hidden.title.visible = true; mutations.callback(); flush();
assert.equal(multiline(hidden), true, 'Opening a hidden drawer measures the actual title');
hidden.title.height = 20; mutations.callback(); flush();
assert.equal(multiline(hidden), false, 'Replacing title text recomputes its alignment');

for (const theme of ['light', 'dark']) {
  document.documentElement.dataset = {theme};
  for (const lineHeight of [20, 26.666667]) {
    single.title.lineHeight = `${lineHeight}px`;
    for (const lines of [1, 2, 3]) {
      single.title.height = lineHeight * lines + 0.01;
      ui.updateDrawerHeader(single);
      assert.equal(multiline(single), lines > 1, `${theme}: ${lines} lines at ${lineHeight}px`);
    }
  }
}
single.title.height = 26.666667;
fontsReady.forEach(callback => callback()); flush();
assert.equal(multiline(single), false, 'Initial font loading restores baseline when the title fits one line');
single.title.height = 53.333334; document.fonts.emit('loadingdone'); flush();
assert.equal(multiline(single), true, 'Later font loading updates wrapping');
single.title.lineHeight = 'normal';
const beforeInvalid = single.writes;
ui.updateDrawerHeader(single);
assert.equal(single.writes, beforeInvalid, 'Invalid measurements retain the last known state');
ui.updateDrawerHeader(new Element());
headers.splice(headers.indexOf(double), 1); mutations.callback(); flush();
assert.ok(!observer.targets.has(double.title), 'Removing a drawer releases its title observation');

document.createRange = () => ({
  selectNodeContents(title) { this.title = title; },
  getClientRects() { return this.title.textRects || []; }
});
const measured = header(80);
measured.title.lineHeight = 'normal';
measured.title.textRects = [{top: 12, width: 130, height: 16}, {top: 12.2, width: 100, height: 16}];
mutations.callback(); flush();
assert.equal(multiline(measured), false, 'A large title box with two fragments on one line is still single-line');
measured.title.textRects.push({top: 32, width: 160, height: 16});
observer.callback(); flush();
assert.equal(multiline(measured), true, 'Text line rectangles determine the alignment, not padded or stretched element height');
for (const theme of ['light', 'dark']) {
  document.documentElement.dataset = {theme};
  for (const width of [390, 768, 1200, 1439, 1440, 1441, 1920]) {
    window.innerWidth = width;
    const textHeight = width > 1440 ? 21.333333 : 16;
    measured.title.textRects = [{top: 10, width: 140, height: textHeight}];
    window.emit('resize'); flush();
    assert.equal(multiline(measured), false, `${theme}, ${width}px: one actual line restores the baseline`);
    measured.title.textRects.push({top: 10 + textHeight * 1.25, width: 80, height: textHeight});
    window.visualViewport.emit('resize'); flush();
    assert.equal(multiline(measured), true, `${theme}, ${width}px: wrapped text aligns at the top`);
  }
}
measured.title.visible = false;
measured.title.textRects = [{top: 10, width: 140, height: 16}];
mutations.callback(); flush();
assert.equal(multiline(measured), true, 'A hidden title retains its last measured state');
measured.title.visible = true;
mutations.callback(); flush();
assert.equal(multiline(measured), false, 'Opening measures the current line count before applying alignment');
measured.title.textRects.push({top: 30, width: 80, height: 16});
document.fonts.emit('loadingdone'); flush();
assert.equal(multiline(measured), true, 'Font loading remeasures actual text lines');

const css = await read('assets/css/components.css');
assert.match(css, /\.filter-modal__head\s*\{[^}]*align-items: first baseline;/);
assert.match(css, /\.filter-modal__head\.is-title-long\s*\{[^}]*align-items: flex-start;/);
const baselineRule = css.match(/\.filter-modal__head \.dt3-drawer-toggle\.button-smallest-secondary-radius--icon::before\s*\{([^}]*)\}/)[1];
assert.match(baselineRule, /content: "\\200b";/, 'The icon-only close button supplies a zero-width text baseline');
assert.match(baselineRule, /font-family: var\(--font-family-primary\);/);
for (const property of ['size', 'line-height', 'weight', 'letter-spacing']) {
  assert.ok(baselineRule.includes(`var(--typography-caption-small-${property})`), `${property} matches the drawer title, not the smallest button label`);
}
const closeIconRule = css.match(/\.filter-modal \.dt3-drawer-toggle\.button-smallest-secondary-radius--icon svg\s*\{([^}]*)\}/)[1];
assert.match(closeIconRule, /position: absolute;/, 'The SVG no longer participates in baseline calculation');
assert.match(closeIconRule, /top: 50%;/);
assert.match(closeIconRule, /left: 50%;/);
assert.match(closeIconRule, /transform: translate\(-50%, -50%\);/, 'The icon remains centered in its unchanged button');
assert.match(closeIconRule, /width: 24px;\s*height: 24px;/);
assert.doesNotMatch(await read('assets/js/pages/equipment.js'), /syncFilterHeaderFlow|is-title-long/, 'Equipment has no local alignment duplicate');
console.log('Drawer headers: global baseline for one line, top alignment for multiple lines, light/dark token metrics, dynamic insertion, opening, text, resize, fonts, batching, idempotence and observation cleanup passed.');
