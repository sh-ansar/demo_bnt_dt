import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const frames = [], observers = [], fontReady = [];

class Element {
  children = [];
  parentElement = null;
  dataset = {};
  attributes = new Map();
  classes = new Set();
  listeners = new Map();
  hidden = false;
  top = 180;
  clientHeight = 240;
  clientWidth = 624;
  scrollHeight = 600;
  scrollTop = 0;
  style = {values: new Map(), getPropertyValue(name) { return this.values.get(name) || ''; }, setProperty(name, value) { this.values.set(name, value); }};
  classList = {
    contains: name => this.classes.has(name),
    toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name)
  };
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  append(...elements) { elements.forEach(element => { element.parentElement = this; this.children.push(element); }); }
  matches(selector) {
    return selector.split(',').some(part => {
      const text = part.trim();
      if (text.startsWith('.')) return this.classes.has(text.slice(1));
      const attrs = [...text.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];
      return attrs.length > 0 && attrs.every(([, name, value]) => this.hasAttribute(name) && (value == null || this.getAttribute(name) === value));
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, handler) { const list = this.listeners.get(type) || []; list.push(handler); this.listeners.set(type, list); }
  emit(type, event = {}) { for (const handler of this.listeners.get(type) || []) { handler(event); if (event.stopped) break; } }
  dispatchEvent(event) { this.emit(event.type, event); }
  getBoundingClientRect() { return {top: this.top}; }
  getClientRects() { return this.hidden ? [] : [this.getBoundingClientRect()]; }
  focus() { document.activeElement = this; }
}
class ResizeObserver {
  targets = new Set();
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe(element) { this.targets.add(element); }
  unobserve(element) { this.targets.delete(element); }
}
class MutationObserver {
  constructor(callback) { this.callback = callback; }
  observe(element, options) { this.options = options; }
}
class CustomEvent {
  constructor(type, options) { Object.assign(this, options, {type}); }
}
const document = Object.assign(new Element(), {readyState: 'loading', documentElement: new Element()});
document.fonts = Object.assign(new Element(), {ready: {then(callback) { fontReady.push(callback); }}});
const window = Object.assign(new Element(), {
  innerHeight: 900,
  getComputedStyle: () => ({paddingLeft: '12px', paddingRight: '12px', columnGap: '12px', getPropertyValue: name => ({'--space-5': '24px', '--canvas-block-max-width': '600px'})[name] || ''})
});
vm.runInNewContext(await read('assets/js/ui.js'), {
  window, document, ResizeObserver, MutationObserver, CustomEvent, console,
  requestAnimationFrame: callback => { frames.push(callback); return frames.length; }
});
const ui = window.BNTUI;
function flush() {
  let count = 0;
  while (frames.length) { assert.ok(++count < 20, 'Workspace measurement converges'); frames.shift()(); }
}
function element(attrs = {}, classes = []) {
  const result = new Element();
  Object.entries(attrs).forEach(([name, value]) => result.setAttribute(name, value));
  classes.forEach(name => result.classes.add(name));
  return result;
}
function workspace({fill = false, dismiss = false, tabs = false} = {}) {
  const root = element({'data-workspace': '', ...(fill ? {'data-workspace-fill': ''} : {}), ...(dismiss ? {'data-workspace-dismiss': ''} : {})}, ['layout-workspace']);
  const toggle = element({'data-workspace-toggle': '', 'aria-expanded': 'true', 'data-workspace-label-open': 'Close', 'data-workspace-label-closed': 'Open'});
  const add = element({'data-workspace-open': 'library'}), close = element({'data-workspace-close': ''});
  const expanded = element({'data-workspace-expanded': ''}), collapsed = element({'data-workspace-collapsed': ''});
  const drawer = element({'data-workspace-drawer': ''}, ['layout-drawer']);
  const group = element({}, ['layout-drawer-list-group']), body = element({}, ['layout-drawer-body']);
  group.append(body); drawer.append(group); root.append(toggle, add, close, expanded, collapsed, drawer);
  const items = [], panels = [];
  if (tabs) {
    root.setAttribute('data-workspace-tab', 'library');
    for (const name of ['library', 'forms']) {
      items.push(element({'role': 'tab', 'data-workspace-tab': name}));
      panels.push(element({'data-workspace-panel': name}));
    }
    drawer.append(...items); body.append(...panels);
  }
  document.append(root);
  return {root, toggle, add, close, expanded, collapsed, drawer, group, body, items, panels};
}
function fire(type, target, key) {
  const event = {target, key, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }};
  document.emit(type, event); return event;
}
ui.bindWorkspaces(); flush();
assert.equal(observers.length, 0, 'No workspace resize observer before insertion');
const canvas = workspace({fill: true, dismiss: true, tabs: true});
const grid = element({}, ['canvas-grid']); canvas.root.append(grid);
const twin = workspace();
ui.workspaceMutations.callback(); ui.workspaceMutations.callback();
assert.equal(frames.length, 1, 'Insertion updates are batched');
flush();
assert.equal(canvas.root.style.getPropertyValue('--layout-workspace-height'), '696px');
assert.equal(twin.root.style.getPropertyValue('--layout-workspace-height'), '', 'The twin keeps its existing sizing');
assert.equal(canvas.group.classes.has('has-fade-top'), false);
assert.equal(canvas.group.classes.has('has-fade-bottom'), true);
const observer = observers[0];
assert.ok(observer.targets.has(canvas.root) && observer.targets.has(canvas.body));
assert.ok(observer.targets.has(grid), 'Drawer width changes also remeasure the inner canvas');
assert.equal(grid.style.getPropertyValue('--canvas-grid-columns'), '1');
for (const theme of ['light', 'dark']) {
  document.documentElement.dataset.theme = theme;
  for (const [width, expected] of [[320, 1], [390, 1], [624, 1], [625, 2], [1236, 2], [1237, 3], [1848, 3], [1849, 4], [2460, 4], [2461, 5]]) {
    grid.clientWidth = width;
    observer.callback(); flush();
    const columns = Number(grid.style.getPropertyValue('--canvas-grid-columns'));
    assert.equal(columns, expected, `${theme}: ${width}px canvas chooses ${expected} columns`);
    assert.ok((width - 24 - (columns - 1) * 12) / columns <= 600, 'No canvas column stretches beyond 600px');
  }
}
grid.hidden = true; grid.clientWidth = 390;
ui.updateCanvasGrid(grid);
assert.equal(grid.style.getPropertyValue('--canvas-grid-columns'), '5', 'Hidden grids retain their last measurement');
grid.hidden = false; grid.clientWidth = 0; ui.updateCanvasGrid(grid);
assert.equal(grid.style.getPropertyValue('--canvas-grid-columns'), '5', 'A temporarily zero-width grid is not rewritten');
grid.clientWidth = 1237;
ui.setWorkspaceDrawerOpen(canvas.root, false, {notify: false});
assert.equal(grid.style.getPropertyValue('--canvas-grid-columns'), '3');
grid.clientWidth = 817;
ui.setWorkspaceDrawerOpen(canvas.root, true, {notify: false});
assert.equal(grid.style.getPropertyValue('--canvas-grid-columns'), '2', 'Opening the drawer updates the available canvas tracks');
const clicks = document.listeners.get('click').length;
ui.bindWorkspaces(); flush();
assert.equal(document.listeners.get('click').length, clicks, 'Binding is idempotent');

