import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const shell = await read('assets/js/shell.js');
const equipment = await read('assets/js/pages/equipment.js');
const twin = await read('assets/js/pages/dispatcher-3d.js');
const routeSource = shell.slice(shell.indexOf('  function routeHref('), shell.indexOf('  function navigationLink('));
const document = {readyState: 'loading', addEventListener() {}};
const window = {addEventListener() {}};
const context = vm.createContext({window, document, currentYear: 2026, isStaticPreview: true});
vm.runInContext(await read('assets/js/ui.js'), context);
vm.runInContext(await read('assets/js/data/assets.js'), context);
vm.runInContext(await read('assets/js/data/assets-hierarchy.js'), context);
vm.runInContext(routeSource, context);
window.BNTShell = {routeHref: context.routeHref};
context.ui = window.BNTUI;
context.escape = value => context.ui.escape(value);
context.emptyCell = '<span>empty</span>';
context.baseByInternal = new Map(window.BNT_DATA.assets.map(asset => [asset.internal, asset]));
context.baseByCode = new Map(window.BNT_DATA.assets.map(asset => [asset.code, asset]));
vm.runInContext(equipment.slice(equipment.indexOf('  function shortName('), equipment.indexOf('  const assets = normalizeHierarchyRows(')), context);
vm.runInContext(equipment.split('\n').find(line => line.includes('const statusTone =')), context);
vm.runInContext(equipment.slice(equipment.indexOf('  function passportAction('), equipment.indexOf('  function syncStickyHeaderScrollOffset(')), context);
vm.runInContext(equipment.slice(equipment.indexOf('  function attentionCard('), equipment.indexOf('  function render()')), context);
const rows = context.normalizeHierarchyRows(window.BNT_DATA.assetsHierarchy);
const mapped = rows.filter(item => item.detailId);
assert.ok(mapped.length > 0);
assert.ok(mapped.some(item => item.tone === 'red'), 'The attention card includes a registered high-risk asset');
for (const staticPreview of [true, false]) {
  context.isStaticPreview = staticPreview;
  for (const item of mapped) {
    const expected = `/equipment-detail${staticPreview ? '.html' : ''}?id=${encodeURIComponent(item.detailId)}`;
    assert.ok(window.BNT_DATA.assets.some(asset => asset.id === item.detailId));
    assert.ok(context.passportAction(item).includes(`href="${expected}"`));
    assert.ok(context.attentionCard(item).includes(`href="${expected}"`), 'Attention cards use the same asset and route adapter');
  }
}
assert.equal(context.passportAction({detailId: ''}), context.emptyCell);
assert.equal(context.routeHref('/'), '/');
context.isStaticPreview = true;
assert.equal(context.routeHref('/equipment-detail.html?id=pump101'), '/equipment-detail.html?id=pump101');

const hierarchySource = (await read('assets/3d/hierarchy.js')).replace(/^import[^\n]+\n/, '').replace(/^export /gm, '');
context.tankZone = () => 'west';
context.buildings = [];
vm.runInContext(hierarchySource, context);
const hierarchy = context.createHierarchy([{id: 3, cat: 0, fill: .5}, {id: 16, cat: 0, fill: .5}], window.BNT_DATA.assets);
const passportActionSource = twin.split('\n').find(line => line.trim().startsWith('if(asset)actionItems='));
assert.ok(passportActionSource);
context.actionIcons = {};
for (const asset of window.BNT_DATA.assets) {
  assert.equal(hierarchy.get(asset.id).asset, asset, 'Twin nodes retain the registered asset identity');
  context.asset = hierarchy.get(asset.id).asset;
  vm.runInContext(passportActionSource, context);
  assert.equal(context.actionItems[0].label, 'Паспорт');
  assert.equal(context.actionItems[0].href, `/equipment-detail.html?id=${encodeURIComponent(asset.id)}`);
}
assert.equal(hierarchy.get('r-16-pump').asset, undefined, 'Illustrative nodes do not fabricate registered passports');
for (const [path, script] of [['equipment.html', 'equipment.js'], ['equipment-detail.html', 'equipment-detail.js'], ['digital-twin.html', 'dispatcher-3d.js']]) {
  const html = await read(path);
  assert.ok(html.indexOf('assets/js/shell.js') < html.indexOf(`assets/js/pages/${script}`), 'Shared route adapter loads before consumers');
}

const toir = await read('assets/js/pages/toir.js');
const fields = [];
const definitions = {'work-order': {title: 'Task', submit: 'Create', fields: [['asset', 'Asset', 'Default'], ['date', 'Date', '2026-10-08']]}};
const initial = JSON.stringify(definitions);
const drawer = vm.createContext({
  definitions, activeFormId: '', formDrawer: {hidden: true}, formDrawerTitle: {}, formDrawerFields: {},
  formDrawerForm: {setAttribute() {}, querySelector() { return null; }},
  formDrawerSubmit: {querySelector() { return {}; }},
  closeFilter() {}, closeQualityDetail() {}, closeQualityFilter() {},
  requestAnimationFrame: callback => callback(),
  drawerField: field => { fields.push(field); return ''; }
});
vm.runInContext(toir.slice(toir.indexOf('  function openForm('), toir.indexOf('  function closeFormDrawer(')), drawer);
drawer.openForm('work-order', {asset: 'Насос Н-102'});
assert.equal(fields[0][2], 'Насос Н-102');
assert.equal(fields[1][2], '2026-10-08');
assert.equal(drawer.formDrawer.hidden, false);
assert.equal(drawer.activeFormId, 'work-order');
assert.equal(JSON.stringify(definitions), initial, 'Passing the asset does not mutate form defaults');
fields.length = 0;
drawer.openForm('work-order');
assert.equal(fields[0][2], 'Default');
assert.match(toir, /openForm\(requested,\{asset:params\.get\("asset"\)\|\|""\}\)/);
console.log('Equipment navigation: registry, attention cards and twin share selected-asset passports in static and routed previews; task drawer keeps the chosen asset.');
