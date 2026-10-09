import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('legacy/report-studio-v5/app.js');
const uiSource = await read('assets/js/ui.js');
const chartSource = await read('assets/js/chart-stacked-bars.js');
const css = await read('assets/css/components.css');
const html = await read('reports.html');
const icons = await read('assets/icons/financial-interface.svg');

class Element {
  html = '';
  charts = new Map();
  get innerHTML() { return this.html; }
  set innerHTML(value) {
    if (this.sharedControlsOnly) assert.doesNotMatch(value, /class=["'](?:[^"']*\s)?(?:btn(?:-(?:primary|secondary|danger))?|icon-btn|field(?:-grow)?)(?=\s|["'])/, 'Corporate renders use shared controls');
    this.html = value; this.charts.clear(); this.reportGrid = null;
  }
  dataset = {};
  attributes = new Map();
  queries = new Map();
  listeners = new Map();
  classes = new Set();
  children = [];
  style = {values: new Map(), setProperty(name, value) { this.values.set(name, value); }, removeProperty(name) { this.values.delete(name); }};
  clientWidth = 1440;
  clientHeight = 420;
  scrollLeft = 0;
  scrollTop = 0;
  offsetWidth = 180;
  offsetHeight = 100;
  classList = {
    add: (...names) => names.forEach(name => this.classes.add(name)),
    remove: (...names) => names.forEach(name => this.classes.delete(name)),
    contains: name => this.classes.has(name),
    toggle: (name, on = !this.classes.has(name)) => on ? this.classes.add(name) : this.classes.delete(name)
  };
  addEventListener(type, handler) { const list = this.listeners.get(type) || []; list.push(handler); this.listeners.set(type, list); }
  emit(type, event) { for (const handler of [...this.listeners.get(type) || []]) { handler(event); if (event.stopped) break; } }
  dispatchEvent(event) {
    Object.defineProperty(event, 'target', {value: this});
    this.emit(event.type, event);
    if (event.bubbles) this.eventParent?.emit(event.type, event);
  }
  querySelector(selector) {
    if (this.queries.has(selector)) return this.queries.get(selector);
    if (selector === 'table') return this.html.includes('<table') ? {} : null;
    if (selector === '.report-grid' && this.html.includes('class="report-grid ')) {
      if (!this.reportGrid) {
        const grid = new Element();
        const starts = [...this.html.matchAll(/<section class="analytics-layout__block"[^>]*data-block="([^"]+)"[^>]*>/g)];
        const blocks = starts.map((match, i) => {
          const block = new Element(); block.dataset.block = match[1];
          if (match[0].includes('data-report-wide')) block.setAttribute('data-report-wide', '');
          block.innerHTML = this.html.slice(match.index, starts[i + 1]?.index || this.html.length);
          return block;
        });
        grid.queries.set(':scope > .analytics-layout__block', blocks);
        grid.queries.set(':scope > .ui-divider', blocks.slice(1).map(() => new Element()));
        this.reportGrid = grid;
      }
      return this.reportGrid;
    }
    const match = selector.match(/^\[data-(stacked-card|report-line)="([^"]+)"\]$/);
    if (!match || !this.html.includes(`data-${match[1]}="${match[2]}"`)) return null;
    if (!this.charts.has(match[2])) this.charts.set(match[2], chartElement(this.html, match[2], match[1] === 'report-line'));
    return this.charts.get(match[2]).card;
  }
  querySelectorAll(selector) {
    if (selector === 'table') return [...this.innerHTML.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g)].map(match => ({outerHTML: match[0]}));
    return this.queries.get(selector) || [];
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) || null; }
  hasAttribute(name) { return this.attributes.has(name); }
  matches(selector) { return selector === 'input[type="search"]' && this.type === 'search'; }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild(child) { this.children.push(child); }
  remove() { this.removed = true; }
  getComputedTextLength() { return String(this.textContent || '').length * 8; }
  focus() { this.focused = true; }
  click() { this.clicked = true; }
  reportValidity() { return this.value !== '' && Number.isFinite(Number(this.value)); }
  getBoundingClientRect() { return {left: 80, top: 80, bottom: 100, width: 240, height: 80}; }
  closest(selector) {
    if (selector === '[data-drawer-info]' && this.hasAttribute('data-drawer-info')) return this;
    if (selector === '.chart-grid--two-column') return this.grid || null;
    if (selector === '[data-action]' && this.dataset.action) return this;
    if (selector === '[data-ui-dropdown]') return this.dropdownRoot || null;
    if (selector === '[data-scoped-search]') return this.scopedSearchRoot || null;
    if (selector === '[data-scoped-search-submit]' && this.hasAttribute('data-scoped-search-submit')) return this;
    if (selector === '[data-close]' && this.hasAttribute('data-close')) return this;
    if (selector.includes('[data-template-edit]') && this.hasAttribute('data-template-edit')) return this;
    if (selector.includes('[data-seed-edit]') && this.hasAttribute('data-seed-edit')) return this;
    if (selector === '[hidden]' && this.hidden) return this;
    if (selector === '[data-speed-dial-secondary]') return this.menuRoot || null;
    if (selector === '[data-speed-dial-secondary] .speed-dial-secondary__trigger' && this.isMenuTrigger) return this;
    return null;
  }
}

function chartElement(markup, id, line = false) {
  const card = new Element(), chart = new Element(), panel = new Element(), viewport = new Element(), axis = new Element(), legend = new Element(), tooltip = new Element();
  const fields = new Map(['title', 'period', 'value'].map(name => [`[data-tooltip-${name}]`, new Element()]));
  fields.forEach((field, selector) => tooltip.queries.set(selector, field));
  const slice = markup.slice(markup.indexOf(`data-${line ? 'report-line' : 'stacked-card'}="${id}"`)).split('</article>')[0];
  let legendMarkup = '';
  Object.defineProperty(legend, 'innerHTML', {
    get() { return legendMarkup; },
    set(value) {
      legendMarkup = value;
      legend.queries.set('[data-stacked-series]', [...value.matchAll(/data-stacked-series="(\d+)"/g)].map(match => Object.assign(new Element(), {dataset: {stackedSeries: match[1]}})));
    }
  });
  legend.innerHTML = slice;
  chart.parentElement = viewport;
  const nodes = new Map([['.chart-bars', chart], ['[data-stacked-axis]', slice.includes('data-stacked-axis') ? axis : null], ['.chart-viewport', panel], ['.chart-viewport__plot', viewport], ['.chart-tooltip', tooltip], ['.chart-legend', legend], ['.financial-chart__line-chart', chart], ['.financial-chart__legend', legend]]);
  nodes.forEach((node, selector) => card.queries.set(selector, node));
  card.queries.set('[data-stacked-tab]', []);
  return {card, chart, panel, viewport, axis, tooltip, fields, legend};
}

async function mount(page = 'reports', config = {}) {
  const elements = new Map(['#app', '#modal-root', '#template-import'].map(id => [id, new Element()]));
  const root = elements.get('#app'), modal = elements.get('#modal-root');
  root.sharedControlsOnly = modal.sharedControlsOnly = ['reports', 'builder', 'templates'].includes(page);
  const menu = new Element(), trigger = new Element(), options = new Element();
  menu.queries.set('.speed-dial-secondary__trigger', trigger);
  menu.queries.set('.speed-dial-secondary__menu', options);
  trigger.menuRoot = menu; trigger.isMenuTrigger = true;
  trigger.setAttribute('aria-expanded', 'false'); options.hidden = true;
  root.queries.set('#report-actions-trigger', trigger);
  root.queries.set('#builder-actions-trigger', trigger);
  const returnButton = new Element();
  root.queries.set('[data-action="return-builder"]', returnButton);
  const saveButton = new Element();
  root.queries.set('[data-action="save-template"]', saveButton);
  let stored = JSON.stringify(config.state || {view: 'builder', blocks: ['indicator'], customBlocks: {indicator: {
    title: 'Test indicator', kind: 'fi', type: 'indicatorColumn', size: 'half', rowKey: 'BIHL0574'
  }}}), printed = 0;
  const downloads = [], notices = [], printWindows = [], chartMounts = [], lineDraws = [], observers = [], destinations = [], breadcrumbUpdates = [];
  const document = Object.assign(new Element(), {
    body: Object.assign(new Element(), {dataset: {page}}),
    documentElement: {clientWidth: 1440, clientHeight: 900},
    querySelector: selector => selector.includes('[data-speed-dial-secondary]') && trigger.getAttribute('aria-expanded') === 'true' ? trigger : elements.get(selector) || null,
    querySelectorAll: selector => selector === '[data-speed-dial-secondary]' ? [menu] : document.queries.get(selector) || [],
    createElement: () => new Element(),
    createElementNS: () => new Element()
  });
  const data = config.data || {datasets: [1, 2].flatMap(company => [2024, 2025, 2026].map(year => ({
    source: company, year, kind: 'fi', basis: 'actual', key: `${company}-${year}`,
    rows: [{id: 'revenue', code: 'BIHL0574', name: 'Revenue', values: Array.from({length: 12}, (_, month) => company * (month + 1) * 1000)}]
  })))};
  const window = Object.assign(new Element(), {
    BNT_DATA: data, BNT_REPORTS: config.reports || {},
    BNT_TEMPLATES: config.templates || [{id: 'cf-main', name: 'Cash flow', reportTitle: 'Report & <test>', description: 'Description & <test>', blocks: ['indicator']}],
    BNTShell: {setBreadcrumbs: items => breadcrumbUpdates.push(items ? [...items] : null)},
    location: {assign: path => destinations.push(path)},
    requestAnimationFrame: callback => callback(), cancelAnimationFrame() {},
    getComputedStyle: () => ({lineHeight: '16px', columnGap: '12px', getPropertyValue: name => ({'--chart-bars-bar-size': '16px', '--space-2': '8px', '--space-3': '12px', '--space-4': '16px'})[name] || ''}),
    print: () => printed++,
    open() { const popup = {document: {write(markup) { popup.markup = markup; }, close() { popup.closed = true; }}}; printWindows.push(popup); return popup; }
  });
  const context = vm.createContext({window, document, console, Event, CustomEvent: class { constructor(type, options) { Object.assign(this, {type}, options); } }, Blob, requestAnimationFrame: callback => callback(), setTimeout() {},
    ResizeObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe(target) { this.target = target; } disconnect() { this.disconnected = true; } },
    URL: {createObjectURL(blob) { downloads.push(blob); return 'blob:test'; }, revokeObjectURL() {}}, CSS: {escape: value => value},
    localStorage: {getItem: () => stored, setItem: (_key, value) => { stored = value; }}
  });
  vm.runInContext(uiSource, context);
  vm.runInContext(chartSource, context);
  const mountBars = window.BNTCharts.mountStackedBars;
  window.BNTCharts.mountStackedBars = options => {
    const controller = mountBars(options);
    const record = {options, controller, destroyed: false};
    const destroy = controller.destroy;
    controller.destroy = () => { record.destroyed = true; destroy(); };
    chartMounts.push(record);
    return controller;
  };
  const drawLine = window.BNTUI.renderFinancialLineChart;
  window.BNTUI.renderFinancialLineChart = (chart, options) => { lineDraws.push({chart, options}); drawLine.call(window.BNTUI, chart, options); };
  window.BNTUI.toast = (...args) => notices.push(args);
  await vm.runInContext(source, context);
  function click(action, host = root, inMenu = false, attributes = {}) {
    const target = new Element(); target.dataset = {action, ...attributes};
    if (inMenu) target.menuRoot = menu;
    host.emit('click', {target, preventDefault() {}});
    return target;
  }
  function input(id, value) { const field = new Element(); field.id = id; field.value = String(value); elements.set(`#${id}`, field); return field; }
  function filter(values = {}) {
    for (const [id, value] of Object.entries({source: 1, year: 2026, 'date-from': '2026-01-01', 'date-to': '2026-07-31', currency: 'USD', unit: 'thousand', ...values})) input(`data-${id}`, value);
  }
  function close() { const target = new Element(); target.setAttribute('data-close', ''); modal.emit('click', {target}); }
  return {root, modal, menu, trigger, options, returnButton, saveButton, ui: window.BNTUI, document, elements, notices, data, input, filter, click, close, downloads, printWindows, chartMounts, lineDraws, observers, destinations, breadcrumbUpdates,
    state: () => JSON.parse(stored), printed: () => printed};
}

