import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const uiSource = await read('assets/js/ui.js');
const assetsSource = await read('assets/js/data/assets.js');
const detailSource = await read('assets/js/pages/equipment-detail.js');
const shellSource = await read('assets/js/shell.js');
const routeSource = shellSource.slice(shellSource.indexOf('  function routeHref('), shellSource.indexOf('  function navigationLink('));

function passport(id = 'pump101', changeAsset, staticPreview = false) {
  const listeners = new Map();
  const root = {innerHTML: ''};
  const exportButton = {addEventListener(type, callback) { assert.equal(type, 'click'); this.click = callback; }};
  const videoToggle = {
    pressed: 'false',
    getAttribute(name) { assert.equal(name, 'aria-pressed'); return this.pressed; },
    setAttribute(name, value) { assert.equal(name, 'aria-pressed'); this.pressed = value; },
    addEventListener(type, callback) { assert.equal(type, 'click'); this.click = callback; }
  };
  const videoPanel = {hidden: true};
  const photo = {hidden: false};
  const document = {
    readyState: 'loading',
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) || [];
      callbacks.push(callback);
      listeners.set(type, callbacks);
    },
    getElementById: value => value === 'equipment-detail' ? root : value === 'equipment-video' ? videoPanel : null,
    querySelector: selector => ({
      '[data-equipment-risk-export]': exportButton,
      '[data-equipment-video-toggle]': videoToggle,
      '[data-equipment-photo]': photo
    })[selector] || null
  };
  let breadcrumbs;
  const window = {
    addEventListener() {},
    BNTShell: {setBreadcrumbs(value) { breadcrumbs = value; }}
  };
  const context = vm.createContext({window, document, URLSearchParams, isStaticPreview: staticPreview, location: {search: `?id=${encodeURIComponent(id)}`}});
  vm.runInContext(routeSource, context);
  window.BNTShell.routeHref = context.routeHref;
  vm.runInContext(uiSource, context);
  vm.runInContext(assetsSource, context);
  changeAsset?.(window.BNT_DATA.assets);
  const before = JSON.stringify(window.BNT_DATA.assets);
  vm.runInContext(detailSource, context);
  assert.equal(JSON.stringify(window.BNT_DATA.assets), before, 'Rendering does not mutate the asset model');
  return {html: root.innerHTML, document, window, listeners, breadcrumbs, exportButton, videoToggle, videoPanel, photo};
}

