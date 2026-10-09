import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const source = await read('legacy/report-studio-v5/app.js');
const uiSource = await read('assets/js/ui.js');
const html = await read('mailings.html');
const css = await read('assets/css/components.css');
const dispatcherCss = await read('assets/css/pages/dispatcher-3d.css');
const mailingsCss = await read('assets/css/pages/mailings.css');
const legacyCss = await read('legacy/report-studio-v5/styles.css');
const icons = await read('assets/icons/financial-interface.svg');
const tokens = await read('assets/css/tokens.css');

class Element {
  html = '';
  get innerHTML() { return this.html; }
  set innerHTML(value) {
    if (this.sharedControlsOnly) assert.doesNotMatch(value, /class=["'](?:[^"']*\s)?(?:btn(?:-(?:primary|secondary|danger))?|icon-btn|field(?:-grow)?)(?=\s|["'])/, 'Corporate renders use shared controls');
    this.html = value;
  }
  dataset = {};
  listeners = new Map();
  attributes = new Map();
  children = [];
  style = {setProperty() {}, removeProperty() {}};
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  emit(type, event) { for (const listener of this.listeners.get(type) || []) listener(event); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild(child) { this.children.push(child); }
  contains(target) { return this === target || this.children.includes(target); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  focus() { this.focused = true; }
  closest(selector) {
    if (selector === '[data-equipment-filter-remove-value^="recipients-"]' && this.dataset.equipmentFilterRemoveValue?.startsWith('recipients-')) return this;
    if (selector === '[data-action]' && this.dataset.action) return this;
    if (selector === '[data-close]' && this.dataset.close != null) return this;
    if (selector === '[hidden]' && this.hidden) return this;
    return null;
  }
  getBoundingClientRect() { return {left: 80, top: 80, bottom: 100, width: 240, height: 80}; }
}

async function mount(page = 'mailings', saved = {view: 'reports', schedules: []}) {
  const elements = new Map(['#page-content', '#app', '#modal-root', '#toast-root', '#template-import'].map(id => [id, new Element()]));
  if (page === 'mailings') for (const id of ['#page-content', '#modal-root']) elements.get(id).sharedControlsOnly = true;
  let stored = JSON.stringify(saved);
  const document = Object.assign(new Element(), {
    body: Object.assign(new Element(), {dataset: {page}}),
    documentElement: {clientWidth: 1440, clientHeight: 900},
    querySelector: selector => elements.get(selector) || null,
    querySelectorAll: () => [],
    createElement: () => new Element()
  });
  const window = Object.assign(new Element(), {
    BNT_DATA: {datasets: []}, BNT_REPORTS: {},
    BNT_TEMPLATES: [{id: 'cf-main', name: 'Report & <test>', description: 'Description & <test>', blocks: []}]
  });
  const context = vm.createContext({document, window, console, setTimeout() {}, requestAnimationFrame(callback) { callback(); },
    localStorage: {getItem: () => stored, setItem: (_key, value) => { stored = value; }}
  });
  vm.runInContext(uiSource, context);
  const notices = [];
  window.BNTUI.toast = (...args) => notices.push(args);
  await vm.runInContext(source, context);
  const root = elements.get(page === 'mailings' ? '#page-content' : '#app');
  return {root, modal: elements.get('#modal-root'), document, ui: window.BNTUI, notices,
    state: () => JSON.parse(stored),
    input(id, value) { elements.set(`#schedule-${id}`, {value}); },
    removeRecipient(index, value) {
      const target = new Element();
      target.dataset = {equipmentFilterRemoveValue: `recipients-${index}`, equipmentFilterRemoveItem: value};
      const event = {target, preventDefault() {}};
      root.emit('click', event); document.emit('click', event);
    },
    click(action, index = '', targetRoot = root) {
      const target = new Element();
      target.dataset = {action, index: String(index)};
      const event = {target, preventDefault() {}};
      targetRoot.emit('click', event);
      document.emit('click', event);
      return target;
    }
  };
}

const app = await mount();
assert.equal(app.state().view, 'schedules', 'The page does not depend on the previously opened studio view');
assert.match(app.root.innerHTML, /^<section class="page-title-actions">/);
assert.match(app.root.innerHTML, /class="page-title-actions__title-row"/);
assert.match(app.root.innerHTML, /<h1 class="typography-h4">/);
assert.doesNotMatch(app.root.innerHTML, /class="(?:app|page-head|content)"|<aside|<main/);
assert.doesNotMatch(app.root.innerHTML.match(/<section class="page-title-actions">([\s\S]*?)<\/section>/)[1], /<p>/);
function emptyState(markup) {
  assert.match(markup, /<section class="empty-state empty-state--illustrated" aria-labelledby="mailings-empty-title">\s*<div class="div-block empty-state__content">/);
  assert.match(markup, /<svg class="empty-state__illustration" width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><use href="\/assets\/icons\/financial-interface\.svg\?v=2#EmptyStateBox"><\/use><\/svg>/);
  assert.doesNotMatch(markup, /empty-state-box\.png|<img/);
  assert.match(markup, /class="empty-state__title typography-label-base"[^>]*>Рассылки еще не настроены<\/h2>/);
  assert.match(markup, /class="empty-state__description typography-body-small">Настройте отправку выбранного шаблона на e-mail\.<\/p>/);
  assert.match(markup, /class="button-small button-small--secondary typography-button-small"[^>]*data-action="new-schedule"><span>Создать рассылку<\/span>/);
  assert.doesNotMatch(markup, /class="schedule-list"/);
}
emptyState(app.root.innerHTML);
const primary = app.root.innerHTML.match(/<button class="button-small button-small--primary typography-button-small"[^>]*>([\s\S]*?)<\/button>/)?.[1];
assert.ok(primary);
assert.match(primary, /<span>Новая рассылка<\/span>/);
const zoomHtml = await read('digital-twin.html');
const zoomPlus = zoomHtml.match(/id="dt-plus"[\s\S]*?<path d="([^"]+)"/)?.[1];
assert.ok(zoomPlus);
assert.ok(primary.includes(`d="${zoomPlus}"`), 'The action uses the exact shared zoom plus');

