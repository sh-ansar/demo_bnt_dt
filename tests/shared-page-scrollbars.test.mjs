import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const twin = await read('digital-twin.html');
const payments = await read('budget-payments.html');
const twinCss = await read('assets/css/pages/dispatcher-3d.css');
const paymentCss = await read('assets/css/pages/budget-payments.css');
const components = await read('assets/css/components.css');

assert.match(twin, /<main id="page-content" class="page-content flush ui-scrollbar">/);
assert.match(payments, /class="payment-risk-map__scroller chart-scrollbar"[^>]*tabindex="0"/);
for (const css of [twinCss, paymentCss]) {
  assert.doesNotMatch(css, /scrollbar-(?:width|color)\s*:|::-webkit-scrollbar/);
}
assert.match(twinCss, /@media \(max-width: 800px\)\s*\{\s*body\[data-page="dispatcher"\] #page-content\.page-content\.flush\s*\{\s*overflow-y: auto;/);
assert.match(paymentCss, /\.payment-risk-map__scroller\s*\{[^}]*overflow-y: auto;/);
for (const selector of ['.ui-scrollbar', '.chart-scrollbar']) {
  assert.ok(components.includes(selector + '::-webkit-scrollbar,' ) || components.includes(selector + '::-webkit-scrollbar {'));
  assert.ok(components.includes(selector + '::-webkit-scrollbar-thumb'));
}
assert.match(twin, /dispatcher-3d\.css\?v=10051/);
assert.match(payments, /budget-payments\.css\?v=21/);
console.log('Shared page scrollbars: twin and payments passed.');
