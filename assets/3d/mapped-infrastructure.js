import * as T from 'three';
import {plan,scopePixels,buildings,parks,UNITS_PER_METRE as U} from './site-plan.js';
export function buildInfrastructure(ctx){
 const {fixed,dynamic,box,poly,line,cylinder,ring,mat,asphalt,paving,silver,dark,windows,white,tanks}=ctx;
 const path=points=>points.map(p=>plan(...p));
 const yellow=mat('#c3a052',{metalness:.25}),blue=mat('#56788d'),red=mat('#865e56');
 const buildingModels=new Map();poly(path([[480,129],[619,91],[648,157],[706,235],[576,290],[535,207]]),paving,.005);
 for(const [id,footprint] of parks){poly(path(footprint),asphalt,.015);}
 for(const [id,points,height,roofStyle] of buildings){
  const pp=path(points),center=pp.reduce((v,p)=>v.add(new T.Vector2(...p)),new T.Vector2()).multiplyScalar(.25),h=height*U;
  const local=pp.map(p=>[p[0]-center.x,p[1]-center.y]),shape=new T.Shape();local.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const g=new T.Group();g.name=id;g.position.set(center.x,.04,center.y);dynamic.add(g);
  const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);
  const wall=new T.Mesh(geo,white);wall.castShadow=wall.receiveShadow=true;g.add(wall);
  const roofMaterial=(roofStyle==='blue'?blue:roofStyle==='red'?red:silver).clone();roofMaterial.side=T.DoubleSide;
  const roofGeo=new T.ShapeGeometry(shape);roofGeo.rotateX(-Math.PI/2);
  const roof=new T.Mesh(roofGeo,roofMaterial);roof.position.y=h+.025;roof.castShadow=roof.receiveShadow=true;g.add(roof);
  for(let j=0;j<4;j++){const a=local[j],b=local[(j+1)%4],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),count=Math.floor(len/2.2);for(let k=1;k<count;k++){const f=k/count,w=box(a[0]+dx*f+dz/len*.03,a[1]+dz*f-dx/len*.03,.55,.06,.42,windows,h*.5,g);w.rotation.y=-Math.atan2(dz,dx);}}
  buildingModels.set(id,g);
 }
 const scope=new T.LineLoop(new T.BufferGeometry().setFromPoints(path(scopePixels).map(([x,z])=>new T.Vector3(x,.12,z))),new T.LineBasicMaterial({color:'#8ba5b4',transparent:true,opacity:.5}));fixed.add(scope);
 const routes=[[[550,541],[654,566],[714,586],[808,558],[886,535],[956,482]],[[678,546],[776,508],[849,481],[866,413],[885,385]],[[714,586],[736,620],[810,641]],[[776,508],[800,552],[876,626]],[[515,116],[615,82],[644,126],[765,182]]];
 const segments=[];
 for(const route of routes){const p=path(route);for(let i=1;i<p.length;i++){const a=new T.Vector2(...p[i-1]),b=new T.Vector2(...p[i]);segments.push([a,b]);for(const d of [0,.18])line([a.x,.7+d,a.y],[b.x,.7+d,b.y],.035,silver);const n=Math.ceil(a.distanceTo(b)/4);for(let k=0;k<=n;k++){const q=a.clone().lerp(b,k/n);line([q.x,.03,q.y],[q.x,.98,q.y],.025,dark);}}}
 for(const t of tanks){const p=new T.Vector2(t.group.position.x,t.group.position.z);let q=null,best=Infinity;for(const [a,b] of segments){const v=b.clone().sub(a),f=T.MathUtils.clamp(p.clone().sub(a).dot(v)/v.lengthSq(),0,1),hit=a.clone().addScaledVector(v,f),d=p.distanceTo(hit);if(d<best){best=d;q=hit;}}if(!q||best<t.r+.2)continue;const a=p.clone().add(q.clone().sub(p).setLength(t.r+.03));line([a.x,.38,a.y],[q.x,.38,q.y],.03,silver);line([q.x,.38,q.y],[q.x,.7,q.y],.03,silver);}
 for(const [zone,footprint] of parks){const pp=path(footprint);for(let j=0;j<pp.length;j++){const a=pp[j],b=pp[(j+1)%pp.length],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2.3);for(let k=0;k<=n;k++){const f=k/n,x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f;line([x,.04,z],[x,.55,z],.013,dark);}for(const y of [.26,.51])line([a[0],y,a[1]],[b[0],y,b[1]],.009,silver);}}
 for(const px of [[706,580],[763,510],[848,482],[886,535],[874,615],[684,172]]){const [x,z]=plan(...px);box(x,z,1.6,1,.08,paving,.04);for(const d of [-.25,.25]){box(x,z+d,1.15,.34,.07,dark,.15);line([x-.44,.39,z+d],[x+.18,.39,z+d],.14,blue);line([x+.18,.39,z+d],[x+.44,.39,z+d],.17,silver);line([x+.44,.39,z+d],[x+.72,.39,z+d],.04,silver);}}
 return {buildingModels};
}
