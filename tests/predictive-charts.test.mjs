import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/pages/analytics.js', import.meta.url), 'utf8');
const components = await readFile(new URL('../assets/css/components.css', import.meta.url), 'utf8');
const pageCss = await readFile(new URL('../assets/css/pages/analytics-v91.css', import.meta.url), 'utf8');
const html = await readFile(new URL('../analytics.html', import.meta.url), 'utf8');
const uiSource = await readFile(new URL('../assets/js/ui.js', import.meta.url), 'utf8');
const scaleStart = uiSource.indexOf('  chartScale(');
const sharedUi = vm.runInNewContext(`({${uiSource.slice(scaleStart, uiSource.indexOf('  renderFinancialLineChart(', scaleStart))}})`);
sharedUi.measureChartLabel = value => value.length * 7;

const scenarioCard = html.match(/<article\b[^>]*class="([^"]*\bscenario-table-card\b[^"]*)"[^>]*>\s*<div class="table-wrap">\s*<table class="data-table"[^>]*data-scenario-table/);
assert.ok(scenarioCard, 'The scenario table uses the shared table wrapper');
assert.ok(scenarioCard[1].split(/\s+/).includes('table-block'));
assert.ok(!scenarioCard[1].split(/\s+/).includes('data-block'), 'The table-only card must not inherit the data-block space-3 inset');
const tableSurface = components.match(/\.data-block,\s*\.table-block\s*\{([^}]+)\}/)?.[1];
assert.ok(tableSurface);
assert.doesNotMatch(tableSurface, /(?:^|;)\s*(?:padding|gap):/, 'The shared table surface remains flush with its edges');
const inset = components.match(/\.data-block > :is\(\.ranking, \.timeline, \.analytics-capacity-chart\)\s*\{([^}]+)\}/)?.[1];
assert.match(inset, /padding: 0;/, 'All three nested panels share the external data-block inset instead of adding another space-3');
assert.doesNotMatch(pageCss, /\.analytics-page \.analytics-bottom \.ranking,\s*\.analytics-page \.analytics-bottom \.timeline,\s*\.analytics-page \.analytics-capacity-chart\s*\{/);
assert.match(pageCss, /--capacity-value-space: 0px;/);
assert.doesNotMatch(pageCss, /--capacity-value-space: 48px;/, 'There is no fixed empty gutter beyond the chart grid');
assert.match(components, /\.ranking > \.rank-row:first-child\s*\{\s*padding-top: 0;/);

const plot = { clientWidth: 358 };
let ticks = [];
const labels = [186, 160, 145, 110].map(width => ({ width, style: {
  removeProperty() { delete this.whiteSpace; }
} }));
const styleValues = {};
const valueLabels = [92, 95, 96, 87].map(value => ({
  dataset: {capacityValue: String(value)},
  track: {style: {setProperty(key, value) { this[key] = value; }}},
  width: 24,
  getBoundingClientRect() { return {width: this.width}; },
  closest() { return this.track; }
}));
const axis = {
  markup: '',
  get innerHTML() { return this.markup; },
  set innerHTML(markup) {
    this.markup = markup;
    ticks = [...markup.matchAll(/>(\d+)%<\/span>/g)].map(match => ({
      value: Number(match[1]), scrollWidth: `${match[1]}%`.length * 7, style: {}
    }));
  },
  get clientWidth() { return plot.clientWidth - parseFloat(styleValues['--capacity-label-width']) - 12 - parseFloat(styleValues['--capacity-value-space'] || '0'); },
  querySelectorAll() { return ticks; }
};
const grid = {innerHTML: ''};
const host = {
  innerHTML: '',
  style: { setProperty(key, value) { styleValues[key] = value; } },
  querySelectorAll(selector) { return selector === '.analytics-capacity-chart__value' ? valueLabels : labels; },
  querySelector(selector) {
    return selector === '.analytics-capacity-chart__plot' ? plot : selector === '.analytics-capacity-chart__grid' ? grid : axis;
  }
};
const context = vm.createContext({
  ui: sharedUi,
  document: {
    getElementById(id) { assert.equal(id, 'capacity-forecast'); return host; },
    createRange() {
      let label;
      return {
        selectNodeContents(node) { label = node; },
        getBoundingClientRect() { return { width: label.width }; }
      };
    }
  },
  window: { getComputedStyle() {
    return { getPropertyValue(key) {
      return { '--space-2': '8px', '--capacity-chart-gap': '12px' }[key];
    } };
  } }
});
const renderStart = source.indexOf('  const capacityForecast = document.getElementById("capacity-forecast");');
const renderEnd = source.indexOf('  function formatChartTick', renderStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart);
vm.runInContext(source.slice(renderStart, renderEnd), context);

const axisMarkup = host.innerHTML.match(/class="analytics-capacity-chart__axis"[^>]*>([\s\S]*?)<\/div>/)[1];
const renderedTicks = [...axisMarkup.matchAll(/--capacity-tick-position:([\d.]+)%">(\d+)%/g)];
assert.deepEqual(renderedTicks.map(match => Number(match[2])), [0, 25, 50, 75, 100, 125]);
assert.deepEqual(renderedTicks.map(match => Number(match[1])), [0, 20, 40, 60, 80, 100]);
const gridMarkup = host.innerHTML.match(/class="analytics-capacity-chart__grid"[^>]*>([\s\S]*?)<\/div>/)[1];
assert.equal((gridMarkup.match(/<span><\/span>/g) || []).length, 6);
const barWidths = [...host.innerHTML.matchAll(/--capacity-value:([\d.]+)%/g)].map(match => Number(match[1]));
const values = [...host.innerHTML.matchAll(/class="analytics-capacity-chart__value" data-capacity-value="\d+">(\d+)%/g)].map(match => Number(match[1]));
assert.deepEqual(values, [92, 95, 96, 87]);
assert.deepEqual(barWidths, values.map(value => value / 125 * 100));
assert.match(host.innerHTML, /analytics-capacity-chart__axis[\s\S]*chart-viewport__plot chart-scrollbar/);

const syncStart = source.indexOf('  function syncCapacityLabelWidth()');
const syncEnd = source.indexOf('  syncCapacityLabelWidth();', syncStart);
assert.ok(syncStart >= 0 && syncEnd > syncStart);
vm.runInContext(source.slice(syncStart, syncEnd), context);
for (const width of [160, 240, 334, 358, 480, 960, 240, 960]) {
  plot.clientWidth = width;
  vm.runInContext('syncCapacityLabelWidth()', context);
  assert.ok(parseFloat(styleValues['--capacity-label-width']) <= width / 2);
  assert.ok(labels.every(label => !('whiteSpace' in label.style)));
  assert.equal(ticks[0].value, 0);
  const maximum = ticks.at(-1).value;
  assert.ok(maximum >= 125);
  const step = ticks[1].value;
  for (let index = 1; index < ticks.length; index++) assert.equal(ticks[index].value - ticks[index - 1].value, step);
  assert.equal((grid.innerHTML.match(/<span><\/span>/g) || []).length, ticks.length);
  const valueSpace = parseFloat(styleValues['--capacity-value-space']);
  const available = axis.clientWidth + valueSpace;
  for (const [index, value] of values.entries()) {
    assert.ok(axis.clientWidth * value / maximum + 8 + valueLabels[index].width <= available, `Value ${value}% stays inside its panel at width ${width}`);
    assert.equal(parseFloat(valueLabels[index].track.style['--capacity-value']), value / maximum * 100);
  }
  if (width >= 334) assert.equal(valueSpace, 0, 'Roomy charts use the full right edge without a spare value gutter');
  let previousRight = -8;
  ticks.forEach((tick, index) => {
    assert.notEqual(tick.style.visibility, 'hidden');
    const right = axis.clientWidth * index / (ticks.length - 1);
    const left = index === 0 ? 0 : right - tick.scrollWidth;
    assert.ok(left >= previousRight + 8, `Numeric labels do not overlap at width ${width}`);
    previousRight = index === 0 ? tick.scrollWidth : right;
  });
  if (width === 160) assert.ok(step > 25, 'Narrow charts increase the uniform tick step');
  if (width === 960) assert.equal(step, 25, 'Expanding the container restores the original uniform step');
}
valueLabels.forEach(label => { label.width = 48; });
plot.clientWidth = 334;
vm.runInContext('syncCapacityLabelWidth()', context);
assert.ok(parseFloat(styleValues['--capacity-value-space']) >= 0);
for (const [index, value] of values.entries()) {
  assert.ok(axis.clientWidth * value / ticks.at(-1).value + 8 + valueLabels[index].width <= axis.clientWidth + parseFloat(styleValues['--capacity-value-space']));
}
assert.match(source, /new ResizeObserver\(syncCapacityLabelWidth\)/, 'Container-width changes recompute labels without relying only on window resize');
assert.match(components, /\.analytics-capacity-chart__grid\s*\{[^}]*border-top: 1px solid var\(--design-elements-border-default\);/);
assert.match(components, /\.analytics-capacity-chart__axis span\s*\{[^}]*left: var\(--capacity-tick-position\);/);
assert.match(components, /\.analytics-capacity-chart__label\s*\{[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;/);
assert.doesNotMatch(pageCss, /\.analytics-page \.analytics-capacity-chart__label\s*\{/);

const filters = [...html.matchAll(/<button[^>]*data-chart-filter[^>]*>[\s\S]*?<\/button>/g)];
assert.equal(filters.length, 6);
for (const [filter] of filters) {
  assert.match(filter, /aria-expanded="false" aria-controls="chart-filter-modal"/);
  assert.doesNotMatch(filter, /__counter/);
}
assert.match(html, /src="\/assets\/js\/chart-filter\.js\?v=\d+"/);
assert.doesNotMatch(html + source, /data-analytics-line-filter/);
for (const name of ['risk', 'deficit']) {
  assert.match(html, new RegExp(`<div class="chart-viewport payment-deviation-chart__viewport">\\s*<div[^>]*data-analytics-resource-${name}-chart`));
}
assert.match(pageCss, /\.analytics-evidence \.analytics-financial-charts > \.chart-card:last-child\s*\{\s*contain: size;/);
assert.match(pageCss, /@media\(max-width:1200px\)[\s\S]*\.analytics-evidence \.analytics-financial-charts > \.chart-card:last-child\s*\{\s*contain: none;/);

const resultsHtml = await readFile(new URL('../financial-results.html', import.meta.url), 'utf8');
const resultsCss = await readFile(new URL('../assets/css/pages/financial-results.css', import.meta.url), 'utf8');
const operationsJs = await readFile(new URL('../assets/js/pages/operations.js', import.meta.url), 'utf8');
assert.doesNotMatch(resultsHtml + resultsCss, /financial-results-content/);
assert.match(resultsHtml, /<main id="page-content"[^>]*data-financial-overview[^>]*>\s*<div class="financial-kpis"/);
assert.match(resultsCss, /#page-content\.financial-results-page\s*\{[^}]*grid-auto-rows: max-content;[^}]*align-content: start;/);
assert.match(resultsCss, /#page-content\.financial-results-page\s*\{[^}]*gap: var\(--space-5\);/);
const resultsFilter = resultsHtml.match(/<button[^>]*data-chart-filter[^>]*>[\s\S]*?<\/button>/)[0];
assert.match(resultsFilter, /aria-expanded="false" aria-controls="chart-filter-modal"/);
assert.doesNotMatch(resultsFilter, /__counter/);
assert.match(resultsHtml, /src="\/assets\/js\/chart-filter\.js\?v=\d+"/);
assert.doesNotMatch(resultsHtml + operationsJs, /data-financial-chart-filter/);
console.log('Predictive and financial charts: static filters, uniform adaptive steps, responsive labels, preserved values, intrinsic left-card height and matched right-card height passed.');
