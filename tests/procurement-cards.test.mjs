import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/pages/procurement.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/components.css', import.meta.url), 'utf8');
const enterprise = await readFile(new URL('../assets/css/pages/enterprise.css', import.meta.url), 'utf8');
assert.doesNotMatch(source + enterprise, /financial-kpi/);

const kpiRoot = { innerHTML: '' };
const evidenceRoot = { innerHTML: '' };
const ringCalls = [];
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const context = vm.createContext({
  window: {}, kpiRoot, evidenceRoot, escape,
  ui: { progressRing(options) {
    ringCalls.push(options);
    return `<span class="payment-progress-ring" data-percent="${options.percent}"></span>`;
  } }
});
vm.runInContext(await readFile(new URL('../assets/js/data/procurement.js', import.meta.url), 'utf8'), context);
vm.runInContext('const data = window.BNT_DATA.procurement;', context);
const evidenceStart = source.indexOf('  const procurementEvidenceCards =');
const evidenceEnd = source.indexOf('  const escape =', evidenceStart);
const helpersStart = source.indexOf('  function kpiArrow(');
const helpersEnd = source.indexOf('  function numberContent(', helpersStart);
const renderStart = source.indexOf('  function render() {');
const renderEnd = source.indexOf('    rowsRoot.innerHTML =', renderStart);
assert.ok(evidenceStart >= 0 && evidenceEnd > evidenceStart);
assert.ok(helpersStart >= 0 && helpersEnd > helpersStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart);
vm.runInContext(source.slice(evidenceStart, evidenceEnd)
  + source.slice(helpersStart, helpersEnd)
  + source.slice(renderStart, renderEnd) + '\n  }\nrender();', context);

const cards = [...kpiRoot.innerHTML.matchAll(/<article class="([^"]+)">([\s\S]*?)<\/article>/g)];
assert.equal(cards.length, 4);
for (const [, classes, markup] of cards.filter(card => card[1] === 'analytics-kpi')) {
  assert.equal(classes, 'analytics-kpi');
  assert.match(markup, /class="analytics-kpi__heading"/);
  assert.match(markup, /class="analytics-kpi__label typography-body-smallest"/);
  assert.match(markup, /class="kpi-card__body"/);
  assert.match(markup, /class="analytics-kpi__value typography-label-base/);
  assert.match(markup, /class="analytics-kpi__context typography-body-smallest"/);
  assert.match(markup, /href="#procurement-stock-need"/);
}
assert.match(cards[0][2], /typography-label-base is-negative">18 400 USD/);
assert.match(cards[1][2], /typography-label-base is-negative/);
assert.equal(cards.filter(card => card[1] === 'analytics-kpi').length, 3);
assert.equal(cards[2][1], 'payment-summary-card payment-summary-card--warning');
for (const part of ['heading', 'title', 'content', 'copy', 'amount', 'description']) {
  assert.match(cards[2][2], new RegExp(`class="payment-summary-card__${part}(?: |")`));
}
assert.match(cards[2][2], /href="#procurement-stock-need"/);
assert.equal(ringCalls.length, 3);
const data = context.window.BNT_DATA.procurement;
const coverage = Math.round(data.parts.reduce((sum, part) => sum + Math.min(1, part.stock / part.min), 0) / data.parts.length * 100);
assert.equal(ringCalls[2].percent, coverage);
assert.equal(ringCalls[0].percent, 6);
assert.equal(ringCalls[1].percent, 94);
assert.equal((evidenceRoot.innerHTML.match(/<article class="analytics-kpi">/g) || []).length, 2);
assert.equal((evidenceRoot.innerHTML.match(/<article class="payment-summary-card/g) || []).length, 2);
assert.match(vm.runInContext("renderKpi({label: 'A & B', value: '<5', context: 'C > D'})", context), /A &amp; B[\s\S]*&lt;5[\s\S]*C &gt; D/);

assert.doesNotMatch(css + source, /analytics-kpi--with-ring|analytics-kpi--warning|kpi-card__copy|renderEvidenceKpi/);
assert.match(css, /\.payment-summary-card\s*\{[^}]*--payment-progress-ring-size: clamp\(52px, 3\.611111vw, 69px\);/);
assert.match(css, /\.payment-summary-card__content\s*\{[^}]*grid-template-columns: var\(--payment-progress-ring-size, 52px\) minmax\(0, 1fr\);/);
const riskRule = css.match(/\.payment-risk-map\s*\{([^}]+)\}/)?.[1];
assert.ok(riskRule);
assert.match(riskRule, /--chart-card-max-height: none;/);
assert.match(riskRule, /height: auto;/);
assert.match(riskRule, /align-self: start;/);
assert.match(css, /\.chart-card\s*\{[^}]*--chart-card-max-height: \d+px;[^}]*max-height: var\(--chart-card-max-height\);/);
const scrollingChildren = css.match(/\.chart-card > :is\(([^)]+)\)\s*\{[^}]*overflow: auto;/)?.[1];
assert.ok(scrollingChildren);
assert.doesNotMatch(scrollingChildren, /payment-risk-map/);
assert.match(css, /\.chart-card > \*\s*\{[^}]*flex-shrink: 0;/);
assert.match(css, /\.payment-risk-map__scroller\s*\{[^}]*overflow-y: auto;/);

const html = await readFile(new URL('../procurement.html', import.meta.url), 'utf8');
assert.equal((html.match(/class="chart-card chart-card--wide payment-risk-map risk-map-left"/g) || []).length, 2);
const componentsVersion = html.match(/components\.css\?v=(\d+)/)[1];
const enterpriseVersion = html.match(/pages\/enterprise\.css\?v=(\d+)/)[1];
for (const page of (await readdir(new URL('../', import.meta.url))).filter(name => name.endsWith('.html'))) {
  const pageHtml = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
  const componentMatch = pageHtml.match(/components\.css\?v=(\d+)/);
  const enterpriseMatch = pageHtml.match(/pages\/enterprise\.css\?v=(\d+)/);
  if (componentMatch) assert.equal(componentMatch[1], componentsVersion, `${page}: shared component version`);
  if (enterpriseMatch) assert.equal(enterpriseMatch[1], enterpriseVersion, `${page}: shared layout version`);
}
console.log('Procurement cards: shared analytics KPI markup, progress, values, tones, actions, intrinsic risk-map height and cache versions passed.');