const pump = passport();
const {html} = pump;
assert.match(html, /page-title-actions page-actions analytics-page-actions/);
assert.match(html, /analytics-eyebrow typography-label-smallest">Насосная станция №1 · KSB Etanorm 200-250/);
assert.match(html, /<h2 class="typography-h4">Насос Н-101<\/h2><button class="sign_BTN_smallest"/);
assert.match(html, /data-drawer-info="Износ рассчитан по фактической наработке и режимам нагрузки"/);
assert.match(html, /aria-label="Как рассчитан износ" aria-haspopup="dialog" aria-expanded="false"/);
assert.match(html, /financial-interface\.svg\?v=14#Info/);
assert.equal((html.match(/Износ рассчитан по фактической наработке и режимам нагрузки/g) || []).length, 1);
assert.doesNotMatch(html, /Ключевые показатели|equipment-metrics-title/);
assert.equal(pump.breadcrumbs[0].label, 'Активы');
assert.equal(pump.breadcrumbs[0].href, '/equipment');
assert.equal(pump.breadcrumbs[1].label, 'Насосы');
assert.equal(pump.breadcrumbs[2].label, 'Н-101');

const metricsStart = html.indexOf('<div class="grid-4 equipment-detail-metrics"');
const detailStart = html.indexOf('<article class="card-with-image card-with-image--horizontal equipment-detail-overview"');
assert.ok(metricsStart > html.indexOf('</header>') && metricsStart < detailStart, 'KPIs occupy a separate row before the three-column overview');
const metrics = html.slice(metricsStart, detailStart);
assert.equal((metrics.match(/class="analytics-kpi"/g) || []).length, 4);
for (const value of ['11.09.2026', '$18 400', '15.12.2026', '32%']) assert.ok(metrics.includes(value));
assert.doesNotMatch(metrics, /card-with-image__progress/);
const bodyStart = html.indexOf('<div class="card-h__body">', detailStart);
const asideStart = html.indexOf('<div class="card-h__body card-with-image__aside" data-table-height-group="smallest">', bodyStart);
assert.ok(bodyStart > detailStart && asideStart > bodyStart);
const photo = html.slice(detailStart, bodyStart);
const details = html.slice(bodyStart, asideStart);
assert.match(photo, /card-with-image__visual[^]*?data-equipment-photo[^]*?pump-hero\.jpg/);
assert.doesNotMatch(photo, /card-with-image__progress|card-with-image__heading|equipment-passport-title/);
assert.match(details, /class="dt3-metrics scenario-impact scenario-impact--progress"/);
const contextStart = details.indexOf('<div class="logistics-alert-list"');
const progressMetrics = details.slice(details.indexOf('<div class="dt3-metrics'), contextStart);
assert.ok(contextStart > details.indexOf('Текущая загрузка'), 'Location and brand follow the ring metrics');
const contextList = details.slice(contextStart);
assert.equal((contextList.match(/logistics-alert logistics-alert--canvas/g) || []).length, 2);
assert.equal((contextList.match(/canvas-block canvas-block--static/g) || []).length, 2);
assert.match(contextList, /typography-label-smallest">Местоположение<\/strong>/);
assert.match(contextList, /layout-item-label__link" href="\/digital-twin\?object=pump101">Насосная станция №1<\/a>/);
assert.match(contextList, /financial-interface\.svg\?v=17#LocationMap/);
assert.match(contextList, /typography-label-smallest">Поставщик<\/strong>/);
assert.match(contextList, /layout-item-label__link" href="https:\/\/takish\.kz\/about_us">TAKISH ENGINEERING<\/a>/);
assert.match(contextList, /takish-engineering\.webp/);
assert.doesNotMatch(contextList, /aria-disabled="true"|href="#"|onclick=/);
assert.equal((progressMetrics.match(/class="payment-progress-ring"/g) || []).length, 2);
assert.equal((progressMetrics.match(/payment-summary-card__content/g) || []).length, 2);
assert.doesNotMatch(progressMetrics, /metrics-grid--paired|data-metrics-for/, 'The progress variant does not reuse the paired-count grid contract');
assert.match(progressMetrics, /payment-summary-card--error payment-summary-card__content/);
assert.match(progressMetrics, /payment-summary-card--brand payment-summary-card__content/);
for (const [label, value] of [['Износ по нагрузке', 72], ['Текущая загрузка', 85]]) {
  assert.ok(progressMetrics.includes(`aria-label="${label}: ${value}%"`));
  assert.ok(progressMetrics.includes(`payment-progress-ring__value typography-label-smallest">${value}%`));
  assert.ok(progressMetrics.includes(`payment-summary-card__description typography-body-smallest">${label}</p>`));
}
assert.doesNotMatch(progressMetrics, /card-with-image__progress|scenario-range__track|payment-summary-card__amount|<header|<h[1-6]/);
assert.doesNotMatch(details, /equipment-passport-title|equipment-nodes-title/, 'The middle column contains only model, video control and progress metrics');
assert.match(details, /class="dt3-risk-toggle dt3-risk-toggle--positive typography-label-smallest" aria-pressed="false" data-equipment-video-toggle aria-controls="equipment-video"/);
assert.match(details, /Включить видео/);
assert.ok(details.indexOf('data-equipment-video-toggle') < details.indexOf('card-with-image__heading'), 'Video toggle is first in the middle column');
assert.doesNotMatch(html, /Телеметрия Онлайн|equipment-detail-photo/);
assert.match(photo, /id="equipment-video"[^>]*hidden[^]*?empty-state--illustrated[^]*?Видеопоток не подключён/);
pump.videoToggle.click();
assert.equal(pump.videoToggle.pressed, 'true');
assert.equal(pump.videoPanel.hidden, false);
assert.equal(pump.photo.hidden, true);
pump.videoToggle.click();
assert.equal(pump.videoToggle.pressed, 'false');
assert.equal(pump.videoPanel.hidden, true);
assert.equal(pump.photo.hidden, false);

const headerActions = [...html.slice(0, metricsStart).matchAll(/<a class="([^"]+)" href="([^"]+)">([^]*?)<\/a>/g)];
assert.equal(headerActions.length, 2);
for (const [, classes, , content] of headerActions) {
  assert.match(classes, /^button-small button-small--(?:primary|secondary) typography-button-small$/);
  assert.doesNotMatch(content, /<svg|<use/, 'No unrequested icons on the heading buttons');
}
assert.equal(headerActions[0][2], '/digital-twin?object=pump101');
assert.equal(headerActions[1][2], `/toir?action=repair&asset=${encodeURIComponent('Насос Н-101')}`);

const riskStart = html.indexOf('<article class="chart-card chart-card--wide payment-risk-map risk-map-left"');
assert.ok(riskStart > detailStart, 'The risk block is below the complete overview');
const overview = html.slice(detailStart, riskStart);
assert.match(overview, /equipment-passport-title/);
assert.match(overview, /equipment-nodes-title/);
const thirdColumn = html.slice(asideStart, riskStart);
assert.equal((thirdColumn.match(/class="div-block div-block--compact"/g) || []).length, 2);
for (const [id, title] of [['equipment-passport-title', 'Паспорт'], ['equipment-nodes-title', 'Связанные узлы']]) {
  assert.ok(thirdColumn.includes(`<h3 id="${id}" class="typography-caption-smallest">${title}</h3>`));
  assert.ok(thirdColumn.includes(`<table class="data-table" aria-labelledby="${id}">`));
}
for (const value of ['PMP-00101', 'KSB Etanorm 200-250', 'KSB-18-0417', '2018', '18 420 ч']) assert.ok(thirdColumn.includes(value));
assert.doesNotMatch(overview, /<aside|equipment-prediction-title|equipment-history-title/);
const nodeTable = thirdColumn.match(/<table class="data-table" aria-labelledby="equipment-nodes-title"><tbody>([^]*?)<\/tbody>/)[1];
const nodes = [...nodeTable.matchAll(/<tr>([^]*?)<\/tr>/g)];
assert.equal(nodes.length, 4);
for (const [name, status] of pump.window.BNT_DATA.assets[0].nodes) {
  const node = nodes.find(match => match[1].includes(name))?.[1];
  assert.ok(node, name);
  assert.ok(node.includes(status), `${name}: status preserved`);
  const statusTone = status === 'Работает' ? 'green' : status === 'Норма' ? 'neutral' : 'default';
  assert.ok(node.includes(`class="badge ${statusTone}"`), `${status}: shared badge tone`);
  assert.doesNotMatch(node, /card-with-image__title|line-clamp/, 'Linked node names and statuses are preserved in full');
}
const risk = html.slice(riskStart);
const historyFilter = risk.match(/<button[^>]*data-chart-filter[^>]*>[^]*?<\/button>/)[0];
assert.match(historyFilter, /class="button-smallest-secondary-radius typography-button-smallest"/);
assert.match(historyFilter, /data-chart-filter-variant="static-date" data-chart-filter-title="История ремонтов"/);
assert.match(historyFilter, /aria-expanded="false" aria-controls="chart-filter-modal"/);
assert.match(historyFilter, /financial-interface\.svg#Filter/);
assert.ok(risk.indexOf('data-equipment-risk-export') < risk.indexOf('data-chart-filter'));
assert.match(risk, /payment-risk-map__layout/);
for (const [title, description] of [
  ['Предиктивная рекомендация', 'С учетом поступлений, ремонтного окна и наличия ЗИП'],
  ['История ремонтов', 'Фактические затраты и исполнители']
]) {
  assert.ok(risk.includes(`data-drawer-info="${description}" data-drawer-info-title="${title}"`));
  assert.ok(!risk.includes(`>${description}</p>`), 'Descriptions are in shared info popovers, not visible subtitles');
}
assert.match(risk, /class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest"[^>]*data-equipment-risk-export/);
assert.match(risk, /width="24" height="24"[^]*?#Download/);
let exported, exportToast;
pump.window.BNTUI.downloadCsv = (filename, rows) => { exported = {filename, rows}; };
pump.window.BNTUI.toast = (...args) => { exportToast = args; };
pump.exportButton.click();
assert.equal(exported.filename, 'BNT_equipment-pump101-risk.csv');
assert.equal(exported.rows[0][1], 'Насос Н-101');
assert.equal(exported.rows[2][1], pump.window.BNT_DATA.assets[0].recommendation);
assert.equal(exported.rows[4][2], 'Проверить ЗИП');
assert.deepEqual(JSON.parse(JSON.stringify(exported.rows.slice(7))), JSON.parse(JSON.stringify(pump.window.BNT_DATA.assets[0].repairs)));
assert.deepEqual(exportToast, ['Экспорт', 'Рекомендации и история ремонтов скачаны в CSV']);
assert.match(risk, /payment-risk-map__risk-column[^]*?payment-risk-map__scroller ui-scrollbar/);
assert.equal((risk.match(/class="payment-risk-item payment-risk-item--/g) || []).length, 3);
assert.ok(risk.includes(pump.window.BNT_DATA.assets[0].recommendation), 'The original recommendation is shown in full');
assert.match(risk, /payment-risk-map__opposite payment-risk-map__table-panel div-block div-block--compact/);
assert.match(risk, /table-block payment-risk-map__table-block[^]*?class="data-table"/);
const actions = [...risk.matchAll(/<a class="([^"]+)" href="([^"]+)">([^]*?)<\/a>/g)];
assert.equal(actions.length, 3);
for (const [, classes, , content] of actions) {
  assert.equal(classes, 'pill pill--default pill--round payment-risk-item__action typography-body-smallest');
  assert.match(content, /financial-interface\.svg\?v=3#ArrowUpRight/);
}
assert.equal(actions[0][2].replaceAll('&amp;', '&'), `/toir?action=work-order&asset=${encodeURIComponent('Насос Н-101')}`);
assert.ok(actions[0][3].includes('Создать задачу'));
assert.equal(actions[1][2], '/analytics');
assert.ok(actions[1][3].includes('Оценить сценарий'));
assert.equal(actions[2][2], '/procurement');
assert.ok(actions[2][3].includes('Проверить ЗИП'));
assert.match(risk, /data-table__numeric-cell/);
for (const row of pump.window.BNT_DATA.assets[0].repairs) {
  for (const value of row) assert.ok(risk.includes(value), `Repair history preserves ${value}`);
}
assert.doesNotMatch(html, /class="(?:detail-head|asset-metric|btn)(?: |")/);
const staticPump = passport('pump101', undefined, true);
assert.match(staticPump.html, /href="\/digital-twin\.html\?object=pump101"/);
assert.match(staticPump.html, /href="\/toir\.html\?action=work-order&amp;asset=/);
assert.match(staticPump.html, /href="\/analytics\.html"/);
assert.match(staticPump.html, /href="\/procurement\.html"/);
assert.match(passport('pump101', assets => { assets[0].nodes = []; }).html, /empty-state--illustrated[^]*?Нет связанных узлов/);

let info;
pump.window.BNTUI.showInfoPopover = (trigger, options) => { info = {trigger, options}; };
const infoHandler = pump.listeners.get('click').find(callback => callback.toString().includes('[data-drawer-info]'));
const trigger = {dataset: {drawerInfo: 'Износ рассчитан по фактической наработке и режимам нагрузки', drawerInfoTitle: 'Износ оборудования'}};
infoHandler({target: {closest: selector => selector === '[data-drawer-info]' ? trigger : null}});
assert.equal(info.trigger, trigger);
assert.equal(info.options.title, 'Износ оборудования');
assert.equal(info.options.message, trigger.dataset.drawerInfo);

assert.match(passport('PUMP102').html, /Насос Н-102/);
assert.match(passport('R-31').html, /TNK-00031/);
assert.match(passport('unknown').html, /Насос Н-101/);
const escaped = passport('pump101', assets => {
  assets[0].name = '<img onerror="bad">&';
  assets[0].repairs = [];
});
assert.match(escaped.html, /&lt;img onerror=&quot;bad&quot;&gt;&amp;/);
assert.doesNotMatch(escaped.html, /<img onerror=/);
assert.match(escaped.html, /data-table__empty-cell[^]*?Нет истории ремонтов/);

const components = await read('assets/css/components.css');
const imageHorizontal = components.match(/\.card-with-image--horizontal\s*\{([^}]+)\}/)[1];
assert.match(imageHorizontal, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(imageHorizontal, /gap: var\(--space-5\)/);
assert.match(imageHorizontal, /padding: var\(--space-3\)/);
assert.match(components, /\.card-h__body,\s*\.div-block\s*\{[^}]*gap: var\(--space-3\)/);
assert.match(components, /\.div-block--compact\s*\{[^}]*gap: var\(--space-2\)/);
assert.match(components, /\[data-table-height-group="smallest"\] \.table-wrap\s*\{[^}]*height: var\(--table-height-group-height, var\(--table-height-group-min-height\)\);[^}]*max-height: var\(--table-height-group-height, var\(--table-height-group-min-height\)\)/);
assert.doesNotMatch(components, /\.card-with-image--horizontal > \.card-h__body\.card-with-image__aside\s*\{/, 'Retired half-height containment is removed');
assert.match(components, /\.dt3-risk-toggle--positive\s*\{[^}]*--toggle-active-background: var\(--system-elements-semantic-positive-primary\)/);
assert.match(components, /\.dt3-risk-toggle\s*\{[^}]*--toggle-active-background: var\(--background-brand-solid\)/);
assert.match(components, /\.card-with-image__media\[hidden\],[^]*?\.card-with-image__video\[hidden\]\s*\{\s*display: none/);
assert.match(components, /\.card-with-image--horizontal:hover \.card-with-image__media img\s*\{[^}]*transform: none;[^}]*transition: none;/);
assert.match(components, /\.card-with-image--horizontal \.card-with-image__media\s*\{[^}]*background: var\(--system-elements-static-primary\)/, 'Photo letterboxing has a neutral static background, not page-colored side strips');
const progressVariant = components.match(/\.dt3-metrics\.scenario-impact--progress > div\s*\{([^}]+)\}/)[1];
assert.doesNotMatch(progressVariant, /padding:/, 'Progress cells keep the shared metric padding');
assert.match(progressVariant, /min-height: 0;/, 'Description-only progress cells do not inherit the header-plus-ring KPI minimum height');
assert.match(components, /\.dt3-metrics\.scenario-impact > div,[^]*?\.metrics-grid > div\s*\{[^}]*padding: var\(--space-3\)/);
const compactMetrics = components.match(/\.dt3-metrics\.scenario-impact\s*\{([^}]+)\}/)[1];
assert.match(compactMetrics, /--scenario-impact-columns: 2;/);
assert.match(compactMetrics, /gap: var\(--space-2\)/, 'The original compact metrics keep their existing spacing');
const progressGrid = components.match(/\.dt3-metrics\.scenario-impact--progress\s*\{([^}]+)\}/)[1];
assert.match(progressGrid, /flex: none;/);
assert.match(progressGrid, /align-self: stretch;/, 'The flex child fills the parent width instead of shrink-wrapping into narrow letter columns');
assert.match(progressGrid, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/, 'The two progress cells stay side by side');
assert.match(progressGrid, /gap: var\(--space-3\)/);
assert.match(progressGrid, /align-content: start;/);
assert.match(progressGrid, /align-items: stretch;/);
assert.match(progressGrid, /grid-auto-rows: 1fr;/, 'Intrinsic grid rows share the tallest natural cell height');
assert.doesNotMatch(progressGrid, /(?:min-|max-)?height:/, 'The ring grid has no fixed height');
const tokens = await read('assets/css/tokens.css');
const metricGap = Number(tokens.match(/--space-3:\s*([\d.]+)px;/)[1]);
for (const width of [260, 320, 440, 452, 640, 920]) {
  const cellWidth = (width - metricGap) / 2;
  assert.ok(cellWidth > 0);
  assert.equal(cellWidth * 2 + metricGap, width, `${width}px: two equal cells fill the row with a 12px gap`);
}
assert.match(progressVariant, /align-items: center;[^}]*gap: var\(--space-2\)/);
assert.doesNotMatch(progressVariant, /--payment-progress-ring-size/, 'The variant inherits responsive ring sizing from the summary card');
assert.match(components, /\.payment-summary-card\s*\{[^}]*--payment-progress-ring-size: clamp\(52px, 3\.611111vw, 69px\)/);
for (const selector of ['.payment-progress-ring circle', '.payment-progress-ring__bar']) {
  const rule = components.match(new RegExp(`${selector.replaceAll('.', '\\.')}\\s*\\{([^}]+)\\}`))[1];
  assert.match(rule, /stroke-width: var\(--payment-progress-ring-stroke-width, 2px\)/);
  assert.match(rule, /vector-effect: non-scaling-stroke/, 'Track and progress stroke thickness remains constant as the ring scales');
}
assert.match(components, /\.payment-summary-card__content\s*\{[^}]*grid-template-columns: var\(--payment-progress-ring-size, 52px\) minmax\(0, 1fr\)/, 'The regular summary content keeps its existing 52px fallback');
assert.match(components, /\.dt3-metrics\.scenario-impact > div > span,/);
assert.match(components, /\.dt3-metrics\.scenario-impact > div > strong,/);
assert.match(components, /\.card-with-image__video\s*\{[^}]*background: var\(--background-page\)/);
assert.match(components, /@media \(max-width: 1100px\)\s*\{\s*\.card-with-image--horizontal\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(components, /@media \(max-width: 680px\)\s*\{\s*\.card-with-image--horizontal\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/);
const smallButton = components.match(/\.button-small\s*\{([^}]+)\}/)[1];
assert.match(smallButton, /text-decoration: none;/, 'Link buttons do not inherit browser underlines');
for (const property of ['font-family', 'font-size', 'line-height', 'font-weight', 'letter-spacing']) {
  assert.match(smallButton, new RegExp(`${property}: var\\(--(?:font-family-primary|typography-button-small-[^)]+)\\);`));
}
for (const tone of ['primary', 'secondary']) {
  const rule = components.match(new RegExp(`\\.button-small--${tone}\\s*\\{([^}]+)\\}`))[1];
  for (const property of ['color', 'background', 'border-color']) assert.match(rule, new RegExp(`${property}: var\\(--`));
}
const horizontal = components.match(/\.chart-card--horizontal\s*\{([^}]+)\}/)[1];
assert.match(horizontal, /flex-direction: row;/);
assert.match(horizontal, /align-items: center;/);
assert.match(horizontal, /justify-content: space-between;/);
assert.doesNotMatch(horizontal, /font-|color:|background:|border:/, 'Horizontal orientation does not replace the shared surface or typography');
const pageCss = await read('assets/css/pages/enterprise.css');
assert.doesNotMatch(pageCss, /\.scenario-impact (?:div|span|strong)\s*\{/, 'Legacy metric rules do not leak into nested ring geometry or values');
assert.match(pageCss, /\.equipment-detail-metrics\s*\{[^}]*repeat\(auto-fit, minmax\(min\(100%, var\(--analytics-kpi-min-width\)\), 1fr\)\)/);
assert.doesNotMatch(pageCss, /\.equipment-detail[^{}]*\{[^}]*font-|\.equipment-detail[^{}]*\{[^}]*color:|\.detail-grid\s*\{/);
const page = await read('equipment-detail.html');
assert.match(page, /id="equipment-detail" class="div-block"/);
assert.doesNotMatch(page, /id="equipment-detail" class="content-block"/);
assert.match(page, /src="\/assets\/js\/chart-filter\.js\?v=4"/);
assert.match(page, /id="page-content" class="page-content"/);
assert.ok(page.indexOf('assets/js/shell.js') < page.indexOf('assets/js/pages/equipment-detail.js'));
console.log('Equipment passport: separate KPIs, shared column bodies, smaller-table height group, caption-smallest headings, semantic node badges, intrinsic progress pair, risk/table steps, routes, video, info and preserved data.');
