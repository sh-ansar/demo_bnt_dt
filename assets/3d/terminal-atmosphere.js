import * as T from 'three';
import {Sky} from './vendor/Sky.js';
import {ImprovedNoise} from './vendor/ImprovedNoise.js';
import {terminalSceneTheme} from './theme.js';

const heightFogShader = `
uniform vec3 terminalFogColor;
uniform float terminalFogTop;
uniform float terminalFogDepth;
uniform float terminalFogDensity;
uniform float terminalFogRange;
uniform highp sampler3D terminalFogMap;
uniform vec3 terminalFogWind;
uniform float terminalFogThreshold;
uniform float terminalFogSoftness;
uniform float terminalFogOpacity;
uniform float terminalFogSteps;
uniform float terminalFogRelief;
uniform vec4 terminalFogFootprint;
uniform float terminalFogFoundationTop;
uniform float terminalFogFoundationBottom;
uniform float terminalFogEdgeWidth;
uniform float terminalFogEdgeRise;
uniform float terminalFogEdgeDensity;

float terminalFogEdgeMask(vec3 point) {
  vec2 center = (terminalFogFootprint.xy + terminalFogFootprint.zw) * 0.5;
  vec2 halfSize = (terminalFogFootprint.zw - terminalFogFootprint.xy) * 0.5;
  vec2 offset = abs(point.xz - center) - halfSize;
  float distanceToEdge = length(max(offset, 0.0)) + min(max(offset.x, offset.y), 0.0);
  return 1.0 - smoothstep(terminalFogEdgeWidth * 0.2, terminalFogEdgeWidth, abs(distanceToEdge));
}

bool terminalFogInsideCore(vec3 point) {
  return all(greaterThanEqual(point.xz, terminalFogFootprint.xy + terminalFogEdgeWidth)) &&
    all(lessThanEqual(point.xz, terminalFogFootprint.zw - terminalFogEdgeWidth));
}

vec2 terminalFogBoxInterval(vec3 delta, vec3 boxMin, vec3 boxMax) {
  vec3 safeDelta = mix(vec3(0.000001), delta, step(vec3(0.000001), abs(delta)));
  vec3 a = (boxMin - cameraPosition) / safeDelta;
  vec3 b = (boxMax - cameraPosition) / safeDelta;
  vec3 nearPoint = min(a, b), farPoint = max(a, b);
  return vec2(max(0.0, max(nearPoint.x, max(nearPoint.y, nearPoint.z))),
    min(1.0, min(farPoint.x, min(farPoint.y, farPoint.z))));
}

// A deep mist bed meets the same raymarched cloud field on sky and foundation.
float terminalFogBedOpacity(vec3 endpoint) {
  vec3 delta = endpoint - cameraPosition;
  float bedTop = terminalFogTop - terminalFogDepth * 0.85;
  float distanceToPoint = length(delta);
  float entry = 0.0;
  float exitPoint = 1.0;
  if (abs(delta.y) < 0.0001) {
    if (cameraPosition.y >= bedTop) return 0.0;
  } else {
    float crossing = (bedTop - cameraPosition.y) / delta.y;
    if (delta.y < 0.0) entry = max(0.0, crossing);
    else exitPoint = min(1.0, crossing);
  }
  if (entry >= exitPoint) return 0.0;
  float startDepth = max(0.0, bedTop - cameraPosition.y - delta.y * entry);
  float endDepth = max(0.0, bedTop - cameraPosition.y - delta.y * exitPoint);
  float averageDensity = (startDepth + endDepth) * 0.5 / terminalFogDepth;
  float opticalDepth = distanceToPoint * (exitPoint - entry) * terminalFogDensity * averageDensity;
  return 1.0 - exp(-opticalDepth);
}

vec4 terminalFog(vec3 endpoint) {
  vec3 delta = endpoint - cameraPosition;
  float floorY = terminalFogTop - terminalFogDepth * 1.5;
  float entry = 0.0;
  float exitPoint = 1.0;
  if (abs(delta.y) < 0.0001) {
    if (cameraPosition.y >= terminalFogTop || cameraPosition.y < floorY) {
      entry = 1.0;
      exitPoint = 0.0;
    }
  } else {
    vec2 crossings = vec2(terminalFogTop, floorY) - cameraPosition.y;
    crossings /= delta.y;
    entry = max(0.0, min(crossings.x, crossings.y));
    exitPoint = min(1.0, max(crossings.x, crossings.y));
  }
  vec3 edgeMin = vec3(terminalFogFootprint.x - terminalFogEdgeWidth,
    terminalFogFoundationBottom - terminalFogEdgeRise * 2.0, terminalFogFootprint.y - terminalFogEdgeWidth);
  vec3 edgeMax = vec3(terminalFogFootprint.z + terminalFogEdgeWidth,
    terminalFogFoundationTop + terminalFogEdgeRise, terminalFogFootprint.w + terminalFogEdgeWidth);
  vec2 edgeInterval = terminalFogBoxInterval(delta, edgeMin, edgeMax);
  // A ray contained in the convex inner footprint cannot encounter the edge band.
  if (edgeInterval.x < edgeInterval.y &&
    !(terminalFogInsideCore(cameraPosition + delta * edgeInterval.x) &&
      terminalFogInsideCore(cameraPosition + delta * edgeInterval.y))) {
    if (entry >= exitPoint) {
      entry = edgeInterval.x;
      exitPoint = edgeInterval.y;
    } else {
      entry = min(entry, edgeInterval.x);
      exitPoint = max(exitPoint, edgeInterval.y);
    }
  }
  vec4 accumulated = vec4(0.0);
  if (entry < exitPoint) {
    float stepSize = (exitPoint - entry) / terminalFogSteps;
    float stepLength = length(delta) * stepSize;
    for (int i = 0; i < 113; i++) {
      if (float(i) >= terminalFogSteps || accumulated.a >= 0.98) break;
      vec3 point = cameraPosition + delta * (entry + (float(i) + 0.5) * stepSize);
      float edgeMask = terminalFogEdgeMask(point);
      if (point.y >= terminalFogTop && edgeMask <= 0.0) continue;
      vec3 uv = point / (terminalFogDepth * vec3(6.0, 2.0, 6.0)) + terminalFogWind;
      float field = textureLod(terminalFogMap, uv, 0.0).r;
      float density = smoothstep(terminalFogThreshold - terminalFogSoftness,
        terminalFogThreshold + terminalFogSoftness, field);
      float edgeCeiling = terminalFogFoundationTop + terminalFogEdgeRise * mix(0.45, 1.0, density);
      float edgeDensity = edgeMask * (1.0 - smoothstep(terminalFogFoundationTop - terminalFogEdgeRise * 0.25,
        edgeCeiling, point.y));
      edgeDensity *= smoothstep(terminalFogFoundationBottom - terminalFogEdgeRise * 2.0,
        terminalFogFoundationBottom, point.y) * mix(0.65, 1.0, density);
      float surfaceDepth = (terminalFogTop - point.y) / terminalFogDepth - (1.0 - density) * terminalFogRelief;
      density *= smoothstep(0.0, 0.35, surfaceDepth);
      float extinction = density * terminalFogOpacity * 8.0 / terminalFogDepth + edgeDensity * terminalFogEdgeDensity;
      float opacity = 1.0 - exp(-extinction * stepLength);
      float shading = field - textureLod(terminalFogMap, uv + vec3(0.0, 0.03, 0.0), 0.0).r;
      float lighting = clamp(0.9 + shading * 1.5, 0.65, 1.15);
      float contribution = (1.0 - accumulated.a) * opacity;
      accumulated.rgb += contribution * terminalFogColor * lighting;
      accumulated.a += contribution;
    }
  }
  float bedContribution = (1.0 - accumulated.a) * terminalFogBedOpacity(endpoint);
  accumulated.rgb += bedContribution * terminalFogColor;
  accumulated.a += bedContribution;
  if (accumulated.a > 0.0) accumulated.rgb /= accumulated.a;
  return accumulated;
}
`;

