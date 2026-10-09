import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const window = {addEventListener() {}};
const document = {readyState: 'loading', addEventListener() {}};
vm.runInNewContext(await read('assets/js/ui.js'), {window, document});
const ui = window.BNTUI;
const items = Object.freeze([
  Object.freeze({title: 'Location <title>', value: 'Station & pump', icon: 'location', href: '/digital-twin.html?object=pump101&view=3d'}),
  Object.freeze({title: 'Brand', value: 'TAKISH ENGINEERING', image: '/assets/takish-engineering.webp', href: 'https://takish.kz/about_us'})
]);
const html = ui.renderCanvasAlertList(items, {label: 'Context & links'});
assert.match(html, /class="logistics-alert-list" aria-label="Context &amp; links"/);
assert.equal((html.match(/class="logistics-alert logistics-alert--canvas"/g) || []).length, 2);
assert.equal((html.match(/class="canvas-block canvas-block--static"/g) || []).length, 2);
assert.equal((html.match(/class="layout-item-icon layout-item-icon--neutral"/g) || []).length, 2);
assert.match(html, /typography-label-smallest">Location &lt;title&gt;<\/strong>/);
assert.match(html, /typography-body-smallest"><a class="layout-item-label__link" href="\/digital-twin\.html\?object=pump101&amp;view=3d">Station &amp; pump<\/a>/);
assert.match(html, /href="\/assets\/icons\/financial-interface\.svg\?v=17#LocationMap"/);
assert.match(html, /style="--layout-item-image: url\(&quot;\/assets\/takish-engineering\.webp&quot;\)"/);
assert.match(html, /<a class="layout-item-label__link" href="https:\/\/takish\.kz\/about_us">TAKISH ENGINEERING<\/a>/);
assert.match(ui.renderCanvasAlertList([{title: 'Unavailable', value: 'No data'}]), /role="link" aria-disabled="true" tabindex="0"/);
assert.doesNotMatch(html, /onclick|href="#"|data-close|layout-item-action|logistics-alert__marker/);
const escaped = ui.renderCanvasAlertList([{title: '"<b>', value: '<script>', href: '/?q="<>&', image: '/images/logo")name.webp'}]);
assert.match(escaped, /&quot;&lt;b&gt;/);
assert.match(escaped, /&lt;script&gt;/);
assert.match(escaped, /logo%22%29name\.webp/);
assert.doesNotMatch(escaped, /<script>|<b>|href="\/\?q="/);
assert.equal(ui.renderCanvasAlertList([]), '<div class="logistics-alert-list"></div>');

const css = await read('assets/css/components.css');
const rule = selector => css.match(new RegExp(`${selector.replaceAll('.', '\\.')}\\s*\\{([^}]+)\\}`))[1];
assert.match(rule('.logistics-alert-list'), /gap: var\(--space-3\)/);
assert.match(rule('.logistics-alert'), /padding: 0 0 var\(--space-3\) 0;[^]*border-bottom: 1px solid var\(--design-elements-border-default\)/);
assert.match(rule('.logistics-alert--canvas'), /grid-template-columns: minmax\(0, 1fr\)/);
const row = rule('.logistics-alert--canvas > .canvas-block--static');
assert.match(row, /gap: inherit;[^]*padding: 0;[^]*border: 0;[^]*background: none;[^]*box-shadow: none;[^]*backdrop-filter: none;/);
assert.match(rule('.canvas-block.canvas-block--static'), /grid-template-columns: var\(--canvas-block-control-size\) minmax\(0, 1fr\)/);
const icon = rule('.layout-item-icon.layout-item-icon--neutral');
assert.match(icon, /background: var\(--system-elements-semantic-neutral-secondary-fade\)/);
assert.match(icon, /color: var\(--system-elements-semantic-neutral-primary\)/);
const logo = rule('.layout-item-icon__image');
assert.match(logo, /width: var\(--space-5\);[^]*height: var\(--space-5\);[^]*background: var\(--text-primary\);[^]*mask: var\(--layout-item-image\) center \/ contain no-repeat/);
assert.doesNotMatch(logo, /filter:|opacity:|#[0-9a-f]/i);
assert.match(rule('.layout-item-label__link'), /color: var\(--text-secondary\);[^]*font: inherit/);
const tokens = await read('assets/css/tokens.css');
assert.match(tokens, /--system-elements-semantic-neutral-secondary-fade: var\(--operational-card-neutral-fill\)/);
assert.match(tokens, /--system-elements-semantic-neutral-secondary-fade: rgb\(0 136 204 \/ 20%\)/);
assert.doesNotMatch(tokens, /--system-elements-semantic-neutral-secondary-fade: var\(--design-elements-icon-tertiary-neutral\)/);
const sprite = await read('assets/icons/financial-interface.svg');
const symbol = sprite.match(/<symbol id="LocationMap"[^]*?<\/symbol>/)[0];
assert.equal((symbol.match(/fill="currentColor"/g) || []).length, 2);
assert.doesNotMatch(symbol, /#[0-9a-f]/i);
const image = await readFile(new URL('../assets/takish-engineering.webp', import.meta.url));
assert.equal(image.subarray(0, 4).toString(), 'RIFF');
assert.equal(image.subarray(8, 12).toString(), 'WEBP');
console.log('Canvas alerts: shared rows/dividers, neutral icon and frame, theme-adaptive logo mask, escaped links, active supplier link, inactive fallback and unchanged standalone canvas.');
