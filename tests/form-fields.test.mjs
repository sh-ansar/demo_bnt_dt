import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const roots = [];
let document;

class Element {
  dataset = {};
  attributes = new Map();
  queries = new Map();
  parents = new Map();
  events = [];
  listeners = new Map();
  classes = new Set();
  classList = {
    add: (...names) => names.forEach(name => this.classes.add(name)),
    remove: (...names) => names.forEach(name => this.classes.delete(name)),
    contains: name => this.classes.has(name),
    toggle: (name, force = !this.classes.has(name)) => force ? this.classes.add(name) : this.classes.delete(name)
  };
  style = {setProperty() {}};
  hidden = false;
  disabled = false;
  value = '';
  textContent = '';
  offsetHeight = 164;
  scrollHeight = 150;
  rect = {top: 120, bottom: 160, height: 40};
  closest(selector) { return this.parents.get(selector) || null; }
  querySelector(selector) { return this.queries.get(selector) || null; }
  querySelectorAll(selector) { return this.queries.get(selector) || []; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  matches(selector) { return selector === 'input[type="search"]' && this.type === 'search'; }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  emit(type, event) {
    for (const listener of this.listeners.get(type) || []) {
      listener(event);
      if (event.stopped) break;
    }
  }
  dispatchEvent(event) { this.events.push(event.type); if (event.detail) (this.details ||= []).push(event.detail); }
  getBoundingClientRect() { return this.rect; }
  focus() { document.activeElement = this; }
  reportValidity() {
    const valid = this.value !== '' && Number.isInteger(Number(this.value)) && Number(this.value) >= Number(this.min) && Number(this.value) <= Number(this.max);
    if (!valid) this.focus();
    return valid;
  }
  stepUp() { this.value = String(Math.min(Number(this.max), Number(this.value) + 1)); }
  stepDown() { this.value = String(Math.max(Number(this.min), Number(this.value) - 1)); }
}

document = new Element();
document.querySelectorAll = selector => {
  if (selector === '[data-filter-summary-group].is-open') return roots.filter(root => root.dataset.filterSummaryGroup && root.classes.has('is-open'));
  if (selector === '[data-ui-dropdown].is-open') return roots.filter(root => root.dataset.uiDropdown && root.classes.has('is-open'));
  if (selector === '[data-bnt-date-root].is-open') return roots.filter(root => root.attributes.has('data-bnt-date-root') && root.classes.has('is-open'));
  if (selector === '[data-form-input-mode="single"].is-open') return roots.filter(root => root.dataset.formInputMode === 'single' && root.classes.has('is-open'));
  if (selector === '[data-time-input].is-open') return roots.filter(root => root.dataset.timeInput && root.classes.has('is-open'));
  return [];
};
document.querySelector = selector => {
  if (selector === '[data-form-input-mode="single"].is-open, [data-time-input].is-open') return roots.find(root => (root.dataset.formInputMode === 'single' || root.dataset.timeInput) && root.classes.has('is-open')) || null;
  if (selector === '[data-ui-dropdown].is-open') return roots.find(root => root.dataset.uiDropdown && root.classes.has('is-open')) || null;
  if (selector === '[data-bnt-date-root].is-open') return roots.find(root => root.attributes.has('data-bnt-date-root') && root.classes.has('is-open')) || null;
  return null;
};
const window = Object.assign(new Element(), {innerHeight: 900});
vm.runInNewContext(await read('assets/js/ui.js'), {window, document, Event, CustomEvent: class { constructor(type, options) { Object.assign(this, {type}, options); } }, requestAnimationFrame: callback => callback()});
const ui = window.BNTUI;
const emptyState = ui.renderEmptyState('Nothing & <test>');
assert.match(emptyState, /empty-state--illustrated[\s\S]*#EmptyStateBox[\s\S]*typography-body-small">Nothing &amp; &lt;test&gt;<\/p>/);
assert.doesNotMatch(emptyState, /<button|<h[1-6]|empty-state__title/);
const emptyDrawer = ui.renderDrawer({id: 'empty-history', title: 'History', emptyMessage: 'Nothing & <test>', fields: 'OLD FIELDS', footer: 'OLD FOOTER'});
const compactEmptyState = ui.renderEmptyState('Nothing & <test>', {size: 'smallest'});
assert.ok(emptyDrawer.includes(compactEmptyState), 'Drawers and compact inline empty states share the exact same component');
assert.match(compactEmptyState, /empty-state--smallest[\s\S]*width="96" height="96"[\s\S]*typography-body-smallest/);
assert.match(emptyDrawer, /role="dialog" aria-modal="true" aria-labelledby="empty-history-title" data-studio-drawer/);
assert.match(emptyDrawer, /filter-modal__title typography-caption-small">History<\/h2>/);
assert.match(emptyDrawer, /filter-modal__body filter-modal__body--empty ui-scrollbar/);
assert.match(emptyDrawer, /<section class="empty-state empty-state--illustrated empty-state--smallest" aria-label="Nothing &amp; &lt;test&gt;">\s*<div class="div-block empty-state__content">/);
assert.match(emptyDrawer, /<svg class="empty-state__illustration" width="96" height="96"[^>]*>[\s\S]*#EmptyStateBox[\s\S]*<p class="empty-state__description typography-body-smallest">Nothing &amp; &lt;test&gt;<\/p>/);
assert.equal((emptyDrawer.match(/<button /g) || []).length, 1);
assert.equal((emptyDrawer.match(/class="ui-divider brand-divider"/g) || []).length, 1);
assert.doesNotMatch(emptyDrawer, /filter-modal__footer|filter-modal__fields|empty-state__title|OLD FIELDS|OLD FOOTER|undefined/);
const formDrawer = ui.renderDrawer({id: 'form', title: 'Form', fields: 'FORM FIELDS', footer: 'FORM FOOTER'});
assert.match(formDrawer, /filter-modal__body--form[\s\S]*FORM FIELDS[\s\S]*filter-modal__footer">FORM FOOTER/);
assert.equal((formDrawer.match(/class="ui-divider brand-divider"/g) || []).length, 2);
assert.doesNotMatch(formDrawer, /filter-modal__body--empty|EmptyStateBox/);

function event(target, key) {
  return {target, key, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }};
}
function click(target) { document.emit('click', event(target)); }
function key(target, value) { const e = event(target, value); document.emit('keydown', e); return e; }
function single(name, values) {
  const root = new Element(), control = new Element(), menu = new Element(), input = new Element(), text = new Element(), label = new Element();
  root.dataset = {formInput: name, formInputMode: 'single'};
  root.queries.set('.form-input__control', control);
  root.queries.set('.form-input__menu', menu);
  root.queries.set('[data-form-input-selected]', input);
  root.queries.set('[data-form-input-value]', text);
  root.queries.set('.form-input__label', label);
  label.textContent = name;
  menu.hidden = true;
  control.setAttribute('aria-expanded', 'false');
  control.parents.set('.form-input__control', control);
  control.parents.set('.form-input__control, .equipment-date-display', control);
  control.parents.set('.form-input', root);
  control.parents.set('[data-form-input-mode="single"]', root);
  const options = values.map(([value, title]) => {
    const option = new Element(), caption = new Element();
    option.dataset.formInputOption = value;
    caption.textContent = title;
    option.queries.set('.form-input__option-label', caption);
    option.parents.set('[data-form-input-mode="single"]', root);
    option.parents.set('[data-form-input-option]', option);
    option.parents.set('.form-input', root);
    option.parents.set('.form-input__option, .form-input__tag-remove, .equipment-date-popover button', option);
    return option;
  });
  root.queries.set('[data-form-input-option]', options);
  roots.push(root);
  ui.syncSingleFormInput(root, values[0][0]);
  return {root, control, menu, input, text, options};
}
function time() {
  const root = new Element(), control = new Element(), popover = new Element(), input = new Element(), text = new Element(), label = new Element();
  root.dataset.timeInput = 'time';
  label.textContent = 'Time';
  input.value = '08:00';
  const hours = new Element(), minutes = new Element();
  for (const [part, max] of [[hours, '23'], [minutes, '59']]) {
    part.min = '0'; part.max = max; part.step = '1';
    part.parents.set('[data-time-input]', root);
    part.parents.set('[data-time-input-part]', part);
    part.parents.set('.equipment-date-field', root);
    const field = new Element();
    field.queries.set('input[type="number"].form-input__control--text', part);
    part.parents.set('.form-input__text-field', field);
  }
  root.queries.set('[data-time-input-toggle]', control);
  root.queries.set('[data-time-input-popover]', popover);
  root.queries.set('[data-time-input-value]', input);
  root.queries.set('[data-time-input-text]', text);
  root.queries.set('.form-input__label', label);
  root.queries.set('[data-time-input-part="hours"]', hours);
  root.queries.set('[data-time-input-part="minutes"]', minutes);
  root.queries.set('[data-time-input-part]', [hours, minutes]);
  const queryOne = root.querySelector.bind(root);
  root.querySelector = selector => selector === '[data-time-input-part]' ? hours : queryOne(selector);
  control.parents.set('[data-time-input]', root);
  control.parents.set('[data-time-input-toggle]', control);
  control.parents.set('.equipment-date-field', root);
  control.parents.set('.form-input__control, .equipment-date-display', control);
  popover.hidden = true;
  const apply = new Element(), cancel = new Element();
  apply.parents.set('[data-time-input]', root);
  apply.parents.set('[data-time-input-apply]', apply);
  cancel.parents.set('[data-time-input]', root);
  cancel.parents.set('[data-time-input-cancel]', cancel);
  roots.push(root);
  return {root, control, popover, input, text, hours, minutes, apply, cancel};
}

const multiMarkup = ui.renderFormInput({name: 'multi', label: 'Multi', options: ['All', 'First'], allValue: 'All'});
assert.match(multiMarkup, /aria-multiselectable="true"/);
assert.match(multiMarkup, /data-form-input-search/);
const singleMarkup = ui.renderFormInput({name: 'format', label: 'Format', mode: 'single', value: 0, options: [{value: 0, label: 'A & <B>'}, {value: 1, label: 'Other'}]});
assert.match(singleMarkup, /data-form-input-mode="single"/);
assert.match(singleMarkup, /aria-multiselectable="false"/);
assert.match(singleMarkup, /A &amp; &lt;B&gt;/);
assert.match(singleMarkup, /data-form-input-selected value="0"/);
assert.equal((singleMarkup.match(/aria-selected="true"/g) || []).length, 1);
assert.doesNotMatch(singleMarkup, /type="search"|form-input__tag|data-form-input-search/);
assert.doesNotMatch(singleMarkup, /is-touched/);

const first = single('Format', [['pdf', 'PDF'], ['xls', 'Excel'], ['both', 'Both']]);
const second = single('Frequency', [['daily', 'Daily'], ['weekly', 'Weekly']]);
assert.equal(first.root.classList.contains('is-touched'), false, 'Default selection is not a user interaction');
ui.syncSingleFormInput(first.root, 'xls');
assert.equal(first.root.classList.contains('is-touched'), false, 'Data synchronization does not mark the field primary');
ui.syncSingleFormInput(first.root, 'pdf');
click(first.control);
assert.equal(first.menu.hidden, false);
key(first.control, 'ArrowDown');
assert.equal(document.activeElement, first.options[0]);
key(first.options[0], 'ArrowDown');
assert.equal(document.activeElement, first.options[1]);
key(first.options[1], 'End');
assert.equal(document.activeElement, first.options[2]);
key(first.options[2], 'Home');
key(first.options[0], 'ArrowUp');
assert.equal(document.activeElement, first.options[2]);
key(first.options[2], 'Enter');
assert.equal(first.input.value, 'both');
assert.equal(first.text.textContent, 'Both');
assert.equal(first.root.classList.contains('is-touched'), true, 'Keyboard selection marks the field primary');
assert.deepEqual(first.input.events, ['input', 'change']);
assert.equal(first.options.filter(option => option.getAttribute('aria-selected') === 'true').length, 1);
assert.equal(first.menu.hidden, true);
assert.equal(document.activeElement, first.control);

const unchanged = single('Unchanged', [['pdf', 'PDF'], ['xls', 'Excel']]);
click(unchanged.control);
assert.equal(unchanged.root.classList.contains('is-touched'), false, 'Opening alone does not persist an edited state');
click(unchanged.options[0]);
assert.equal(unchanged.root.classList.contains('is-touched'), true, 'Choosing the default explicitly also marks the field primary');
assert.deepEqual(unchanged.input.events, [], 'Choosing the same value does not emit a data change');
const blurred = single('Blurred', [['daily', 'Daily']]);
document.emit('focusout', event(blurred.control));
assert.equal(blurred.root.classList.contains('is-touched'), true, 'Leaving a single-choice control marks its field primary');
click(first.control);
click(first.options[2]);
assert.equal(first.input.value, 'both', 'Selecting again cannot deselect the only value');
assert.equal(first.input.events.length, 2);
ui.syncSingleFormInput(first.root, 'unknown');
assert.equal(first.input.value, 'both');
click(first.control);
click(second.control);
assert.equal(first.menu.hidden, true);
assert.equal(second.menu.hidden, false);
assert.equal(key(second.control, 'Escape').stopped, true, 'Escape closes the list before the enclosing drawer');
assert.equal(document.activeElement, second.control);
click(first.control);
click(new Element());
assert.equal(first.menu.hidden, true);

const timeMarkup = ui.renderTimeField({name: 'time', label: 'Time', value: '09:15'});
assert.match(timeMarkup, /class="equipment-date-display typography-body-smallest"/);
assert.match(timeMarkup, /class="equipment-date-popover"/);
assert.match(timeMarkup, /data-time-input-value value="09:15"/);
assert.match(timeMarkup, /min="0" max="23"/);
assert.match(timeMarkup, /min="0" max="59"/);
assert.match(timeMarkup, /data-form-input-number-stepper/);
const timeFooter = timeMarkup.match(/<div class="equipment-date-popover__footer">([\s\S]*?)<\/div>/)[1];
assert.equal((timeFooter.match(/equipment-date-popover__action button-smallest-ghost typography-button-smallest/g) || []).length, 2);
assert.match(timeFooter, /data-time-input-cancel><svg[\s\S]*?#Cross[\s\S]*?<\/svg><span>Отмена<\/span>/);
assert.doesNotMatch(timeFooter, /button-smallest-(?:primary|secondary)-radius/);
assert.doesNotMatch(timeMarkup, /type="time"|type="search"|#[0-9a-fA-F]{6}/);
assert.doesNotMatch(timeMarkup, /is-touched/);
assert.match(ui.icon('clock'), /width="24" height="24"/);
assert.match(ui.icon('clock'), /M12\.5 6\.75C12\.5 6\.33579/);
assert.match(ui.icon('clock'), /fill="currentColor"/);
const picker = time();
assert.equal(ui.setTimeFieldValue(picker.root, '08:00'), true);
assert.equal(picker.root.classList.contains('is-touched'), false, 'A default time and programmatic synchronization remain tertiary');
click(first.control);
click(picker.control);
assert.equal(first.menu.hidden, true);
assert.equal(picker.popover.hidden, false);
assert.equal(picker.hours.value, '08');
assert.equal(picker.minutes.value, '00');
picker.hours.value = '9'; picker.minutes.value = '5';
click(picker.apply);
assert.equal(picker.input.value, '09:05');
assert.equal(picker.text.textContent, '09:05');
assert.equal(picker.root.classList.contains('is-touched'), true);
assert.equal(picker.popover.hidden, true);
assert.deepEqual(picker.input.events, ['input', 'change']);
assert.equal(document.activeElement, picker.control);
click(picker.control);
picker.hours.value = '22';
click(picker.cancel);
assert.equal(picker.input.value, '09:05');
click(picker.control);
assert.equal(picker.hours.value, '09', 'Canceled draft resets on reopening');
picker.hours.value = '24';
click(picker.apply);
assert.equal(picker.input.value, '09:05');
assert.equal(picker.popover.hidden, false);
assert.equal(document.activeElement, picker.hours);
picker.hours.value = '0'; picker.minutes.value = '60';
assert.equal(ui.applyTimeField(picker.root), false);
picker.minutes.value = '1.5';
assert.equal(ui.applyTimeField(picker.root), false);
picker.minutes.value = '';
assert.equal(ui.applyTimeField(picker.root), false);
picker.minutes.value = '0';
key(picker.minutes, 'Enter');
assert.equal(picker.input.value, '00:00');
picker.control.rect = {top: 780, bottom: 820, height: 40};
click(picker.control);
assert.equal(picker.root.classList.contains('is-open-up'), true);
assert.equal(key(picker.hours, 'Escape').stopped, true);
assert.equal(picker.popover.hidden, true);
assert.equal(document.activeElement, picker.control);
click(picker.control);
click(second.control);
assert.equal(picker.popover.hidden, true);
assert.equal(ui.setTimeFieldValue(picker.root, '23:59'), true);
assert.equal(ui.setTimeFieldValue(picker.root, '24:00'), false);
assert.equal(picker.input.value, '23:59');

const sameTime = time();
click(sameTime.control);
click(sameTime.apply);
assert.equal(sameTime.root.classList.contains('is-touched'), true, 'Explicitly applying the default time marks it primary');
assert.deepEqual(sameTime.input.events, []);
const blurredTime = time();
document.emit('focusout', event(blurredTime.control));
assert.equal(blurredTime.root.classList.contains('is-touched'), true);

const multiRoot = new Element(), multiOption = new Element();
multiOption.parents.set('.form-input', multiRoot);
multiOption.parents.set('.form-input__option, .form-input__tag-remove, .equipment-date-popover button', multiOption);
click(multiOption);
assert.equal(multiRoot.classList.contains('is-touched'), true, 'The existing multiselect uses the same interaction state');
const dateRoot = new Element(), dateDay = new Element();
dateDay.parents.set('.equipment-date-field', dateRoot);
dateDay.parents.set('.form-input__option, .form-input__tag-remove, .equipment-date-popover button', dateDay);
click(dateDay);
assert.equal(dateRoot.classList.contains('is-touched'), true, 'The existing calendar uses the same interaction state');

const procurement = await read('assets/js/pages/procurement.js');
assert.match(procurement, /ui\.renderFormInput\(\{\s*name: "procurement-priority", label: "Приоритет", mode: "single"/);
assert.match(procurement, /ui\.syncSingleFormInput\(root, value\)/);
assert.doesNotMatch(procurement, /data-procurement-priority-option|data-procurement-priority-trigger/);
const css = await read('assets/css/components.css');
const tokens = await read('assets/css/tokens.css');
const componentRule = selector => css.slice(css.indexOf(`${selector} {`), css.indexOf('}', css.indexOf(`${selector} {`)));
assert.match(tokens, /--form-input-control-height: 40px;/);
for (const selector of ['.form-input__control', '.equipment-date-input']) {
  const rule = componentRule(selector);
  assert.match(rule, /box-sizing: border-box;/, `${selector}: borders are included in the shared height`);
  assert.match(rule, /\n  height: var\(--form-input-control-height\);/);
  assert.match(rule, /min-height: var\(--form-input-control-height\);/);
}
for (const selector of ['.form-input__control', '.equipment-date-display']) {
  const rule = componentRule(selector);
  assert.match(rule, /align-items: center;/, `${selector}: text and icons are vertically centered`);
  assert.match(rule, /padding: 0 var\(--space-2\);/, `${selector}: vertical padding cannot enlarge the control`);
  assert.match(rule, /font-family: var\(--font-family-primary\);/);
  for (const property of ['size', 'line-height', 'weight', 'letter-spacing']) {
    assert.ok(rule.includes(`var(--typography-body-smallest-${property})`), `${selector}: ${property} follows the same token`);
  }
}
assert.match(componentRule('.equipment-date-display'), /height: 100%;/);
assert.match(componentRule('.equipment-date-display'), /min-height: 0;/);
assert.match(componentRule('textarea.form-input__control--text'), /height: auto;/, 'Multiline textareas retain their natural height');
assert.match(tokens, /--typography-body-smallest-size: clamp\(12px, \.833333vw, 16px\);/);
assert.match(tokens, /--typography-body-smallest-line-height: clamp\(16px, 1\.111111vw, 21\.333333px\);/);
assert.match(css, /\.filter-modal__head\s*\{[^}]*align-items: first baseline;/, 'Single-line drawer titles and close buttons align on the baseline');
assert.match(css, /\.filter-modal__head\.is-title-long\s*\{[^}]*align-items: flex-start;/, 'Multiline drawer titles and close buttons align at the top');
assert.doesNotMatch(await read('assets/js/pages/equipment.js'), /syncFilterHeaderFlow|is-title-long/, 'Equipment uses the shared header without local line-count measurements');
assert.match(css, /\.filter-modal__body--empty\s*\{[^}]*grid-template-rows: minmax\(0, 1fr\);[^}]*overflow: auto;/);
assert.match(css, /\.filter-modal__body--empty > \.empty-state\s*\{[^}]*min-height: min-content;/);
assert.match(css, /\.form-input__menu:not\(:has\(\.form-input__search\)\)\s*\{\s*--form-input-menu-search-height: 0px;/);
assert.match(css, /\.form-input__control--text\s*\{[^}]*color: var\(--text-tertiary\);/);
assert.match(css, /\.form-input__control--text::placeholder\s*\{\s*color: inherit;\s*opacity: 1;/);
assert.match(css, /\.form-input__control--text:focus\s*\{[^}]*color: var\(--text-primary\);/);
assert.match(css, /\.form-input\.is-touched \.form-input__control--text,\s*\.form-input__control--text\.is-touched\s*\{\s*color: var\(--text-primary\);/);
assert.match(css, /\.form-input__value\s*\{[^}]*color: var\(--text-tertiary\);/);
assert.match(css, /\.form-input\.is-touched \.form-input__value,[^{]*\{\s*color: var\(--text-primary\);/);
assert.match(css, /\.equipment-date-display\s*\{[^}]*color: var\(--text-tertiary\);/);
assert.match(css, /\.equipment-date-field\.is-touched \.equipment-date-display,[^{]*\{\s*color: var\(--text-primary\);/);
assert.doesNotMatch(css, /\.form-input\.has-selection \.form-input__value|\.equipment-date-field\.has-value \.equipment-date-display|\.form-input\.is-explicit-all \.form-input__all/);
for (const selector of ['.form-input__all', '.form-input__empty', '.form-input__tag.pill.pill--default', '.form-input__tag-count.pill.pill--default', '.form-input__tag-count-value']) {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, selector);
  assert.match(css.slice(start, css.indexOf('}', start)), /color: inherit;/, selector);
}
function textField(value = '') {
  const control = new Element(), field = new Element();
  control.value = value;
  control.parents.set('.form-input__control--text', control);
  control.parents.set('.form-input__control, .equipment-date-display', control);
  control.parents.set('.form-input', field);
  return {control, field};
}
const untouched = textField();
assert.equal(untouched.control.classList.contains('is-touched'), false);
document.emit('focusin', event(untouched.control));
assert.equal(untouched.control.classList.contains('is-touched'), false, 'Entering alone does not change the persistent state');
document.emit('focusout', event(untouched.control));
assert.equal(untouched.control.classList.contains('is-touched'), true, 'Leaving an empty field keeps its text and placeholder primary');
assert.equal(untouched.field.classList.contains('is-touched'), true);
const recipient = textField();
recipient.control.value = 'recipient@example.com';
document.emit('input', event(recipient.control));
assert.equal(recipient.control.classList.contains('is-touched'), true, 'Input immediately marks the value primary');
assert.equal(recipient.field.classList.contains('is-touched'), true);
recipient.control.value = '';
document.emit('input', event(recipient.control));
assert.equal(recipient.control.classList.contains('is-touched'), true, 'Clearing a previously edited value does not reset it to tertiary');
const untouchedDefault = textField('Management report');
assert.equal(untouchedDefault.control.classList.contains('is-touched'), false, 'An untouched prefilled default remains tertiary');
const readOnlyField = textField('Source value'); readOnlyField.control.readOnly = true;
document.emit('focusout', event(readOnlyField.control)); document.emit('input', event(readOnlyField.control));
assert.equal(readOnlyField.control.classList.contains('is-touched'), false, 'Readonly controls do not gain an interaction state');
assert.match(css, /\.form-input__control--text\[readonly\][^{]*\{[^}]*color: var\(--text-primary\);[^}]*opacity: 1;[^}]*cursor: default;/);
const dropdownMarkup = ui.renderDropdown({id: 'dataset', label: 'Dataset', size: 'small', value: 'a', options: [{value: 'a', label: 'A & <B>', count: 0}, {value: 'b', label: 'Second', count: 2}]});
assert.match(dropdownMarkup, /dt3-zone-dropdown ui-dropdown ui-dropdown--small/);
assert.match(dropdownMarkup, /A &amp; &lt;B&gt; <span class="ui-dropdown__count">\(0\)/);
assert.match(dropdownMarkup, /aria-controls="dataset-options"/);
assert.match(dropdownMarkup, /ui-dropdown__option typography-caption-small is-selected/);
assert.match(dropdownMarkup, /ui-dropdown__option typography-body-small"/);
assert.doesNotMatch(dropdownMarkup, /typography-body-smallest/);
assert.match(ui.renderDropdownOptions([{value: 'a', label: 'A'}], 'a'), /typography-caption-smallest is-selected/);
const scopedSearch = ui.renderScopedSearch({id: 'catalog-search', label: 'Find & <item>', query: '\"><test>', scope: 'forms', options: [{value: 'all', label: 'All'}, {value: 'blocks', label: 'Blocks'}, {value: 'forms', label: 'Forms'}]});
assert.match(scopedSearch, /class="dt3-multisearch shell-search" role="search" aria-label="Find &amp; &lt;item&gt;" data-scoped-search="catalog-search"/);
assert.match(scopedSearch, /class="dt3-multisearch-field shell-search-field"/);
assert.match(scopedSearch, /class="dt3-search-scope ui-dropdown" data-ui-dropdown="catalog-search-scope" data-value="forms"/);
assert.match(scopedSearch, /dt3-search-scope-trigger ui-dropdown__trigger typography-caption-smallest[^]*?aria-expanded="false" aria-controls="catalog-search-scope-options"[^]*?data-ui-dropdown-label>Forms/);
assert.match(scopedSearch, /dt3-search-scope-menu ui-dropdown__menu ui-scrollbar" role="listbox"[^>]* hidden/);
assert.match(scopedSearch, /dt3-search-scope-option ui-dropdown__option typography-caption-smallest is-selected[^]*?aria-selected="true" data-ui-dropdown-option="forms"/);
assert.match(scopedSearch, /type="search" value="&quot;&gt;&lt;test&gt;" placeholder="Find &amp; &lt;item&gt;"/);
assert.match(scopedSearch, /dt3-search-submit shell-search-button" type="submit"/);
assert.doesNotMatch(scopedSearch, /dt3-zone-dropdown|data-search-scope|data-equipment-search-scope|<select/);
assert.doesNotMatch(css, /\.ui-dropdown\.ui-dropdown--small\s*\{[^}]*max-width:/, 'The trigger still hugs its contents');
assert.match(css, /\.ui-dropdown\.ui-dropdown--small\s*\{[^}]*--ui-dropdown-trigger-min-width: 0;/);
assert.match(css, /\.ui-dropdown\.ui-dropdown--small \.ui-dropdown__menu\s*\{[^}]*width: min\(300px,[^}]*min-width: 0;/);
assert.match(css, /\.ui-dropdown\.ui-dropdown--small \.ui-dropdown__menu\s*\{[^}]*right: 0;[^}]*left: auto;/, 'The menu stays inside the right-aligned page actions');
assert.match(css, /\.ui-dropdown--small \.ui-dropdown__option\s*\{[^}]*white-space: normal;[^}]*font-size: var\(--typography-body-small-size\);/);
assert.match(css, /\.ui-dropdown\.ui-dropdown--small \.ui-dropdown__option\.is-selected,[^{]*\{[^}]*font-size: var\(--typography-caption-small-size\);/);
const drop = new Element(), dropTrigger = new Element(), dropMenu = new Element(), dropLabel = new Element();
drop.dataset.uiDropdown = 'dataset';
drop.classList.add('ui-dropdown--small');
drop.queries.set('.ui-dropdown__trigger', dropTrigger);
drop.queries.set('.ui-dropdown__menu', dropMenu);
drop.queries.set('[data-ui-dropdown-label]', dropLabel);
dropTrigger.parents.set('[data-ui-dropdown]', drop);
dropTrigger.parents.set('.ui-dropdown__trigger', dropTrigger);
const dropOptions = ['a', 'b'].map(value => {
  const option = new Element(); option.dataset.uiDropdownOption = value; option.innerHTML = `<span>${value}</span>`;
  option.parents.set('[data-ui-dropdown]', drop); option.parents.set('[data-ui-dropdown-option]', option);
  return option;
});
drop.queries.set('[data-ui-dropdown-option]', dropOptions);
const dropQuery = drop.querySelector.bind(drop);
drop.querySelector = selector => selector === '[data-ui-dropdown-option][aria-selected="true"]' ? dropOptions.find(option => option.getAttribute('aria-selected') === 'true') : selector === '[data-ui-dropdown-option]' ? dropOptions[0] : dropQuery(selector);
roots.push(drop);
ui.syncDropdown(drop, 'a');
click(dropTrigger);
assert.equal(dropTrigger.getAttribute('aria-expanded'), 'true');
assert.equal(dropMenu.hidden, false);
key(dropOptions[0], 'End'); assert.equal(document.activeElement, dropOptions[1]);
click(dropOptions[1]);
assert.equal(drop.dataset.value, 'b');
assert.deepEqual(drop.events, ['change']);
assert.equal(dropLabel.innerHTML, '<span>b</span>');
assert.equal(dropOptions[0].getAttribute('aria-selected'), 'false');
assert.equal(dropOptions[1].getAttribute('aria-selected'), 'true');
assert.equal(dropOptions[1].classList.contains('typography-caption-small'), true);
assert.equal(dropOptions[1].classList.contains('typography-body-small'), false);
assert.equal(dropOptions[0].classList.contains('typography-body-small'), true);
assert.equal(dropOptions[0].classList.contains('typography-caption-small'), false);
assert.equal(document.activeElement, dropTrigger);
key(dropTrigger, 'ArrowDown'); assert.equal(document.activeElement, dropOptions[1]);
assert.equal(key(dropOptions[1], 'Escape').stopped, true);
assert.equal(dropMenu.hidden, true);
click(dropTrigger); click(new Element()); assert.equal(dropMenu.hidden, true);
const searchScope = new Element(), scopeTrigger = new Element(), scopeMenu = new Element(), scopeLabel = new Element();
searchScope.dataset.uiDropdown = 'catalog-search-scope'; searchScope.classList.add('dt3-search-scope');
searchScope.queries.set('.ui-dropdown__trigger', scopeTrigger);
searchScope.queries.set('.ui-dropdown__menu', scopeMenu);
searchScope.queries.set('[data-ui-dropdown-label]', scopeLabel);
scopeTrigger.parents.set('[data-ui-dropdown]', searchScope); scopeTrigger.parents.set('.ui-dropdown__trigger', scopeTrigger);
const scopeOptions = ['all', 'blocks', 'forms'].map(value => {
  const option = new Element(); option.dataset.uiDropdownOption = value; option.innerHTML = `<span>${value}</span>`;
  option.parents.set('[data-ui-dropdown]', searchScope); option.parents.set('[data-ui-dropdown-option]', option);
  return option;
});
searchScope.queries.set('[data-ui-dropdown-option]', scopeOptions);
const scopeQuery = searchScope.querySelector.bind(searchScope);
searchScope.querySelector = selector => selector === '[data-ui-dropdown-option][aria-selected="true"]' ? scopeOptions.find(option => option.getAttribute('aria-selected') === 'true') : selector === '[data-ui-dropdown-option]' ? scopeOptions[0] : scopeQuery(selector);
roots.push(searchScope); ui.syncDropdown(searchScope, 'all');
key(scopeTrigger, 'ArrowDown'); assert.equal(document.activeElement, scopeOptions[0]);
key(scopeOptions[0], 'End'); assert.equal(document.activeElement, scopeOptions[2]);
click(scopeOptions[2]);
assert.equal(searchScope.dataset.value, 'forms');
assert.deepEqual(searchScope.events, ['change']);
assert.equal(scopeLabel.innerHTML, '<span>forms</span>');
assert.equal(scopeOptions[2].getAttribute('aria-selected'), 'true');
assert.equal(scopeOptions[2].classList.contains('typography-caption-smallest'), true);
assert.equal(scopeOptions[0].classList.contains('typography-body-smallest'), true);
assert.equal(scopeMenu.hidden, true); assert.equal(document.activeElement, scopeTrigger);
click(scopeTrigger); key(scopeOptions[2], 'Escape'); assert.equal(scopeMenu.hidden, true);
click(scopeTrigger); click(new Element()); assert.equal(scopeMenu.hidden, true);
const searchForm = new Element(), searchInput = new Element(), searchSubmit = new Element();
searchForm.setAttribute('data-scoped-search', 'catalog-search');
searchForm.dataset.scopedSearchActive = 'false'; searchForm.dataset.scopedSearchQuery = '';
searchForm.queries.set('input[type="search"]', searchInput);
searchForm.queries.set('[data-scoped-search-submit]', searchSubmit);
searchForm.queries.set('[data-ui-dropdown]', searchScope);
searchInput.type = 'search'; searchInput.parents.set('[data-scoped-search]', searchForm);
searchSubmit.setAttribute('data-scoped-search-submit', ''); searchSubmit.parents.set('[data-scoped-search-submit]', searchSubmit); searchSubmit.parents.set('[data-scoped-search]', searchForm);
searchScope.setAttribute('data-ui-dropdown', 'catalog-search-scope'); searchScope.parents.set('[data-scoped-search]', searchForm);
const submitBindings = document.listeners.get('submit').length;
ui.bindScopedSearches(); assert.equal(document.listeners.get('submit').length, submitBindings, 'Scoped search binding is idempotent');
searchInput.value = ' typed query ';
document.emit('input', event(searchInput));
assert.equal(searchForm.events.length, 0, 'Typing a nonempty query does not apply search');
assert.equal(key(searchInput, 'Enter').prevented, true);
assert.deepEqual(JSON.parse(JSON.stringify(searchForm.details.at(-1))), {active: true, query: 'typed query', scope: 'forms'});
assert.equal(searchSubmit.type, 'button'); assert.equal(searchSubmit.getAttribute('aria-label'), 'Очистить поиск');
assert.equal(searchSubmit.innerHTML, ui.icon('close'));
searchInput.value = 'next query'; document.emit('input', event(searchInput));
assert.equal(searchForm.details.at(-1).query, 'typed query', 'Active results retain their last applied query');
click(scopeOptions[0]);
document.emit('change', event(searchScope));
assert.equal(searchForm.details.at(-1).scope, 'all'); assert.equal(searchForm.details.at(-1).query, 'typed query');
key(searchInput, 'Enter'); assert.equal(searchForm.details.at(-1).query, 'next query');
click(searchSubmit);
assert.equal(searchInput.value, ''); assert.equal(document.activeElement, searchInput);
assert.equal(searchSubmit.type, 'submit'); assert.equal(searchSubmit.getAttribute('aria-label'), 'Найти');
assert.equal(searchSubmit.innerHTML, ui.icon('search')); assert.equal(searchForm.details.at(-1).active, false);
searchInput.value = 'new query';
document.emit('submit', event(searchForm));
assert.equal(searchForm.details.at(-1).active, true);
searchInput.value = ''; document.emit('input', event(searchInput));
assert.equal(searchForm.details.at(-1).active, false); assert.equal(searchSubmit.innerHTML, ui.icon('search'));
assert.match(ui.renderScopedSearch({id: 'active-search', label: 'Search', active: true, query: 'draft', appliedQuery: 'applied'}), /data-scoped-search-active="true" data-scoped-search-query="applied"[^]*?value="draft"[^]*?type="button" data-scoped-search-submit aria-label="Очистить поиск"/);

assert.equal(ui.parseDate('2025-02-29'), null);
assert.equal(ui.parseDate('2024-02-29')?.getDate(), 29);
assert.equal(ui.parseDate('2026-04-31'), null);
assert.equal(ui.formatDate('2024-02-29'), '29.02.2024');
const dateMarkup = ui.renderDateField({name: 'from', label: 'From', value: '2024-02-29'});
assert.match(dateMarkup, /equipment-date-field has-value/);
assert.match(dateMarkup, /data-bnt-date-text>29\.02\.2024/);
assert.doesNotMatch(dateMarkup, /is-touched/);
const calendar = new Element(), dateToggle = new Element(), dateInput = new Element(), dateText = new Element(), datePopover = new Element(), dateControl = new Element();
calendar.setAttribute('data-bnt-date-root', 'from');
calendar.dataset.dateMin = '2024-02-01'; calendar.dataset.dateMax = '2024-02-29';
for (const [selector, value] of [['[data-bnt-date-toggle]', dateToggle], ['[data-bnt-date]', dateInput], ['[data-bnt-date-text]', dateText], ['[data-bnt-date-popover]', datePopover], ['.equipment-date-input', dateControl]]) calendar.queries.set(selector, value);
dateToggle.parents.set('[data-bnt-date-root]', calendar); dateToggle.parents.set('[data-bnt-date-toggle]', dateToggle);
datePopover.hidden = true;
roots.push(calendar);
ui.syncDateField(calendar, '2024-02-29');
assert.equal(calendar.classList.contains('is-touched'), false);
click(dateToggle);
assert.equal(dateToggle.getAttribute('aria-expanded'), 'true');
assert.equal((datePopover.innerHTML.match(/data-bnt-date-day=/g) || []).length, 42);
assert.match(datePopover.innerHTML, /data-bnt-date-day="2024-02-29" aria-pressed="true"/);
assert.match(datePopover.innerHTML, /data-bnt-date-day="2024-03-01" aria-pressed="false" disabled/);
assert.match(datePopover.innerHTML, /button-smallest-ghost typography-button-smallest/);
dateControl.rect = {top: 780, bottom: 820}; datePopover.scrollHeight = 360;
ui.positionDatePicker(calendar); assert.equal(calendar.classList.contains('is-open-up'), true);
assert.equal(key(dateToggle, 'Escape').stopped, true);
assert.equal(datePopover.hidden, true);
click(dateToggle);
const pickedDay = new Element(); pickedDay.setAttribute('data-bnt-date-day', '2024-02-14');
pickedDay.parents.set('[data-bnt-date-root]', calendar); pickedDay.parents.set('[data-bnt-date-day]', pickedDay);
click(pickedDay);
assert.equal(dateInput.value, '2024-02-14');
assert.equal(dateText.textContent, '14.02.2024');
assert.equal(calendar.classList.contains('is-touched'), true);
assert.deepEqual(dateInput.events, ['change']);
assert.equal(datePopover.hidden, true);
const clearDate = new Element(); clearDate.parents.set('[data-bnt-date-root]', calendar); clearDate.parents.set('[data-bnt-date-clear]', clearDate);
click(dateToggle); click(clearDate);
assert.equal(dateInput.value, '');
assert.equal(calendar.classList.contains('is-touched'), true);
assert.equal(calendar.classList.contains('has-value'), false);
click(dateToggle); click(dropTrigger); assert.equal(datePopover.hidden, true, 'The shared dropdown closes the shared calendar');
ui.touchFormInput(null);
const summaryGroups = [{key: 'forms', label: 'Forms', values: [{value: 'first', label: 'A & <B>'}, {value: 'second', label: 'Second'}]}, {key: 'charts', label: 'Charts', values: []}];
const countedSummary = ui.renderFilterSummary(summaryGroups, {counted: true, readonly: true});
const editableSummary = ui.renderFilterSummary(summaryGroups, {counted: true});
const summaryClasses = markup => [...markup.matchAll(/class="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(summaryClasses(countedSummary), summaryClasses(editableSummary), 'Read-only lists reproduce the entire reference component, without a substitute layout');
assert.equal((countedSummary.match(/#Cross/g) || []).length, 2);
assert.match(countedSummary, /data-filter-summary-group="forms"[^]*?Forms \(2\)/);
assert.doesNotMatch(countedSummary, /data-filter-summary-group="charts"|Charts \(0\)/, 'Empty counted groups are omitted instead of showing a disabled zero');
assert.match(countedSummary, /filter-summary__rollover-item[^]*?A &amp; &lt;B&gt;/);
assert.doesNotMatch(countedSummary, /data-equipment-filter-remove|filter-summary__rollover-item--readonly/);
assert.equal((countedSummary.match(/class="form-input__tag-remove" type="button" disabled tabindex="-1"/g) || []).length, 2);
const menuIds = [...countedSummary.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(menuIds).size, 1);
for (const id of menuIds) assert.ok(countedSummary.includes(`id="${id}"`));
assert.equal((countedSummary.match(/role="listitem"/g) || []).length, 2);
assert.match(ui.renderFilterSummary(summaryGroups.slice(0, 1)), /filter-summary__pill[^]*?data-equipment-filter-remove-value="forms" data-equipment-filter-remove-item="first"/);
assert.doesNotMatch(ui.renderFilterSummary(summaryGroups.slice(0, 1)), /data-filter-summary-toggle/, 'One applied filter retains the original value-pill variant');
assert.match(ui.renderFilterSummary(summaryGroups), /data-equipment-filter-remove-item="second"/);
assert.equal(ui.renderFilterSummary([]), '');
assert.equal(ui.renderFilterSummary([{key: 'empty', label: 'Empty', values: []}], {counted: true}), '');
assert.equal(ui.renderFilterSummary([{key: 'empty', label: 'Empty', count: 0, values: []}], {counted: true}), '');
assert.match(ui.renderFilterSummary([{key: 'loaded', label: 'Loaded', count: 3, values: []}], {counted: true}), /Loaded \(3\)/, 'An explicit nonzero count remains supported');
assert.deepEqual(summaryGroups[1].values, [], 'Rendering does not mutate the supplied groups');
for (const path of ['equipment', 'procurement']) {
  const page = await read(`assets/js/pages/${path}.js`);
  assert.match(page, /ui\.renderFilterSummary\(groups, /);
  assert.match(page, /ui\.closeFilterSummaryMenus\(except, filterSummary\)/);
  assert.doesNotMatch(page, /function filterSummary(?:Menu|Group|ValuePill)|data-equipment-filter-summary-(?:toggle|group|menu)/);
  assert.match(page, /data-equipment-filter-remove-value/, 'The data adapter retains the existing remove contract');
}
document.documentElement = {clientWidth: 1440, clientHeight: 900};
window.getComputedStyle = () => ({getPropertyValue: () => '12px'});
function summary(name) {
  const root = new Element(), toggle = new Element(), menu = new Element();
  root.dataset.filterSummaryGroup = name;
  root.rect = {left: 1300, bottom: 200}; menu.offsetWidth = 280;
  const properties = new Map(); menu.style = {setProperty: (name, value) => properties.set(name, value)};
  root.queries.set('[data-filter-summary-toggle]', toggle);
  root.queries.set('[data-filter-summary-menu]', menu);
  toggle.parents.set('[data-filter-summary-group]', root);
  toggle.parents.set('[data-filter-summary-toggle]', toggle);
  menu.parents.set('[data-filter-summary-group]', root);
  toggle.setAttribute('aria-expanded', 'false'); menu.hidden = true;
  roots.push(root);
  return {root, toggle, menu, properties};
}
const formsSummary = summary('forms'), chartsSummary = summary('charts');
click(formsSummary.toggle);
assert.equal(formsSummary.menu.hidden, false);
assert.equal(formsSummary.toggle.getAttribute('aria-expanded'), 'true');
assert.equal(formsSummary.root.classList.contains('is-open'), true);
assert.equal(formsSummary.properties.get('--filter-summary-menu-max-height'), '686px');
assert.equal(formsSummary.properties.get('--filter-summary-menu-offset'), '-152px', 'The shared rollover stays inside the viewport');
click(formsSummary.menu); assert.equal(formsSummary.menu.hidden, false, 'Read-only entries do not close the list');
click(chartsSummary.toggle);
assert.equal(formsSummary.menu.hidden, true);
assert.equal(formsSummary.toggle.getAttribute('aria-expanded'), 'false');
assert.equal(chartsSummary.menu.hidden, false);
assert.equal(key(chartsSummary.toggle, 'Escape').stopped, true);
assert.equal(chartsSummary.menu.hidden, true);
assert.equal(document.activeElement, chartsSummary.toggle);
click(formsSummary.toggle); click(formsSummary.toggle); assert.equal(formsSummary.menu.hidden, true);
click(formsSummary.toggle); click(new Element()); assert.equal(formsSummary.menu.hidden, true);
click(formsSummary.toggle); document.emit('focusin', event(new Element())); assert.equal(formsSummary.menu.hidden, true);
chartsSummary.toggle.disabled = true; click(chartsSummary.toggle); assert.equal(chartsSummary.menu.hidden, true);
click(formsSummary.toggle); click(first.control); assert.equal(formsSummary.menu.hidden, true, 'Opening a form control closes the rollover');
click(formsSummary.toggle); assert.equal(first.menu.hidden, true, 'Opening the rollover closes form dropdowns');
ui.closeFilterSummaryMenus();
assert.match(css, /\.badge\.mustard\s*\{[^}]*background: var\(--system-elements-semantic-mustard-secondary-fade\);[^}]*color: var\(--system-elements-semantic-mustard-primary\)/);
assert.match(css, /\.scenario-copy\s*\{[^}]*gap: var\(--space-2\)/);
assert.match(css, /\.filter-summary__rollover\.form-input__tag-rollover\s*\{[^}]*overflow-y: auto/);
assert.doesNotMatch(css, /filter-summary__rollover-item--readonly/);
const dropdownMenuRule = css.match(/\.dt3-zone-dropdown \.ui-dropdown__menu\s*\{([^}]+)\}/)?.[1];
assert.ok(dropdownMenuRule);
assert.match(dropdownMenuRule, /max-height: min\(480px, calc\(100vh - var\(--space-6\) \* 2\)\)/);
assert.match(dropdownMenuRule, /overflow: auto/);
for (const [, token] of dropdownMenuRule.matchAll(/var\((--space-\d+)\)/g)) {
  assert.ok(tokens.includes(`${token}:`), `Dropdown height and width use a defined token: ${token}`);
}
console.log('Shared form fields: procurement single-choice contract, no search, escaping, keyboard, exclusive selection, events, time popup, clock, numeric validation, apply/cancel, midnight, Escape, positioning and unchanged multiselect passed.');
