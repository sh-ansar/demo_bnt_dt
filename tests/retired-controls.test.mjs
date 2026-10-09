import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const retiredSelector = /\.(?:btn(?:-(?:primary|secondary|danger))?|icon-btn|field(?:-grow)?)(?=[\s.:,{\[)]|$)/m;
for (const path of ['assets/css/components.css', 'assets/css/shell-v91.css', 'assets/css/layout.css', 'assets/css/pages/report-studio.css', 'assets/css/pages/enterprise.css', 'assets/js/ui.js']) {
  assert.doesNotMatch(await read(path), retiredSelector, `${path}: no retired global selector`);
}

const retiredMarkup = /class=["'](?:[^"']*\s)?(?:btn(?:-(?:primary|secondary|danger))?|icon-btn|field(?:-grow)?)(?=\s|["'])/;
const pages = (await readdir(new URL('../', import.meta.url))).filter(path => path.endsWith('.html'));
for (const path of pages) assert.doesNotMatch(await read(path), retiredMarkup, `${path}: shared control markup`);
for (const name of await readdir(new URL('../assets/js/pages/', import.meta.url))) {
  if (name.endsWith('.js')) assert.doesNotMatch(await read(`assets/js/pages/${name}`), retiredMarkup, `${name}: shared control markup`);
}

const css = await read('assets/css/components.css');
for (const selector of ['button-small', 'button-small--primary', 'button-small--secondary', 'button-smallest-primary-radius', 'button-smallest-secondary-radius', 'button-smallest-secondary-radius--icon', 'form-input']) {
  assert.ok(css.includes(`.${selector} {`), `${selector}: retained master`);
}
assert.match(await read('assets/js/ui.js'), /:has\(> a:is\(\[role='button'\], \.button-small, \.button-smallest-secondary-radius, \.button-smallest-primary-radius\)\)/);
console.log('Retired controls: unused global styles and aliases removed; active page markup retains shared buttons, forms and table action sizing. Corporate report/drawer renders checked by integration suites.');
