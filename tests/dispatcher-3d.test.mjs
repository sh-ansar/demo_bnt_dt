import {registerHooks} from 'node:module';import {pathToFileURL,fileURLToPath} from 'node:url';import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
registerHooks({resolve(specifier,context,next){return specifier==='three'?{url:pathToFileURL(root+'assets/3d/vendor/three.module.js').href,shortCircuit:true}:next(specifier,context);}});
const {createTerminalScene}=await import(pathToFileURL(root+'assets/3d/terminal-scene-realistic.js'));
const {createHierarchy}=await import(pathToFileURL(root+'assets/3d/hierarchy.js'));
const context={window:{}};vm.runInNewContext(fs.readFileSync(root+'assets/js/data/assets.js','utf8'),context);
const documentStub={addEventListener(){},removeEventListener(){},hidden:false};
Object.assign(global,{devicePixelRatio:1,matchMedia:()=>({matches:true}),document:documentStub,ResizeObserver:class{observe(){}disconnect(){}},cancelAnimationFrame(){}});
let nextFrame, rendered, camera;global.requestAnimationFrame=fn=>{nextFrame=fn;return 1;};
const listeners={};const dom={style:{},clientWidth:900,clientHeight:700,ownerDocument:documentStub,getRootNode:()=>documentStub,addEventListener(name,fn){listeners[name]=fn;},removeEventListener(){},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:900,height:700}),remove(){}};
const renderer={domElement:dom,shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(s,c){rendered=s;camera=c;}};
const container={clientWidth:900,clientHeight:700,append(){},dataset:{},dispatchEvent(){}};
const chosen=[];const app=createTerminalScene(container,id=>chosen.push(id),()=>renderer);const nodes=createHierarchy(app.tanks,context.window.BNT_DATA.assets);app.bind(nodes);
app.select('terminal',false);nextFrame(1000);assert.equal(app.tanks.length,80);
function allMeshes(){const a=[];rendered.traverse(o=>{if(o.isMesh)a.push(o)});return a;}
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
for(const id of ['west','tankp3','pump101','pump101-motor','r-16','east','r-49','r-49-pump','rail','service','terminal']){app.select(id);for(let i=0;i<60;i++)nextFrame(1100+i*16);assert.equal(container.dataset.selectedId,id);assert(camera.position.toArray().every(Number.isFinite));}
app.select('pump101');nextFrame(3000);assert(allMeshes().some(m=>m.userData.entityId==='pump101'&&visible(m)));assert(allMeshes().filter(m=>m.userData.entityId==='r-49-pump').every(m=>!visible(m)));
app.setFill('tankp3',0);assert.equal(app.tanks[2].body.visible,false);app.setFill('tankp3',100);assert.equal(app.tanks[2].fill,1);app.select('terminal');assert.equal(app.tanks[2].roof.visible,true);
app.select('pump101');for(let i=0;i<120;i++)nextFrame(4000+i*16);rendered.updateMatrixWorld(true);camera.updateMatrixWorld(true);
const meshes=allMeshes().filter(m=>m.userData.entityId==='pump101');const T=await import('three');const point=new T.Box3().setFromObject(meshes[0].parent).getCenter(new T.Vector3()).project(camera);
listeners.pointerdown({clientX:(point.x+1)*450,clientY:(1-point.y)*350});listeners.pointerup({clientX:(point.x+1)*450,clientY:(1-point.y)*350});assert(chosen.includes('pump101'),'Model click selects the pump');
app.view('top');app.view('port');app.zoom(.8);assert.equal(app.theme(),false);assert.equal(app.theme(),true);app.dispose();console.log('SCENE PASS: real Three.js geometry, mapped entities, selections, finite cameras, visibility, fill, raycast pump click and cleanup. GPU rendering excluded.');
