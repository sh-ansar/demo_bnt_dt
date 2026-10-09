import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const css = await read('assets/css/pages/dispatcher-3d.css');
for (const [product, tone] of [['gas', 'neutral'], ['diesel', 'mustard'], ['gasoline', 'turquoise'], ['oil', 'purple']]) {
  assert.ok(css.includes('--dt3-product-' + product + ': var(--system-elements-semantic-' + tone + '-primary);'));
}
const rule = tone => css.match(new RegExp('\\.dt3-focus-line\\[data-focus-tone="' + tone + '"\\] \\.dt3-focus-line__dot\\s*\\{([^}]+)\\}'))[1];
for (const tone of ['warning', 'error']) {
  assert.ok(rule(tone).includes('--dt3-focus-dot: var(--system-elements-semantic-' + tone + '-primary);'));
  assert.ok(rule(tone).includes('--dt3-focus-dot-shadow: var(--system-elements-semantic-' + tone + '-secondary-fade);'));
}
assert.match(rule('mixed'), /--dt3-focus-dot: var\(--text-tertiary\)/);
assert.match(rule('mixed'), /--dt3-focus-dot-shadow: var\(--background-surface-4\)/);
assert.match(rule('mixed'), /border-color: var\(--design-elements-border-default\)/);
assert.doesNotMatch(css, /#29AAE1|#FFB228|#55C98C|#A782EF|--dt3-focus-dot-shadow: rgba/i);
const tokens = await read('assets/css/tokens.css');
for (const tone of ['neutral', 'mustard', 'turquoise', 'purple', 'warning', 'error']) {
  assert.equal((tokens.match(new RegExp('--system-elements-semantic-' + tone + '-primary:', 'g')) || []).length, 2);
}
assert.match(await read('digital-twin.html'), /dispatcher-3d\.css\?v=10051/);
assert.match(await read('equipment-detail.html'), /equipment-detail\.js\?v=13/);
console.log('Digital twin UI colors: approved product roles, themed warning/error/default risk indicators, no local RGB, synchronized versions. Physical 3D materials unchanged; browser pixels excluded.');
