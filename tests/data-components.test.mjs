import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('legacy/report-studio-v5/app.js');
const uiSource = await read('assets/js/ui.js');
const html = await read('data.html');
const css = await read('assets/css/components.css');
const icons = await read('assets/icons/financial-interface.svg');

class Element {
  innerHTML = '';
  dataset = {};
  value = '';
  queries = new Map();
  attributes = new Map();
  listeners = new Map();
  classes = new Set();
  classList = {
    add: (...names) => names.forEach(name => this.classes.add(name)),
    remove: (...names) => names.forEach(name => this.classes.delete(name)),
    contains: name => this.classes.has(name),
    toggle: (name, force = !this.classes.has(name)) => force ? this.classes.add(name) : this.classes.delete(name)
  };
  addEventListener(type, listener) { const list = this.listeners.get(type) || []; list.push(listener); this.listeners.set(type, list); }
  emit(type, event) { for (const listener of this.listeners.get(type) || []) { listener(event); if (event.stopped) break; } }
  querySelector(selector) { return this.queries.get(selector) || null; }
  querySelectorAll(selector) { return this.queries.get(selector) || []; }
  hasAttribute(name) { return this.attributes.has(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) || null; }
  removeAttribute(name) { this.attributes.delete(name); }
  matches(selector) { return selector === '[data-ui-dropdown="data-kind"]' && this.dataset.uiDropdown === 'data-kind'; }
  closest(selector) {
    if (selector === '[data-action]' && this.dataset.action) return this;
    if (selector === '[data-close]' && this.hasAttribute('data-close')) return this;
    if (selector === '[data-source-edit]' && this.hasAttribute('data-source-edit')) return this;
    return null;
  }
  focus() { this.focused = true; }
  reportValidity() { return this.value !== '' && Number.isFinite(Number(this.value)); }
}

const fixture = {
  datasets: [1, 2].flatMap(source => [2024, 2025, 2026].flatMap(year => ['metrics', 'fi'].map(kind => ({
    id: `${source}-${year}-${kind}`, source, year, kind, basis: 'actual',
    rows: [{id: `${kind}-1`, code: 'CODE', name: 'Value & <test>', values: Array.from({length: 12}, (_, month) => (month + 1) * 1000)}]
  }))))
};
async function mount(saved = {}, data = fixture) {
  const elements = new Map(['#page-content', '#modal-root', '#template-import'].map(id => [id, new Element()]));
  const root = elements.get('#page-content'), modal = elements.get('#modal-root');
  let stored = JSON.stringify({view: 'reports', ...saved}), destination;
  const document = Object.assign(new Element(), {body: {dataset: {page: 'data'}}, querySelector: selector => elements.get(selector) || null, querySelectorAll: () => []});
  const window = Object.assign(new Element(), {
    BNT_DATA: data, BNT_TEMPLATES: [{id: 'cf-main', name: 'Test report', blocks: []}],
    BNT_REPORTS: {general: {series: ['Actual', 'Plan'], blocks: {general_total_cargo: {unit: 'MT', rows: [{name: 'Oil', values: [120, 180]}, {name: 'Gas', values: [30, 40]}]}}}},
    location: {assign: value => { destination = value; }}
  });
  const context = vm.createContext({window, document, Event, console, requestAnimationFrame: callback => callback(), setTimeout() {}, localStorage: {getItem: () => stored, setItem: (_key, value) => { stored = value; }}});
  vm.runInContext(uiSource, context);
  const notices = [];
  window.BNTUI.toast = (...args) => notices.push(args);
  await vm.runInContext(source, context);
  function input(id, value) { const field = new Element(); field.id = id; field.value = String(value); elements.set(`#${id}`, field); return field; }
  function click(action, dataset = {}, host = root) {
    const target = Object.assign(new Element(), {dataset: {action, ...dataset}});
    host.emit('click', {target, preventDefault() {}});
    return target;
  }
  function changeKind(value) {
    const target = Object.assign(new Element(), {dataset: {uiDropdown: 'data-kind', value}});
    root.emit('change', {target});
  }
  function filter(values = {}) {
    for (const [id, value] of Object.entries({source: 1, year: 2026, 'date-from': '2026-01-01', 'date-to': '2026-07-31', currency: 'USD', unit: 'thousand', ...values})) input(`data-${id}`, value);
  }
  function close() { const target = new Element(); target.setAttribute('data-close', ''); modal.emit('click', {target}); }
  return {root, modal, document, ui: window.BNTUI, notices, elements, click, input, filter, close, changeKind, state: () => JSON.parse(stored), destination: () => destination};
}

