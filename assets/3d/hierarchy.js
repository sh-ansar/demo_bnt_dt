// Spatial grouping and unregistered equipment are illustrative, not an as-built registry.
export function createHierarchy(tanks, assets) {
  const nodes = new Map();
  const add = node => { node.children = []; nodes.set(node.id, node); if (node.parent) nodes.get(node.parent).children.push(node.id); return node; };
  add({id:'terminal',name:'Батумский терминал',type:'terminal',code:'BNT'});
  const zoneDefs = [
    ['west','Западный парк',1,16,'#1597bd'],
    ['central','Центральный парк',17,27,'#2980d6'],
    ['east','Восточный парк',28,49,'#199b7b'],
    ['port','Припортовый парк',50,55,'#8173c7'],
    ['rail','Ж/д приемка',0,0,'#c98b24'],
    ['service','Ремонтная зона / МТР',0,0,'#a369bd']
  ];
  for (const [id,name,from,to,color] of zoneDefs) add({id,name,code:name,type:'zone',parent:'terminal',from,to,color});
  for (const tank of tanks) {
    const zone=zoneDefs.find(z=>tank.id>=z[2]&&tank.id<=z[3]);
    const asset=tank.id===3?assets.find(a=>a.id==='tankp3'):null;
    const id=asset?'tankp3':`r-${tank.id}`;
    add({id,name:asset?.name||`Резервуар R-${String(tank.id).padStart(2,'0')}`,code:asset?.code||`R-${String(tank.id).padStart(2,'0')}`,type:'tank',parent:zone[0],tankIndex:tank.id,asset,product:['Газ','Дизтопливо','Бензин','Нефть'][tank.cat],fill:asset?.load??Math.round(tank.fill*100),color:zone[4]});
  }
  const knownParent={pump101:'tankp3',pump102:'tankp3',valve24:'tankp3',sensor:'tankp3',cabinet:'pump101',compressor:'service',stand4:'port'};
  for (const asset of assets.filter(a=>a.id!=='tankp3')) {
    add({id:asset.id,name:asset.name,code:asset.code,type:asset.category==='Насосы'?'pump':asset.id==='valve24'?'valve':asset.id==='sensor'?'sensor':asset.id==='cabinet'?'cabinet':'equipment',parent:knownParent[asset.id],asset});
  }
  add({id:'rail-rack',name:'Ж/д эстакада',code:'ЖД',type:'equipment',parent:'rail',note:'Приемка и разгрузка вагонов',module:'/logistics'});
  add({id:'warehouse',name:'Склад критического ЗИП',code:'МТР',type:'equipment',parent:'service',note:'Материалы и запасные части',module:'/procurement'});
  for (const tank of [...nodes.values()].filter(n=>n.type==='tank'&&n.id!=='tankp3')) {
    for (const [type,label,prefix] of [['pump','Насос','Н'],['valve','Запорный клапан','К'],['sensor','Датчик уровня','LT']]) {
      const code=`Д-${prefix}-${String(tank.tankIndex).padStart(2,'0')}`;
      add({id:`${tank.id}-${type}`,name:`${label} ${code}`,code,type,parent:tank.id,illustrative:true});
    }
  }
  for (const pump of [...nodes.values()].filter(n=>n.type==='pump')) {
    const suffix=pump.id==='pump101'?'101':pump.id==='pump102'?'102':`Д-${pump.code.split('-').at(-1)}`;
    for (const [type,label,prefix,status] of [['motor','Электродвигатель','М','Работает'],['coupling','Муфта','МФ','Норма'],['sensor','Вибродатчик','VD','Онлайн']]) {
      const code=`${prefix}-${suffix}`;
      add({id:`${pump.id}-${type}`,name:`${label} ${code}`,code,type,parent:pump.id,illustrative:!pump.asset,note:pump.asset?`Связанный узел ${pump.code} · ${status}`:'Демонстрационный узел'});
    }
  }
  return nodes;
}
export function ancestors(nodes,id) { const path=[]; for(let n=nodes.get(id);n;n=nodes.get(n.parent))path.unshift(n); return path; }
export function descendants(nodes,id) { const out=[]; for(const child of nodes.get(id)?.children||[]){out.push(nodes.get(child),...descendants(nodes,child));} return out; }
