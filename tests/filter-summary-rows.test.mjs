import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const frames = [], roots = [], observers = [];
class Element {
  hidden = false;
  textContent = '';
  attributes = new Map();
  listeners = new Map();
  classes = new Set();
  classList = {
    contains: name => this.classes.has(name),
    toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name)
  };
  style = {setProperty() {}};
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return {top: 100, bottom: 124, left: 20, width: 300}; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name); }
  addEventListener(name, listener) {
    const callbacks = this.listeners.get(name) || [];
    callbacks.push(listener); this.listeners.set(name, callbacks);
  }
  emit(name, event = {}) { this.listeners.get(name)?.forEach(listener => listener(event)); }
  focus() { this.focused = true; }
}
class Observer {
  targets = new Set();
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
}
const document = Object.assign(new Element(), {
  documentElement: {clientWidth: 1440, clientHeight: 900},
  fonts: new Element(),
  querySelectorAll(selector) {
    if (selector === '[data-filter-summary-rows]') return roots;
    if (selector === '[data-filter-summary-group].is-open') return roots.map(root => root.more).filter(group => group.classes.has('is-open'));
    return [];
  }
});
const window = Object.assign(new Element(), {
  getComputedStyle: root => ({minHeight: `${root.height * 3 + 8}px`, maskImage: root.maskImage || 'none', webkitMaskImage: root.webkitMaskImage || 'none', getPropertyValue: () => '12'})
});
vm.runInNewContext(await read('assets/js/ui.js'), {
  window, document, ResizeObserver: Observer, MutationObserver: Observer,
  requestAnimationFrame: callback => frames.push(callback)
});
const ui = window.BNTUI;
const flush = () => { let count = 0; while (frames.length) { frames.shift()(); assert.ok(++count < 30, 'Updates converge'); } };
flush();

function fixture(width, height, widths) {
  const root = new Element(), more = new Element(), count = new Element(), trigger = new Element(), menu = new Element();
  Object.assign(root, {width, height, more});
  const items = widths.map((width, index) => Object.assign(new Element(), {width, index}));
  const menuItems = widths.map(() => new Element());
  count.textContent = `+${items.length}`;
  trigger.setAttribute('aria-expanded', 'false');
  menu.hidden = true; more.hidden = true;
  more.querySelector = selector => ({'[data-filter-summary-count]': count, '[data-filter-summary-toggle]': trigger, '[data-filter-summary-menu]': menu})[selector] || null;
  more.querySelectorAll = selector => selector === '[data-filter-summary-overflow-item]' ? menuItems : [];
  root.querySelector = selector => selector === '[data-filter-summary-overflow]' ? more : null;
  root.querySelectorAll = selector => selector === '[data-filter-summary-item]' ? items : [];
  root.getBoundingClientRect = () => ({top: 100, width: root.width});
  const layout = () => {
    const rects = new Map();
    let x = 0, y = 100, lineHeight = root.height;
    for (const item of [...items, more].filter(item => !item.hidden)) {
      const width = Math.min(item === more ? 44 + count.textContent.length * 7 : item.width, root.width);
      const height = item.lines ? root.height * item.lines : root.height;
      if (x > 0 && x + width > root.width) { x = 0; y += lineHeight + 4; lineHeight = root.height; }
      rects.set(item, {left: 20 + x, top: y, bottom: y + height, width});
      x += width + 4; lineHeight = Math.max(lineHeight, height);
    }
    return rects;
  };
  for (const item of [...items, more]) item.getBoundingClientRect = () => layout().get(item) || {bottom: 100, width: 0};
  roots.push(root);
  return {root, items, more, count, trigger, menu, menuItems};
}

