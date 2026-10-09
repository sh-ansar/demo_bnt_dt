import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const css = await read('assets/css/components.css');
const tokens = await read('assets/css/tokens.css');
const uiSource = await read('assets/js/ui.js');
let document, timerCount = 0;
class Element {
  children = [];
  attributes = new Map();
  listeners = new Map();
  classes = new Set();
  classList = {add: (...names) => names.forEach(name => this.classes.add(name))};
  set className(value) { this.classes = new Set(value.split(/\s+/)); }
  get className() { return [...this.classes].join(' '); }
  set innerHTML(value) {
    this.html = value;
    if (value.includes('data-toast-close')) {
      this.close = new Element();
      this.close.setAttribute('data-toast-close', '');
      this.appendChild(this.close);
    }
  }
  get innerHTML() { return this.html || ''; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  appendChild(child) { this.children.push(child); child.parent = this; }
  addEventListener(type, handler) { this.listeners.set(type, handler); }
  emit(type, target = this) { this.listeners.get(type)?.({target}); }
  querySelector(selector) {
    if (selector === '[data-toast-close]') return this.close || null;
    return this.children.find(child => child.classes.has(selector.slice(1))) || null;
  }
  closest(selector) { return selector === '[data-toast-close]' && this.attributes.has('data-toast-close') ? this : this.parent?.closest(selector) || null; }
  contains(child) { return child === this || this.children.some(item => item.contains(child)); }
  remove() { this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
  focus() { document.activeElement = this; }
  get isConnected() { return this === document.body || !!this.parent?.isConnected; }
  get nextElementSibling() { return this.parent?.children[this.parent.children.indexOf(this) + 1] || null; }
  get previousElementSibling() { return this.parent?.children[this.parent.children.indexOf(this) - 1] || null; }
  get scrollHeight() { return this.children.length * 100; }
}
document = {
  body: new Element(),
  activeElement: null,
  readyState: 'loading',
  addEventListener() {},
  createElement: () => new Element(),
  querySelector(selector) { return this.body.querySelector(selector); }
};
const window = {addEventListener() {}};
vm.runInNewContext(uiSource, {window, document, console, setTimeout() { timerCount++; }});
const ui = window.BNTUI;
const trigger = new Element();
document.body.appendChild(trigger);
document.activeElement = trigger;
const variants = ['default', 'positive', 'warning', 'error', 'neutral'];
const items = variants.map(tone => ui.toast('Title & <test>', 'Body <test> & details', {tone}));
const root = document.querySelector('.toast-root');
assert.equal(document.body.children.length, 2, 'One shared root is created');
assert.ok(root.classes.has('ui-scrollbar'));
assert.equal(root.getAttribute('role'), 'region');
assert.equal(root.getAttribute('aria-label'), 'Уведомления');
assert.deepEqual(root.children, items, 'Toasts retain creation order instead of replacing each other');
assert.equal(root.scrollTop, root.scrollHeight, 'New notifications remain reachable in a long stack');
assert.equal(document.activeElement, trigger, 'Appearance does not steal focus');
assert.equal(timerCount, 0, 'No auto-dismiss timer is scheduled');
for (const [index, item] of items.entries()) {
  const tone = variants[index];
  assert.equal(item.className, `app-toast app-toast--${tone}`);
  assert.equal(item.getAttribute('role'), ['error', 'warning'].includes(tone) ? 'alert' : 'status');
  assert.equal(item.getAttribute('aria-atomic'), 'true');
  assert.match(item.innerHTML, /layout-item-icon app-toast__icon/);
  assert.match(item.innerHTML, /typography-caption-smallest">Title &amp; &lt;test&gt;/);
  assert.match(item.innerHTML, /typography-body-smallest">Body &lt;test&gt; &amp; details/);
  assert.match(item.innerHTML, /sign_BTN_small app-toast__close[\s\S]*type="button"[\s\S]*data-toast-close[\s\S]*Закрыть уведомление: Title &amp; &lt;test&gt;/);
  const statusIcon = item.innerHTML.split('</span>')[0];
  assert.ok(statusIcon.includes(ui.icon(tone === 'positive' ? 'check' : ['warning', 'error'].includes(tone) ? 'warning' : 'info')));
  const body = new Element();
  item.appendChild(body);
  item.emit('click', body);
  assert.ok(root.children.includes(item), 'Only the close control dismisses a notification');
}
const nestedCloseIcon = new Element();
items[1].close.appendChild(nestedCloseIcon);
items[1].close.focus();
items[1].emit('click', nestedCloseIcon);
assert.deepEqual(root.children, [items[0], items[2], items[3], items[4]], 'Closing one item preserves the rest');
assert.equal(document.activeElement, items[2].close, 'Keyboard close moves focus to the next toast');
items[4].close.focus();
items[4].emit('click', items[4].close);
assert.equal(document.activeElement, items[3].close, 'Last toast close moves to the previous toast');
for (const item of [...root.children]) {
  item.close.focus();
  item.emit('click', item.close);
}
assert.equal(root.children.length, 0);
assert.equal(document.activeElement, trigger, 'Closing the last toast restores its connected trigger');
const noMessage = ui.toast('Only title');
assert.match(noMessage.className, /app-toast--default/);
assert.match(noMessage.innerHTML, /typography-caption-smallest">Внимание!<\/strong>/);
assert.match(noMessage.innerHTML, /typography-body-smallest">Only title<\/p>/);
assert.match(noMessage.innerHTML, /aria-label="Закрыть уведомление: Only title"/);
assert.equal(document.body.children.length, 2, 'An empty root is reused');
const fallback = ui.toast('Fallback', '', {tone: 'unknown'});
assert.match(fallback.className, /app-toast--default/);
assert.match(fallback.innerHTML, /typography-caption-smallest">Внимание!<\/strong>/);
assert.match(fallback.innerHTML, /typography-body-smallest">Fallback<\/p>/);
for (const tone of variants) {
  const single = ui.toast('Message & <test>', '', {tone});
  assert.match(single.innerHTML, /typography-caption-smallest">Внимание!<\/strong>/);
  assert.match(single.innerHTML, /typography-body-smallest">Message &amp; &lt;test&gt;<\/p>/);
  assert.match(single.innerHTML, /aria-label="Закрыть уведомление: Message &amp; &lt;test&gt;"/);
  assert.equal(single.className, `app-toast app-toast--${tone}`, 'The fallback heading does not change the semantic tone');
}
for (const title of ['', '   ', null, undefined]) {
  const bodyOnly = ui.toast(title, 'Only body & <test>');
  assert.match(bodyOnly.innerHTML, /typography-caption-smallest">Внимание!<\/strong>/);
  assert.match(bodyOnly.innerHTML, /typography-body-smallest">Only body &amp; &lt;test&gt;<\/p>/);
  assert.match(bodyOnly.innerHTML, /aria-label="Закрыть уведомление: Only body &amp; &lt;test&gt;"/);
}
for (const body of ['', '   ', null, undefined]) {
  const textOnly = ui.toast('Only text', body);
  assert.match(textOnly.innerHTML, /typography-caption-smallest">Внимание!<\/strong>/);
  assert.match(textOnly.innerHTML, /typography-body-smallest">Only text<\/p>/);
}
const numeric = ui.toast(0);
assert.match(numeric.innerHTML, /typography-body-smallest">0<\/p>/, 'A real zero is retained as message text');
const empty = ui.toast('   ', null);
assert.match(empty.innerHTML, /typography-caption-smallest">Внимание!<\/strong>/);
assert.doesNotMatch(empty.innerHTML, /<p/, 'Completely blank input does not create an empty description');
assert.equal(root.children.length, 17, 'New normalized notifications still accumulate without replacing earlier items');
assert.equal(timerCount, 0);

const rule = selector => {
  const start = css.indexOf(`\n${selector} {`);
  assert.ok(start >= 0, selector);
  return css.slice(start, css.indexOf('}', start) + 1);
};
const toast = rule('.app-toast');
assert.match(toast, /--toast-fade: var\(--background-page\);/);
assert.match(toast, /--toast-icon-background: var\(--background-brand-fade-3\);/);
assert.match(toast, /grid-template-columns: calc\(var\(--space-5\) \+ var\(--space-2\)\) minmax\(0, 1fr\) var\(--space-5\);/);
assert.match(toast, /padding: var\(--space-3\);/);
assert.match(toast, /border: 0;/, 'Semantic toasts inherit the borderless base');
assert.match(rule('.app-toast--default'), /border: 1px solid var\(--design-elements-border-default\);/, 'Only Default restores the shared default border');
assert.match(toast, /border-radius: var\(--space-2\);/);
assert.match(toast, /linear-gradient\(105deg, var\(--background-nonoverlay-2\), var\(--toast-fade\)\)/);
assert.match(toast, /backdrop-filter: var\(--backdrop-blur-raised\);/);
assert.doesNotMatch(toast, /(?:^|\n)\s*(?:height|max-height):/);
assert.match(rule('.toast-root'), /width: min\(320px, calc\(100vw - var\(--space-5\) \* 2\)\);/);
assert.match(rule('.toast-root'), /display: grid;[\s\S]*gap: var\(--space-2\);[\s\S]*overflow: auto;/);
assert.match(rule('.toast-root:empty'), /display: none;/);
assert.match(rule('.app-toast__copy'), /gap: 0;[\s\S]*overflow-wrap: anywhere;/);
assert.match(rule('.app-toast__copy > :is(strong, p)'), /color: var\(--text-primary\);/);
assert.match(rule('.layout-item-icon'), /width: 32px;[\s\S]*height: 32px;/);
assert.match(rule('.sign_BTN_small'), /--sign-btn-size: 24px;/);
assert.match(tokens, /--background-brand-fade-3: rgb\(201 222 232 \/ 20%\);/);
assert.match(tokens, /--design-elements-border-default: rgba\(68, 112, 134, \.08\);/);
const light = tokens.match(/:root\s*\{([^}]+)\}/)[1];
const dark = tokens.match(/:root\[data-theme="dark"\][^{]*\{([^}]+)\}/)?.[1] || tokens.slice(tokens.indexOf('--design-elements-border-default: rgba(141'));
for (const tone of ['positive', 'warning', 'error', 'neutral']) {
  const semantic = `--system-elements-semantic-${tone}-secondary-fade`;
  assert.ok(rule(`.app-toast--${tone}`).includes(`--toast-fade: var(${semantic});`));
  assert.doesNotMatch(rule(`.app-toast--${tone}`), /(?:^|\n)\s*border:/, `${tone}: no border override`);
  assert.ok(light.includes(`${semantic}:`) && dark.includes(`${semantic}:`), `${tone}: both themes define the semantic background`);
}
assert.doesNotMatch(await read('legacy/report-studio-v5/styles.css'), /\.toast(?:-root|[\s.{>])/);
assert.doesNotMatch(await read('assets/css/shell-v91.css'), /\.app-toast/);
assert.match(await read('legacy/report-studio-v5/app.js'), /function toast\(title,text='',tone='positive'\)\{return window\.BNTUI\.toast\(title,text,\{tone\}\);\}/);
const pages = (await readdir(new URL('../', import.meta.url))).filter(path => path.endsWith('.html'));
pages.push('legacy/report-studio-v5/index.html');
for (const path of pages) {
  const html = await read(path);
  if (html.includes('assets/js/ui.js')) assert.match(html, /ui\.js\?v=61/, `${path}: shared toast code cache version`);
  if (html.includes('assets/css/components.css')) assert.match(html, /components\.css\?v=336/, `${path}: shared toast styles cache version`);
}
console.log('Toasts: five semantic variants, exact shared typography, token backgrounds/border, 32/24px icon frames, manual stacked close, escaped text, focus return and consumer cache versions passed. Browser rendering excluded.');