const nightSkyShader = `
uniform float terminalSkyExposure;
uniform float terminalNight;
uniform vec3 terminalNightColor;
uniform vec3 terminalNightTint;
uniform float terminalNightTintStrength;

float terminalStarHash(vec2 cell) {
  return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
}

float terminalStars(vec3 direction) {
  if (direction.y <= 0.0) return 0.0;
  vec2 uv = vec2(atan(direction.z, direction.x) / 6.2831853 + 0.5,
    asin(clamp(direction.y, -1.0, 1.0)) / 3.1415927 + 0.5) * vec2(512.0, 256.0);
  vec2 cell = floor(uv);
  vec2 center = vec2(terminalStarHash(cell + 17.0), terminalStarHash(cell + 59.0));
  float radius = 0.04 + terminalStarHash(cell + 97.0) * 0.03;
  float antialias = max(0.015, length(fwidth(uv)) * 0.4);
  float disc = 1.0 - smoothstep(radius, radius + antialias, length(fract(uv) - center));
  float brightness = 0.4 + 0.6 * terminalStarHash(cell + 131.0);
  return step(0.985, terminalStarHash(cell)) * disc * brightness * smoothstep(0.0, 0.12, direction.y);
}
`;

function createFogTexture() {
  const size = 64, data = new Uint8Array(size ** 3), perlin = new ImprovedNoise();
  let index = 0;
  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const scale = 6.4 / size;
    const broad = perlin.noise(x * scale / 1.5, y * scale, z * scale / 1.5);
    const detail = perlin.noise(x * scale * 2 + 13, y * scale * 2, z * scale * 2 + 7);
    data[index++] = T.MathUtils.clamp((128 + 110 * broad + 24 * detail) * 0.65, 0, 255);
  }
  const texture = new T.Data3DTexture(data, size, size, size);
  texture.format = T.RedFormat;
  texture.minFilter = texture.magFilter = T.LinearFilter;
  texture.wrapS = texture.wrapT = texture.wrapR = T.MirroredRepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

