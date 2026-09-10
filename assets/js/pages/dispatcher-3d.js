import {createHierarchy,ancestors,descendants} from '/assets/3d/hierarchy.js';
import {tankDescriptors} from '/assets/3d/layout.js';
const $=s=>document.querySelector(s), viewport=$('#dt-viewport');
const labels={terminal:'Терминал',zone:'Зона',tank:'Резервуар',pump:'Насос',valve:'Клапан',sensor:'Датчик',motor:'Электродвигатель',coupling:'Муфта',cabinet:'Шкаф управления',equipment:'Оборудование'};
const icons={zone:'ЗОНА',tank:'РВС',pump:'Н',valve:'К',sensor:'КИП',motor:'М',coupling:'МФ',cabinet:'ШУ',equipment:'ОБ'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let scene,nodes=createHierarchy(tankDescriptors,window.BNT_DATA.assets),current='terminal',riskOnly=false;
function error(message){$('#dt-loading').hidden=true;$('#dt-scene-error').hidden=false;$('#dt-scene-error p').textContent=message;}
viewport.addEventListener('scene-error',e=>error(e.detail));
function zoneOf(id){return ancestors(nodes,id).find(n=>n.type==='zone');}
function isRisk(node){return ['red','orange'].includes(node.asset?.tone);}
function row(node){const a=node.asset;return `<button class="dt3-item" data-node="${escape(node.id)}" data-risk="${isRisk(node)}"><span class="dt3-item-icon">${icons[node.type]||'BNT'}</span><span class="dt3-item-label"><strong>${escape(node.name)}</strong><small>${a?escape(a.status):node.type==='zone'?`${node.children.length} объектов`:node.type==='tank'?`${escape(node.product)} · ${node.fill}%`:node.illustrative?'Демонстрационное оборудование':escape(labels[node.type])}${node.children.length&&node.type!=='zone'?` · ${node.children.length} узла`:''}</small></span><span class="dt3-item-arrow" aria-hidden="true">›</span></button>`;}
function metric(label,value){return `<div class="dt3-metric"><span>${label}</span><strong>${escape(value)}</strong></div>`;}
function render(){
 const node=nodes.get(current),asset=node.asset,query=$('#dt-search').value.trim().toLocaleLowerCase('ru');
 const path=ancestors(nodes,current);
 $('#dt-breadcrumbs').innerHTML=path.map((n,i)=>`${i?'<span>›</span>':''}${n.id===current?`<span aria-current="location">${escape(n.code)}</span>`:`<button type="button" data-node="${escape(n.id)}">${escape(n.id==='terminal'?'Терминал':n.code)}</button>`}`).join('');
 $('#dt-drawer-type').textContent=labels[node.type];$('#dt-drawer-title').textContent=node.name;$('#dt-focus-label').textContent=node.name;
 const zone=zoneOf(current);$('#dt-zone-buttons').innerHTML=[...nodes.values()].filter(n=>n.type==='zone').map(n=>`<button type="button" data-node="${n.id}" aria-pressed="${zone?.id===n.id}">${escape(n.name)}</button>`).join('');
 let html='';
 if(asset){html+=`<span class="dt3-status ${escape(asset.tone)}">${escape(asset.status)}</span><p class="dt3-note">${escape(asset.location)} · ${escape(asset.model)}<br>Показатели из демонстрационного реестра БНТ</p><div class="dt3-metrics">${metric('Загрузка',asset.load+'%')}${metric('Износ',asset.wear+'%')}${metric('Следующее ТО',asset.nextService)}${metric('Расходы на ремонт',asset.cost)}</div>`;}
 else if(node.type==='terminal'){html+='<p class="dt3-note">Выберите зону на модели или в списке. Затем откройте резервуар и связанное оборудование.</p><div class="dt3-metrics">'+metric('Зоны',6)+metric('Резервуары',tankDescriptors.length)+'</div>';}
 else if(node.type==='zone'){const all=descendants(nodes,node.id);html+=`<div class="dt3-metrics">${metric('Резервуары',all.filter(n=>n.type==='tank').length)}${metric('Объекты с риском',all.filter(isRisk).length)}</div><p class="dt3-note">Границы и размещение оборудования показаны условно. Выберите объект для детального просмотра.</p>`;}
 else if(node.type==='tank'){html+=`<span class="dt3-status">${escape(node.product)}</span><p class="dt3-note">Демонстрационный резервуар. Технические показатели не подключены к реестру.</p>`;}
 else html+=`<p class="dt3-note">${escape(node.note||'Демонстрационная компоновка. Паспорт и технические показатели не заведены.')}</p>`;
 if(node.type==='tank')html+=`<div class="dt3-fill"><label for="dt-fill">Наполнение · демо <strong id="dt-fill-value">${node.fill}%</strong></label><input id="dt-fill" type="range" min="0" max="100" value="${node.fill}" aria-label="Демонстрационное наполнение резервуара"><p class="dt3-note" style="margin-bottom:0">Изменяет только 3D-визуализацию, без записи в реестр.</p></div>`;
 if(asset?.recommendation)html+=`<div class="dt3-recommendation">${escape(asset.recommendation)}</div>`;
 let list=node.children.map(id=>nodes.get(id)),heading=node.type==='terminal'?'Зоны терминала':node.type==='zone'?'Объекты зоны':node.type==='tank'?'Оборудование резервуара':'Состав оборудования';
 if(query||riskOnly){list=[...nodes.values()].filter(n=>n.id!=='terminal'&&(!riskOnly||isRisk(n))&&(!query||`${n.name} ${n.code} ${n.asset?.internal||''}`.toLocaleLowerCase('ru').includes(query)));heading=riskOnly?'Объекты с риском':'Результаты поиска';}
 if(list.length||query||riskOnly)html+=`<div class="dt3-section-title">${heading}<small>${list.length}</small></div><div class="dt3-list">${list.length?list.map(row).join(''):'<p class="dt3-empty">Ничего не найдено. Попробуйте код или название объекта.</p>'}</div>`;
 else html+='<p class="dt3-note">Это конечный узел. Вернитесь к оборудованию, чтобы выбрать другой компонент.</p>';
 if(node.parent)html+=`<button class="dt3-back" type="button" data-node="${escape(node.parent)}">← ${escape(nodes.get(node.parent).name)}</button>`;
 if(asset)html+=`<div class="dt3-links"><a href="/equipment-detail?id=${encodeURIComponent(asset.id)}">Паспорт оборудования</a><a href="/toir?action=repair&asset=${encodeURIComponent(asset.name)}">Создать заявку ТОиР</a><a href="/analytics">Предиктивная аналитика</a><a href="/procurement">Закупки и ЗИП</a></div>`;
 else if(node.module)html+=`<div class="dt3-links"><a href="${node.module}">Открыть ${node.module==='/logistics'?'логистику':'закупки и склад'}</a></div>`;
 $('#dt-drawer-body').innerHTML=html;
}
function select(id,{focus=true,history=true}={}){
 if(!nodes?.has(id))return;
 current=id;$('#dt-search').value='';riskOnly=false;$('#dt-risks').setAttribute('aria-pressed','false');
 scene?.select(id,focus);render();$('#dt-drawer').scrollTop=0;
 if(history){const url=new URL(location.href);if(id==='terminal')url.searchParams.delete('object');else url.searchParams.set('object',id);window.history.replaceState(null,'',url);}
}
 document.querySelector('.dt3-workspace').addEventListener('click',e=>{const btn=e.target.closest('[data-node]');if(btn)select(btn.dataset.node);});
 $('#dt-search').addEventListener('input',render);
 $('#dt-risks').addEventListener('click',()=>{riskOnly=!riskOnly;$('#dt-risks').setAttribute('aria-pressed',String(riskOnly));render();});
 $('#dt-drawer-close').addEventListener('click',()=>select('terminal'));
 $('#dt-reset').addEventListener('click',()=>select('terminal'));
 $('#dt-plus').addEventListener('click',()=>scene.zoom(.8));$('#dt-minus').addEventListener('click',()=>scene.zoom(1.25));
 $('#dt-iso').addEventListener('click',()=>scene.view('iso'));$('#dt-top').addEventListener('click',()=>scene.view('top'));$('#dt-port').addEventListener('click',()=>scene.view('port'));
 $('#dt-theme').addEventListener('click',()=>{const light=scene.theme();$('.dt3-model').classList.toggle('dark',!light);$('#dt-theme').textContent=light?'Тёмная тема':'Светлая тема';});
 $('#dt-motion').textContent='Пауза движения';$('#dt-motion').addEventListener('click',()=>{$('#dt-motion').textContent=scene.pause()?'Пауза движения':'Продолжить движение';});
 $('#dt-drawer-body').addEventListener('input',e=>{if(e.target.id!=='dt-fill')return;const fill=Number(e.target.value);nodes.get(current).fill=fill;scene?.setFill(current,fill);$('#dt-fill-value').textContent=fill+'%';});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current!=='terminal')select(nodes.get(current).parent||'terminal');});
 const initial=new URL(location.href).searchParams.get('object')||new URL(location.href).searchParams.get('id')||'terminal';
 select(nodes.has(initial)?initial:'terminal',{history:false,focus:initial!=='terminal'});

 window.addEventListener('pagehide',e=>{if(!e.persisted)scene?.dispose();});

// Navigation remains available when WebGL is unavailable; only the canvas controls are disabled.
const cameraButtons=[...document.querySelectorAll('.dt3-camera button,.dt3-scene-tools button')];
cameraButtons.forEach(button=>button.disabled=true);
try {
 const {createTerminalScene}=await import('/assets/3d/terminal-scene.js');
 scene=createTerminalScene(viewport,id=>select(id));
 scene.bind(nodes);scene.select(current,current!=='terminal');
 cameraButtons.forEach(button=>button.disabled=false);
 $('#dt-motion').textContent=scene.animating?'Пауза движения':'Продолжить движение';
 $('#dt-loading').hidden=true;
} catch(e) {
 console.error('BNT 3D initialization failed',e);
 error('В этом браузере недоступно 3D. Включите аппаратное ускорение и обновите страницу. Зоны и карточки доступны справа.');
}
