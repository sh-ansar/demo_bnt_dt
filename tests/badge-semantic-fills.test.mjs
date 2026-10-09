import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css = await readFile(new URL('../assets/css/components.css', import.meta.url), 'utf8');
const rule = selector => css.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]+)\\}'))?.[1];
assert.match(rule('.badge'), /background: var\(--system-elements-semantic-neutral-secondary-fade\);/);
for (const [variant, tone] of [['neutral', 'neutral'], ['green', 'positive'], ['orange', 'warning'], ['red', 'error'], ['purple', 'purple'], ['mustard', 'mustard'], ['turquoise', 'turquoise']]) {
  assert.ok(rule('.badge.' + variant)?.includes('background: var(--system-elements-semantic-' + tone + '-secondary-fade);'));
  assert.ok(rule('.badge.' + variant)?.includes('color: var(--system-elements-semantic-' + tone + '-primary);'));
}
assert.match(rule('.badge.default'), /background: var\(--background-surface-4\);/);
assert.match(rule('.badge.default'), /border: 1px solid var\(--design-elements-border-default\);/);
for (const match of css.matchAll(/[^{}]*\.badge[^{}]*\{([^{}]*)\}/g)) {
  assert.doesNotMatch(match[1], /background:\s*var\(--system-elements-semantic-[a-z]+-fade\)/);
}
console.log('Badge fills: all semantic variants use secondary-fade; Default surface preserved.');
