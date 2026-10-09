import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('legacy/report-studio-v5/app.js');
const uiSource = await read('assets/js/ui.js');
const chartSource = await read('assets/js/chart-stacked-bars.js');
const html = await read('data.html');
const css = await read('assets/css/components.css');
const tokens = await read('assets/css/tokens.css');
const icons = await read('assets/icons/financial-interface.svg');
assert.match(css, /\.live-line > \.typography-body-smallest\s*\{\s*color: var\(--text-tertiary\);/);

class Element {
  html = '';
  get innerHTML() { return this.html; }
  set innerHTML(value) {
    if (this.sharedControlsOnly) assert.doesNotMatch(value, /class=["'](?:[^"']*\s)?(?:btn(?:-(?:primary|secondary|danger))?|icon-btn|field(?:-grow)?)(?=\s|["'])/, 'Corporate renders use shared controls');
    this.html = value;
  }
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
  removeEventListener(type, listener) { this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== listener)); }
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
    if (selector === '[data-seed-edit]' && this.hasAttribute('data-seed-edit')) return this;
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
async function mount(saved = {}, data = fixture, page = 'data', layout = null) {
  const elements = new Map(['#page-content', '#app', '#modal-root', '#template-import'].map(id => [id, new Element()]));
  const root = elements.get(['data', 'sync'].includes(page) ? '#page-content' : '#app'), modal = elements.get('#modal-root');
  root.sharedControlsOnly = modal.sharedControlsOnly = ['data', 'sync', 'reports'].includes(page);
  let stored = JSON.stringify({view: 'reports', ...saved}), destination;
  const document = Object.assign(new Element(), {body: {dataset: {page}}, querySelector: selector => elements.get(selector) || null, querySelectorAll: () => []});
  const window = Object.assign(new Element(), {
    BNT_DATA: data, BNT_TEMPLATES: [{id: 'cf-main', name: 'Test report', blocks: []}],
    BNT_REPORTS: {general: {series: ['Actual', 'Plan'], blocks: {general_total_cargo: {unit: 'MT', rows: [{name: 'Oil', values: [120, 180]}, {name: 'Gas', values: [30, 40]}]}}}},
    location: {assign: value => { destination = value; }}
  });
  if (layout) { root.queries.set('[data-sync-grid]', layout.grid); document.readyState = 'loading'; document.fonts = layout.fonts; }
  const context = vm.createContext({window, document, Event, console, ResizeObserver: layout?.Observer, requestAnimationFrame: callback => callback(), setTimeout() {}, localStorage: {getItem: () => stored, setItem: (_key, value) => { stored = value; }}});
  vm.runInContext(uiSource, context);
  vm.runInContext(chartSource, context);
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
  return {root, modal, document, window, ui: window.BNTUI, notices, elements, click, input, filter, close, changeKind, state: () => JSON.parse(stored), destination: () => destination};
}

const app = await mount();
assert.equal(app.state().view, 'data');
assert.match(html, /<main id="page-content" class="page-content"><\/main>/);
assert.doesNotMatch(html, /report-host|id="app"|styles\.css|report-studio\.css/);
assert.match(app.root.innerHTML, /^<div class="div-block"><section class="page-title-actions">/);
assert.match(app.root.innerHTML, /<h1 class="typography-h4">Данные<\/h1>/);
assert.doesNotMatch(app.root.innerHTML, /dataset-list|filterbar|class="app"|<aside/);
const actions = app.root.innerHTML.split('</section>')[0];
assert.doesNotMatch(actions, /data-action="history"|data-action="data-filter"/);
const tableHeading = app.root.innerHTML.match(/<header class="page-title-actions">[\s\S]*?<\/header>/)[0];
assert.ok(tableHeading.indexOf('data-action="history"') < tableHeading.indexOf('data-action="data-filter"'));
assert.equal((tableHeading.match(/button-smallest-secondary-radius typography-button-smallest/g) || []).length, 2);
assert.match(actions, /dt3-zone-dropdown ui-dropdown ui-dropdown--small/);
assert.match(actions, /Ключевые показатели <span class="ui-dropdown__count">\(1\)<\/span>/);
assert.equal((actions.match(/data-ui-dropdown-option=/g) || []).length, 6, 'All six datasets remain available for every company');
assert.match(actions, /data-ui-dropdown-option="cf"[\s\S]*Денежные потоки \(CF\) <span class="ui-dropdown__count">\(0\)/);
assert.match(css, /\.ui-dropdown__count\s*\{[^}]*color: var\(--text-tertiary\);/);
assert.match(app.root.innerHTML, /card table-block table-block--sticky-head[\s\S]*table-wrap ui-scrollbar[\s\S]*table class="data-table"/);
assert.match(app.root.innerHTML, /Value &amp; &lt;test&gt;/);
assert.doesNotMatch(tableHeading, /live-line|Подключено|badge|pill/);
assert.match(app.root.innerHTML, /class="data-table__numeric-cell table-number-cell"[^>]*><div class="table-number-content"><strong>/);
assert.equal((app.root.innerHTML.match(/class="data-table__sort"/g) || []).length, 13);
assert.match(app.root.innerHTML, /<th class="data-table__head-cell--action"><div class="data-table__column-heading">График<\/div><\/th><\/tr><\/thead>/);
assert.match(app.root.innerHTML, /data-action="chart-row"[^>]*>[\s\S]*?<\/button><\/td><\/tr>/);
assert.match(icons, /symbol id="History"/);
assert.match(icons, /symbol id="NewChart"/);