const changes = [];
canvas.root.addEventListener('workspacechange', event => changes.push({...event.detail}));
ui.setWorkspaceTab(canvas.root, 'library');
assert.equal(canvas.items[0].getAttribute('aria-selected'), 'true');
assert.equal(canvas.items[0].tabIndex, 0);
assert.equal(canvas.panels[1].hidden, true);
fire('click', canvas.toggle);
assert.equal(canvas.root.classes.has('is-drawer-collapsed'), true);
assert.equal(canvas.drawer.hidden, true);
assert.equal(canvas.drawer.inert, true);
assert.equal(canvas.expanded.hidden, true);
assert.equal(canvas.collapsed.hidden, false);
assert.equal(canvas.toggle.getAttribute('aria-label'), 'Open');
assert.equal(canvas.toggle.getAttribute('aria-expanded'), 'false');
assert.equal(document.activeElement, canvas.toggle);
fire('click', canvas.add);
assert.equal(canvas.drawer.hidden, false);
assert.equal(canvas.drawer.inert, false);
assert.equal(canvas.toggle.getAttribute('aria-label'), 'Close');
assert.equal(canvas.toggle.getAttribute('aria-expanded'), 'true');
assert.equal(canvas.expanded.hidden, false);
assert.equal(canvas.collapsed.hidden, true);
assert.equal(document.activeElement, canvas.items[0]);
canvas.body.scrollTop = 120;
fire('click', canvas.items[1]);
assert.equal(canvas.root.dataset.workspaceTab, 'forms');
assert.equal(canvas.panels[0].hidden, true);
assert.equal(canvas.panels[1].hidden, false);
assert.equal(canvas.body.scrollTop, 0);
assert.equal(canvas.items[0].tabIndex, -1);
for (const [key, target, expected] of [['ArrowRight', 1, 0], ['End', 0, 1], ['Home', 1, 0], ['ArrowLeft', 0, 1]]) {
  fire('keydown', canvas.items[target], key);
  assert.equal(document.activeElement, canvas.items[expected]);
  assert.equal(canvas.items[expected].getAttribute('aria-selected'), 'true');
}
const count = changes.length;
ui.setWorkspaceTab(canvas.root, 'missing');
assert.equal(changes.length, count, 'Unknown tabs leave selection intact');
assert.equal(fire('keydown', canvas.body, 'ArrowRight').prevented, undefined, 'Arrow keys outside tabs do not select a tab through the root data attribute');
assert.equal(fire('click', canvas.body).prevented, undefined, 'Ordinary workspace clicks are not tab commands');
fire('keydown', twin.body, 'Escape');
assert.equal(twin.root.classes.has('is-drawer-collapsed'), false, 'The twin retains its existing Escape behavior');
const popover = element({'aria-haspopup': 'dialog', 'aria-expanded': 'true'}); canvas.drawer.append(popover);
fire('keydown', canvas.body, 'Escape');
assert.equal(canvas.drawer.hidden, false, 'An open popover has priority over closing the workspace drawer');
popover.setAttribute('aria-expanded', 'false');
fire('keydown', canvas.body, 'Escape');
assert.equal(canvas.drawer.hidden, true);
fire('click', canvas.toggle); fire('click', canvas.close);
assert.equal(canvas.drawer.hidden, true);
assert.equal(changes.at(-1).open, false);
assert.equal(changes.at(-1).tab, 'forms');

