import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {tankPixels} from './layout.js';

export function createTerminalScene(container,onSelect,rendererFactory=()=>new T.WebGLRenderer({antialias:true,alpha:false})){
  const renderer=rendererFactory();
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.setSize(container.clientWidth,container.clientHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  if('outputColorSpace' in renderer) renderer.outputColorSpace=T.SRGBColorSpace;
  container.append(renderer.domElement);

  const scene=new T.Scene();
  scene.background=new T.Color('#b8c8d0');
  scene.fog=new T.FogExp2('#b8c8d0',0.0019);

  const camera=new T.PerspectiveCamera(34,container.clientWidth/container.clientHeight,.2,1400);
  const homeTarget=new T.Vector3(-34,0,-44);
  const home=new T.Vector3(132,116,168);
  camera.position.copy(home);

  const controls=new OrbitControls(camera,renderer.domElement);
  controls.target.copy(homeTarget);
  controls.enableDamping=true;
  controls.dampingFactor=.075;
  controls.minDistance=18;
  controls.maxDistance=520;
  controls.maxPolarAngle=Math.PI*.49;
  controls.minPolarAngle=.08;

  scene.add(new T.HemisphereLight('#eff8ff','#47545b',2.15));
  const sun=new T.DirectionalLight('#fff3df',4.1);
  sun.position.set(-145,205,115);
  sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-220,right:220,top:220,bottom:-220,near:1,far:650});
  sun.shadow.bias=-.00035;
  sun.shadow.normalBias=.08;
  scene.add(sun);
  const fillLight=new T.DirectionalLight('#b9dcff',1.05);fillLight.position.set(140,90,-180);scene.add(fillLight);

  const fixed=new T.Group(),dynamic=new T.Group(),selectionGroup=new T.Group();
  scene.add(fixed,dynamic,selectionGroup);

  function seededTexture(kind,size=256){
    const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');
    if(kind==='asphalt'){
      x.fillStyle='#4f565b';x.fillRect(0,0,size,size);
      for(let i=0;i<9000;i++){const v=55+Math.random()*65;x.fillStyle=`rgba(${v},${v},${v},${.08+Math.random()*.16})`;x.fillRect(Math.random()*size,Math.random()*size,1+Math.random()*2,1+Math.random()*2)}
      x.strokeStyle='rgba(230,230,220,.055)';x.lineWidth=1;
      for(let i=0;i<18;i++){x.beginPath();x.moveTo(Math.random()*size,Math.random()*size);x.lineTo(Math.random()*size,Math.random()*size);x.stroke()}
    }else if(kind==='concrete'){
      x.fillStyle='#9da2a2';x.fillRect(0,0,size,size);
      for(let i=0;i<5000;i++){const v=130+Math.random()*55;x.fillStyle=`rgba(${v},${v},${v},${.08+Math.random()*.12})`;x.fillRect(Math.random()*size,Math.random()*size,1,1)}
      x.strokeStyle='rgba(68,74,77,.20)';for(let p=0;p<size;p+=64){x.beginPath();x.moveTo(p,0);x.lineTo(p,size);x.stroke();x.beginPath();x.moveTo(0,p);x.lineTo(size,p);x.stroke()}
    }else{
      x.fillStyle='#c4c7c8';x.fillRect(0,0,size,size);
      for(let i=0;i<220;i++){const y=Math.random()*size;x.fillStyle=`rgba(70,74,77,${.03+Math.random()*.055})`;x.fillRect(0,y,size,.5+Math.random()*1.2)}
      for(let i=0;i<500;i++){x.fillStyle='rgba(255,255,255,.045)';x.fillRect(Math.random()*size,Math.random()*size,1,Math.random()*8+1)}
    }
    const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;return t;
  }

  const asphaltTex=seededTexture('asphalt'),concreteTex=seededTexture('concrete'),metalTex=seededTexture('metal');
  asphaltTex.repeat.set(24,24);concreteTex.repeat.set(16,16);metalTex.repeat.set(3,8);
  const mat=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.6,metalness:.12,...opts});
  const asphalt=mat('#4d5357',{map:asphaltTex,bumpMap:asphaltTex,bumpScale:.075,roughness:.92,metalness:.02});
  const concrete=mat('#9ea4a4',{map:concreteTex,bumpMap:concreteTex,bumpScale:.05,roughness:.9,metalness:.01});
  const steel=mat('#bfc5c7',{map:metalTex,metalness:.72,roughness:.36});
  const tankSteel=mat('#c7cbca',{map:metalTex,metalness:.52,roughness:.48});
  const brightSteel=mat('#d7dcdd',{metalness:.82,roughness:.26});
  const dark=mat('#283036',{metalness:.5,roughness:.52});
  const railMat=mat('#555e63',{metalness:.9,roughness:.32});
  const sleeperMat=mat('#3d4245',{roughness:.95});
  const glass=mat('#6d8792',{metalness:.55,roughness:.16,transparent:true,opacity:.88});
  const rubber=mat('#171a1c',{roughness:.95});
  const yellow=mat('#d6a62c',{metalness:.18,roughness:.54});
  const blue=mat('#2d6684',{metalness:.45,roughness:.38});
  const green=mat('#3d7463',{metalness:.22,roughness:.48});
  const red=mat('#9b4740',{metalness:.2,roughness:.5});
  const white=mat('#e2e3df',{roughness:.58,metalness:.18});
  const grass=mat('#76866d',{roughness:1});
  const water=mat('#497a8d',{metalness:.28,roughness:.22});

  const boxGeo=new T.BoxGeometry(1,1,1),cylGeo=new T.CylinderGeometry(1,1,1,28),sphereGeo=new T.SphereGeometry(1,18,12);
  function mesh(geo,m,x=0,y=0,z=0,parent=fixed){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
  function box(x,z,w,d,h,m=white,y=0,parent=fixed){const o=mesh(boxGeo,m,x,y+h/2,z,parent);o.scale.set(w,h,d);return o}
  function cyl(x,z,r,h,m=steel,y=0,parent=fixed){const o=mesh(cylGeo,m,x,y+h/2,z,parent);o.scale.set(r,h,r);return o}
  function sphere(x,y,z,r,m=steel,parent=fixed){const o=mesh(sphereGeo,m,x,y,z,parent);o.scale.setScalar(r);return o}
  function pipe(a,b,r=.11,m=brightSteel,parent=fixed){const va=new T.Vector3(...a),vb=new T.Vector3(...b),mid=va.clone().add(vb).multiplyScalar(.5),len=va.distanceTo(vb);const o=mesh(cylGeo,m,mid.x,mid.y,mid.z,parent);o.scale.set(r,len,r);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.clone().sub(va).normalize());return o}
  function tube(points,r=.11,m=brightSteel,parent=fixed){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');return mesh(new T.TubeGeometry(curve,Math.max(24,points.length*12),r,7,false),m,0,0,0,parent)}
  function plane(w,d,m,y=0,parent=fixed){const o=mesh(new T.PlaneGeometry(w,d),m,0,y,0,parent);o.rotation.x=-Math.PI/2;return o}
  function plan(x,y){return [-(x-700)*.27+(y-460)*.14,-(x-700)*.14-(y-460)*.27]}
  const pos=tankPixels.map(([x,y])=>plan(x,y));

  plane(470,360,grass,-.48);
  const sea=plane(470,118,water,-.36);sea.position.z=-138;
  box(0,46,376,196,.22,concrete,-.12);
  box(-18,10,308,146,.24,asphalt,.01);
  box(-62,84,270,56,.25,asphalt,.03);
  box(92,20,72,128,.25,asphalt,.035);

  const mark=mat('#d6d6c4',{roughness:.8});
  for(let z=-35;z<=70;z+=18) box(116,z,30,.13,.025,mark,.19);
  for(const z of [-58,-50,78,94]) box(-22,z,230,.11,.024,mark,.19);
  for(const x of [-149,140]) box(x,12,.18,146,.25,concrete,.16);

  function curve(points){return new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,.36,z)),false,'centripetal')}
  function track(points){const c=curve(points),len=c.getLength();
    for(let u=0;u<1;u+=1/Math.max(60,len/.9)){const p=c.getPointAt(u),t=c.getTangentAt(u),s=box(p.x,p.z,1.55,.18,.14,sleeperMat,.20);s.rotation.y=Math.atan2(t.x,t.z)}
    for(const side of [-.5,.5]){const pts=[];for(let i=0;i<=100;i++){const p=c.getPointAt(i/100),t=c.getTangentAt(i/100),n=new T.Vector3(t.z,0,-t.x).multiplyScalar(side);pts.push(p.clone().add(n))}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),140,.055,5,false),railMat,0,0,0)}
    return c;
  }
  const railCurves=[];
  for(let i=0;i<5;i++) railCurves.push(track([[-155,61+i*6],[-72,60+i*6],[8,57+i*5],[82,51+i*4],[146,39+i*2]]));
  const movingRail=track([[-156,102],[-88,100],[-12,92],[66,78],[150,63]]);

  function road(points,width=7){for(let i=1;i<points.length;i++){const [x,z]=points[i-1],[xx,zz]=points[i],r=box((x+xx)/2,(z+zz)/2,width,Math.hypot(xx-x,zz-z),.13,asphalt,.10);r.rotation.y=Math.atan2(xx-x,zz-z)}}
  road([[-158,-44],[-75,-46],[12,-43],[100,-30],[155,-10]],8);
  road([[104,-52],[109,-10],[115,31],[125,76]],7);
  road([[-142,118],[-60,122],[18,121],[94,110],[155,90]],8);

  const tanks=[];
  function tankModel(x,z,r,h,index){const g=new T.Group();g.position.set(x,0,z);dynamic.add(g);
    cyl(0,0,r+.28,.25,concrete,0,g);
    const shell=cyl(0,0,r,h,tankSteel,.25,g);
    for(let y=.8;y<h;y+=1.1){const ring=new T.Mesh(new T.TorusGeometry(r+.025,.025,5,40),brightSteel);ring.position.set(0,.25+y,0);ring.rotation.x=Math.PI/2;ring.castShadow=true;g.add(ring)}
    cyl(0,0,r+.02,.16,brightSteel,h+.25,g);
    cyl(0,0,.42,.24,dark,h+.40,g);
    const cat=index%4;const category=[blue,yellow,green,red][cat];
    const fill=cyl(0,0,r+.04,1,category,.26,g);fill.material=category.clone();fill.material.transparent=true;fill.material.opacity=.45;fill.visible=false;
    const a=new T.Group();a.rotation.y=(index%7)*.61;g.add(a);const ox=r+.34;
    for(const sx of [-.20,.20]) pipe([sx,.35,ox],[sx,h+.62,ox],.025,yellow,a);
    for(let yy=.55;yy<h+.55;yy+=.32) pipe([-.20,yy,ox],[.20,yy,ox],.021,yellow,a);
    box(0,ox-.22,1.05,.62,.09,dark,h+.42,a);
    for(let sx=-.5;sx<=.5;sx+=.5) for(const zz of [ox-.5,ox+.08]) pipe([sx,h+.5,zz],[sx,h+1.05,zz],.018,yellow,a);
    for(const zz of [ox-.5,ox+.08]) pipe([-.5,h+1.0,zz],[.5,h+1.0,zz],.018,yellow,a);
    const t={group:g,shell,fill,r,h,index};setTankFill(t,[.28,.62,.84,.45,.72,.18][index%6]);tanks.push(t);return t;
  }
  function setTankFill(t,f){f=T.MathUtils.clamp(f,0,1);t.fill.visible=f>0;if(f<=0)return;t.fill.scale.y=Math.max(.04,t.h*f);t.fill.position.y=.26+(t.h*f)/2;t.fill.userData.fill=f}
  pos.forEach(([x,z],i)=>{const p=tankPixels[i],r=Math.max(2.2,p[2]*.49),h=5.1+r*.62;tankModel(x,z,r,h,i)});

  const pipeColors=[brightSteel,blue,yellow,green];
  function pipeRack(a,b,levels=3){const va=new T.Vector3(...a),vb=new T.Vector3(...b),len=va.distanceTo(vb),dir=vb.clone().sub(va).normalize(),mid=va.clone().add(vb).multiplyScalar(.5),angle=Math.atan2(dir.x,dir.z);
    const g=new T.Group();g.position.copy(mid);g.rotation.y=angle;fixed.add(g);
    const span=3.2;for(let z=-len/2;z<=len/2;z+=8){for(const x of [-span/2,span/2]) pipe([x,.2,z],[x,4.6,z],.055,dark,g);pipe([-span/2,4.55,z],[span/2,4.55,z],.055,dark,g)}
    for(let l=0;l<levels;l++){const y=3.15+l*.52;for(let c=0;c<4;c++) pipe([-.9+c*.6,y,-len/2],[-.9+c*.6,y,len/2],.075,pipeColors[c],g)}
  }
  pipeRack([-132,0,-45],[126,0,-45]);
  pipeRack([-128,0,20],[120,0,20]);
  pipeRack([-118,0,45],[105,0,45]);
  pipeRack([48,0,-60],[48,0,82]);
  pipeRack([-56,0,-60],[-56,0,76],2);

  const pumpGroups=[];
  function pumpSkid(x,z,rot=0,cat=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;fixed.add(g);box(0,0,5.2,3.3,.22,concrete,.22,g);
    for(const dz of [-.8,.8]){box(-.35,dz,2.6,.95,.22,dark,.5,g);const motor=cyl(-.75,dz,.43,1.55,blue,.63,g);motor.rotation.z=Math.PI/2;const body=cyl(.75,dz,.5,1.15,steel,.66,g);body.rotation.z=Math.PI/2;sphere(1.34,1.16,dz,.44,steel,g);pipe([1.35,1.17,dz],[2.55,1.17,dz],.13,pipeColors[cat],g);pipe([-1.55,1.17,dz],[-2.55,1.17,dz],.13,pipeColors[cat],g)}
    for(const sx of [-2.45,2.45]) pipe([sx,.25,-1.45],[sx,2.35,-1.45],.045,yellow,g);
    pumpGroups.push(g);return g;
  }
  const pumpSites=[[-78,-24,.0,0],[-20,-24,.0,1],[38,-24,.0,2],[94,-8,.45,3],[-88,36,.0,1],[-26,36,.0,2],[44,36,.0,0]];
  pumpSites.forEach(p=>pumpSkid(...p));
  for(let i=0;i<tanks.length;i+=3){const t=tanks[i],p=t.group.position,targetZ=p.z<0?-45:(p.z<38?20:45);tube([[p.x,1.0,p.z],[p.x,1.0,p.z+(targetZ-p.z)*.45],[p.x,2.7,targetZ],[p.x,3.15,targetZ]],.095,pipeColors[i%4]);}
  pumpSites.forEach(([x,z],i)=>{const hz=z<0?-45:20;tube([[x+2.55,1.17,z],[x+4,1.17,z],[x+4,3.15,hz]],.11,pipeColors[i%4]);});

  function gantry(x,z,w=92){const g=new T.Group();g.position.set(x,0,z);fixed.add(g);
    for(let xx=-w/2;xx<=w/2;xx+=8){for(const zz of [-10,10]) pipe([xx,.2,zz],[xx,6.4,zz],.055,dark,g);pipe([xx,6.35,-10],[xx,6.35,10],.055,dark,g)}
    for(const zz of [-7,-2,3,8]) pipe([-w/2,5.6,zz],[w/2,5.6,zz],.085,[brightSteel,yellow,green,blue][Math.abs(zz)%4],g);
    box(0,0,w,1.4,.18,dark,6.2,g);
    for(let xx=-w/2+4;xx<w/2;xx+=10){pipe([xx,5.55,-2],[xx,2.55,-2],.07,brightSteel,g);pipe([xx,2.55,-2],[xx,2.15,0],.07,brightSteel,g)}
    return g;
  }
  const railRack=gantry(-34,75,176);

  const wheelGeo=new T.CylinderGeometry(.28,.28,.18,18);
  function wagon(cat=0){const g=new T.Group();fixed.add(g);const body=new T.Group();g.add(body);
    box(0,0,1.55,4.45,.26,dark,.48,body);
    const tank=new T.Mesh(new T.CapsuleGeometry(.69,2.95,5,18),white);tank.rotation.x=Math.PI/2;tank.position.y=1.48;tank.castShadow=true;tank.receiveShadow=true;body.add(tank);
    for(const z of [-1.28,1.28]){const rr=new T.Mesh(new T.TorusGeometry(.705,.07,7,28),pipeColors[cat]);rr.position.set(0,1.48,z);body.add(rr)}
    cyl(0,0,.16,.14,dark,2.16,body);box(0,0,.55,.55,.05,dark,2.28,body);
    for(const x of [-.78,.78])for(const z of [-1.55,-1.05,1.05,1.55]){const w=mesh(wheelGeo,rubber,x,.3,z,body);w.rotation.z=Math.PI/2}
    return g;
  }
  function onCurve(g,c,u){u=(u%1+1)%1;const p=c.getPointAt(u),d=c.getTangentAt(u);g.position.copy(p);g.rotation.y=Math.atan2(d.x,d.z)}
  for(let line=0;line<4;line++){const c=railCurves[line],count=9;for(let n=0;n<count;n++){const w=wagon((line+n)%4);onCurve(w,c,.08+n*.075)}}
  const train=new T.Group();dynamic.add(train);const trainCars=[];for(let n=0;n<7;n++){const w=wagon((n+1)%4);w.removeFromParent();train.add(w);trainCars.push(w)}
  function positionTrain(u){for(let n=0;n<trainCars.length;n++){const car=trainCars[n],uu=(u-n*.032+1)%1,p=movingRail.getPointAt(uu),d=movingRail.getTangentAt(uu);car.position.copy(p);car.rotation.y=Math.atan2(d.x,d.z)}}

  function truck(cat=0){const g=new T.Group();dynamic.add(g);box(0,0,1.7,3.8,.34,dark,.42,g);box(0,1.28,1.58,1.25,1.45,white,.66,g);box(0,1.94,1.46,.18,.62,glass,1.28,g);const tank=cyl(0,-.65,.68,2.45,white,.92,g);tank.rotation.x=Math.PI/2;for(const x of [-.82,.82])for(const z of [-1.15,-.35,.65,1.4]){const w=mesh(wheelGeo,rubber,x,.3,z,g);w.rotation.z=Math.PI/2}box(0,-.62,1.76,.08,.12,pipeColors[cat],1.50,g);return g}
  const truckCurve=curve([[-132,-40],[-55,-42],[15,-38],[78,-28],[120,-8],[124,42],[130,88]]);
  const trucks=[{g:truck(1),u:.12},{g:truck(2),u:.55}];trucks.forEach(v=>onCurve(v.g,truckCurve,v.u));

  function building(x,z,w,d,h){const g=new T.Group();g.position.set(x,0,z);fixed.add(g);box(0,0,w,d,h,white,0,g);box(0,0,w+.5,d+.5,.26,dark,h,g);for(let xx=-w/2+1.5;xx<w/2;xx+=3) box(xx,d/2+.03,1.25,.06,.8,glass,h*.52,g);return g}
  building(-132,-32,18,8,4.3);building(68,-52,22,9,4.6);building(126,65,18,8,4.1);building(-118,112,30,10,4.5);
  const canopy=new T.Group();canopy.position.set(116,7,0);fixed.add(canopy);box(0,0,28,13,.45,blue,5.0,canopy);for(const x of [-12,-4,4,12])for(const z of [-5,5])pipe([x,.2,z],[x,5,z],.11,dark,canopy);
  for(const x of [-10,-2,6]){const t=truck((x+10)/8%4);t.removeFromParent();canopy.add(t);t.position.set(x,0,0);t.rotation.y=Math.PI/2;}

  function tree(x,z,s=1){cyl(x,z,.15,2,dark,0);sphere(x,3,z,1.4*s,grass);sphere(x+.7,2.6,z-.4,1.0*s,grass)}
  for(const [x,z] of [[-170,-74],[-153,-82],[-130,-76],[-108,-82],[-84,-77],[-4,-78],[22,-82],[52,-75],[78,-80],[151,-63],[164,-47],[162,104],[-165,128],[-135,135],[-91,137]]) tree(x,z,.8);

  const records=new Map(),pickables=[];
  function tag(group,id){group.traverse(o=>{if(o.isMesh){o.userData.entityId=id;pickables.push(o)}})}
  function equipmentNode(node,parentTank,index){const base=parentTank?.group.position||new T.Vector3(-104,0,108);const g=new T.Group();g.position.set(base.x+(index%3-1)*2.0,0,base.z+4.5+Math.floor(index/3)*1.5);fixed.add(g);const tone=node.asset?.tone==='red'?red:node.asset?.tone==='orange'?yellow:node.type==='valve'?yellow:blue;box(0,0,2.5,1.55,.18,dark,.2,g);
    if(node.type==='pump'||node.type==='motor'){const m=cyl(-.45,0,.42,1.2,tone,.58,g);m.rotation.z=Math.PI/2;const b=cyl(.6,0,.48,.9,steel,.6,g);b.rotation.z=Math.PI/2;pipe([1.0,1.08,0],[2.0,1.08,0],.09,brightSteel,g)}
    else if(node.type==='valve'){pipe([-1,1,0],[1,1,0],.12,brightSteel,g);sphere(0,1,0,.36,tone,g);const wh=new T.Mesh(new T.TorusGeometry(.43,.05,5,18),tone);wh.position.set(0,1.65,0);wh.rotation.x=Math.PI/2;g.add(wh)}
    else if(node.type==='sensor'){pipe([0,.25,0],[0,1.6,0],.055,brightSteel,g);box(0,0,.55,.42,.6,tone,1.55,g)}
    else if(node.type==='cabinet'){box(0,0,1.0,.7,1.7,tone,.25,g)}
    else {box(0,0,1.8,1.1,1.1,tone,.25,g)}
    tag(g,node.id);records.set(node.id,{group:g});return g;
  }
  let catalog,currentId='terminal',selectionBox=null,cameraGoal=null,isLight=true,animating=!matchMedia('(prefers-reduced-motion: reduce)').matches,last=performance.now(),trainU=.83,raf;
  function bind(nodes){catalog=nodes;records.set('terminal',{group:fixed});
    for(const node of nodes.values()) if(node.type==='tank'){const t=tanks[node.tankIndex-1];if(!t)continue;setTankFill(t,node.fill/100);records.set(node.id,{group:t.group,tank:t});tag(t.group,node.id)}
    for(const node of nodes.values()) if(node.type==='zone'){const ids=node.children.map(id=>records.get(id)?.group).filter(Boolean);if(ids.length){const b=new T.Box3();ids.forEach(g=>b.expandByObject(g));const c=b.getCenter(new T.Vector3()),s=b.getSize(new T.Vector3());const proxy=new T.Group();proxy.position.copy(c);fixed.add(proxy);box(0,0,Math.max(8,s.x),Math.max(8,s.z),.18,new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),.02,proxy);records.set(node.id,{group:proxy,bounds:b});tag(proxy,node.id)}}
    let eq=0;for(const node of nodes.values()){if(records.has(node.id)||node.id==='terminal'||node.type==='zone')continue;if(node.id==='rail-rack'){records.set(node.id,{group:railRack});tag(railRack,node.id);continue}if(node.id==='warehouse'){const g=building(-118,112,30,10,4.5);records.set(node.id,{group:g});tag(g,node.id);continue}let p=node.parent;while(p&&catalog.get(p)?.type!=='tank')p=catalog.get(p)?.parent;const pt=p?records.get(p)?.tank:null;equipmentNode(node,pt,eq++%5)}
  }
  function boundsOf(id){const rec=records.get(id);if(rec?.bounds)return rec.bounds.clone();if(rec?.group)return new T.Box3().setFromObject(rec.group);if(id==='terminal')return new T.Box3(new T.Vector3(-175,0,-90),new T.Vector3(175,20,140));return null}
  function focusBounds(b){if(!b)return;const c=b.getCenter(new T.Vector3()),s=b.getSize(new T.Vector3()),radius=Math.max(s.x,s.y,s.z),dist=Math.max(18,radius*2.05),dir=new T.Vector3(1,.72,1.15).normalize();cameraGoal={pos:c.clone().add(dir.multiplyScalar(dist)),target:c.clone()}}
  function clearSelection(){if(selectionBox){selectionGroup.remove(selectionBox);selectionBox.geometry?.dispose?.();selectionBox.material?.dispose?.();selectionBox=null}}
  function selectEntity(id,focus=true){currentId=id;clearSelection();if(id!=='terminal'){const b=boundsOf(id);if(b){selectionBox=new T.Box3Helper(b,new T.Color('#39c6e9'));selectionGroup.add(selectionBox);if(focus)focusBounds(b)}}else if(focus){cameraGoal={pos:home.clone(),target:homeTarget.clone()}}}

  const ray=new T.Raycaster(),pointer=new T.Vector2(),down=new T.Vector2();
  renderer.domElement.addEventListener('pointerdown',e=>down.set(e.clientX,e.clientY));
  renderer.domElement.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const r=renderer.domElement.getBoundingClientRect();pointer.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(pickables,false).find(h=>h.object.userData.entityId);if(hit)onSelect(hit.object.userData.entityId)});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.dispatchEvent(new CustomEvent('scene-error',{detail:'3D временно недоступно. Перезагрузите страницу для восстановления.'}))});

  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}
  const observer=new ResizeObserver(resize);observer.observe(container);
  function zoom(f){const p=camera.position.clone().sub(controls.target);p.setLength(T.MathUtils.clamp(p.length()*f,controls.minDistance,controls.maxDistance));cameraGoal={pos:p.add(controls.target),target:controls.target.clone()}}
  function theme(){isLight=!isLight;const bg=isLight?'#b8c8d0':'#0c1c24';scene.background.set(bg);scene.fog.color.set(bg);renderer.toneMappingExposure=isLight?1.08:.78;return isLight}
  controls.addEventListener('start',()=>cameraGoal=null);

  function frame(now){raf=requestAnimationFrame(frame);if(document.hidden){last=now;return}const dt=Math.min((now-last)/1000,.05);last=now;
    if(animating){trainU=(trainU+dt*.012)%1;positionTrain(trainU);for(const v of trucks){v.u=(v.u+dt*.009)%1;onCurve(v.g,truckCurve,v.u)}}
    if(cameraGoal){const a=1-Math.exp(-dt*5.2);camera.position.lerp(cameraGoal.pos,a);controls.target.lerp(cameraGoal.target,a);if(camera.position.distanceTo(cameraGoal.pos)<.06)cameraGoal=null}
    controls.update();renderer.render(scene,camera)
  }
  positionTrain(trainU);raf=requestAnimationFrame(frame);

  return {tanks,bind,select:selectEntity,zoom,theme,
    setFill(id,value){const rec=records.get(id);if(rec?.tank)setTankFill(rec.tank,value/100)},
    view(mode){if(mode==='top'){const target=controls.target.clone();cameraGoal={pos:target.clone().add(new T.Vector3(.1,Math.max(70,camera.position.distanceTo(target)),.1)),target}}else if(mode==='port'){cameraGoal={pos:home.clone(),target:homeTarget.clone()}}else selectEntity(currentId,true)},
    pause(){animating=!animating;return animating},get animating(){return animating},
    dispose(){cancelAnimationFrame(raf);observer.disconnect();controls.dispose();renderer.dispose();[asphaltTex,concreteTex,metalTex].forEach(t=>t.dispose());scene.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m?.dispose?.());else o.material?.dispose?.()});renderer.domElement.remove()}
  };
}
