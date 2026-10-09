import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const css = await read('assets/css/components.css');
const tokens = await read('assets/css/tokens.css');
const rule = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(match, `Missing CSS rule: ${selector}`);
  return match[1];
};

for (const selector of ['.button-small--secondary', '.button-smallest-secondary-radius']) {
  const body = rule(selector);
  assert.match(body, /background: var\(--background-surface-4\);/);
  assert.match(body, /border(?:-color)?: (?:1px solid )?var\(--design-elements-border-default\);/);
  assert.match(body, /box-shadow: var\(--shadow-raised\);/);
  assert.match(body, /backdrop-filter: blur\(20px\);/);
  assert.doesNotMatch(body, /rgba?\(|#[\da-f]+/i);
}
assert.doesNotMatch(css, /--blue-760-5/);
assert.match(tokens, /--shadow-raised: 0 2px 4px rgba\(56, 83, 97, \.05\);/);
assert.match(tokens, /--interaction-bg-hover-modifier-light: rgba\(35, 142, 195, \.06\);/);
assert.match(tokens, /--interaction-bg-hover-modifier-light: rgba\(147, 206, 224, \.06\);/);

const hoverSelector = '.button-small--secondary:hover:not(:disabled):not([aria-disabled="true"]),\n.button-smallest-secondary-radius:hover:not(:disabled):not([aria-disabled="true"])';
const hover = rule(hoverSelector);
assert.match(hover, /background-image: linear-gradient\(var\(--interaction-bg-hover-modifier-light\), var\(--interaction-bg-hover-modifier-light\)\);/);
assert.doesNotMatch(hover, /(?:^|\s)(?:background|color|border|opacity|transform|padding|height|width):/);
assert.match(rule('.button-small--secondary:hover::before'), /opacity: 0;/);
assert.match(rule('.button-smallest-secondary-radius--error'), /background: var\(--system-elements-semantic-error-secondary-fade\);/);
assert.match(rule('.button-small'), /height: 40px;/);
assert.match(rule('.button-smallest-secondary-radius--icon'), /width: 36px;\s*height: 36px;/);

const pages = (await readdir(new URL('../', import.meta.url))).filter(name => name.endsWith('.html'));
pages.push('legacy/report-studio-v5/index.html');
for (const page of pages) {
  const html = await read(page);
  if (html.includes('assets/css/components.css')) assert.match(html, /components\.css\?v=336/, `${page}: shared secondary cache version`);
}
console.log('Secondary buttons: shared raised shadow, token overlay hover, retained base and semantic surfaces, no disabled hover, unchanged geometry and synchronized versions. Browser pixels excluded.');
