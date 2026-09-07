(function(){
  const original=JSON.parse(JSON.stringify(window.BNT_DATA.logistics));let data=JSON.parse(JSON.stringify(original));const ui=window.BNTUI;
  function render(){
    const total=data.wagons.reduce((s,r)=>s+r.wagons,0),confirmed=data.wagons.filter(r=>!["План"].includes(r.status)).reduce((s,r)=>s+r.wagons,0),volume=data.wagons.reduce((s,r)=>s+r.volume,0),maxQueue=Math.max(...data.wagons.map(r=>r.queue));
    document.getElementById("logistics-kpis").innerHTML=[["Всего вагонов",total,"7 дней"],["Подтверждено",confirmed,`${Math.round(confirmed/total*100)}% плана`],["Входящий объем",`${volume} м³`,"4 продукта"],["Прогноз очереди",`${maxQueue} ч`,maxQueue>7?"Требует решения":"В норме"]].map((k,i)=>`<article class="card kpi"><span class="label">${k[0]}</span><strong class="${i===3&&maxQueue>7?"delta-down":""}">${k[1]}</strong><small>${k[2]}</small></article>`).join("");
    document.getElementById("wagon-plan").innerHTML=data.wagons.map(r=>`<tr><td>${r.date}</td><td><strong>${r.product}</strong></td><td>${r.wagons}</td><td>${r.volume} м³</td><td>${ui.badge(r.status,r.status==="Разгрузка"?"green":r.status==="В пути"?"orange":"")}</td><td>${r.section}</td><td>${ui.badge(`${r.queue} ч`,r.queue>7?"red":r.queue>4?"orange":"green")}</td></tr>`).join("");
    document.getElementById("logistics-warnings").innerHTML=data.warnings.map(w=>`<div class="warning ${w.tone}"><div><strong>${w.title}</strong><span>${w.text}</span></div></div>`).join("");
    document.getElementById("product-volume").innerHTML=data.products.map(r=>`<div class="bar-row"><span>${r[0]}</span>${ui.progress(r[1]/14)}<b>${r[1]} м³</b></div>`).join("");
    document.getElementById("tank-capacity").innerHTML=data.capacities.map(r=>`<div class="bar-row"><span>${r[0]}</span>${ui.progress(r[1]/350)}<b>${r[1]} м³</b></div>`).join("");
  }
  function act(action){
    if(action==="reset")data=JSON.parse(JSON.stringify(original));
    if(action==="transfer"){data.wagons[5].wagons=0;data.wagons[5].volume=0;data.wagons[3].queue=4;data.wagons[5].queue=0;data.warnings=data.warnings.filter((_,i)=>i!==2);}
    if(action==="section2"){data.wagons.filter(r=>r.section==="Секция 1").slice(-2).forEach(r=>{r.section="Секция 2";r.queue=Math.max(0,r.queue-4);});data.capacities[0][1]+=840;data.capacities[1][1]-=840;}
    if(action==="merge"){data.wagons.forEach(r=>r.queue=Math.max(0,r.queue-2));data.warnings=[{tone:"green",title:"Окна объединены",text:"Прогнозируемый простой снижен на 18 часов."},...data.warnings.slice(0,2)];}
    if(action==="recalculate")data.warnings=[{tone:"green",title:"План пересчитан",text:"Ограничения емкостей и ТОиР учтены."},...data.warnings];
    render();ui.toast("Логистический план обновлен",action==="reset"?"Восстановлен базовый сценарий":"KPI и очередь пересчитаны");
  }
  document.addEventListener("click",e=>{const b=e.target.closest("[data-log-action]");if(b)act(b.dataset.logAction);});render();
})();

