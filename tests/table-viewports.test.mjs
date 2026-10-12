import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('assets/js/ui.js');
const css = await read('assets/css/components.css');
const frames = [], wraps = [], resizeObservers = [], mutationObservers = [];
const fontsReady = [];

class Element {
  listeners = new Map();
  dataset = {};
  attributes = new Map();
  visible = true;
  top = 0;
  height = 0;
  scrollTop = 0;
  scrollLeft = 0;
  clientHeight = 0;
  offsetHeight = 0;
  writes = 0;
  properties = new Map();
  style = {
    getPropertyValue: name => this.properties.get(name) || '',
    setProperty: (name, value) => { this.properties.set(name, value); this.writes++; }
  };
  addEventListener(name, callback) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(callback); this.listeners.set(name, listeners);
  }
  removeEventListener(name, callback) {
    this.listeners.set(name, (this.listeners.get(name) || []).filter(listener => listener !== callback));
  }
  emit(name) { for (const callback of this.listeners.get(name) || []) callback({target: this}); }
  getBoundingClientRect() { return {top: this.top, height: this.height, bottom: this.top + this.height}; }
  getClientRects() { return this.visible ? [this.getBoundingClientRect()] : []; }
  hasAttribute(name) { return this.attributes.has(name); }
  querySelector(selector) {
    if (selector === ':scope > table') return this.table || null;
    if (selector === ':scope > .table-scrollbar--horizontal.is-visible') return this.outsideBar || null;
    return null;
  }
  querySelectorAll() { return []; }
  closest(selector) {
    if (selector === '#page-content') return this.page || null;
    if (selector === '.table-block') return this.block || null;
    if (selector.includes('.div-block')) return this.section || null;
    if (selector.includes('.filter-modal__fields')) return this.boundary || null;
    return null;
  }
}

class ResizeObserver {
  targets = new Set();
  constructor(callback) { this.callback = callback; resizeObservers.push(this); }
  observe(element) { this.targets.add(element); }
  unobserve(element) { this.targets.delete(element); }
  disconnect() { this.targets.clear(); this.disconnected = true; }
}
class MutationObserver {
  constructor(callback) { this.callback = callback; mutationObservers.push(this); }
  observe(element, options) { this.root = element; this.options = options; }
}

const document = Object.assign(new Element(), {readyState: 'loading', documentElement: new Element()});
document.querySelectorAll = selector => selector === '.table-wrap' ? wraps : [];
document.querySelector = () => null;
document.fonts = Object.assign(new Element(), {ready: {then(callback) { fontsReady.push(callback); }}});
const window = Object.assign(new Element(), {innerHeight: 900, scrollY: 0});
window.visualViewport = Object.assign(new Element(), {height: 900});
window.getComputedStyle = element => ({
  getPropertyValue(name) {
    return element.properties.get(name) || ({'--table-wrap-readable-rows': '6', '--table-wrap-bottom-space': '24px'}[name] || '');
  },
  borderBottomWidth: element.borderBottomWidth || '1px',
  tableLayout: element.authoredLayout || element.properties.get('--data-table-layout') || 'auto'
});
vm.runInNewContext(source, {window, document, ResizeObserver, MutationObserver, console, requestAnimationFrame: callback => { frames.push(callback); return frames.length; }});
const ui = window.BNTUI;
const existingScrollListeners = (window.listeners.get('scroll') || []).length;
function flush() {
  let iterations = 0;
  while (frames.length) {
    assert.ok(++iterations < 30, 'Layout updates converge');
    frames.shift()();
  }
}
function makeWrap({top = 280, sectionTop = 140, heights = Array(20).fill(48), head = 40, foot = 0} = {}) {
  const wrap = new Element(), table = new Element(), heading = new Element(), footer = new Element();
  wrap.top = top; wrap.height = 300; wrap.clientHeight = 300; wrap.offsetHeight = 304;
  wrap.parentElement = wrap.block = new Element();
  wrap.page = new Element(); wrap.page.top = 140;
  wrap.section = new Element(); wrap.section.top = sectionTop;
  heading.height = head; footer.height = foot;
  table.tHead = heading; table.tFoot = foot ? footer : null;
  table.tBodies = [Object.assign(new Element(), {rows: heights.map(height => Object.assign(new Element(), {height}))})];
  wrap.table = table;
  return wrap;
}
const cap = wrap => Number.parseFloat(wrap.style.getPropertyValue('--table-wrap-max-height'));
const main = makeWrap(); main.scrollTop = 120; main.scrollLeft = 660;
wraps.push(main);
assert.equal(resizeObservers.length, 0, 'Initialization waits for the DOM');
document.emit('DOMContentLoaded'); flush();
assert.equal(cap(main), 595, 'Long tables end at the viewport minus space-5 and surface border');
assert.equal(main.block.style.getPropertyValue('--table-block-sticky-head-height'), '40px');
assert.equal(main.style.getPropertyValue('--table-block-sticky-head-height'), '40px', 'The native vertical scrollbar starts below the whole table header');
assert.equal(main.scrollTop, 120); assert.equal(main.scrollLeft, 660);
assert.ok(resizeObservers[0].targets.has(main.table));
assert.ok(resizeObservers[0].targets.has(main.table.tHead), 'Header resizing is observed even if the total table height stays the same');
assert.equal(mutationObservers[0].root, document.documentElement);
assert.deepEqual(Array.from(mutationObservers[0].options.attributeFilter), ['class', 'hidden', 'open', 'data-table-height-group']);
assert.equal(mutationObservers[0].options.characterData, true);
assert.ok(!mutationObservers[0].options.attributeFilter.includes('style'), 'Measured CSS variables do not recursively trigger mutations');
assert.equal((window.listeners.get('scroll') || []).length, existingScrollListeners, 'Table layout adds no page scroll listener');

