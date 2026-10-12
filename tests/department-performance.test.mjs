import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('assets/js/department-performance.js');
const components = await read('assets/css/components.css');
const uiSource = await read('assets/js/ui.js');
const scaleStart = uiSource.indexOf('  chartScale(');
const scaleCode = uiSource.slice(scaleStart, uiSource.indexOf('  renderFinancialLineChart(', scaleStart));
const values = {kpi: [98, 91, 87, 94, 97], staffing: [96, 94, 92, 99, 99], turnover: [3.4, 4.8, 6.2, 3.9, 2.7]};
function style() {
  return {values: {}, setProperty(key, value) { this.values[key] = value; }};
}
function control() {
  return {events: {}, addEventListener(name, callback) { this.events[name] = callback; }};
}
function mount(titleClass) {
  const ui = vm.runInNewContext(`({${scaleCode}})`);
  ui.measureChartLabel = text => String(text).length * 7;
  ui.downloadCsv = (filename, rows) => { ui.exported = {filename, rows}; };
  ui.showInfoPopover = (trigger, options) => { ui.info = {trigger, options}; };
  ui.closeInfoPopover = () => { ui.info = null; };
  const charts = Object.fromEntries(Object.keys(values).map(key => [key, {
    clientWidth: 334, style: style(), axis: {innerHTML: ''}, grid: {innerHTML: ''},
    tracks: values[key].map(() => ({style: style()})),
    valueLabels: values[key].map(() => ({getBoundingClientRect: () => ({width: 32})})),
    querySelector(selector) { return selector.endsWith('__axis') ? this.axis : this.grid; },
    querySelectorAll(selector) { return selector.endsWith('__track') ? this.tracks : this.valueLabels; }
  }]));
  const controls = Object.fromEntries(['period-pill', 'period-clear', 'export', 'turnover-info', 'staffing-info', 'reset'].map(key => [key, control()]));
  const root = {
    dataset: {departmentTitleClass: titleClass}, innerHTML: '',
    querySelector(selector) {
      const chart = selector.match(/data-department-chart="([^"]+)"/);
      return chart ? charts[chart[1]] : controls[selector.match(/data-department-([^\]]+)/)[1]];
    }
  };
  const callbacks = {};
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); this.targets = []; }
    observe(target) { this.targets.push(target); }
  }
  vm.runInNewContext(source, {
    document: {querySelector: () => root}, ResizeObserver: Observer,
    window: {
      BNTUI: ui, addEventListener(name, callback) { callbacks[name] = callback; },
      getComputedStyle() { return {getPropertyValue: key => key === '--space-2' ? '8px' : '16px'}; }
    }
  });
  return {ui, root, charts, controls, callbacks, observers};
}
for (const titleClass of [undefined, 'typography-caption-small']) {
  const fixture = mount(titleClass);
  const {root, charts, ui, controls} = fixture;
  assert.match(root.innerHTML, /<section class="transshipment-analytics"/);
  assert.match(root.innerHTML, new RegExp(`class="${titleClass || 'typography-h5'}">Кадровая аналитика`));
  assert.match(root.innerHTML, /class="chart-grid--three-column"/);
  assert.equal((root.innerHTML.match(/class="chart-card department-performance-card"/g) || []).length, 3);
  assert.equal((root.innerHTML.match(/payment-deviation-chart__bar series-/g) || []).length, 15);
  assert.equal((root.innerHTML.match(/chart-legend__dot series-/g) || []).length, 3);
  const series = [...root.innerHTML.matchAll(/(?:__bar|__dot) (series-[\w-]+)/g)];
  for (const [, className] of series) {
    const rule = components.match(new RegExp(`^\\.${className}\\s*\\{([^}]+)\\}`, 'm'));
    assert.ok(rule, `Existing palette class ${className}`);
    assert.match(rule[1], /background: var\(--chart-series-/);
  }
  assert.match(root.innerHTML, /data-chart-filter aria-expanded="false" aria-controls="chart-filter-modal"/);
  assert.match(root.innerHTML, /data-department-turnover-info aria-label="[^"]+" aria-haspopup="dialog" aria-expanded="false"/);
  assert.match(root.innerHTML, /data-department-staffing-info aria-label="[^"]+" aria-haspopup="dialog" aria-expanded="false"/);
  assert.doesNotMatch(root.innerHTML + source, /за год|демонстрационн/i);
  assert.match(source, /ui\.showInfoPopover/);
  controls['turnover-info'].events.click();
  assert.equal(ui.info.trigger, controls['turnover-info']);
  assert.equal(ui.info.options.title, 'Текучесть персонала за период');
  assert.match(ui.info.options.message, /средняя численность сотрудников за тот же период × 100%/);
  controls['staffing-info'].events.click();
  assert.equal(ui.info.trigger, controls['staffing-info']);
  assert.equal(ui.info.options.title, 'Укомплектованность');
  assert.equal(ui.info.options.message, 'Фактическая численность сотрудников / штатная численность × 100%.');
  assert.equal(fixture.observers[0].targets.length, 3);
  for (const width of [240, 334, 480, 960, 334]) {
    Object.values(charts).forEach(chart => { chart.clientWidth = width; });
    fixture.callbacks.resize();
    for (const [key, chart] of Object.entries(charts)) {
      const ticks = [...chart.axis.innerHTML.matchAll(/<span>(\d+)<\/span>/g)].map(match => Number(match[1]));
      assert.ok(ticks.length >= 2);
      assert.equal(ticks[0], 0);
      const step = ticks[1];
      ticks.slice(1).forEach((value, index) => assert.equal(value - ticks[index], step));
      assert.equal((chart.grid.innerHTML.match(/<span><\/span>/g) || []).length, ticks.length - 1);
      const maximum = ticks.at(-1);
      const axisWidth = width - parseFloat(chart.style.values['--payment-deviation-label-width']) - 16;
      const reserve = parseFloat(chart.style.values['--payment-deviation-value-space']);
      chart.tracks.forEach((track, index) => {
        const percentage = parseFloat(track.style.values['--payment-deviation-value']);
        assert.equal(percentage, values[key][index] / maximum * 100);
        assert.ok((axisWidth - reserve) * percentage / 100 + 8 + 32 <= axisWidth + 1e-8);
      });
      assert.doesNotMatch(chart.axis.innerHTML, /hidden/);
    }
  }
  controls.export.events.click();
  assert.equal(ui.exported.rows.length, 6);
  assert.equal(ui.exported.rows[0][3], 'Текучесть персонала за период, %');
  assert.deepEqual(Array.from(ui.exported.rows[1]), ['Отдел безопасности', 96, 98, 3.4]);
  controls['period-clear'].events.click();
  assert.equal(controls['period-pill'].hidden, true);
  controls.export.events.click();
  assert.equal(ui.exported.filename, 'department-performance-all-periods.csv');
  controls.reset.events.click();
  assert.equal(controls['period-pill'].hidden, false);
  assert.equal(ui.info, null);
  controls.export.events.click();
  assert.equal(ui.exported.filename, 'department-performance-2025.csv');
  assert.match(root.innerHTML, /<footer class="chart-footer-actions">\s*<div class="chart-footer-actions__row">/);
  assert.match(root.innerHTML, /data-department-reset>[\s\S]*?<span>Сбросить всё<\/span>/);
  assert.match(root.innerHTML, /data-department-template-save>[\s\S]*?<span>Сохранить шаблон<\/span>/);
}
assert.match(components, /\.chart-card__header:not\(:has\(\.chart-card__filters, \.chart-actions\)\)\s*\{\s*min-height: 0;/);
assert.match(components, /\.chart-card > :is\(\.payment-deviation-chart__viewport, \.procurement-stock-chart__viewport\)\s*\{\s*padding-inline: 0;/);
assert.match(components, /\.procurement-stock-card\s*\{\s*min-height: 0;/);
assert.match(components, /\.chart-card > :is\(\.chart-legend, \.financial-chart__legend\)\s*\{\s*margin-top: 0;/);
const footerRules = [...components.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(match => match[1].includes('.chart-footer-actions'));
assert.ok(footerRules.length);
footerRules.forEach(match => assert.doesNotMatch(match[2], /padding-top:/, 'Footer does not add padding on top of its parent gap'));
assert.match(components, /\.chart-footer-actions__row\s*\{[^}]*flex-wrap: wrap;/);
for (const page of ['operations.html', 'hr.html']) assert.match(await read(page), /department-performance\.js\?v=6/);
console.log('Personnel analytics: shared three-card shell, preserved typography/data, real series colors, uniform responsive steps, period turnover info, CSV and hug spacing passed. Browser pixels excluded.');
