import {registerHooks} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
registerHooks({resolve(specifier, context, next) {
  return specifier === 'three'
    ? {url: pathToFileURL(root + 'assets/3d/vendor/three.module.js').href, shortCircuit: true}
    : next(specifier, context);
}});
const T = await import('three');
const {createTerminalAtmosphere} = await import('../assets/3d/terminal-atmosphere.js');
const {terminalSceneTheme} = await import('../assets/3d/theme.js');
const foundationBounds = new T.Box3(new T.Vector3(-300, -20.19, -200), new T.Vector3(280, -0.19, 190));
const atmosphere = createTerminalAtmosphere({exposure: 1.05, fogTop: -2.59, fogDepth: 50, far: 1800, foundationBounds});
const material = atmosphere.sky.material;
const uniforms = material.uniforms;

for (const [name, value] of Object.entries({turbidity: 5.6, rayleigh: 1.562,
  mieCoefficient: 0.015, mieDirectionalG: 0.543, cloudCoverage: 0.36,
  cloudDensity: 0.48, cloudElevation: 0.76})) {
  assert.equal(uniforms[name].value, value, name + ' matches the supplied reference');
}
assert.equal(uniforms.terminalSkyExposure.value * 1.05, 0.0535,
  'The reference sky exposure is independent of model exposure');
assert(Math.abs(T.MathUtils.radToDeg(Math.asin(uniforms.sunPosition.value.y)) - 58.2) < 1e-9);
assert.equal(uniforms.terminalNight.value, 0);
assert(uniforms.terminalFogTop.value < 0, 'Fog remains below the terrain');
assert.equal(uniforms.terminalFogColor.value.getHexString(), terminalSceneTheme.fog.light.slice(1));
for (const name of material.fragmentShader.matchAll(/uniform (?:highp )?\w+ (terminal\w+);/g)) {
  assert(uniforms[name[1]], 'Every atmosphere uniform is bound: ' + name[1]);
}
assert(material.fragmentShader.indexOf('texColor += terminalNight') < material.fragmentShader.indexOf('// Clouds'),
  'Cloud compositing also covers stars');
assert.match(material.fragmentShader, /texColor \*= terminalSkyExposure/);
assert.match(material.fragmentShader, /terminalFog\(fogEndpoint\)/);
assert.match(material.fragmentShader, /if \(direction.y <= 0.0\) return 0.0/);
assert.match(material.fragmentShader, /fwidth\(uv\)/, 'Star edges use screen-space antialiasing');

const foundation = new T.MeshStandardMaterial();
let previousCompileCalled = false;
foundation.onBeforeCompile = () => {previousCompileCalled = true;};
atmosphere.attachMaterial(foundation);
const shader = {uniforms: T.UniformsUtils.clone(T.ShaderLib.standard.uniforms),
  vertexShader: T.ShaderLib.standard.vertexShader, fragmentShader: T.ShaderLib.standard.fragmentShader};
foundation.onBeforeCompile(shader, {});
assert(previousCompileCalled, 'Existing material hooks are preserved');
assert.equal(shader.uniforms.terminalFogTop, uniforms.terminalFogTop, 'Foundation and sky share one fog layer');
assert.match(shader.vertexShader, /terminalFogPosition = \(modelMatrix \* terminalPosition\).xyz/);
assert.match(shader.vertexShader, /terminalPosition = instanceMatrix \* terminalPosition/,
  'Instanced geometry uses actual world coordinates, not its shared local vertex');
