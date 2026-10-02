import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const operations = await readFile(new URL('../assets/js/pages/operations.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/pages/operations.css', import.meta.url), 'utf8');
assert.doesNotMatch(operations + css, /data-cash-filter|data-cash-month-options|data-cash-period-option|cash-flow__filter/);

function element() {
  return {
    events: {}, attributes: {}, style: {}, hidden: true,
    addEventListener(type, handler) { this.events[type] = handler; },
    setAttribute(key, value) { this.attributes[key] = value; }
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
let download, exportedBlob, closeCount = 0;
document.createElement = () => ({ click() { download = this.download; } });
const cashStart = operations.indexOf('(function initCashFlow()');
const cashEnd = operations.indexOf('(function initFinancialOverview()', cashStart);
assert.ok(cashStart >= 0 && cashEnd > cashStart);
vm.runInNewContext(operations.slice(cashStart, cashEnd), {
  document, Blob,
  URL: { createObjectURL(blob) { exportedBlob = blob; return 'blob:test'; }, revokeObjectURL() {} },
  window: { BNTChartFilter: { close() { closeCount += 1; } }, setTimeout(callback) { callback(); } }
});

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
assert.equal(weeklyPlans.reduce((sum, match) => sum + Number(match[1]), 0), 68000000);
assert.equal(weeklyFacts.reduce((sum, match) => sum + Number(match[1]), 0), 71000000);
exportButton.events.click();
assert.equal(download, 'cash-flow-2026-02-weeks.csv');
assert.equal((await exportedBlob.text()).split('\n').length, 6);

reset.events.click();
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
console.log('Cash Flow and finance pills: monthly drill-down, totals, reset, keyboard, CSV, shared drawer close and individual pill removal passed.');
