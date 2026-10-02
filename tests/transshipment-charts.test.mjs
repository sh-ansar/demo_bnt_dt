import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

function element(dataset = {}) {
  return {
    dataset, attributes: {}, events: {}, innerHTML: '', hidden: true, textContent: '',
    clientWidth: 1440, clientHeight: 420, scrollLeft: 0, scrollTop: 0,
    offsetWidth: 180, offsetHeight: 100,
    style: { values: {}, setProperty(key, value) { this.values[key] = value; } },
    classList: { values: new Set(), toggle(key, active) { active ? this.values.add(key) : this.values.delete(key); } },
    setAttribute(key, value) { this.attributes[key] = value; },
    appendChild(child) { this.lastChild = child; },
    remove() {},
    addEventListener(key, callback) { this.events[key] = callback; },
    getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; },
    focus() { this.focused = true; },
    click() { this.events.click?.({ target: this }); },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
}

const cards = new Map();
const mounted = [];
const host = {
  insertAdjacentHTML(position, markup) {
    const id = markup.match(/data-stacked-card="([^"]+)"/)[1];
    const chart = element();
    const viewport = element();
    const tooltip = element();
    const fields = new Map(['title', 'period', 'value'].map(name => [`[data-tooltip-${name}]`, element()]));
    tooltip.querySelector = selector => fields.get(selector);
    const legend = element();
    let legendItems = [];
    Object.defineProperty(legend, 'innerHTML', {
      get() { return this.markup || ''; },
      set(value) {
        this.markup = value;
        legendItems = [...value.matchAll(/data-stacked-series="(\d+)"/g)].map(match => element({ stackedSeries: match[1] }));
      }
    });
    legend.innerHTML = markup;
    legend.querySelectorAll = () => legendItems;
    const tabs = [...markup.matchAll(/<button id="([^"]+)"[^>]*data-stacked-tab="([^"]+)"/g)].map(match => {
      const tab = element({ stackedTab: match[2] });
      tab.id = match[1];
      return tab;
    });
    const card = element();
    const nodes = new Map([['.chart-bars', chart], ['.chart-viewport', viewport], ['.chart-tooltip', tooltip], ['.chart-legend', legend]]);
    card.querySelector = selector => nodes.get(selector);
    card.querySelectorAll = () => tabs;
    cards.set(id, { card, chart, viewport, tooltip, fields, legend, tabs, markup });
    if (position === 'afterbegin') mounted.unshift(id); else mounted.push(id);
  },
  querySelector(selector) { return cards.get(selector.match(/"([^"]+)"/)[1]).card; }
};
let exportedBlob;
let labelLineHeight = 16;
const document = {
  // shell.js moves page-content into app-shell > app-main before page scripts run.
  querySelector(selector) {
    return selector === '#page-content[data-transshipment-analytics]' ? host : null;
  },
  createElementNS() { return element(); },
  createElement() { return { click() {} }; }
};
const context = vm.createContext({
  document, Blob, Intl,
  URL: { createObjectURL(blob) { exportedBlob = blob; return 'blob:test'; }, revokeObjectURL() {} },
  window: {
    setTimeout() {},
    getComputedStyle() {
      return {
        lineHeight: `${labelLineHeight}px`,
        getPropertyValue(name) { return ({ '--chart-bars-bar-size': '12px', '--space-2': '8px', '--space-3': '12px' })[name] || ''; }
      };
    }
  }
});
const engine = await readFile(new URL('../assets/js/chart-stacked-bars.js', import.meta.url), 'utf8');
const page = await readFile(new URL('../assets/js/pages/transshipment.js', import.meta.url), 'utf8');
vm.runInContext(engine, context);
const controllers = new Map();
const originalMount = context.window.BNTCharts.mountStackedBars;
context.window.BNTCharts.mountStackedBars = options => {
  const controller = originalMount(options);
  controllers.set(options.id, { options, controller });
  return controller;
};
vm.runInContext(page, context);
assert.deepEqual(mounted, ['transshipment-clients', 'transshipment-countries']);

const clients = cards.get('transshipment-clients');
const countries = cards.get('transshipment-countries');
const clientController = controllers.get('transshipment-clients').controller;
const countryController = controllers.get('transshipment-countries').controller;
assert.equal(clientController.getView().length, 5);
assert.deepEqual(Array.from(clientController.getView(), row => row.label), ['2022', '2023', '2024', '2025', '2026']);
assert.equal(controllers.get('transshipment-clients').options.periodLabel, 'с 01.01.2022 до 31.12.2026');
assert.equal(controllers.get('transshipment-clients').options.tickStep, 200000);
assert.equal(controllers.get('transshipment-countries').options.tickStep, 200000);
assert.equal(countryController.getView().length, 24);
assert.equal(controllers.get('transshipment-clients').options.series.length, 6);
assert.equal(controllers.get('transshipment-clients').options.series.at(-1).label, 'Остальные компании');
assert.equal(controllers.get('transshipment-countries').options.axisPosition, 'top');
assert.equal(controllers.get('transshipment-countries').options.orientation, 'horizontal');
assert.equal(countries.chart.events.wheel, undefined);
assert.equal(countries.chart.style.values['--chart-bars-height'], '1020px');
assert.equal(clients.chart.style.values['--chart-bars-height'], '260px');
assert.match(countries.chart.innerHTML, /class="chart-bars__tick"[^>]*y="28"/);

