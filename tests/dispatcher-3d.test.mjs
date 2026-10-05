import {registerHooks} from 'node:module';import {pathToFileURL,fileURLToPath} from 'node:url';import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
registerHooks({resolve(specifier,context,next){return specifier==='three'?{url:pathToFileURL(root+'assets/3d/vendor/three.module.js').href,shortCircuit:true}:next(specifier,context);}});
const {createTerminalScene}=await import(pathToFileURL(root+'assets/3d/terminal-scene-realistic.js'));
const T=await import('three');
const {createHierarchy}=await import(pathToFileURL(root+'assets/3d/hierarchy.js'));
const context={window:{}};vm.runInNewContext(fs.readFileSync(root+'assets/js/data/assets.js','utf8'),context);
const documentStub={addEventListener(){},removeEventListener(){},hidden:false};
let resizeScene;
Object.assign(global,{devicePixelRatio:1,matchMedia:()=>({matches:true}),document:documentStub,ResizeObserver:class{constructor(callback){resizeScene=callback;}observe(){}disconnect(){}},cancelAnimationFrame(){}});
let nextFrame, rendered, camera;global.requestAnimationFrame=fn=>{nextFrame=fn;return 1;};
const listeners={};const dom={style:{},clientWidth:900,clientHeight:700,ownerDocument:documentStub,getRootNode:()=>documentStub,addEventListener(name,fn){listeners[name]=fn;},removeEventListener(){},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:900,height:700}),remove(){}};
const renderer={domElement:dom,shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(s,c){rendered=s;camera=c;}};
const container={clientWidth:900,clientHeight:700,append(){},dataset:{},dispatchEvent(){}};
const chosen=[];const app=createTerminalScene(container,id=>chosen.push(id),()=>renderer);const nodes=createHierarchy(app.tanks,context.window.BNT_DATA.assets);app.bind(nodes);
app.select('terminal',false);nextFrame(1000);assert.equal(app.tanks.length,80);
function assertSkyInOpeningView(){
 rendered.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const skyRay=new T.Raycaster();skyRay.setFromCamera(new T.Vector2(0,.95),camera);
 assert(skyRay.ray.direction.y>0,'The opening view must show sky above the horizon, not only the lower hemisphere');
 const hit=skyRay.intersectObjects(rendered.children,true).find(item=>visible(item.object));
 assert(hit?.object.isSky,'The upper opening frame must expose the sky without model occlusion');
}
assertSkyInOpeningView();
const openingPosition=camera.position.clone();
const {plan}=await import(pathToFileURL(root+'assets/3d/site-plan.js'));
const [openingX,openingZ]=plan(805,505);
assert(Math.abs(camera.position.distanceTo(new T.Vector3(openingX,0,openingZ))-Math.hypot(12,192,267))<1e-8,'Opening framing preserves the previous camera distance');
const horizon=new T.Vector3(openingX,camera.position.y,openingZ).project(camera);
const originalHorizonY=Math.tan(T.MathUtils.degToRad(camera.fov*.325))/Math.tan(T.MathUtils.degToRad(camera.fov/2));
const previousHorizonY=Math.tan(T.MathUtils.degToRad(camera.fov*.24))/Math.tan(T.MathUtils.degToRad(camera.fov/2));
const loweringRatio=(previousHorizonY-horizon.y)/(originalHorizonY-previousHorizonY);
assert(horizon.y>0&&loweringRatio>=1.5&&loweringRatio<=2,
 'The next horizon adjustment is 1.5-2 times the previous lowering');