canvas.body.scrollTop = 360; fire('scroll', canvas.body);
assert.equal(canvas.group.classes.has('has-fade-top'), true);
assert.equal(canvas.group.classes.has('has-fade-bottom'), false);
for (const theme of ['light', 'dark']) {
  document.documentElement.dataset.theme = theme;
  for (const width of [390, 768, 1200, 1440, 1920]) {
    window.innerWidth = width; window.innerHeight = 800; canvas.root.top = 240;
    window.emit('resize'); flush();
    assert.equal(canvas.root.style.getPropertyValue('--layout-workspace-height'), '536px');
  }
}
canvas.root.hidden = true; canvas.root.top = 100; observer.callback(); flush();
assert.equal(canvas.root.style.getPropertyValue('--layout-workspace-height'), '536px', 'Hidden workspaces retain their last visible measurement');
canvas.root.hidden = false; fontReady.forEach(callback => callback()); flush();
assert.equal(canvas.root.style.getPropertyValue('--layout-workspace-height'), '676px', 'Font readiness remeasures visible workspaces');
document.children.splice(document.children.indexOf(canvas.root), 1);
ui.workspaceMutations.callback(); flush();
assert.ok(!observer.targets.has(canvas.root) && !observer.targets.has(canvas.body) && !observer.targets.has(grid), 'Rerendered workspaces release resize observations');

