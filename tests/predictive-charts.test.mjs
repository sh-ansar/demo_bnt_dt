import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/pages/analytics.js', import.meta.url), 'utf8');
const components = await readFile(new URL('../assets/css/components.css', import.meta.url), 'utf8');
const pageCss = await readFile(new URL('../assets/css/pages/analytics-v91.css', import.meta.url), 'utf8');
const html = await readFile(new URL('../analytics.html', import.meta.url), 'utf8');

const plot = { clientWidth: 358 };
const ticks = [14, 21, 21, 21, 28, 28].map(scrollWidth => ({ scrollWidth, style: {} }));
const labels = [186, 160, 145, 110].map(width => ({ width, style: {
  removeProperty() { delete this.whiteSpace; }
} }));
const styleValues = {};
const axis = {
  get clientWidth() { return plot.clientWidth - parseFloat(styleValues['--capacity-label-width']) - 60; },
  querySelectorAll() { return ticks; }
};
const host = {
  innerHTML: '',
  style: { setProperty(key, value) { styleValues[key] = value; } },
  querySelectorAll() { return labels; },
  querySelector(selector) {
    return selector === '.analytics-capacity-chart__plot' ? plot : axis;
  }
};
const context = vm.createContext({
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
      return { '--space-2': '8px', '--capacity-chart-gap': '12px', '--capacity-value-space': '48px' }[key];
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
const values = [...host.innerHTML.matchAll(/class="analytics-capacity-chart__value">(\d+)%/g)].map(match => Number(match[1]));
assert.deepEqual(values, [92, 95, 96, 87]);
assert.deepEqual(barWidths, values.map(value => value / 125 * 100));
assert.match(host.innerHTML, /analytics-capacity-chart__axis[\s\S]*chart-viewport__plot chart-scrollbar/);

const syncStart = source.indexOf('  function syncCapacityLabelWidth()');
const syncEnd = source.indexOf('  syncCapacityLabelWidth();', syncStart);
assert.ok(syncStart >= 0 && syncEnd > syncStart);
vm.runInContext(source.slice(syncStart, syncEnd), context);
for (const width of [160, 240, 358, 480, 960, 240, 960]) {
  plot.clientWidth = width;
  vm.runInContext('syncCapacityLabelWidth()', context);
  assert.ok(parseFloat(styleValues['--capacity-label-width']) <= width / 2);
  assert.ok(labels.every(label => !('whiteSpace' in label.style)));
  assert.equal(ticks[0].style.visibility, 'visible');
  assert.equal(ticks.at(-1).style.visibility, 'visible');
  let previousRight = -8;
  ticks.forEach((tick, index) => {
    if (tick.style.visibility === 'hidden') return;
    const right = axis.clientWidth * index / 5;
    const left = index === 0 ? 0 : right - tick.scrollWidth;
    assert.ok(left >= previousRight + 8, `Numeric labels do not overlap at width ${width}`);
    previousRight = index === 0 ? tick.scrollWidth : right;
  });
  if (width === 960) assert.ok(ticks.every(tick => tick.style.visibility === 'visible'));
}
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
console.log('Predictive and financial charts: static filters, 125% scale, responsive labels, intrinsic left-card height and matched right-card height passed.');
