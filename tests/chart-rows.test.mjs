import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rowClasses = [
  'origin-breakdown__row', 'payment-deviation-chart__row',
  'procurement-plan-fact-chart__row', 'procurement-budget-deviation-chart__row',
  'procurement-stock-chart__row', 'procurement-turnover-bar-chart__row',
  'analytics-capacity-chart__row', 'logistics-bar-row'
];
const cssFiles = [
  '../assets/css/components.css', '../assets/css/pages/budget-payments.css',
  '../assets/css/pages/analytics-v91.css', '../assets/css/pages/operations.css'
];
const allRules = [];
for (const file of cssFiles) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  allRules.push(...[...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(match => ({ file, selector: match[1].trim(), body: match[2] })));
}
for (const className of rowClasses) {
  const selector = new RegExp(`\\.${className}(?=\\s*(?:,|$))`);
  const rules = allRules.filter(rule => selector.test(rule.selector));
  assert.ok(rules.length, `${className} has component rules`);
  assert.ok(rules.some(rule => /padding-block:\s*var\(--space-3\);/.test(rule.body)), `${className} has shared padding`);
  assert.ok(rules.some(rule => /height:\s*auto;/.test(rule.body)), `${className} hugs content`);
  for (const rule of rules) {
    const height = rule.body.match(/(?:^|;)\s*height:\s*([^;]+);/)?.[1].trim();
    const minHeight = rule.body.match(/(?:^|;)\s*min-height:\s*([^;]+);/)?.[1].trim();
    if (height !== undefined) assert.equal(height, 'auto', `${className} has no fixed height in ${rule.file}`);
    if (minHeight !== undefined) assert.equal(minHeight, '0', `${className} has no minimum height in ${rule.file}`);
  }
  const rowsClass = className === 'logistics-bar-row' ? 'logistics-bar-rows' : className.replace(/__row$/, '__rows');
  const rowsSelector = new RegExp(`\\.${rowsClass}(?=\\s*(?:,|$))`);
  const rowsRules = allRules.filter(rule => rowsSelector.test(rule.selector));
  assert.ok(rowsRules.some(rule => /grid-auto-rows:\s*max-content;/.test(rule.body)), `${rowsClass} does not stretch rows`);
}
for (const file of ['../assets/js/pages/procurement.js', '../assets/js/pages/analytics.js']) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  assert.doesNotMatch(source, /class="[^"]*chart__(?:rows|body)"\s+style="[^"]*height:/, `${file} has no inline chart height`);
}
const components = await readFile(new URL('../assets/css/components.css', import.meta.url), 'utf8');
for (const selector of ['.chart-bars [tabindex]', '.chart-donut [tabindex]', '.financial-chart__viewport svg [tabindex]']) {
  const rules = allRules.filter(rule => rule.file === '../assets/css/components.css'
    && rule.selector.split(',').some(item => item.trim() === selector));
  assert.ok(rules.some(rule => /outline:\s*0;/.test(rule.body)), `${selector} suppresses native focus outlines even after pointer leave`);
}
assert.match(components, /--quality-detail-drawer-card-max-height: 420px;/);
assert.match(components, /\.chart-card\s*\{[^}]*--chart-card-max-height: \d+px;[^}]*box-sizing: border-box;[^}]*max-height: var\(--chart-card-max-height\);/);
assert.match(components, /\.chart-viewport__plot\s*\{[^}]*min-height: 0;[^}]*overflow: auto;/);
const tracks = ['payment-deviation-chart__track', 'procurement-plan-fact-chart__track',
  'procurement-budget-deviation-chart__range', 'procurement-stock-chart__track',
  'procurement-turnover-bar-chart__track', 'origin-breakdown__bar',
  'analytics-capacity-chart__track', 'logistics-bar-row__track'];
for (const className of tracks) {
  const selector = new RegExp(`\\.${className}(?=\\s*(?:,|$))`);
  const heights = allRules.filter(rule => selector.test(rule.selector))
    .map(rule => rule.body.match(/(?:^|;)\s*height:\s*([^;]+);/)?.[1].trim()).filter(Boolean);
  assert.ok(heights.length, `${className} has a track height`);
  assert.ok(heights.every(height => height === 'var(--space-4)'), `${className} uses space-4 everywhere`);
}
for (const file of ['department-performance.js', 'pages/budget-payments.js', 'pages/contracts.js', 'pages/procurement.js', 'pages/analytics.js']) {
  const source = await readFile(new URL(`../assets/js/${file}`, import.meta.url), 'utf8');
  assert.doesNotMatch(source, /class="chart-scrollbar" style="max-height:/, `${file} has no local scroll limit`);
  const bodies = [...source.matchAll(/<div class="([\w-]+-chart)__body">/g)];
  for (const body of bodies) {
    const prefix = source.slice(0, body.index);
    assert.match(prefix, /<div class="chart-viewport__plot chart-scrollbar">\s*$/, `${file}: ${body[1]} keeps the axis outside the plot scroller`);
  }
}
console.log('Chart rows: space-4 tracks, shared padding, intrinsic height, fixed axes, card and drawer limits passed.');