assert.match(shader.vertexShader, /terminalPosition = batchingMatrix \* terminalPosition/);
assert(shader.fragmentShader.indexOf('terminalFog(terminalFogPosition)') < shader.fragmentShader.indexOf('#include <tonemapping_fragment>'));
assert.equal(shader.uniforms.terminalFogMap, uniforms.terminalFogMap, 'Sky and slab use one volume density texture');
const texture = uniforms.terminalFogMap.value;
assert(texture.isData3DTexture);
assert.equal(texture.image.data.length, 64 ** 3);
assert.equal(texture.format, T.RedFormat);
assert.equal(texture.minFilter, T.LinearFilter);
assert.equal(texture.wrapR, T.MirroredRepeatWrapping, 'Density fades continuously across mirrored volume cells');
assert(new Set(texture.image.data).size > 100, 'The fog contains varied, deterministic volumetric density');
assert.equal(uniforms.terminalFogThreshold.value, 0.29);
assert.equal(uniforms.terminalFogSoftness.value, 0.17);
assert.equal(uniforms.terminalFogOpacity.value, 0.16);
assert.equal(uniforms.terminalFogSteps.value, 113);
assert(uniforms.terminalFogFootprint.value.equals(new T.Vector4(-300, -200, 280, 190)));
assert.equal(uniforms.terminalFogFoundationTop.value, foundationBounds.max.y);
assert.equal(uniforms.terminalFogFoundationBottom.value, foundationBounds.min.y);
assert.equal(uniforms.terminalFogEdgeWidth.value, 20);
assert.equal(uniforms.terminalFogEdgeRise.value, 6);
assert(uniforms.terminalFogEdgeDensity.value > uniforms.terminalFogOpacity.value * 8 / uniforms.terminalFogDepth.value,
  'Edge mist is denser than the distant lower cloud layer');
assert.match(material.fragmentShader, /textureLod\(terminalFogMap, uv, 0.0\)/);
assert.match(material.fragmentShader, /accumulated.a >= 0.98/);
assert.equal(uniforms.terminalFogRelief.value, 0.45);
assert.match(material.fragmentShader, /surfaceDepth = \(terminalFogTop - point.y\) \/ terminalFogDepth - \(1.0 - density\) \* terminalFogRelief/,
  'Density shapes rounded cloud tops below the terrain instead of a flat surface');
assert.match(material.fragmentShader, /smoothstep\(0.0, 0.35, surfaceDepth\)/,
  'The raised surface keeps soft edges');
assert(uniforms.terminalMoonCloudLight.value > uniforms.terminalMoonSkyLight.value,
  'Moonlit clouds remain lighter than the night sky');

const attachedHook = foundation.onBeforeCompile;
atmosphere.attachMaterial(foundation);
assert.equal(foundation.onBeforeCompile, attachedHook, 'Shared materials are wrapped only once');
const modelRoot = new T.Group(), solid = new T.MeshStandardMaterial(), overlay = new T.MeshBasicMaterial();
const overlayHook = overlay.onBeforeCompile;
modelRoot.add(new T.Mesh(new T.BoxGeometry(), [solid, overlay]));
atmosphere.attach(modelRoot);
assert.notEqual(solid.onBeforeCompile, overlayHook, 'Solid geometry participates in fog occlusion');
assert.equal(overlay.onBeforeCompile, overlayHook, 'Selection overlays are not blurred');
const solidShader = {uniforms: {}, vertexShader: T.ShaderLib.standard.vertexShader, fragmentShader: T.ShaderLib.standard.fragmentShader};
solid.onBeforeCompile(solidShader, {});
assert.equal(solidShader.uniforms.terminalFogFootprint, uniforms.terminalFogFootprint);