const row = ui.renderWorkspaceItem({label: 'A & <B>', caption: 'Description "C"', icon: '<svg></svg>', actionIcon: ui.icon('plus'), attributes: {'data-id': '"<value>'}});
assert.match(row, /class="layout-item" type="button"/);
assert.match(row, /A &amp; &lt;B&gt;/);
assert.match(row, /Description &quot;C&quot;/);
assert.match(row, /data-id="&quot;&lt;value&gt;"/);
assert.equal((row.match(/<button/g) || []).length, 1, 'List action is not a nested button');
assert.match(row, /stroke-width="1.5"[^]*vector-effect="non-scaling-stroke"/);
const catalogDrawer = ui.renderDrawer({id: 'catalog', title: 'Catalog', form: false, content: '<div class="layout-drawer-content"><form role="search"></form></div>'});
assert.match(catalogDrawer, /class="filter-modal" role="dialog" aria-modal="true"/);
assert.match(catalogDrawer, /<section class="filter-modal__drawer dt3-drawer"/);
assert.equal((catalogDrawer.match(/<form\b/g) || []).length, 1, 'Content drawers support a real search form without invalid nested forms');
assert.doesNotMatch(catalogDrawer, /filter-modal__fields|filter-modal__footer|novalidate/);
const fieldDrawer = ui.renderDrawer({id: 'fields', title: 'Fields', fields: '<input>', footer: '<button>Save</button>'});
assert.match(fieldDrawer, /<form class="filter-modal__drawer dt3-drawer"[^>]*novalidate/);
assert.match(fieldDrawer, /filter-modal__fields ui-scrollbar/);
assert.match(fieldDrawer, /filter-modal__footer/);

