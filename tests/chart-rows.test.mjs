import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rowClasses = [
  'origin-breakdown__row', 'payment-deviation-chart__row',
  'procurement-plan-fact-chart__row', 'procurement-budget-deviation-chart__row',
  'procurement-stock-chart__row', 'procurement-turnover-bar-chart__row',
  'analytics-capacity-chart__row'
];
const cssFiles = [
  '../assets/css/components.css', '../assets/css/pages/budget-payments.css',
  '../assets/css/pages/analytics-v91.css'
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
  const rowsClass = className.replace(/__row$/, '__rows');
  const rowsSelector = new RegExp(`\\.${rowsClass}(?=\\s*(?:,|$))`);
  const rowsRules = allRules.filter(rule => rowsSelector.test(rule.selector));
  assert.ok(rowsRules.some(rule => /grid-auto-rows:\s*max-content;/.test(rule.body)), `${rowsClass} does not stretch rows`);
}
for (const file of ['../assets/js/pages/procurement.js', '../assets/js/pages/analytics.js']) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  assert.doesNotMatch(source, /class="[^"]*chart__(?:rows|body)"\s+style="[^"]*height:/, `${file} has no inline chart height`);
}
const components = await readFile(new URL('../assets/css/components.css', import.meta.url), 'utf8');
assert.match(components, /--quality-detail-drawer-card-max-height: 420px;/);
console.log('Chart rows: shared padding, intrinsic height, content-sized grid tracks and drawer limits passed.');
