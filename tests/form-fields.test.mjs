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
  dispatchEvent(event) { this.events.push(event.type); }
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
vm.runInNewContext(await read('assets/js/ui.js'), {window, document, Event, requestAnimationFrame: callback => callback()});
const ui = window.BNTUI;

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
const dropdownMarkup = ui.renderDropdown({id: 'dataset', label: 'Dataset', size: 'small', value: 'a', options: [{value: 'a', label: 'A & <B>', count: 0}, {value: 'b', label: 'Second', count: 2}]});
assert.match(dropdownMarkup, /dt3-zone-dropdown ui-dropdown ui-dropdown--small/);
assert.match(dropdownMarkup, /A &amp; &lt;B&gt; <span class="ui-dropdown__count">\(0\)/);
assert.match(dropdownMarkup, /aria-controls="dataset-options"/);
const drop = new Element(), dropTrigger = new Element(), dropMenu = new Element(), dropLabel = new Element();
drop.dataset.uiDropdown = 'dataset';
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
assert.equal(document.activeElement, dropTrigger);
key(dropTrigger, 'ArrowDown'); assert.equal(document.activeElement, dropOptions[1]);
assert.equal(key(dropOptions[1], 'Escape').stopped, true);
assert.equal(dropMenu.hidden, true);
click(dropTrigger); click(new Element()); assert.equal(dropMenu.hidden, true);

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
console.log('Shared form fields: procurement single-choice contract, no search, escaping, keyboard, exclusive selection, events, time popup, clock, numeric validation, apply/cancel, midnight, Escape, positioning and unchanged multiselect passed.');
