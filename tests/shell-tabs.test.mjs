import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const css = (await readFile(new URL('../assets/css/shell-v91.css', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const tokens = await readFile(new URL('../assets/css/tokens.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../assets/js/shell.js', import.meta.url), 'utf8');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({
  selector: match[1].trim(), body: match[2]
}));
const rule = selector => rules.find(item => item.selector === selector)?.body;
assert.match(rule('.app-topbar .shell-sections'), /--shell-section-radius: var\(--space-4\);/);
assert.match(tokens, /--space-4: 16px;/);
assert.match(rule('.app-topbar .shell-section'), /border-radius: var\(--shell-section-radius\) var\(--shell-section-radius\) 0 0 !important;/);
assert.match(rule('.app-topbar .shell-section'), /height: clamp\(44px, 3\.055556vw, 58\.666667px\) !important;/);
const corners = rule('.app-topbar .shell-section:is(.active, :hover)::before,\n.app-topbar .shell-section:is(.active, :hover)::after');
assert.ok(corners);
assert.match(corners, /bottom: 0 !important;/);
assert.match(corners, /width: var\(--shell-section-radius\) !important;/);
assert.match(corners, /height: var\(--shell-section-radius\) !important;/);
assert.match(corners, /pointer-events: none !important;/);
for (const [side, edge, corner] of [['before', 'right', 'left'], ['after', 'left', 'right']]) {
  const body = rule(`.app-topbar .shell-section:is(.active, :hover)::${side}`);
  assert.match(body, new RegExp(`${edge}: 100% !important;`));
  assert.ok(body.includes(`radial-gradient(circle var(--shell-section-radius) at top ${corner}, transparent 100%, var(--shell-section-background) 100%)`));
}
assert.match(rule('.app-topbar .shell-section.active'), /clip-path: inset\(-24px -24px 0 -24px\) !important;/);
assert.match(rule('.app-topbar .shell-section.active'), /--shell-section-background: var\(--background-page\);/);
assert.match(rule('.app-topbar .shell-section.active'), /z-index: 2 !important;/);
assert.match(rule('.app-topbar .shell-section:not(.active):hover'), /--shell-section-background: var\(--interaction-bg-hover-modifier-light\);/);
for (const selector of ['.app-topbar .shell-section', '.app-topbar .shell-section.active', '.app-topbar .shell-section:not(.active):hover']) {
  assert.match(rule(selector), /background: var\(--shell-section-background\) !important;/);
}
assert.match(js, /role="tab" aria-controls="shell-navigation" aria-selected=/);
assert.match(css, /@media \(max-width: 959px\)[\s\S]*\.app-topbar \.shell-sections,\s*\.app-topbar \.topbar-tools\s*\{\s*display: none !important;/);

let version;
for (const page of (await readdir(new URL('../', import.meta.url))).filter(name => name.endsWith('.html'))) {
  const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
  const match = html.match(/shell-v91\.css\?v=(\d+)/);
  if (!match) continue;
  version ??= match[1];
  assert.equal(match[1], version, `${page}: shared shell version`);
}
assert.ok(version);
console.log('Shell tabs: token-based rounded tops, active and hover concave corners, theme colors, stacking, stable sizing, click-through, mobile layout and cache versions passed.');