// Reference for the signed rectangular perimeter: zero influence in the central footprint.
const smoothstep = (a, b, x) => {const t = T.MathUtils.clamp((x - a) / (b - a), 0, 1);return t * t * (3 - 2 * t);};
function edgeMask(x, z) {
  const box = uniforms.terminalFogFootprint.value;
  const dx = Math.abs(x - (box.x + box.z) * 0.5) - (box.z - box.x) * 0.5;
  const dz = Math.abs(z - (box.y + box.w) * 0.5) - (box.w - box.y) * 0.5;
  const distance = Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
  const width = uniforms.terminalFogEdgeWidth.value;
  return 1 - smoothstep(width * 0.2, width, Math.abs(distance));
}
assert.equal(edgeMask(0, 0), 0, 'The center remains clear');
assert.equal(edgeMask(-300, 0), 1);
assert.equal(edgeMask(280, 0), 1);
assert.equal(edgeMask(0, -200), 1);
assert.equal(edgeMask(0, 190), 1);
assert.equal(edgeMask(-300, -200), 1, 'Corner seams dissolve in the same field');
assert.equal(edgeMask(-275, 0), 0, 'The mist fades away inside the terrain');
assert(edgeMask(-290, 0) > 0 && edgeMask(-290, 0) < 1);
assert(edgeMask(-310, 0) > 0 && edgeMask(-310, 0) < 1, 'Outside and inside edges use a continuous transition');
assert.equal(edgeMask(-325, 0), 0, 'The edge band does not spread over the whole sky');
assert.match(material.fragmentShader, /edgeCeiling = terminalFogFoundationTop \+ terminalFogEdgeRise/);
assert.match(material.fragmentShader, /terminalFogInsideCore\(cameraPosition \+ delta \* edgeInterval.x\)/,
  'Clear central rays bypass the additional volume loop');

function edgeDensity(point, cloud) {
  const top = uniforms.terminalFogFoundationTop.value, bottom = uniforms.terminalFogFoundationBottom.value;
  const rise = uniforms.terminalFogEdgeRise.value;
  const ceiling = top + rise * (0.45 + 0.55 * cloud);
  return edgeMask(point.x, point.z) * (1 - smoothstep(top - rise * 0.25, ceiling, point.y)) *
    smoothstep(bottom - rise * 2, bottom, point.y) * (0.65 + cloud * 0.35);
}
function edgeOpacity(from, to, cloud) {
  const delta = to.clone().sub(from), steps = 113, stepLength = delta.length() / steps;
  let opticalDepth = 0;
  for (let i = 0; i < steps; i++) opticalDepth += edgeDensity(from.clone().addScaledVector(delta, (i + 0.5) / steps), cloud) *
    uniforms.terminalFogEdgeDensity.value * stepLength;
  return 1 - Math.exp(-opticalDepth);
}
const edgeCamera = new T.Vector3(-400, 25, 0);
for (const cloud of [0, 0.5, 1]) {
  assert(edgeOpacity(edgeCamera, new T.Vector3(-300, -10, 0), cloud) > 0.85,
    'The visible side face dissolves even between denser cloud puffs');
  assert(edgeOpacity(edgeCamera, new T.Vector3(-300, -0.19, 0), cloud) > 0.5,
    'Fog also veils the sharp upper contour');
  assert.equal(edgeOpacity(edgeCamera, new T.Vector3(0, 5, 0), cloud), 0,
    'A normal overview ray to central equipment remains clear');
  assert.equal(edgeDensity(new T.Vector3(-300, 10, 0), cloud), 0, 'Perimeter mist does not extend into the upper sky');
}

// Numerical reference for the deep mist bed below the raymarched cloud layer.
function opacity(fromY, toY, length) {
  const top = uniforms.terminalFogTop.value - uniforms.terminalFogDepth.value * 0.85;
  const dy = toY - fromY;
  let entry = 0, exit = 1;
  if (Math.abs(dy) < 0.0001) {
    if (fromY >= top) return 0;
  } else {
    const crossing = (top - fromY) / dy;
    if (dy < 0) entry = Math.max(0, crossing);
    else exit = Math.min(1, crossing);
  }
  if (entry >= exit) return 0;
  const density = (Math.max(0, top - fromY - dy * entry) + Math.max(0, top - fromY - dy * exit)) * 0.5 / uniforms.terminalFogDepth.value;
  return 1 - Math.exp(-length * (exit - entry) * uniforms.terminalFogDensity.value * density);
}
assert.equal(opacity(60, 0, 400), 0, 'The terrain and equipment are not obscured');
assert.equal(opacity(60, 100, 1000), 0, 'Sky above the horizon is clear of lower fog');
assert.equal(opacity(0, 0, 1000), 0, 'Horizontal rays above the layer remain clear');
assert(opacity(60, -600, 1800) > 0.99, 'The space underneath dissolves into fog');
assert(opacity(60, -20.19, 350) < 0.1, 'Most of the slab remains readable');
assert(Math.abs(opacity(60, -50, 600) - opacity(-50, 60, 600)) < 1e-9);
for (const from of [-60, -45.09, 0, 100]) for (const to of [-600, -45.09, 0, 200]) {
  const value = opacity(from, to, 500);
  assert(Number.isFinite(value) && value >= 0 && value <= 1);
}

