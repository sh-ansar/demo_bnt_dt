import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const tokens = await read('assets/css/tokens.css');
const primary = [...tokens.matchAll(/--text-primary:\s*([^;]+);/g)].map(match => match[1].trim());
assert.deepEqual(primary, ['#093044', 'rgba(255, 255, 255, .9)']);
assert.match(tokens, /--ink:\s*var\(--text-primary\)/);
const legacy = await read('legacy/report-studio-v5/styles.css');
assert.match(legacy, /body:not\(\[data-page\]\)\{[^}]*--text:var\(--text-primary\)/);
assert.match(legacy, /body\[data-page\]\{--text:var\(--text-primary\)/);
const guide = await read('docs/corporate-ui-guidelines.md');
assert.ok(guide.includes('#093044'));
assert.ok(guide.includes('rgba(255, 255, 255, 0.9)'));
console.log('Primary text: approved Light and Dark tokens, shared alias and standalone report studio passed.');
