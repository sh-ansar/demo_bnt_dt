import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/ui.js', import.meta.url), 'utf8');
const start = source.indexOf('  chartScale('), end = source.indexOf('  renderFinancialLineChart(', start);
assert.ok(start > 0 && end > start);
const ui = vm.runInNewContext(`({${source.slice(start, end)}})`);

function check(minimum, maximum, options) {
  const scale = ui.chartScale(minimum, maximum, options);
  assert.ok(Number.isInteger(scale.step) && scale.step >= 1, 'The axis step is a positive integer');
  assert.ok(Number.isInteger(scale.min) && Number.isInteger(scale.max));
  assert.ok(scale.min <= Math.min(minimum, maximum, 0));
  assert.ok(scale.max >= Math.max(minimum, maximum, 0));
  const count = Math.round((scale.max - scale.min) / scale.step);
  const ticks = Array.from({length: count + 1}, (_, index) => scale.min + index * scale.step);
  assert.ok(ticks.includes(0), 'Zero is a labelled grid tick, not just an unlabelled axis');
  for (let index = 1; index < ticks.length; index++) assert.equal(ticks[index] - ticks[index - 1], scale.step);
  assert.ok(!Object.is(scale.min, -0));
  return {...scale};
}

assert.deepEqual(check(-281.57, 2675.87), {step: 1000, min: -1000, max: 3000});
assert.deepEqual(check(0, 8219.55), {step: 3000, min: 0, max: 12000});
assert.deepEqual(check(0, .01), {step: 1, min: 0, max: 4});
assert.deepEqual(check(0, 1837500, {step: 200000}), {step: 200000, min: 0, max: 2000000});
assert.deepEqual(check(-.1, .1, {step: .25}), {step: 1, min: -1, max: 1});
for (const minimum of [-8127.65, -600, -3, -.001, -0, 0, .01, 37, 2675.87]) {
  for (const maximum of [-10, 0, .001, .8, 40, 8219.55, 12607345]) {
    for (const intervals of [1, 2, 4, 6]) check(minimum, maximum, {intervals});
  }
}
for (const step of [0, -3, NaN, Infinity]) check(-12.7, 194.35, {step});
assert.deepEqual({...ui.chartScale(NaN, Infinity)}, {step: 1, min: 0, max: 4});
const bars = await readFile(new URL('../assets/js/chart-stacked-bars.js', import.meta.url), 'utf8');
assert.match(bars, /window\.BNTUI\.chartScale\(rawMin, rawMax, \{step: options\.tickStep\}\)/);
assert.doesNotMatch(bars, /function roundedScale/);
console.log('Chart scales: shared integer steps, proportional intervals, zero, negative and tiny values, explicit steps and nonfinite inputs passed.');
