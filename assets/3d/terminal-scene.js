import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {tankPixels} from './layout.js';
export function createTerminalScene(container, onSelect, rendererFactory = () => new T.WebGLRenderer({antialias:true})) {
const colors=['#29AAE1','#FFB228','#55C98C','#A782EF'],names=['Газ','Дизтопливо','Бензин','Нефть'];
const renderer=rendererFactory();
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(container.clientWidth,container.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;container.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#F8FAFB');scene.fog=new T.Fog('#F8FAFB',440,780);
const camera=new T.PerspectiveCamera(38,container.clientWidth/container.clientHeight,.2,1200),home=new T.Vector3(12,248,305),openingTarget=new T.Vector3(-43,0,-65),openingCamera=openingTarget.clone().add(new T.Vector3(10,98,122));camera.position.copy(openingCamera);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(openingTarget);controls.enableDamping=true;controls.minDistance=14;controls.maxDistance=620;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.03;
scene.add(new T.HemisphereLight('#e7f4ff','#9eaaa3',2.6));const sun=new T.DirectionalLight('#fff8ee',3);sun.position.set(-110,200,-70);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-205,right:205,top:160,bottom:-160,near:1,far:500});sun.shadow.bias=-.00025;sun.shadow.normalBias=.12;scene.add(sun);
const fixed=new T.Group(),dynamic=new T.Group();scene.add(fixed,dynamic);
const mat=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.6,metalness:.15,...opts});
const white=mat('#F5F6F4'),silver=mat('#b6c5c9',{metalness:.65,roughness:.37}),asphalt=mat('#9da8ac'),paving=mat('#d4dddd'),ground=mat('#e5ebea'),dark=mat('#283b46'),rail=mat('#849192',{metalness:.72}),sleeper=mat('#89918f'),grass=mat('#bac9b4'),foliage=mat('#a2b796'),categories=colors.map(c=>mat(c,{roughness:.36,metalness:.25})),windows=mat('#64869b',{metalness:.5,roughness:.22});
const boxGeo=new T.BoxGeometry(1,1,1),cylGeo=new T.CylinderGeometry(1,1,1,32),ballGeo=new T.SphereGeometry(1,16,12),ringCache=new Map();
function add(geo,m,x,y,z,parent=fixed){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(x,z,w,d,h,m=white,y=0,parent=fixed){const o=add(boxGeo,m,x,y+h/2,z,parent);o.scale.set(w,h,d);return o}
function cylinder(x,z,r,h,m=silver,y=0,parent=fixed){const o=add(cylGeo,m,x,y+h/2,z,parent);o.scale.set(r,h,r);return o}
function sphere(x,y,z,r,m,parent=fixed){const o=add(ballGeo,m,x,y,z,parent);o.scale.setScalar(r);return o}
function ring(x,y,z,r,th,m,parent=fixed){const key=r+':'+th;if(!ringCache.has(key))ringCache.set(key,new T.TorusGeometry(r,th,6,40));const o=add(ringCache.get(key),m,x,y,z,parent);o.rotation.x=Math.PI/2;return o}
function line(a,b,r,m=silver,parent=fixed){const va=new T.Vector3(...a),vb=new T.Vector3(...b),mid=va.clone().add(vb).multiplyScalar(.5);const o=add(cylGeo,m,mid.x,mid.y,mid.z,parent);o.scale.set(r,va.distanceTo(vb),r);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return o}
function poly(points,m,y=0){const s=new T.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const o=add(new T.ShapeGeometry(s),m,0,y,0);o.rotation.x=-Math.PI/2;return o}
function strip(points,width,m,y=.04){for(let i=1;i<points.length;i++){const [x,z]=points[i-1],[xx,zz]=points[i],o=box((x+xx)/2,(z+zz)/2,width,Math.hypot(xx-x,zz-z),.09,m,y);o.rotation.y=Math.atan2(xx-x,zz-z)}}
// Visual trace of the Google Maps satellite view, 8 September 2026.
// Pixel coordinates preserve spatial relationships, not survey accuracy.
function plan(x,y){return [-(x-700)*.27+(y-460)*.14,-(x-700)*.14-(y-460)*.27]}
const path=pts=>pts.map(p=>plan(...p));
const coast=path([[170,270],[183,391],[300,389],[420,365],[477,362],[540,380],[620,410],[744,402],[746,324],[696,262],[628,218],[555,239],[326,266],[317,240],[551,199],[728,106],[776,154],[810,218],[926,273],[1038,183]]);
poly([...coast,...path([[1240,170],[1310,820],[160,820]])],ground);
const water=mat('#a9cbd6',{metalness:.22,roughness:.52});poly([...coast,...path([[1060,-90],[40,-90],[40,270]])],water,-.45);
water.onBeforeCompile=s=>{s.uniforms.waveTime={value:0};water.userData.shader=s;s.vertexShader='varying vec3 wavePos;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nwavePos=(modelMatrix*vec4(transformed,1.0)).xyz;');s.fragmentShader='uniform float waveTime; varying vec3 wavePos;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ripple=sin(wavePos.x*2.8+wavePos.z*5.0+waveTime*.65)*sin(wavePos.z*3.8-waveTime*.5);diffuseColor.rgb+=ripple*.012;')};
strip(coast,.6,silver);
const mainRoad=path([[200,423],[358,454],[585,460],[791,432],[920,348],[1083,251],[1200,104]]),dockRoad=path([[192,405],[355,419],[590,444],[757,413],[782,340],[735,275]]);
strip(mainRoad,5.5,asphalt);strip(dockRoad,2.7,asphalt);
strip(path([[234,552],[416,593],[601,632],[809,675],[1015,737],[1175,800]]),4,asphalt);
strip(path([[778,661],[840,548],[950,466],[1079,467],[1192,601],[1027,737]]),2.6,asphalt);
// A watercolor surround: overlapping translucent pigment, dissolving beyond the model.
const washMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{night:{value:0}},vertexShader:`varying vec3 wp;void main(){wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,fragmentShader:`
 varying vec3 wp;uniform float night;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){return noise(p)*.52+noise(p*2.04)*.27+noise(p*4.11)*.14+noise(p*8.2)*.07;}
 void main(){vec2 p=wp.xz;float n=fbm(p*.032),fine=fbm(p*.23);float sea=smoothstep(-12.,55.,p.y);float edge=length(p/vec2(222.,163.));float alpha=(1.-smoothstep(.65+n*.22,1.18+n*.18,edge))*(.18+.52*n);vec3 land=mix(vec3(.71,.76,.69),vec3(.52,.64,.51),fine);vec3 water=mix(vec3(.78,.89,.94),vec3(.53,.75,.84),fine);vec3 color=mix(land,water,sea);color=mix(color,color*.36,night);gl_FragColor=vec4(color,alpha);}`});
const wash=add(new T.PlaneGeometry(590,480),washMaterial,0,-.65,0);wash.rotation.x=-Math.PI/2;wash.castShadow=false;wash.receiveShadow=false;
// Fade terrain and sea edges into watercolor; the operational core stays solid.
for(const m of [ground,water]){const previous=m.onBeforeCompile;m.onBeforeCompile=shader=>{previous.call(m,shader);shader.vertexShader='varying vec3 edgePosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nedgePosition=(modelMatrix*vec4(position,1.)).xyz;');shader.fragmentShader='varying vec3 edgePosition;\n'+shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\nfloat edge=length(edgePosition.xz/vec2(189.,143.));float grain=sin(edgePosition.x*.24)*sin(edgePosition.z*.31)*.025;gl_FragColor.a*=1.-smoothstep(.87,1.12,edge+grain);');};m.transparent=true;}
function curve(p,y=.25){return new T.CatmullRomCurve3(p.map(([x,z])=>new T.Vector3(x,y,z)),false,'centripetal')}
function track(points){const c=curve(points),n=Math.ceil(c.getLength()/1.4);for(let k=0;k<n;k++){const p=c.getPointAt(k/n),v=c.getTangentAt(k/n),b=box(p.x,p.z,1.6,.23,.14,sleeper);b.rotation.y=Math.atan2(v.x,v.z)}for(let side of [-.53,.53]){const pp=[];for(let i=0;i<=120;i++){const p=c.getPointAt(i/120),v=c.getTangentAt(i/120);pp.push(p.add(new T.Vector3(v.z,0,-v.x).multiplyScalar(side)))}add(new T.TubeGeometry(new T.CatmullRomCurve3(pp),160,.065,4,false),rail,0,0,0)}return c}
const tracks=[];for(let j=0;j<13;j++)tracks.push(track(path([[221,511+j*3.3],[430,503+j*3.3],[672,466+j*3.3],[866,435+j*2.1],[981,407+j*1.2],[1081,327+j*.8]])));
const depot=track(path([[789,628],[845,571],[905,521],[962,468],[989,430]]));
track(path([[971,419],[1018,455],[1098,493],[1151,564]]));
function warehouse(x,z,w,d,h,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;fixed.add(g);box(0,0,w,d,h,white,0,g);box(0,0,w+.7,d+.5,.4,silver,h,g);for(let a=-w/2+1;a<w/2;a+=2)box(a,0,.075,d,.1,white,h+.4,g);for(let a=-w/2+2;a<w/2-1;a+=5){box(a,d/2+.025,3,.06,1.2,windows,h*.52,g);box(a,-d/2-.025,3,.06,1.2,windows,h*.52,g)}return g}
function mappedWarehouse(px,py,w,d,h,angle=0){const [x,z]=plan(px,py);return warehouse(x,z,w,d,h,angle)}
mappedWarehouse(500,399,35,11,4.2,-.47);mappedWarehouse(554,420,14,7,3.5,-.47);
mappedWarehouse(723,279,23,7,3,-.48);mappedWarehouse(886,553,48,8,4.4,.77);
mappedWarehouse(359,523,22,5,3.3,-.48);mappedWarehouse(482,510,21,5,3.2,-.48);
mappedWarehouse(571,501,16,5,3.2,-.48);mappedWarehouse(668,524,12,6,3,-.48);
mappedWarehouse(762,503,18,4,3,-.48);
// Residential context is left as neutral districts until individual footprints are traced.
const contextGround=mat('#dce0df');
for(const pts of [[[250,588],[451,620],[422,723],[224,684]],[[476,632],[641,669],[601,777],[451,735]],[[661,678],[794,710],[758,820],[616,792]]])poly(path(pts),contextGround,.015);
let seed=1024;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
// Permanent category rim; separate bottom-up inventory with exact empty/full states.
const tanks=[],hits=[];
function setFill(t,f){t.fill=T.MathUtils.clamp(f,0,1);const h=t.h*t.fill;t.body.visible=t.fill>0;t.body.scale.y=h;t.body.position.y=.55+h/2;}
// Storage.svg: flat lid, closely spaced steel ribs, paired bent pipes and colored access.
function storage(x,z,r,h,cat,f){
 const g=new T.Group();g.position.set(x,0,z);dynamic.add(g);
 const steel=mat('#d7d6d2',{metalness:.48,roughness:.48}),ribSteel=mat('#c0c0bb',{metalness:.45,roughness:.52});
 cylinder(0,0,r+.22,.16,white,0,g);cylinder(0,0,r+.13,.39,steel,.16,g);
 const shell=cylinder(0,0,r,h,steel,.55,g);
 const body=cylinder(0,0,r+.006,1,categories[cat],.55,g);
 const rim=add(new T.CylinderGeometry(r+.014,r+.014,.14,64,1,true),categories[cat],0,h+.55,0,g);
 const roof=add(new T.CylinderGeometry(r+.015,r+.015,.085,64),mat('#e5e3df',{metalness:.32,roughness:.58}),0,h+.67,0,g);
 ring(0,h+.62,0,r,.022,ribSteel,g);
 // Fine ribs keep the metal silhouette continuous even where inventory color is shown.
 for(let k=1;k<=15;k++)ring(0,.55+h*k/16,0,r+.014,.015,ribSteel,g);
 const access=new T.Group();g.add(access);access.rotation.y=.67;
 const out=r+.065,top=h+.7;
 for(const xx of [-.2,.2])line([xx,.25,out],[xx,top+.12,out],.024,categories[cat],access);
 for(let y=.38;y<top;y+=.22)line([-.2,y,out],[.2,y,out],.023,categories[cat],access);
 box(0,out-.22,.98,.56,.07,steel,top-.02,access);
 for(let xx of [-.49,0,.49])for(let zz of [out-.5,out+.07])line([xx,top,zz],[xx,top+.36,zz],.014,categories[cat],access);
 for(let yy of [top+.18,top+.36]){for(let zz of [out-.5,out+.07])line([-.49,yy,zz],[.49,yy,zz],.014,categories[cat],access);for(let xx of [-.49,.49])line([xx,yy,out-.5],[xx,yy,out+.07],.014,categories[cat],access);}
 const pipes=new T.Group();g.add(pipes);pipes.rotation.y=-.67;
 for(let xx of [-.15,.15]){const pts=[new T.Vector3(xx,.2,r+.12),new T.Vector3(xx,top-.14,r+.12),new T.Vector3(xx,top+.14,r+.09),new T.Vector3(xx,top+.2,r-.08),new T.Vector3(xx,top+.16,r-.23)];add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.043,8,false),categories[cat],0,0,0,pipes);cylinder(xx,r+.12,.065,.045,ribSteel,.17,pipes);}
 const t={id:tanks.length+1,group:g,r,h,cat,fill:f,shell,body,roof,rim};for(const o of [shell,body,roof,rim]){o.userData.tank=t;hits.push(o)}tanks.push(t);setFill(t,f);return t;
}
// Tank centers traced visually from the satellite reference. Sizes are approximate.

const placements=tankPixels.map(([px,py,r],i)=>[...plan(px,py),r*.29,Math.max(2.2,r*.29*1.05),i%4,[.2,.65,0,.85,1,.4][i%6]]);
placements.forEach(a=>storage(...a));
for(const pts of [[[847,664],[925,637],[947,655]],[[938,630],[1014,602],[1026,558]],[[1010,714],[1071,721],[1102,671]],[[719,624],[792,643]]])strip(path(pts),.23,silver,.6);
function tree(x,z,s=1){cylinder(x,z,.11,1.9,dark);const a=sphere(x,2.3,z,s,foliage);a.scale.y=s*1.25}
// Sparse planting along verified terminal roads; no procedural residential blocks.
for(const [px,py] of [[790,648],[813,620],[805,650],[824,674],[830,652],[855,684],[871,691],[959,694],[981,716],[1020,731],[1057,710],[1065,671],[998,551],[980,498],[750,267],[766,302],[775,340],[757,379],[705,421],[631,439],[580,444],[535,437],[453,415]]){const [x,z]=plan(px,py);tree(x,z,.7);}
const capGeo=new T.CapsuleGeometry(.72,3.6,4,16);
function wagon(cat,parent=fixed){const g=new T.Group();parent.add(g);box(0,0,1.55,5.4,.3,dark,.55,g);const tank=add(capGeo,white,0,1.6,0,g);tank.rotation.x=Math.PI/2;for(const z of [-1.45,1.45]){const rr=ring(0,1.6,z,.735,.105,categories[cat],g);rr.rotation.x=0}for(let x of [-.8,.8])for(let z of [-1.75,-1.15,1.15,1.75]){const w=cylinder(x,z,.26,.17,dark,.2,g);w.rotation.z=Math.PI/2}cylinder(0,0,.18,.14,silver,2.33,g);box(0,2.9,.25,.5,.12,dark,.6,g);box(0,-2.9,.25,.5,.12,dark,.6,g);return g}
function onCurve(g,c,u){const p=c.getPointAt(u),d=c.getTangentAt(u);g.position.copy(p);g.rotation.y=Math.atan2(d.x,d.z)}
for(const [j,cat,start,count] of [[1,0,.07,17],[4,1,.14,20],[7,3,.25,19],[10,2,.47,15]]){const c=tracks[j],step=6.2/c.getLength();for(let n=0;n<count;n++)onCurve(wagon(cat),c,start+n*step)}
for(let n=0;n<12;n++)onCurve(wagon(Math.floor(n/4)%4),depot,.025+n*6.2/depot.getLength());
// Extrude a side profile across width; front is +Z. Sloping panels are true geometry.
const profileCache=new Map();
function profile(points,width,m,parent,x=0){const key=JSON.stringify([points,width]);let geo=profileCache.get(key);if(!geo){const sh=new T.Shape();points.forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));sh.closePath();geo=new T.ExtrudeGeometry(sh,{depth:width,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:2,steps:1});geo.rotateY(-Math.PI/2);profileCache.set(key,geo);}return add(geo,m,x+width/2,0,0,parent);}
const tire=mat('#242728',{roughness:.87,metalness:.05}),glass=mat('#344149',{roughness:.23,metalness:.4}),headlamp=mat('#f3f7ff',{emissive:'#bac7d7',emissiveIntensity:.25}),amber=mat('#ffad20');
function truck(cat,parent=fixed){
 const g=new T.Group();parent.add(g);
 // Satellite comparison: vehicles occupy about one quarter of the former footprint.
 g.scale.setScalar(.25);
 box(0,-.2,1.1,6.9,.24,dark,.63,g);
 // Orange reference tanker translated into each cargo's existing category color.
 const tank=add(new T.CapsuleGeometry(.78,3.7,8,24),categories[cat],0,1.76,-1.19,g);tank.rotation.x=Math.PI/2;
 for(let side of [-1,1]){box(side*.767,-1.19,.024,3.8,.12,white,1.53,g);box(side*.69,-1.65,.12,2.05,.12,dark,.94,g);}
 for(let z of [-2.65,.3]){const rr=ring(0,1.76,z,.792,.035,categories[cat],g);rr.rotation.x=0;}
 box(0,-1.2,.7,2.5,.08,categories[cat],2.51,g);
 cylinder(0,-1.55,.25,.055,categories[cat],2.59,g);
 for(let side of [-1,1]){line([side*.38,2.87,-2.5],[side*.38,2.87,.08],.023,categories[cat],g);for(let z of [-2.5,-1.65,-.8,.08])line([side*.38,2.56,z],[side*.38,2.87,z],.018,categories[cat],g);}
 for(let z of [-2.5,.08])line([-.38,2.87,z],[.38,2.87,z],.023,categories[cat],g);
 for(let y=1.2;y<2.6;y+=.19){line([.78,y,-1.4],[.78,y,-1.08],.018,categories[cat],g);}
 // White cab: narrowed upper front, sloping windshield, aero roof and chamfered nose.
 profile([[1.12,.79],[3.11,.79],[3.2,1.03],[3.08,1.72],[2.67,2.62],[1.23,2.62]],1.46,white,g);
 profile([[1.12,2.62],[1.4,3.02],[1.83,3.12],[2.74,2.64]],1.35,white,g);
 profile([[3.092,1.76],[2.716,2.55],[2.708,2.55],[3.08,1.76]],1.26,glass,g);
 // Side windows and doors follow the same cab profile, mirrors project beyond it.
 for(const side of [-1,1]){
  profile([[1.38,1.87],[1.38,2.47],[2.55,2.47],[2.84,1.85]],.018,glass,g,side*.743);
  line([side*.76,1.23,1.38],[side*.76,1.77,1.38],.012,silver,g);
  box(side*.766,1.57,.023,.18,.035,dark,1.72,g);
  box(side*.76,1.66,.18,.62,.08,silver,.85,g);box(side*.77,1.66,.2,.58,.06,silver,.65,g);
  line([side*.74,2.25,2.73],[side*.98,2.24,2.8],.032,dark,g);
  box(side*1.0,2.8,.12,.17,.38,dark,2.0,g);
 }
 // Front grille, bumper, paired lights, indicators, windshield wipers.
 profile([[3.22,.84],[3.23,1.53],[3.15,1.7],[3.14,.84]],.73,dark,g);
 for(let yy=.95;yy<1.58;yy+=.10)box(0,3.249,.65,.024,.027,silver,yy,g);
 box(0,3.24,1.5,.15,.16,dark,.68,g);
 for(let side of [-1,1]){box(side*.59,3.205,.21,.045,.25,headlamp,.92,g);box(side*.73,3.21,.047,.052,.19,amber,.94,g);line([side*.53,1.91,3.05],[side*.12,1.97,3.02],.013,dark,g);}
 box(0,3.279,.2,.018,.057,white,1.31,g);
 for(let xx of [-.32,0,.32])box(xx,2.68,.06,.07,.03,amber,2.67,g);
 cylinder(-.48,1.75,.055,.12,amber,3.00,g);
 // Five visible axles with rubber tires, metallic hubs, wheel bolts and trailer fenders.
 for(let z of [-2.76,-1.94,.42,1.18,2.57])for(let side of [-1,1]){
  const wheel=add(new T.CylinderGeometry(.34,.34,.23,24),tire,side*.75,.35,z,g);wheel.rotation.z=Math.PI/2;
  const hub=add(new T.CylinderGeometry(.22,.22,.026,20),silver,side*.876,.35,z,g);hub.rotation.z=Math.PI/2;
  const cap=add(new T.CylinderGeometry(.1,.1,.035,16),dark,side*.896,.35,z,g);cap.rotation.z=Math.PI/2;
  for(let i=0;i<6;i++){const aa=i*Math.PI/3;sphere(side*.897,.35+Math.sin(aa)*.15,z+Math.cos(aa)*.15,.022,white,g);}
 }
 for(let side of [-1,1]){box(side*.79,-2.34,.23,1.76,.095,categories[cat],.84,g);box(side*.79,.8,.23,1.58,.09,dark,.85,g);box(side*.7,-3.17,.13,.055,.08,amber,.71,g);}
 return g;
}
const truckCurve=curve(mainRoad,.14),vehicles=[];for(let i=0;i<9;i++){const g=truck(i%4,dynamic);vehicles.push({g,curve:truckCurve,u:.035+i*.106});onCurve(g,truckCurve,.035+i*.106)}for(let i=0;i<13;i++)onCurve(truck(i%4),curve(dockRoad,.12),.06+i*.067);
const containerMats=['#b9c4b3','#d7ba8e','#d6c9ad','#a9bcc7'].map(c=>mat(c));for(let row=0;row<10;row++)for(let col=0;col<3;col++){const [x,z]=plan(735+col*12,292+row*8);const c=box(x,z,2.7,1.7,1.1,containerMats[(row+col)%4]);c.rotation.y=-.48;}
function vessel(x,z,L,W,cat,rot){const g=new T.Group();g.position.set(x,-.4,z);g.rotation.y=rot;fixed.add(g);const s=new T.Shape();s.moveTo(-W*.42,-L*.48);s.lineTo(W*.42,-L*.48);s.lineTo(W*.5,L*.25);s.quadraticCurveTo(W*.43,L*.43,0,L*.52);s.quadraticCurveTo(-W*.43,L*.43,-W*.5,L*.25);s.closePath();
 const hull=add(new T.ExtrudeGeometry(s,{depth:2.3,bevelEnabled:true,bevelSize:.25,bevelThickness:.2,bevelSegments:2,steps:1}),categories[cat],0,.3,0,g);hull.rotation.x=-Math.PI/2;const deck=add(new T.ShapeGeometry(s),silver,0,2.72,0,g);deck.rotation.x=-Math.PI/2;
 box(0,L*.32,W*.7,L*.15,3.4,white,2.75,g);box(0,L*.32,W*.77,L*.13,.22,categories[cat],6.15,g);box(0,L*.402,W*.65,.08,.7,windows,5.1,g);box(0,L*.3,W*.45,L*.09,1.5,white,6.3,g);cylinder(0,L*.27,.45,2.5,dark,7.7,g);line([0,7.8,L*.29],[0,11,L*.29],.05,silver,g);
 if(cat===0){for(let q=0;q<4;q++){const zz=-L*.31+q*L*.15;const dome=sphere(0,3.7,zz,W*.35,white,g);dome.scale.y=W*.3;ring(0,3.45,zz,W*.36,.08,categories[cat],g)}}else{for(let q=0;q<6;q++){const zz=-L*.33+q*L*.09;box(0,zz,W*.64,.35,.12,categories[cat],3,g);cylinder(0,zz,.45,.2,white,3.1,g)}for(let xx of [-.7,0,.7])line([xx,3.1,-L*.37],[xx,3.1,L*.16],.1,silver,g)}
 for(let side of [-1,1]){line([side*W*.43,3.4,-L*.42],[side*W*.44,3.4,L*.23],.035,white,g);for(let q=0;q<12;q++){const zz=-L*.42+q*L*.057;line([side*W*.44,2.8,zz],[side*W*.44,3.5,zz],.03,white,g)}box(side*W*.47,L*.22,.55,1.8,.5,categories[cat],4,g)}return g}
function mappedVessel(px,py,L,W,cat,rot){const [x,z]=plan(px,py);return vessel(x,z,L,W,cat,rot)}
mappedVessel(672,302,41,7.8,3,-.03);mappedVessel(583,367,34,8,0,1.03);mappedVessel(462,349,27,5.7,1,1.04);mappedVessel(309,371,31,5.6,2,1.04);mappedVessel(229,362,23,5.1,0,1.03);
function crane(x,z,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;fixed.add(g);for(let xx of [-2,2])for(let zz of [-2.1,2.1])line([xx,0,zz],[xx*.5,9,zz*.7],.12,silver,g);box(0,0,4.8,4,.5,silver,8.5,g);line([0,9,0],[0,15,1.5],.15,silver,g);line([0,15,1.5],[0,11,-11],.14,silver,g);line([0,15,1.5],[0,10,6],.11,silver,g);line([0,11,-11],[0,3,-11],.026,dark,g);box(1,0,1.3,1.8,1.5,windows,9,g)}
for(const [px,py,angle] of [[719,309,1.4],[735,341,1.4],[510,380,-.5],[360,390,-.5]]){const [x,z]=plan(px,py);crane(x,z,angle);}
// Keep detailed moving models responsive by instancing their repeated small parts.
for(const root of dynamic.children){root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();root.traverse(o=>{if(!o.isMesh||o.userData.tank)return;const key=o.geometry.uuid+o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});for(const items of groups.values()){if(items.length<3)continue;const inst=new T.InstancedMesh(items[0].geometry,items[0].material,items.length);items.forEach((o,i)=>inst.setMatrixAt(i,inverse.clone().multiply(o.matrixWorld)));inst.castShadow=true;inst.receiveShadow=true;inst.computeBoundingSphere();items.forEach(o=>o.removeFromParent());root.add(inst);}}
// Batch repeated geometry for responsive camera movement.
fixed.updateMatrixWorld(true);const batches=new Map(),remove=[];fixed.traverse(o=>{if(!o.isMesh||o.material.transparent)return;const key=o.geometry.uuid+o.material.uuid;let b=batches.get(key);if(!b)batches.set(key,b={geo:o.geometry,mat:o.material,items:[]});b.items.push(o)});for(const b of batches.values()){if(b.items.length<3)continue;const inst=new T.InstancedMesh(b.geo,b.mat,b.items.length);b.items.forEach((o,i)=>{inst.setMatrixAt(i,o.matrixWorld);remove.push(o)});inst.castShadow=true;inst.receiveShadow=true;inst.computeBoundingSphere();scene.add(inst)}remove.forEach(o=>o.removeFromParent());
// The scene is mounted inside the dispatcher, never sized against the browser window.
const records=new Map(), pickables=[],zoneMeshes=[],equipmentRoot=new T.Group();scene.add(equipmentRoot);
let catalog, currentId='terminal', selectionBox=null,down=null,animating=!matchMedia('(prefers-reduced-motion: reduce)').matches,isLight=true,clock=0,last=0,cameraGoal=null,frameId;
const ray=new T.Raycaster(),pointer=new T.Vector2();
const highlightMaterial=new T.MeshBasicMaterial({color:'#13bfd9',transparent:true,opacity:.13,depthWrite:false});
const selectionGroup=new T.Group();scene.add(selectionGroup);
function go(pos,target){cameraGoal={pos:pos.clone(),target:target.clone()};}
controls.addEventListener('start',()=>cameraGoal=null);
function tagged(group,id){group.traverse(o=>{if(o.isMesh){o.userData.entityId=id;pickables.push(o);}});}
function equipment(node,pos) {
 const g=new T.Group();g.position.copy(pos);equipmentRoot.add(g);
 const m=mat(node.asset?.tone==='red'?'#dd745d':node.type==='valve'?'#efa832':'#267f9d');
 box(0,0,2.8,1.6,.15,dark,0,g);
 if(node.type==='pump'||node.type==='motor'||node.id==='compressor'){
  const body=cylinder(0,0,.52,1.65,m,.6,g);body.rotation.z=Math.PI/2;
  for(let x of [-.5,.5])box(x,0,.25,1.1,.4,silver,.15,g);
  cylinder(-1,0,.4,.75,silver,.4,g);line([1,1,0],[1,1,1.4],.16,silver,g);
  for(let x=-.6;x<.7;x+=.2){const rr=ring(x,1.425,0,.54,.035,silver,g);rr.rotation.z=Math.PI/2;rr.rotation.x=0;}
 }else if(node.type==='valve'){
  line([-1.4,.65,0],[1.4,.65,0],.25,silver,g);cylinder(0,0,.38,.7,m,.5,g);line([0,1,0],[0,1.8,0],.06,silver,g);ring(0,1.8,0,.5,.065,m,g);
 }else if(node.type==='sensor'){
  cylinder(0,0,.19,1.5,silver,.2,g);box(0,0,.65,.48,.65,m,1.65,g);box(0,.245,.4,.025,.3,windows,1.85,g);
 }else if(node.type==='coupling'){
  const c=cylinder(0,0,.42,1.1,m,.6,g);c.rotation.z=Math.PI/2;
 }else{box(0,0,node.id==='warehouse'?9:1.8,node.id==='warehouse'?5:1, node.id==='warehouse'?4:2.4,m,.2,g);}
 tagged(g,node.id);return g;
}
function bind(nodes) {
 catalog=nodes;
 for(const node of nodes.values()){
  if(node.type!=='tank')continue;
  const tank=tanks[node.tankIndex-1]; setFill(tank,node.fill/100);
  records.set(node.id,{group:tank.group,tank});
  for(const mesh of [tank.shell,tank.roof,tank.rim,tank.body]){mesh.userData.entityId=node.id;pickables.push(mesh);}
 }
 for(const node of nodes.values()){
  if(['terminal','zone','tank'].includes(node.type))continue;
  const parent=records.get(node.parent),siblings=catalog.get(node.parent).children,index=siblings.indexOf(node.id);
  let position;
  if(parent){const base=parent.group.position;const radius=parent.tank?parent.tank.r+3.8:3.3;const a=-Math.PI*.2+index*.85;position=new T.Vector3(base.x+Math.cos(a)*radius,0,base.z+Math.sin(a)*radius);}
  else {const coords=node.parent==='rail'?plan(545,480):node.parent==='port'?plan(725,320):plan(812,535);position=new T.Vector3(coords[0]+index*6,0,coords[1]);}
  const group=equipment(node,position);records.set(node.id,{group});
 }
 for(const zone of [...catalog.values()].filter(n=>n.type==='zone')){
  const bounds=new T.Box3();
  for(const id of zone.children){const rec=records.get(id);if(rec)bounds.expandByObject(rec.group);}
  bounds.min.y=0;bounds.max.y=6;bounds.expandByScalar(3);
  const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const plane=new T.Mesh(new T.PlaneGeometry(size.x,size.z),new T.MeshBasicMaterial({color:zone.color,transparent:true,opacity:.07,depthWrite:false,side:T.DoubleSide}));
  plane.rotation.x=-Math.PI/2;plane.position.set(center.x,.08,center.z);plane.userData.entityId=zone.id;scene.add(plane);zoneMeshes.push(plane);
  const outline=new T.LineLoop(new T.BufferGeometry().setFromPoints([new T.Vector3(bounds.min.x,.13,bounds.min.z),new T.Vector3(bounds.max.x,.13,bounds.min.z),new T.Vector3(bounds.max.x,.13,bounds.max.z),new T.Vector3(bounds.min.x,.13,bounds.max.z)]),new T.LineBasicMaterial({color:zone.color,transparent:true,opacity:.5}));scene.add(outline);
  records.set(zone.id,{bounds,plane,outline});
 }
}
function isWithin(id,ancestor){for(let n=catalog.get(id);n;n=catalog.get(n.parent))if(n.id===ancestor)return true;return false;}
function visible(object){for(let o=object;o;o=o.parent)if(!o.visible)return false;return true;}
function selectEntity(id,focus=true){
 if(!catalog.has(id))return;currentId=id;
 const node=catalog.get(id);let activeTank=node;
 while(activeTank&&activeTank.type!=='tank')activeTank=catalog.get(activeTank.parent);
 for(const [key,rec] of records){const n=catalog.get(key);
  if(n.type==='zone'){rec.plane.material.opacity=isWithin(id,key)?.16:.035;rec.outline.material.opacity=isWithin(id,key)?.85:.25;continue;}
  if(n.type==='tank'){rec.tank.roof.visible=!(activeTank?.id===key);continue;}
  rec.group.visible=['zone','terminal'].includes(catalog.get(n.parent)?.type)||!!activeTank&&isWithin(key,activeTank.id);
 }
 while(selectionGroup.children.length){const o=selectionGroup.children[0];selectionGroup.remove(o);o.geometry?.dispose();o.material?.dispose();}
 const record=records.get(id);
 if(record){
  const bounds=record.bounds?.clone()||new T.Box3().setFromObject(record.group);bounds.expandByScalar(.45);
  const helper=new T.Box3Helper(bounds,new T.Color('#008fca'));helper.material.depthTest=false;helper.material.transparent=true;helper.material.opacity=.9;helper.renderOrder=10;selectionGroup.add(helper);
  const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const fill=new T.Mesh(new T.BoxGeometry(size.x,size.y,size.z),highlightMaterial.clone());fill.position.copy(center);selectionGroup.add(fill);
  if(focus){const span=Math.max(size.x,size.z,10),distance=Math.max(16,span*(node.type==='zone'?1.25:1.7));go(center.clone().add(new T.Vector3(distance*.25,distance,distance*1.2)),center);}
 }else if(focus)go(openingCamera,openingTarget);
 container.dataset.selectedId=id;
}
function pointerUp(e){if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(pickables.filter(visible),false)[0]||ray.intersectObjects(zoneMeshes,false)[0];if(hit)onSelect(hit.object.userData.entityId);}
renderer.domElement.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});renderer.domElement.addEventListener('pointerup',pointerUp);
renderer.domElement.setAttribute('aria-label','3D-модель терминала. Для выбора с клавиатуры используйте список объектов.');
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.dispatchEvent(new CustomEvent('scene-error',{detail:'3D временно недоступно. Перезагрузите страницу для восстановления.'}));});
function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
const observer=new ResizeObserver(resize);observer.observe(container);
function zoom(f){const p=camera.position.clone().sub(controls.target);p.setLength(T.MathUtils.clamp(p.length()*f,controls.minDistance,controls.maxDistance));go(p.add(controls.target),controls.target);}
function theme(){isLight=!isLight;const bg=isLight?'#F8FAFB':'#092634';scene.background.set(bg);scene.fog.color.set(bg);ground.color.set(isLight?'#e5ebea':'#20404d');asphalt.color.set(isLight?'#9da8ac':'#48606b');water.color.set(isLight?'#a9cbd6':'#204f65');washMaterial.uniforms.night.value=isLight?0:1;return isLight;}
function frame(now){frameId=requestAnimationFrame(frame);if(document.hidden){last=now;return;}const dt=Math.min((now-last)/1000,.05);last=now;if(animating)clock+=dt;if(cameraGoal){const a=1-Math.exp(-dt*5);camera.position.lerp(cameraGoal.pos,a);controls.target.lerp(cameraGoal.target,a);if(camera.position.distanceTo(cameraGoal.pos)<.05)cameraGoal=null;}if(water.userData.shader)water.userData.shader.uniforms.waveTime.value=clock;for(const v of vehicles){if(animating)v.u=(v.u+dt*.006)%1;onCurve(v.g,v.curve,v.u);}controls.update();renderer.render(scene,camera);}
frameId=requestAnimationFrame(frame);
return {tanks,bind,select:selectEntity,zoom,theme,
 setFill(id,value){const rec=records.get(id);if(rec?.tank)setFill(rec.tank,value/100);},
 view(mode){if(mode==='top'){const target=controls.target.clone();go(target.clone().add(new T.Vector3(0,Math.max(25,camera.position.distanceTo(target)),.1)),target);}else if(mode==='port')go(home,new T.Vector3());else selectEntity(currentId);},
 pause(){animating=!animating;return animating;},get animating(){return animating;},
 dispose(){cancelAnimationFrame(frameId);observer.disconnect();controls.dispose();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.domElement.remove();}
};
}