export function createTerminalAtmosphere({exposure, fogTop, fogDepth, far, foundationBounds}) {
  const fogTexture = createFogTexture();
  const attachedMaterials = new WeakSet();
  const foundationDepth = foundationBounds.max.y - foundationBounds.min.y;
  const nightTintStrength = 0.08;
  const luminance = color => color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  const nightTint = new T.Color(terminalSceneTheme.sky.dark);
  nightTint.multiplyScalar(1 / luminance(nightTint));
  const nightColor = new T.Color(terminalSceneTheme.sky.light);
  nightColor.lerp(nightTint.clone().multiplyScalar(luminance(nightColor)), nightTintStrength);
  const sky = new Sky();
  sky.name = 'terminal-sky';
  sky.scale.setScalar(10000);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  const uniforms = sky.material.uniforms;
  Object.assign(uniforms, {
    terminalSkyExposure: {value: 0.0535 / exposure},
    terminalNight: {value: 0},
    terminalNightColor: {value: nightColor},
    terminalNightTint: {value: nightTint},
    terminalNightTintStrength: {value: nightTintStrength},
    terminalFogColor: {value: new T.Color(terminalSceneTheme.fog.light)},
    terminalFogTop: {value: fogTop},
    terminalFogDepth: {value: fogDepth},
    terminalFogDensity: {value: 0.018},
    terminalFogRange: {value: far},
    terminalFogMap: {value: fogTexture},
    terminalFogWind: {value: new T.Vector3()},
    terminalFogThreshold: {value: 0.29},
    terminalFogSoftness: {value: 0.17},
    terminalFogOpacity: {value: 0.16},
    terminalFogSteps: {value: 113},
    terminalFogRelief: {value: 0.45},
    terminalFogFootprint: {value: new T.Vector4(foundationBounds.min.x, foundationBounds.min.z,
      foundationBounds.max.x, foundationBounds.max.z)},
    terminalFogFoundationTop: {value: foundationBounds.max.y},
    terminalFogFoundationBottom: {value: foundationBounds.min.y},
    terminalFogEdgeWidth: {value: foundationDepth},
    terminalFogEdgeRise: {value: foundationDepth * 0.3},
    terminalFogEdgeDensity: {value: 0.56},
    terminalMoonSkyLight: {value: 0.045},
    terminalMoonCloudLight: {value: 0.065}
  });
  uniforms.turbidity.value = 5.6;
  uniforms.rayleigh.value = 1.562;
  uniforms.mieCoefficient.value = 0.015;
  uniforms.mieDirectionalG.value = 0.543;
  uniforms.cloudCoverage.value = 0.36;
  uniforms.cloudDensity.value = 0.48;
  uniforms.cloudElevation.value = 0.76;
  const daylightDirection = new T.Vector3().setFromSphericalCoords(1,
    T.MathUtils.degToRad(90 - 58.2), T.MathUtils.degToRad(-91.4));
  const nightDirection = new T.Vector3().setFromSphericalCoords(1,
    T.MathUtils.degToRad(108), T.MathUtils.degToRad(-91.4));
  uniforms.sunPosition.value.copy(daylightDirection);

  // Keep the vendor shader intact; stars are blended before its cloud layer.
  sky.material.fragmentShader = heightFogShader + nightSkyShader + `
    uniform float terminalMoonSkyLight;
    uniform float terminalMoonCloudLight;
  ` + sky.material.fragmentShader
    .replace('// Clouds', `
      texColor *= terminalSkyExposure;
      texColor = mix(texColor, terminalNightTint * dot(texColor, vec3(0.2126, 0.7152, 0.0722)),
        terminalNight * terminalNightTintStrength);
      texColor += terminalNight * terminalNightColor *
        (terminalMoonSkyLight * mix(0.65, 1.0, smoothstep(0.0, 0.65, direction.y)) + terminalStars(direction) * 0.7);
      // Clouds`)
    .replace('cloudColor *= vSunE * 0.00002;', `
      cloudColor *= vSunE * 0.00002 * terminalSkyExposure;
      cloudColor += terminalNight * terminalNightColor * terminalMoonCloudLight;`)
    .replace('gl_FragColor = vec4( texColor, 1.0 );', `
      vec3 fogEndpoint = cameraPosition + direction * terminalFogRange;
      vec4 lowerFog = terminalFog(fogEndpoint);
      gl_FragColor = vec4(mix(texColor, lowerFog.rgb, lowerFog.a), 1.0);`);

  function attachMaterial(material) {
    if (!material?.isMeshStandardMaterial || attachedMaterials.has(material)) return;
    attachedMaterials.add(material);
    const previous = material.onBeforeCompile;
    const cacheKey = material.customProgramCacheKey();
    material.onBeforeCompile = function (shader, renderer) {
      previous.call(this, shader, renderer);
      for (const name of Object.keys(uniforms).filter(name => name.startsWith('terminalFog'))) {
        shader.uniforms[name] = uniforms[name];
      }
      shader.vertexShader = 'varying vec3 terminalFogPosition;\n' + shader.vertexShader
        .replace('#include <project_vertex>', `
          vec4 terminalPosition = vec4(transformed, 1.0);
          #ifdef USE_BATCHING
            terminalPosition = batchingMatrix * terminalPosition;
          #endif
          #ifdef USE_INSTANCING
            terminalPosition = instanceMatrix * terminalPosition;
          #endif
          terminalFogPosition = (modelMatrix * terminalPosition).xyz;
          #include <project_vertex>`);
      shader.fragmentShader = 'varying vec3 terminalFogPosition;\n' + heightFogShader + shader.fragmentShader
        .replace('#include <tonemapping_fragment>', `
          vec4 lowerFog = terminalFog(terminalFogPosition);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, lowerFog.rgb, lowerFog.a);
          #include <tonemapping_fragment>`);
    };
    material.customProgramCacheKey = () => cacheKey + '|terminal-volume-fog-v4';
    material.needsUpdate = true;
  }

  function attach(root) {
    root.traverse(object => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) attachMaterial(material);
    });
  }

  function setTheme(mode) {
    const night = mode === 'dark';
    uniforms.terminalNight.value = night ? 1 : 0;
    uniforms.terminalSkyExposure.value = (night ? 1.05 : 0.0535) / exposure;
    uniforms.terminalFogColor.value.set(terminalSceneTheme.fog[night ? 'dark' : 'light']);
    if (night) uniforms.terminalFogColor.value.copy(uniforms.terminalNightColor.value)
      .multiplyScalar(uniforms.terminalMoonCloudLight.value);
    uniforms.sunPosition.value.copy(night ? nightDirection : daylightDirection);
    uniforms.showSunDisc.value = night ? 0 : 1;
  }

  function update(time, width) {
    uniforms.time.value = time;
    uniforms.terminalFogWind.value.set(time * 0.001, 0, time * 0.0006);
    uniforms.terminalFogSteps.value = width < 700 ? 64 : 113;
  }

  return {sky, daylightDirection, attachMaterial, attach, setTheme, update,
    dispose: () => fogTexture.dispose()};
}
