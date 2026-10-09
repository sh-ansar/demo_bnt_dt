import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const css = await read('assets/css/components.css');
const shell = await read('assets/css/shell-v91.css');
const tokens = await read('assets/css/tokens.css');
const rule = selector => css.match(new RegExp(`(?:^|\\n)${selector}\\s*\\{([^}]+)\\}`))?.[1];

const overlayValues = role => [...tokens.matchAll(new RegExp(`--system-elements-overlay-${role}:\\s*([^;]+);`, 'g'))].map(match => match[1]);
assert.deepEqual(overlayValues('primary'), ['rgb(0 34 51 / 80%)', 'rgb(229 246 255 / 80%)']);
assert.deepEqual(overlayValues('tertiary'), ['rgb(5 28 39 / 18%)', 'rgb(5 28 39 / 18%)']);
assert.match(rule('\\.filter-modal'), /background: var\(--system-elements-overlay-tertiary\);/, 'The shared drawer retains its approved 18% backdrop in both themes');
assert.doesNotMatch(css, /var\(--system-elements-overlay-primary\)/, 'The guideline primary overlay must not recolor the drawer backdrop');

const sidebarSurface = shell.match(/body > \.app-shell > \.app-sidebar\s*\{([^}]+)\}/)?.[1];
assert.ok(sidebarSurface);
assert.doesNotMatch(sidebarSurface, /clip-path:|mask-image:/, 'The outer sidebar shadow must not be clipped');
assert.match(sidebarSurface, /box-shadow: var\(--elevation-2\) !important;/);
assert.doesNotMatch(shell, /\.app-sidebar #shell-navigation\s*\{/, 'The ineffective navigation clipping workaround is removed');
assert.match(sidebarSurface, /backdrop-filter: var\(--backdrop-blur-elevation\) !important;/);
assert.match(sidebarSurface, /background: var\(--background-nonoverlay-2\) !important;/);
assert.match(shell, /\.app-sidebar \.nav-link:hover\s*\{[^}]*background: var\(--interaction-hover-modifier-light-upd\) !important;/, 'Navigation hover retains the shared color token');

assert.doesNotMatch(css, /\.page-content[^{}]*\{[^}]*mask-image:/, 'No content mask workaround remains after removing card blur');
assert.match(shell, /#page-content\s*\{[^}]*background: var\(--background-page\) !important;/);
assert.doesNotMatch(css, /(?:#page-content|\.page-content:has\(\.data-block\))\s*\{[^}]*mask-image:/, 'Page-level overlay portals must stay outside the masked content');

const liveDot = rule('\\.live-dot');
assert.match(liveDot, /box-sizing: border-box;/);
assert.match(liveDot, /flex: none;/);
for (const dimension of ['width', 'height']) {
  assert.ok(liveDot.includes(`${dimension}: calc(var(--live-dot-size, var(--space-2)) + var(--space-1) * 2);`), 'The halo is included in the indicator box');
}
assert.match(liveDot, /border: var\(--space-1\) solid var\(--system-elements-semantic-positive-secondary-fade\);/);
assert.match(liveDot, /background: var\(--system-elements-semantic-positive-primary\);/);
assert.match(liveDot, /background-clip: padding-box;/, 'The solid center does not fill under the translucent halo');
assert.match(liveDot, /box-shadow: none;/, 'The indicator does not paint a halo outside the masked bounds');
assert.match(rule('\\.live-line'), /gap: var\(--space-2\);/);
assert.doesNotMatch(await read('assets/css/layout.css'), /\.live-(?:dot|line)\s*\{/, 'The component has one shared definition');
assert.match(shell, /\.app-sidebar \.live-dot\s*\{\s*--live-dot-size: clamp\(8px, \.555556vw, 10\.666667px\);\s*\}/, 'The sidebar only supplies its existing center size');
const twinCss = await read('assets/css/pages/dispatcher-3d.css');
assert.match(twinCss, /\.dt3-focus-line__dot\s*\{[^}]*width: 8px;[^}]*height: 8px;[^}]*border: 1px solid transparent;/, 'The specialised twin indicator retains its geometry');

const surface = rule('\\.data-block,\\s*\\.table-block');
const chart = rule('\\.chart-card');
for (const body of [surface, chart]) {
  assert.ok(body);
  assert.match(body, /background: var\(--background-surface-4\);/);
  assert.match(body, /border: 1px solid var\(--design-elements-border-default\);/);
  assert.match(body, /box-shadow: var\(--card-shadow\);/);
  assert.doesNotMatch(body, /backdrop-filter:/, 'Cards do not sample the navigation backdrop');
}
const cardStates = [...css.matchAll(/:where\(([^{}]+)\)(:hover)?\s*\{([^}]*--card-shadow:[^}]+)\}/g)];
assert.equal(cardStates.length, 1, 'Cards have one stable shadow state, without a hover override');
assert.match(cardStates[0][3], /--card-shadow: var\(--shadow-raised\);/);
assert.equal(cardStates[0][2], undefined);
assert.doesNotMatch(css, /--card-shadow: var\(--shadow-primary\)/, 'Hover does not restore the stronger primary shadow');
for (const selector of ['.card', '.chart-card', '.card-with-image', '.payment-summary-card', '.canvas-block', '.scenario-impact > div', '.metrics-grid > div', '.metric-card', '.pier-card']) {
  assert.ok(cardStates[0][1].split(', ').includes(selector), `${selector}: uses the shared raised shadow`);
}
assert.doesNotMatch(cardStates[0][3], /transform:|background:|opacity:|transition:/, 'The stable shadow adds no hover animation or geometry changes');
for (const selector of ['\\.badge', '\\.card-with-image', '\\.quality-detail-drawer-card', '\\.egpz-summary', '\\.dt3-metrics\\.scenario-impact > div,\\s*\\.metrics-grid > div']) {
  assert.doesNotMatch(rule(selector), /backdrop-filter:/, `${selector}: no blur on cards or badges`);
}
assert.match(rule('\\.badge'), /box-shadow: var\(--shadow-raised\);/, 'Badge shadow stays unchanged');
assert.match(rule('\\.payment-risk-map__chart-card'), /box-shadow: none;/, 'A frameless nested chart stays frameless on hover');
assert.match(chart, /padding: var\(--space-3\);/);
assert.match(chart, /gap: var\(--space-3\);/);
const chartBody = rule('\\.chart-card > \\.card-with-image__body');
for (const property of ['margin-top: 0;', 'padding: 0;', 'border-radius: 0;', 'background: transparent;']) assert.ok(chartBody.includes(property), property);
assert.doesNotMatch(chartBody, /font-|line-height:|gap:|color:/, 'Chart composition removes only duplicate inset and surface, preserving the master text styles');
assert.match(rule('\\.card-with-image__body'), /gap: var\(--space-2\);/);
assert.match(rule('\\.card-with-image__heading'), /gap: 0;/);
assert.match(rule('\\.card-with-image__eyebrow'), /color: var\(--background-brand-solid\);/);
assert.match(rule('\\.card-with-image__title'), /color: var\(--text-primary\);/);
assert.match(rule('\\.card-with-image__description'), /color: var\(--text-tertiary\);/);

const nested = rule('\\.data-block :is\\(\\.table-block, \\.chart-card\\)');
assert.match(nested, /background: transparent;/);
assert.match(nested, /backdrop-filter: none;/);
assert.ok(css.indexOf(nested) > css.indexOf(chart), 'The shared composition rule follows the base chart surface');
const wrapper = rule('\\.data-block > \\.card-body');
for (const property of ['padding: 0;', 'border: 0;', 'background: transparent;', 'box-shadow: none;', 'backdrop-filter: none;']) assert.ok(wrapper.includes(property), property);
const analyticsCss = await read('assets/css/pages/analytics-v91.css');
assert.doesNotMatch(analyticsCss.match(/\.analytics-page \.scenario-panel \.card-body\s*\{[^}]*\}/)[0], /padding:/, 'The scenario wrapper does not add a second space-3 inset');
assert.match(rule('\\.data-block'), /padding: var\(--space-3\);/);
const chartTransparency = css.match(/\.chart-bars \.chart-bars__segment,[^]*?\{\s*background: transparent;\s*\}/)?.[0];
assert.ok(chartTransparency);
for (const selector of ['.chart-bars,', '.chart-viewport__plot,', 'svg [class*="series-"]', ':is(.chart-viewport, .chart-donut__viewport, .financial-chart__viewport)']) assert.ok(chartTransparency.includes(selector), `${selector}: no second background fill`);
for (const tone of ['primary', 'secondary', 'positive', 'warning', 'negative', 'purple']) {
  const token = tokens.match(new RegExp(`--chart-series-${tone}:\\s*([^;]+);`))[1];
  assert.equal(token, `color-mix(in srgb, var(--chart-color-${tone}) 70%, transparent)`, `${tone}: preserve the token's alpha instead of introducing local opacity`);
  assert.equal((tokens.match(new RegExp(`--chart-series-${tone}:`, 'g')) || []).length, 1, `${tone}: both themes share the chart palette`);
}