for (const height of [20, 24, 28]) {
  const tags = fixture(300, height, Array(7).fill(140));
  assert.equal(ui.updateFilterSummaryRows(tags.root), 5, `${height}px: counter fits in the third row`);
  assert.equal(tags.count.textContent, '+2');
  assert.equal(tags.trigger.getAttribute('aria-label'), 'Ещё значений: 2');
  assert.equal(tags.more.hidden, false);
  assert.deepEqual(tags.items.map(item => item.hidden), [false, false, false, false, false, true, true]);
  assert.deepEqual(tags.menuItems.map(item => item.hidden), [true, true, true, true, true, false, false]);
  assert.equal(ui.updateFilterSummaryRows(tags.root), 5, 'Repeated measurement is stable');
  tags.root.width = 150;
  assert.equal(ui.updateFilterSummaryRows(tags.root), 2, 'Narrow layouts reserve a separate row for the counter');
  assert.equal(tags.count.textContent, '+5');
  ui.setFilterSummaryOpen(tags.more, true);
  assert.equal(tags.trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(tags.menu.hidden, false);
  ui.setFilterSummaryOpen(tags.more, false, {focus: true});
  assert.equal(tags.trigger.focused, true);
  tags.root.width = 600;
  assert.equal(ui.updateFilterSummaryRows(tags.root), 7);
  assert.equal(tags.more.hidden, true);
  assert.equal(tags.menu.hidden, true);
  assert.ok(tags.items.every(item => !item.hidden));
  tags.root.width = 0;
  assert.equal(ui.updateFilterSummaryRows(tags.root), undefined, 'Invisible layouts are measured when revealed');
}
const wrapped = fixture(150, 24, Array(5).fill(140));
wrapped.items[0].lines = 2;
assert.equal(ui.updateFilterSummaryRows(wrapped.root), 1, 'A two-line hug pill uses its actual height, not a guessed one-line height');
assert.equal(wrapped.count.textContent, '+4');
const single = fixture(300, 28, [200]);
single.root.querySelector = () => null;
assert.equal(ui.updateFilterSummaryRows(single.root), undefined, 'One address needs no counter');

const popupGroup = new Element(), popupMenu = new Element(), clipped = new Element(), inner = new Element();
const popupProperties = new Map();
popupMenu.offsetWidth = 260;
popupMenu.style.setProperty = (key, value) => popupProperties.set(key, value);
popupGroup.querySelector = () => popupMenu;
inner.getBoundingClientRect = () => ({bottom: 110, right: 120});
clipped.getBoundingClientRect = () => ({bottom: 200, right: 220});
popupGroup.parentElement = inner;
inner.parentElement = clipped;
ui.positionFilterSummaryMenu(popupGroup);
assert.equal(popupProperties.get('--filter-summary-menu-max-height'), '762px', 'Unmasked parents do not limit overlays');
assert.equal(popupProperties.get('--filter-summary-menu-offset'), '0px');
clipped.maskImage = 'linear-gradient(#fff, #fff)';
ui.positionFilterSummaryMenu(popupGroup);
assert.equal(popupProperties.get('--filter-summary-menu-max-height'), '62px', 'The rollover scrolls inside the masked content instead of being clipped');
assert.equal(popupProperties.get('--filter-summary-menu-offset'), '-72px', 'The rollover also respects the mask right edge');
clipped.maskImage = 'none';
clipped.webkitMaskImage = 'linear-gradient(#fff, #fff)';
ui.positionFilterSummaryMenu(popupGroup);
assert.equal(popupProperties.get('--filter-summary-menu-max-height'), '62px', 'WebKit masks use the same boundary');

const group = [{key: 'addresses', label: 'Получатели', values: [{value: 'a@x', label: 'a@x'}, {value: 'b@x', label: 'b@x'}]}];
const markup = ui.renderFilterSummary(group, {rows: 3});
assert.match(markup, /data-filter-summary-rows="3"/);
assert.match(markup, /filter-summary__pill pill pill--default pill--radius typography-body-smallest/);
assert.match(markup, /data-filter-summary-item="0"/);
assert.match(markup, /data-equipment-filter-remove-item="a@x"/);
assert.match(markup, /data-filter-summary-overflow-item="1"/);
assert.match(markup, /aria-controls="filter-summary-\d+"/);
assert.match(markup, /data-filter-summary-menu role="list" aria-label="Получатели" hidden/);
assert.doesNotMatch(ui.renderFilterSummary(group), /data-filter-summary-rows|data-filter-summary-toggle/);
assert.doesNotMatch(ui.renderFilterSummary(group, {rows: 3, readonly: true}), /data-equipment-filter-remove/);

ui.filterSummaryRowsMutations.callback(); flush();
const observer = observers.find(observer => observer.targets.has(wrapped.root));
assert.ok(observer, 'New lists are observed after render');
wrapped.root.width = 600; window.emit('resize'); flush();
assert.equal(wrapped.more.hidden, true);
wrapped.root.width = 150; document.fonts.emit('loadingdone'); flush();
assert.equal(wrapped.count.textContent, '+4');
roots.splice(roots.indexOf(wrapped.root), 1);
ui.filterSummaryRowsMutations.callback(); flush();
assert.ok(!observer.targets.has(wrapped.root), 'Removed lists are released');

const css = await read('assets/css/components.css');
assert.match(css, /\.filter-summary__pills--rows\s*\{[^}]*min-height: calc\(var\(--pill-badge-height, var\(--space-5\)\)/);
assert.match(css, /\.filter-summary__pills\s*\{[^}]*gap: var\(--space-1\);/);
assert.match(css, /\.data-block\.scenario-panel:has\(\[data-filter-summary-group\]\.is-open\)\s*\{[^}]*z-index: 142;/);
console.log('Shared row-limited filter pills: 20/24/28px sizes, hug wrapping, counter reservation, ARIA/rollover reuse, resize/fonts, stable updates and observer cleanup passed. Browser pixels excluded.');
