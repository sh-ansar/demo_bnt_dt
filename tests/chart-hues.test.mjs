import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const tokens = await read('assets/css/tokens.css');
const css = await read('assets/css/components.css');
const roles = ["primary","secondary","tertiary","quarternary","quinary","senary"];
const expected = {
  "blue": {
    "country": "azerbaijan",
    "colors": [
      "#0869c0",
      "#1884cc",
      "#3197d5",
      "#57b0de",
      "#82bae7",
      "#aad3ee"
    ]
  },
  "lavande": {
    "country": "kazakhstan",
    "colors": [
      "#088dbf",
      "#19a7cb",
      "#33b8d4",
      "#56c6de",
      "#7fd7e8",
      "#a3e2f0"
    ]
  },
  "orange": {
    "country": "russia",
    "colors": [
      "#be5218",
      "#d7661f",
      "#ea792a",
      "#827009",
      "#f7ab70",
      "#fcc294"
    ]
  },
  "mustard": {
    "country": "turkmenistan",
    "colors": [
      "#9f6d08",
      "#b98212",
      "#d19a20",
      "#e4b135",
      "#ecc65b",
      "#f1d57e"
    ]
  }
};
const definitions = new Map([...tokens.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
function resolveColor(name, visited = new Set()) {
  assert.ok(!visited.has(name), `No cyclic palette alias: ${name}`);
  visited.add(name);
  const value = definitions.get(name);
  assert.ok(value, `Defined color: ${name}`);
  const alias = value.match(/^var\((--[\w-]+)\)$/);
  return alias ? resolveColor(alias[1], visited) : value.toLowerCase();
}

for (const [hue, group] of Object.entries(expected)) {
  const row = css.match(new RegExp('\\.origin-breakdown__row--' + group.country + '\\s*\\{([^}]+)\\}'))?.[1];
  assert.ok(row, `Existing origin row: ${group.country}`);
  assert.doesNotMatch(row, /rgba?\(|#[\da-f]+|opacity\s*:/i, 'Rows refer to tokens without additional alpha');
  roles.forEach((role, index) => {
    const color = `--chart-color-hue-${hue}-${role}`;
    const series = `--chart-series-hue-${hue}-${role}`;
    assert.equal(resolveColor(color), group.colors[index], `Exact pre-migration RGB for ${hue}/${role}`);
    assert.equal(definitions.get(series), `color-mix(in srgb, var(${color}) 70%, transparent)`, 'Alpha is applied once');
    assert.ok(row.includes(`--origin-shade-${index + 1}: var(${series});`));
    assert.equal([...tokens.matchAll(new RegExp(color + ':', 'g'))].length, 1, 'Light and Dark share the fixed chart color');
    assert.equal([...tokens.matchAll(new RegExp(series + ':', 'g'))].length, 1, 'Light and Dark share the series alpha');
  });
}
assert.equal(definitions.get('--chart-color-hue-blue-primary'), 'var(--chart-color-deep-blue)');
assert.equal(definitions.get('--chart-color-hue-blue-quinary'), 'var(--chart-color-soft-blue)');
assert.equal(definitions.get('--chart-color-hue-orange-quarternary'), 'var(--chart-color-mustard)');

const pages = (await readdir(new URL('../', import.meta.url))).filter(name => name.endsWith('.html'));
pages.push('legacy/report-studio-v5/index.html');
for (const page of pages) {
  const html = await read(page);
  if (html.includes('assets/css/tokens.css')) assert.match(html, /tokens\.css\?v=37/);
  if (html.includes('assets/css/components.css')) assert.match(html, /components\.css\?v=336/);
}
console.log('Chart hues: four approved six-role groups, all 24 exact colors preserved, three existing aliases reused, 70% alpha applied once, fixed Light/Dark palette and synchronized consumer versions. Browser pixels excluded.');