const head = rule('\\.data-table th,\\s*\\.analytics-table th');
const hover = rule('\\.data-table tbody tr:hover td,\\s*\\.analytics-table tbody tr:hover td');
assert.match(head, /background: var\(--background-secondary\);/);
assert.match(hover, /background: var\(--interaction-bg-hover-modifier-light\);/);
assert.doesNotMatch(shell, /body\[data-theme="dark"\] \.data-table/);
assert.doesNotMatch(shell, /body\[data-theme="dark"\] \.card\s*[,\{]/);
assert.match(shell, /body\[data-theme="dark"\] \.card:where\(:not\(\.data-block, \.table-block, \.chart-card\)\)/);

for (const [theme, secondary, quaternary] of [
  ['light', '#f8fafb', 'rgba(255, 255, 255, .8)'],
  ['dark', '#092634', 'rgba(112, 184, 219, .05)']
]) {
  const palette = tokens.match(theme === 'light' ? /:root\s*\{([^}]+)\}/ : /:root\[data-theme="dark"\]\s*\{([^}]+)\}/)[1];
  assert.ok(palette.includes(`--background-secondary: ${secondary};`), `${theme}: semantic header background`);
  assert.ok(palette.includes(`--background-quarternary: ${quaternary};`), `${theme}: corporate raised surface`);
  assert.match(palette, /--background-surface-4: var\(--background-quarternary\);/);
  assert.match(palette, /--background-page: var\(--background-secondary\);/, `${theme}: opaque themed backdrop and mask`);
  assert.doesNotMatch(css, new RegExp(`(?:body|:root)\\[data-theme="${theme}"\\][^{}]*(?:chart-card|table-block|data-table)[^{}]*\\{[^}]*background:`));
}