const sortFixture = {datasets: [{id: 'sort-metrics', source: 1, year: 2026, kind: 'metrics', basis: 'actual', rows: [
  ['two', 2], ['twelve', 12], ['empty', null], ['negative', -5], ['zero', 0], ['equal', 2]
].map(([id, value]) => ({id, code: id, name: id, values: Array(12).fill(value)}))}]};
const sorting = await mount({unit: 'raw'}, sortFixture);
const rowOrder = instance => [...instance.root.innerHTML.matchAll(/data-source-edit data-kind="metrics" data-row="([^"]+)" data-month="1"/g)].map(match => match[1]);
const originalOrder = rowOrder(sorting), originalRows = JSON.stringify(sortFixture.datasets[0].rows), originalState = sorting.state();
const scrollArea = new Element(); scrollArea.scrollLeft = 580; scrollArea.scrollTop = 180;
const sortControl = new Element(); sorting.root.queries.set('.table-wrap', scrollArea);
sorting.root.queries.set('[data-action="sort-data"][data-column="0"]', sortControl);
sorting.click('sort-data', {column: '0'});
assert.deepEqual(rowOrder(sorting), ['twelve', 'two', 'equal', 'zero', 'negative', 'empty']);
assert.match(sorting.root.innerHTML, /aria-sort="descending"[\s\S]*#SortDescending/);
assert.equal(scrollArea.scrollLeft, 580); assert.equal(scrollArea.scrollTop, 180); assert.equal(sortControl.focused, true);
sorting.click('sort-data', {column: '0'});
assert.deepEqual(rowOrder(sorting), ['negative', 'zero', 'two', 'equal', 'twelve', 'empty']);
assert.match(sorting.root.innerHTML, /aria-sort="ascending"[\s\S]*#SortAscending/);
sorting.click('sort-data', {column: '0'});
assert.deepEqual(rowOrder(sorting), originalOrder, 'Third click restores the source order');
sorting.click('sort-data', {column: '12'});
assert.equal(rowOrder(sorting)[0], 'twelve', 'Period totals are sortable too');
assert.equal(JSON.stringify(sortFixture.datasets[0].rows), originalRows, 'Sorting does not mutate source values');
assert.deepEqual(sorting.state(), originalState, 'Sorting does not change filters, charts or totals');
sorting.changeKind('production');
assert.doesNotMatch(sorting.root.innerHTML, /aria-sort="descending"|aria-sort="ascending"/);
assert.match(sorting.root.innerHTML, /typography-indicator-small">Контрольный срез · 8 мес 2026[\s\S]*typography-caption-small">Pelogas — производственные показатели/);
assert.match(sorting.root.innerHTML, /page-title-actions__heading analytics-block-heading[\s\S]*Pelogas — производственные показатели<\/h2><\/div><div class="live-line"><i class="live-dot" aria-hidden="true"><\/i><span class="typography-body-smallest">Подключено<\/span><\/div><\/div><div class="page-title-actions__buttons">/);
assert.doesNotMatch(sorting.root.innerHTML, /badge green|pill__title|Данные обновляются/);
sorting.click('sort-data', {column: '0'}); sorting.click('sort-data', {column: '0'});
const sortedSeedRows = sorting.root.innerHTML.split('<tbody>')[1];
assert.ok(sortedSeedRows.indexOf('<strong>Gas</strong>') < sortedSeedRows.indexOf('<strong>Oil</strong>'));
assert.match(sortedSeedRows, /<strong>Gas<\/strong>[\s\S]*data-row-index="1"[\s\S]*data-action="chart-seed-row"[^>]*data-row-index="1"/);
sorting.changeKind('metrics');
assert.deepEqual(rowOrder(sorting), originalOrder);
assert.doesNotMatch(sorting.root.innerHTML, /live-line|Подключено/);

function sharedDrawer(id, empty = false) {
  assert.match(app.modal.innerHTML, new RegExp(`id="${id}" class="filter-modal"`));
  assert.match(app.modal.innerHTML, /filter-modal__drawer dt3-drawer/);
  if (empty) {
    assert.match(app.modal.innerHTML, /filter-modal__body filter-modal__body--empty ui-scrollbar/);
    assert.doesNotMatch(app.modal.innerHTML, /filter-modal__fields|filter-modal__footer|empty-state__title/);
  } else {
    assert.match(app.modal.innerHTML, /filter-modal__body filter-modal__body--form/);
    assert.match(app.modal.innerHTML, /filter-modal__fields ui-scrollbar/);
  }
  assert.equal((app.modal.innerHTML.match(/class="ui-divider brand-divider"/g) || []).length, empty ? 1 : 2);
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

const stalePeriod = await mount({monthFrom: 6, monthTo: 7, dataDateFrom: '2026-02-14', dataDateTo: '2026-04-22'});
stalePeriod.click('data-filter');
assert.match(stalePeriod.modal.innerHTML, /data-bnt-date-value="2026-06-01"/);
assert.match(stalePeriod.modal.innerHTML, /data-bnt-date-value="2026-07-31"/);

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

app.click('history'); sharedDrawer('data-history-drawer', true);
assert.match(app.modal.innerHTML, /empty-state--smallest[\s\S]*empty-state__illustration" width="96" height="96"[\s\S]*#EmptyStateBox[\s\S]*<p class="empty-state__description typography-body-smallest">Изменений пока нет<\/p>/);
assert.equal((app.modal.innerHTML.match(/<button /g) || []).length, 1, 'Only the header close button remains');
app.close();

const legacyHistory = await mount({view: 'data'}, fixture, 'reports');
const legacyHistoryTrigger = legacyHistory.click('history');
assert.match(legacyHistory.modal.innerHTML, /filter-modal__body--empty ui-scrollbar/);
assert.doesNotMatch(legacyHistory.modal.innerHTML, /filter-modal__footer|modal-body|class="overlay"/);
legacyHistory.close();
assert.equal(legacyHistoryTrigger.focused, true);
const emptyHistoryTrigger = legacyHistory.click('history'), emptyHistoryDrawer = new Element(), onlyClose = new Element();
emptyHistoryDrawer.querySelectorAll = () => [onlyClose];
legacyHistory.modal.querySelector = selector => selector === '[data-studio-drawer]' ? emptyHistoryDrawer : null;
legacyHistory.document.activeElement = onlyClose;
let tabTrapped = false;
legacyHistory.document.emit('keydown', {target: onlyClose, key: 'Tab', preventDefault() { tabTrapped = true; }});
assert.equal(tabTrapped, true);
assert.equal(onlyClose.focused, true, 'Tab stays on the only empty-drawer control');
legacyHistory.document.emit('keydown', {target: onlyClose, key: 'Escape', preventDefault() {}});
assert.equal(legacyHistory.modal.innerHTML, '');
assert.equal(emptyHistoryTrigger.focused, true);
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
assert.match(history.modal.innerHTML, /filter-modal__footer/);
assert.doesNotMatch(history.modal.innerHTML, /filter-modal__body--empty|empty-state--illustrated/);
assert.match(history.modal.innerHTML, /&lt;Revenue&gt;/);
assert.match(history.modal.innerHTML, /Comment &amp; test/);
const cell = new Element(); cell.dataset = {kind: 'metrics', row: 'metrics-1', month: '2'}; cell.setAttribute('data-source-edit', '');
history.close(); history.root.emit('click', {target: cell});
assert.match(history.modal.innerHTML, /id="data-edit-drawer"/);
assert.match(history.modal.innerHTML, /form-input__control--text[\s\S]*step="any" required/);
assert.equal((history.modal.innerHTML.match(/readonly disabled tabindex="-1"/g) || []).length, 2);
assert.match(history.modal.innerHTML, /id="source-edit-original"/);
assert.match(history.modal.innerHTML, /id="source-edit-current"/);
assert.doesNotMatch(history.modal.innerHTML, /scenario-impact|dt3-metrics/);
assert.match(history.modal.innerHTML, /Обоснование<\/span><span class="form-input__text-field">[\s\S]*#Pencil[\s\S]*id="source-edit-reason" name="reason" rows="5" required/);
history.input('source-edit-value', '2400.5'); history.input('source-edit-reason', 'Correction');
const updatedCell = new Element(); updatedCell.dataset = {...cell.dataset};
history.root.queries.set('[data-source-edit]', [updatedCell]);
history.click('save-source-edit', {kind: 'metrics', row: 'metrics-1', month: '2'}, history.modal);
assert.equal(history.state().manualLog.at(-1).value, 2400.5);
assert.equal(history.state().manualLog.at(-1).old, 2000);
assert.ok(Object.values(history.state().overrides).includes(2400.5));
assert.equal(history.modal.innerHTML, '');
assert.equal(cell.getAttribute('aria-expanded'), 'false');
assert.equal(updatedCell.focused, true, 'Saving returns focus to the updated cell');
history.root.emit('click', {target: cell});
assert.match(history.modal.innerHTML, /id="source-edit-current" value="2\s400,5" readonly/);
history.close();

const productionEdit = await mount({dataKind: 'production'});
const seedCell = new Element(); seedCell.setAttribute('data-seed-edit', '');
seedCell.dataset = {blockId: 'general_total_cargo', rowIndex: '1', seriesIndex: '0', valueLabel: 'Gas', base: '30'};
productionEdit.root.emit('click', {target: seedCell});
productionEdit.input('seed-edit-value', '240'); productionEdit.input('seed-edit-reason', 'Correction');
productionEdit.click('save-seed-edit', {...seedCell.dataset}, productionEdit.modal);
productionEdit.root.emit('click', {target: seedCell});
assert.match(productionEdit.modal.innerHTML, /id="seed-edit-original" value="30" readonly/);
assert.match(productionEdit.modal.innerHTML, /id="seed-edit-current" value="240" readonly/);
assert.match(productionEdit.modal.innerHTML, /id="seed-edit-value" value="240"/);
productionEdit.close(); productionEdit.click('sort-data', {column: '0'}); productionEdit.click('sort-data', {column: '0'});
assert.ok(productionEdit.root.innerHTML.indexOf('<strong>Oil</strong>') < productionEdit.root.innerHTML.indexOf('<strong>Gas</strong>'), 'Sorting uses corrected seed values');

const missing = await mount({source: 3, dataKind: 'metrics'}, {datasets: []});
assert.equal(missing.state().dataKind, 'metrics', 'A dataset with no rows remains selectable');
assert.match(missing.root.innerHTML, /<tr data-table-empty><td class="data-table__empty-cell" colspan="\d+">[\s\S]*#EmptyStateBox[\s\S]*typography-body-smallest">Нет данных<\/p>/, 'An empty data table uses the shared illustrated Empty');
assert.equal((missing.root.innerHTML.match(/data-ui-dropdown-option=/g) || []).length, 6);
assert.match(missing.root.innerHTML, /Нет данных/);
missing.changeKind('production');
assert.match(missing.root.innerHTML, /Новый график/);
const unknown = await mount({dataKind: 'unknown'});
assert.equal(unknown.state().dataKind, 'production', 'Only unknown dataset keys fall back to production');
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
const syncData = {datasets: fixture.datasets.map((entry, index) => ({...entry, kindName: `${entry.kind} & <test>`, basisName: 'Actual', timestamp: `2026-08-${String(index + 1).padStart(2, '0')} 12:00`}))};
const sync = await mount({view: 'reports', manualLog: [{value: 123}], schedules: [{enabled: true}, {enabled: false}], templateOverrides: {'cf-main': {kpi: {revenue: 123}}}}, syncData, 'sync');
assert.equal(sync.state().view, 'sync', 'The embedded synchronization page overrides a previously saved view');
assert.match(sync.root.innerHTML, /^<section class="page-title-actions">/);
assert.match(sync.root.innerHTML, /<\/section><div class="grid-3 grid-3--reference-height" data-sync-grid>/);
const syncHeading = sync.root.innerHTML.split('</section>')[0];
assert.match(syncHeading, /page-title-actions__title-row[\s\S]*<h1 class="typography-h4">Синхронизация<\/h1>/);
assert.match(syncHeading, /class="sign_BTN_smallest"[^>]*data-action="sync-info"[^>]*aria-expanded="false"/);
assert.match(syncHeading, /button-small button-small--secondary typography-button-small[^>]*data-action="data-filter"/);
assert.match(syncHeading, /button-small button-small--primary typography-button-small[^>]*data-action="sync"[\s\S]*navigation\.svg\?v=3#nav-sync-outline[\s\S]*Запустить синхронизацию/);
assert.match(syncHeading, /<svg width="24" height="24" viewBox="0 0 24 24"[^>]*><use x="2" y="2" width="20" height="20" href="\/assets\/icons\/navigation\.svg\?v=3#nav-sync-outline"><\/use><\/svg>/, 'The native 20px navigation glyph sits inside a 24px frame');
assert.ok(syncHeading.indexOf('data-action="sync"') < syncHeading.indexOf('data-action="data-filter"'), 'The filter is the last heading action');
assert.doesNotMatch(sync.root.innerHTML, /class="app"|<aside|class="page-head"|filterbar|<select|integration-grid|sync-layout|Контролируемая загрузка/);
assert.match(sync.root.innerHTML, /<div class="grid-3 grid-3--reference-height" data-sync-grid>\s*<div class="div-block" data-sync-sources>\s*<article class="chart-card" aria-labelledby="sync-financial-title">[\s\S]*<article class="chart-card" aria-labelledby="sync-production-title">[\s\S]*<\/div>\s*<article class="chart-card payment-summary-card ui-scrollbar" aria-labelledby="sync-summary-title">[\s\S]*<article class="chart-card" aria-labelledby="sync-slices-title">/);
assert.equal((sync.root.innerHTML.match(/class="chart-card(?: [^"]*)?"/g) || []).length, 4, 'Outer cards use the shared shell, metrics use their own master cells');
assert.equal((sync.root.innerHTML.match(/class="card-with-image__body"/g) || []).length, 2, 'Only source cards use the image-card text block');
assert.match(sync.root.innerHTML, /class="payment-summary-card__copy">\s*<strong class="payment-summary-card__amount typography-indicator-base">3<\/strong>\s*<span id="sync-summary-title" class="payment-summary-card__amount payment-summary-card__amount--multiline typography-label-base">источников и наборов<\/span>/, 'Only the number uses Indicator Base; the caption retains Label Base on its own line');
assert.match(tokens, /--typography-indicator-base-size: 32px;\s*--typography-indicator-base-line-height: 40px;\s*--typography-indicator-base-weight: 400;\s*--typography-indicator-base-letter-spacing: 0;/);
assert.match(tokens, /--typography-indicator-base-mobile-size: 14px;\s*--typography-indicator-base-mobile-line-height: 20px;/);
assert.match(tokens, /@media \(max-width: 959px\)\s*\{\s*:root\s*\{\s*--typography-indicator-base-size: var\(--typography-indicator-base-mobile-size\);\s*--typography-indicator-base-line-height: var\(--typography-indicator-base-mobile-line-height\);/);
assert.match(css, /\.typography-indicator-base\s*\{[^}]*font-size: var\(--typography-indicator-base-size\);[^}]*line-height: var\(--typography-indicator-base-line-height\);[^}]*font-weight: var\(--typography-indicator-base-weight\);/);
assert.match(sync.root.innerHTML, /<p class="payment-summary-card__description typography-body-smallest">БНТ · 2026 · ручных корректировок: 1/);
assert.match(css, /\.payment-summary-card__amount--multiline\s*\{[^}]*white-space: normal;[^}]*overflow-wrap: anywhere;/);
for (const source of ['1С', 'Pelogas']) assert.match(sync.root.innerHTML, new RegExp(`class="card-with-image__eyebrow typography-indicator-small">${source}<`));
assert.match(sync.root.innerHTML, /class="card-with-image__title typography-caption-smallest">Финансовые данные/);
assert.match(sync.root.innerHTML, /class="card-with-image__description typography-body-smallest">CF, IS, баланс/);
assert.equal((sync.root.innerHTML.match(/class="filter-summary__pills"><span class="badge green">/g) || []).length, 3, 'Positive badges keep their content width inside the shared flex row');
assert.equal((sync.root.innerHTML.match(/class="badge default"/g) || []).length, 4);
assert.doesNotMatch(sync.root.innerHTML, /integration-card|integration-head|integration-stats|sync-card|sync-metrics|class="status|class="snapshot"/);
const syncMetrics = sync.root.innerHTML.split('<div class="dt3-metrics scenario-impact">')[1];
assert.deepEqual([...syncMetrics.matchAll(/<div><span>([^<]+)<\/span><strong>(\d+)<\/strong><\/div>/g)].map(match => [match[1], Number(match[2])]), [['строк 1С', 2], ['Pelogas KPI', 2], ['рассылки', 1], ['корректировки', 1]], 'Metric calculations and exact master label/value structure are preserved');
assert.doesNotMatch(sync.root.innerHTML, /metrics-grid|scenario-copy/, 'The summary no longer imitates its master with other components');
const snapshots = sync.root.innerHTML.split('<div class="logistics-alert-list payment-risk-map__scroller ui-scrollbar"')[1];
assert.match(sync.root.innerHTML, /<article class="chart-card" aria-labelledby="sync-slices-title">\s*<header[^>]*>[\s\S]*?<\/header>\s*<div class="payment-risk-map__risk-column">\s*<div class="logistics-alert-list payment-risk-map__scroller ui-scrollbar" tabindex="0" role="region" aria-labelledby="sync-slices-title">/, 'Only the list scrolls; the heading stays outside the risk-fade viewport');
assert.match(css, /\.chart-card:has\(> \.payment-risk-map__risk-column\)\s*\{\s*overflow: hidden;/);
assert.match(css, /\.chart-card > \.payment-risk-map__risk-column\s*\{\s*flex: 1 1 0;\s*min-height: 0;/, 'The viewport fits within the padded card even under the risk-map mobile breakpoint');
assert.match(css, /\.chart-card\s*\{[^}]*padding: var\(--space-3\);/, 'The fixed viewport leaves the master 12px padding at the bottom');
assert.match(sync.root.innerHTML, /id="sync-slices-title" class="typography-caption-smallest">Последние срезы/);
assert.match(css, /\.analytics-block-heading \.typography-caption-smallest,[\s\S]*?\{\s*margin: 0;\s*color: var\(--text-primary\);/);
assert.ok(snapshots.indexOf('fi &amp; &lt;test&gt;') < snapshots.indexOf('metrics &amp; &lt;test&gt;'), 'Latest slices retain descending timestamp order');
assert.match(snapshots, /Pelogas · производственные данные/);
assert.equal((snapshots.match(/class="logistics-alert logistics-alert--green"/g) || []).length, 3);
assert.equal((snapshots.match(/class="logistics-alert__marker" aria-hidden="true"/g) || []).length, 3);
assert.equal((snapshots.match(/class="table-cell-content"><strong class="typography-label-smallest"/g) || []).length, 3);
assert.equal((snapshots.match(/class="typography-body-smallest"/g) || []).length, 3);
assert.match(css, /\.grid-3\s*\{[^}]*repeat\(3, minmax\(0,1fr\)\)[^}]*gap: var\(--space-3\);/);
assert.match(css, /\.grid-2\s*\{[^}]*repeat\(2, minmax\(0,1fr\)\)[^}]*gap: var\(--space-3\);/);
assert.match(css, /\.div-block\s*\{[^}]*gap: var\(--space-3\);/);
assert.match(css, /\.grid-3--reference-height\s*\{[^}]*align-items: start;/, 'The source stack keeps its natural height instead of stretching to other columns');
assert.match(css, /\.grid-3--reference-height > :not\(:first-child\)\s*\{[^}]*height: var\(--grid-reference-height, auto\);[^}]*min-height: 0;[^}]*max-height: none;[^}]*overflow: auto;/);
const legacyCss = await read('legacy/report-studio-v5/styles.css');
assert.doesNotMatch(legacyCss, /\.integration-(?:grid|card|head|stats)|\.sync-(?:layout|card|metrics)|\.snapshot/, 'Legacy card typography, surfaces and spacing are removed');
assert.doesNotMatch(legacyCss, /\.canvas-block\s+small\s*\{/, 'The late legacy small rule must not override drawer captions');
assert.match(css, /\.layout-item-label\s*\{[^}]*font-family: var\(--font-family-primary\);/);
assert.match(css, /\.layout-item-label strong,[\s\S]*?\{[^}]*color: var\(--text-primary\);[^}]*font-size: var\(--typography-label-smallest-size\);[^}]*font-weight: var\(--typography-label-smallest-weight\);/);
assert.match(css, /\.layout-item-label small,[\s\S]*?\{[^}]*color: var\(--text-tertiary\);[^}]*font-size: var\(--typography-body-smallest-size\);[^}]*line-height: var\(--typography-body-smallest-line-height\);[^}]*font-weight: var\(--typography-body-smallest-weight\);/);
assert.match(css, /\.logistics-alert-list\s*\{[^}]*gap: var\(--space-3\);/);
assert.match(css, /\.logistics-alert\s*\{[^}]*gap: var\(--space-2\);[^}]*padding: 0 0 var\(--space-3\) 0;[^}]*border-bottom: 1px solid var\(--design-elements-border-default\);/);
assert.match(css, /\.logistics-alert--green \.logistics-alert__marker\s*\{[^}]*background: var\(--system-elements-semantic-positive-primary\);/);
assert.match(css, /\.logistics-alert \.table-cell-content\s*\{[^}]*gap: 0;[^}]*color: var\(--text-primary\);/);
assert.match(css, /\.chart-card\s*\{[^}]*color: var\(--text-primary\);[^}]*font-family: var\(--font-family-primary\);/);
assert.match(css, /\.metrics-grid > div > span\s*\{[^}]*color: var\(--text-tertiary\);[^}]*font-size: var\(--typography-indicator-small-size\);/);
assert.match(css, /\.metrics-grid > div > strong\s*\{[^}]*color: var\(--text-primary\);[^}]*font-size: var\(--typography-label-small-size\);/);
assert.match(css, /\.logistics-alert span\s*\{[^}]*color: var\(--text-tertiary\);/);
assert.doesNotMatch(await read('assets/css/pages/enterprise.css'), /\.logistics-alert/, 'Logistics and synchronization consume one shared alert component');
assert.match(await read('assets/icons/navigation.svg'), /<symbol id="nav-sync-outline"[^>]*viewBox="0 0 20 20"/);
let syncInfo;
sync.ui.showInfoPopover = (_trigger, options) => { syncInfo = options; };
sync.click('sync-info');
assert.equal(syncInfo.title, 'Синхронизация');
assert.match(syncInfo.message, /Контролируемая загрузка[\s\S]*Ручные корректировки шаблонов сохраняются отдельно/);
const syncFilter = sync.click('data-filter');
assert.match(sync.modal.innerHTML, /id="data-filter-drawer" class="filter-modal"[\s\S]*filter-modal__drawer dt3-drawer/);
assert.equal((sync.modal.innerHTML.match(/data-form-input-mode="single"/g) || []).length, 4);
assert.equal((sync.modal.innerHTML.match(/data-bnt-date-root=/g) || []).length, 2);
assert.doesNotMatch(sync.modal.innerHTML, /<select|modal-note/);
sync.filter({source: 2}); sync.close();
assert.equal(sync.state().source, 1, 'Closing discards synchronization filter changes');
assert.equal(syncFilter.focused, true);
assert.equal(syncFilter.getAttribute('aria-expanded'), 'false');
sync.click('data-filter');
sync.filter({'date-from': '2026-08-01', 'date-to': '2026-03-31'});
sync.click('apply-data-filter', {}, sync.modal);
assert.equal(sync.notices.at(-1)[0], 'Проверьте период');
assert.ok(sync.modal.innerHTML, 'Invalid periods leave the shared filter open');
sync.filter({source: 2, year: 2025, 'date-from': '2025-02-01', 'date-to': '2025-04-30', currency: 'GEL', unit: 'million'});
const syncReturnFocus = new Element();
sync.root.queries.set('[data-action="data-filter"]', syncReturnFocus);
sync.click('apply-data-filter', {}, sync.modal);
assert.equal(sync.state().view, 'sync');
assert.equal(sync.state().source, 2);
assert.equal(sync.state().year, 2025);
assert.equal(sync.state().monthFrom, 2);
assert.equal(sync.state().monthTo, 4);
assert.equal(sync.state().currency, 'GEL');
assert.equal(sync.state().unit, 'million');
assert.equal(sync.modal.innerHTML, '');
assert.equal(syncReturnFocus.focused, true);
assert.match(sync.root.innerHTML, /БМП · 2025 · ручных корректировок: 1/);
const launchTrigger = sync.click('sync');
assert.match(sync.modal.innerHTML, /id="sync-drawer" class="filter-modal"[\s\S]*class="filter-modal__drawer dt3-drawer"[\s\S]*data-sync-form/);
assert.match(sync.modal.innerHTML, /Синхронизация источников[\s\S]*data-action="confirm-sync"/);
assert.equal(launchTrigger.getAttribute('aria-expanded'), 'true');
assert.equal((sync.modal.innerHTML.match(/class="canvas-block canvas-block--static"/g) || []).length, 3);
assert.equal((sync.modal.innerHTML.match(/class="layout-item-icon layout-item-icon--positive"/g) || []).length, 3);
assert.equal((sync.modal.innerHTML.match(/class="layout-item-label"><strong>/g) || []).length, 3);
assert.doesNotMatch(sync.modal.innerHTML, /class="overlay"|class="modal"|checklist|draggable|#Drag/);
assert.match(sync.modal.innerHTML, /filter-modal__body filter-modal__body--form"><div class="quality-detail-drawer__fields ui-scrollbar">/);
assert.equal((sync.modal.innerHTML.match(/ui-scrollbar/g) || []).length, 1, 'The approved card-list container is the only scrolling layer');
assert.doesNotMatch(sync.modal.innerHTML, /filter-modal__fields|class="div-block"/);
assert.match(css, /\.quality-detail-drawer__fields\s*\{[^}]*grid-auto-rows: max-content;[^}]*gap: var\(--space-1\);[^}]*overflow: auto;/);
const checks = sync.modal.innerHTML.split('<div class="quality-detail-drawer__fields ui-scrollbar">')[1].split('filter-modal__footer')[0];
assert.doesNotMatch(checks, /<button/, 'Static source checks have no row actions');
assert.match(checks, /Корректировки шаблонов защищены[\s\S]*Не перезаписываются синхронизацией/);
sync.close();
assert.equal(launchTrigger.focused, true);
assert.equal(launchTrigger.getAttribute('aria-expanded'), 'false');
const confirmTrigger = sync.click('sync');
sync.click('confirm-sync', {}, sync.modal);
assert.equal(sync.modal.innerHTML, '');
assert.equal(confirmTrigger.focused, true);
assert.equal(confirmTrigger.getAttribute('aria-expanded'), 'false');
assert.equal(sync.notices.at(-1)[0], 'Срезы применены');
assert.equal(sync.notices.at(-1)[2].tone, 'positive');
const submitTrigger = sync.click('sync');
let syncSubmitted = false;
sync.modal.emit('submit', {target: {matches: selector => selector === '[data-sync-form]'}, preventDefault() { syncSubmitted = true; }});
assert.equal(syncSubmitted, true);
assert.equal(sync.modal.innerHTML, '');
assert.equal(submitTrigger.focused, true);
const escapeTrigger = sync.click('sync'), syncDrawer = new Element(), syncFirst = new Element(), syncLast = new Element();
syncDrawer.querySelectorAll = () => [syncFirst, syncLast];
sync.modal.querySelector = selector => selector === '[data-studio-drawer]' && sync.modal.innerHTML ? syncDrawer : null;
sync.document.activeElement = syncLast;
sync.document.emit('keydown', {target: syncLast, key: 'Tab', preventDefault() {}});
assert.equal(syncFirst.focused, true);
sync.document.emit('keydown', {target: syncFirst, key: 'Escape', preventDefault() {}});
assert.equal(sync.modal.innerHTML, '');
assert.equal(escapeTrigger.focused, true);
assert.deepEqual(sync.state().templateOverrides, {'cf-main': {kpi: {revenue: 123}}}, 'Filtering and synchronization do not overwrite template corrections');
const grid = new Element(), sources = new Element(), dimensions = new Map(), observers = [];
let sourceHeight = 320, finishFonts;
sources.isConnected = true;
sources.getBoundingClientRect = () => ({height: sourceHeight});
grid.queries.set('[data-sync-sources]', sources);
grid.style = {setProperty: (name, value) => dimensions.set(name, value)};
class LayoutObserver {
  constructor(update) { this.update = update; observers.push(this); }
  observe(target) { this.target = target; }
  disconnect() { this.disconnected = true; }
}
const sizing = await mount({}, fixture, 'sync', {grid, Observer: LayoutObserver, fonts: {ready: new Promise(resolve => { finishFonts = resolve; })}});
assert.equal(dimensions.get('--grid-reference-height'), '320px');
assert.equal(observers[0].target, sources, 'Only source geometry drives the height, avoiding a feedback loop from scrolling columns');
sourceHeight = 420.5; observers[0].update();
assert.equal(dimensions.get('--grid-reference-height'), '420.5px', 'Column height follows source wrapping on resize');
sourceHeight = 360; sizing.window.emit('resize', {});
assert.equal(dimensions.get('--grid-reference-height'), '360px');
sourceHeight = 0; observers[0].update();
assert.equal(dimensions.get('--grid-reference-height'), '360px', 'A hidden source does not collapse the panels');
sourceHeight = 390; finishFonts(); await Promise.resolve();
assert.equal(dimensions.get('--grid-reference-height'), '390px', 'Loading fonts recalculates the reference');
const previousObserver = observers[0];
sizing.click('data-filter'); sizing.filter({source: 2}); sizing.click('apply-data-filter', {}, sizing.modal);
assert.equal(previousObserver.disconnected, true, 'Rendering a new filter state disconnects the old source observer');
assert.equal(observers.length, 2);
assert.ok(!sizing.window.listeners.get('resize').includes(previousObserver.update), 'The previous resize handler is removed');
assert.equal(sizing.window.listeners.get('resize').filter(listener => listener === observers[1].update).length, 1, 'Repeated rendering does not accumulate layout listeners');
sourceHeight = 480; previousObserver.update();
assert.equal(dimensions.get('--grid-reference-height'), '390px', 'Stale callbacks cannot overwrite the current layout');
observers[1].update();
assert.equal(dimensions.get('--grid-reference-height'), '480px');
sources.isConnected = false; sourceHeight = 540; observers[1].update();
assert.equal(dimensions.get('--grid-reference-height'), '480px', 'Detached source nodes are ignored');
const syncHtml = await read('sync.html');
assert.match(syncHtml, /<main id="page-content" class="page-content"><\/main>/);
assert.doesNotMatch(syncHtml, /report-host|id="app"|report-studio\.css/);
assert.match(syncHtml, /<\/main>\s*<div id="modal-root"><\/div>/, 'Overlay roots are outside page content');
assert.equal(syncHtml.match(/app\.js\?v=(\d+)/)[1], html.match(/app\.js\?v=(\d+)/)[1]);
console.log('Data and Sync: shared cards, badges, typography, positive alerts, inset icon, filters, source calculations, escaped slices, unchanged confirmation, preserved corrections, grids and cache versions passed. Browser rendering excluded.');
