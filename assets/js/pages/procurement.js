(function(){
  const data=window.BNT_DATA.procurement,ui=window.BNTUI;let filter="Все позиции";
  const tone=p=>p.priority==="Критично"?"red":p.priority==="Высокий"?"orange":p.priority==="Низкий"?"green":"";
  function filtered(){return data.parts.filter(p=>filter==="Все позиции"||(filter==="Критические"&&p.priority==="Критично")||(filter==="Ниже минимума"&&p.stock<p.min));}
  function render(){
    const below=data.parts.filter(p=>p.stock<p.min),coverage=Math.round(data.parts.reduce((s,p)=>s+Math.min(1,p.stock/p.min),0)/data.parts.length*100);
    document.getElementById("procurement-kpis").innerHTML=[["Критические позиции",data.parts.filter(p=>p.priority==="Критично").length,"требуют срочной закупки"],["Ниже минимума",below.length,"из 6 позиций"],["Покрытие склада",`${coverage}%`,"по страховому запасу"],["Открытые тендеры",data.tenders.length,"$241 тыс. суммарно"]].map((k,i)=>`<article class="card kpi"><span class="label">${k[0]}</span><strong class="${i<2?"delta-down":""}">${k[1]}</strong><small>${k[2]}</small></article>`).join("");
    document.getElementById("parts-rows").innerHTML=filtered().map((p,i)=>{const cover=Math.round(p.stock/p.min*100);return `<tr><td><strong>${p.name}</strong><small>${p.priority}</small></td><td>${p.code}</td><td>${p.stock} / ${p.min}</td><td>${cover}%${ui.progress(cover,cover<40?"red":cover>=100?"green":"")}</td><td>${p.lead} дней</td><td>${p.asset}</td><td>${p.impact}</td><td>${ui.badge(p.status,tone(p))}</td><td><button class="btn" data-order="${i}">Заказать</button></td></tr>`;}).join("");
  }
  document.getElementById("tender-rows").innerHTML=data.tenders.map(t=>`<tr>${t.map((v,i)=>`<td>${i===0?`<strong>${v}</strong>`:v}</td>`).join("")}</tr>`).join("");
  document.getElementById("purchase-actions").innerHTML=data.actions.map(a=>`<div class="warning ${a.tone}"><div><strong>${a.title}</strong><span>${a.text}</span></div></div>`).join("");
  document.getElementById("part-filter").addEventListener("change",e=>{filter=e.target.value;render();});
  function modal(index){const p=data.parts[index]||data.parts[0];ui.modal({title:"Заявка на закупку",submitLabel:"Создать заявку",fields:[{name:"part",label:"Позиция",value:p.name},{name:"code",label:"Код",value:p.code},{name:"quantity",label:"Количество",value:String(Math.max(1,p.min-p.stock))},{name:"deadline",label:"Требуемый срок",value:"15.09.2026"},{name:"supplier",label:"Поставщик",value:"ТехПромСнаб"},{name:"reason",label:"Обоснование",value:`Покрытие ${Math.round(p.stock/p.min*100)}%, связан с ${p.asset}`,full:true}],onSubmit:()=>{p.status="Заявка создана";render();ui.toast("Заявка создана",p.name);}});}
  document.getElementById("parts-rows").addEventListener("click",e=>{const b=e.target.closest("[data-order]");if(b)modal(Number(b.dataset.order));});
  document.getElementById("urgent-purchase").addEventListener("click",()=>modal(0));render();
})();