const app = await mount();
assert.equal(app.state().view, 'data');
assert.match(html, /<main id="page-content" class="page-content"><\/main>/);
assert.doesNotMatch(html, /report-host|id="app"|styles\.css|report-studio\.css/);
assert.match(app.root.innerHTML, /^<section class="page-title-actions">/);
assert.match(app.root.innerHTML, /<h1 class="typography-h4">Данные<\/h1>/);
assert.doesNotMatch(app.root.innerHTML, /dataset-list|filterbar|class="app"|<aside/);
const actions = app.root.innerHTML.split('class="page-title-actions__buttons"')[1];
assert.ok(actions.indexOf('data-ui-dropdown="data-kind"') < actions.indexOf('data-action="history"'));
assert.ok(actions.indexOf('data-action="history"') < actions.indexOf('data-action="data-filter"'));
assert.match(actions, /dt3-zone-dropdown ui-dropdown ui-dropdown--small/);
assert.match(actions, /Ключевые показатели <span class="ui-dropdown__count">\(1\)<\/span>/);
assert.match(css, /\.ui-dropdown__count\s*\{[^}]*color: var\(--text-tertiary\);/);
assert.match(app.root.innerHTML, /card table-block table-block--sticky-head[\s\S]*table-wrap ui-scrollbar[\s\S]*table class="data-table"/);
assert.match(app.root.innerHTML, /Value &amp; &lt;test&gt;/);
assert.match(icons, /symbol id="History"/);
assert.match(icons, /symbol id="NewChart"/);

function sharedDrawer(id) {
  assert.match(app.modal.innerHTML, new RegExp(`id="${id}" class="filter-modal"`));
  assert.match(app.modal.innerHTML, /filter-modal__drawer dt3-drawer/);
  assert.match(app.modal.innerHTML, /filter-modal__body filter-modal__body--form/);
  assert.match(app.modal.innerHTML, /filter-modal__fields ui-scrollbar/);
  assert.equal((app.modal.innerHTML.match(/class="ui-divider brand-divider"/g) || []).length, 2);
  assert.doesNotMatch(app.modal.innerHTML, /<select|modal-note|modal-head|class="overlay"|is-touched/);
}
const trigger = app.click('data-filter');
sharedDrawer('data-filter-drawer');
assert.match(app.modal.innerHTML, /equipment-date-grid[\s\S]*Дата с[\s\S]*Дата по/);
assert.match(app.modal.innerHTML, /data-bnt-date-root="data-date-from"[^>]*data-bnt-date-value="2026-01-01"/);
assert.match(app.modal.innerHTML, /data-bnt-date-value="2026-07-31"/);
assert.equal((app.modal.innerHTML.match(/data-form-input-mode="single"/g) || []).length, 4);
app.filter({source: 2}); app.close();
assert.equal(app.state().source, 1, 'Cancel discards the filter draft');
assert.equal(trigger.focused, true);
assert.equal(trigger.getAttribute('aria-expanded'), 'false');
app.click('data-filter'); app.filter({'date-from': '2026-08-01', 'date-to': '2026-03-31'});
app.click('apply-data-filter', {}, app.modal);
assert.equal(app.state().monthFrom, 1);
assert.ok(app.modal.innerHTML, 'Invalid dates do not close the drawer');
assert.equal(app.notices.at(-1)[0], 'Проверьте период');
app.filter({source: 2, 'date-from': '2026-02-14', 'date-to': '2026-04-22'});
app.click('apply-data-filter', {}, app.modal);
assert.equal(app.state().source, 2);
assert.equal(app.state().monthFrom, 2);
assert.equal(app.state().monthTo, 4);
assert.equal(app.state().dataDateFrom, '2026-02-14');
assert.equal(app.state().dataDateTo, '2026-04-22');
assert.equal(app.state().activeTemplateId, 'draft');
assert.equal(app.modal.innerHTML, '');
assert.match(app.root.innerHTML, /БМП · Факт · 2026/);
assert.match(app.root.innerHTML, /<strong>9<\/strong>/, 'Period total remains an inclusive monthly sum');
app.click('data-filter');
assert.match(app.modal.innerHTML, /data-bnt-date-value="2026-02-14"/);
app.close();