function allMeshes(){const a=[];rendered.traverse(o=>{if(o.isMesh)a.push(o)});return a;}
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
for(const id of ['west','tankp3','pump101','pump101-motor','r-16','east','r-49','r-49-pump','rail','service','terminal']){app.select(id);for(let i=0;i<60;i++)nextFrame(1100+i*16);assert.equal(container.dataset.selectedId,id);assert(camera.position.toArray().every(Number.isFinite));}
app.select('pump101');nextFrame(3000);assert(allMeshes().some(m=>m.userData.entityId==='pump101'&&visible(m)));assert(allMeshes().filter(m=>m.userData.entityId==='r-49-pump').every(m=>!visible(m)));
app.setFill('tankp3',0);assert.equal(app.tanks[2].body.visible,false);app.setFill('tankp3',100);assert.equal(app.tanks[2].fill,1);app.select('terminal');assert.equal(app.tanks[2].roof.visible,true);
app.select('pump101');for(let i=0;i<120;i++)nextFrame(4000+i*16);rendered.updateMatrixWorld(true);camera.updateMatrixWorld(true);
const meshes=allMeshes().filter(m=>m.userData.entityId==='pump101');const point=new T.Box3().setFromObject(meshes[0].parent).getCenter(new T.Vector3()).project(camera);
listeners.pointerdown({clientX:(point.x+1)*450,clientY:(1-point.y)*350});listeners.pointerup({clientX:(point.x+1)*450,clientY:(1-point.y)*350});assert(chosen.includes('pump101'),'Model click selects the pump');
app.view('top');app.view('port');app.zoom(.8);assert.equal(app.theme(),false);assert.equal(app.theme(),true);

const {terminalSceneTheme}=await import(pathToFileURL(root+'assets/3d/theme.js'));
const sky=rendered.getObjectByName('terminal-sky'),uniforms=sky.material.uniforms;
const foundation=rendered.getObjectByName('terminal-foundation');
const foundationBounds=new T.Box3().setFromObject(foundation);
const [minX,minZ]=plan(-40,-70),[maxX,maxZ]=plan(1260,800);
assert.equal(foundation.geometry.groups.length,6,'The platform has a top, bottom and four side faces');
assert(Math.abs(foundationBounds.max.y+.19)<1e-6,'Foundation thickness extends downward without moving the terrain');
assert(Math.abs(foundationBounds.min.y+20.19)<1e-6);
for(const [actual,expected] of [[foundationBounds.min.x,minX],[foundationBounds.min.z,minZ],[foundationBounds.max.x,maxX],[foundationBounds.max.z,maxZ]])assert(Math.abs(actual-expected)<1e-4);
assert(uniforms.terminalFogTop.value>foundationBounds.min.y&&uniforms.terminalFogTop.value<foundationBounds.max.y,
 'Raised fog reaches the side of the slab but never covers its terrain');
assert.equal(uniforms.terminalFogDepth.value,foundation.geometry.parameters.height*2.5,
 'The lower cloud volume and its world-space forms expand 2.5 times without changing foundation geometry');
assert(uniforms.terminalFogFoundationTop.value+uniforms.terminalFogEdgeRise.value>foundationBounds.max.y,
 'Perimeter mist rises slightly above the slab, unlike the lower background layer');
