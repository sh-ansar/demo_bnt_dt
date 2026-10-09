import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const source = await read('assets/js/ui.js');
const frames = new Map(), observers = [], intersections = [];
let nextFrame = 0;
class Element {
  dataset = {};
  attributes = new Map();
  listeners = new Map();
  elements = [];
  animations = [];
  isConnected = true;
  visible = true;
  bounds = {top: 50, bottom: 300, left: 10, right: 700};
  textContent = '';
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type, event = {}) { for (const callback of this.listeners.get(type) || []) callback(event); }
  getAttribute(name) { return this.attributes.get(name) || null; }
  getClientRects() { return this.visible ? [this.bounds] : []; }
  getBoundingClientRect() { return this.bounds; }
  getTotalLength() { return this.length || 400; }
  matches(selector) {
    if (selector.includes('svg.chart-bars')) return !!this.chart;
    if (selector.includes('[class*=')) return !!this.grid;
    return selector.split(',').some(part => part.trim() === this.kind);
  }
  closest(selector) {
    if (selector.includes('svg.chart-bars')) return this.chart ? this : this.owner;
    if (selector === '.procurement-annual-chart__bar') return this.annualOwner;
    if (selector.includes('defs, clipPath')) return this.inDefs ? this : null;
    if (selector.includes('data-chart-motion')) return this.off ? this : null;
    return null;
  }
  querySelectorAll(selector) {
    if (selector.includes('svg.chart-bars')) return this.charts || [];
    if (selector === '[data-formatted-value]') return this.points || [];
    return this.elements;
  }
  querySelector(selector) { return selector === '[data-chart-motion-sweep]' ? this.sweep : null; }
  animate(keyframes, options) {
    const animation = {keyframes, options, effect: {getComputedTiming: () => ({progress: .5})}, cancelled: false, cancel() {this.cancelled = true; this.oncancel?.();}};
    animation.effect.target = this;
    animation.effect.setKeyframes = frames => {animation.keyframes = frames;};
    animation.currentTime = 250;
    this.animations.push(animation);
    return animation;
  }
}
const document = new Element(), window = new Element(), media = new Element();
media.matches = false;
document.readyState = 'loading';
document.body = new Element();
document.documentElement = new Element();
document.charts = [];
window.innerHeight = 900;
window.innerWidth = 1440;
window.matchMedia = query => query === 'print' ? {matches: false} : media;
window.getComputedStyle = () => ({getPropertyValue(name) {
  return name === '--chart-motion-duration' ? '650ms' : 'cubic-bezier(.22, 1, .36, 1)';
}});
const context = vm.createContext({window, document, Element, Set, Map, WeakMap,
  requestAnimationFrame(callback) {const id = ++nextFrame; frames.set(id, callback); return id;},
  cancelAnimationFrame(id) {frames.delete(id);},
  MutationObserver: class {
    constructor(callback) {this.callback = callback; observers.push(this);}
    observe(target, options) {this.target = target; this.options = options;}
    disconnect() {this.disconnected = true;}
  },
  IntersectionObserver: class {
    observed = new Set();
    constructor(callback) {this.callback = callback; intersections.push(this);}
    observe(element) {this.observed.add(element);}
    unobserve(element) {this.observed.delete(element);}
    disconnect() {this.disconnected = true;}
  }
});
vm.runInContext(source, context);
const ui = window.BNTUI;
function flush() {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach(callback => callback());
}
function chart(...kinds) {
  const root = new Element();
  root.chart = true;
  root.elements = kinds.map(kind => {
    const element = new Element();
    element.kind = kind;
    element.owner = root;
    element.parentElement = {textContent: 'Value'};
    return element;
  });
  document.charts.push(root);
  return root;
}
const bars = chart('rect', 'rect', 'rect', 'rect');
bars.elements.forEach((bar, index) => {bar.dataset = {value: index % 2 ? '-20' : '20', chartMotionAxis: index < 2 ? 'y' : 'x'};});
const donut = chart('.chart-donut__slice');
const donutFrames = [];
donut.bntDonutMotion = {update: progress => donutFrames.push(progress), restore: () => donutFrames.push('restored')};
const line = chart('.financial-chart__line', '.financial-chart__point');
const annual = chart('.procurement-annual-chart__bar', 'rect');
annual.elements[1].annualOwner = annual.elements[0];
const excluded = chart('rect');
excluded.elements[0].inDefs = true;
const hidden = chart('rect');
hidden.visible = false;
const resizeListenersBefore = window.listeners.get('resize').size;
ui.bindChartMotion();
const binding = ui.chartMotion;
ui.bindChartMotion();
assert.equal(ui.chartMotion, binding, 'Binding is idempotent');
assert.equal(observers.length, 1);
flush();
assert.deepEqual(bars.elements.map(bar => bar.animations[0].keyframes[0].clipPath), [
  'inset(100% 0 0 0)', 'inset(0 0 100% 0)', 'inset(0 100% 0 0)', 'inset(0 0 0 100%)'
]);
assert.equal(donut.elements[0].animations.length, 0, 'Slices never scale radially');
assert.equal(donutFrames[0], 0);
assert.equal(donut.animations.length, 1);
assert.deepEqual(Object.keys(donut.animations[0].keyframes[0]), [], 'The clock does not change colors, opacity or backgrounds');
assert.equal(line.elements[0].animations[0].keyframes[0].strokeDashoffset, 400);
assert.equal(line.elements[0].animations[0].keyframes[1].strokeDashoffset, 0);
assert.equal(line.elements[0].animations[0].keyframes[0].strokeDasharray, '400 400');
assert.equal(line.elements[1].animations[0].keyframes[0].opacity, 0);
assert.equal(line.elements[1].animations[0].options.delay, 650, 'Points wait until the line is drawn');
assert.equal(line.elements[1].animations[0].options.duration, 195);
const runningLine = line.elements[0].animations[0];
const runningPoint = line.elements[1].animations[0];
const replacementLine = new Element(), replacementPoint = new Element();
replacementLine.kind = '.financial-chart__line'; replacementLine.owner = line; replacementLine.length = 800;
replacementPoint.kind = '.financial-chart__point'; replacementPoint.owner = line;
replacementLine.parentElement = replacementPoint.parentElement = {textContent: 'Value'};
line.elements = [replacementLine, replacementPoint];
binding.refresh(line); flush();
assert.equal(runningLine.effect.target, replacementLine, 'A layout redraw transfers the running line effect');
assert.equal(runningPoint.effect.target, replacementPoint, 'The delayed points remain hidden after redraw');
assert.equal(runningLine.keyframes[0].strokeDasharray, '800 800', 'Stroke reveal adapts to the new path length');
assert.equal(runningLine.currentTime, 250, 'Resize does not restart the animation clock');
assert.equal(replacementLine.animations.length, 0, 'No replay on unchanged data');
runningLine.onfinish(); runningPoint.onfinish();
const completedLine = new Element(); completedLine.kind = '.financial-chart__line'; completedLine.owner = line;
completedLine.parentElement = {textContent: 'Value'};
line.elements[0] = completedLine;
binding.refresh(line); flush();
assert.equal(completedLine.animations.length, 0, 'Completed unchanged lines do not replay on resize');
assert.equal(annual.elements[0].animations.length, 1);
assert.equal(annual.elements[1].animations.length, 0, 'Nested SVG is not animated twice');
assert.equal(excluded.elements[0].animations.length, 0, 'Definitions are never treated as bars');
assert.equal(hidden.elements[0].animations.length, 0);
assert.ok(intersections[0].observed.has(hidden));
hidden.visible = true;
intersections[0].callback([{target: hidden, isIntersecting: true}]);
flush();
assert.equal(hidden.elements[0].animations.length, 1);
assert.equal(intersections[0].observed.has(hidden), false);
window.emit('resize');
flush();
assert.ok(donutFrames.includes(.5));
assert.equal(bars.elements[0].animations.length, 1, 'Resize does not replay unchanged data');
const replaced = new Element();
replaced.kind = 'rect'; replaced.owner = bars; replaced.dataset = {value: '20'}; replaced.parentElement = {textContent: ''};
bars.elements[0] = replaced;
binding.refresh(bars); flush();
assert.equal(replaced.animations.length, 0, 'Redraw or highlight does not replay unchanged values');
replaced.attributes.set('data-value', '30');
binding.refresh(bars); flush();
assert.equal(replaced.animations.length, 1, 'Changed data animates');
const dynamic = chart('rect');
observers[0].callback([{type: 'childList', target: document.body, addedNodes: [dynamic]}]);
flush();
assert.equal(dynamic.elements[0].animations.length, 1);
media.matches = true;
media.emit('change');
assert.equal(donutFrames.at(-1), 'restored');
assert.ok(dynamic.elements[0].animations[0].cancelled);
const reduced = chart('rect');
binding.refresh(reduced); flush();
assert.equal(reduced.elements[0].animations.length, 0);
media.matches = false;
const printed = chart('rect');
binding.refresh(printed); flush();
window.emit('beforeprint');
assert.ok(printed.elements[0].animations[0].cancelled);
for (const root of document.charts) for (const element of root.elements) for (const animation of element.animations) {
  assert.equal(animation.options.duration, element.matches('.financial-chart__point, circle.point') ? 195 : 650);
  assert.equal(animation.options.fill, 'backwards');
  for (const frame of animation.keyframes) assert.ok(!('strokeWidth' in frame) && !('height' in frame) && !('width' in frame));
}
binding.destroy();
assert.equal(ui.chartMotion, null);
assert.ok(observers[0].disconnected && intersections[0].disconnected);
assert.equal(window.listeners.get('resize').size, resizeListenersBefore, 'Only pre-existing listeners remain');
const donutSource = await read('assets/js/chart-donut.js');
assert.match(donutSource, /initialAngle \+ 360 \*/);
assert.match(donutSource, /Math.min\(sector.end, end\)/);
assert.doesNotMatch(donutSource, /<mask|<clipPath|mask=|data-chart-motion-sweep|data-chart-motion-x/);
assert.doesNotMatch(source, /data-chart-motion-x|transform: "scale\(0\)"/);
assert.ok(source.includes('.financial-chart__viewport > svg'), 'Standalone Plan vs Fact participates');
assert.match(ui.renderDrawerCancel(), /data-close[^]*#Cross[^]*Отмена/);
document.createElementNS = () => ({
  setAttribute() {}, getComputedTextLength() {return 0;}, remove() {}
});
vm.runInContext(donutSource, context);
const renderedPaths = [];
const rendered = {
  getBoundingClientRect: () => ({width: 640}),
  appendChild() {}, setAttribute() {}, querySelector: () => null,
  querySelectorAll: () => renderedPaths,
  set innerHTML(markup) {
    this.markup = markup;
    renderedPaths.length = 0;
    for (const [, path] of markup.matchAll(/<path class="chart-donut__slice[^"]*" d="([^"]+)"/g)) {
      renderedPaths.push({path, getAttribute() {return this.path;}, setAttribute(_name, value) {this.path = value;}});
    }
  }
};
window.BNTCharts.renderDonut({chart: rendered, legend: {}, data: [
  {label: 'A', value: 50, percent: '50%', className: 'series-positive'},
  {label: 'B', value: 50, percent: '50%', className: 'series-mustard'}
]});
const originalPaths = renderedPaths.map(path => path.path);
rendered.bntDonutMotion.update(0);
assert.ok(renderedPaths.every(path => path.path === ''));
rendered.bntDonutMotion.update(.25);
assert.notEqual(renderedPaths[0].path, '');
assert.notEqual(renderedPaths[0].path, originalPaths[0]);
assert.equal(renderedPaths[1].path, '');
rendered.bntDonutMotion.update(.5);
assert.equal(renderedPaths[0].path, originalPaths[0]);
assert.equal(renderedPaths[1].path, '');
rendered.bntDonutMotion.update(.75);
assert.notEqual(renderedPaths[1].path, '');
rendered.bntDonutMotion.restore();
assert.deepEqual(renderedPaths.map(path => path.path), originalPaths);
assert.doesNotMatch(rendered.markup, /<mask|mask=|opacity=|background:|fill="(?:white|black)"/);
assert.match(rendered.markup, /series-positive/);
assert.match(rendered.markup, /series-mustard/);
console.log('Chart motion: clockwise donut sweep, positive/negative vertical and horizontal bars, lines, nested SVG, hidden/dynamic charts, no replay on resize/highlight, reduced motion, print and cleanup passed. Browser pixels excluded.');