const writeCount = main.writes + main.block.writes;
resizeObservers[0].callback(); flush();
assert.equal(main.writes + main.block.writes, writeCount, 'Unchanged measurements do not rewrite styles');
ui.bindTableViewports();
assert.equal(resizeObservers.length, 1, 'The shared binding is idempotent');

for (const height of [600, 900, 1440]) {
  window.innerHeight = window.visualViewport.height = height;
  window.emit('resize'); flush();
  assert.equal(cap(main), Math.max(332, height - 305));
}
assert.ok(cap(main) > 832, 'Tall screens are no longer capped at 832px');
window.innerHeight = window.visualViewport.height = 440;
window.visualViewport.emit('resize'); flush();
assert.equal(cap(main), 332, 'Low screens retain the header, six rows and horizontal scrollbar');

window.innerHeight = window.visualViewport.height = 900;
window.scrollY = 200; main.top -= 200; main.page.top -= 200; main.section.top -= 200;
ui.updateTableViewport(main);
assert.equal(cap(main), 595, 'Even an update while the document is scrolled uses a stable page origin');
window.scrollY = 0; main.top += 200; main.page.top += 200; main.section.top += 200;

const lower = makeWrap({top: 1880, sectionTop: 1800});
ui.updateTableViewport(lower);
assert.equal(cap(lower), 655, 'Below-fold tables use the space below their own section heading');
const short = makeWrap({heights: [48, 48]});
ui.updateTableViewport(short);
assert.equal(cap(short), 595);
assert.ok(cap(short) > short.table.tHead.height + 96, 'The cap does not force a short table to expand');
const empty = makeWrap({heights: []}); ui.updateTableViewport(empty);
assert.equal(cap(empty), 595, 'An empty table does not get a forced minimum height');
const outside = makeWrap();
outside.parentElement.outsideBar = Object.assign(new Element(), {height: 4});
ui.updateTableViewport(outside);
assert.equal(cap(outside), 591, 'External horizontal scrollbars retain the bottom space below the track');
assert.equal(outside.block.style.getPropertyValue('--table-block-sticky-head-height'), '40px', 'Native and external scrollbars share the measured header boundary');
const noHead = makeWrap(); noHead.table.tHead = null; noHead.block = null;
ui.updateTableViewport(noHead);
assert.equal(noHead.style.getPropertyValue('--table-block-sticky-head-height'), '0px', 'A headerless table starts at the top, including without a table-block wrapper');
const fractionalHead = makeWrap({head: 40.25});
ui.updateTableViewport(fractionalHead);
assert.equal(fractionalHead.style.getPropertyValue('--table-block-sticky-head-height'), '41px', 'Fractional header pixels cannot overlap the scrollbar');
fractionalHead.table.tHead = null;
ui.updateTableViewport(fractionalHead);
assert.equal(fractionalHead.style.getPropertyValue('--table-block-sticky-head-height'), '0px', 'Removing the header clears its old scrollbar offset');

