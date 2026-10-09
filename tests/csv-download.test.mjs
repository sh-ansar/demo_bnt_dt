import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
let blob, clicked = 0, removed = 0, timeout;
const revoked = [];
const link = {click() { clicked++; }, remove() { removed++; }};
const document = {
  readyState: 'loading', addEventListener() {},
  createElement(tag) { assert.equal(tag, 'a'); return link; },
  body: {appendChild(value) { assert.equal(value, link); }}
};
const window = {addEventListener() {}, setTimeout(callback, delay) { timeout = {callback, delay}; }};
const url = {createObjectURL(value) { blob = value; return 'blob:test'; }, revokeObjectURL(value) { revoked.push(value); }};
vm.runInNewContext(await read('assets/js/ui.js'), {window, document, Blob, URL: url});
const rows = [['Заголовок', 'Value'], ['Name;"quoted"\nnext', null], []];
const before = JSON.stringify(rows);
window.BNTUI.downloadCsv('report.csv', rows);
const bytes = new Uint8Array(await blob.arrayBuffer());
assert.deepEqual([...bytes.slice(0, 3)], [239, 187, 191], 'UTF-8 BOM supports Cyrillic in spreadsheets');
assert.equal(blob.type, 'text/csv;charset=utf-8');
assert.equal(await blob.text(), '"Заголовок";"Value"\r\n"Name;""quoted""\nnext";""\r\n');
assert.equal(link.download, 'report.csv');
assert.equal(link.href, 'blob:test');
assert.equal(clicked, 1);
assert.equal(removed, 1);
assert.equal(timeout.delay, 1000);
assert.equal(revoked.length, 0, 'Do not revoke before the browser starts downloading');
timeout.callback();
assert.deepEqual(revoked, ['blob:test']);
assert.equal(JSON.stringify(rows), before);
link.click = () => { throw new Error('download failed'); };
assert.throws(() => window.BNTUI.downloadCsv('report.csv', rows), /download failed/);
assert.equal(removed, 2, 'Temporary links are removed even if clicking fails');
timeout.callback();
assert.deepEqual(revoked, ['blob:test', 'blob:test']);
const procurement = await read('assets/js/pages/procurement.js');
assert.match(procurement, /ui\.downloadCsv\("procurement-tenders-actions-2026\.csv", \[\.\.\.tenderRows, \[\], \.\.\.actionRows\]\)/);
assert.doesNotMatch(procurement, /function csvCell|createObjectURL/, 'Procurement reuses the common export instead of duplicating it');
console.log('CSV export: quoted cells, multiline values, Cyrillic BOM, unchanged data, download and cleanup; procurement reuses the shared helper.');
