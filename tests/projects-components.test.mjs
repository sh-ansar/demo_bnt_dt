import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
let document;
class Element {
  dataset = {};
  queries = new Map();
  parents = new Map();
  attributes = new Map();
  listeners = new Map();
  classes = new Set();
  classList = {
    contains: name => this.classes.has(name),
    add: name => this.classes.add(name),
    remove: (...names) => names.forEach(name => this.classes.delete(name)),
    toggle: (name, value = !this.classes.has(name)) => value ? this.classes.add(name) : this.classes.delete(name)
  };
  value = '';
  innerHTML = '';
  textContent = '';
  hidden = false;
  disabled = false;
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  emit(type, event) {
    for (const listener of this.listeners.get(type) || []) {
      listener(event);
      if (event.stopped) break;
    }
  }
  closest(selector) { return this.parents.get(selector) || null; }
  contains(target) { return target === this || target.closest('.form-input') === this; }
  querySelector(selector) { return this.queries.get(selector) || null; }
  querySelectorAll(selector) { return this.queries.get(selector) || []; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name); }
  focus() { document.activeElement = this; }
  matches(selector) { return selector === '[data-project-form]'; }
}
const event = (target, key, shiftKey = false) => ({target, key, shiftKey,
  preventDefault() { this.defaultPrevented = true; },
  stopPropagation() { this.stopped = true; },
  stopImmediatePropagation() { this.stopped = true; }
});
document = new Element();
document.readyState = 'loading';
const window = new Element();
const context = vm.createContext({window, document, Set, Event,
  CustomEvent: class {constructor(type, options) {Object.assign(this, {type}, options);}},
  requestAnimationFrame: callback => callback()
});
vm.runInContext(await read('assets/js/ui.js'), context);
const ui = window.BNTUI;
ui.positionFormInputMenu = () => {};
ui.syncFormInputOverflow = () => {};
const root = new Element(), control = new Element(), menu = new Element(), search = new Element(), clear = new Element(), label = new Element(), value = new Element(), warning = new Element();
root.dataset = {formInput: 'project-assignees', formInputAll: 'All', formInputEmpty: 'Choose'};
label.textContent = 'Assignees';
for (const [selector, node] of [['.form-input__control', control], ['.form-input__menu', menu], ['[data-form-input-search]', search], ['[data-form-input-search-clear]', clear], ['.form-input__label', label], ['[data-form-input-value]', value], ['[data-form-input-empty-warning]', warning]]) root.queries.set(selector, node);
for (const [selector, node] of [['.form-input__control', control], ['[data-form-input-search]', search], ['[data-form-input-search-clear]', clear]]) {
  node.parents.set(selector, node); node.parents.set('.form-input', root);
}
const options = ['All', 'M.K. Freund', 'D.R. Hamilton', 'D.L. Elson'].map(name => {
  const option = new Element(), caption = new Element(), checkbox = new Element();
  option.dataset.formInputOption = name;
  caption.textContent = name;
  option.queries.set('.form-input__option-label', caption);
  option.queries.set('.form-input__checkbox', checkbox);
  option.parents.set('[data-form-input-option]', option);
  option.parents.set('.form-input', root);
  return option;
});
root.queries.set('[data-form-input-option]', options);
const values = new Set(['M.K. Freund', 'D.R. Hamilton']);
const dispose = ui.bindMultiFormInput(root, {values});
assert.equal(options[0].getAttribute('aria-checked'), 'mixed');
assert.equal(control.getAttribute('aria-invalid'), 'false');
root.emit('click', event(control));
assert.equal(control.getAttribute('aria-expanded'), 'true');
assert.equal(menu.hidden, false);
search.value = 'hamilton'; root.emit('input', event(search));
assert.equal(options[1].hidden, true);
assert.equal(options[2].hidden, false);
assert.equal(clear.hidden, false);
root.emit('click', event(clear));
assert.equal(search.value, '');
assert.equal(options.every(option => !option.hidden), true);
root.emit('click', event(options[0]));
assert.equal(values.size, 0, 'Clicking a mixed All resets the selection like Locations');
assert.equal(warning.hidden, true, 'Optional assignees are not reported as invalid');
root.emit('click', event(options[0]));
assert.deepEqual([...values], ['All']);
assert.ok(options.every(option => option.getAttribute('aria-selected') === 'true'));
root.emit('click', event(options[1]));
assert.deepEqual([...values], ['M.K. Freund']);
const remove = new Element();
remove.dataset.formInputTagRemove = 'M.K. Freund';
remove.parents.set('[data-form-input-tag-remove]', remove);
root.emit('click', event(remove));
assert.equal(values.size, 0, 'Removing the last pill does not select everyone');
const more = new Element(), counter = new Element(), hiddenMenu = new Element();
counter.parents.set('[data-form-input-hidden-toggle]', counter);
counter.parents.set('[data-form-input-tag-more]', more);
more.queries.set('[data-form-input-hidden-menu]', hiddenMenu);
root.queries.set('.form-input__tag-more.is-open', [more]);
more.queries.set('[data-form-input-hidden-toggle]', counter);
more.parents.set('.form-input', root);
root.emit('click', event(counter));
assert.equal(counter.getAttribute('aria-expanded'), 'true');
assert.equal(hiddenMenu.hidden, false);
root.emit('keydown', event(control, 'Escape'));
assert.equal(counter.getAttribute('aria-expanded'), 'false');
assert.equal(menu.hidden, false, 'First Escape closes the pill rollover only');
root.emit('keydown', event(control, 'Escape'));
assert.equal(menu.hidden, true);
assert.equal(document.activeElement, control);
root.emit('keydown', event(control, 'Enter'));
assert.equal(document.activeElement, search);
root.emit('keydown', event(search, 'ArrowDown'));
assert.equal(document.activeElement, options[0]);
document.emit('click', event(new Element()));
assert.equal(menu.hidden, true);
const listenerCount = target => [...target.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0);
const beforeDispose = listenerCount(document);
dispose();
assert.equal(listenerCount(document), beforeDispose - 2);
assert.equal(listenerCount(root), 0);

