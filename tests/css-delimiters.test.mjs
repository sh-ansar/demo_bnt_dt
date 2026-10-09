import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';

function checkDelimiters(css, path) {
  const stack = [];
  const pairs = {')': '(', ']': '[', '}': '{'};
  let quote = '', comment = false, line = 1;
  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    if (character === '\n') line += 1;
    if (comment) {
      if (character === '*' && css[index + 1] === '/') { comment = false; index += 1; }
      continue;
    }
    if (character === '\\') { index += 1; continue; }
    if (quote) {
      if (character === quote) quote = '';
      continue;
    }
    if (character === '/' && css[index + 1] === '*') { comment = true; index += 1; continue; }
    if (character === '"' || character === "'") { quote = character; continue; }
    if ('([{'.includes(character)) stack.push({character, line});
    else if (pairs[character]) {
      const opening = stack.pop();
      assert.equal(opening?.character, pairs[character], `${path}:${line}: ${character} does not close ${opening?.character ?? 'anything'} at line ${opening?.line ?? line}`);
    }
  }
  assert.equal(quote, '', `${path}: unclosed string`);
  assert.equal(comment, false, `${path}: unclosed comment`);
  assert.deepEqual(stack, [], `${path}: unclosed delimiters`);
}

// A custom property's unclosed function can swallow every following chart rule.
const brokenPill = '.pill { --padding: min(2px, max(0px, calc((24px - 20px) / 2)); } .chart { fill: blue; }';
assert.throws(() => checkDelimiters(brokenPill, 'regression'), /does not close/);
checkDelimiters(brokenPill.replace('/ 2));', '/ 2)));'), 'fixed regression');
checkDelimiters('.icon::before { content: "[(}\\\""; background: url("data:image/svg+xml,<svg>()</svg>"); /* ([{ */ }', 'quoted delimiters');

async function cssFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) files.push(...await cssFiles(path));
    else if (entry.name.endsWith('.css')) files.push(path);
  }
  return files;
}

const files = [
  ...await cssFiles(new URL('../assets/css/', import.meta.url)),
  new URL('../legacy/report-studio-v5/styles.css', import.meta.url)
];
for (const path of files) checkDelimiters(await readFile(path, 'utf8'), path.pathname);
console.log(`CSS delimiters: ${files.length} stylesheets, broken pill regression, strings, escapes and comments passed.`);
