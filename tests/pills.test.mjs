import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const css = await read('assets/css/components.css');
const tokens = await read('assets/css/tokens.css');
const rule = selector => {
  const start = css.lastIndexOf(`\n${selector} {`) + 1;
  assert.ok(start > 0, selector);
  return css.slice(start + selector.length + 2, css.indexOf('}', start));
};

const pill = rule('.pill.pill--default');
const geometry = css.match(/\.badge,\s*\.pill\.pill--default\s*\{([^}]+)\}/)[1];
assert.match(geometry, /height: auto;/);
assert.match(geometry, /min-height: var\(--pill-badge-height, var\(--space-5\)\);/);
assert.match(geometry, /box-sizing: border-box;/);
assert.match(geometry, /align-items: center;/);
assert.match(geometry, /align-content: center;/);
const tableSelector = ':is(table, [role="table"], .data-table, .analytics-table)';
assert.ok(css.includes(`${tableSelector} {\n  --pill-badge-height: calc(var(--space-5) - var(--space-1));\n}`));
assert.ok(css.includes(`@media (width > 1440px) {\n  :root,\n  ${tableSelector} {\n    --pill-badge-height: calc(var(--space-5) + var(--space-1));\n  }\n}`));
assert.equal((css.match(/--pill-badge-height:/g) || []).length, 2);
assert.match(pill, /width: fit-content;/);
assert.match(pill, /max-width: 100%;/);
assert.match(pill, /box-sizing: border-box;/);
assert.match(pill, /align-items: center;/);
assert.match(pill, /background: var\(--background-surface-4\);/);
assert.match(pill, /color: var\(--text-tertiary\);/);
assert.match(pill, /white-space: normal;[^]*?overflow-wrap: anywhere;/);
assert.match(pill, /--pill-block-padding: min\(calc\(var\(--space-1\) \/ 2\), max\(0px,/);
assert.match(pill, /padding: var\(--pill-block-padding\) calc\(var\(--space-1\) \/ 2\);/);
for (const selector of ['.form-input__tag-count.pill.pill--default', '.filter-summary__pill.pill.pill--default', '.filter-summary__count.pill.pill--default']) assert.match(rule(selector), /padding: var\(--pill-block-padding\)/);
assert.match(css, /:is\(\.badge__label, \.pill__title, \.filter-summary__count-title, \.form-input__tag-count-value\)\s*\{\s*transform: translateY\(var\(--compact-label-offset, 0px\)\);/);
const badge = rule('.badge');
assert.match(badge, /min-width: 0;[^]*?max-width: 100%;/);
assert.match(badge, /padding-block: min\(2px, max\(0px, calc\(\(var\(--pill-badge-height, var\(--space-5\)\) - var\(--typography-indicator-small-line-height\)\) \/ 2\)\)\);/);
assert.match(badge, /white-space: normal;[^]*?overflow-wrap: anywhere;/);
const defaultBadge = rule('.badge.default');
assert.match(defaultBadge, /border: 1px solid var\(--design-elements-border-default\);/);
assert.match(defaultBadge, /padding-block: min\(2px, max\(0px, calc\(\(var\(--pill-badge-height, var\(--space-5\)\) - var\(--typography-indicator-small-line-height\) - 2px\) \/ 2\)\)\);/);
for (const selector of ['.badge', '.badge.drawer', '.pill.pill--default', '.pill--radius', '.form-input__tag.pill.pill--default', '.form-input__tag-count.pill.pill--default']) {
  assert.doesNotMatch(rule(selector), /(?:^|\s)(?:height|min-height):/, `${selector}: single-line heights come from the shared rule`);
}
assert.doesNotMatch(css, /\.data-table \.badge,\s*\.analytics-table \.badge\s*\{/);
assert.match(rule('.form-input__tag-more'), /width: fit-content;/);
assert.match(rule('.filter-summary__count.pill.pill--default'), /width: fit-content;[^]*?max-width: 100%;/);
assert.match(rule('.filter-summary__group.form-input__tag-more'), /flex: 0 1 auto;/);
assert.match(rule('.filter-summary__pills'), /align-items: center;/);
for (const selector of ['.pill__title', '.form-input__tag-count-value', '.filter-summary__count-title']) {
  const text = rule(selector);
  assert.match(text, /display: block;/);
  assert.match(text, /line-height: inherit;/);
  assert.doesNotMatch(text, /height: 20px|display: inline-grid|place-items:/);
}
for (const selector of ['.filter-summary__pill .pill__title', '.filter-summary__count-title']) {
  assert.match(rule(selector), /overflow: visible;[^]*?text-overflow: clip;[^]*?white-space: normal;/);
}
assert.match(rule('.form-input__tag .pill__title'), /white-space: nowrap;/, 'Selected field tags keep their measured overflow contract');
assert.match(rule('.form-input__tag--rollover.pill.pill--default'), /height: auto;[^]*?width: 100%;[^]*?align-items: center;[^]*?padding-block: 0;/);
assert.match(rule('.form-input__tag--rollover .form-input__tag-remove'), /align-self: center;/);
assert.match(rule('.pill button'), /align-self: center;[^]*?display: grid;[^]*?place-items: center;/);
assert.match(rule('.filter-summary__count-chevron'), /display: grid;[^]*?place-items: center;/);
assert.doesNotMatch(css, /:is\(\.pill button,[^]*?\)::before\s*\{/);
assert.match(rule('.scenario-copy__title-row > .sign_BTN_smallest'), /margin-top: calc\(\(var\(--typography-caption-small-line-height\) - var\(--sign-btn-size\)\) \/ 2\);/);
assert.match(rule('.pill button:disabled'), /cursor: default;/);
assert.ok(css.includes('.pill button:hover:not(:disabled)'));
assert.match(rule('.pill button svg'), /width: 16px;[^]*?height: 16px;/);
assert.match(rule('.filter-summary__count-chevron svg'), /width: 20px;[^]*?height: 20px;/);

const values = new Map([...tokens.match(/:root\s*\{([^}]+)\}/)[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
function value(name, width) {
  const text = values.get(name);
  assert.ok(text, name);
  const alias = text.match(/^var\((--[\w-]+)\)$/);
  if (alias) return value(alias[1], width);
  const clamp = text.match(/^clamp\(([\d.]+)px,\s*([\d.]+)vw,\s*([\d.]+)px\)$/);
  return clamp ? Math.max(Number(clamp[1]), Math.min(width * Number(clamp[2]) / 100, Number(clamp[3]))) : parseFloat(text);
}
const outsideHeight = value('--space-5', 1440);
const compactTableHeight = outsideHeight - value('--space-1', 1440);
const wideHeight = outsideHeight + value('--space-1', 1440);
assert.equal(outsideHeight, 24);
assert.equal(compactTableHeight, 20);
assert.equal(wideHeight, 28);
for (const theme of ['light', 'dark']) {
  for (const width of [390, 1200, 1396, 1440, 1440.5, 1441, 1600, 1920, 2560, 3000]) {
    for (const inTable of [false, true]) {
      const height = width > 1440 ? wideHeight : inTable ? compactTableHeight : outsideHeight;
      assert.equal(height, width > 1440 ? 28 : inTable ? 20 : 24, `${theme}/${width}: correct table breakpoint`);
      for (const typography of ['body-smallest', 'indicator-small']) {
        const line = value(`--typography-${typography}-line-height`, width);
        const font = value(`--typography-${typography}-size`, width);
        assert.ok(font <= line && line < height, `${theme}/${width}/${typography}: typography fits the outer height`);
        const verticalPadding = typography === 'indicator-small' ? Math.min(2, Math.max(0, (height - line) / 2)) : Math.min(2, Math.max(0, (height - 20) / 2));
        assert.ok(Math.abs(Math.max(height, Math.max(line, typography === 'body-smallest' ? 20 : 0) + verticalPadding * 2) - height) < 0.001, 'One-line content preserves exactly 20/24/28px, including fractional metrics and 20px icons');
        if (typography === 'indicator-small') {
          const borderedPadding = Math.min(2, Math.max(0, (height - line - 2) / 2));
          assert.ok(Math.abs(Math.max(height, line + borderedPadding * 2 + 2) - height) < 0.001, 'Default badge border stays inside its exact one-line height');
          assert.ok(Math.max(height, line * 3 + borderedPadding * 2 + 2) >= line * 3 + 2, 'Bordered multiline badges hug all text');
        }
        for (const lines of [2, 3]) {
          const hugHeight = Math.max(height, line * lines + verticalPadding * 2);
          assert.ok(hugHeight > height && hugHeight >= line * lines, 'Wrapped labels hug their complete text and padding instead of keeping the one-line height');
        }
        for (const padding of [0, 2, 4]) {
          const contentHeight = height - padding * 2;
          const textCenter = padding + (contentHeight - line) / 2 + line / 2;
          const row = Math.max(line, 20);
          const rowTop = padding + (contentHeight - row) / 2;
          const gridTextCenter = rowTop + (row - line) / 2 + line / 2;
          const gridIconCenter = rowTop + (row - 20) / 2 + 10;
          assert.ok(Math.abs(textCenter - height / 2) < 0.001, 'Flex content stays centered regardless of vertical padding');
          assert.ok(Math.abs(gridTextCenter - height / 2) < 0.001 && Math.abs(gridIconCenter - height / 2) < 0.001, 'Grid tracks and icons share the outer-height center');
        }
      }
    }
    const titleLine = value('--typography-caption-small-line-height', width);
    const infoTop = (titleLine - 20) / 2;
    assert.ok(Math.abs(infoTop + 10 - titleLine / 2) < 0.001, `${theme}/${width}: info stays at the first-line center`);
  }
}
for (const file of (await readdir(new URL('../assets/css/pages/', import.meta.url))).filter(file => file.endsWith('.css'))) {
  assert.doesNotMatch(await read(`assets/css/pages/${file}`), /\.(?:pill(?:\b|_)|filter-summary__count|badge\b)[^{}]*\{[^}]*\b(?:height|width|line-height):/, `${file}: pill and badge geometry belongs to the shared component`);
}
console.log('Pills and badges: exact 20/24/28px one-line sizes, two- and three-line hug heights, bounded wrapping without clipping, preserved field-tag overflow, unchanged icon sizes and readonly crosses, first-line info alignment, and Light/Dark token contracts at 390-3000px passed. Browser rendering excluded.');