const yearFilter = await mount({year: 2024, monthFrom: 2, monthTo: 2});
yearFilter.click('data-filter'); yearFilter.filter({year: 2025});
const dateFields = new Map();
for (const part of ['from', 'to']) {
  const field = new Element(), input = yearFilter.input(`data-date-${part}`, '2024-02-29');
  field.queries.set('[data-bnt-date]', input);
  field.queries.set('[data-bnt-date-text]', new Element());
  dateFields.set(`[data-bnt-date-root="data-date-${part}"]`, field);
}
yearFilter.modal.querySelector = selector => dateFields.get(selector) || null;
yearFilter.modal.emit('change', {target: yearFilter.elements.get('#data-year')});
assert.equal(yearFilter.elements.get('#data-date-from').value, '2025-02-28', 'Changing the year clamps leap-day dates');
assert.equal(yearFilter.state().year, 2024, 'Changing the draft year does not yet change the page');
for (const [name, values] of [['source', [1, 2, 3]], ['year', [2024, 2025, 2026]], ['currency', ['USD', 'GEL']], ['unit', ['raw', 'thousand', 'million']]]) {
  const field = new Element();
  field.queries.set('[data-form-input-selected]', yearFilter.elements.get(`#data-${name}`));
  field.queries.set('[data-form-input-value]', new Element());
  field.queries.set('[data-form-input-option]', values.map(value => {
    const option = new Element(), label = new Element(); option.dataset.formInputOption = String(value); label.textContent = String(value);
    option.queries.set('.form-input__option-label', label); return option;
  }));
  dateFields.set(`[data-form-input="data-${name}"]`, field);
}
yearFilter.click('reset-data-filter', {}, yearFilter.modal);
assert.equal(yearFilter.elements.get('#data-year').value, '2026');
assert.equal(yearFilter.elements.get('#data-date-from').value, '2026-01-01');
assert.equal(yearFilter.elements.get('#data-date-to').value, '2026-12-31');
assert.equal(yearFilter.state().year, 2024, 'Reset changes only the draft until Apply');
yearFilter.modal.emit('submit', {target: {matches: selector => selector === '[data-data-filter-form]'}, preventDefault() {}});
assert.equal(yearFilter.state().year, 2026);
assert.equal(yearFilter.state().monthTo, 12);

app.click('history'); sharedDrawer('data-history-drawer');
assert.match(app.modal.innerHTML, /Изменений пока нет/);
app.close();
app.changeKind('production');
assert.equal(app.state().dataKind, 'production');
assert.match(app.root.innerHTML, /data-action="create-chart"/);
assert.doesNotMatch(app.root.innerHTML, /data-action="history"/);
assert.match(app.root.innerHTML, /Pelogas — производственные данные <span class="ui-dropdown__count">\(2\)/);
app.click('create-chart'); sharedDrawer('data-chart-drawer');
assert.match(app.modal.innerHTML, /id="chart-kind"[^>]*value="production"/);
assert.match(app.modal.innerHTML, /id="chart-title"[^>]*value="Oil"/);
assert.doesNotMatch(app.modal.innerHTML, /id="chart-type"/);
app.input('chart-kind', 'production'); app.input('chart-row', '1'); app.input('chart-size', 'full'); app.input('chart-title', 'Custom gas');
app.click('confirm-data-chart', {}, app.modal);
const block = Object.values(app.state().customBlocks).at(-1);
assert.deepEqual(block, {title: 'Custom gas', kind: 'production', type: 'seedIndicator', size: 'full', sourceBlockId: 'general_total_cargo', rowIndex: 1});
assert.equal(app.destination(), '/reports.html');
assert.equal(app.state().view, 'reports');