const app = await mount();
assert.equal(app.state().view, 'reports');
assert.match(html, /<main id="page-content" class="page-content"><div id="app"><\/div><\/main>/);
assert.doesNotMatch(html, /report-host/);
const chartScript = html.match(/<script src="\/assets\/js\/chart-stacked-bars\.js\?v=\d+"><\/script>/)?.[0];
assert.ok(chartScript, 'Load the shared bar renderer on the Reports page');
assert.ok(html.indexOf(chartScript) < html.indexOf('<script src="app.js?'), 'Load the shared component before the report adapter');
assert.ok((await read('transshipment.html')).includes(chartScript), 'The reference page and Reports use the same shared renderer version');
const builderHtml = await read('builder.html');
assert.ok(builderHtml.includes(chartScript), 'Constructor preview loads the same shared bar component');
assert.ok(builderHtml.indexOf(chartScript) < builderHtml.indexOf('<script src="app.js?'));
assert.match(app.root.innerHTML, /^<div class="div-block"><section class="page-title-actions">/);
assert.match(app.root.innerHTML, /<h1 class="typography-h4">Отчёты<\/h1><button class="sign_BTN_smallest"/);
assert.doesNotMatch(app.root.innerHTML, /Каждый шаблон|class="app"|filterbar|paper-title|class="paper"|<aside|<main/);
assert.match(app.root.innerHTML, /<section class="data-block"><div class="page-title-actions"><div class="page-title-actions__heading"><h2 class="typography-caption-small">Report &amp; &lt;test&gt;<\/h2><p class="typography-body-small">Description &amp; &lt;test&gt;<\/p>/);
assert.match(css, /\.page-title-actions__heading > \.typography-body-small\s*\{\s*margin: 0;\s*color: var\(--text-tertiary\);/);
assert.match(css, /\.data-block\s*\{[^}]*padding: var\(--space-3\);/);
assert.match(css, /\.data-block\s*\{[^}]*gap: var\(--space-3\);/);
assert.match(css, /\.data-block > \.page-title-actions\s*\{\s*align-items: flex-start;/);
assert.match(css, /\.data-block > \.page-title-actions \.typography-label-small,\s*\.data-block > \.page-title-actions \.typography-caption-small\s*\{[^}]*color: var\(--text-primary\);/);
assert.match(css, /\.analytics-block-heading \.typography-caption-small,\s*\.analytics-block-heading \.typography-caption-smallest,\s*\.analytics-block-heading \.typography-label-smallest:not\(\.analytics-eyebrow\)\s*\{[^}]*color: var\(--text-primary\);/);
assert.match(css, /\.page-title-actions__buttons\s*\{[^}]*align-self: flex-end;/);
assert.match(css, /\.data-block > \.page-title-actions \.typography-body-small,\s*\.data-block > \.page-title-actions > \.typography-indicator-small\s*\{[^}]*color: var\(--text-tertiary\);/);
assert.match(app.root.innerHTML, /<\/p><\/div><span class="typography-indicator-small">БНТ · 1С \/ Управленческая отчетность<\/span>/);
const heading = app.root.innerHTML.split('</section>')[0];
assert.ok(heading.indexOf('data-speed-dial-secondary') < heading.indexOf('data-action="report-filter"'));
assert.match(heading, /speed-dial-secondary--small/);
assert.match(heading, /speed-dial-secondary__trigger button-small button-small--secondary typography-button-small/);
assert.match(heading, /speed-dial-secondary__chevron nav-chevron/);
assert.doesNotMatch(heading, /speed-dial-secondary--up/);
assert.deepEqual([...heading.matchAll(/role="menuitem" data-action="([^"]+)"/g)].map(match => match[1]), [
  'toggle-tables', 'toggle-layout', 'add-block', 'report-excel', 'schedule-current', 'print'
]);
assert.equal((heading.match(/speed-dial-secondary__link typography-body-small"/g) || []).length, 6);
assert.match(heading, /Редактировать\nмакет/);
assert.match(heading, /navigation\.svg\?v=3#nav-mailings-solid/);
assert.ok(heading.includes(app.ui.icon('plus')));
for (const name of ['HideTables', 'EditLayout', 'Excel', 'Print']) {
  assert.match(heading, new RegExp(`financial-interface\\.svg\\?v=16#${name}`));
  const geometry = icons.match(new RegExp(`<symbol id="${name}"[^>]*>([\\s\\S]*?)<\\/symbol>`))[1];
  assert.match(geometry, /fill="currentColor"/);
  assert.doesNotMatch(geometry, /#[0-9a-fA-F]{3,8}/);
}
assert.match(css, /\.speed-dial-secondary__link\s*\{[^}]*text-align: left;/);
assert.match(css, /\.speed-dial-secondary__menu\s*\{[^}]*top: calc\(100% \+ var\(--space-1\)\);/);
assert.match(css, /\.speed-dial-secondary--up \.speed-dial-secondary__menu\s*\{[^}]*top: auto;[^}]*bottom:/);
assert.match(css, /\.speed-dial-secondary__trigger\[aria-expanded="true"\] \.speed-dial-secondary__chevron\s*\{\s*transform: rotate\(180deg\);/);
const smallest = app.ui.speedDialSecondary({label: 'Вид', className: 'speed-dial-secondary--up', items: [{label: '<test>', attributes: {'data-action': 'test'}}]});
assert.match(smallest, /speed-dial-secondary__trigger button-smallest-secondary-radius/);
assert.match(smallest, /typography-body-smallest/);
assert.match(smallest, /typography-indicator-small/);
assert.match(smallest, /&lt;test&gt;/);
assert.doesNotMatch(smallest, /speed-dial-secondary--small|speed-dial-secondary__chevron/);

app.document.emit('click', {target: app.trigger, preventDefault() {}});
assert.equal(app.options.hidden, false);
assert.equal(app.trigger.getAttribute('aria-expanded'), 'true');
app.document.emit('keydown', {target: app.trigger, key: 'Escape', stopImmediatePropagation() { this.stopped = true; }});
assert.equal(app.options.hidden, true);
app.ui.setSpeedDialOpen(app.menu, true);
app.document.emit('click', {target: new Element(), preventDefault() {}});
assert.equal(app.options.hidden, true, 'Outside click uses the existing shared close mechanic');

const info = app.click('report-info');
assert.equal(info.getAttribute('aria-expanded'), 'true');
assert.match(app.ui.infoPopoverElement.innerHTML, /Каждый шаблон открывает собственную форму/);
const blocks = app.state().blocks;
assert.match(app.root.innerHTML, /class="card table-block table-block--sticky-head"/);
app.ui.setSpeedDialOpen(app.menu, true);
app.click('toggle-tables', app.root, true);
assert.equal(app.options.hidden, true);
assert.equal(app.trigger.focused, true);
assert.equal(app.ui.infoPopoverElement.hidden, true);
assert.match(app.root.innerHTML, /Показать таблицы/);
assert.doesNotMatch(app.root.innerHTML, /class="data-table"/);
app.click('toggle-tables');
assert.match(app.root.innerHTML, /class="data-table"/);
app.click('toggle-layout');
assert.equal(app.state().editLayout, true);
assert.match(app.root.innerHTML, /Завершить\nредактирование/);
assert.deepEqual(app.state().blocks, blocks);

const trigger = app.click('report-filter');
assert.equal(trigger.getAttribute('aria-expanded'), 'true');
assert.match(app.modal.innerHTML, /filter-modal__drawer dt3-drawer/);
assert.match(app.modal.innerHTML, /filter-modal__fields ui-scrollbar/);
assert.equal((app.modal.innerHTML.match(/data-form-input-mode="single"/g) || []).length, 4);
assert.match(app.modal.innerHTML, /equipment-date-grid[\s\S]*Дата с[\s\S]*Дата по/);
assert.doesNotMatch(app.modal.innerHTML, /<select|type="search"|modal-note|class="overlay"/);
app.filter({source: 2}); app.close();
assert.equal(app.state().source, 1, 'Cancel discards the draft');
assert.equal(trigger.focused, true);
app.click('report-filter');
app.filter({'date-from': '2026-08-01', 'date-to': '2026-02-01'});
app.click('apply-data-filter', app.modal);
assert.equal(app.state().monthFrom, 1);
assert.ok(app.modal.innerHTML);
assert.equal(app.notices.at(-1)[0], 'Проверьте период');
const filterFocus = new Element(); app.root.queries.set('[data-action="report-filter"]', filterFocus);
const originalData = JSON.stringify(app.data);
app.filter({source: 2, currency: 'GEL', unit: 'raw', 'date-from': '2026-02-14', 'date-to': '2026-04-22'});
app.modal.emit('submit', {target: {matches: selector => selector === '[data-data-filter-form]'}, preventDefault() {}});
assert.equal(app.modal.innerHTML, '');
assert.equal(filterFocus.focused, true);
assert.equal(app.state().source, 2);
assert.equal(app.state().monthFrom, 2);
assert.equal(app.state().monthTo, 4);
assert.equal(app.state().dataDateFrom, '2026-02-14');
assert.equal(app.state().currency, 'GEL');
assert.equal(app.state().unit, 'raw');
assert.equal(app.state().activeTemplateId, 'cf-main', 'A report filter must not discard the selected template');
assert.match(app.root.innerHTML, /<h2 class="typography-caption-small">Report &amp; &lt;test&gt;<\/h2><p class="typography-body-small">Description &amp; &lt;test&gt;<\/p>/);
assert.deepEqual(app.state().blocks, blocks);
assert.equal(JSON.stringify(app.data), originalData);
assert.match(app.root.innerHTML, /БМП · 1С/);
app.click('report-excel', app.root, true);
assert.equal(app.downloads.length, 1);
assert.equal(app.downloads[0].type, 'application/vnd.ms-excel');
assert.match(await app.downloads[0].text(), /<table class="data-table">/);
app.click('print', app.root, true);
assert.equal(app.printed(), 1);
app.ui.setSpeedDialOpen(app.menu, true);
app.click('schedule-current', app.root, true);
assert.equal(app.options.hidden, true);
assert.match(app.modal.innerHTML, /id="schedule-drawer"/);
assert.match(app.modal.innerHTML, /data-time-input="schedule-time"/);
app.close();
assert.equal(app.trigger.focused, true, 'Closing Auto mailing returns to the visible menu trigger');
app.click('add-block', app.root, true);
assert.match(app.modal.innerHTML, /data-action="modal-add-block"/);
assert.match(app.modal.innerHTML, /id="report-blocks-drawer" class="filter-modal" role="dialog" aria-modal="true"/);
assert.match(app.modal.innerHTML, /<section class="filter-modal__drawer dt3-drawer"/);
assert.match(app.modal.innerHTML, /typography-caption-small">Блоки и формы/);
assert.match(app.modal.innerHTML, /data-scoped-search="report-catalog-search"/);
assert.match(app.modal.innerHTML, /layout-drawer-body dt-drawer-body ui-scrollbar/);
assert.match(app.modal.innerHTML, /role="tablist"[^]*?report-library-tab[^]*?report-forms-tab/);
assert.doesNotMatch(app.modal.innerHTML, /class="overlay"|block-picker|layout-workspace|filter-modal__fields|filter-modal__footer/);
assert.equal((app.modal.innerHTML.match(/<form\b/g) || []).length, 1, 'The only form in the non-form drawer is the shared search form');
const reportDrawerIds = [...app.modal.innerHTML.matchAll(/data-action="modal-add-block" data-id="([^"]+)"/g)].map(match => match[1]);
assert.equal(reportDrawerIds.length, 32);
assert.equal(new Set(reportDrawerIds).size, 32);
assert.deepEqual(app.state().blocks, blocks, 'Opening the catalog does not change the report');
app.close();
assert.equal(app.trigger.focused, true, 'Cancel returns focus to Actions');
assert.deepEqual(app.state().blocks, blocks);
app.click('add-block', app.root, true);
const stateBeforeCatalogPlus = JSON.stringify(app.state()), reportBeforeCatalogPlus = app.root.innerHTML, noticesBeforeCatalogPlus = app.notices.length;
app.click('modal-add-block', app.modal, false, {id: 'general_oil'});
assert.equal(app.modal.innerHTML, '');
assert.equal(JSON.stringify(app.state()), stateBeforeCatalogPlus, 'Plus is a close-only placeholder without model changes');
assert.equal(app.root.innerHTML, reportBeforeCatalogPlus, 'The report is not rerendered');
assert.equal(app.notices.length, noticesBeforeCatalogPlus, 'Plus produces no notification');
assert.equal(app.state().view, 'reports');
assert.equal(app.trigger.focused, true);
app.click('add-block', app.root, true);
app.click('modal-add-block', app.modal, false, {id: 'general_oil'});
assert.deepEqual(app.state().blocks, blocks);

const legacy = await mount('');
assert.match(legacy.root.innerHTML, /class="app"/);
assert.doesNotMatch(legacy.root.innerHTML, /speed-dial-secondary--small/);

const builder = await mount('builder', {state: {...legacy.state(), view: 'reports'}});
assert.equal(builder.state().view, 'builder', 'The standalone Constructor always opens its own screen');
const builderHeading = builder.root.innerHTML.split('</section>')[0];
assert.match(builder.root.innerHTML, /^<div class="content-block"><section class="page-title-actions">/);
assert.match(builderHeading, /<h1 class="typography-h4">Конструктор<\/h1><button class="sign_BTN_smallest"/);
assert.doesNotMatch(builderHeading, /Соберите|class="page-head"|class="btn"|filterbar/);
assert.doesNotMatch(builder.root.innerHTML, /class="app"|filterbar/);
assert.deepEqual([...builderHeading.matchAll(/role="menuitem" data-action="([^"]+)"/g)].map(match => match[1]), ['create-chart', 'preview']);
assert.match(builderHeading, /speed-dial-secondary--small/);
assert.match(builderHeading, /financial-interface\.svg\?v=16#ChartSolid/);
assert.match(builderHeading, /График\nпо показателю/);
assert.match(builderHeading, /navigation\.svg\?v=3#nav-reports-solid/);
assert.match(builderHeading, /button-small button-small--primary typography-button-small" type="button" data-action="save-template"[^]*?#StrokeSave[^]*?Сохранить шаблон/);
assert.doesNotMatch(builder.root.innerHTML, /builder-filter|>Фильтр</, 'Data settings belong only to Preview in the Constructor');
assert.ok(builderHeading.indexOf('data-action="save-template"') > builderHeading.indexOf('</ul>'), 'Save stays outside the secondary menu');
for (const [name, count] of [['ChartSolid', 4], ['StrokeSave', 1]]) {
  const geometry = icons.match(new RegExp(`<symbol id="${name}"[^>]*>([\\s\\S]*?)<\\/symbol>`))[1];
  assert.equal((geometry.match(/<path /g) || []).length, count);
  assert.match(geometry, /fill="currentColor"/);
  assert.doesNotMatch(geometry, /#[0-9a-fA-F]{3,8}/);
}
const canvasBlocks = markup => [...markup.matchAll(/<div class="canvas-block"[^]*?<\/button><\/div>/g)].map(match => match[0]);
const originalBuilderCards = canvasBlocks(builder.root.innerHTML);
const canvasIds = markup => canvasBlocks(markup).map(block => block.match(/data-canvas-block="([^"]+)"/)[1]);
assert.deepEqual(canvasIds(builder.root.innerHTML), canvasIds(legacy.root.innerHTML), 'Shared canvas cards retain the original blocks and order');
for (const card of originalBuilderCards) {
  assert.equal((card.match(/class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest"/g) || []).length, 2);
  assert.match(card, /type="button" draggable="true" title="Переместить блок" aria-label="Переместить блок"[^]*?#Drag/);
  assert.match(card, /class="layout-item-label"><strong>[^]*?<\/strong><small>[^]*?<\/small><\/div>/);
  assert.match(card, /type="button" data-action="remove-block"[^]*?title="Удалить блок" aria-label="Удалить блок"[^]*?#Cross/);
  assert.doesNotMatch(card, /class="drag"|class="icon-btn"|<b>/);
}
const dragGeometry = icons.match(/<symbol id="Drag"[^>]*>([^]*?)<\/symbol>/)[1];
assert.equal((dragGeometry.match(/<path /g) || []).length, 6, 'Drag uses the supplied six-dot icon');
assert.equal((dragGeometry.match(/fill="currentColor"/g) || []).length, 6);
assert.match(builder.root.innerHTML, /class="canvas layout-workspace" data-workspace data-workspace-fill data-workspace-dismiss/);
assert.match(builder.root.innerHTML, /data-workspace-toggle data-workspace-collapsed hidden[^>]*aria-expanded="true"/);
assert.match(builder.root.innerHTML, /<aside id="builder-blocks-drawer"[^>]*aria-labelledby="builder-blocks-title">/, 'The catalog is open and not inert on first load');
assert.match(builder.root.innerHTML, /layout-drawer-controls[^]*?<span class="ui-divider brand-divider" aria-hidden="true"><\/span>[^]*?<\/header>/);
assert.doesNotMatch(builder.root.innerHTML, /builder-layout|class="catalog"|canvas-head|layout-workspace--drawer-left/);
assert.match(builder.root.innerHTML, /layout-toolbar-group--left[^]*?typography-caption-small">Холст отчета[^]*?data-action="canvas-info"/);
assert.doesNotMatch(builder.root.innerHTML, /layout-toolbar-group--center|data-workspace-open|>Добавить блок</);
assert.match(builder.root.innerHTML, /layout-toolbar-group--right layout-drawer-controls[^]*?data-workspace-toggle[^]*?#More[^]*?>Блоки и формы</);
assert.match(builder.root.innerHTML, /layout-drawer-head[^]*?typography-caption-small">Блоки и формы[^]*?data-workspace-close/);
assert.match(builder.root.innerHTML, /role="tablist"[^]*?data-workspace-tab="library"[^]*?<span>Блоки<\/span>[^]*?data-action="builder-library-info"[^]*?data-workspace-tab="forms"[^]*?<span>Формы<\/span>[^]*?data-action="builder-forms-info"/);
assert.match(builder.root.innerHTML, /layout-drawer-body dt-drawer-body ui-scrollbar/);
assert.match(builder.root.innerHTML, /<button class="layout-item"[^]*?#nav-builder-solid[^]*?layout-item-action[^]*?d="M10 4\.375V15\.625M15\.625 10H4\.375"[^]*?stroke-width="1\.5"/);
assert.doesNotMatch(builder.root.innerHTML, /#nav-builder-outline/);
assert.doesNotMatch(builder.root.innerHTML, /ui-divider--vertical/);
assert.match(builder.root.innerHTML, /class="layout-surface layout-surface--secondary ui-scrollbar"/);
assert.ok(builder.root.innerHTML.indexOf('class="layout-surface') < builder.root.innerHTML.indexOf('<aside id="builder-blocks-drawer"'), 'Canvas precedes the right drawer');
const catalogPanels = markup => Object.fromEntries([...markup.matchAll(/<section id="builder-(library|forms)-panel"[^]*?<\/section>/g)].map(match => [match[1], match[0]]));
const catalogItems = markup => [...markup.matchAll(/<button class="layout-item"([^]*?)<\/button>/g)].map(match => ({id: match[1].match(/data-id="([^"]+)"/)[1], markup: match[0]}));
const panels = catalogPanels(builder.root.innerHTML);
const libraryItems = catalogItems(panels.library), formItems = catalogItems(panels.forms);
assert.equal(libraryItems.length, 21);
assert.equal(formItems.length, 11);
const catalogIds = [...libraryItems, ...formItems].map(item => item.id);
app.click('add-block', app.root, true);
assert.match(app.modal.innerHTML, /id="report-blocks-drawer" class="filter-modal" role="dialog" aria-modal="true"/);
assert.match(app.modal.innerHTML, /data-scoped-search="report-catalog-search"/);
assert.doesNotMatch(app.modal.innerHTML, /class="overlay"|class="modal"|block-picker|class="icon-btn"/);
const modalIds = [...app.modal.innerHTML.matchAll(/data-action="modal-add-block" data-id="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual([...catalogIds].sort(), modalIds.sort(), 'Every modal entry appears exactly once in the drawer');
app.close();
assert.equal(app.trigger.focused, true, 'Report catalog cancellation restores focus');
assert.doesNotMatch(builder.root.innerHTML, /data-action="add-block"/, 'Builder uses its existing inline library, not the retired modal action');
assert.deepEqual(formItems.map(item => item.id), ['general_oil', 'general_oil_dry', 'general_total_cargo', 'is_income', 'is_core_income', 'is_transshipment', 'is_expenses', 'cons_production', 'cons_finance', 'cons_capex', 'cons_payroll']);
for (const item of libraryItems) { assert.match(item.markup, /#nav-management-solid/); assert.doesNotMatch(item.markup, /#nav-builder-solid/); }
for (const item of formItems) { assert.match(item.markup, /#nav-builder-solid/); assert.doesNotMatch(item.markup, /#nav-management-solid/); }
assert.match(builder.root.innerHTML, /data-scoped-search="builder-catalog-search"[^]*?dt3-multisearch-field shell-search-field/);
assert.ok(builder.root.innerHTML.indexOf('data-scoped-search') < builder.root.innerHTML.indexOf('role="tablist"'), 'Search stays above the tabs');
assert.deepEqual([...builder.root.innerHTML.matchAll(/data-ui-dropdown-option="([^"]+)"/g)].map(match => match[1]), ['all', 'blocks', 'forms']);
assert.match(builder.root.innerHTML, /data-builder-catalog-results[^>]* hidden><\/section>/);

const catalogBuilder = await mount('builder', {state: {view: 'builder', blocks: []}});
const catalogWorkspace = new Element(); catalogWorkspace.setAttribute('data-workspace', ''); catalogWorkspace.dataset.workspaceTab = 'library'; catalogWorkspace.eventParent = catalogBuilder.root;
const catalogTabs = ['library', 'forms'].map(tab => { const node = new Element(); node.dataset.workspaceTab = tab; return node; });
const catalogSections = ['library', 'forms'].map(tab => { const node = new Element(); node.dataset.workspacePanel = tab; return node; });
const tabBar = new Element(), defaultCatalog = new Element(), resultsCatalog = new Element(); resultsCatalog.hidden = true;
catalogWorkspace.queries.set('[data-builder-catalog-tabs], [data-builder-catalog-default]', [tabBar, defaultCatalog]);
catalogWorkspace.queries.set('[data-builder-catalog-results]', resultsCatalog);
catalogWorkspace.queries.set('[role="tab"][data-workspace-tab]', catalogTabs);
catalogWorkspace.queries.set('[data-workspace-panel]', catalogSections);
catalogBuilder.root.queries.set('[data-workspace]', catalogWorkspace);
const searchForm = new Element(); searchForm.dataset = {scopedSearch: 'builder-catalog-search', scopedSearchActive: 'false', scopedSearchQuery: ''}; searchForm.setAttribute('data-scoped-search', 'builder-catalog-search'); searchForm.eventParent = catalogBuilder.root;
const searchField = catalogBuilder.input('builder-catalog-search', ''); searchField.type = 'search'; searchField.scopedSearchRoot = searchForm;
const searchButton = new Element(); searchButton.setAttribute('data-scoped-search-submit', ''); searchButton.scopedSearchRoot = searchForm;
searchForm.queries.set('input[type="search"]', searchField); searchForm.queries.set('[data-scoped-search-submit]', searchButton);
const scopeDropdown = new Element(); scopeDropdown.setAttribute('data-ui-dropdown', 'builder-catalog-search-scope'); scopeDropdown.dataset = {uiDropdown: 'builder-catalog-search-scope', value: 'all'}; scopeDropdown.eventParent = catalogBuilder.document; scopeDropdown.scopedSearchRoot = searchForm;
searchForm.queries.set('[data-ui-dropdown]', scopeDropdown);
const scopeOptions = ['all', 'blocks', 'forms'].map(value => { const option = new Element(); option.dataset.uiDropdownOption = value; option.dropdownRoot = scopeDropdown; return option; });
scopeDropdown.queries.set('[data-ui-dropdown-option]', scopeOptions);
catalogWorkspace.queries.set('[data-ui-dropdown="builder-catalog-search-scope"]', scopeDropdown);
const search = value => { searchField.value = value; catalogBuilder.root.emit('input', {target: searchField}); catalogBuilder.document.emit('input', {target: searchField}); };
const enterSearch = () => catalogBuilder.document.emit('keydown', {target: searchField, key: 'Enter', preventDefault() { this.prevented = true; }});
const visibleIds = () => catalogItems(resultsCatalog.innerHTML).map(item => item.id);
search('  EBITDA  ');
assert.equal(tabBar.hidden, undefined, 'Typing alone keeps the default tabs and catalogue');
assert.equal(resultsCatalog.hidden, true);
enterSearch();
assert.deepEqual(visibleIds(), ['metricTrend', 'general_ebitda', 'general_margin']);
assert.equal(tabBar.hidden, true); assert.equal(defaultCatalog.hidden, true); assert.equal(resultsCatalog.hidden, false);
assert.equal(searchButton.type, 'button'); assert.equal(searchButton.getAttribute('aria-label'), 'Очистить поиск');
search('фонд оплаты');
assert.deepEqual(visibleIds(), ['metricTrend', 'general_ebitda', 'general_margin'], 'Editing an applied query waits for Enter');
enterSearch();
assert.deepEqual(visibleIds(), ['cons_payroll']);
assert.equal(catalogWorkspace.dataset.workspaceTab, 'library', 'Mixed search does not select an invisible tab');
assert.deepEqual(catalogBuilder.state().blocks, [], 'Searching never changes the canvas');
catalogBuilder.ui.selectDropdownOption(scopeOptions[1]);
assert.equal(catalogWorkspace.dataset.workspaceTab, 'library');
assert.deepEqual(visibleIds(), [], 'The Blocks scope excludes ready forms');
search('');
assert.equal(tabBar.hidden, false); assert.equal(defaultCatalog.hidden, false); assert.equal(resultsCatalog.hidden, true);
assert.equal(resultsCatalog.innerHTML, ''); assert.equal(searchButton.type, 'submit');
assert.equal(searchButton.getAttribute('aria-label'), 'Найти');
catalogBuilder.ui.setWorkspaceTab(catalogWorkspace, 'forms');
assert.equal(scopeDropdown.dataset.value, 'forms', 'Manual tabs keep a selected category scope in sync');
catalogBuilder.ui.selectDropdownOption(scopeOptions[0]);
search('no matching item');
enterSearch();
assert.deepEqual(visibleIds(), []);
assert.match(resultsCatalog.innerHTML, /empty-state--smallest[^]*?Ничего не найдено/);
catalogBuilder.document.emit('click', {target: searchButton, preventDefault() {}});
assert.equal(searchField.value, ''); assert.equal(searchField.focused, true);
assert.equal(tabBar.hidden, false); assert.equal(resultsCatalog.hidden, true);
let submitted = false;
search('капитальные');
catalogBuilder.document.emit('submit', {target: searchForm, preventDefault() { submitted = true; }});
assert.equal(submitted, true, 'Submitting search never navigates or reloads');
assert.deepEqual(visibleIds(), ['general_capex', 'cons_capex'], 'All searches combine blocks and forms');
catalogBuilder.click('catalog-add', catalogBuilder.root, false, {id: 'cons_capex'});
assert.deepEqual(catalogBuilder.state().blocks, ['cons_capex'], 'Newly migrated ready forms can be added');
assert.match(catalogBuilder.root.innerHTML, /id="builder-catalog-search"[^>]*value="капитальные"/);
const filteredItems = catalogItems(catalogBuilder.root.innerHTML.split('<section data-builder-catalog-results')[1]).map(item => item.id);
assert.deepEqual(filteredItems, ['general_capex', 'cons_capex'], 'Adding preserves the current search and shows no duplicate catalogue');
assert.match(catalogBuilder.root.innerHTML, /data-builder-catalog-tabs hidden/);
assert.match(catalogBuilder.root.innerHTML, /data-scoped-search-active="true" data-scoped-search-query="капитальные"/);
assert.match(catalogBuilder.root.innerHTML, /data-workspace-tab="forms" aria-selected="true"/);
const workspaceBuilder = await mount('builder', {state: legacy.state()});
const workspaceTarget = new Element(); workspaceTarget.setAttribute('data-workspace', '');
workspaceBuilder.root.emit('workspacechange', {target: workspaceTarget, detail: {open: true, tab: 'forms'}});
const originalBlocks = [...workspaceBuilder.state().blocks];
const draggedBlock = new Element(), dropTarget = new Element();
draggedBlock.dataset.canvasBlock = originalBlocks[0]; dropTarget.dataset.canvasBlock = 'inflow';
workspaceBuilder.document.queries.set('[data-block][draggable="true"], [data-canvas-block]', [draggedBlock, dropTarget]);
workspaceBuilder.click('catalog-add', workspaceBuilder.root, false, {id: 'inflow'});
assert.deepEqual(workspaceBuilder.state().blocks, [...originalBlocks, 'inflow']);
assert.match(workspaceBuilder.root.innerHTML, /class="canvas layout-workspace" data-workspace/);
assert.match(workspaceBuilder.root.innerHTML, /data-workspace-tab="forms" aria-selected="true"/);
const nativeTransfer = {setData(type, value) { this.payload = {type, value}; }, setDragImage(element, x, y) { this.image = {element, x, y}; }};
const dragHandle = new Element(); dragHandle.eventParent = draggedBlock;
const nativeStart = new Event('dragstart', {bubbles: true});
Object.defineProperty(nativeStart, 'dataTransfer', {value: nativeTransfer});
dragHandle.dispatchEvent(nativeStart);
assert.deepEqual(nativeTransfer.payload, {type: 'text/plain', value: originalBlocks[0]}, 'The nested icon button supplies native drag data');
assert.equal(nativeTransfer.effectAllowed, 'move');
assert.equal(nativeTransfer.image.element, draggedBlock, 'The drag image is the entire card, not the six-dot icon');
let canvasDropAllowed = false;
dropTarget.emit('dragover', {dataTransfer: nativeTransfer, preventDefault() { canvasDropAllowed = true; }});
assert.equal(canvasDropAllowed, true);
assert.equal(nativeTransfer.dropEffect, 'move');
dropTarget.emit('drop', {preventDefault() {}});
assert.deepEqual(workspaceBuilder.state().blocks, ['inflow', ...originalBlocks], 'Native handle drag reorders and persists the canvas');
dropTarget.emit('drop', {preventDefault() {}});
assert.deepEqual(workspaceBuilder.state().blocks, ['inflow', ...originalBlocks], 'A completed drop cannot reuse stale drag state');
draggedBlock.emit('dragstart', {}); draggedBlock.emit('dragend', {});
dropTarget.emit('drop', {preventDefault() {}});
assert.deepEqual(workspaceBuilder.state().blocks, ['inflow', ...originalBlocks], 'Cancelled drags clear the source');
workspaceBuilder.click('catalog-add', workspaceBuilder.root, false, {id: 'inflow'});
assert.deepEqual(workspaceBuilder.state().blocks, ['inflow', ...originalBlocks], 'An already-added block is not duplicated');
workspaceBuilder.click('remove-block', workspaceBuilder.root, false, {id: 'inflow'});
assert.deepEqual(workspaceBuilder.state().blocks, originalBlocks);
assert.match(workspaceBuilder.root.innerHTML, /data-workspace-tab="forms" aria-selected="true"/, 'Editing blocks preserves the open drawer and selected tab');
assert.deepEqual(canvasBlocks(workspaceBuilder.root.innerHTML), originalBuilderCards);
builder.click('canvas-info');
assert.match(builder.ui.infoPopoverElement.innerHTML, /Перетаскивайте блоки\. Индивидуальные графики сохраняются вместе с шаблоном/);
builder.click('builder-library-info');
assert.match(builder.ui.infoPopoverElement.innerHTML, /Финансовые, производственные и контрольные представления/);
builder.click('builder-forms-info');
assert.match(builder.ui.infoPopoverElement.innerHTML, /Здесь вы найдёте комплексные блоки и составные таблицы\./);
const builderInfo = builder.click('builder-info');
assert.equal(builderInfo.getAttribute('aria-expanded'), 'true');
assert.match(builder.ui.infoPopoverElement.innerHTML, /Соберите новую форму из готовых блоков/);
assert.match(builder.ui.infoPopoverElement.innerHTML, /Рабочая область остается широкой/);
builder.ui.setSpeedDialOpen(builder.menu, true);
builder.click('preview', builder.root, true);
assert.equal(builder.options.hidden, true);
assert.equal(builder.ui.infoPopoverElement.hidden, true);
assert.equal(builder.trigger.getAttribute('aria-expanded'), 'false', 'Opening a drawer must not reopen the closed Actions menu');
assert.match(builder.modal.innerHTML, /id="builder-preview-drawer"/);
assert.match(builder.modal.innerHTML, /filter-modal__title typography-caption-small">Настройка данных для предпросмотра/);
assert.match(builder.modal.innerHTML, /filter-modal__fields ui-scrollbar/);
assert.match(builder.modal.innerHTML, /data-builder-preview-form/);
assert.equal((builder.modal.innerHTML.match(/data-form-input-mode="single"/g) || []).length, 4);
assert.match(builder.modal.innerHTML, /equipment-date-grid[^]*?Дата с[^]*?Дата по/);
assert.match(builder.modal.innerHTML, /button-smallest-primary-radius typography-button-smallest" type="submit" data-action="apply-builder-preview"[^]*?Применить/);
assert.match(builder.modal.innerHTML, /button-smallest-secondary-radius typography-button-smallest" type="button" data-close[^]*?Отмена/);
assert.doesNotMatch(builder.modal.innerHTML, /<select|class="overlay"|reset-data-filter|modal-note/);
const builderBeforePreview = builder.state();
builder.filter({source: 2}); builder.close();
assert.deepEqual(builder.state(), builderBeforePreview, 'Cancel discards the entire preview draft');
assert.equal(builder.trigger.getAttribute('aria-expanded'), 'false');
assert.equal(builder.trigger.focused, true, 'Cancel restores focus to the visible Actions trigger');
assert.deepEqual(builder.destinations, []);
builder.click('preview', builder.root, true);
for (const dates of [
  {'date-from': '', 'date-to': '2026-07-31'},
  {'date-from': '2026-08-01', 'date-to': '2026-02-01'},
  {'date-from': '2025-02-01', 'date-to': '2026-07-31'},
  {'date-from': '2026-02-30', 'date-to': '2026-07-31'}
]) {
  builder.filter(dates); builder.click('apply-builder-preview', builder.modal);
  assert.deepEqual(builder.state(), builderBeforePreview);
  assert.ok(builder.modal.innerHTML, 'Invalid preview dates keep the drawer open');
  assert.equal(builder.notices.at(-1)[0], 'Проверьте период');
  assert.deepEqual(builder.destinations, []);
}
builder.filter({source: 2, year: 2025, currency: 'GEL', unit: 'raw', 'date-from': '2025-02-14', 'date-to': '2025-04-22'});
builder.modal.emit('submit', {target: {matches: selector => selector === '[data-builder-preview-form]'}, preventDefault() {}});
assert.equal(builder.modal.innerHTML, '');
assert.deepEqual(builder.destinations, [], 'Applying preview settings must not navigate to Reports');
assert.equal(builder.state().view, 'builder');
assert.equal(builder.returnButton.focused, true, 'Apply focuses the visible return button');
assert.match(builder.root.innerHTML, /^<div class="content-block"><div class="page-title-actions"><button class="button-smallest-ghost typography-button-smallest" type="button" data-action="return-builder"/);
assert.match(builder.root.innerHTML, /financial-interface\.svg\?v=16#StrokeReturn[^]*?<span>Конструктор<\/span>/);
assert.ok(builder.root.innerHTML.indexOf('data-action="return-builder"') < builder.root.innerHTML.indexOf('<section class="data-block">'), 'Preview replaces only the content below the Ghost button');
assert.doesNotMatch(builder.root.innerHTML, /builder-layout|<h1 class="typography-h4">Отчёты|report-actions-trigger|report-filter/, 'No Reports navigation or toolbar is inserted');
assert.equal(builder.chartMounts.length, 1, 'Apply mounts the shared chart with the selected data');
assert.deepEqual([...builder.chartMounts[0].options.datasets.default].map(row => row.label), ['Фев', 'Мар', 'Апр']);
assert.equal(builder.chartMounts[0].options.datasets.default[0].values[0], 10720, 'The selected company, year, currency and unit are applied');
assert.deepEqual(builder.breadcrumbUpdates.at(-1).map(item => item.label), ['Конструктор', 'Предпросмотр']);
assert.equal(builder.breadcrumbUpdates.at(-1)[0].href, '/builder');
assert.equal(typeof builder.breadcrumbUpdates.at(-1)[0].onClick, 'function');
const returnIcon = icons.match(/<symbol id="StrokeReturn"[^>]*>([^]*?)<\/symbol>/)[1];
assert.match(returnIcon, /stroke-width="1.5"/);
assert.match(returnIcon, /vector-effect="non-scaling-stroke"/);
assert.equal(builder.state().activeTemplateId, builderBeforePreview.activeTemplateId);
assert.equal(builder.state().source, 2);
assert.equal(builder.state().year, 2025);
assert.equal(builder.state().monthFrom, 2);
assert.equal(builder.state().monthTo, 4);
assert.equal(builder.state().dataDateFrom, '2025-02-14');
assert.equal(builder.state().dataDateTo, '2025-04-22');
assert.equal(builder.state().currency, 'GEL');
assert.equal(builder.state().unit, 'raw');
assert.deepEqual(builder.state().blocks, builderBeforePreview.blocks);
assert.deepEqual(builder.state().customBlocks, builderBeforePreview.customBlocks);
const sharedReportBody = markup => markup.slice(markup.indexOf('<section class="data-block">'), -'</div>'.length);
const previewReport = await mount('reports', {state: {...builder.state(), editLayout: false}});
assert.equal(sharedReportBody(builder.root.innerHTML), sharedReportBody(previewReport.root.innerHTML), 'Preview reuses the unchanged Reports body and all its components');
const previewReload = await mount('builder', {state: builder.state()});
assert.equal(previewReload.state().view, 'builder');
assert.match(previewReload.root.innerHTML, /<h1 class="typography-h4">Конструктор<\/h1>/);
assert.deepEqual(previewReload.state(), builder.state(), 'Applied settings and blocks survive a Constructor reload');
const appliedBuilderState = builder.state();
builder.click('return-builder');
assert.deepEqual(canvasBlocks(builder.root.innerHTML), originalBuilderCards, 'Ghost restores the shared canvas cards');
assert.match(builder.root.innerHTML, /class="canvas layout-workspace/);
assert.deepEqual(builder.state(), appliedBuilderState);
assert.equal(builder.trigger.focused, true);
assert.equal(builder.breadcrumbUpdates.at(-1), null, 'Return restores the original shell breadcrumbs');
assert.ok(builder.chartMounts.every(chart => chart.destroyed), 'Returning disposes preview chart listeners and observers');
builder.click('preview', builder.root, true); builder.filter();
builder.click('apply-builder-preview', builder.modal);
builder.breadcrumbUpdates.at(-1)[0].onClick();
assert.match(builder.root.innerHTML, /class="canvas layout-workspace/);
assert.equal(builder.breadcrumbUpdates.at(-1), null, 'The Constructor breadcrumb also returns in place');
assert.deepEqual(builder.destinations, []);

const builderFilter = await mount('builder', {state: {...legacy.state(), year: 2024, monthFrom: 2, monthTo: 2}});
builderFilter.click('preview', builderFilter.root, true);
builderFilter.filter({year: 2025});
for (const part of ['from', 'to']) {
  const field = new Element(), input = builderFilter.input(`data-date-${part}`, '2024-02-29');
  field.queries.set('[data-bnt-date]', input);
  field.queries.set('[data-bnt-date-text]', new Element());
  builderFilter.modal.queries.set(`[data-bnt-date-root="data-date-${part}"]`, field);
}
builderFilter.modal.emit('change', {target: builderFilter.elements.get('#data-year')});
for (const part of ['from', 'to']) {
  assert.equal(builderFilter.elements.get(`#data-date-${part}`).value, '2025-02-28');
  const field = builderFilter.modal.queries.get(`[data-bnt-date-root="data-date-${part}"]`);
  assert.equal(field.dataset.dateMin, '2025-01-01');
  assert.equal(field.dataset.dateMax, '2025-12-31');
}
assert.equal(builderFilter.state().year, 2024, 'Changing the year only updates draft dates');
const previewDrawer = new Element(), firstPreviewControl = new Element(), lastPreviewControl = new Element();
previewDrawer.queries.set('button, input:not([type="hidden"]), textarea, [tabindex="0"]', [firstPreviewControl, lastPreviewControl]);
builderFilter.modal.queries.set('[data-studio-drawer]', previewDrawer);
builderFilter.document.activeElement = lastPreviewControl;
builderFilter.document.emit('keydown', {target: lastPreviewControl, key: 'Tab', preventDefault() {}});
assert.equal(firstPreviewControl.focused, true, 'The preview reuses the shared drawer focus loop');
builderFilter.document.emit('keydown', {target: firstPreviewControl, key: 'Escape', preventDefault() {}, stopImmediatePropagation() { this.stopped = true; }});
assert.equal(builderFilter.modal.innerHTML, '');
assert.equal(builderFilter.trigger.focused, true);
builderFilter.click('preview', builderFilter.root, true); builderFilter.filter();
builderFilter.click('apply-builder-preview', builderFilter.modal);
assert.deepEqual(builderFilter.destinations, [], 'Clicking Apply commits without navigating');
assert.equal(builderFilter.modal.innerHTML, '');
assert.equal(builderFilter.state().view, 'builder');
assert.equal(builderFilter.returnButton.focused, true);
assert.match(builderFilter.root.innerHTML, /data-action="return-builder"[^]*?class="data-block"/);

const filteredBuilder = await mount('builder');
const saveTrigger = filteredBuilder.click('save-template');
const saveDrawer = filteredBuilder.modal.innerHTML;
assert.match(saveDrawer, /id="template-save-drawer" class="filter-modal"[^]*?data-template-save-form/);
assert.match(saveDrawer, /filter-modal__title typography-caption-small">Сохранить шаблон<\/h2>/);
assert.match(saveDrawer, /id="tpl-name"[^>]* required/);
assert.match(saveDrawer, /form-input__text-field[^]*?<textarea class="form-input__control form-input__control--text typography-body-smallest" id="tpl-desc"/);
assert.match(saveDrawer, /data-form-input="tpl-tag" data-form-input-mode="single"/);
assert.match(saveDrawer, /Форма доступа[^]*?data-form-input-option="Личный"[^]*?data-form-input-option="ПЭО"[^]*?data-form-input-option="Общий"/);
assert.doesNotMatch(saveDrawer, /class="overlay"|class="modal|class="field"|<select/);
const beforeSave = filteredBuilder.state();
filteredBuilder.close();
assert.equal(saveTrigger.focused, true);
assert.deepEqual(filteredBuilder.state(), beforeSave, 'Cancel leaves the template and canvas unchanged');
filteredBuilder.click('save-template');
const missingName = filteredBuilder.input('tpl-name', '  ');
filteredBuilder.input('tpl-desc', 'Description'); filteredBuilder.input('tpl-tag', 'Личный');
filteredBuilder.click('confirm-save', filteredBuilder.modal);
assert.equal(missingName.focused, true);
assert.equal(filteredBuilder.state().customTemplates.length, 0);
filteredBuilder.input('tpl-name', '  Personal template  ');
const missingDescription = filteredBuilder.input('tpl-desc', '  ');
filteredBuilder.click('confirm-save', filteredBuilder.modal);
assert.equal(missingDescription.focused, true);
assert.equal(filteredBuilder.state().customTemplates.length, 0);
filteredBuilder.input('tpl-desc', '  Template description  ');
filteredBuilder.input('tpl-tag', 'Invalid'); filteredBuilder.click('confirm-save', filteredBuilder.modal);
assert.equal(filteredBuilder.state().customTemplates.length, 0, 'Unknown access cannot be saved');
filteredBuilder.input('tpl-tag', 'Личный');
filteredBuilder.click('confirm-save', filteredBuilder.modal);
assert.equal(filteredBuilder.modal.innerHTML, '');
assert.equal(filteredBuilder.saveButton.focused, true);
assert.equal(filteredBuilder.state().view, 'builder');
assert.equal(filteredBuilder.state().customTemplates.length, 1, 'A click saves exactly once');
assert.equal(filteredBuilder.state().customTemplates[0].name, 'Personal template');
assert.equal(filteredBuilder.state().customTemplates[0].description, 'Template description');
assert.deepEqual(filteredBuilder.state().customTemplates[0].blocks, beforeSave.blocks);
assert.deepEqual(filteredBuilder.state().customTemplates[0].customBlocks, beforeSave.customBlocks);
assert.deepEqual(canvasBlocks(filteredBuilder.root.innerHTML), originalBuilderCards, 'Saving retains the shared canvas cards');
filteredBuilder.close(); filteredBuilder.click('create-chart', filteredBuilder.root, true);
assert.match(filteredBuilder.modal.innerHTML, /id="data-chart-drawer" class="filter-modal" role="dialog" aria-modal="true"[^]*?filter-modal__drawer dt3-drawer[^]*?data-data-chart-form/);
assert.match(filteredBuilder.modal.innerHTML, /scenario-copy__title-row[^]*?filter-modal__title typography-caption-small">Создать график по показателю<\/h2><button class="sign_BTN_smallest"[^]*?data-drawer-info="График будет добавлен в текущий шаблон и сохранится в JSON-конфигурации\."/);
for (const field of ['chart-kind', 'chart-row', 'chart-type', 'chart-size']) assert.ok(filteredBuilder.modal.innerHTML.includes(`data-form-input="${field}"`));
assert.doesNotMatch(filteredBuilder.modal.innerHTML, /class="overlay"|modal-card|<select|class="field"|modal-note/);
assert.match(filteredBuilder.modal.innerHTML, /filter-modal__footer[^]*?button-smallest-primary-radius[^]*?confirm-data-chart[^]*?Добавить график[^]*?button-smallest-secondary-radius[^]*?Отмена/);
const chartInfo = new Element(); chartInfo.setAttribute('data-drawer-info', '');
chartInfo.dataset = {drawerInfoTitle: 'Создать график по показателю', drawerInfo: 'График будет добавлен в текущий шаблон и сохранится в JSON-конфигурации.'};
filteredBuilder.document.emit('click', {target: chartInfo, preventDefault() {}});
assert.equal(chartInfo.getAttribute('aria-expanded'), 'true');
assert.match(filteredBuilder.ui.infoPopoverElement.innerHTML, /График будет добавлен в текущий шаблон и сохранится в JSON-конфигурации\./);
filteredBuilder.close();
assert.doesNotMatch(filteredBuilder.root.innerHTML, /data-action="add-block"/);
legacy.click('preview');
assert.match(legacy.root.innerHTML, /class="paper"/, 'The standalone legacy preview keeps its existing behavior');
assert.equal(legacy.modal.innerHTML, '');
assert.deepEqual(legacy.destinations, []);

for (const page of ['builder', 'reports']) {
  const chartHost = await mount(page);
  const beforeChart = chartHost.state();
  const chartTrigger = chartHost.click('create-chart', chartHost.root, true);
  assert.match(chartHost.modal.innerHTML, /id="chart-row"[^>]*value="revenue"/);
  chartHost.close();
  assert.equal(chartHost.modal.innerHTML, '');
  assert.equal(chartHost.trigger.focused, true, 'Cancelling restores the Actions trigger');
  assert.deepEqual(chartHost.state(), beforeChart);
  chartHost.click('create-chart', chartHost.root, true);
  for (const [name, value] of [['chart-kind', 'fi'], ['chart-row', 'revenue'], ['chart-type', 'indicatorColumn'], ['chart-size', 'third']]) chartHost.input(name, value);
  chartHost.modal.emit('change', {target: chartHost.elements.get('#chart-kind')});
  assert.match(chartHost.modal.innerHTML, /id="chart-size"[^>]*value="third"/);
  assert.match(chartHost.modal.innerHTML, /id="chart-type"[^>]*value="indicatorColumn"/);
  chartHost.input('chart-row', 'missing');
  chartHost.click('confirm-data-chart', chartHost.modal);
  assert.match(chartHost.modal.innerHTML, /data-data-chart-form/);
  assert.deepEqual(chartHost.state().blocks, beforeChart.blocks, 'An invalid indicator does not save or dismiss');
  chartHost.input('chart-row', 'revenue');
  chartHost.modal.emit('submit', {target: {matches: selector => selector === '[data-data-chart-form]'}, preventDefault() {}});
  assert.equal(chartHost.modal.innerHTML, '');
  assert.equal(chartHost.state().view, page, 'Creating a chart stays on its source page');
  assert.equal(chartHost.state().blocks.length, beforeChart.blocks.length + 1);
  assert.deepEqual(Object.values(chartHost.state().customBlocks).at(-1), {title: 'Revenue', kind: 'fi', type: 'indicatorColumn', size: 'third', rowKey: 'BIHL0574'});
  assert.deepEqual(chartHost.destinations, []);
  assert.equal(chartTrigger.menuRoot, chartHost.menu);
}

const cfBlocks = ['transshipment', 'inflow', 'netflow', 'outflow', 'waterfall'];
for (const [access, tone] of [['Личный', 'neutral'], ['Общий', 'purple'], ['ПЭО', 'mustard']]) {
  const template = {id: 'access-template', name: 'Template & <test>', description: 'Description', tag: access, blocks: cfBlocks};
  const preview = await mount('builder', {state: {activeTemplateId: template.id, blocks: [...cfBlocks, 'custom-line'], customBlocks: {'custom-line': {title: 'Graph & <test>', kind: 'fi', type: 'indicatorLine', size: 'half', rowKey: 'BIHL0574'}}, templateOverrides: {[template.id]: {value: 5}}, seedOverrides: {[template.id]: {value: 7}}}, templates: [template]});
  preview.click('preview', preview.root, true); preview.filter(); preview.click('apply-builder-preview', preview.modal);
  const heading = preview.root.innerHTML.slice(preview.root.innerHTML.indexOf('<section class="page-title-actions" aria-label="Шаблон">'), preview.root.innerHTML.indexOf('<section class="data-block">'));
  assert.match(heading, /page-title-actions__heading scenario-copy[^]*?scenario-copy__title-row[^]*?typography-caption-small">Template &amp; &lt;test&gt;<\/h2>/);
  assert.match(heading, new RegExp(`class="badge ${tone}"><span class="badge__label">${access}<`));
  assert.match(heading, /data-action="template-save-info"/);
  assert.match(heading, /data-filter-summary-group="forms"[^]*?Формы \(5\)/);
  assert.match(heading, /data-filter-summary-group="charts"[^]*?Графики \(1\)/);
  for (const label of ['Поступления за перевалку', 'Структура поступлений', 'Динамика чистых денежных потоков', 'Структура выбытий', 'Отчет о движении денежных средств', 'Graph &amp; &lt;test&gt;']) assert.ok(heading.includes(label));
  assert.equal((heading.match(/role="listitem"/g) || []).length, 6);
  assert.doesNotMatch(heading, /data-equipment-filter-remove|filter-summary__rollover-item--readonly/);
  assert.equal((heading.match(/class="form-input__tag-remove" type="button" disabled tabindex="-1"/g) || []).length, 6, 'The reference list keeps its crosses without allowing deletion');
  assert.match(heading, /page-title-actions__buttons[^]*?button-small button-small--primary typography-button-small[^]*?data-action="save-template"/);
  let info;
  preview.ui.showInfoPopover = (trigger, options) => { info = options; };
  preview.click('template-save-info');
  assert.equal(info.message, 'Чтобы сохранить шаблон, введите название и описание, затем выберите форму доступа.');
  const unchanged = preview.state();
  const trigger = preview.click('save-template');
  assert.match(preview.modal.innerHTML, /template-save-drawer[^]*?data-template-save-form/);
  assert.match(preview.modal.innerHTML, new RegExp(`data-form-input-selected value="${access}"`));
  preview.close(); assert.equal(trigger.focused, true); assert.deepEqual(preview.state(), unchanged);
  preview.click('save-template');
  preview.input('tpl-name', 'Saved preview'); preview.input('tpl-desc', 'Saved description'); preview.input('tpl-tag', access);
  preview.modal.emit('submit', {target: {matches: selector => selector === '[data-template-save-form]'}, preventDefault() {}});
  const saved = preview.state().customTemplates.at(-1);
  assert.equal(saved.name, 'Saved preview'); assert.equal(saved.tag, access);
  assert.deepEqual(saved.blocks, unchanged.blocks);
  assert.deepEqual(saved.customBlocks, unchanged.customBlocks);
  assert.deepEqual(preview.state().templateOverrides[saved.id], {value: 5});
  assert.deepEqual(preview.state().seedOverrides[saved.id], {value: 7});
  assert.equal(preview.modal.innerHTML, '');
  assert.equal(preview.state().view, 'builder');
  assert.match(preview.root.innerHTML, /data-action="return-builder"[^]*?scenario-copy[^]*?Saved preview/);
  assert.deepEqual(preview.destinations, [], 'Saving a preview never navigates to Reports');
  preview.click('return-builder');
  assert.match(preview.root.innerHTML, /class="canvas layout-workspace/);
}
const realData = JSON.parse(await read('legacy/report-studio-v5/data.json'));
const cfData = {datasets: realData.datasets.filter(dataset => dataset.kind === 'cf' && dataset.source === 1 && dataset.year === 2026)};
const templates = JSON.parse(await read('legacy/report-studio-v5/templates.json'));
const cfConfig = {state: {view: 'reports', blocks: cfBlocks}, data: cfData, templates};
const beforeData = JSON.stringify(cfData);
const cf = await mount('reports', cfConfig);
const builderCf = await mount('builder', {...cfConfig, state: {...cfConfig.state, editLayout: true}});
const originalBuilderCf = builderCf.root.innerHTML;
builderCf.click('preview', builderCf.root, true); builderCf.filter();
builderCf.click('apply-builder-preview', builderCf.modal);
assert.equal(sharedReportBody(builderCf.root.innerHTML), sharedReportBody(cf.root.innerHTML), 'All five cash flow charts and tables share the Reports renderer');
assert.equal(builderCf.chartMounts.length, 5);
const previewHeading = app => app.root.innerHTML.slice(app.root.innerHTML.indexOf('<section class="page-title-actions" aria-label="Шаблон">'), app.root.innerHTML.indexOf('<section class="data-block">'));
assert.match(previewHeading(builderCf), /Формы \(5\)/);
assert.match(previewHeading(builderCf), /Графики \(5\)/, 'Graphs embedded in all five ready-made forms are counted');
assert.equal((previewHeading(builderCf).match(/role="listitem"/g) || []).length, 10);
assert.equal((previewHeading(builderCf).match(/form-input__tag-remove" type="button" disabled/g) || []).length, 10, 'Both inventories remain read-only');
for (const label of configuredChartTitles(builderCf)) assert.ok(previewHeading(builderCf).includes(label));
function configuredChartTitles(app) { return app.chartMounts.map(({options}) => options.title); }
assert.doesNotMatch(builderCf.root.innerHTML, /draggable="true"|data-action="remove-block"/, 'Preview does not expose layout editing actions');
assert.equal(builderCf.state().editLayout, true, 'Preview does not discard the previous layout mode');
builderCf.click('return-builder');
assert.equal(builderCf.root.innerHTML, originalBuilderCf, 'The old Constructor form is restored exactly');
assert.ok(builderCf.chartMounts.every(chart => chart.destroyed));
assert.deepEqual(builderCf.destinations, []);
const originalCf = await mount('', cfConfig);
const blockHeadings = markup => [...markup.matchAll(/<div class="page-title-actions__heading analytics-block-heading"><span class="typography-indicator-small">([^<]*)<\/span><h3 id="[^"]+" class="typography-label-smallest">([^<]*)<\/h3><\/div>/g)].map(match => [match[2], match[1]]);
const legacyHeadings = [...originalCf.root.innerHTML.matchAll(/<div class="block-title-wrap"><div><h3>([^<]*)<\/h3><span>([^<]*)<\/span>/g)].map(match => match.slice(1));
const configuredHeadings = blockHeadings(cf.root.innerHTML);
assert.deepEqual(configuredHeadings, legacyHeadings, 'Block titles, kinds and units stay intact on the analytics heading component');
assert.equal((cf.root.innerHTML.match(/<section class="analytics-layout__block"/g) || []).length, 5);
assert.doesNotMatch(cf.root.innerHTML, /class="report-block|class="block-head"|class="block-body"|class="block-actions"|class="icon-btn"/);
assert.equal((cf.root.innerHTML.match(/button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest/g) || []).length, 10);
assert.equal((cf.root.innerHTML.match(/data-action="block-pdf"/g) || []).length, 5);
assert.equal((cf.root.innerHTML.match(/data-action="block-excel"/g) || []).length, 5);
assert.match(cf.root.innerHTML, /data-action="block-pdf" data-id="transshipment" title="Печать" aria-label="Печать"[^]*?#StrokePrint/);
assert.match(cf.root.innerHTML, /data-action="block-excel" data-id="transshipment" title="Excel" aria-label="Excel"[^]*?#StrokeExcel/);
assert.doesNotMatch(cf.root.innerHTML, /#Drag|data-action="remove-block"/);
for (const [name, count] of [['StrokePrint', 3], ['StrokeExcel', 4], ['Drag', 6]]) {
  const geometry = icons.match(new RegExp(`<symbol id="${name}"[^>]*>([\\s\\S]*?)<\\/symbol>`))[1];
  assert.equal((geometry.match(/<path /g) || []).length, count);
  if(name==='Drag')assert.equal((geometry.match(/fill="currentColor"/g) || []).length, count);
  else{
    assert.equal((geometry.match(/stroke="currentColor"/g) || []).length, count);
    assert.equal((geometry.match(/stroke-width="1.5"/g) || []).length, count);
    assert.equal((geometry.match(/vector-effect="non-scaling-stroke"/g) || []).length, count);
    assert.doesNotMatch(geometry, /fill="currentColor"/);
  }
  assert.doesNotMatch(geometry, /#[0-9a-fA-F]{3,8}/);
}
assert.match(css, /\.button-smallest-secondary-radius > svg\s*\{\s*width: 20px;\s*height: 20px;/);
const cfTitle = cf.root.innerHTML.match(/^<div class="div-block">(<section class="page-title-actions">[\s\S]*?<\/section>)/)[1];
const cfReportHeading = cf.root.innerHTML.match(/<section class="data-block">(<div class="page-title-actions">[\s\S]*?<\/span><\/div>)/)[1];
assert.match(cfReportHeading, /<div class="page-title-actions__heading"><h2 class="typography-caption-small">Отчет о движении денежных средств \(CF\)<\/h2><p class="typography-body-small">Форма заказчика: поступления, выбытия, динамика Net Cash Flow и итоговый waterfall\.<\/p><\/div><span class="typography-indicator-small">БНТ · 1С \/ Управленческая отчетность<\/span>/);
assert.match(cf.root.innerHTML, /class="report-grid chart-grid--two-column"/);
assert.equal((cf.root.innerHTML.match(/data-report-wide/g) || []).length, 5);
assert.equal((cf.root.innerHTML.match(/class="chart-card chart-card--wide"/g) || []).length, 5);
assert.equal((cf.root.innerHTML.match(/class="chart-legend chart-legend--wrap typography-body-smallest"/g) || []).length, 5);
assert.equal((cf.root.innerHTML.match(/class="chart-viewport__plot chart-scrollbar" tabindex="0" role="region"/g) || []).length, 5);
const footerMarkup = '<span class="ui-divider brand-divider" aria-hidden="true"></span><footer class="page-title-actions"><span class="typography-indicator-small">ООО «Батумский нефтяной терминал»</span><span class="typography-indicator-small">Powered by ITP Portal</span></footer>';
assert.ok(cf.root.innerHTML.includes(footerMarkup), 'The report footer uses the shared divider and Indicator Small text');
assert.doesNotMatch(cf.root.innerHTML, /paper-foot/);
assert.doesNotMatch(await read('assets/css/pages/report-studio.css'), /paper-foot/, 'Remove the retired local footer separator and spacing');
const reportDividers = root => [...root.innerHTML.slice(root.innerHTML.indexOf('<div class="report-grid chart-grid--two-column">'), root.innerHTML.indexOf(footerMarkup)).matchAll(/<span class="ui-divider brand-divider( ui-divider--vertical)?" aria-hidden="true"><\/span>/g)].map(match => match[1] ? 'vertical' : 'horizontal');
assert.deepEqual(reportDividers(cf.root), ['horizontal', 'horizontal', 'horizontal', 'horizontal'], 'Full-width chart and table blocks are separated horizontally');
assert.doesNotMatch(cf.root.innerHTML, /chart-card__header|class="hchart"|class="vchart"|class="wfchart"|class="waterfall"/);
assert.doesNotMatch(css, /chart-card--embedded|chart-bars--horizontal|chart-bars--columns|chart-bars--waterfall|--chart-bar-size/);
assert.equal(cf.ui.chartCard, undefined, 'Remove the rejected wrapper instead of retaining it as another component');
assert.equal(cf.chartMounts.length, 5, 'Every graph is mounted by the real shared renderer');
for (const {options} of cf.chartMounts) {
  assert.equal(options.showHeader, false);
  assert.equal(options.showTabs, false);
  assert.equal(options.showValues, true);
  const {chart, viewport} = cf.root.charts.get(options.id);
  assert.ok(viewport.listeners.has('scroll'));
  assert.ok(chart.listeners.has('pointerover') && chart.listeners.has('focusin'));
  assert.match(chart.innerHTML, /chart-bars__axis-line/);
  assert.doesNotMatch(chart.innerHTML, /(?:fill|background|color)[:=]"?#[0-9a-fA-F]{3,8}|NaN|Infinity/);
}
assert.match(css, /\.chart-bars__label\s*\{\s*fill: var\(--text-tertiary\);\s*font-size: var\(--typography-label-smallest-size\);\s*line-height: var\(--typography-label-smallest-line-height\);\s*font-weight: var\(--typography-label-smallest-weight\);\s*letter-spacing: var\(--typography-label-smallest-letter-spacing\);/);
assert.equal((cf.root.innerHTML.match(/class="card table-block table-block--sticky-head"/g) || []).length, 5);
assert.equal((cf.root.innerHTML.match(/class="table-wrap ui-scrollbar"/g) || []).length, 5);
assert.equal((cf.root.innerHTML.match(/<div class="div-block"><div class="chart-grid--two-column">/g) || []).length, 5);
assert.doesNotMatch(cf.root.innerHTML, /class="mini-table"|class="wide-table"/);
assert.match(cf.root.innerHTML, /class="data-table__numeric-cell table-number-cell" data-template-edit=""/);
assert.match(cf.root.innerHTML, /tabindex="0" role="button" aria-label="Изменить/);
assert.match(cf.root.innerHTML, /class="data-table__head-cell--numeric"><span class="data-table__column-heading">/);
assert.match(css, /\.report-grid\.chart-grid--two-column\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*gap: var\(--space-3\);/);
assert.match(css, /\.report-grid\.chart-grid--two-column > \.analytics-layout__block\s*\{\s*grid-column: auto;/);
assert.match(css, /\.report-grid\.chart-grid--two-column > \.analytics-layout__block\[data-report-wide\]\s*\{\s*grid-column: 1 \/ -1;/);
assert.match(css, /\.ui-divider\s*\{[^}]*display: block;[^}]*background: var\(--design-elements-border-default\);/);
assert.match(css, /\.ui-divider--vertical\s*\{\s*width: 1px;\s*height: auto;\s*align-self: stretch;/);
assert.match(css, /\.report-grid\.chart-grid--two-column:has\(> \.ui-divider--vertical\)\s*\{\s*grid-template-columns: minmax\(0, 1fr\) auto minmax\(0, 1fr\);/);
assert.match(css, /\.report-grid\.chart-grid--two-column > \.ui-divider:not\(\.ui-divider--vertical\)\s*\{\s*grid-column: 1 \/ -1;/);
assert.match(css, /@media \(max-width: 1180px\)\s*\{[^@]*\.report-grid\.chart-grid--two-column:has\(> \.ui-divider--vertical\)\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/);
assert.match(css, /\.report-grid\.chart-grid--two-column > \.ui-divider--vertical\s*\{\s*grid-column: 1 \/ -1;\s*width: 100%;\s*height: 1px;/);
assert.doesNotMatch(css, /\.chart-card \.chart-viewport:has\(\.chart-viewport__plot\)\s*\{\s*overflow-x: auto;/, 'Only the plot scrolls; the fixed-axis parent must not create a second scrollbar');
assert.match(css, /\.analytics-layout__block > \.page-title-actions\s*\{\s*align-items: flex-start;\s*flex-wrap: wrap;/);
assert.match(css, /\.button-smallest-secondary-radius\[draggable="true"\]\s*\{\s*cursor: grab;/);
assert.match(css, /@media print\s*\{[^}]*\.analytics-layout__block\s*\{\s*break-inside: avoid;/);
assert.match(css, /\.analytics-layout__block > \.page-title-actions > \.page-title-actions__buttons\s*\{\s*display: none;/);
assert.match(css, /@media \(max-width: 1180px\)\s*\{\s*\.chart-grid--two-column,\s*\.report-grid\.chart-grid--two-column,\s*\.chart-grid--three-column\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/);

const tableValues = root => root.querySelectorAll('table').map(table => [...table.outerHTML.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(row => [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(cell => cell[1].replace(/<[^>]*>/g, ''))));
assert.deepEqual(tableValues(cf.root), tableValues(originalCf.root), 'Every CF value, total, row and column stays unchanged');
const reportData = JSON.parse(await read('legacy/report-studio-v5/report-data.json'));
const catalogReport = await mount('reports', {state: {blocks: []}});
catalogReport.click('add-block', catalogReport.root, true);
const reportCatalog = new Element(); reportCatalog.setAttribute('data-workspace', ''); reportCatalog.dataset = {workspaceTab: 'library', catalogAction: 'modal-add-block'}; reportCatalog.eventParent = catalogReport.modal;
const reportTabs = ['library', 'forms'].map(workspaceTab => Object.assign(new Element(), {dataset: {workspaceTab}}));
const reportPanels = ['library', 'forms'].map(workspacePanel => Object.assign(new Element(), {dataset: {workspacePanel}}));
const reportTabBar = new Element(), reportDefault = new Element(), reportResults = new Element();
reportCatalog.queries.set('[data-builder-catalog-tabs], [data-builder-catalog-default]', [reportTabBar, reportDefault]);
reportCatalog.queries.set('[data-builder-catalog-results]', reportResults);
reportCatalog.queries.set('[role="tab"][data-workspace-tab]', reportTabs);
reportCatalog.queries.set('[data-workspace-panel]', reportPanels);
catalogReport.modal.queries.set('[data-workspace]', reportCatalog);
const reportSearchForm = new Element(); reportSearchForm.dataset = {scopedSearch: 'report-catalog-search', scopedSearchActive: 'false', scopedSearchQuery: ''}; reportSearchForm.setAttribute('data-scoped-search', 'report-catalog-search'); reportSearchForm.eventParent = catalogReport.modal;
const reportSearchField = catalogReport.input('report-catalog-search', ''); reportSearchField.type = 'search'; reportSearchField.scopedSearchRoot = reportSearchForm;
const reportSearchButton = new Element(); reportSearchButton.setAttribute('data-scoped-search-submit', ''); reportSearchButton.scopedSearchRoot = reportSearchForm;
const reportScope = new Element(); reportScope.dataset = {uiDropdown: 'report-catalog-search-scope', value: 'all'}; reportScope.setAttribute('data-ui-dropdown', 'report-catalog-search-scope');
reportScope.scopedSearchRoot = reportSearchForm; reportScope.eventParent = catalogReport.document;
const reportScopeOptions = ['all', 'blocks', 'forms'].map(value => { const option = new Element(); option.dataset.uiDropdownOption = value; option.dropdownRoot = reportScope; return option; });
reportScope.queries.set('[data-ui-dropdown-option]', reportScopeOptions);
reportSearchForm.queries.set('input[type="search"]', reportSearchField);
reportSearchForm.queries.set('[data-scoped-search-submit]', reportSearchButton);
reportSearchForm.queries.set('[data-ui-dropdown]', reportScope);
reportCatalog.queries.set('[data-ui-dropdown="report-catalog-search-scope"]', reportScope);
reportSearchField.value = 'EBITDA'; catalogReport.modal.emit('input', {target: reportSearchField});
catalogReport.document.emit('keydown', {target: reportSearchField, key: 'Enter', preventDefault() {}});
assert.deepEqual(catalogItems(reportResults.innerHTML).map(item => item.id), ['metricTrend', 'general_ebitda', 'general_margin']);
assert.ok(catalogItems(reportResults.innerHTML).every(item => item.markup.includes('data-action="modal-add-block"')), 'Found results keep the same close-only plus behavior');
assert.equal(reportTabBar.hidden, true); assert.equal(reportDefault.hidden, true);
assert.equal(reportSearchButton.getAttribute('aria-label'), 'Очистить поиск');
catalogReport.document.emit('click', {target: reportSearchButton, preventDefault() {}});
assert.equal(reportTabBar.hidden, false); assert.equal(reportDefault.hidden, false); assert.equal(reportResults.hidden, true);
assert.equal(reportSearchButton.getAttribute('aria-label'), 'Найти');
reportScope.dataset.value = 'forms'; catalogReport.ui.notifyScopedSearch(reportSearchForm);
assert.equal(reportCatalog.dataset.workspaceTab, 'forms');
catalogReport.ui.setWorkspaceTab(reportCatalog, 'library');
assert.equal(reportScope.dataset.value, 'blocks', 'Report tabs and selected search scope stay synchronized');
catalogReport.ui.setWorkspaceTab(reportCatalog, 'forms');
catalogReport.ui.selectDropdownOption(reportScopeOptions[0]);
const reportSearchSnapshot = JSON.stringify(catalogReport.state());
reportSearchField.value = 'капитальные'; catalogReport.modal.emit('input', {target: reportSearchField});
assert.equal(reportTabBar.hidden, false, 'Typing alone does not hide the report drawer tabs');
catalogReport.document.emit('submit', {target: reportSearchForm, preventDefault() {}});
assert.deepEqual(catalogItems(reportResults.innerHTML).map(item => item.id), ['general_capex', 'cons_capex'], 'All searches both blocks and forms regardless of the previously selected tab');
assert.equal(reportCatalog.dataset.workspaceTab, 'forms', 'Searching All does not change the selected tab');
assert.equal(reportTabBar.hidden, true); assert.equal(reportDefault.hidden, true); assert.equal(reportResults.hidden, false);
assert.equal(reportTabs[0].getAttribute('aria-selected'), 'false'); assert.equal(reportTabs[1].getAttribute('aria-selected'), 'true');
assert.match(catalogItems(reportResults.innerHTML)[0].markup, /#nav-management-solid/);
assert.match(catalogItems(reportResults.innerHTML)[1].markup, /#nav-builder-solid/);
catalogReport.ui.selectDropdownOption(reportScopeOptions[1]);
assert.deepEqual(catalogItems(reportResults.innerHTML).map(item => item.id), ['general_capex']);
catalogReport.ui.selectDropdownOption(reportScopeOptions[2]);
assert.deepEqual(catalogItems(reportResults.innerHTML).map(item => item.id), ['cons_capex']);
catalogReport.ui.selectDropdownOption(reportScopeOptions[0]);
reportSearchField.value = 'дох'; catalogReport.document.emit('keydown', {target: reportSearchField, key: 'Enter', preventDefault() {}});
assert.deepEqual(catalogItems(reportResults.innerHTML).map(item => item.id), ['is_income', 'is_core_income', 'is_transshipment'], 'Income results are forms even when shown in the unified All list');
assert.equal(reportTabBar.hidden, true); assert.equal(reportDefault.hidden, true); assert.equal(reportResults.hidden, false);
assert.equal(JSON.stringify(catalogReport.state()), reportSearchSnapshot, 'Report drawer search does not modify the report or template');
catalogReport.document.emit('click', {target: reportSearchButton, preventDefault() {}});
assert.equal(reportTabBar.hidden, false); assert.equal(reportDefault.hidden, false); assert.equal(reportResults.hidden, true);
assert.equal(reportScope.dataset.value, 'all'); assert.equal(reportCatalog.dataset.workspaceTab, 'forms');
assert.equal(reportPanels[0].hidden, true); assert.equal(reportPanels[1].hidden, false);
assert.equal(reportResults.innerHTML, ''); assert.equal(reportSearchField.value, ''); assert.equal(reportSearchField.focused, true);
assert.equal(reportSearchButton.type, 'submit');
reportSearchField.value = 'no matching item'; catalogReport.document.emit('keydown', {target: reportSearchField, key: 'Enter', preventDefault() {}});
assert.match(reportResults.innerHTML, /empty-state--smallest/);
reportSearchField.value = ''; catalogReport.document.emit('input', {target: reportSearchField});
assert.equal(reportTabBar.hidden, false); assert.equal(reportResults.hidden, true);
const catalogInfo = [], originalCatalogInfo = catalogReport.ui.showInfoPopover;
catalogReport.ui.showInfoPopover = (_trigger, info) => catalogInfo.push(info);
catalogReport.click('builder-forms-info', catalogReport.modal);
assert.equal(catalogInfo[0].message, 'Здесь вы найдёте комплексные блоки и составные таблицы.');
catalogReport.ui.showInfoPopover = originalCatalogInfo;
const catalogSnapshot = JSON.stringify(catalogReport.state()), catalogNotices = catalogReport.notices.length;
catalogReport.click('modal-add-block', catalogReport.modal, false, {id: 'metricTrend'});
assert.equal(catalogReport.modal.innerHTML, '');
assert.equal(JSON.stringify(catalogReport.state()), catalogSnapshot);
assert.equal(catalogReport.notices.length, catalogNotices);
catalogReport.click('add-block', catalogReport.root, true);
assert.match(catalogReport.modal.innerHTML, /data-scoped-search-active="false"/);
assert.match(catalogReport.modal.innerHTML, /id="report-library-tab"[^>]*aria-selected="true"/);
const reportDialog = new Element(); catalogReport.modal.queries.set('[data-studio-drawer]', reportDialog);
catalogReport.document.emit('keydown', {target: reportDialog, key: 'Escape', preventDefault() {}});
assert.equal(catalogReport.modal.innerHTML, '');
assert.equal(catalogReport.trigger.focused, true);

const fullCatalogReport = await mount('reports', {state: {blocks: reportDrawerIds}, data: realData, reports: reportData, templates});
assert.doesNotMatch(fullCatalogReport.root.innerHTML, /class="(?:kpi-card template-edit|mini-table|wide-table|hchart|vchart|wfchart|svgchart|compare-chart|matrix-table|paper)"/, 'Every catalog block uses the migrated report presentation');
assert.equal((fullCatalogReport.root.innerHTML.match(/<article class="analytics-kpi/g) || []).length, 5);

const kpiKeys = ['Выручка', 'EBITDA', 'ЧистаяПрибыль', 'ОперационнаяПрибыль', 'ВаловыйДоход'];
const kpiData = {datasets: ['actual', 'plan'].map(basis => ({source: 1, year: 2026, kind: 'metrics', basis, key: `kpi-${basis}`, rows: kpiKeys.map((key, index) => ({id: `kpi-${index}`, code: key, name: key, values: Array(12).fill((basis === 'actual' ? [125.6, 79.8, 250.1, 100, 100.4] : [100, 100, 100, 0, 100])[index])}))}))};
const kpiBefore = JSON.stringify(kpiData);
const kpiConfig = {state: {blocks: ['kpi'], monthFrom: 1, monthTo: 1, unit: 'raw'}, data: kpiData};
const migratedKpis = await mount('reports', kpiConfig);
const kpiCards = markup => [...markup.matchAll(/<article class="analytics-kpi[^]*?<\/article>/g)].map(match => match[0]);
const cards = kpiCards(migratedKpis.root.innerHTML);
assert.equal(cards.length, 5);
assert.match(migratedKpis.root.innerHTML, /class="kpi-grid kpi-grid--five ui-scrollbar" tabindex="0" role="region" aria-labelledby="report-block-title-kpi"/);
assert.match(await read('assets/css/tokens.css'), /--analytics-kpi-min-width: 220px;/);
assert.match(css, /\.kpi-grid\.kpi-grid--five\s*\{[^}]*min-width: 0;[^}]*grid-template-columns: repeat\(5, minmax\(var\(--analytics-kpi-min-width\), 1fr\)\);[^}]*gap: var\(--space-3\);[^}]*overflow-x: auto;/);
assert.doesNotMatch(css, /@media \(max-width: (?:1100|680)px\)\s*\{\s*\.kpi-grid\.kpi-grid--five/);
assert.match(css, /@media print\s*\{[^@]*\.kpi-grid\.kpi-grid--five\s*\{[^}]*repeat\(auto-fit, minmax\(min\(100%, var\(--analytics-kpi-min-width\)\), 1fr\)\);[^}]*overflow: visible;/);
assert.deepEqual(cards.map(card => card.match(/payment-progress-ring__value typography-label-smallest">([^<]+)</)?.[1] ?? null), ['+26%', '-20%', '+150%', null, '+0%']);
assert.match(cards[0], /payment-summary-card--positive/);
assert.match(cards[1], /payment-summary-card--error/);
assert.match(cards[2], /<circle class="payment-progress-ring__bar"/);
assert.doesNotMatch(cards[3], /payment-progress-ring/);
assert.match(cards[3], /analytics-kpi__context typography-body-smallest">\$/);
assert.doesNotMatch(cards[4], /payment-progress-ring__bar/);
assert.ok(cards.every(card => card.includes('role="button" tabindex="0"') && card.includes('data-template-edit')));
assert.equal(JSON.stringify(kpiData), kpiBefore, 'Rounding the percentage never changes source values');
const missingKpis = await mount('reports', {state: {blocks: ['kpi']}, data: {datasets: []}});
assert.match(missingKpis.root.innerHTML, /empty-state--smallest/);
assert.doesNotMatch(missingKpis.root.innerHTML, /analytics-kpi|payment-progress-ring/);
const zeroKpiData = structuredClone(kpiData);
zeroKpiData.datasets.forEach(dataset => dataset.rows.forEach(row => { row.values = Array(12).fill(0); }));
const zeroKpis = await mount('reports', {...kpiConfig, data: zeroKpiData});
assert.equal(kpiCards(zeroKpis.root.innerHTML).length, 5, 'Zero is a real KPI value, not an empty state');
assert.doesNotMatch(zeroKpis.root.innerHTML, /payment-progress-ring/);
const previewKpis = await mount('builder', kpiConfig);
previewKpis.click('preview'); previewKpis.filter({'date-to': '2026-01-31', unit: 'raw'}); previewKpis.click('apply-builder-preview', previewKpis.modal);
assert.deepEqual(kpiCards(previewKpis.root.innerHTML), cards, 'Constructor preview uses the same KPI component and rounding');

for (const [blocks, wide, dividers] of [
  [['kpi'], [true], []],
  [['kpi', 'metricTrend'], [true, true], ['horizontal']],
  [['kpi', 'inflow', 'netflow'], [true, false, false], ['horizontal', 'vertical']],
  [['inflow', 'kpi', 'metricTrend', 'netflow'], [true, true, false, false], ['horizontal', 'horizontal', 'vertical']],
  [['inflow', 'netflow', 'kpi', 'metricTrend'], [false, false, true, true], ['vertical', 'horizontal', 'horizontal']],
  [['inflow', 'kpi', 'metricTrend'], [true, true, true], ['horizontal', 'horizontal']],
  [['kpi', 'metricTrend', 'netflow', 'waterfall', 'inflow'], [true, false, false, false, false], ['horizontal', 'vertical', 'horizontal', 'vertical']],
]) {
  const report = await mount('reports', {state: {blocks, showTables: false}, data: realData, reports: reportData, templates});
  const sections = [...report.root.innerHTML.matchAll(/<section class="analytics-layout__block"[^>]+>/g)];
  assert.deepEqual(sections.map(section => section[0].includes('data-report-wide')), wide, `${blocks.join(', ')}: KPI owns a row; remaining charts keep pairs`);
  assert.deepEqual(reportDividers(report.root), dividers, `${blocks.join(', ')}: no orphan divider next to a full-width KPI`);
  const grid = report.root.querySelector('.report-grid');
  assert.deepEqual(grid.querySelectorAll(':scope > .analytics-layout__block').map(block => block.hasAttribute('data-report-wide')), wide, 'Binding preserves the full-width KPI row');
  assert.deepEqual(grid.querySelectorAll(':scope > .ui-divider').map(divider => divider.classList.contains('ui-divider--vertical') ? 'vertical' : 'horizontal'), dividers, 'Binding preserves the separators around KPI');
  assert.deepEqual(report.state().blocks, blocks, 'Layout does not change the stored block order');
}

const tableBlocks = ['general_oil', 'cons_production', 'planFact', 'finance', 'balance', 'capex'];
const tableConfig = {state: {blocks: tableBlocks, showCodes: true}, data: realData, reports: reportData, templates};
const migratedTables = await mount('reports', tableConfig);
const originalTables = await mount('', tableConfig);
assert.equal(migratedTables.root.querySelectorAll('table').length, tableBlocks.length, 'Exercise comparison, matrix, plan/fact, financial, balance and CAPEX tables');
assert.equal((migratedTables.root.innerHTML.match(/class="card table-block table-block--sticky-head"/g) || []).length, tableBlocks.length);
assert.equal((migratedTables.root.innerHTML.match(/<table class="data-table">/g) || []).length, tableBlocks.length);
assert.doesNotMatch(migratedTables.root.innerHTML, /class="(?:wide-table|compare-table|matrix-table|mini-table)|class="num|neg-txt|pos-txt|style="width:/);
const expectedTableValues = tableValues(originalTables.root);
const originalExecutions = [...originalTables.root.innerHTML.matchAll(/<div class="progress"><span style="width:([^%]+)%"/g)].map(match => `${Math.round(Number(match[1]))}%`);
expectedTableValues[tableBlocks.indexOf('planFact')].slice(1).forEach((row, index) => { row[row.length - 1] = originalExecutions[index]; });
assert.deepEqual(tableValues(migratedTables.root), expectedTableValues, 'Keep every table value and add the percentage above the execution line');
const correctionData = root => [...root.innerHTML.matchAll(/data-block-id="([^"]+)"[^>]*?data-base="([^"]+)"/g)].map(match => match.slice(1));
assert.deepEqual(correctionData(migratedTables.root), correctionData(originalTables.root), 'Keep template and seed correction targets and base values');
assert.match(migratedTables.root.innerHTML, /data-table__progress-cell[^]*?progress scenario-range__track/);
const executionCells = markup => [...markup.matchAll(/<td class="data-table__numeric-cell data-table__progress-cell"><div class="table-cell-content table-cell-content--numeric"><strong>(\d+)%<\/strong><div class="progress scenario-range__track" style="--scenario-progress:([^%]+)%"[^]*?<\/td>/g)].map(match => [Number(match[1]), Number(match[2])]);
assert.equal(executionCells(migratedTables.root.innerHTML).length, 4);
const executionTable = await mount('reports', {...kpiConfig, state: {...kpiConfig.state, blocks: ['planFact']}});
assert.deepEqual(executionCells(executionTable.root.innerHTML), [[100, 100], [80, 79.8], [100, 100], [0, 0]], 'Round the displayed execution but preserve the actual progress calculation');
assert.equal(JSON.stringify(kpiData), kpiBefore);
assert.match(migratedTables.root.innerHTML, /table-number-value data-table__risk-value is-(positive|negative)/);
assert.match(migratedTables.root.innerHTML, /data-table__numeric-cell table-number-cell" data-seed-edit=""[^>]*tabindex="0" role="button"/);
const tablePreview = await mount('builder', tableConfig);
tablePreview.click('preview'); tablePreview.filter(); tablePreview.click('apply-builder-preview', tablePreview.modal);
assert.equal(sharedReportBody(tablePreview.root.innerHTML), sharedReportBody(migratedTables.root.innerHTML), 'Preview and Reports apply the same table component');
assert.match(previewHeading(tablePreview), /Формы \(6\)/);
assert.match(previewHeading(tablePreview), /Графики \(1\)/, 'A populated matrix is a form, not a graph');
const tablesOnly = await mount('builder', {state: {blocks: ['finance']}});
tablesOnly.click('preview'); tablesOnly.filter(); tablesOnly.click('apply-builder-preview', tablesOnly.modal);
assert.match(previewHeading(tablesOnly), /Формы \(1\)/);
assert.doesNotMatch(previewHeading(tablesOnly), /data-filter-summary-group="charts"|Графики \(0\)/);
const chartsOnly = await mount('builder');
chartsOnly.click('preview'); chartsOnly.filter(); chartsOnly.click('apply-builder-preview', chartsOnly.modal);
assert.match(previewHeading(chartsOnly), /Графики \(1\)/);
assert.doesNotMatch(previewHeading(chartsOnly), /data-filter-summary-group="forms"|Формы \(0\)/);
const noChartData = await mount('builder', {...cfConfig, data: {datasets: []}});
noChartData.click('preview'); noChartData.filter(); noChartData.click('apply-builder-preview', noChartData.modal);
assert.match(previewHeading(noChartData), /Формы \(5\)/);
assert.doesNotMatch(previewHeading(noChartData), /data-filter-summary-group="charts"|Графики \(0\)/, 'Empty states do not count as drawn graphs');
const hiddenCfTables = await mount('builder', {...cfConfig, state: {...cfConfig.state, showTables: false}});
hiddenCfTables.click('preview'); hiddenCfTables.filter(); hiddenCfTables.click('apply-builder-preview', hiddenCfTables.modal);
assert.match(previewHeading(hiddenCfTables), /Графики \(5\)/, 'Hiding tables cannot change the chart inventory');
const cellsBefore = [...cf.root.innerHTML.matchAll(/data-block-id="([^"]+)" data-value-key="([^"]+)" data-value-label="([^"]+)" data-base="([^"]+)"/g)].map(match => match.slice(1));
const originalCells = [...originalCf.root.innerHTML.matchAll(/data-block-id="([^"]+)" data-value-key="([^"]+)" data-value-label="([^"]+)" data-base="([^"]+)"/g)].map(match => match.slice(1));
assert.deepEqual(cellsBefore, originalCells, 'The editable-cell data contract is retained');

const plotBars = chart => [...chart.innerHTML.matchAll(/<rect\b[^>]+>/g)].map(match => Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]+)"/g)].map(attribute => attribute.slice(1))));
const valueLabels = chart => [...chart.innerHTML.matchAll(/<text class="chart-bars__label"[^>]*>([^<]*)<\/text>/g)].map(([markup, text]) => ({text, ...Object.fromEntries([...markup.matchAll(/([\w-]+)="([^"]+)"/g)].map(attribute => attribute.slice(1)))}));
function assertValueLabels(chart) {
  const [, , width, height] = chart.getAttribute('viewBox').split(' ').map(Number);
  const labels = valueLabels(chart).map(label => {
    assert.equal(label.text, new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 2}).format(Number(label['data-value'])), 'Use the same once-converted values and formatter as the table');
    const x = Number(label.x), y = Number(label.y), labelWidth = label.text.length * 8;
    const left = x - (label['text-anchor'] === 'end' ? labelWidth : label['text-anchor'] === 'middle' ? labelWidth / 2 : 0);
    const top = y - (label['dominant-baseline'] === 'hanging' ? 0 : label['dominant-baseline'] === 'middle' ? 8 : 16);
    assert.ok(left >= -1e-8 && left + labelWidth <= width + 1e-8, 'Measured value labels fit within the scrollable SVG width');
    assert.ok(top >= -1e-8 && top + 16 <= height + 1e-8, 'Value labels are not clipped vertically');
    return {left, right: left + labelWidth, top, bottom: top + 16};
  });
  labels.forEach((label, index) => {
    for (const other of labels.slice(index + 1)) {
      assert.ok(label.right <= other.left + 1e-8 || other.right <= label.left + 1e-8 || label.bottom <= other.top + 1e-8 || other.bottom <= label.top + 1e-8, 'Neighbouring value labels cannot overlap');
    }
  });
}
function assertPlotBounds(chart) {
  const [, , width, height] = chart.getAttribute('viewBox').split(' ').map(Number);
  assert.doesNotMatch(chart.innerHTML, /NaN|Infinity/);
  for (const bar of plotBars(chart)) {
    const x = Number(bar.x), y = Number(bar.y), w = Number(bar.width), h = Number(bar.height);
    assert.ok([x, y, w, h].every(Number.isFinite));
    assert.ok(x >= -1e-8 && y >= -1e-8 && w > 0 && h > 0 && x + w <= width + 1e-8 && y + h <= height + 1e-8);
  }
}
const axisTicks = axis => [...axis.innerHTML.matchAll(/<text class="chart-bars__tick"[^>]+>([^<]+)<\/text>/g)].map(([markup, text]) => ({
  value: Number(markup.match(/data-tick-value="([^"]+)"/)[1]),
  x: Number(markup.match(/x="([^"]+)"/)[1]),
  anchor: markup.match(/text-anchor="([^"]+)"/)[1],
  visible: !markup.includes('visibility="hidden"'),
  text
}));
function assertAxisLabels(axis) {
  const ticks = axisTicks(axis);
  assert.equal(ticks.length, 5, 'Automatic axes have four rounded intervals');
  assert.ok(ticks.every(tick => tick.visible), 'Every axis mark stays labelled');
  assert.equal(new Set(ticks.map(tick => tick.text)).size, ticks.length, 'Small values must not round to duplicate labels');
  for (let index = 1; index < ticks.length; index++) {
    const previous = ticks[index - 1], current = ticks[index];
    const previousRight = previous.x + (previous.anchor === 'start' ? previous.text.length * 8 : 0);
    assert.ok(current.x - current.text.length * 8 >= previousRight + 8 - 1e-8, 'Measured axis labels have a visible gap');
  }
}
for (const fixture of cf.root.charts.values()) {
  assertPlotBounds(fixture.chart);
  assertValueLabels(fixture.chart);
}
function assertGridAndTicks(fixture) {
  const lines = [...fixture.chart.innerHTML.matchAll(/<line\b[^>]+>/g)].map(([markup]) => ({markup, ...Object.fromEntries([...markup.matchAll(/([\w-]+)="([^"]+)"/g)].map(attribute => attribute.slice(1)))}));
  const closing = lines.filter(line => line.markup.includes('data-chart-closing-axis'));
  assert.equal(closing.length, 1, 'Every graph has one closing line, without a second paint over the grid');
  assert.equal(closing[0].class, 'chart-bars__grid-line', 'The closing line uses the border-default grid component, not the accent axis');
  assert.equal(closing[0].y1, closing[0].y2);
  assert.equal(lines.filter(line => line.class === 'chart-bars__grid-line' && line.y1 === closing[0].y1 && line.y2 === closing[0].y2).length, 1);
  if (fixture.axis.getAttribute('viewBox')) {
    const verticals = lines.filter(line => line.class === 'chart-bars__vertical-line');
    axisTicks(fixture.axis).forEach((tick, index) => {
      assert.equal(tick.anchor, 'end');
      assert.equal(tick.x, Number(verticals[index].x1) - 8, 'Horizontal scale labels end before their grid line');
    });
  } else {
    const grids = lines.filter(line => line.class === 'chart-bars__grid-line');
    const ticks = [...fixture.chart.innerHTML.matchAll(/<text class="chart-bars__tick"[^>]+>/g)].map(([markup]) => Object.fromEntries([...markup.matchAll(/([\w-]+)="([^"]+)"/g)].map(attribute => attribute.slice(1))));
    ticks.forEach((tick, index) => {
      assert.equal(Number(tick.y), Number(grids[index].y1) + 8, 'Vertical scale labels sit below their grid line, before it in the upward axis direction');
      assert.equal(tick['dominant-baseline'], 'hanging');
    });
  }
}
assert.match(css, /\.chart-bars__grid-line,\s*\.chart-bars__vertical-line\s*\{\s*stroke: var\(--design-elements-border-default\);/);
for (const {options} of cf.chartMounts) {
  const chart = cf.root.charts.get(options.id).chart;
  assert.equal(valueLabels(chart).length, options.datasets.default.length, 'Every CF bar or zero step has a visible numeric value');
  options.datasets.default.forEach((row, index) => {
    const label = valueLabels(chart)[index], value = row.values.reduce((sum, amount) => sum + amount, 0);
    assert.equal(Number(label['data-chart-value']), index);
    assert.equal(Number(label['data-value']), value);
    const bar = plotBars(chart).find(item => Number(item['data-row-index']) === index);
    if (bar && options.orientation === 'horizontal') assert.ok(value < 0 ? Number(label.x) <= Number(bar.x) - 8 + 1e-8 : Number(label.x) >= Number(bar.x) + Number(bar.width) + 8 - 1e-8, 'Horizontal values sit beside the positive or negative bar ends');
    else if (bar) assert.ok(value < 0 ? Number(label.y) >= Number(bar.y) + Number(bar.height) + 8 - 1e-8 : Number(label.y) <= Number(bar.y) - 8 + 1e-8, 'Vertical values follow the positive or negative bar endpoint');
  });
}
const receiptAxis = cf.root.charts.get(cf.chartMounts[0].options.id).axis;
assert.deepEqual(axisTicks(receiptAxis).map(tick => tick.value), [0, 3000, 6000, 9000, 12000]);
assert.deepEqual(axisTicks(receiptAxis).map(tick => tick.text.replace(/\s/g, '')), ['0', '3000', '6000', '9000', '12000']);
const receiptFixture = cf.root.charts.get(cf.chartMounts[0].options.id);
const rightGridEdge = chart => Math.max(...[...chart.innerHTML.matchAll(/<line class="chart-bars__grid-line"[^>]*x2="([^"]+)"/g)].map(match => Number(match[1])));
assert.equal(rightGridEdge(receiptFixture.chart), Number(receiptFixture.chart.getAttribute('viewBox').split(' ')[2]) - 2, 'Use the available width when values already fit inside the rounded scale');
receiptFixture.viewport.scrollLeft = 80;
receiptFixture.viewport.emit('scroll', {});
assert.equal(receiptFixture.axis.style.transform, 'translateX(-80px)', 'The fixed axis follows the single plot scrollbar horizontally');
receiptFixture.viewport.scrollLeft = 0;
receiptFixture.viewport.emit('scroll', {});
assert.equal(receiptFixture.axis.style.transform, 'translateX(0px)');
const unchangedMarkup = cf.root.innerHTML;
for (const viewportWidth of [320, 390, 768, 1440, 1920, 3000]) {
  for (const fixture of cf.root.charts.values()) {
    fixture.viewport.clientWidth = viewportWidth;
    cf.observers.find(observer => observer.target === fixture.viewport).callback();
    assertPlotBounds(fixture.chart);
    assertValueLabels(fixture.chart);
    assertGridAndTicks(fixture);
    const dimensions = fixture.chart.getAttribute('viewBox').split(' ').map(Number);
    assert.equal(fixture.chart.style.width, `${dimensions[2]}px`, 'Keep the SVG at its measured width so text is not scaled or clipped');
    if (fixture.axis.getAttribute('viewBox')) {
      assert.equal(Number(fixture.axis.getAttribute('viewBox').split(' ')[2]), dimensions[2]);
      assertAxisLabels(fixture.axis);
    }
  }
  assert.equal(cf.root.innerHTML, unchangedMarkup, 'Resizing graphs leaves the headings, tables and buttons untouched');
  if (viewportWidth >= 768) assert.equal(rightGridEdge(receiptFixture.chart), Number(receiptFixture.chart.getAttribute('viewBox').split(' ')[2]) - 2, 'A wide plot has no unnecessary gutter reserved for values');
}
for (const fixture of cf.root.charts.values()) {
  fixture.viewport.clientWidth = 1440;
  cf.observers.find(observer => observer.target === fixture.viewport).callback();
}
const outflowFixture = cf.root.charts.get(cf.chartMounts[3].options.id);
const leftGridEdge = Math.min(...[...outflowFixture.chart.innerHTML.matchAll(/<line class="chart-bars__grid-line"[^>]*x1="([^"]+)"/g)].map(match => Number(match[1])));
const categoryEnd = Number(outflowFixture.chart.innerHTML.match(/<text class="chart-bars__category" x="([^"]+)"/)[1]);
assert.equal(leftGridEdge - categoryEnd, 16, 'Do not reserve an external negative-value gutter when the rounded scale already has space for the labels');

const screenshotAmounts = [1666.19, 2096.83, 3938.51, 1283.03, 173.16, 128.13, 1300.79];
const screenshotNames = ['CAPEX', 'Платежи поставщикам', 'ФОТ', 'Платежи в бюджет', 'Курсовая разница', 'Пенсионный фонд', 'Прочие платежи'];
const screenshotReport = await mount('reports', {state: {view: 'reports', source: 2, blocks: ['outflow']}, data: {datasets: [{source: 2, year: 2026, kind: 'cf', basis: 'actual', key: 'outflow-screenshot', rows: screenshotNames.map((name, i) => ({id: `out-${i}`, name, code: name, values: [-screenshotAmounts[i] * 1000]}))}]}});
const screenshotChart = screenshotReport.root.charts.values().next().value;
for (const viewportWidth of [320, 540, 960, 1800]) {
  screenshotChart.viewport.clientWidth = viewportWidth;
  screenshotReport.observers.find(observer => observer.target === screenshotChart.viewport).callback();
  assertPlotBounds(screenshotChart.chart);
  assertValueLabels(screenshotChart.chart);
  assertAxisLabels(screenshotChart.axis);
  const canvasWidth = Number(screenshotChart.chart.getAttribute('viewBox').split(' ')[2]);
  if (viewportWidth >= 540) assert.equal(canvasWidth, viewportWidth, 'The screenshot values fit without an unnecessary horizontal scrollbar');
  assert.ok(canvasWidth - rightGridEdge(screenshotChart.chart) <= 90, 'End labels cannot accumulate into a wide empty gutter');
}
const screenshotGrid = new Element(), screenshotColumn = new Element();
screenshotGrid.queries.set(':scope > .table-block .data-table', {tHead: {rows: [{cells: [{colSpan: 1}, {colSpan: 1}]}]}});
screenshotChart.chart.grid = screenshotGrid;
screenshotChart.viewport.parentElement = screenshotColumn; screenshotColumn.parentElement = screenshotGrid;
const originalGridToggle = screenshotGrid.classList.toggle;
screenshotGrid.classList.toggle = (name, on) => {
  const result = originalGridToggle(name, on);
  screenshotColumn.clientWidth = (screenshotGrid.clientWidth - 12) * (on ? 2 / 3 : 1 / 2);
  screenshotChart.viewport.clientWidth = screenshotColumn.clientWidth - 26;
  return result;
};
screenshotGrid.clientWidth = 1200; screenshotColumn.clientWidth = 594; screenshotChart.viewport.clientWidth = 568;
const screenshotObserver = screenshotReport.observers.find(observer => observer.target === screenshotChart.viewport);
screenshotObserver.callback();
assert.equal(screenshotGrid.classList.contains('chart-grid--chart-emphasis'), false, 'One measured gutter fits the screenshot chart into an equal split');
screenshotGrid.clientWidth = 900; screenshotColumn.clientWidth = 444; screenshotChart.viewport.clientWidth = 418;
screenshotObserver.callback();
assert.equal(screenshotGrid.classList.contains('chart-grid--chart-emphasis'), true);
assert.equal(Number(screenshotChart.chart.getAttribute('viewBox').split(' ')[2]), Math.round(screenshotChart.viewport.clientWidth), 'Render against the new column width immediately after applying two-thirds layout');

const tableGrid = new Element(), chartColumn = new Element(), twoColumnTable = {tHead: {rows: [{cells: [{colSpan: 1}, {colSpan: 1}]}]}};
tableGrid.queries.set(':scope > .table-block .data-table', twoColumnTable);
receiptFixture.chart.grid = tableGrid;
receiptFixture.viewport.parentElement = chartColumn;
chartColumn.parentElement = tableGrid;
const receiptObserver = cf.observers.find(observer => observer.target === receiptFixture.viewport);
tableGrid.clientWidth = 812; receiptFixture.viewport.clientWidth = 374; chartColumn.clientWidth = 400;
receiptObserver.callback();
assert.ok(tableGrid.classList.contains('chart-grid--chart-emphasis'), 'A cramped chart with a two-column table takes two thirds');
receiptFixture.viewport.clientWidth = 507; chartColumn.clientWidth = 533;
receiptObserver.callback();
assert.ok(tableGrid.classList.contains('chart-grid--chart-emphasis'), 'Expanding the chart does not switch it back and cause a resize loop');
tableGrid.clientWidth = 3000; receiptFixture.viewport.clientWidth = 1468; chartColumn.clientWidth = 1494;
receiptObserver.callback();
assert.ok(!tableGrid.classList.contains('chart-grid--chart-emphasis'), 'A wider block restores equal columns when the chart fits');
tableGrid.clientWidth = 812; receiptFixture.viewport.clientWidth = 374; chartColumn.clientWidth = 400;
twoColumnTable.tHead.rows[0].cells.push({colSpan: 1});
receiptObserver.callback();
assert.ok(!tableGrid.classList.contains('chart-grid--chart-emphasis'), 'A three-column table retains the ordinary split');
twoColumnTable.tHead.rows[0].cells.pop();
receiptObserver.callback();
assert.ok(tableGrid.classList.contains('chart-grid--chart-emphasis'));
tableGrid.queries.set(':scope > .table-block .data-table', null);
receiptObserver.callback();
assert.ok(!tableGrid.classList.contains('chart-grid--chart-emphasis'), 'Removing the table clears the layout modifier');
receiptFixture.chart.grid = null; receiptFixture.viewport.clientWidth = 1440;
receiptFixture.viewport.parentElement = null;
receiptObserver.callback();
assert.match(css, /\.chart-grid--two-column\.chart-grid--chart-emphasis\s*\{\s*grid-template-columns: minmax\(0, 2fr\) minmax\(0, 1fr\);/);
assert.match(css, /@media \(max-width: 1180px\)[\s\S]*\.chart-grid--two-column\.chart-grid--chart-emphasis\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/);
const netChart = cf.root.charts.get(cf.chartMounts[2].options.id).chart;
const waterfallChart = cf.root.charts.get(cf.chartMounts[4].options.id).chart;
const netGridTop = Math.min(...[...netChart.innerHTML.matchAll(/<line class="chart-bars__grid-line"[^>]*y1="([^"]+)"/g)].map(match => Number(match[1])));
assert.equal(netGridTop, 1, 'Do not reserve a top value-label gutter when the rounded scale already contains every label');
const netClosingY = Number(netChart.innerHTML.match(/<line class="chart-bars__grid-line"[^>]*y1="([^"]+)"[^>]*data-chart-closing-axis/)[1]);
assert.equal(420 - netClosingY, 25, 'Single-line month names reserve one measured line and one gap, not three hypothetical lines');
const netCategories = [...netChart.innerHTML.matchAll(/<text class="chart-bars__category"[^>]*y="([^"]+)"[^>]*>([^<]+)<\/text>/g)];
assert.ok(netCategories.every(([markup, y]) => Number(y) === netClosingY + 8 && markup.includes('dominant-baseline="hanging"')));
for (const [series, token] of [['crude', 'primary'], ['gas', 'positive'], ['negative', 'negative'], ['purple', 'purple'], ['light', 'warning'], ['dark', 'secondary']]) {
  const rule = css.match(new RegExp(`(?:^|\\n)\\.series-${series}(?:,\\s*\\.series-[a-z-]+)*\\s*\\{([^}]+)\\}`))[1];
  assert.match(rule, new RegExp(`fill: var\\(--chart-series-${token}\\);`));
  assert.match(rule, new RegExp(`stroke: var\\(--chart-series-${token}\\);`));
}
assert.match(css, /\.chart-bars \.chart-bars__segment,[\s\S]*svg \[class\*="series-"\],[\s\S]*\{\s*background: transparent;/, 'SVG bars have no CSS background; their fill and stroke use the palette tokens');
assert.ok(plotBars(netChart).every(bar => !bar.style && !bar.fill && !bar.stroke), 'Report bars have no local color overrides or duplicate inline fills');
assert.equal(plotBars(netChart).length, 7);
assert.equal(plotBars(waterfallChart).length, 7, 'Nine waterfall steps stay in the model; the two zero steps do not paint bars');
for (const app of [cf, migratedTables]) {
  for (const fixture of app.root.charts.values()) {
    const bars = plotBars(fixture.chart);
    const keys = bars.map(bar => `${bar['data-row-index']}:${bar['data-series-index']}`);
    assert.equal(new Set(keys).size, keys.length, 'Each row/series paints exactly one rectangle');
    bars.forEach((bar, index) => {
      for (const other of bars.slice(index + 1)) {
        assert.ok(Number(bar.x) + Number(bar.width) <= Number(other.x) + 1e-8 || Number(other.x) + Number(other.width) <= Number(bar.x) + 1e-8 || Number(bar.y) + Number(bar.height) <= Number(other.y) + 1e-8 || Number(other.y) + Number(other.height) <= Number(bar.y) + 1e-8, 'Bar geometries do not overlap and compound the token alpha');
      }
    });
  }
}
const netValues = [...cf.root.innerHTML.matchAll(/data-block-id="netflow"[^>]*data-base="([^"]+)"/g)].map(match => Number(match[1]));
plotBars(netChart).forEach((bar, index) => {
  assert.equal(Number(bar['data-value']), netValues[index] / 1000, 'Convert monetary values only once');
  assert.ok(bar.class.includes(netValues[index] < 0 ? 'series-negative' : 'series-crude'));
});
const waterfallValues = [...cf.root.innerHTML.matchAll(/data-block-id="waterfall"[^>]*data-base="([^"]+)"/g)].map(match => Number(match[1]));
let running = waterfallValues[0];
const waterfallOptions = cf.chartMounts[4].options;
assert.equal(waterfallOptions.layout, 'waterfall');
assert.deepEqual(waterfallValues.map(value => Math.round(value * 100)), [637417661, 1381481656, -1145775958, 94843660, -114918303, 31295608, 0, 0, 884344324]);
assert.equal(waterfallValues.slice(0, -1).reduce((sum, value) => sum + Math.round(value * 100), 0), Math.round(waterfallValues.at(-1) * 100), 'The source closing balance reconciles to opening balance plus all movements');
waterfallOptions.datasets.default.forEach((row, index) => {
  const value = waterfallValues[index], start = index === 0 || index === waterfallValues.length - 1 ? 0 : running;
  const end = index === 0 || index === waterfallValues.length - 1 ? value : (running += value);
  assert.equal(row.start, start / 1000);
  assert.equal(row.end, end / 1000, 'Waterfall keeps the existing cumulative data model');
});
assert.equal((waterfallChart.innerHTML.match(/data-waterfall-connector=/g) || []).length, 8, 'Connect all nine cumulative steps, including the final balance');
assert.equal((waterfallChart.innerHTML.match(/data-waterfall-zero=/g) || []).length, 2, 'Show zero movements as level markers, not invented bars');
assert.deepEqual([...waterfallChart.innerHTML.matchAll(/<text class="chart-bars__tick"[^>]*>([^<]*)<\/text>/g)].map(match => match[1].replace(/\s/g, '')), ['0', '6000', '12000', '18000', '24000'], 'The waterfall has four useful intervals instead of an oversized 40,000 ceiling');
const waterfallFixture = cf.root.charts.get(waterfallOptions.id), waterfallBefore = plotBars(waterfallChart).map(bar => [bar.x, bar.y, bar.width, bar.height]);
const selectedLegend = waterfallFixture.legend.querySelectorAll('[data-stacked-series]')[2];
waterfallFixture.legend.emit('keydown', {key: 'Enter', preventDefault() {}, target: {closest: () => selectedLegend}});
assert.equal(selectedLegend.getAttribute('aria-pressed'), 'true');
assert.deepEqual(plotBars(waterfallChart).map(bar => [bar.x, bar.y, bar.width, bar.height]), waterfallBefore, 'Legend selection cannot reorder cumulative waterfall steps');
const segment = {dataset: {'seriesLabel': 'Выбытия', period: '- от опер.', value: '-100'}, getBoundingClientRect: () => ({left: 10, top: 30, width: 20, height: 100})};
waterfallChart.emit('pointerover', {target: {closest: () => segment}, clientX: 10, clientY: 30});
assert.equal(waterfallFixture.tooltip.hidden, false);
assert.equal(waterfallFixture.fields.get('[data-tooltip-value]').textContent, '-100');
waterfallFixture.viewport.emit('scroll', {});
assert.equal(waterfallFixture.tooltip.hidden, true);
const receiptSegment = {dataset: {seriesLabel: 'Поступления', period: 'Rompetrol Sacartvelo Ltd', value: '1312.35838'}};
receiptFixture.chart.emit('pointerover', {target: {closest: () => receiptSegment}, clientX: 90, clientY: 90});
assert.equal(receiptFixture.fields.get('[data-tooltip-value]').textContent.replace(/\s/g, ' '), '1 312,36', 'Tooltip precision matches the bar label and the table');
assert.equal(receiptFixture.fields.get('[data-tooltip-period]').textContent, 'Rompetrol Sacartvelo Ltd');
assert.match(cf.root.innerHTML, /<span>Показатель<\/span><strong data-tooltip-period/);
assert.match(css, /\.chart-tooltip > div\s*\{[^}]*grid-template-columns: minmax\(0, max-content\) minmax\(0, 1fr\);/);
assert.match(css, /\.chart-tooltip strong\s*\{[^}]*min-width: 0;[^}]*white-space: normal;[^}]*overflow-wrap: anywhere;/);
receiptFixture.viewport.scrollLeft = 200; receiptFixture.viewport.scrollTop = 480;
receiptFixture.chart.emit('pointermove', {clientX: 10000, clientY: 10000});
assert.ok(parseFloat(receiptFixture.tooltip.style.left) + receiptFixture.tooltip.offsetWidth <= receiptFixture.viewport.scrollLeft + receiptFixture.viewport.clientWidth - 8);
assert.ok(parseFloat(receiptFixture.tooltip.style.top) + receiptFixture.tooltip.offsetHeight <= receiptFixture.viewport.scrollTop + receiptFixture.viewport.clientHeight - 8);
receiptFixture.viewport.scrollLeft = 0; receiptFixture.viewport.scrollTop = 0;
receiptFixture.viewport.emit('scroll', {});

const signed = await mount('reports', {...cfConfig, state: {view: 'reports', blocks: ['netflow'], templateOverrides: {'cf-main': {netflow: {m1: -100, m2: 0, m3: -200, m4: null, m5: -100, m6: -400, m7: 0}}}}});
assert.doesNotMatch(signed.root.innerHTML, /NaN|Infinity/);
for (const fixture of signed.root.charts.values()) {
  assertPlotBounds(fixture.chart);
  assertValueLabels(fixture.chart);
}
const allZero = await mount('reports', {...cfConfig, state: {view: 'reports', blocks: ['netflow'], templateOverrides: {'cf-main': {netflow: Object.fromEntries(Array.from({length: 7}, (_, i) => [`m${i + 1}`, 0]))}}}});
assert.equal(plotBars(allZero.root.charts.values().next().value.chart).length, 0);
assert.doesNotMatch(allZero.root.innerHTML, /NaN|Infinity/);
assert.equal(valueLabels(allZero.root.charts.values().next().value.chart).length, 7, 'Zero values remain labelled without painting fake bars');
assertValueLabels(allZero.root.charts.values().next().value.chart);
const verticalEdge = await mount('reports', {...cfConfig, state: {view: 'reports', blocks: ['netflow'], templateOverrides: {'cf-main': {netflow: Object.fromEntries(Array.from({length: 7}, (_, i) => [`m${i + 1}`, i === 0 ? 4000000 : 0]))}}}});
const verticalEdgeChart = verticalEdge.root.charts.values().next().value.chart;
assertPlotBounds(verticalEdgeChart);
assertValueLabels(verticalEdgeChart);
assert.equal(Math.min(...[...verticalEdgeChart.innerHTML.matchAll(/<line class="chart-bars__grid-line"[^>]*y1="([^"]+)"/g)].map(match => Number(match[1]))), 24, 'A bar exactly at the scale limit reserves only its measured value label plus space-2');
const waterfallKeys = ['Начальный остаток', '+ от опер.', '- от опер.', '+ от инвест.', '- от инвест.', '+ от фин.', '- от фин.', 'Other', 'Конечный остаток'];
const signedWaterfall = await mount('reports', {...cfConfig, state: {view: 'reports', blocks: ['waterfall'], templateOverrides: {'cf-main': {waterfall: Object.fromEntries(waterfallKeys.map((key, index) => [key, [100, 200, -500, 600, -700, 400, -200, 50, -50][index]]))}}}});
const signedWaterfallChart = signedWaterfall.root.charts.values().next().value.chart;
assertPlotBounds(signedWaterfallChart);
assertValueLabels(signedWaterfallChart);
assert.equal((signedWaterfallChart.innerHTML.match(/data-waterfall-connector=/g) || []).length, 8, 'Waterfall connectors stay correct when the cumulative balance crosses zero');
const otherPeriod = await mount('reports', {...cfConfig, state: {view: 'reports', blocks: ['waterfall'], year: 2025}, data: {datasets: [{source: 1, year: 2025, kind: 'cf', basis: 'actual', key: 'cf-2025', rows: waterfallKeys.map((name, index) => ({id: name, name, values: Array.from({length: 12}, (_, month) => month === (index === 8 ? 6 : 0) ? [10000, 2000, -1000, 500, -500, 300, -700, 100, 10700][index] : 0)}))}]}});
const otherPeriodRows = otherPeriod.chartMounts[0].options.datasets.default;
assert.equal(otherPeriodRows[6].values[2], -.7, 'Financing outflows come from the source, not a hardcoded zero');
assert.equal(otherPeriodRows[7].values[3], .1, 'Other movements come from the source, not a hardcoded zero');
assert.ok(Math.abs(otherPeriodRows[7].end - otherPeriodRows[8].end) < 1e-8);
const fractional = await mount('reports', {...cfConfig, state: {view: 'reports', blocks: ['netflow'], unit: 'million', templateOverrides: {'cf-main': {netflow: Object.fromEntries(Array.from({length: 7}, (_, i) => [`m${i + 1}`, 10000]))}}}});
const fractionalChart = fractional.root.charts.values().next().value.chart;
assertPlotBounds(fractionalChart);
assertValueLabels(fractionalChart);
assert.equal(Number(plotBars(fractionalChart)[0]['data-value']), .01);
assert.ok(Number(plotBars(fractionalChart)[0].height) > 0, 'Small nonzero values remain real bars on the integer scale');
assert.deepEqual([...fractionalChart.innerHTML.matchAll(/class="chart-bars__tick"[^>]*data-tick-value="([^"]+)"/g)].map(match => Number(match[1])), [0, 1, 2, 3, 4]);
assert.doesNotMatch(fractionalChart.innerHTML, />0,003<\/text>/);

const roundedLine = await mount('reports', {state: {blocks: ['rounded-line'], customBlocks: {'rounded-line': {title: 'Rounded line', kind: 'fi', type: 'indicatorLine', size: 'full', rowKey: 'Revenue'}}}, data: {datasets: [{source: 1, year: 2026, kind: 'fi', basis: 'actual', key: 'rounded', rows: [{id: 'rounded-row', code: 'Revenue', name: 'Revenue', values: [-281570, 1234000, 2675870, 1279040]}]}]}});
const lineChart = [...roundedLine.root.charts.values()][0].chart;
const lineTicks = [...lineChart.innerHTML.matchAll(/class="financial-chart__tick"[^>]*y="([^"]+)"[^>]*data-tick-value="([^"]+)"/g)].map(match => ({y: Number(match[1]), value: Number(match[2])}));
assert.deepEqual(lineTicks.map(tick => tick.value), [-1000, 0, 1000, 2000, 3000], 'Line scales round bounds to whole, equal steps including zero');
for (let index = 2; index < lineTicks.length; index++) assert.ok(Math.abs((lineTicks[index].y - lineTicks[index - 1].y) - (lineTicks[1].y - lineTicks[0].y)) < .2, 'Grid spacing is proportional to the common step');
assert.ok(lineChart.innerHTML.includes('1 279,04') || lineChart.innerHTML.includes('1 279,04'), 'Tooltip values retain their original precision');
const atScaleEdge = await mount('reports', {...cfConfig, state: {view: 'reports', blocks: ['inflow'], templateOverrides: {'cf-main': {inflow: Object.fromEntries(['Перевалка', 'Дивиденды', 'Прочие доходы', 'Доходы от неосн.', 'Доходы от аренды', 'Доходы от %'].map((key, index) => [key, index === 0 ? 12000000 : 0]))}}}});
assert.equal(atScaleEdge.chartMounts[0].options.datasets.default[0].values[0], 12000);
for (const fixture of atScaleEdge.root.charts.values()) {
  for (const viewportWidth of [320, 1440, 3000]) {
    fixture.viewport.clientWidth = viewportWidth;
    atScaleEdge.observers.find(observer => observer.target === fixture.viewport).callback();
    assertPlotBounds(fixture.chart);
    assertValueLabels(fixture.chart);
    assert.equal(axisTicks(fixture.axis).at(-1).value, 12000, 'The maximum bar reaches the rounded scale edge');
    assert.ok(rightGridEdge(fixture.chart) < Number(fixture.chart.getAttribute('viewBox').split(' ')[2]) - 2, 'Reserve a right gutter only when the end label needs it');
  }
}
const sharedLine = await mount('reports', {state: {view: 'reports', blocks: ['indicator'], customBlocks: {indicator: {title: 'Line chart', kind: 'fi', type: 'indicatorLine', rowKey: 'BIHL0574'}}}});
assert.match(sharedLine.root.innerHTML, /financial-chart__line-chart/);
assert.equal(sharedLine.lineDraws.length, 1, 'Use the existing shared financial line renderer');
assert.match(sharedLine.lineDraws[0].chart.innerHTML, /financial-chart__line financial-chart__line--primary/);
assert.match(sharedLine.lineDraws[0].chart.innerHTML, /data-category="Янв" data-series-label="Revenue" data-formatted-value="1"/);
assert.match(sharedLine.lineDraws[0].options.legend.innerHTML, /financial-chart__legend-dot--primary/);
assert.doesNotMatch(sharedLine.root.innerHTML, /class="svgchart"|class="legend"|chart-card__header/);
const stableLine = sharedLine.lineDraws[0];
let stableMarkup = stableLine.chart.innerHTML, lineWrites = 0;
Object.defineProperty(stableLine.chart, 'innerHTML', {
  configurable: true,
  get() { return stableMarkup; },
  set(value) { stableMarkup = value; lineWrites++; }
});
sharedLine.ui.renderFinancialLineChart(stableLine.chart, stableLine.options);
assert.equal(lineWrites, 0, 'An identical font/resize redraw preserves SVG nodes and their running effects');
const previousLineDraws = sharedLine.lineDraws.length;
const lineObserver = sharedLine.observers.find(observer => observer.target === sharedLine.lineDraws[0].chart.parentElement);
sharedLine.click('toggle-tables');
assert.equal(lineObserver.disconnected, true);
assert.equal(sharedLine.lineDraws.length, previousLineDraws + 1);
lineObserver.callback();
assert.equal(sharedLine.lineDraws.length, previousLineDraws + 1, 'A detached line chart cannot redraw after rerendering the report');
const sharedCompare = await mount('reports', {state: {view: 'reports', blocks: ['general_oil']}, reports: JSON.parse(await read('legacy/report-studio-v5/report-data.json'))});
assert.match(sharedCompare.root.charts.values().next().value.chart.innerHTML, /chart-bars__segment series-crude/);
assert.equal(sharedCompare.chartMounts[0].options.layout, 'grouped');
const comparisonFixture = sharedCompare.root.charts.values().next().value;
for (const viewportWidth of [320, 1440, 3000]) {
  comparisonFixture.viewport.clientWidth = viewportWidth;
  sharedCompare.observers.find(observer => observer.target === comparisonFixture.viewport).callback();
  assertPlotBounds(comparisonFixture.chart);
  assertValueLabels(comparisonFixture.chart);
}
assert.match(sharedCompare.root.innerHTML, /chart-legend__dot series-light/);
assert.doesNotMatch(sharedCompare.root.innerHTML, /fill="#[0-9a-fA-F]+"|class="compare-chart-scroll"|class="compare-legend"|chart-card__header/);
assert.match(originalCf.root.innerHTML, /class="wfchart"/);
assert.doesNotMatch(originalCf.root.innerHTML, /chart-card--embedded/);

const previousViewports = [...cf.root.charts.values()].map(fixture => fixture.viewport);
const previousChartObservers = cf.observers.filter(observer => previousViewports.includes(observer.target));
assert.equal(previousChartObservers.length, 5);
cf.click('toggle-tables');
assert.ok(cf.chartMounts.slice(0, 5).every(record => record.destroyed), 'Rerendering disconnects the previous shared chart controllers');
assert.ok(previousChartObservers.every(observer => observer.disconnected));
assert.doesNotMatch(cf.root.innerHTML, /class="data-table"|class="table-wrap/);
assert.equal((cf.root.innerHTML.match(/data-report-wide/g) || []).length, 1);
assert.match(cf.root.innerHTML, /data-block="waterfall" data-report-wide/);
assert.deepEqual(reportDividers(cf.root), ['vertical', 'horizontal', 'vertical', 'horizontal'], 'Graph-only pairs have vertical dividers; successive rows have horizontal dividers');
assert.ok(cf.root.innerHTML.includes(footerMarkup), 'Changing table visibility leaves the footer typography and divider intact');
assert.deepEqual(cf.state().blocks, cfBlocks);
assert.ok(cf.root.innerHTML.includes(cfReportHeading), 'The report heading is unaffected by rearranging charts');
assert.deepEqual(blockHeadings(cf.root.innerHTML), configuredHeadings);
cf.click('block-excel', cf.root, false, {id: 'inflow'});
assert.equal(cf.state().showTables, false);
assert.equal((await cf.downloads[0].text()).match(/<table class="data-table">/g).length, 1, 'An individual Excel button exports its hidden table');
cf.click('report-excel');
assert.equal(cf.state().showTables, false, 'Export does not turn visible tables back on');
assert.equal((await cf.downloads[1].text()).match(/<table class="data-table">/g).length, 5, 'Hidden tables are still exported');
cf.click('toggle-tables');
assert.deepEqual(tableValues(cf.root), tableValues(originalCf.root));
assert.deepEqual(reportDividers(cf.root), ['horizontal', 'horizontal', 'horizontal', 'horizontal']);
assert.ok(cf.root.innerHTML.includes(cfTitle), 'The page title, info button and action buttons remain unchanged');

const editing = await mount('reports', cfConfig);
const draggableBlocks = cfBlocks.map(id => Object.assign(new Element(), {dataset: {block: id}}));
editing.document.queries.set('[data-block][draggable="true"], [data-canvas-block]', draggableBlocks);
editing.click('toggle-layout');
assert.equal((editing.root.innerHTML.match(/#Drag/g) || []).length, 5);
assert.equal((editing.root.innerHTML.match(/data-action="remove-block"/g) || []).length, 5);
assert.match(editing.root.innerHTML, /type="button" draggable="true" title="Переместить блок" aria-label="Переместить блок"/);
draggableBlocks[0].emit('dragstart', {});
let dropAllowed = false;
draggableBlocks[4].emit('dragover', {preventDefault() { dropAllowed = true; }});
assert.equal(dropAllowed, true);
draggableBlocks[4].emit('drop', {preventDefault() {}});
assert.deepEqual(editing.state().blocks, [...cfBlocks.slice(1), cfBlocks[0]], 'Dragging keeps the existing report reordering contract');
assert.ok(editing.root.innerHTML.includes(cfReportHeading));
editing.click('remove-block', editing.root, false, {id: 'inflow'});
assert.deepEqual(editing.state().blocks, [...cfBlocks.slice(2), cfBlocks[0]]);
editing.click('toggle-layout');
assert.doesNotMatch(editing.root.innerHTML, /#Drag|data-action="remove-block"/);

for (const blocks of [cfBlocks.slice(0, 4), ['waterfall'], ['inflow', 'waterfall']]) {
  const graphOnly = await mount('reports', {...cfConfig, state: {view: 'reports', blocks, showTables: false}});
  const wideCount = (graphOnly.root.innerHTML.match(/data-report-wide/g) || []).length;
  assert.equal(wideCount, blocks.length % 2, `${blocks.length} charts: only an unpaired last chart is wide`);
  assert.doesNotMatch(graphOnly.root.innerHTML, /class="data-table"/);
  assert.deepEqual(reportDividers(graphOnly.root), Array.from({length: blocks.length - 1}, (_, index) => index % 2 === 0 ? 'vertical' : 'horizontal'), 'Divider placement follows the current block count without an orphan separator');
}

const [blockId, valueKey, valueLabel, base] = cellsBefore.find(cell => cell[0] === 'netflow');
const cell = new Element(); cell.setAttribute('data-template-edit', '');
cell.dataset = {blockId, valueKey, valueLabel, base};
cf.root.emit('click', {target: cell});
assert.equal(cell.getAttribute('aria-expanded'), 'true');
assert.match(cf.modal.innerHTML, /id="data-edit-drawer"[\s\S]*filter-modal__drawer dt3-drawer[\s\S]*data-data-edit-form/);
assert.ok(cf.modal.innerHTML.includes(`Корректировка для ${cf.ui.escape(valueLabel)}</h2>`));
assert.doesNotMatch(cf.modal.innerHTML, /<h3|class="overlay"|modal-note|class="compare"|class="field"|class="btn|Причина/);
assert.equal((cf.modal.innerHTML.match(/readonly disabled tabindex="-1"/g) || []).length, 2);
assert.match(cf.modal.innerHTML, /id="tpl-edit-original"[\s\S]*id="tpl-edit-current"/);
assert.match(cf.modal.innerHTML, /type="number" step="any" required id="tpl-edit-value"/);
assert.match(cf.modal.innerHTML, /Обоснование[\s\S]*form-input__text-field[\s\S]*#Pencil[\s\S]*id="tpl-edit-reason"[^>]*required/);
assert.match(cf.modal.innerHTML, /filter-modal__footer[\s\S]*button-smallest-primary-radius[^>]*type="submit" data-action="save-template-edit"[\s\S]*button-smallest-secondary-radius[^>]*data-close/);
const beforeCorrectionState = cf.state();
for (const invalidValue of ['', 'not a number']) {
  cf.input('tpl-edit-value', invalidValue); cf.input('tpl-edit-reason', 'Test correction');
  cf.click('save-template-edit', cf.modal, false, cell.dataset);
  assert.deepEqual(cf.state(), beforeCorrectionState, 'Invalid or empty numbers cannot silently become zero');
  assert.match(cf.modal.innerHTML, /data-data-edit-form/);
}
cf.input('tpl-edit-value', 123456); cf.input('tpl-edit-reason', '   ');
cf.click('save-template-edit', cf.modal, false, cell.dataset);
assert.deepEqual(cf.state(), beforeCorrectionState, 'Justification is required');
cf.close();
assert.equal(cell.focused, true);
assert.equal(cell.getAttribute('aria-expanded'), 'false');
assert.deepEqual(cf.state(), beforeCorrectionState, 'Cancel keeps the saved value and history');
cf.root.emit('click', {target: cell});
const replacementCell = Object.assign(new Element(), {dataset: {...cell.dataset}});
const unrelatedCell = Object.assign(new Element(), {dataset: {...cell.dataset, valueKey: 'other-key'}});
cf.root.queries.set('[data-template-edit]', [unrelatedCell, replacementCell]);
cf.input('tpl-edit-value', 123456); cf.input('tpl-edit-reason', 'Test correction');
cf.click('save-template-edit', cf.modal, false, cell.dataset);
assert.equal(cf.modal.innerHTML, '');
assert.equal(cell.getAttribute('aria-expanded'), 'false');
assert.equal(replacementCell.focused, true, 'Focus returns to the replacement cell after rerender');
assert.notEqual(unrelatedCell.focused, true);
assert.equal(cf.state().templateOverrides['cf-main'].netflow[valueKey], 123456);
assert.match(cf.root.innerHTML, /data-base="123456"/);
assert.equal(JSON.stringify(cfData), beforeData, 'Correction changes only the template, not its source data');
assert.ok(cf.root.innerHTML.includes(cfReportHeading));
assert.deepEqual(blockHeadings(cf.root.innerHTML), configuredHeadings);
assert.equal(cf.state().manualLog.at(-1).reason, 'Test correction');
for (const newValue of [0, -12.75]) {
  cell.dataset.base = String(cf.state().templateOverrides['cf-main'].netflow[valueKey]);
  cf.root.emit('click', {target: cell});
  cf.input('tpl-edit-value', newValue); cf.input('tpl-edit-reason', 'Valid correction');
  cf.click('save-template-edit', cf.modal, false, cell.dataset);
  assert.equal(cf.state().templateOverrides['cf-main'].netflow[valueKey], newValue);
  assert.equal(cf.state().manualLog.at(-1).value, newValue);
}
assert.equal(JSON.stringify(cfData), beforeData);
let keyboardActivated = 0; cell.click = () => keyboardActivated++;
cf.root.emit('keydown', {target: cell, key: 'Enter', preventDefault() {}});
assert.equal(keyboardActivated, 1);

const seedReports = {general: {series: ['Actual', 'Plan'], blocks: {general_oil: {unit: 'MT', rows: [{name: 'Oil & <test>', values: [120, 180]}]}}}};
const originalSeedReports = JSON.stringify(seedReports);
const seedCorrection = await mount('reports', {reports: seedReports, state: {
  view: 'reports', blocks: ['general_oil'], seedOverrides: {'cf-main': {general_oil: {'0:0': 135}}, other: {general_oil: {'0:0': 777}}}
}});
const seedCell = Object.assign(new Element(), {dataset: {blockId: 'general_oil', rowIndex: '0', seriesIndex: '0', valueLabel: 'Oil & <test> · Actual', base: '120'}});
seedCell.setAttribute('data-seed-edit', '');
seedCorrection.root.emit('click', {target: seedCell});
assert.match(seedCorrection.modal.innerHTML, /Корректировка для Oil &amp; &lt;test&gt; · Actual<\/h2>/);
assert.match(seedCorrection.modal.innerHTML, /id="seed-edit-original" value="120" readonly disabled/);
assert.match(seedCorrection.modal.innerHTML, /id="seed-edit-current" value="135" readonly disabled/);
assert.match(seedCorrection.modal.innerHTML, /id="seed-edit-value" value="135"/);
assert.doesNotMatch(seedCorrection.modal.innerHTML, /<h3|modal-note|class="overlay"/);
const nextSeedCell = Object.assign(new Element(), {dataset: {...seedCell.dataset}});
seedCorrection.root.queries.set('[data-seed-edit]', [nextSeedCell]);
seedCorrection.input('seed-edit-value', -12.75); seedCorrection.input('seed-edit-reason', 'Seed correction');
seedCorrection.click('save-seed-edit', seedCorrection.modal, false, {...seedCell.dataset, base: '135'});
assert.equal(seedCorrection.state().seedOverrides['cf-main'].general_oil['0:0'], -12.75);
assert.equal(seedCorrection.state().seedOverrides.other.general_oil['0:0'], 777);
assert.equal(seedCorrection.state().manualLog.at(-1).old, 135);
assert.equal(nextSeedCell.focused, true);
assert.equal(seedCorrection.modal.innerHTML, '');
assert.equal(JSON.stringify(seedReports), originalSeedReports, 'Seed corrections cannot mutate the imported form');
assert.deepEqual(seedCorrection.state().overrides, {});

const editSubmitButton = Object.assign(new Element(), {dataset: {action: 'save-seed-edit', ...seedCell.dataset}});
const editForm = {matches: selector => selector === '[data-data-edit-form]', querySelector: () => editSubmitButton};
seedCorrection.root.emit('click', {target: seedCell});
seedCorrection.input('seed-edit-value', ''); seedCorrection.input('seed-edit-reason', 'Reason');
let editSubmitClicks = 0, editClickPrevented = false;
editSubmitButton.click = () => {
  editSubmitClicks++;
  seedCorrection.modal.emit('click', {target: editSubmitButton, preventDefault() { editClickPrevented = true; }});
};
seedCorrection.modal.emit('submit', {target: editForm, preventDefault() {}});
assert.equal(editSubmitClicks, 1);
assert.equal(editClickPrevented, true, 'Submitting an invalid edit must not trigger another native form submission');
assert.equal(seedCorrection.state().seedOverrides['cf-main'].general_oil['0:0'], -12.75);
seedCorrection.close();

const absentCf = await mount('reports', {...cfConfig, data: {datasets: []}});
assert.equal((absentCf.root.innerHTML.match(/empty-state--illustrated/g) || []).length, 5);
assert.doesNotMatch(absentCf.root.innerHTML, /<table|data-stacked-card|class="empty"|empty-state__title/);
assert.match(absentCf.root.innerHTML, /empty-state--smallest[\s\S]*width="96" height="96"[\s\S]*empty-state__description typography-body-smallest">Нет данных для выбранного среза<\/p>/);
const actualReportLayout = report => {
  const grid = report.root.querySelector('.report-grid');
  return {
    wide: grid.querySelectorAll(':scope > .analytics-layout__block').map(block => block.hasAttribute('data-report-wide')),
    dividers: grid.querySelectorAll(':scope > .ui-divider').map(divider => divider.classList.contains('ui-divider--vertical') ? 'vertical' : 'horizontal')
  };
};
const mixedKpis = await mount('reports', {state: {blocks: ['inflow', 'kpi', 'netflow', 'metricTrend'], showTables: true}, data: realData, reports: reportData, templates});
assert.deepEqual(actualReportLayout(mixedKpis), {wide: [true, true, true, true], dividers: ['horizontal', 'horizontal', 'horizontal']}, 'KPI stays full width with tables visible');
mixedKpis.click('toggle-tables');
assert.deepEqual(actualReportLayout(mixedKpis), {wide: [true, true, false, false], dividers: ['horizontal', 'horizontal', 'vertical']}, 'Hiding tables only pairs the surrounding charts');
const absentKpis = await mount('reports', {state: {blocks: ['inflow', 'kpi', 'netflow', 'metricTrend']}, data: {datasets: []}});
assert.deepEqual(actualReportLayout(absentKpis), {wide: [true, true, false, false], dividers: ['horizontal', 'horizontal', 'vertical']}, 'Empty KPI also keeps its row without changing empty chart pairing');
assert.deepEqual(actualReportLayout(absentCf), {wide: [false, false, false, false, true], dividers: ['vertical', 'horizontal', 'vertical', 'horizontal']}, 'Empty blocks pair exactly like graph-only blocks despite Show Tables being enabled');
assert.match(css, /\.empty-state--smallest \.empty-state__illustration\s*\{\s*width: calc\(var\(--space-5\) \* 4\);/);
assert.deepEqual(absentCf.state().blocks, cfBlocks, 'Missing data does not remove blocks from the template');
const dashValues = [null, '', '—', '-', '   ', undefined, '–', 'NaN'];
const dashCfData = {datasets: [{source: 2, year: 2026, kind: 'cf', basis: 'actual', key: 'dashes', rows: ['Перевалка_Empty', 'CAPEX', 'Net cash flows', 'Начальный остаток', 'Конечный остаток'].map((name, i) => ({id: `missing-${i}`, code: name, name, values: [...dashValues]}))}]};
const dashCfBefore = JSON.stringify(dashCfData);
const dashCf = await mount('reports', {...cfConfig, state: {view: 'reports', source: 2, blocks: cfBlocks}, data: dashCfData});
assert.equal((dashCf.root.innerHTML.match(/empty-state--illustrated/g) || []).length, 5);
assert.doesNotMatch(dashCf.root.innerHTML, /<table|chart-grid--two-column"><div class="div-block"|data-stacked-card|class="empty"/);
assert.equal(JSON.stringify(dashCfData), dashCfBefore);
const zeroData = {datasets: [{source: 2, year: 2026, kind: 'cf', basis: 'actual', key: 'zeroes', rows: ['Перевалка_Zero', 'CAPEX', 'Net cash flows', 'Начальный остаток', 'Конечный остаток'].map((name, i) => ({id: `zero-${i}`, code: name, name, values: Array(12).fill(0)}))}]};
const zeroCf = await mount('reports', {...cfConfig, state: {view: 'reports', source: 2, blocks: cfBlocks}, data: zeroData});
assert.equal(zeroCf.chartMounts.length, 5);
assert.equal((zeroCf.root.innerHTML.match(/<table class="data-table">/g) || []).length, 5, 'A real zero is a value, not an empty state');
assert.doesNotMatch(zeroCf.root.innerHTML, /empty-state--illustrated/);
const mixedCf = await mount('reports', {...cfConfig, state: {view: 'reports', source: 2, blocks: ['transshipment', 'outflow', 'netflow']}, data: {datasets: [{source: 2, year: 2026, kind: 'cf', basis: 'actual', key: 'mixed', rows: [{id: 'net', code: 'Net cash flows', name: 'Net cash flows', values: [1000, 0, 2500]}]}]}});
assert.equal((mixedCf.root.innerHTML.match(/empty-state--illustrated/g) || []).length, 2);
assert.equal((mixedCf.root.innerHTML.match(/<table class="data-table">/g) || []).length, 1);
assert.equal(mixedCf.chartMounts.length, 1, 'After an empty block the next populated chart renders normally');
assert.deepEqual(Array.from(mixedCf.chartMounts[0].options.datasets.default, row => row.values[0]), [1, 0, 2.5]);
assert.deepEqual(actualReportLayout(mixedCf), {wide: [false, false, true], dividers: ['vertical', 'horizontal']});
mixedCf.click('toggle-tables');
assert.deepEqual(actualReportLayout(mixedCf), {wide: [false, false, true], dividers: ['vertical', 'horizontal']});
const alternatingEmpty = await mount('reports', {...cfConfig, state: {view: 'reports', source: 2, blocks: ['transshipment', 'netflow', 'outflow']}, data: mixedCf.data});
assert.deepEqual(actualReportLayout(alternatingEmpty), {wide: [true, true, true], dividers: ['horizontal', 'horizontal']}, 'An empty block cannot pair across a populated table block');
const emptyIndicator = await mount('reports', {data: {datasets: [{source: 1, year: 2026, kind: 'fi', basis: 'actual', key: 'empty-indicator', rows: [{id: 'revenue', code: 'BIHL0574', name: 'Revenue', values: dashValues}]}]}});
assert.match(emptyIndicator.root.innerHTML, /#EmptyStateBox[\s\S]*Нет данных для выбранного среза/);
assert.doesNotMatch(emptyIndicator.root.innerHTML, /<table|data-stacked-card/);
const emptyLine = await mount('reports', {state: {view: 'reports', blocks: ['line'], customBlocks: {line: {title: 'Empty line', kind: 'fi', type: 'indicatorLine', rowKey: 'BIHL0574'}}}, data: emptyIndicator.data});
assert.match(emptyLine.root.innerHTML, /empty-state__description typography-body-smallest">Нет данных<\/p>/);
assert.doesNotMatch(emptyLine.root.innerHTML, /<table|data-report-line/);
const emptySeed = await mount('reports', {state: {view: 'reports', blocks: ['general_oil']}, reports: {general: {series: ['Actual', 'Plan'], blocks: {general_oil: {unit: 'MT', rows: [{name: 'Empty', values: [null, '—']}]}}}}});
assert.match(emptySeed.root.innerHTML, /empty-state__description typography-body-smallest">Нет данных<\/p>/);
assert.doesNotMatch(emptySeed.root.innerHTML, /<table|data-stacked-card/);
const emptyTables = await mount('reports', {state: {view: 'reports', blocks: ['finance', 'planFact', 'matrix'], customBlocks: {matrix: {title: 'Empty matrix', type: 'matrix', kind: 'production', seed: 'general.empty'}}}, data: {datasets: [
  {source: 1, year: 2026, kind: 'fi', basis: 'actual', key: 'empty-finance', rows: [{id: 'revenue', code: 'BIHL0574', name: 'Revenue', values: dashValues}]},
  ...['actual', 'plan'].map(basis => ({source: 1, year: 2026, kind: 'metrics', basis, key: `empty-metrics-${basis}`, rows: [{id: 'income', code: 'Выручка', name: 'Выручка', values: dashValues}]}))
]}, reports: {general: {blocks: {empty: {headers: ['Actual', 'Plan'], rows: [{name: 'Empty', values: [null, '—']}]}}}}});
assert.equal((emptyTables.root.innerHTML.match(/empty-state--smallest/g) || []).length, 3);
assert.doesNotMatch(emptyTables.root.innerHTML, /<table/);
assert.deepEqual(actualReportLayout(emptyTables), {wide: [false, false, true], dividers: ['vertical', 'horizontal']});

const printedBlock = new Element(); printedBlock.outerHTML = '<section data-block="waterfall"><table class="data-table"></table></section>';
cf.elements.set('[data-block="waterfall"]', printedBlock);
cf.elements.set('link[href*="/assets/css/tokens.css"]', {href: '/assets/css/tokens.css?v=20'});
const componentsHref = html.match(/href="([^"]*components\.css\?v=\d+)"/)[1];
cf.elements.set('link[href*="/assets/css/components.css"]', {href: componentsHref});
cf.click('block-pdf', cf.root, false, {id: 'waterfall'});
assert.ok(cf.printWindows[0].markup.includes(componentsHref));
assert.match(cf.printWindows[0].markup, /\/assets\/css\/tokens\.css\?v=20/);
assert.match(cf.printWindows[0].markup, /<table class="data-table">/);
assert.equal(cf.printWindows[0].closed, true);

const draftCorrections = {draft: {netflow: {m1: 654321}}};
const savedDraft = await mount('reports', {...cfConfig, state: {
  view: 'reports', activeTemplateId: 'draft', blocks: [...cfBlocks].reverse(),
  templateOverrides: draftCorrections, seedOverrides: {draft: {custom: {'0:0': 17}}}
}});
assert.ok(savedDraft.root.innerHTML.includes(cfReportHeading), 'Recover the complete CF heading from a previously filtered draft, even after block reordering');
assert.doesNotMatch(savedDraft.root.innerHTML, /Управленческий отчет — БНТ/);
assert.equal(savedDraft.state().activeTemplateId, 'draft', 'Metadata recovery must keep the existing correction scope');
assert.deepEqual(savedDraft.state().templateOverrides, draftCorrections);
assert.deepEqual(savedDraft.state().seedOverrides, {draft: {custom: {'0:0': 17}}});
assert.match(savedDraft.root.innerHTML, /data-value-key="m1"[^>]*data-base="654321"/);
savedDraft.click('report-filter'); savedDraft.filter({currency: 'GEL'});
savedDraft.click('apply-data-filter', savedDraft.modal);
assert.ok(savedDraft.root.innerHTML.includes(cfReportHeading), 'The recovered subtitle remains after another filter change');
assert.deepEqual(savedDraft.state().templateOverrides, draftCorrections);
const reloadedDraft = await mount('reports', {...cfConfig, state: savedDraft.state()});
assert.ok(reloadedDraft.root.innerHTML.includes(cfReportHeading), 'The recovered title and description survive page reload');
assert.match(reloadedDraft.root.innerHTML, /data-value-key="m1"[^>]*data-base="654321"/);

const customTemplate = {...templates[0], id: 'custom-cf', name: 'Custom CF', reportTitle: 'Custom report', description: 'Custom subtitle'};
const customReport = await mount('reports', {...cfConfig, state: {
  view: 'reports', activeTemplateId: 'custom-cf', blocks: cfBlocks, customTemplates: [customTemplate]
}});
customReport.click('report-filter'); customReport.filter();
customReport.click('apply-data-filter', customReport.modal);
assert.equal(customReport.state().activeTemplateId, 'custom-cf');
assert.match(customReport.root.innerHTML, /<h2 class="typography-caption-small">Custom report<\/h2><p class="typography-body-small">Custom subtitle<\/p>/);
const ambiguousDraft = await mount('reports', {...cfConfig, state: {
  view: 'reports', activeTemplateId: 'draft', blocks: cfBlocks, customTemplates: [customTemplate]
}});
assert.match(ambiguousDraft.root.innerHTML, /Управленческий отчет — БНТ/);
assert.doesNotMatch(ambiguousDraft.root.innerHTML, /Custom subtitle|Форма заказчика:/, 'Do not guess a report when multiple templates have the same blocks');
const unrelatedDraft = await mount('reports', {...cfConfig, state: {view: 'reports', activeTemplateId: 'draft', blocks: ['inflow']}});
assert.match(unrelatedDraft.root.innerHTML, /Управленческий отчет — БНТ/);
assert.doesNotMatch(unrelatedDraft.root.innerHTML, /Форма заказчика:/, 'A different draft must not inherit the CF description');

const galleryTemplate = {
  id: 'gallery-custom', name: 'Long & <template>', description: 'Full & <description>', tag: 'Category & <test>',
  sourceLabel: 'Source & <test>', filters: {source: 2, year: 2025, monthFrom: 2, monthTo: 5, currency: 'GEL', unit: 'million'},
  blocks: Array(21).fill('gallery-line'),
  customBlocks: {'gallery-line': {title: 'Custom line', kind: 'fi', type: 'indicatorLine', size: 'full', rowKey: 'BIHL0574'}}
};
const gallery = await mount('templates', {templates, state: {
  view: 'builder', blocks: ['inflow'], customTemplates: [galleryTemplate],
  templateOverrides: {'gallery-custom': {value: 9}}, seedOverrides: {'gallery-custom': {value: 11}}
}});
assert.equal(gallery.state().view, 'templates', 'The Templates route must ignore the previously opened view');
const galleryCards = gallery.root.innerHTML.match(/<article class="card-with-image card-with-image--template">[^]*?<\/article>/g);
const galleryTitle = gallery.root.innerHTML.split('<div class="templates-grid">')[0];
assert.match(galleryTitle, /button-small button-small--primary typography-button-small" type="button" data-action="create-template"[^]*?Создать шаблон/);
assert.match(galleryTitle, /data-action="create-template"[^]*?<svg[^]*?<path/);
assert.doesNotMatch(galleryTitle, /data-action="save-template"/);
assert.ok((await read('templates.html')).includes(chartScript), 'Templates preview must load the same shared bar renderer as Reports');
assert.equal(galleryCards.length, templates.length + 1);
assert.doesNotMatch(gallery.root.innerHTML, /class="template"|class="template-top"|class="btn\b|class="icon-btn"/);
for (const [index, card] of galleryCards.entries()) {
  assert.match(card, /class="badge neutral"/);
  assert.match(card, /<div class="template-meta"><span class="badge default"><span class="badge__label">[^]*?<\/span><\/span><span class="badge default"><span class="badge__label">[^]*?<\/span><\/span><\/div>/);
  assert.equal((card.match(/class="badge default"/g) || []).length, 2);
  assert.match(card, /class="template-mock"/);
  assert.match(card, /card-with-image__eyebrow typography-indicator-small/);
  assert.match(card, /card-with-image__title typography-caption-smallest/);
  assert.match(card, /card-with-image__description typography-body-smallest/);
  assert.match(card, new RegExp(`data-action="open-template" data-index="${index}"`));
  assert.match(card, /card-with-image__open/);
  assert.match(card, /financial-interface\.svg\?v=16#StrokeMail/);
  assert.match(card, /financial-interface\.svg\?v=16#StrokeShare/);
}
const lastGalleryCard = galleryCards.at(-1);
assert.match(lastGalleryCard, />21 блок<\/span>/);
assert.match(lastGalleryCard, /Long &amp; &lt;template&gt;/);
assert.match(lastGalleryCard, /Full &amp; &lt;description&gt;/);
assert.match(lastGalleryCard, /Category &amp; &lt;test&gt;/);
assert.match(lastGalleryCard, /Source &amp; &lt;test&gt;/);
assert.equal((lastGalleryCard.match(/<i class="wide"><\/i>/g) || []).length, 8, 'Keep the original schematic preview and show the full count in the badge');
gallery.click('share-template', gallery.root, false, {index: String(templates.length)});
const galleryExport = JSON.parse(await gallery.downloads.at(-1).text());
assert.deepEqual(galleryExport.blocks, galleryTemplate.blocks);
assert.deepEqual(galleryExport.customBlocks, galleryTemplate.customBlocks, 'Export un-opened saved charts from their own template');
assert.deepEqual(galleryExport.filters, galleryTemplate.filters);
assert.deepEqual(galleryExport.templateOverrides, {value: 9});
assert.equal(galleryExport.description, galleryTemplate.description);
assert.equal(galleryExport.tag, galleryTemplate.tag);
gallery.click('schedule-template', gallery.root, false, {index: String(templates.length)});
assert.match(gallery.modal.innerHTML, /Автоматическая отправка отчета/);
assert.match(gallery.modal.innerHTML, /id="schedule-template"[^>]*value="gallery-custom"/);
assert.match(gallery.modal.innerHTML, /filter-modal/);
gallery.close();
gallery.click('save-template');
assert.match(gallery.modal.innerHTML, /filter-modal/);
gallery.close();
gallery.click('import-template');
assert.equal(gallery.elements.get('#template-import').clicked, true);
gallery.click('open-template', gallery.root, false, {index: String(templates.length)});
assert.deepEqual(gallery.destinations, [], 'Opening a template stays inside Templates');
assert.match(gallery.root.innerHTML, /button-smallest-ghost typography-button-smallest"[^>]*data-action="return-templates"[^]*?#StrokeReturn[^]*?Шаблоны/);
assert.match(gallery.root.innerHTML, /scenario-copy__title-row[^]*?<h2 class="typography-caption-small">Long &amp; &lt;template&gt;/);
assert.match(gallery.root.innerHTML, /data-action="toggle-template-edit"[^]*?Редактировать/);
assert.match(gallery.root.innerHTML, /<svg width="24" height="24" viewBox="0 0 24 24"[^>]*><use href="\/assets\/icons\/financial-interface\.svg\?v=16#Pencil"/);
assert.match(gallery.root.innerHTML, /data-report-line="report-chart-/);
assert.doesNotMatch(gallery.root.innerHTML, /class="paper"|class="report-block/);
assert.equal(gallery.breadcrumbUpdates.at(-1)[0].label, 'Шаблоны');
assert.equal(gallery.breadcrumbUpdates.at(-1)[1].label, 'Предпросмотр');
assert.equal(gallery.state().activeTemplateId, galleryTemplate.id);
assert.deepEqual(gallery.state().customBlocks, galleryTemplate.customBlocks);
assert.deepEqual(gallery.state().blocks, galleryTemplate.blocks);
assert.equal(gallery.state().source, 2);
assert.equal(gallery.state().year, 2025);
assert.deepEqual(gallery.state().templateOverrides, {'gallery-custom': {value: 9}});
gallery.breadcrumbUpdates.at(-1)[0].onClick();
assert.match(gallery.root.innerHTML, /class="templates-grid"/);
assert.equal(gallery.breadcrumbUpdates.at(-1), null, 'Returning restores the base breadcrumb');

const editableTemplate = {...templates[0], id: 'editable-cf', tag: 'Финансы', access: 'Личный'};
const editGallery = await mount('templates', {...cfConfig, templates: [editableTemplate], state: {
  view: 'templates', blocks: [], editLayout: true,
  templateOverrides: {'editable-cf': {netflow: {m1: 654321}}}, seedOverrides: {'editable-cf': {seed: 77}}
}});
editGallery.click('open-template', editGallery.root, false, {index: '0'});
assert.deepEqual(editGallery.destinations, []);
assert.match(editGallery.root.innerHTML, /class="badge neutral"[^]*?Личный/);
assert.match(editGallery.root.innerHTML, /filter-summary__pills/);
assert.doesNotMatch(editGallery.root.innerHTML, /data-template-edit|draggable="true"|data-action="remove-block"/, 'Viewing cannot inherit edit controls from Reports');
editGallery.click('toggle-template-edit');
assert.match(editGallery.root.innerHTML, /Закрыть редактирование/);
assert.match(editGallery.root.innerHTML, /data-template-edit/);
assert.match(editGallery.root.innerHTML, /draggable="true"/);
editGallery.click('remove-block', editGallery.root, false, {id: 'outflow'});
const editedBlocks = editGallery.state().blocks;
assert.ok(!editedBlocks.includes('outflow'));
const finishEdit = editGallery.click('toggle-template-edit');
assert.match(editGallery.modal.innerHTML, /id="template-save-drawer" class="filter-modal"[^]*?Сохранить шаблон/);
assert.ok(editGallery.modal.innerHTML.includes(`value="${editGallery.ui.escape(editableTemplate.name)}"`), 'Edit pre-fills the original name, not a copy name');
assert.ok(editGallery.modal.innerHTML.includes(editGallery.ui.escape(editableTemplate.description)));
assert.doesNotMatch(editGallery.modal.innerHTML, /Копия —/);
const beforeCancelEdit = editGallery.state();
editGallery.close();
assert.equal(finishEdit.focused, true);
assert.deepEqual(editGallery.state(), beforeCancelEdit);
assert.match(editGallery.root.innerHTML, /Закрыть редактирование/, 'Cancel leaves editing open');
editGallery.click('toggle-template-edit');
const emptyEditName = editGallery.input('tpl-name', '');
editGallery.input('tpl-desc', 'Edited description'); editGallery.input('tpl-tag', 'Личный');
editGallery.click('confirm-save', editGallery.modal);
assert.equal(emptyEditName.focused, true);
assert.equal(editGallery.state().customTemplates.length, 0, 'Validation cannot create a partial local override');
editGallery.input('tpl-name', ' Edited & <name> ');
editGallery.input('tpl-desc', ' Edited & <description> ');
editGallery.click('confirm-save', editGallery.modal);
assert.equal(editGallery.modal.innerHTML, '');
assert.equal(editGallery.state().activeTemplateId, editableTemplate.id, 'Editing keeps the template ID');
assert.equal(editGallery.state().customTemplates.length, 1);
assert.equal(editGallery.state().customTemplates[0].name, 'Edited & <name>');
assert.equal(editGallery.state().customTemplates[0].description, 'Edited & <description>');
assert.equal(editGallery.state().customTemplates[0].tag, 'Финансы', 'Changing access must not replace the category');
assert.equal(editGallery.state().customTemplates[0].access, 'Личный');
assert.deepEqual(editGallery.state().customTemplates[0].blocks, editedBlocks);
assert.deepEqual(editGallery.state().templateOverrides['editable-cf'], {netflow: {m1: 654321}});
assert.deepEqual(editGallery.state().seedOverrides['editable-cf'], {seed: 77});
assert.match(editGallery.root.innerHTML, /Edited &amp; &lt;name&gt;/);
assert.doesNotMatch(editGallery.root.innerHTML, /Закрыть редактирование|data-template-edit|draggable="true"/);
editGallery.click('return-templates');
assert.equal((editGallery.root.innerHTML.match(/card-with-image card-with-image--template/g) || []).length, 1, 'A built-in template with a local override appears once');
assert.match(editGallery.root.innerHTML, /Edited &amp; &lt;name&gt;/);
editGallery.click('open-template', editGallery.root, false, {index: '0'});
assert.match(editGallery.root.innerHTML, /Edited &amp; &lt;description&gt;/, 'Reopening uses the saved metadata');
editGallery.click('toggle-template-edit'); editGallery.click('toggle-template-edit');
editGallery.input('tpl-name', 'Shared edited'); editGallery.input('tpl-desc', 'Shared description'); editGallery.input('tpl-tag', 'Общий');
editGallery.click('confirm-save', editGallery.modal);
assert.equal(editGallery.state().customTemplates.length, 1, 'Repeated edits never append copies');
assert.equal(editGallery.state().customTemplates[0].access, 'Общий');
assert.match(editGallery.root.innerHTML, /class="badge purple"[^]*?Общий/);
assert.doesNotMatch(editGallery.root.innerHTML, /data-action="toggle-template-edit"/);
const reopenedGallery = await mount('templates', {...cfConfig, templates: [editableTemplate], state: editGallery.state()});
assert.equal((reopenedGallery.root.innerHTML.match(/card-with-image card-with-image--template/g) || []).length, 1);
reopenedGallery.click('open-template', reopenedGallery.root, false, {index: '0'});
assert.match(reopenedGallery.root.innerHTML, /Shared edited/);
assert.doesNotMatch(reopenedGallery.root.innerHTML, /data-action="toggle-template-edit"/);
for (const [access, tone] of [['Общий', 'purple'], ['ПЭО', 'mustard']]) {
  const readonlyGallery = await mount('templates', {...cfConfig, templates: [{...editableTemplate, access}]});
  readonlyGallery.click('open-template', readonlyGallery.root, false, {index: '0'});
  assert.ok(readonlyGallery.root.innerHTML.includes(`class="badge ${tone}"`));
  assert.doesNotMatch(readonlyGallery.root.innerHTML, /data-action="toggle-template-edit"|data-template-edit|data-seed-edit|draggable="true"/);
  readonlyGallery.click('toggle-template-edit');
  assert.equal(readonlyGallery.modal.innerHTML, '', `${access} cannot start editing`);
  assert.deepEqual(readonlyGallery.destinations, []);
}
const createGallery = await mount('templates', {...cfConfig, templates: [editableTemplate], state: editGallery.state()});
const beforeCreate = createGallery.state();
createGallery.click('create-template');
assert.deepEqual(createGallery.destinations, ['/builder.html']);
assert.equal(createGallery.state().view, 'builder');
assert.equal(createGallery.state().activeTemplateId, 'draft');
assert.deepEqual(createGallery.state().blocks, []);
assert.deepEqual(createGallery.state().customBlocks, {});
assert.deepEqual(createGallery.state().customTemplates, beforeCreate.customTemplates, 'Creation preserves saved templates');
assert.deepEqual(createGallery.state().templateOverrides, beforeCreate.templateOverrides, 'Creation preserves existing corrections');
const countGallery = await mount('templates', {templates: [0, 1, 2, 5, 11].map(count => ({
  id: `count-${count}`, name: 'Count', blocks: Array(count).fill('inflow')
}))});
for (const label of ['0 блоков', '1 блок', '2 блока', '5 блоков', '11 блоков']) assert.ok(countGallery.root.innerHTML.includes(`>${label}</span>`));
const galleryCss = await read('assets/css/pages/report-studio.css');
const sharedCardTitle = css.match(/\.card-with-image__title\s*\{[^}]*\}/)[0];
assert.match(sharedCardTitle, /font-size: var\(--typography-caption-smallest-size\);/);
assert.match(sharedCardTitle, /line-height: var\(--typography-caption-smallest-line-height\);/);
assert.doesNotMatch(sharedCardTitle, /--typography-caption-small-/);
assert.match(await read('assets/js/pages/equipment.js'), /card-with-image__title typography-caption-smallest/);
assert.match(css, /\.templates-grid,\s*\.asset-cards,\s*\.schedule-list\s*\{[^}]*grid-template-columns:[^}]*gap: var\(--space-3\)/);
assert.doesNotMatch(galleryCss, /\.templates-grid\s*\{/, 'Card grids use the shared component layout');
assert.match(css, /\.card-with-image\s*\{[^}]*min-height: var\(--card-with-image-min-height\);[^}]*height: auto;/);
assert.doesNotMatch(css, /\.card-with-image--template\s*\{/, 'Templates must not override shared card sizing');
assert.doesNotMatch(css, /\.card-with-image__preview-pills|\.card-with-image__preview-blocks|\.card-with-image__preview-block\b/);
const originalPreviewCss = await read('legacy/report-studio-v5/styles.css');
assert.doesNotMatch(originalPreviewCss, /\.template-mock/, 'No legacy preview rules may override the shared component');
const mockSurface = css.match(/\.template-mock\s*\{[^}]*\}/)[0];
assert.match(mockSurface, /height: 110px;/);
assert.match(mockSurface, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);/);
assert.match(mockSurface, /gap: var\(--space-1\);/);
assert.match(mockSurface, /padding: var\(--space-2\);/);
assert.match(mockSurface, /border: 1px solid var\(--design-elements-border-default\);/);
assert.match(mockSurface, /border-radius: var\(--space-2\);/);
assert.match(mockSurface, /background: var\(--background-surface-4\);/);
assert.match(css, /\.template-mock i\s*\{[^}]*background: var\(--design-elements-icon-quarternary\);/);
assert.match(css, /\.template-mock i:nth-child\(even\)\s*\{[^}]*background: var\(--design-elements-icon-tertiary\);/);
const tokensSource = await read('assets/css/tokens.css');
for (const value of ['--design-elements-icon-quarternary: #d7eaf3;', '--design-elements-icon-tertiary: #e6eff4;', '--design-elements-icon-quarternary: #023c5a;', '--design-elements-icon-tertiary: #2e556b;', '--background-quarternary: rgba(255, 255, 255, .8);', '--background-quarternary: rgba(112, 184, 219, .05);']) assert.ok(tokensSource.includes(value));
const templateMedia = css.match(/\.card-with-image--template \.card-with-image__media\s*\{[^}]*\}/)[0];
assert.match(templateMedia, /padding-bottom: var\(--space-3\);/);
assert.match(templateMedia, /margin-bottom: calc\(-1 \* var\(--space-3\)\);/);
assert.match(css, /\.card-with-image__body\s*\{[^}]*border-radius: var\(--space-3\) var\(--space-3\) 0 0;/);
assert.match(await read('legacy/report-studio-v5/index.html'), /assets\/css\/components\.css\?v=/, 'The standalone consumer must also load the shared preview rules');
assert.doesNotMatch(originalPreviewCss, /\.template-meta/, 'Metadata must not override the default badge component');
assert.match(css, /\.badge\.default\s*\{[^}]*border: 1px solid var\(--design-elements-border-default\);[^}]*background: var\(--background-surface-4\);\s*color: var\(--text-tertiary\);/);
assert.equal(gallery.ui.badge('Source & <year>', 'default'), '<span class="badge default"><span class="badge__label">Source &amp; &lt;year&gt;</span></span>');
const legacyGallery = await mount('legacy', {templates, state: {view: 'templates'}});
assert.equal((legacyGallery.root.innerHTML.match(/class="badge default"/g) || []).length, templates.length * 2);
assert.match(await read('legacy/report-studio-v5/index.html'), /assets\/js\/ui\.js\?v=/, 'The standalone metadata renderer must load the shared badge API');
assert.match(css.match(/\.card-with-image__description\s*\{[^}]*\}/)[0], /-webkit-line-clamp: 3;/);
for (const name of ['StrokeMail', 'StrokeShare']) {
  const symbol = icons.match(new RegExp(`<symbol id="${name}"[^]*?</symbol>`))?.[0];
  assert.ok(symbol);
  assert.match(symbol, /stroke="currentColor"/);
  assert.match(symbol, /stroke-width="1\.5"/);
  assert.match(symbol, /vector-effect="non-scaling-stroke"/);
  assert.doesNotMatch(symbol, /#[0-9a-f]{6}/i);
}
const pencilSymbol = icons.match(/<symbol id="Pencil"[^]*?<\/symbol>/)?.[0];
assert.match(pencilSymbol, /viewBox="0 0 24 24"/);
assert.match(pencilSymbol, /M14\.5555 5\.5555L18\.4445 9\.4445M3\.25 20\.75/);
assert.match(pencilSymbol, /stroke="currentColor"[^>]*stroke-width="1\.5"[^>]*vector-effect="non-scaling-stroke"/);
assert.doesNotMatch(pencilSymbol, /transform=|#[0-9a-f]{6}/i);
assert.equal((icons.match(/id="Pencil"/g) || []).length, 1, 'Reuse the same pencil symbol');
assert.match(css, /\.button-small > svg\s*\{[^}]*width: 24px;[^}]*height: 24px;[^}]*flex: none;/);
assert.doesNotMatch(originalPreviewCss, /(?:^|\})\.progress(?:\{|\s)/, 'Legacy progress styles must not leak into shared table cells');
assert.match(originalPreviewCss, /\.wide-table \.progress\{[^}]*height:6px/);
const tableProgressStyle = css.match(/\.analytics-table td\.data-table__progress-cell \.progress\.scenario-range__track\s*\{[^}]*\}/)?.[0];
assert.match(tableProgressStyle, /height: calc\(var\(--progress-bar-track-size\) \+ var\(--space-4\)\)/);
assert.match(tableProgressStyle, /padding-block: var\(--space-2\)/);
assert.doesNotMatch(tableProgressStyle, /background:/);
const version = html.match(/components\.css\?v=(\d+)/)[1];
const uiVersion = html.match(/ui\.js\?v=(\d+)/)[1];
const appVersion = html.match(/src="app\.js\?v=(\d+)"/)[1];
for (const page of (await readdir(new URL('../', import.meta.url))).filter(path => path.endsWith('.html'))) {
  const markup = await read(page);
  const componentVersion = markup.match(/components\.css\?v=(\d+)/)?.[1];
  if (componentVersion) assert.equal(componentVersion, version, page);
  const sharedUiVersion = markup.match(/ui\.js\?v=(\d+)/)?.[1];
  if (sharedUiVersion) assert.equal(sharedUiVersion, uiVersion, page);
  if (markup.includes('/legacy/report-studio-v5/')) assert.match(markup, new RegExp(`src="app\\.js\\?v=${appVersion}"`), page);
}
console.log('Reports: shared correction drawer, template scope, validation, focus, measured chart gutters, responsive pairs including compact empty states, CF tables, preserved zeroes, headings, Excel, print, filters and recovered draft metadata passed.');
