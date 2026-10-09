import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const operations = await readFile(new URL('../assets/js/pages/operations.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/pages/operations.css', import.meta.url), 'utf8');
assert.doesNotMatch(operations + css, /data-cash-filter|data-cash-month-options|data-cash-period-option|cash-flow__filter/);

let glyphWidth = 6;
let onResize, onFontsReady;
function element() {
  return {
    events: {}, attributes: {}, style: {}, hidden: true,
    addEventListener(type, handler) { this.events[type] = handler; },
    setAttribute(key, value) { this.attributes[key] = value; },
    appendChild(child) { this.lastChild = child; },
    getComputedTextLength() { return this.textContent.length * glyphWidth; },
    remove() {}
  };
}
const chart = element();
const viewport = { clientWidth: 960, scrollLeft: 0 };
const period = element();
const reset = element();
const tooltip = element();
const info = element();
const popover = element();
const infoClose = element();
const exportButton = element();
const rootNodes = new Map([
  ['[data-cash-chart]', chart], ['[data-cash-chart-viewport]', viewport],
  ['[data-cash-tooltip]', tooltip], ['[data-cash-period-label]', period],
  ['[data-cash-reset]', reset], ['[data-cash-info]', info],
  ['[data-cash-info-popover]', popover], ['[data-cash-info-close]', infoClose],
  ['[data-cash-export]', exportButton]
]);
const root = { querySelector(selector) { return rootNodes.get(selector); } };
const document = element();
document.querySelector = () => root;
document.createElementNS = () => element();
document.fonts = { ready: { then(callback) { onFontsReady = callback; } } };
let download, exportedBlob, closeCount = 0;
document.createElement = () => ({ click() { download = this.download; } });
const cashStart = operations.indexOf('(function initCashFlow()');
const cashEnd = operations.indexOf('(function initFinancialOverview()', cashStart);
assert.ok(cashStart >= 0 && cashEnd > cashStart);
vm.runInNewContext(operations.slice(cashStart, cashEnd), {
  document, Blob,
  URL: { createObjectURL(blob) { exportedBlob = blob; return 'blob:test'; }, revokeObjectURL() {} },
  ResizeObserver: class {
    constructor(callback) { onResize = callback; }
    observe(target) { assert.equal(target, viewport); }
  },
  window: {
    BNTChartFilter: { close() { closeCount += 1; } },
    setTimeout(callback) { callback(); },
    getComputedStyle() { return { getPropertyValue(name) { return name === '--space-3' ? '12px' : ''; } }; }
  }
});

function assertAxisFits(minPlotWidth = 12 * 184) {
  const ticks = [...chart.innerHTML.matchAll(/<text class="chart-bars__tick" x="([^"]+)"[^>]*>([^<]+)<\/text>/g)];
  assert.equal(ticks.length, 6);
  const axisLeft = Number(chart.innerHTML.match(/<line class="chart-bars__axis-line" x1="([^"]+)"/)[1]);
  const maxTickWidth = Math.max(...ticks.map(tick => tick[2].length * glyphWidth));
  assert.equal(axisLeft, Math.ceil(maxTickWidth) + 24);
  for (const tick of ticks) {
    assert.ok(Number(tick[1]) - tick[2].length * glyphWidth >= 12, 'The entire tick label fits inside the SVG');
    assert.equal(axisLeft - Number(tick[1]), 12, 'Tick-to-grid spacing uses space-3');
  }
  const width = Number(chart.attributes.viewBox.split(' ')[2]);
  assert.equal(width, Math.max(viewport.clientWidth, axisLeft + 18 + minPlotWidth));
  assert.equal(chart.style.width, `${width}px`);
  assert.equal(Number(chart.attributes.viewBox.split(' ')[3]), 420);
  return axisLeft;
}