const wrapped = makeWrap({top: 420, heights: [80, 64, 48, 96, 64, 48, 100]});
window.visualViewport.height = 700;
ui.updateTableViewport(wrapped);
assert.equal(cap(wrapped), 444, 'Wrapped text is measured without shrinking rows or fonts');
wrapped.table.tBodies[0].rows[0].visible = false;
ui.updateTableViewport(wrapped);
assert.equal(cap(wrapped), 464, 'The readable minimum samples visible rows only');

const drawer = makeWrap({top: 240, foot: 30});
drawer.boundary = Object.assign(new Element(), {top: 200, height: 420, clientHeight: 420});
ui.updateTableViewport(drawer);
assert.equal(cap(drawer), 380, 'Drawers use their body bounds and retain the footer outside that area');
drawer.boundary.scrollTop = 100; drawer.top -= 100;
ui.updateTableViewport(drawer);
assert.equal(cap(drawer), 380, 'Scrolling drawer fields does not alter the measured height');
drawer.boundary.clientHeight = 80;
ui.updateTableViewport(drawer);
assert.equal(cap(drawer), 362, 'A low drawer keeps a readable table and lets its fields scroll');

const hidden = makeWrap(); hidden.visible = false;
wraps.push(hidden, drawer);
mutationObservers[0].callback(); mutationObservers[0].callback();
assert.equal(frames.length, 1, 'Repeated mutations are batched into one frame');
flush();
assert.equal(hidden.style.getPropertyValue('--table-wrap-max-height'), '');
hidden.visible = true; mutationObservers[0].callback(); flush();
assert.ok(cap(hidden) > 0, 'A newly opened table is measured');
assert.ok(resizeObservers[0].targets.has(drawer.boundary));

main.table.tHead.height = 72;
main.table.tBodies[0].rows.slice(0, 6).forEach(row => { row.height = 96; });
fontsReady.forEach(callback => callback()); flush();
assert.equal(cap(main), 652, 'Font loading recomputes the readable area');
assert.equal(main.block.style.getPropertyValue('--table-block-sticky-head-height'), '72px');
assert.equal(main.style.getPropertyValue('--table-block-sticky-head-height'), '72px', 'A wrapped or multi-row header moves the native track boundary too');
main.table.tHead.height = 40; main.table.tBodies[0].rows.forEach(row => { row.height = 48; });
document.fonts.emit('loadingdone'); flush();
assert.equal(cap(main), 395);
wraps.splice(wraps.indexOf(main), 1); mutationObservers[0].callback(); flush();
assert.ok(!resizeObservers[0].targets.has(main));
assert.ok(!resizeObservers[0].targets.has(main.table), 'Removed tables release their observations');
assert.ok(!resizeObservers[0].targets.has(main.table.tHead), 'Removed table headers release their observations');