let componentVersion, shellVersion;
for (const page of (await readdir(new URL('../', import.meta.url))).filter(name => name.endsWith('.html'))) {
  const html = await read(page);
  for (const [asset, saved] of [['components', componentVersion], ['shell-v91', shellVersion]]) {
    const version = html.match(new RegExp(`${asset}\\.css\\?v=(\\d+)`))?.[1];
    if (!version) continue;
    if (asset === 'components') componentVersion ??= version;
    else shellVersion ??= version;
    assert.equal(version, saved ?? version, `${page}: shared ${asset} version`);
  }
}
assert.ok(componentVersion && shellVersion);
for (const page of ['reports.html', 'builder.html']) {
  const html = await read(page);
  assert.match(html, /<div id="app"><\/div>[\s\S]*<div id="modal-root"><\/div>/, `${page}: drawers remain outside the report content wrapper`);
}
const procurement = await read('procurement.html');
const procurementContent = procurement.match(/<main\b[^>]*id="page-content"[^>]*>([\s\S]*?)<\/main>/)?.[1];
assert.ok(procurementContent);
assert.match(procurementContent, /^\s*<div class="content-block">/);
assert.match(procurementContent, /<section[^>]*class="content-block"/);
assert.match(procurementContent, /class="chart-card(?: |")/);
assert.match(procurementContent, /class="card table-block(?: |")/);
assert.doesNotMatch(procurementContent, /class="filter-modal(?: |")|id="modal-root"/, 'Procurement overlays stay outside the masked content');
for (const id of ['egpz-filter-modal', 'procurement-filter-modal', 'procurement-purchase-drawer']) {
  assert.match(procurement.slice(procurement.indexOf('</main>')), new RegExp(`<div id="${id}" class="filter-modal"`), `${id}: full-screen drawer outside the page content`);
}
console.log('Component surfaces: no card/badge blur, stable raised shadow without primary hover, preserved sidebar and overlay shadows, semantic backgrounds, nested composition, and synchronized versions passed. Browser rendering excluded.');