const css = await read('assets/css/components.css');
assert.ok(/\.layout-drawer \[hidden\],\s*\.layout-drawer-content \[hidden\],\s*\.layout-toolbar \[hidden\]\s*\{\s*display: none;/.test(css), 'Hidden catalog tabs and panels must stay hidden in both the workspace and the standalone drawer');
assert.match(css, /\.layout-drawer-content\s*\{[^}]*--layout-drawer-bg: var\(--background-nonoverlay-2\);[^}]*min-width: 0;[^}]*min-height: 0;[^}]*overflow: hidden;/, 'Catalog scrolling and fade use the same theme-aware surface inside and outside the workspace');
assert.match(css, /\.layout-toolbar\s*\{[^}]*min-height: 0;[^}]*padding: var\(--space-3\) 0;/, 'The toolbar hugs its controls with 12px above and below');
assert.match(css, /\.layout-toolbar-group--left\s*\{[^}]*padding: 0 var\(--space-3\);/, 'Groups do not double the toolbar vertical padding');
assert.match(css, /\.dt3-multisearch \.dt3-multisearch-field input:focus-visible\s*\{[^}]*outline: 0;[^}]*box-shadow: none;/, 'The search reset outranks workspace input focus rules');
assert.match(css, /input\[type="search"\]::-webkit-search-cancel-button,[^]*?appearance: none;[^}]*display: none;/, 'Search has only the shared clear button');
assert.match(css, /\.layout-tabs__item\s*\{[^}]*display: flex;[^}]*align-items: center;[^}]*justify-content: center;[^}]*gap: var\(--space-1\);/);
assert.match(css, /\.layout-tabs__info\s*\{[^}]*position: relative;[^}]*flex: none;/, 'Tab info buttons remain next to their labels');
assert.match(css, /\.speed-dial-secondary\.is-open\s*\{[^}]*z-index: 90;/, 'The open Actions root sits above the workspace toolbar, not only its menu');
assert.match(css, /:where\(\.payment-summary-card, \.financial-kpi, \.analytics-kpi\),\s*\.canvas-block,\s*\.canvas \.canvas-block\s*\{[^}]*padding: var\(--space-3\);[^}]*border: 1px solid var\(--design-elements-border-default\);[^}]*border-radius: var\(--space-2\);[^}]*background: var\(--background-surface-4\);[^}]*box-shadow: var\(--card-shadow\);/);
assert.match(css, /\.canvas-block\.canvas-block--static\s*\{[^}]*--canvas-block-control-size: calc\(var\(--space-5\) \+ var\(--space-2\)\);[^}]*grid-template-columns: var\(--canvas-block-control-size\) minmax\(0, 1fr\);/);
assert.match(css, /\.layout-item-icon--positive\s*\{[^}]*background: var\(--system-elements-semantic-positive-secondary-fade\);[^}]*color: var\(--system-elements-semantic-positive-primary\);/);
assert.match(css, /\.canvas \.canvas-grid\s*\{[^}]*--canvas-block-max-width: 600px;[^}]*repeat\(var\(--canvas-grid-columns, 1\), minmax\(0, 1fr\)\)/);
assert.match(css, /\.canvas \.canvas-block\s*\{[^}]*--canvas-block-label-height: calc\(var\(--typography-body-smallest-line-height\) \* 2 \+ var\(--space-1\) \/ 2\);[^}]*align-items: start;/, 'Wrapped text does not center controls over the entire taller card');
assert.match(css, /\.canvas \.canvas-block > \.button-smallest-secondary-radius\s*\{[^}]*margin-block-start: max\(0px, calc\(\(var\(--canvas-block-label-height\) - var\(--canvas-block-control-size\)\) \/ 2\)\);/);
assert.match(css, /\.layout-workspace \.layout-item-label small\s*\{[^}]*color: var\(--text-tertiary\);[^}]*font-size: var\(--typography-body-smallest-size\);/, 'Label typography outranks the later legacy canvas small selector');
assert.match(css, /\.layout-toolbar-heading > \.typography-caption-small,[^]*?font-size: var\(--typography-caption-small-size\);/, 'The canvas heading also retains its shared typography');
assert.match(css, /\.layout-workspace,[\s\S]*?grid-template-columns: minmax\(0, 1fr\) var\(--layout-drawer-width\);/);
assert.match(css, /\.layout-surface\s*\{[^}]*grid-column: 1;/);
assert.match(css, /\.layout-drawer\s*\{[^}]*grid-column: 2;/);
assert.match(css, /\.layout-surface--secondary\s*\{[^}]*background: var\(--background-secondary\);/);
assert.match(css, /\.canvas\.layout-workspace\s*\{\s*border-radius: var\(--space-2\);/, 'The canvas has the same radius on all corners');
assert.match(css, /\.canvas\.layout-workspace \.layout-toolbar\s*\{\s*grid-template-columns: minmax\(0, 1fr\) var\(--layout-drawer-width\);/, 'The canvas toolbar contains only the heading and drawer controls');
assert.match(css, /\.canvas\.layout-workspace \.layout-toolbar-group--right\s*\{\s*grid-column: 2;/);
assert.doesNotMatch(css, /\.canvas\.layout-workspace\.is-drawer-collapsed \.layout-toolbar\s*\{[^}]*auto auto;/, 'Collapsing the drawer does not shrink its toolbar track');
assert.doesNotMatch(css, /\.layout-drawer-controls > \.ui-divider--vertical|\.layout-drawer-controls:has\(> \.ui-divider--vertical\)/, 'Removed divider-specific rules do not linger');
assert.match(css, /\.layout-drawer-controls > \.ui-divider\.brand-divider\s*\{[^}]*position: absolute;[^}]*bottom: calc\(-1 \* var\(--space-3\)\);/, 'The shared horizontal divider continues the toolbar bottom, at 60px for a 36px control');
assert.match(css, /\.layout-workspace\.is-drawer-collapsed \.layout-drawer-controls > \.ui-divider\s*\{[^}]*display: none;/);
assert.match(css, /\.layout-tabs \.layout-tabs__tab\s*\{[^}]*height: auto;[^}]*min-height: calc\(var\(--space-5\) \+ var\(--space-3\)\);/, 'One-line tabs use the base size and longer labels hug their contents');
assert.match(css, /\.canvas\.layout-workspace \.layout-drawer\s*\{[^}]*inset: 0 0 0 auto;/, 'The narrow-screen drawer also opens on the right');
assert.doesNotMatch(css, /layout-workspace--drawer-left/);
assert.match(css, /\.chart-tabs,\s*\.layout-tabs/);
assert.match(await read('digital-twin.html'), /class="dt3-workspace layout-workspace" data-workspace/);
assert.match(await read('digital-twin.html'), /layout-drawer-controls[^]*?<span class="ui-divider brand-divider" aria-hidden="true"><\/span>[^]*?<div class="layout-body">/);
assert.match(await read('assets/js/pages/dispatcher-3d.js'), /BNTUI\.renderWorkspaceItem/);
assert.doesNotMatch(await read('assets/css/pages/dispatcher-3d.css'), /\.dt3-(?:toolbar|drawer-content|item|list)\s*\{/);
assert.doesNotMatch(await read('assets/css/pages/dispatcher-3d.css'), /\.layout-toolbar\s*\{[^}]*padding: 0;/, 'The twin does not undo shared toolbar padding on narrow screens');
console.log('Workspaces: shared right drawer, tabs, keyboard, ARIA, focus, sizing, fades, observation cleanup, escaped rows and unchanged twin Escape behavior passed.');