const finance = await mount();
finance.click('chart-row', {kind: 'fi', row: 'fi-1'});
assert.match(finance.modal.innerHTML, /id="chart-kind"[^>]*value="fi"/);
assert.match(finance.modal.innerHTML, /id="chart-row"[^>]*value="fi-1"/);
finance.input('chart-kind', 'fi'); finance.input('chart-row', 'fi-1'); finance.input('chart-size', 'third'); finance.input('chart-type', 'indicatorColumn');
finance.modal.emit('change', {target: finance.elements.get('#chart-kind')});
assert.match(finance.modal.innerHTML, /id="chart-size"[^>]*value="third"/);
assert.match(finance.modal.innerHTML, /id="chart-type"[^>]*value="indicatorColumn"/);
finance.modal.emit('submit', {target: {matches: selector => selector === '[data-data-chart-form]'}, preventDefault() {}});
assert.deepEqual(Object.values(finance.state().customBlocks).at(-1), {title: 'Value & <test>', kind: 'fi', type: 'indicatorColumn', size: 'third', rowKey: 'CODE'});

const history = await mount({manualLog: [{date: '01.10.2026', name: '<Revenue>', scope: 'Source', old: 10, value: 20, reason: 'Comment & test'}]});
history.click('history');
assert.match(history.modal.innerHTML, /class="data-table"/);
assert.match(history.modal.innerHTML, /&lt;Revenue&gt;/);
assert.match(history.modal.innerHTML, /Comment &amp; test/);
const cell = new Element(); cell.dataset = {kind: 'metrics', row: 'metrics-1', month: '2'}; cell.setAttribute('data-source-edit', '');
history.close(); history.root.emit('click', {target: cell});
assert.match(history.modal.innerHTML, /id="data-edit-drawer"/);
assert.match(history.modal.innerHTML, /form-input__control--text[\s\S]*step="any" required/);
history.input('source-edit-value', '2400.5'); history.input('source-edit-reason', 'Correction');
history.click('save-source-edit', {kind: 'metrics', row: 'metrics-1', month: '2'}, history.modal);
assert.equal(history.state().manualLog.at(-1).value, 2400.5);
assert.equal(history.state().manualLog.at(-1).old, 2000);
assert.ok(Object.values(history.state().overrides).includes(2400.5));

const missing = await mount({source: 3, dataKind: 'metrics'}, {datasets: []});
assert.equal(missing.state().dataKind, 'production');
assert.match(missing.root.innerHTML, /Новый график/);
const historyTrigger = missing.click('history'), drawer = new Element(), first = new Element(), last = new Element();
drawer.querySelectorAll = () => [first, last];
missing.modal.querySelector = selector => selector === '[data-studio-drawer]' && missing.modal.innerHTML ? drawer : null;
missing.document.activeElement = last;
missing.document.emit('keydown', {target: last, key: 'Tab', preventDefault() {}});
assert.equal(first.focused, true);
missing.document.emit('keydown', {target: first, key: 'Escape', preventDefault() {}});
assert.equal(missing.modal.innerHTML, '');
assert.equal(historyTrigger.focused, true);
assert.doesNotMatch(await read('assets/css/pages/dispatcher-3d.css'), /^\.dt3-zone-dropdown(?: |\s*\{)/m);
assert.match(await read('assets/js/pages/dispatcher-3d.js'), /BNTUI\.renderDropdownOptions/);
assert.match(await read('assets/js/pages/procurement.js'), /ui\.handleDateFieldClick\(event, "egpz"/);
console.log('Data: shared page heading, dataset dropdown and counts, three drawers, date filters, cancel, validation, persistence, inclusive monthly totals, chart creation, history, corrections and legacy isolation passed.');