function assertGeometry(chart) {
  const [, , width, height] = chart.attributes.viewBox.split(' ').map(Number);
  const rects = [...chart.innerHTML.matchAll(/<rect[^>]+>/g)];
  const axes = [...chart.innerHTML.matchAll(/<line class="chart-bars__axis-line" x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"/g)];
  assert.equal(axes.length, 1);
  assert.equal(axes[0][1], '64');
  assert.equal(axes[0][3], '64');
  assert.ok(Number(axes[0][4]) > Number(axes[0][2]));
  const ticks = [...chart.innerHTML.matchAll(/<text class="chart-bars__tick" x="([^"]+)"[^>]*text-anchor="end" data-tick-value="(\d+)"/g)];
  assert.ok(ticks.length > 0);
  assert.equal(Number(ticks[0][1]), 56);
  assert.equal(Number(ticks.at(-1)[2]), 2000000);
  for (let index = 1; index < ticks.length; index += 1) {
    assert.equal(Number(ticks[index][2]) - Number(ticks[index - 1][2]), 200000);
  }
  const rows = new Set([...chart.innerHTML.matchAll(/data-row-index="(\d+)"/g)].map(match => match[1]));
  const horizontalLines = [...chart.innerHTML.matchAll(/<line class="chart-bars__grid-line" x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"/g)];
  assert.equal(horizontalLines.length, rows.size + 1);
  const rowStep = (Number(horizontalLines.at(-1)[2]) - Number(horizontalLines[0][2])) / rows.size;
  assert.equal(rowStep, labelLineHeight + 24);
  horizontalLines.forEach((line, index) => {
    assert.equal(line[1], '64');
    assert.equal(Number(line[3]), width - 18);
    assert.equal(line[2], line[4]);
    assert.ok(Math.abs(Number(line[2]) - Number(horizontalLines[0][2]) - rowStep * index) < .001);
  });
  const verticalLines = [...chart.innerHTML.matchAll(/<line class="chart-bars__vertical-line" x1="([^"]+)"[^>]*x2="([^"]+)"/g)];
  assert.equal(verticalLines.length, ticks.length);
  assert.equal(Number(verticalLines.at(-1)[1]), width - 18);
  assert.ok(rects.length > 0);
  for (const [rect] of rects) {
    const attributes = Object.fromEntries([...rect.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
    const x = Number(attributes.x), y = Number(attributes.y);
    const w = Number(attributes.width), h = Number(attributes.height);
    assert.ok([x, y, w, h].every(Number.isFinite));
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0);
    assert.ok(x + w <= width + .001 && y + h <= height + .001);
    assert.equal(h, 12);
    assert.ok(!('style' in attributes));
    assert.ok(attributes.class.includes('series-'));
  }
}

for (const key of ['all', 'receipt', 'storage', 'shipment']) {
  clientController.setTab(key);
  assert.equal(clientController.getView().length, 5);
  assertGeometry(clients.chart);
}
for (const [key, count] of [['all', 4], ['type', 4], ['grade', 6], ['fpn', 5]]) {
  countryController.setTab(key);
  assert.equal(countryController.getView().length, 24);
  assert.ok(countryController.getView().every(row => row.values.length === count));
  assertGeometry(countries.chart);
  assert.equal(countries.legend.querySelectorAll().length, count);
  const active = countries.tabs.filter(tab => tab.attributes['aria-selected'] === 'true');
  assert.equal(active.length, 1);
  assert.equal(active[0].dataset.stackedTab, key);
  assert.equal(countries.viewport.attributes['aria-labelledby'], active[0].id);
}
countryController.setTab('all');
countryController.selectSeries(2);
assert.match(countries.chart.innerHTML, /data-series-index="2"/);
assert.ok(countries.legend.querySelectorAll()[2].classList.values.has('is-selected'));
countryController.setTab('type');
assert.ok(countries.legend.querySelectorAll().every(item => item.attributes['aria-pressed'] === 'false'));
countries.tabs[0].events.keydown({ key: 'ArrowRight', preventDefault() {} });
assert.equal(countries.tabs[1].focused, true);

const segment = {
  dataset: { seriesIndex: '0', rowId: '0', seriesLabel: 'Crude Oil', period: 'A.O.', value: '550000' },
  getBoundingClientRect() { return { left: 64, top: 100, width: 100, height: 28 }; }
};
const target = { closest(selector) { return selector === '[data-chart-segment]' ? segment : null; } };
countries.viewport.scrollTop = 480;
countries.chart.events.pointerover({ target, clientX: 100, clientY: 100 });
assert.equal(countries.tooltip.hidden, false);
assert.equal(countries.fields.get('[data-tooltip-period]').textContent, 'A.O.');
assert.equal(countries.tooltip.style.top, '592px');
countries.viewport.events.scroll();
assert.equal(countries.tooltip.hidden, true);
countries.card.events.click({ target: { closest(selector) { return selector === '[data-stacked-export]' ? {} : null; } } });
assert.match(await exportedBlob.text(), /Crude Oil, МТ/);
assert.match(await exportedBlob.text(), /"Страна"/);
assert.match(await exportedBlob.text(), /A.O./);
for (const width of [375, 768, 1440, 1920]) {
  countries.viewport.clientWidth = width;
  countryController.setTab('all');
  assertGeometry(countries.chart);
  assert.equal(countries.chart.style.values['--chart-bars-height'], '1020px');
}
labelLineHeight = 24;
countryController.setTab('all');
assert.equal(countries.chart.style.values['--chart-bars-height'], '1212px');
assertGeometry(countries.chart);
clientController.setTab('all');
assert.equal(clients.chart.style.values['--chart-bars-height'], '300px');
assertGeometry(clients.chart);
labelLineHeight = 16;

const modal = element();
const drawer = element();
const search = element();
const filterTitle = element();
const searchForm = element();
const filterNodes = new Map([
  ['#chart-filter-title', filterTitle], ['.filter-modal__drawer', drawer],
  ['[data-chart-static-search]', search], ['[data-chart-static-search-form]', searchForm]
]);
modal.querySelector = selector => filterNodes.get(selector);
const filterDocument = element();
filterDocument.body = { appendChild() {} };
filterDocument.createElement = () => ({ content: { firstElementChild: modal } });
vm.runInNewContext(await readFile(new URL('../assets/js/chart-filter.js', import.meta.url), 'utf8'), {
  document: filterDocument, window: {}
});
function openFilter(variant) {
  const trigger = element({ chartFilterVariant: variant });
  trigger.closest = () => ({ querySelector() { return { textContent: 'Данные по клиентам' }; } });
  filterDocument.events.click({ target: { closest() { return trigger; } }, preventDefault() {} });
  return trigger;
}
const dateTrigger = openFilter('static-date');
assert.ok(drawer.classList.values.has('dt3-drawer_static-date'));
assert.equal(dateTrigger.attributes['aria-expanded'], 'true');
assert.equal(modal.hidden, false);
assert.equal(filterTitle.textContent, 'Фильтр: Данные по клиентам');
const regularTrigger = openFilter(undefined);
assert.ok(!drawer.classList.values.has('dt3-drawer_static-date'));
assert.equal(dateTrigger.attributes['aria-expanded'], 'false');
filterDocument.events.keydown({ key: 'Escape', preventDefault() {} });
assert.equal(modal.hidden, true);
assert.equal(regularTrigger.attributes['aria-expanded'], 'false');
assert.equal(regularTrigger.focused, true);
openFilter('static-date');
assert.ok(drawer.classList.values.has('dt3-drawer_static-date'));

const css = await readFile(new URL('../assets/css/components.css', import.meta.url), 'utf8');
assert.match(css, /\.chart-bars,\s*\.chart-donut\s*\{[^}]*outline: 0;/);
assert.match(css, /\.chart-bars__segment:focus-visible\s*\{[^}]*stroke: var\(--design-elements-border-strong\);/);
assert.match(css, /\.chart-bars--stacked\s*\{\s*--chart-bars-bar-size: var\(--space-3\);/);
assert.match(css, /\.chart-bars__axis-line\s*\{\s*stroke: var\(--design-elements-icon-primary\);\s*stroke-width: 1;/);
assert.doesNotMatch(css, /\.chart-bars--stacked \.chart-bars__axis-line/);
assert.match(css, /\.chart-bars__grid-line,\s*\.chart-bars__vertical-line\s*\{\s*stroke: var\(--design-elements-border-default\);\s*stroke-width: 1;/);
assert.match(css, /\.dt3-drawer_static-date \[data-chart-departments-filter\]\s*\{\s*display: none;/);
assert.doesNotMatch(css, /chart-viewport--horizontal/);
assert.doesNotMatch(engine, /chart-viewport--horizontal/);
assert.match(css, /--quality-detail-drawer-card-max-height: 420px;/);
assert.match(css, /:is\(\.chart-viewport, \.chart-donut__viewport, \.financial-chart__viewport\),/);
assert.match(css, /\[class\*="__bar"\]/);
assert.match(css, /svg \[class\*="series-"\]/);
assert.match(css, /:has\(svg\)\s*\{\s*background: transparent;/);
const shared = await readFile(new URL('../assets/js/transshipment-analytics.js', import.meta.url), 'utf8');
assert.equal((shared.match(/data-chart-filter-variant="static-date"/g) || []).length, 3);
console.log('Transshipment charts: data, tabs, geometry, scroll, tooltips, CSV, drawer variants and shared styles passed.');
