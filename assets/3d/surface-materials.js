import * as T from 'three';
// Deterministic, self-hosted microtextures. No imagery or third-party requests.
export function createSurfaces(){
 const owned=[],size=128;let seed=7319;
 const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 function texture(kind,color=false){const bytes=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,n=rand(),line=kind==='steel'?Math.sin(y*.85)*3:0;
   const v=kind==='asphalt'?170+n*65:kind==='steel'?223+n*23+line:198+n*38;
   bytes[i]=bytes[i+1]=bytes[i+2]=v;bytes[i+3]=255;
  }
  const t=new T.DataTexture(bytes,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.needsUpdate=true;owned.push(t);return t;
 }
 const asphaltMap=texture('asphalt',true);asphaltMap.repeat.set(.55,.55);
 const concreteMap=texture('concrete',true);concreteMap.repeat.set(.3,.3);
 const steelMap=texture('steel',true);steelMap.repeat.set(4,2);
 const steelBump=texture('steel');steelBump.repeat.copy(steelMap.repeat);
 const gravelMap=texture('asphalt',true);gravelMap.repeat.set(.4,.4);
 const steel=new T.MeshStandardMaterial({color:'#d7dcda',map:steelMap,bumpMap:steelBump,bumpScale:.006,metalness:.4,roughness:.5});
 return {asphaltMap,concreteMap,steel,steelMap,steelBump,gravelMap,dispose(){owned.forEach(t=>t.dispose());}};
}