atmosphere.update(10, 1440);
assert.equal(uniforms.time.value, 10);
assert(uniforms.terminalFogWind.value.distanceTo(new T.Vector3(0.01, 0, 0.006)) < 1e-12);
const pausedWind = uniforms.terminalFogWind.value.clone();
atmosphere.update(10, 390);
assert(uniforms.terminalFogWind.value.equals(pausedWind), 'Resizing does not change paused cloud positions');
assert.equal(uniforms.terminalFogSteps.value, 64, 'Mobile limits volume sample cost');
atmosphere.update(10, 1440);
assert.equal(uniforms.terminalFogSteps.value, 113);

atmosphere.setTheme('dark');
assert.equal(uniforms.terminalNight.value, 1, 'Mood enables stars and softer nighttime ambient color');
assert.equal(uniforms.terminalSkyExposure.value, 1);
assert(uniforms.sunPosition.value.y < 0 && uniforms.showSunDisc.value === 0);
assert(shader.uniforms.terminalFogColor.value.equals(uniforms.terminalFogColor.value));
const upperCloudColor = uniforms.terminalNightColor.value.clone().multiplyScalar(uniforms.terminalMoonCloudLight.value);
assert(uniforms.terminalFogColor.value.equals(upperCloudColor), 'Upper and lower night clouds share their moonlit color');
const previousNightFog = new T.Color(terminalSceneTheme.fog.dark).lerp(uniforms.terminalNightColor.value, 0.12);
function luminance(color) {return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;}
const originalNightColor = new T.Color(terminalSceneTheme.sky.light);
assert.equal(uniforms.terminalNightTintStrength.value, 0.08, 'Only a slight blue tint is added');
assert(Math.abs(luminance(uniforms.terminalNightTint.value) - 1) < 1e-12,
  'The existing dark-sky palette is normalized, not used as an exposure change');
assert(Math.abs(luminance(uniforms.terminalNightColor.value) - luminance(originalNightColor)) < 1e-12,
  'Moonlit cloud and fog brightness stays unchanged');
assert(uniforms.terminalNightColor.value.b / uniforms.terminalNightColor.value.r > originalNightColor.b / originalNightColor.r,
  'Night clouds and fog become slightly bluer');
assert.match(material.fragmentShader, /terminalNight \* terminalNightTintStrength/,
  'The base sky tint is inactive during daylight');
assert(luminance(uniforms.terminalFogColor.value) < luminance(previousNightFog) * 0.6,
  'Night fog is darker than the old daylight-tinted gray blanket');
atmosphere.setTheme('light');
assert.equal(uniforms.terminalNight.value, 0, 'Stars are hidden during daylight');
assert.equal(uniforms.terminalSkyExposure.value * 1.05, 0.0535);
assert.equal(uniforms.terminalFogColor.value.getHexString(), terminalSceneTheme.fog.light.slice(1),
  'Returning to daylight restores the original fog color');
let textureDisposed = false;
texture.addEventListener('dispose', () => {textureDisposed = true;});
atmosphere.dispose();
assert(textureDisposed, 'The 3D density texture is explicitly released');
foundation.dispose();material.dispose();atmosphere.sky.geometry.dispose();
solid.dispose();overlay.dispose();modelRoot.children[0].geometry.dispose();
console.log('Atmosphere: unchanged daytime reference, moonlit clouds, stars, shared raymarched volume, soft raised fog, mobile sampling, pause and disposal passed. GPU rendering excluded.');