const initialAxisLeft = assertAxisFits();
glyphWidth = 8;
onFontsReady();
assert.ok(assertAxisFits() > initialAxisLeft, 'The axis gutter updates after font loading');
for (const width of [3000, 2560, 1920, 1440, 960, 390]) {
  viewport.clientWidth = width;
  onResize();
  assertAxisFits();
}
viewport.clientWidth = 960;

assert.ok(period.textContent.endsWith('31.12.2026'));
exportButton.events.click();
assert.equal(download, 'cash-flow-2026-months.csv');
assert.equal((await exportedBlob.text()).split('\n').length, 13);

chart.events.click({ target: { closest(selector) {
  assert.equal(selector, '[data-cash-month-index]');
  return { dataset: { cashMonthIndex: '1' } };
} } });
assert.equal(closeCount, 1);
assert.ok(period.textContent.endsWith('28.02.2026'));
assert.ok(viewport.scrollLeft >= 0);
const weeklyPlans = [...chart.innerHTML.matchAll(/<rect[^>]*cash-flow-chart__bar--plan[^>]*data-cash-month-index="1"[^>]*data-value="(\d+)"/g)];
const weeklyFacts = [...chart.innerHTML.matchAll(/<rect[^>]*cash-flow-chart__bar--fact[^>]*data-cash-month-index="1"[^>]*data-value="(\d+)"/g)];
assert.equal(weeklyPlans.length, 5);
assert.equal(weeklyFacts.length, 5);
assertAxisFits(11 * 184 + 5 * 112);
assert.equal(weeklyPlans.reduce((sum, match) => sum + Number(match[1]), 0), 68000000);
assert.equal(weeklyFacts.reduce((sum, match) => sum + Number(match[1]), 0), 71000000);
exportButton.events.click();
assert.equal(download, 'cash-flow-2026-02-weeks.csv');
assert.equal((await exportedBlob.text()).split('\n').length, 6);

reset.events.click();
assertAxisFits();
assert.ok(period.textContent.endsWith('31.12.2026'));
assert.equal(viewport.scrollLeft, 0);
let prevented = false;
chart.events.keydown({ key: 'Enter', preventDefault() { prevented = true; }, target: {
  closest() { return { dataset: { cashMonthIndex: '0' } }; }
} });
assert.ok(prevented);
assert.ok(period.textContent.endsWith('31.01.2026'));
info.events.click();
assert.equal(popover.hidden, false);
document.events.keydown({ key: 'Escape' });
assert.equal(popover.hidden, true);
assert.equal(info.attributes['aria-expanded'], 'false');
assert.equal(closeCount, 4);

for (const pageName of ['budget-payments', 'contracts']) {
  const source = await readFile(new URL(`../assets/js/pages/${pageName}.js`, import.meta.url), 'utf8');
  assert.doesNotMatch(source, /__counter|closest\('\[data-(?:payment|contract)-filter\]'\)/);
  const start = source.indexOf("  page.addEventListener('click', function (event) {");
  const end = source.indexOf(pageName === 'budget-payments'
    ? "  deviationRoot?.addEventListener('keydown'" : "  document.addEventListener('click'", start);
  assert.ok(start >= 0 && end > start);
  let handleClick, removed = false;
  vm.runInNewContext(source.slice(start, end), {
    page: { addEventListener(type, handler) { assert.equal(type, 'click'); handleClick = handler; } }
  });
  handleClick({ target: { closest(selector) {
    assert.equal(selector, `[data-${pageName === 'budget-payments' ? 'payment' : 'contract'}-filter-clear]`);
    return { closest(pillSelector) {
      assert.equal(pillSelector, '.filter-summary__count');
      return { remove() { removed = true; } };
    } };
  } } });
  assert.ok(removed, `${pageName}: the close button removes only its summary pill`);
}
console.log('Cash Flow and finance pills: measured axis gutter at 390-3000px, font loading, monthly drill-down, totals, reset, keyboard, CSV, shared drawer close and individual pill removal passed.');