function counts(expected) {
  const summary = app.root.innerHTML.match(/<div class="metrics-grid metrics-grid--paired"[^>]*>((?:<div><span>[^<]*<\/span><strong>\d+<\/strong><\/div>){3})<\/div>/)?.[1];
  assert.ok(summary);
  assert.deepEqual([...summary.matchAll(/<strong>(\d+)<\/strong>/g)].map(match => Number(match[1])), expected);
  assert.match(summary, /<span>активных<\/span><strong>/);
}
counts([0, 0, 0]);
const trigger = app.click('schedule-info');
assert.equal(trigger.getAttribute('aria-expanded'), 'true');
assert.equal(trigger.getAttribute('aria-controls'), 'bnt-info-popover');
assert.equal(app.ui.infoPopoverElement.hidden, false);
assert.match(app.ui.infoPopoverElement.innerHTML, /Настройте ежедневную/);
app.ui.infoPopoverElement.emit('click', {target: {closest: () => true}});
assert.equal(trigger.getAttribute('aria-expanded'), 'false');
assert.equal(app.ui.infoPopoverElement.hidden, true);

const createTrigger = app.click('new-schedule');
assert.match(app.modal.innerHTML, /id="schedule-template"/);
assert.match(app.modal.innerHTML, /data-action="confirm-schedule"/);
assert.match(app.modal.innerHTML, /class="filter-modal" role="dialog" aria-modal="true"/);
assert.match(app.modal.innerHTML, /class="filter-modal__drawer dt3-drawer"/);
assert.match(app.modal.innerHTML, /class="filter-modal__body filter-modal__body--form"/);
assert.match(app.modal.innerHTML, /class="filter-modal__fields ui-scrollbar"/);
assert.match(app.modal.innerHTML, /<input class="form-input__control form-input__control--text typography-body-smallest" type="text" id="schedule-recipients"[^>]*placeholder="director@company\.ge, peo@company\.ge"/);
assert.equal((app.modal.innerHTML.match(/data-form-input-mode="single"/g) || []).length, 3);
assert.equal((app.modal.innerHTML.match(/aria-multiselectable="false"/g) || []).length, 3);
assert.match(app.modal.innerHTML, /data-time-input="schedule-time"/);
assert.doesNotMatch(app.modal.innerHTML, /is-touched/);
const header = app.modal.innerHTML.match(/<header class="filter-modal__head">([\s\S]*?)<\/header>/)[1];
assert.doesNotMatch(header, /divider|modal-head|style=/);
assert.equal((app.modal.innerHTML.match(/class="ui-divider brand-divider"/g) || []).length, 2, 'The drawer keeps only its two standard dividers');
assert.match(legacyCss, /\.app > main > header\{/);
assert.doesNotMatch(legacyCss, /(?:^|\})header\{/m, 'Legacy sticky background and bottom border must not leak onto component drawer headers');
assert.match(source, /requestAnimationFrame\(\(\) => modal\.querySelector\('\.dt3-drawer-toggle'\)\?\.focus\(\)\);/);
assert.doesNotMatch(app.modal.innerHTML, /type="search"|form-input__search|Для промышленной версии|modal-note|class="overlay"|<select/);
const footer = app.modal.innerHTML.match(/<footer class="filter-modal__footer">([\s\S]*?)<\/footer>/)[1];
assert.ok(footer.indexOf('Сохранить рассылку') < footer.indexOf('Отмена'));
assert.doesNotMatch(footer.match(/<button[^>]*data-action="confirm-schedule">([\s\S]*?)<\/button>/)[1], /<svg/);
assert.match(footer, /data-close><svg[\s\S]*?#Cross[\s\S]*?<\/svg><span>Отмена<\/span>/);
app.input('recipients', '');
app.click('confirm-schedule', '', app.modal);
assert.equal(app.state().schedules.length, 0, 'Empty recipients are still rejected');
app.input('template', 'cf-main');
app.input('recipients', 'first@example.com, shared@example.com');
app.input('frequency', 'weekly');
app.input('time', '09:15');
app.input('format', 'PDF');
app.input('subject', 'Weekly report');
app.click('confirm-schedule', '', app.modal);
counts([1, 1, 2]);
assert.doesNotMatch(app.root.innerHTML, /empty-state--illustrated/);
assert.equal(app.modal.innerHTML, '');
assert.equal(app.state().schedules[0].time, '09:15');
assert.equal(app.state().schedules[0].frequency, 'weekly');
assert.match(app.root.innerHTML, /Report &amp; &lt;test&gt;/);
assert.match(app.root.innerHTML, /class="data-block scenario-panel" data-schedule-index="0"/);
assert.match(app.root.innerHTML, /<div class="content-block"><div class="metrics-grid metrics-grid--paired"/);
assert.match(css, /\.content-block\s*\{[^}]*gap: var\(--space-4\);/);
assert.match(app.root.innerHTML, /<div class="page-title-actions"><button type="button" class="dt3-risk-toggle typography-label-smallest" aria-pressed="true"[^>]*data-schedule-toggle/);
assert.match(app.root.innerHTML, /class="dt3-risk-toggle__label">Деактивировать<\/span>/);
assert.match(app.root.innerHTML, /<\/button><span class="badge green">/);
assert.match(app.root.innerHTML, /class="scenario-copy scenario-copy--compact"/);
assert.match(app.root.innerHTML, /class="typography-caption-smallest" id="schedule-title-0"/);
assert.match(app.root.innerHTML, /class="typography-body-smallest">Description &amp; &lt;test&gt;<\/p>/);
assert.match(app.root.innerHTML, /data-filter-summary-rows="3" style="--filter-summary-rows:3"/);
assert.match(app.root.innerHTML, /data-equipment-filter-remove-value="recipients-0" data-equipment-filter-remove-item="first@example.com"/);
assert.match(app.root.innerHTML, /data-filter-summary-overflow hidden/);
assert.doesNotMatch(app.root.innerHTML, /schedule-card|schedule-actions|schedule-recipients|data-action="delete-schedule"/);
const actions = app.root.innerHTML.match(/<div class="logistics-action-list">([\s\S]*?)<\/div>/)[1];
const buttons = [...actions.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map(match => match[1]);
assert.equal(buttons.length, 3);
assert.doesNotMatch(buttons[0] + buttons[1], /<svg/);
assert.match(buttons[2], /#Pencil[\s\S]*Редактировать рассылку/);
assert.match(actions, /class="button-smallest-primary-radius typography-button-smallest"[^>]*data-action="edit-schedule"/);
app.click('new-schedule');
app.input('recipients', 'shared@example.com, second@example.com');
app.click('confirm-schedule', '', app.modal);
counts([2, 2, 3]);
app.click('schedule-info');
app.click('toggle-schedule', 0);
counts([1, 2, 3]);
assert.match(app.root.innerHTML, /dt3-risk-toggle typography-label-smallest" aria-pressed="false"/);
assert.match(app.root.innerHTML, /dt3-risk-toggle__label">Активировать<\/span><\/button><span class="badge orange">/);
assert.equal(app.ui.infoPopoverElement.hidden, true, 'Rerender closes the info attached to the old heading');
app.click('test-schedule', 1);
assert.equal(app.state().schedules.length, 2);
app.click('delete-schedule', 0);
assert.equal(app.state().schedules.length, 2, 'No card cross or unbound delete action removes a schedule');
const editTrigger = app.click('edit-schedule', 0);
assert.match(app.modal.innerHTML, /Редактировать рассылку/);
assert.match(app.modal.innerHTML, /id="schedule-recipients"[^>]*value="first@example.com, shared@example.com"/);
assert.match(app.modal.innerHTML, /id="schedule-frequency"[^>]*value="weekly"/);
assert.match(app.modal.innerHTML, /id="schedule-time"[^>]*value="09:15"/);
assert.match(app.modal.innerHTML, /id="schedule-subject"[^>]*value="Weekly report"/);
const editFooter = app.modal.innerHTML.match(/<footer class="filter-modal__footer">([\s\S]*?)<\/footer>/)[1];
assert.match(editFooter, /class="button-smallest-secondary-radius button-smallest-secondary-radius--error typography-button-smallest"[^>]*data-action="delete-schedule"/);
assert.match(editFooter, /Удалить рассылку/);
assert.doesNotMatch(editFooter, /Отмена|data-close/);
app.input('time', '10:30');
app.input('subject', 'Edited subject');
app.click('confirm-schedule', '', app.modal);
assert.equal(app.state().schedules.length, 2, 'Editing updates the existing schedule without duplicating it');
assert.equal(app.state().schedules[0].time, '10:30');
assert.equal(app.state().schedules[0].subject, 'Edited subject');
assert.equal(app.state().schedules[0].enabled, false, 'Saving preserves pause');
assert.equal(editTrigger.getAttribute('aria-expanded'), 'false');
const beforeCancel = app.state().schedules;
app.click('edit-schedule', 0);
app.input('time', '12:00');
const closeEdit = new Element(); closeEdit.dataset.close = '';
app.modal.emit('click', {target: closeEdit});
assert.deepEqual(app.state().schedules, beforeCancel, 'Closing the edit drawer neither saves nor deletes');
app.click('new-schedule');
app.click('delete-schedule', '', app.modal);
assert.equal(app.state().schedules.length, 2, 'Deletion is not available in the creation drawer');
app.click('edit-schedule', 0);
app.click('delete-schedule', '', app.modal);
counts([1, 1, 2]);
const restored = await mount('mailings', app.state());
assert.equal(restored.state().schedules.length, 1);
assert.match(restored.root.innerHTML, /shared@example.com/);
app.click('edit-schedule', 0);
app.click('delete-schedule', '', app.modal);
counts([0, 0, 0]);
emptyState(app.root.innerHTML);
const emptyTrigger = app.click('new-schedule');
assert.match(app.modal.innerHTML, /data-action="confirm-schedule"/, 'The empty-state CTA opens the existing creation flow');
const drawer = new Element(), firstControl = new Element(), lastControl = new Element(), hiddenControl = new Element();
hiddenControl.hidden = true;
drawer.querySelectorAll = () => [firstControl, hiddenControl, lastControl];
app.modal.querySelector = selector => selector === '#schedule-drawer' && app.modal.innerHTML ? drawer : null;
app.document.activeElement = lastControl;
let prevented = false;
app.document.emit('keydown', {key: 'Tab', target: lastControl, preventDefault() { prevented = true; }});
assert.equal(prevented, true);
assert.equal(firstControl.focused, true);
app.document.activeElement = firstControl;
app.document.emit('keydown', {key: 'Tab', shiftKey: true, target: firstControl, preventDefault() {}});
assert.equal(lastControl.focused, true);
app.document.emit('keydown', {key: 'Escape', target: firstControl, preventDefault() {}});
assert.equal(app.modal.innerHTML, '');
assert.equal(emptyTrigger.getAttribute('aria-expanded'), 'false');
assert.equal(emptyTrigger.focused, true);
assert.equal(app.state().schedules.length, 0);
const canceledTrigger = app.click('new-schedule');
const cancel = new Element();
cancel.dataset.close = '';
app.modal.emit('click', {target: cancel});
assert.equal(app.modal.innerHTML, '');
assert.equal(canceledTrigger.focused, true);
assert.equal(app.state().schedules.length, 0, 'Cancel never saves a draft');
app.click('new-schedule');
app.input('recipients', 'submit@example.com');
app.input('frequency', 'monthly');
app.input('time', '00:00');
app.modal.emit('submit', {target: {matches: selector => selector === '[data-schedule-form]'}, preventDefault() {}});
assert.equal(app.state().schedules.length, 1, 'Form submission uses the same save action');
assert.equal(app.state().schedules[0].frequency, 'monthly');
assert.equal(app.state().schedules[0].time, '00:00');
assert.equal(app.modal.innerHTML, '');
assert.equal(createTrigger.getAttribute('aria-expanded'), 'false');

const legacy = await mount('', {view: 'schedules', schedules: []});
assert.match(legacy.root.innerHTML, /class="app"[\s\S]*class="page-head"/);
assert.doesNotMatch(legacy.root.innerHTML, /page-title-actions/);
assert.match(html, /<main id="page-content" class="page-content"><\/main>/);
assert.doesNotMatch(html, /report-host|id="app"|report-studio\.css/);
assert.ok(html.search(/href="styles\.css\?v=\d+"/) < html.indexOf('tokens.css'), 'Corporate tokens take precedence over the remaining legacy styles');
assert.doesNotMatch(legacyCss, /\.schedule-(?:list|card|status|recipients|actions)\b/, 'Obsolete card styling and responsive grid overrides are removed');
assert.doesNotMatch(await read('assets/css/pages/enterprise.css'), /\.logistics-action-list\b/, 'The action list has one shared master');
assert.match(css, /\.logistics-action-list\s*\{[^}]*align-items: stretch;/);
const hugSelector = '.logistics-action-list .button-smallest-secondary-radius:not(.button-smallest-secondary-radius--icon),';
const hug = css.slice(css.indexOf(hugSelector), css.indexOf('}', css.indexOf(hugSelector)) + 1);
assert.match(hug, /height: auto;/);
assert.ok(css.indexOf(hugSelector) > css.indexOf('.button-smallest-secondary-radius:not(.button-smallest-secondary-radius--icon) {'), 'Hug wins over the base fixed-height rule');
assert.match(css, /\.scenario-copy--compact\s*\{[^}]*gap: var\(--space-1\);/);
assert.match(css, /\.filter-summary__pills--rows\s*\{[^}]*min-height: calc\(var\(--pill-badge-height, var\(--space-5\)\) \* var\(--filter-summary-rows\)/);
assert.match(css, /\.button-smallest-secondary-radius--error\s*\{[^}]*background: var\(--system-elements-semantic-error-secondary-fade\);[^}]*color: var\(--system-elements-semantic-error-primary\);/);
const recipientApp = await mount('mailings', {schedules: [{templateId: 'cf-main', enabled: true, recipients: ['first@example.com', 'second@example.com'], frequency: 'daily', frequencyLabel: 'Каждый день', time: '08:00', format: 'PDF'}]});
recipientApp.removeRecipient(0, 'first@example.com');
assert.deepEqual(recipientApp.state().schedules[0].recipients, ['second@example.com']);
assert.equal(recipientApp.state().schedules.length, 1, 'A pill cross removes the address, not the schedule');
recipientApp.removeRecipient(0, 'second@example.com');
assert.deepEqual(recipientApp.state().schedules[0].recipients, ['second@example.com'], 'The last recipient remains required');
assert.match((await mount('mailings', recipientApp.state())).root.innerHTML, /second@example.com/);
assert.match(css, /\.dt3-metrics\.scenario-impact\s*\{[^}]*--scenario-impact-columns: 2;[^}]*gap: var\(--space-2\);[^}]*margin: 0;/);
assert.match(css, /\.dt3-metrics\.scenario-impact > div,\s*\.metrics-grid > div\s*\{[^}]*padding: var\(--space-3\);[^}]*border: 1px solid var\(--design-elements-border-default\);/);
assert.doesNotMatch(dispatcherCss, /\.dt3-metrics\.scenario-impact\s*(?:\{|(?:div|span|strong)\s*\{)/);
assert.match(app.root.innerHTML, /class="metrics-grid metrics-grid--paired" data-metrics-for="schedule-list"/);
assert.match(css, /\.metrics-grid\s*\{[^}]*grid-template-columns: repeat\(var\(--metrics-grid-columns, 6\), minmax\(0, 1fr\)\);[^}]*gap: var\(--space-2\);/);
assert.match(css, /\.metrics-grid--paired\s*\{[^}]*gap: var\(--space-3\);/);
assert.doesNotMatch(source, /schedule-summary/);
assert.match(mailingsCss, /#page-content:has\(> \.empty-state--illustrated\)\s*\{[^}]*grid-template-rows: max-content max-content minmax\(min-content, 1fr\);[^}]*align-content: stretch;/);
assert.doesNotMatch(mailingsCss, /padding|font-size|background|height:|position:/, 'Page CSS only arranges the existing page-content tracks');
assert.match(css, /\.empty-state--illustrated\s*\{[^}]*place-items: center;[^}]*padding: var\(--space-5\);/);
assert.match(css, /\.empty-state__content\s*\{[^}]*width: min\(100%, calc\(var\(--space-6\) \* 10\)\);[^}]*justify-items: center;/);
const illustrationRule = css.match(/\.empty-state__illustration\s*\{([^}]+)\}/)[1];
assert.match(illustrationRule, /width: calc\(var\(--space-5\) \* 5\);/);
assert.doesNotMatch(illustrationRule, /margin/);
assert.match(css, /\.empty-state__title,\s*\.empty-state__description\s*\{[^}]*margin: 0;/);
const graphic = icons.match(/<symbol id="EmptyStateBox"[^>]*>([\s\S]*?)<\/symbol>/)[1];
assert.match(graphic, /fill="var\(--design-elements-illustration-secondary\)"/);
assert.match(graphic, /fill="var\(--design-elements-illustration-tertiary\)"/);
assert.match(graphic, /fill="var\(--design-elements-illustration-quarternary\)"/);
assert.doesNotMatch(graphic, /#[0-9a-fA-F]{3,8}|<image|gradient/);
for (const role of ['secondary', 'tertiary', 'quarternary']) {
  assert.equal((tokens.match(new RegExp(`--design-elements-illustration-${role}:`, 'g')) || []).length, 2, `${role} follows the light and dark guideline palettes`);
}
await assert.rejects(access(new URL('../assets/empty-state-box.png', import.meta.url)), {code: 'ENOENT'});
const version = html.match(/components\.css\?v=(\d+)/)[1];
const appVersion = html.match(/src="app\.js\?v=(\d+)"/)[1];
const uiVersion = html.match(/ui\.js\?v=(\d+)/)[1];
for (const page of (await readdir(new URL('../', import.meta.url))).filter(path => path.endsWith('.html'))) {
  const markup = await read(page);
  const componentVersion = markup.match(/components\.css\?v=(\d+)/)?.[1];
  if (componentVersion) assert.equal(componentVersion, version, page);
  const sharedUiVersion = markup.match(/ui\.js\?v=(\d+)/)?.[1];
  if (sharedUiVersion) assert.equal(sharedUiVersion, uiVersion, page);
  if (markup.includes('/legacy/report-studio-v5/')) assert.match(markup, new RegExp(`src="app\\.js\\?v=${appVersion}"`), page);
}
console.log('Mailings: shared heading, text and zoom plus, info popover, metrics, centered illustrated div-block, CTA, creation, validation, pause, deletion, persistence, legacy isolation and cache versions passed.');
