import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const tokens = await read('assets/css/tokens.css');
const values = name => [...tokens.matchAll(new RegExp('--' + name + ':\\s*([^;]+);', 'g'))].map(match => match[1].trim());
assert.deepEqual(values('system-elements-semantic-positive-secondary-fade'), ['var(--operational-card-positive-fill)', 'rgba(18, 161, 49, .24)']);
assert.deepEqual(values('system-elements-semantic-error-secondary-fade'), ['#fde8e8', 'rgba(208, 23, 23, .2)']);
assert.deepEqual(values('operational-card-positive-fill'), ['#e2f1e7', '#18382b']);
assert.deepEqual(values('system-elements-semantic-positive-fade'), ['var(--operational-card-positive-fill)', '#e2f1e7']);
assert.deepEqual(values('system-elements-semantic-neutral-fade'), ['var(--operational-card-neutral-fill)', 'rgb(229 246 255 / 80%)']);
assert.deepEqual(values('operational-card-neutral-fill'), ['#e5f6ff', '#16384a']);
assert.deepEqual(values('typography-indicator-small-size'), ['clamp(10px, .666667vw, 12.8px)']);
assert.deepEqual(values('system-elements-semantic-positive-primary'), ['var(--system-elements-semantic-success-primary)', 'var(--system-elements-semantic-success-primary)']);
const guide = await read('docs/corporate-ui-guidelines.md');
assert.ok(guide.includes('| secondary fade | `#12A131` @ `24%` |'));
assert.ok(guide.includes('| secondary fade | `#D01717` @ `20%` |'));
console.log('Dark semantic fades: approved secondary alpha and ordinary fades, Light, operational fills and Indicator Small preserved.');