function makeColumnTable(widths, available = 600) {
  const wrap = makeWrap(), table = wrap.table;
  wrap.clientWidth = available;
  table.matches = selector => selector === '.data-table, .analytics-table';
  table.style.width = ''; table.style.minWidth = ''; table.style.tableLayout = '';
  table.style.removeProperty = name => table.properties.delete(name);
  Object.defineProperty(table.style, 'cssText', {
    get: () => JSON.stringify({properties: [...table.properties], width: table.style.width, minWidth: table.style.minWidth, tableLayout: table.style.tableLayout}),
    set: value => {
      const saved = JSON.parse(value);
      table.properties = new Map(saved.properties);
      Object.assign(table.style, {width: saved.width, minWidth: saved.minWidth, tableLayout: saved.tableLayout});
    }
  });
  table.rows = widths.map(rowWidths => {
    const row = new Element();
    row.cells = rowWidths.map(width => {
      const cell = Object.assign(new Element(), {colSpan: 1, rowSpan: 1, intrinsicWidth: width});
      cell.getClientRects = () => cell.visible ? [{}] : [];
      cell.getBoundingClientRect = () => {
        assert.equal(table.style.width, 'max-content', 'Measure the actual intrinsic table, not the previously distributed column widths');
        assert.equal(table.style.tableLayout, 'auto');
        wrap.scrollLeft = 0; wrap.scrollTop = 0;
        return {width: cell.intrinsicWidth};
      };
      return cell;
    });
    return row;
  });
  return wrap;
}
const monthColumns = makeColumnTable([[70, 80], [40, 100]]);
const paymentColumns = makeColumnTable([[220, 80], [280, 120]]);
paymentColumns.scrollLeft = 160; paymentColumns.scrollTop = 96;
wraps.push(monthColumns, paymentColumns);
mutationObservers[0].callback(); flush();
assert.equal(monthColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed');
assert.equal(paymentColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed', 'Both roomy two-column tables use equal columns despite different text lengths');
assert.equal(paymentColumns.table.style.width, '');
assert.equal(paymentColumns.table.style.minWidth, '');
assert.equal(paymentColumns.table.style.tableLayout, '', 'Do not leave temporary measurement styles behind');
assert.equal(paymentColumns.scrollLeft, 160); assert.equal(paymentColumns.scrollTop, 96, 'Intrinsic measurement must not reset table scrolling');
const layoutWrites = paymentColumns.table.writes;
resizeObservers[0].callback(); flush();
assert.equal(paymentColumns.table.writes, layoutWrites, 'Unchanged layouts do not rewrite the component state');
paymentColumns.clientWidth = 400;
window.emit('resize'); flush();
assert.equal(paymentColumns.table.style.getPropertyValue('--data-table-layout'), 'auto', 'Return to content sizing when one column cannot fit its equal share');
assert.equal(monthColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed');
paymentColumns.clientWidth = 800;
window.emit('resize'); flush();
assert.equal(paymentColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed');
paymentColumns.table.rows[1].cells[0].intrinsicWidth = 450;
document.fonts.emit('loadingdone'); flush();
assert.equal(paymentColumns.table.style.getPropertyValue('--data-table-layout'), 'auto', 'Font remeasurement can disable equality without clipping content');
paymentColumns.table.rows[1].cells[0].intrinsicWidth = 280;
mutationObservers[0].callback(); flush();
assert.equal(paymentColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed', 'Content updates restore equality when everything fits again');
const multiColumns = makeColumnTable([[90, 120, 80], [180, 130, 110]], 600);
ui.updateTableColumns(multiColumns);
assert.equal(multiColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed', 'The rule covers all ordinary table column counts');
multiColumns.clientWidth = 480;
ui.updateTableColumns(multiColumns);
assert.equal(multiColumns.table.style.getPropertyValue('--data-table-layout'), 'auto');
multiColumns.table.rows[1].visible = false;
ui.updateTableColumns(multiColumns);
assert.equal(multiColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed', 'Hidden rows do not constrain visible columns');
multiColumns.table.rows[1].visible = true;
multiColumns.table.rows.forEach(row => { row.cells[2].visible = false; });
ui.updateTableColumns(multiColumns);
assert.equal(multiColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed', 'Hidden columns are excluded from the equal-share count');
const spanning = makeColumnTable([[300], [180, 130, 110]], 600);
spanning.table.rows[0].cells[0].colSpan = 3;
ui.updateTableColumns(spanning);
assert.equal(spanning.table.style.getPropertyValue('--data-table-layout'), 'fixed', 'A colspan receives the combined equal-column budget');
spanning.table.rows[1].cells[0].rowSpan = 2;
ui.updateTableColumns(spanning);
assert.equal(spanning.table.style.getPropertyValue('--data-table-layout'), '', 'Complex row-spanned tables retain their existing sizing contract');
const explicitColumns = makeColumnTable([[90, 120]], 600);
explicitColumns.table.authoredLayout = 'fixed';
ui.updateTableColumns(explicitColumns);
assert.equal(explicitColumns.table.style.getPropertyValue('--data-table-layout'), '', 'A specifically authored fixed layout is not overwritten');
explicitColumns.table.authoredLayout = 'auto';
explicitColumns.table.querySelector = selector => selector === 'colgroup' ? {} : null;
ui.updateTableColumns(explicitColumns);
assert.equal(explicitColumns.table.style.getPropertyValue('--data-table-layout'), '', 'Explicit colgroup definitions retain their configured proportions');

const controlColumns = makeColumnTable([[80, 90, 80], [110, 140, 60]], 900);
const controlSelector = selector => selector.startsWith('tbody td:is(');
controlColumns.table.querySelector = selector => controlSelector(selector) ? {} : null;
ui.updateTableColumns(controlColumns);
assert.equal(controlColumns.table.style.getPropertyValue('--data-table-layout'), 'auto', 'Badge and command columns use their own content width even in a roomy table');
const controlWrites = controlColumns.table.writes;
ui.updateTableColumns(controlColumns);
assert.equal(controlColumns.table.writes, controlWrites, 'Unchanged control layout does not rewrite styles');
controlColumns.table.querySelector = () => null;
ui.updateTableColumns(controlColumns);
assert.equal(controlColumns.table.style.getPropertyValue('--data-table-layout'), 'fixed', 'Pure text and numeric tables retain the existing equal-share rule');

class ScrollElement extends Element {
  children = [];
  tokens = new Set();
  hidden = false;
  capturedPointers = new Set();
  setPointerCapture(id) { this.capturedPointers.add(id); }
  hasPointerCapture(id) { return this.capturedPointers.has(id); }
  releasePointerCapture(id) { this.capturedPointers.delete(id); }
  classList = {
    contains: name => this.tokens.has(name),
    add: name => this.tokens.add(name),
    remove: name => this.tokens.delete(name),
    toggle: (name, selected) => selected ? this.tokens.add(name) : this.tokens.delete(name)
  };
  set className(value) { this.tokens = new Set(value.split(/\s+/).filter(Boolean)); }
  get className() { return [...this.tokens].join(' '); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  contains(node) { return node === this || this.children.some(child => child.contains?.(node)); }
  matches(selector) { return selector === '.table-block' && this.classList.contains('table-block'); }
  appendChild(child) {
    child.parentElement = this; this.children.push(child); this.firstElementChild = this.children[0];
    if (child.classList?.contains('table-scrollbar--vertical')) {
      Object.defineProperty(child, 'clientHeight', {get: () => Math.max(0, this.wrap.clientHeight - parseFloat(this.style.getPropertyValue('--table-block-sticky-head-height') || '0'))});
    }
    if (child.classList?.contains('table-scrollbar--horizontal')) child.clientWidth = 300;
    return child;
  }
  querySelector(selector) {
    if (selector === ':scope > .table-wrap') return this.wrap || null;
    if (selector === '.table-scrollbar__thumb') return this.children.find(child => child.classList.contains('table-scrollbar__thumb')) || null;
    if (selector === ':scope > .table-scrollbar--horizontal.is-visible') return this.children.find(child => child.classList.contains('table-scrollbar--horizontal') && child.classList.contains('is-visible')) || null;
    return super.querySelector(selector);
  }
  emitPointer(name, options = {}) {
    const event = {button: 0, pointerId: 1, pointerType: 'mouse', target: this, preventDefault() {}, ...options};
    for (const handler of [...(this.listeners.get(name) || [])]) handler(event);
  }
}
document.createElement = () => new ScrollElement();
const scrollWrap = Object.assign(new ScrollElement(), {top: 280, height: 300, clientHeight: 300, offsetHeight: 300, clientWidth: 300, scrollWidth: 300, scrollHeight: 1000});
scrollWrap.table = makeWrap().table;
scrollWrap.table.matches = selector => selector === '.data-table, .analytics-table';
scrollWrap.table.rows = scrollWrap.table.tBodies[0].rows;
scrollWrap.table.rows.forEach(row => { row.cells = [Object.assign(new Element(), {colSpan: 1, rowSpan: 1})]; });
const scrollBlock = new ScrollElement(); scrollBlock.className = 'table-block'; scrollBlock.wrap = scrollWrap;
scrollWrap.block = scrollWrap.parentElement = scrollBlock;
scrollBlock.appendChild(scrollWrap);
const resizeListeners = (window.listeners.get('resize') || []).length;
wraps.push(scrollWrap); mutationObservers[0].callback(); flush();
assert.ok(scrollBlock.classList.contains('table-block--scroll-outside'), 'The general table binding applies the existing flush-header scrollbar variant');
const verticalBar = scrollBlock.children.find(child => child.classList?.contains('table-scrollbar--vertical'));
const horizontalBar = scrollBlock.children.find(child => child.classList?.contains('table-scrollbar--horizontal'));
const thumb = verticalBar.children[0];
Object.defineProperty(thumb, 'offsetHeight', {get: () => parseFloat(thumb.style.height) || 0});
assert.equal(verticalBar.clientHeight, 260, 'The whole 40px header is outside the track');
assert.equal(thumb.style.height, '70px', 'The thumb represents the visible body, not the header plus body');
assert.equal(horizontalBar.hidden, true);
assert.equal(scrollWrap.attributes.get('tabindex'), '0', 'Native wheel and keyboard scrolling remain available after hiding the native scrollbar');
const state = scrollBlock.__bntTableScrollbars;
const scrollbarObserver = resizeObservers.find(observer => observer.targets.has(scrollBlock));
ui.bindTableBlockScrollbar(scrollBlock); flush();
assert.equal(scrollBlock.__bntTableScrollbars, state, 'Repeated initialization retains one controller');
assert.equal(scrollBlock.children.length, 3, 'Repeated layout cannot duplicate tracks');
assert.equal((window.listeners.get('resize') || []).length, resizeListeners + 1);
const rowTarget = new ScrollElement();
scrollWrap.emitPointer('pointerdown', {clientX: 0, clientY: 0, target: rowTarget});
assert.equal(scrollWrap.capturedPointers.size, 0, 'An ordinary row click is not captured by the scroll wrapper');
scrollWrap.emitPointer('pointerup');
scrollWrap.emitPointer('pointerdown', {clientX: 0, clientY: 0, target: rowTarget});
scrollWrap.emitPointer('pointermove', {clientX: 0, clientY: -10});
assert.equal(scrollWrap.capturedPointers.size, 1, 'Content capture begins only after actual dragging');
scrollWrap.emitPointer('pointercancel');
assert.equal(scrollWrap.capturedPointers.size, 0);
assert.ok(!scrollWrap.classList.contains('is-dragging'));
scrollWrap.scrollTop = 700; scrollWrap.emit('scroll'); flush();
assert.equal(thumb.style.transform, 'translateY(190px)', 'The thumb reaches the end at the last row');
scrollWrap.table.tHead.height = 80; document.fonts.emit('loadingdone'); flush();
assert.equal(verticalBar.clientHeight, 220, 'Header wrapping or font changes shorten the track without an empty header gutter');
scrollWrap.table.tHead = null; mutationObservers[0].callback(); flush();
assert.equal(verticalBar.clientHeight, 300, 'Headerless tables start at the top');
verticalBar.emitPointer('pointerdown', {clientY: 0, target: verticalBar});
assert.equal(scrollWrap.scrollTop, 0, 'Clicking the start of the track scrolls to the first row');
verticalBar.emitPointer('pointerdown', {clientY: 0, target: thumb});
verticalBar.emitPointer('pointermove', {clientY: 210});
assert.equal(scrollWrap.scrollTop, 700, 'Dragging the thumb scrolls the body');
verticalBar.emitPointer('pointerup');
scrollWrap.scrollHeight = 300; scrollWrap.emit('scroll'); flush();
assert.equal(verticalBar.hidden, true, 'Short tables retain intrinsic height without a scrollbar');
assert.ok(!scrollWrap.attributes.has('tabindex'));
scrollWrap.scrollWidth = 600; scrollWrap.emit('scroll'); flush();
assert.equal(horizontalBar.hidden, false, 'Horizontal overflow still uses the existing horizontal component');
assert.equal(horizontalBar.children[0].style.width, '150px');
scrollWrap.emitPointer('pointerdown', {clientX: 0, clientY: 0, target: rowTarget});
scrollWrap.emitPointer('pointermove', {clientX: -10, clientY: 0});
wraps.splice(wraps.indexOf(scrollWrap), 1); mutationObservers[0].callback(); flush();
assert.equal(state.destroyed, true);
assert.equal(scrollBlock.__bntTableScrollbars, undefined);
assert.equal(scrollbarObserver.disconnected, true);
assert.equal((window.listeners.get('resize') || []).length, resizeListeners, 'Removed tables release window listeners and observers');
assert.equal((scrollWrap.listeners.get('scroll') || []).length, 0);
assert.equal(scrollWrap.capturedPointers.size, 0, 'Removing a table cancels an in-progress drag');

const rule = css.match(/^\.table-wrap\s*\{([^}]+)\}/m)[1];
assert.match(rule, /--table-wrap-readable-rows: 6;/);
assert.match(rule, /--table-wrap-bottom-space: var\(--space-5\);/);
assert.match(rule, /--table-block-sticky-head-height: 0px;/, 'Nested headerless tables do not inherit an outer header offset');
assert.doesNotMatch(css, /\.table-wrap::-webkit-scrollbar-track:vertical/, 'The rejected native-track inset workaround is removed');
assert.match(source, /if \(block\?\.matches\?\.\("\.table-block"\)[^]*?this\.bindTableBlockScrollbar\(block\);/, 'All shared tables use the existing external scrollbar, not just the equipment registry');
assert.match(css, /\.table-scrollbar--vertical\s*\{[^}]*top: var\(--table-block-sticky-head-height, 0\);/, 'The existing external scrollbar retains the same header offset');
assert.doesNotMatch(css, /\.layout-drawer-body--table > \.table-block--scroll-outside\s*\{[^}]*padding-(?:right|bottom):/, 'Drawer scrollbars never reserve a gutter beside the header or below a short table');
assert.match(rule, /max-height: var\(--table-wrap-max-height, calc\(100dvh - var\(--table-wrap-bottom-space\)\)\);/);
assert.doesNotMatch(rule, /832px|(?:^|;)\s*(?:min-)?height:/);
assert.match(css, /\.data-table,\s*\.analytics-table\s*\{[^}]*table-layout: var\(--data-table-layout, auto\);/);
const outsideRule = css.match(/^\.table-block--scroll-outside > \.table-wrap\s*\{([^}]+)\}/m)[1];
assert.doesNotMatch(outsideRule, /max-height:/, 'External scrollbar tables use the same adaptive cap');
assert.match(css, /\.table-wrap > \.data-table > thead,[^{]*\{[^}]*position: sticky;[^}]*top: 0;/);
assert.match(css, /@media print\s*\{\s*\.table-wrap\s*\{[^}]*max-height: none;[^}]*overflow: visible;/);
assert.match(css, /@media print[\s\S]*\.table-wrap > :is\(\.data-table, \.analytics-table\) > thead\s*\{[^}]*position: static;/);
for (const file of ['data.html', 'equipment.html', 'procurement.html', 'logistics.html', 'analytics.html', 'toir.html', 'equipment-detail.html']) {
  assert.match(await read(file), /assets\/js\/ui\.js\?v=\d+/, `${file} uses the shared viewport binding`);
}
console.log('Table viewports: global initialization, intrinsic short tables, six visible rows, stable page and section bounds, drawers, wrapped text, large/mobile screens, fonts, resize, mutations, observation cleanup, sticky headers and print passed.');
