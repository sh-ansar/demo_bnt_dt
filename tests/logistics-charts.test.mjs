import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const operations = await readFile(new URL('../assets/js/pages/operations.js', import.meta.url), 'utf8');
const logistics = await readFile(new URL('../assets/js/pages/logistics.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/pages/operations.css', import.meta.url), 'utf8');
const components = await readFile(new URL('../assets/css/components.css', import.meta.url), 'utf8');
assert.doesNotMatch(css, /\.logistics-overview__card\s*\{[^}]*min-height:/, 'Overview cards inherit the intrinsic chart-card height');
assert.match(components, /\.logistics-overview__card > :is\(\.chart-legend, \.financial-chart__legend\)\s*\{\s*margin-top: 0;/, 'Legend follows the plot without an auto-margin spacer');
assert.match(components, /\.chart-card\s*\{[^}]*min-height: 0;[^}]*gap: var\(--space-3\);/);
assert.doesNotMatch(css, /\.logistics-overview__legend\s*\{[^}]*padding-top:/, 'The existing chart-card gap is not doubled by legend padding');
for (const selector of ['logistics-bar-row__fill', 'logistics-overview__legend-dot']) {
  const rule = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]+)\\}`))?.[1];
  assert.ok(rule, `${selector}: shared chart geometry or legend rule exists`);
  assert.match(rule, /background: var\(--chart-series-primary\)/);
  assert.doesNotMatch(rule, /\brgb\(|\bopacity:/, 'Chart alpha comes from the series token, without a second opacity');
}
assert.match(css, /\.logistics-bar-row__track\s*\{[^}]*background: transparent/);
for (const [direction, tone] of [['incoming', 'positive'], ['outgoing', 'warning']]) {
  const rule = css.match(new RegExp(`\\.metric-card--${direction}\\s*\\{([^}]+)\\}`))?.[1];
  assert.ok(rule?.includes(`background: var(--system-elements-semantic-${tone}-secondary-fade)`));
}
for (const pier of ['svm', 'one', 'two', 'three']) {
  assert.ok(css.includes(`--daily-pier-${pier}-fill: var(--system-elements-semantic-neutral-secondary-fade)`));
}
assert.doesNotMatch(css, /rgb\((?:106 207 239|90 201 132|254 174 101) \/ 20%\)/);
const dataContext = vm.createContext({ window: {} });
vm.runInContext(await readFile(new URL('../assets/js/data/logistics.js', import.meta.url), 'utf8'), dataContext);
const data = dataContext.window.BNT_DATA.logistics;

function host() {
  const values = {};
  return {
    innerHTML: '', values,
    style: { setProperty(key, value) { values[key] = value; } },
    querySelectorAll(selector) {
      assert.equal(selector, '.logistics-bar-row__label');
      return [...this.innerHTML.matchAll(/class="logistics-bar-row__label">([^<]*(?:<br>[^<]*)?)<\/span>/g)]
        .map(match => ({ lines: match[1].split('<br>') }));
    }
  };
}
const document = {
  createRange() {
    let node;
    return {
      selectNodeContents(label) { node = label; },
      getClientRects() { return node.lines.map(line => ({ width: line.length * 7 })); }
    };
  }
};
const operationHosts = { products: host(), capacities: host() };
const wagonHosts = { products: host(), capacities: host() };
const operationContext = vm.createContext({
  document, source: data,
  root: { querySelector(selector) {
    return selector === '[data-logistics-product-volume]' ? operationHosts.products : operationHosts.capacities;
  } }
});
const overviewStart = operations.indexOf('(function initLogisticsOverview()');
const operationStart = operations.indexOf('  const numberFormatter', overviewStart);
const operationEnd = operations.indexOf('  function downloadCsv', operationStart);
assert.ok(overviewStart >= 0 && operationStart > overviewStart && operationEnd > operationStart);
vm.runInContext(operations.slice(operationStart, operationEnd), operationContext);
vm.runInContext("renderRows('[data-logistics-product-volume]', configs.products); renderRows('[data-logistics-capacity]', configs.capacities);", operationContext);

const wagonContext = vm.createContext({ document, window: { BNT_DATA: { logistics: data } }, wagonHosts });
const wagonStart = logistics.indexOf('  const original');
const wagonPrefixEnd = logistics.indexOf('  function wagonSortValue');
const renderStart = logistics.indexOf('  function renderBarChart');
const renderEnd = logistics.indexOf('  function renderAnalytics', renderStart);
assert.ok(wagonStart >= 0 && wagonPrefixEnd > wagonStart && renderEnd > renderStart);
vm.runInContext(logistics.slice(wagonStart, wagonPrefixEnd) + logistics.slice(renderStart, renderEnd), wagonContext);
vm.runInContext('renderBarChart(wagonHosts.products, data.products, chartConfigs.products); renderBarChart(wagonHosts.capacities, data.capacities, chartConfigs.capacities);', wagonContext);

for (const key of ['products', 'capacities']) {
  const operation = operationHosts[key];
  const wagon = wagonHosts[key];
  const normalize = html => html.replace(/>\s+</g, '><').trim();
  assert.equal(normalize(wagon.innerHTML), normalize(operation.innerHTML), `${key}: both pages render the same component contract`);
  assert.deepEqual(wagon.values, operation.values);
  assert.match(wagon.innerHTML, /logistics-bar-scale[\s\S]*?<\/div>\s*<div class="chart-viewport__plot chart-scrollbar"><div class="logistics-bar-body">\s*<div class="logistics-bar-grid"/);
  assert.equal((wagon.innerHTML.match(/class="logistics-bar-body"/g) || []).length, 1);
  assert.equal((wagon.innerHTML.match(/class="logistics-bar-row typography-body-smallest"/g) || []).length, 4);
  assert.ok(parseFloat(wagon.values['--logistics-label-width']) > 0);
}
console.log('Logistics charts: wagon and operations markup, label widths, fixed scales and plot-scoped grids match.');