assert(Math.abs(uniforms.terminalFogFootprint.value.x-foundationBounds.min.x)<1e-4);
assert(Math.abs(uniforms.terminalFogFootprint.value.w-foundationBounds.max.z)<1e-4);
const foggedMaterials=new Set();
for(const mesh of allMeshes())for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
 if(!material.isMeshStandardMaterial||foggedMaterials.has(material))continue;
 foggedMaterials.add(material);
 const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
 material.onBeforeCompile(shader,{});
 assert.equal(shader.uniforms.terminalFogFootprint,uniforms.terminalFogFootprint,
  'Terrain, water, instanced geometry and newly bound equipment share the same perimeter fog');
 if(mesh.isInstancedMesh)assert.match(shader.vertexShader,/terminalPosition = instanceMatrix \* terminalPosition/);
 if(shader.uniforms.waveTime)assert.match(shader.fragmentShader,/float ripple=/,'Water animation survives fog attachment');
}
assert(foggedMaterials.size>10);
const hemisphere=rendered.children.find(o=>o.isHemisphereLight),sun=rendered.children.find(o=>o.isDirectionalLight);
assert(sky.isSky&&sky.material.isShaderMaterial,'The official atmospheric shader is present');
assert.equal(T.REVISION,'185','The Sky addon and core share the same revision');
assert.equal(sky.material.side,T.BackSide);
assert.equal(sky.material.depthWrite,false);
assert.equal(sky.material.fog,false,'Distant fog must not flatten the sky shader');
assert.equal(sky.frustumCulled,false,'The large dome must survive camera far-plane culling');
assert(sky.scale.x>camera.far&&sky.renderOrder<0);
assert(uniforms.sunPosition.value.y>0&&uniforms.showSunDisc.value===1);
assert(uniforms.sunPosition.value.distanceTo(sun.position.clone().normalize())<1e-10,'Daylight and shadow directions agree');
assert(uniforms.cloudCoverage.value>0&&uniforms.cloudDensity.value>0);
const daylight={hemisphere:hemisphere.intensity,sun:sun.intensity,sunColor:sun.color.getHex()};
assert.equal(app.setTheme('dark'),false);
assert(uniforms.sunPosition.value.y<0&&uniforms.showSunDisc.value===0,'Night hides the sun below the horizon');
assert(Math.abs(uniforms.sunPosition.value.length()-1)<1e-10);
assert(hemisphere.intensity>0&&hemisphere.intensity<daylight.hemisphere,'Night remains readable without daytime ambient lighting');
assert(sun.intensity>0&&sun.intensity<daylight.sun);
assert.equal(hemisphere.intensity,1.1,'Moonlight keeps the model readable');
assert.equal(sun.intensity,.75);
assert.equal(rendered.fog.color.getHexString(),terminalSceneTheme.fog.dark.slice(1));
assert.equal(app.setTheme('light'),true);
assert.equal(hemisphere.intensity,daylight.hemisphere);
assert.equal(sun.intensity,daylight.sun);
assert.equal(sun.color.getHex(),daylight.sunColor);
assert.equal(rendered.children.filter(o=>o.isSky).length,1,'Theme changes reuse the sky rather than allocating new geometry');
const cloudTime=uniforms.time.value;
const fogWind=uniforms.terminalFogWind.value.clone();
nextFrame(7000);assert.equal(uniforms.time.value,cloudTime,'Reduced motion keeps clouds still');
assert(uniforms.terminalFogWind.value.equals(fogWind),'Reduced motion also pauses the lower cloud volume');
assert.equal(app.pause(),true);nextFrame(7100);assert(uniforms.time.value>cloudTime,'Clouds animate with scene movement');
assert.equal(app.pause(),false);const pausedTime=uniforms.time.value;nextFrame(7200);assert.equal(uniforms.time.value,pausedTime);
documentStub.hidden=true;nextFrame(7300);assert.equal(uniforms.time.value,pausedTime);documentStub.hidden=false;
app.select('terminal');
for(let index=0;index<180;index++)nextFrame(7400+index*16);
assert(camera.position.distanceTo(openingPosition)<.06,'Returning to the terminal restores the sky-visible overview');
for(const [index,[width,height]] of [[1440,900],[390,640],[900,700]].entries()){
 container.clientWidth=width;container.clientHeight=height;resizeScene();nextFrame(10400+index*16);
 assert.equal(camera.aspect,width/height);
 assert.equal(uniforms.terminalFogSteps.value,width<700?64:113,'Volume sampling adapts to the viewport');
 assert(sky.position.equals(camera.position),'The camera always stays inside the sky at desktop and mobile sizes');
 assert(camera.position.toArray().every(Number.isFinite));
 assertSkyInOpeningView();
}
let frameTime=10500;
for(const [width,height] of [[1440,900],[390,640]]){
 container.clientWidth=width;container.clientHeight=height;resizeScene();
 for(const id of ['west','east','rail','service']){
  app.select(id);for(let index=0;index<180;index++)nextFrame(frameTime+=16);
  camera.updateMatrixWorld(true);rendered.updateMatrixWorld(true);
  let helper;rendered.traverse(o=>{if(o.type==='Box3Helper')helper=o;});
  const bounds=helper.box,points=[];
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new T.Vector3(x,y,z).project(camera));
  const center=bounds.getCenter(new T.Vector3()),distance=camera.position.distanceTo(center);
  if(distance<999)for(const point of points)assert(Math.abs(point.x)<.81&&Math.abs(point.y)<.81,'Zone bounds fit the viewport: '+id+' '+width);
  else{
   assert(Math.abs(distance-1000)<.06,'Very wide zones respect the existing orbit distance limit');
   assert(Math.abs(center.clone().project(camera).x)<.001,'Capped views retain their zone center');
  }
  const direction=camera.position.clone().sub(center).normalize();
  assert(Math.abs(T.MathUtils.radToDeg(Math.asin(direction.y))-camera.fov*.09)<.02,'Zone focus preserves the lowered horizon');
 }
}
container.clientWidth=900;container.clientHeight=700;resizeScene();
app.setTheme('dark');assertSkyInOpeningView();app.setTheme('light');
app.view('port');for(let index=0;index<180;index++)nextFrame(frameTime+=16);
assertSkyInOpeningView();assert(Math.abs(camera.position.length()-Math.hypot(455,510))<.06,'The port overview preserves its camera distance');
app.view('top');for(let index=0;index<180;index++)nextFrame(frameTime+=16);
const topViewRay=new T.Raycaster();camera.updateMatrixWorld(true);topViewRay.setFromCamera(new T.Vector2(0,.95),camera);
assert(topViewRay.ray.direction.y<0,'Top view deliberately remains a top-down view');
const dispatcher=fs.readFileSync(root+'assets/js/pages/dispatcher-3d.js','utf8');
const moodSync=dispatcher.match(/const currentSiteTheme=[^\n]+\nfunction syncSceneTheme\(\)\{[^\n]+/)[0];
const moodCalls=[],moodDocument={documentElement:{dataset:{theme:'dark'}},body:{dataset:{theme:'light'}}};
const moodContext={document:moodDocument,scene:{setTheme:mode=>moodCalls.push(mode)}};
vm.runInNewContext(moodSync+'\nsyncSceneTheme();',moodContext);
moodDocument.documentElement.dataset.theme='light';vm.runInNewContext('syncSceneTheme();',moodContext);
delete moodDocument.documentElement.dataset.theme;moodDocument.body.dataset.theme='dark';vm.runInNewContext('syncSceneTheme();',moodContext);
assert.deepEqual(moodCalls,['dark','light','dark'],'Mood and the restored site theme drive the sky');
assert.match(dispatcher,/new MutationObserver\(syncSceneTheme\)/);
assert.match(dispatcher,/themeObserver\.observe\(document\.documentElement,\{attributes:true,attributeFilter:\['data-theme'\]\}\)/);
assert.match(dispatcher,/themeObserver\.observe\(document\.body,\{attributes:true,attributeFilter:\['data-theme'\]\}\)/);
let skyGeometryDisposed=false,skyMaterialDisposed=false,fogTextureDisposed=false,foundationGeometryDisposed=false;
sky.geometry.addEventListener('dispose',()=>skyGeometryDisposed=true);sky.material.addEventListener('dispose',()=>skyMaterialDisposed=true);
uniforms.terminalFogMap.value.addEventListener('dispose',()=>fogTextureDisposed=true);foundation.geometry.addEventListener('dispose',()=>foundationGeometryDisposed=true);
app.dispose();assert(skyGeometryDisposed&&skyMaterialDisposed,'The sky follows the scene cleanup lifecycle');
assert(fogTextureDisposed&&foundationGeometryDisposed,'Fog and foundation follow the same cleanup lifecycle');
console.log('SCENE PASS: geometry, selection, camera, fill, raycast, Sky r185, visible opening/port sky, unchanged overview distances and top view, Mood day/night, lighting, cloud pause, desktop/mobile resizing and cleanup. GPU rendering excluded.');
