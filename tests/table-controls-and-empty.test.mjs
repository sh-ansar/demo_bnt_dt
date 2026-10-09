import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const css = await read('assets/css/components.css');
const tokens = await read('assets/css/tokens.css');
const source = await read('assets/js/ui.js');
const document = {readyState: 'loading', addEventListener() {}};
const window = {addEventListener() {}};
vm.runInNewContext(source, {window, document, console});
const ui = window.BNTUI;

const badgeScope = ':is(table, [role="table"], .data-table, .analytics-table)';
const rule = selector => {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, selector);
  return css.slice(start, css.indexOf('}', start) + 1);
};
assert.match(tokens, /--table-badge-max-width: 280px;/);
assert.match(rule(`${badgeScope} .badge`), /width: max-content;[\s\S]*max-width: var\(--table-badge-max-width\);[\s\S]*white-space: nowrap;[\s\S]*overflow-wrap: normal;/);
assert.match(rule(`${badgeScope} .badge__label`), /overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap;/);
assert.match(rule('.badge'), /white-space: normal;[\s\S]*overflow-wrap: anywhere;/, 'Outside tables the approved multiline badge remains unchanged');
assert.match(css, /:is\(\.data-table, \.analytics-table\) td:is\([\s\S]*?:has\(> button:not\(\.data-table__tree-toggle\)\)[\s\S]*?\)\s*\{\s*width: 1%;\s*white-space: nowrap;/);
assert.match(rule(':is(.data-table, .analytics-table) td.data-table__empty-cell[colspan]'), /width: auto;[\s\S]*min-width: 0;[\s\S]*max-width: none;/, 'The empty colspan never inherits the tree first-column width');

const escaped = ui.renderEmptyTableRow(11, 'A & <B>');
assert.match(escaped, /^<tr data-table-empty><td class="data-table__empty-cell" colspan="11">/);
assert.ok(escaped.includes(ui.renderEmptyState('A & <B>', {size: 'smallest'})), 'Use the existing Empty, not a table-only visual copy');
assert.match(escaped, /#EmptyStateBox/);
assert.match(escaped, /width="96" height="96"/);
assert.match(escaped, /typography-body-smallest/);
assert.doesNotMatch(escaped, /<B>|<button|empty-state__title/);
for (const [input, expected] of [[0, 1], [-3, 1], [2.8, 2], [NaN, 1], [Infinity, 1]]) {
  assert.ok(ui.renderEmptyTableRow(input).includes(`colspan="${expected}"`));
}

function makeRow(spans = [1], {visible = true, empty = false} = {}) {
  return {
    cells: spans.map(colSpan => ({colSpan})),
    getClientRects: () => visible ? [{}] : [],
    hasAttribute: name => name === 'data-table-empty' && empty,
  };
}
function makeBody(rows = [], message = '') {
  return {
    rows, dataset: {tableEmptyMessage: message}, writes: 0,
    querySelector() { return this.rows.find(row => row.hasAttribute('data-table-empty')) || null; },
    insertAdjacentHTML(position, markup) {
      assert.equal(position, 'beforeend');
      this.writes++;
      const row = makeRow([Number(markup.match(/colspan="(\d+)"/)[1])], {empty: true});
      row.markup = markup;
      row.remove = () => { this.rows.splice(this.rows.indexOf(row), 1); };
      this.rows.push(row);
    },
  };
}
function makeTable(headings, bodies, {visible = true, message = ''} = {}) {
  const table = {
    headings, tBodies: bodies, dataset: {tableEmptyMessage: message},
    get rows() { return [...this.headings, ...this.tBodies.flatMap(body => body.rows)]; },
    matches: selector => selector === '.data-table, .analytics-table',
    getClientRects: () => visible ? [{}] : [],
  };
  return {table, querySelector: selector => selector === ':scope > table' ? table : null};
}

const body = makeBody();
const table = makeTable([makeRow([1, 1, 1, 1])], [body]);
ui.updateTableEmptyState(table);
assert.equal(body.rows.length, 1);
assert.equal(body.rows[0].cells[0].colSpan, 4);
assert.ok(body.rows[0].markup.includes('Нет данных'));
ui.updateTableEmptyState(table);
assert.equal(body.writes, 1, 'Repeated binding never duplicates or rewrites the placeholder');
table.table.headings[0].cells.pop();
ui.updateTableEmptyState(table);
assert.equal(body.rows[0].cells[0].colSpan, 3, 'The placeholder follows the current header column count');
const populated = makeRow([1, 1, 1]);
body.rows.push(populated);
ui.updateTableEmptyState(table);
assert.deepEqual(body.rows, [populated], 'New data removes only the owned placeholder');
body.rows.length = 0;
ui.updateTableEmptyState(table);
assert.equal(body.rows.length, 1, 'Filtering back to zero restores the shared Empty');

const customBody = makeBody([], 'По выбранным фильтрам активы не найдены');
const custom = makeTable([makeRow([3, 2])], [customBody]);
ui.updateTableEmptyState(custom);
assert.equal(customBody.rows[0].cells[0].colSpan, 5, 'Grouped headers span all columns');
assert.ok(customBody.rows[0].markup.includes('По выбранным фильтрам активы не найдены'));
const hiddenRow = makeRow([1, 1], {visible: false});
const filteredBody = makeBody([hiddenRow]);
ui.updateTableEmptyState(makeTable([makeRow([1, 1])], [filteredBody]));
assert.equal(filteredBody.rows.length, 2);
assert.equal(filteredBody.rows[0], hiddenRow, 'Hidden data is retained for clearing the filter');
hiddenRow.getClientRects = () => [{}];
ui.updateTableEmptyState(makeTable([makeRow([1, 1])], [filteredBody]));
assert.deepEqual(filteredBody.rows, [hiddenRow]);

const closedBody = makeBody();
ui.updateTableEmptyState(makeTable([makeRow([1, 1])], [closedBody], {visible: false}));
assert.equal(closedBody.writes, 0, 'Hidden tables are updated when opened, not while closed');
const fallbackBody = makeBody();
ui.updateTableEmptyState(makeTable([makeRow([1, 1])], [fallbackBody], {message: '<Missing>'}));
assert.ok(fallbackBody.rows[0].markup.includes('&lt;Missing&gt;'));
assert.match(source, /querySelectorAll\("\.table-wrap"\)\.forEach\(wrap => \{\s*this\.updateTableEmptyState\(wrap\);\s*this\.updateTableColumns\(wrap\);\s*this\.updateTableViewport\(wrap\);/);
assert.match(await read('assets/js/pages/equipment.js'), /ui\.renderEmptyTableRow\(11, "По выбранным фильтрам активы не найдены"\)/);
assert.match(await read('assets/js/pages/toir.js'), /ui\.renderEmptyTableRow\(7,"Нет работ по выбранным условиям"\)/);
assert.match(await read('legacy/report-studio-v5/app.js'), /window\.BNTUI\.renderEmptyTableRow\(headers\.length \+ 2, 'Нет данных'\)/);
console.log('Tables: 280px hug badges with ellipsis, content-sized command columns, shared Empty in legacy and blank tbody states, escaping, header spans, filtering and idempotent binding passed. Browser rendering excluded.');
