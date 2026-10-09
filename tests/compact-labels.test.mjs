import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/ui.js', import.meta.url), 'utf8');
const frames = [], mutations = [], resizes = [], fontReady = [];
class Element {
  childNodes = [];
  className = '';
  listeners = new Map();
  attributes = new Map();
  visible = true;
  style = {values: new Map(), getPropertyValue(name) { return this.values.get(name) || ''; }, setProperty(name, value) { this.values.set(name, value); }};
  computedStyle = {fontFamily: 'Golos Text', fontSize: '12px', fontWeight: '400', lineHeight: '16px', textTransform: 'none'};
  classList = {contains: name => this.className.split(' ').includes(name)};
  get textContent() { return this.childNodes.map(node => node.textContent).join(''); }
  appendChild(node) {
    if (node.parentElement) node.parentElement.childNodes.splice(node.parentElement.childNodes.indexOf(node), 1);
    this.childNodes.push(node); node.parentElement = this; return node;
  }
  insertBefore(node, before) { this.childNodes.splice(this.childNodes.indexOf(before), 0, node); node.parentElement = this; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getClientRects() { return this.visible ? [{top: 0, width: 80, height: 16}] : []; }
  addEventListener(name, callback) { const list = this.listeners.get(name) || []; list.push(callback); this.listeners.set(name, list); }
  emit(name) { this.listeners.get(name)?.forEach(callback => callback()); }
}
const textNode = (text, line = 0) => ({nodeType: 3, textContent: text, line});
const descendants = root => root.childNodes.flatMap(node => node.nodeType === 3 ? [] : [node, ...descendants(node)]);
const roots = [];
const context2d = {
  measureText(text) {
    const scale = parseFloat(this.font.match(/([\d.]+)px/)[1]) / 12;
    const ascent = (/[A-ZА-ЯЁ0-9]/u.test(text) ? 7 : 5) * scale;
    const descent = (/[gjpqyруфдцщ]/u.test(text) ? 3 : 0) * scale;
    return {actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: descent, fontBoundingBoxAscent: 9 * scale, fontBoundingBoxDescent: 3 * scale};
  }
};
const document = Object.assign(new Element(), {
  readyState: 'loading', documentElement: new Element(),
  fonts: Object.assign(new Element(), {ready: {then(callback) { fontReady.push(callback); }}}),
  querySelectorAll(selector) {
    if (selector === '.badge, .pill.pill--default') return roots;
    if (selector === '.badge__label, .pill__title, .filter-summary__count-title, .form-input__tag-count-value') return roots.flatMap(descendants).filter(node => ['badge__label', 'pill__title', 'filter-summary__count-title', 'form-input__tag-count-value'].some(name => node.classList.contains(name)));
    return [];
  },
  createElement(tag) { return tag === 'canvas' ? {getContext: () => context2d} : new Element(); },
  createRange() {
    return {
      selectNodeContents(label) { this.label = label; this.node = null; },
      setStart(node) { this.node = node; }, setEnd() {},
      getClientRects() {
        const textNodes = node => node.childNodes.flatMap(child => child.nodeType === 3 ? [child] : textNodes(child));
        return (this.node ? [this.node] : textNodes(this.label)).map(node => ({top: node.line * 16, width: 8, height: 16}));
      }
    };
  },
  createTreeWalker(label) {
    const collect = root => root.childNodes.flatMap(node => node.nodeType === 3 ? [node] : collect(node));
    const nodes = collect(label); let index = 0;
    return {nextNode: () => nodes[index++] || null};
  }
});
const window = Object.assign(new Element(), {visualViewport: new Element(), getComputedStyle: label => label.computedStyle});
const runtime = vm.createContext({window, document, console, requestAnimationFrame: callback => frames.push(callback),
  MutationObserver: class {constructor(callback) { this.callback = callback; mutations.push(this); } observe(root, options) { this.options = options; }},
  ResizeObserver: class {targets = new Set(); constructor(callback) { this.callback = callback; resizes.push(this); } observe(target) { this.targets.add(target); } unobserve(target) { this.targets.delete(target); }}
});
vm.runInContext(source, runtime);
const ui = window.BNTUI;
function flush() { let iterations = 0; while (frames.length) { assert.ok(++iterations < 20); frames.shift()(); } }
function root(className, ...children) { const item = new Element(); item.className = className; children.forEach(child => item.appendChild(child)); roots.push(item); return item; }
function label(className, ...text) { const item = new Element(); item.className = className; text.forEach(node => item.appendChild(node)); return item; }
const badge = root('badge neutral', textNode('Личный'));
const icon = new Element(); icon.className = 'icon';
const close = new Element(); close.className = 'button'; close.addEventListener('click', () => close.clicked = true);
const pillLabel = label('pill__title', textNode('Формы (5)'));
const pill = root('pill pill--default', pillLabel, icon, close);
const plain = root('pill pill--default', textNode('Draft'));
const count = label('filter-summary__count-title', textNode('Графики (5)'));
root('pill pill--default', count);
const digit = label('form-input__tag-count-value', textNode('3'));
root('pill pill--default', digit);
ui.bindCompactLabels(); ui.bindCompactLabels();
assert.equal(mutations.length, 1, 'One shared, idempotent binding');
assert.equal(frames.length, 1, 'Batch initial work before paint');
flush();
assert.equal(badge.childNodes[0].className, 'badge__label');
assert.equal(badge.textContent, 'Личный');
assert.equal(plain.childNodes[0].className, 'pill__title');
assert.ok(plain.childNodes[0].attributes.has('data-pill-plain-label'), 'Plain legacy pills retain their horizontal padding');
assert.deepEqual(pill.childNodes, [pillLabel, icon, close], 'Existing labels, buttons and icons are not replaced');
close.emit('click'); assert.equal(close.clicked, true);
assert.equal(resizes.length, 1);
assert.equal(resizes[0].targets.size, 5);
assert.ok(!mutations[0].options.attributeFilter.includes('style'), 'Metric writes do not schedule themselves indefinitely');
const offset = item => parseFloat(item.style.getPropertyValue('--compact-label-offset'));
for (const text of ['ABC', 'низ', 'gjpqy', 'Формы (5)', '327', 'Длинный текст']) {
  pillLabel.childNodes = []; pillLabel.appendChild(textNode(text));
  for (const height of [20, 24, 28]) {
    for (const font of [12, 16]) {
      pillLabel.computedStyle.fontSize = `${font}px`;
      pillLabel.computedStyle.lineHeight = `${font * 4 / 3}px`;
      ui.updateCompactLabel(pillLabel);
      const metrics = context2d.measureText(text);
      const baseline = height / 2 + (metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
      const inkCenter = baseline + (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2 + offset(pillLabel);
      assert.ok(Math.abs(inkCenter - height / 2) < 1e-10, `${text}/${font}/${height}: actual glyphs, not line boxes, are centered`);
    }
  }
}
pillLabel.computedStyle.fontSize = '12px';
pillLabel.childNodes = []; pillLabel.appendChild(textNode('ABC', 0)); pillLabel.appendChild(textNode('gjpqy', 1));
assert.deepEqual(Array.from(ui.compactLabelLines(pillLabel)), ['ABC', 'gjpqy']);
ui.updateCompactLabel(pillLabel);
assert.equal(offset(pillLabel), -1, 'Multiline labels use the first line ascent and last line descent, preserving hug height');
pillLabel.childNodes = []; pillLabel.appendChild(textNode('abc'));
pillLabel.computedStyle.textTransform = 'uppercase'; ui.updateCompactLabel(pillLabel);
assert.equal(offset(pillLabel), .5, 'Measure the displayed case');
pillLabel.computedStyle.textTransform = 'none';
count.visible = false; const hiddenOffset = offset(count);
count.childNodes[0].textContent = 'ABC';
mutations[0].callback(); resizes[0].callback();
assert.equal(frames.length, 1, 'Dynamic updates and resize coalesce');
window.emit('resize'); window.visualViewport.emit('resize'); flush();
assert.equal(offset(count), hiddenOffset, 'Wait for hidden labels to have a current layout');
count.visible = true; mutations[0].callback(); flush();
assert.equal(offset(count), .5, 'Opening a popover measures the new glyphs');
const wrapper = badge.childNodes[0]; mutations[0].callback(); flush();
assert.equal(badge.childNodes[0], wrapper, 'Legacy hydration is idempotent');
count.computedStyle.fontSize = '16px'; document.fonts.emit('loadingdone'); flush();
assert.ok(Math.abs(offset(count) - 2 / 3) < 1e-10, 'Font loading remeasures the current typography');
fontReady.forEach(callback => callback()); flush();
roots.splice(roots.indexOf(pill), 1); mutations[0].callback(); flush();
assert.ok(!resizes[0].targets.has(pillLabel), 'Removed labels are unobserved');
const originalMeasure = context2d.measureText;
context2d.measureText = () => ({width: 20});
const fallback = label('pill__title', textNode('Fallback')); ui.updateCompactLabel(fallback);
assert.equal(fallback.style.getPropertyValue('--compact-label-offset'), '', 'Unsupported metrics keep the CSS centering fallback');
context2d.measureText = originalMeasure;
assert.match(ui.badge('A & <B>', 'neutral'), /badge__label">A &amp; &lt;B&gt;/);
console.log('Compact labels: actual glyph centering at 20/24/28px, uppercase/lowercase/descenders, multiline first/last edges, fonts, opening, resize, batching, legacy hydration, unchanged controls and fallback passed. Browser rendering excluded.');