const host = new Element(), trigger = new Element(), dialog = new Element(), first = new Element(), last = new Element();
host.queries.set('[data-studio-drawer]', dialog);
host.queries.set('.dt3-drawer-toggle', first);
dialog.queries.set('button, input:not([type="hidden"]), textarea, [tabindex="0"]', [first, last]);
const controller = ui.bindDrawer(host);
assert.equal(ui.bindDrawer(host), controller, 'Drawer binding is idempotent');
let disposed = 0;
controller.open({id: 'project-drawer', title: 'Новый проект', fields: 'FIELDS', footer: 'FOOTER'}, trigger, () => disposed++);
assert.equal(trigger.getAttribute('aria-expanded'), 'true');
assert.equal(document.activeElement, first);
document.activeElement = last;
document.emit('keydown', event(last, 'Tab'));
assert.equal(document.activeElement, first);
document.emit('keydown', event(first, 'Tab', true));
assert.equal(document.activeElement, last);
const handledEscape = event(first, 'Escape'); handledEscape.preventDefault();
document.emit('keydown', handledEscape);
assert.ok(host.innerHTML, 'A handled nested Escape does not close the drawer');
document.emit('keydown', event(first, 'Escape'));
assert.equal(host.innerHTML, '');
assert.equal(trigger.getAttribute('aria-expanded'), 'false');
assert.equal(document.activeElement, trigger);
assert.equal(disposed, 1);
controller.open({id: 'project-drawer', title: 'Новый проект'}, trigger);
const closeButton = new Element(); closeButton.parents.set('[data-close]', closeButton);
host.emit('click', event(closeButton));
assert.equal(host.innerHTML, '');

const pageRoot = new Element(), pageHost = new Element(), pageTrigger = new Element();
pageTrigger.parents.set('[data-project-create]', pageTrigger);
document.getElementById = id => id === 'page-content' ? pageRoot : pageHost;
let drawerOptions, boundValues;
ui.bindDrawer = () => ({open(options) {drawerOptions = options; pageHost.innerHTML = ui.renderDrawer(options);}, close() {pageHost.innerHTML = '';}});
ui.bindMultiFormInput = (_root, {values}) => {boundValues = [...values]; return () => {};};
const script = await read('assets/js/pages/projects.js');
vm.runInContext(script, context);
assert.match(pageRoot.innerHTML, /empty-state--illustrated[^]*empty-state__title typography-label-base[^]*Проектов пока нет[^]*Создать проект/);
assert.match(pageRoot.innerHTML, /#EmptyStateBox/);
assert.doesNotMatch(pageRoot.innerHTML, /<h1|page-title-actions/);
const emptyBeforeSubmit = pageRoot.innerHTML;
pageRoot.emit('click', event(pageTrigger));
assert.equal(drawerOptions.title, 'Новый проект');
assert.match(drawerOptions.footer, /data-close[^]*#Cross[^]*<span>Отмена<\/span>/);
for (const caption of ['Название', 'Статус', 'Описание', 'Бюджет', 'Исполнители', 'Дата начала', 'Дата завершения']) assert.ok(drawerOptions.fields.includes(caption));
assert.match(drawerOptions.fields, /data-form-input-mode="single"[^]*Бэклог/);
assert.match(drawerOptions.fields, /name="project-name"[^>]*required/);
assert.match(drawerOptions.fields, /name="project-budget" min="0"/);
assert.match(drawerOptions.fields, /data-form-input="project-assignees"[^]*aria-multiselectable="true"[^]*data-form-input-search/);
assert.match(drawerOptions.fields, /equipment-date-grid[^]*data-bnt-date-root="project-start"[^]*data-bnt-date-root="project-end"/);
assert.deepEqual(boundValues, ['Караев Р.Р.', 'Ибраев С.С.', 'Смагулов Е.Т.']);
for (const name of ['Караев Р.Р.', 'Ибраев С.С.', 'Смагулов Е.Т.', 'Ахметов Е.Е.', 'Байкенова М.М.', 'Байкенов А.А.', 'Ахметов У.М.']) assert.ok(drawerOptions.fields.includes(name));
assert.doesNotMatch(drawerOptions.fields, /Freund|Hamilton|Elson/);
assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage|\.toast\(|\.push\(/, 'The project form is explicitly nonpersistent');
const submitted = event(new Element());
pageHost.emit('submit', submitted);
assert.equal(submitted.defaultPrevented, true);
assert.equal(pageHost.innerHTML, '');
assert.equal(pageRoot.innerHTML, emptyBeforeSubmit);
assert.match(await read('projects.html'), /page-content--empty[^]*modal-root[^]*pages\/projects\.js\?v=3/);
console.log('Projects: shared Empty and drawer, reference fields, nonpersistent submit, focus trap, nested Escape, Locations multiselect tri-state, search, pills, rollover and listener cleanup passed. Browser rendering excluded.');
