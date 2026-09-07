(function () {
  const assets = window.BNT_DATA.assets;
  const ui = window.BNTUI;
  const filters = {search:"",location:"Все",category:"Все",status:"Все",age:"Все",last:"",next:""};
  const unique = key => ["Все",...new Set(assets.map(item => item[key]))];
  function select(name,label,options) { return `<label class="field"><span>${label}</span><select data-filter="${name}">${options.map(v=>`<option>${v}</option>`).join("")}</select></label>`; }
  function renderFilters() {
    document.getElementById("asset-filters").innerHTML = `<label class="field field-grow"><span>Поиск / внутренний №</span><input data-filter="search" placeholder="Н-101 или PMP-00101"></label>${select("location","Местоположение",unique("location"))}${select("category","Категория",unique("category"))}${select("status","Статус",unique("status"))}${select("age","Возраст",["Все","До 5 лет","5–8 лет","Более 8 лет"])}<label class="field"><span>Последнее ТО после</span><input type="date" data-filter="last"></label><label class="field"><span>Следующее ТО до</span><input type="date" data-filter="next"></label>`;
  }
  const ruDate = value => {const [d,m,y]=value.split(".");return `${y}-${m}-${d}`;};
  function filtered() {
    const year = new Date().getFullYear();
    return assets.filter(item => {
      const q=filters.search.toLowerCase(); const age=year-item.year;
      return (!q || `${item.name} ${item.code} ${item.internal}`.toLowerCase().includes(q)) && (filters.location==="Все"||item.location===filters.location) && (filters.category==="Все"||item.category===filters.category) && (filters.status==="Все"||item.status===filters.status) && (filters.age==="Все"||(filters.age==="До 5 лет"&&age<5)||(filters.age==="5–8 лет"&&age>=5&&age<=8)||(filters.age==="Более 8 лет"&&age>8)) && (!filters.last||ruDate(item.lastService)>=filters.last) && (!filters.next||ruDate(item.nextService)<=filters.next);
    });
  }
  const statusTone = item => item.tone === "red" ? "red" : item.tone === "orange" ? "orange" : "green";
  function render() {
    const rows=filtered();
    document.getElementById("asset-rows").innerHTML = rows.length ? rows.map(item=>`<tr><td><strong>${item.name}</strong><small>${item.model}</small></td><td>${item.category}</td><td>${item.location}</td><td>${item.internal}</td><td>${new Date().getFullYear()-item.year} лет</td><td>${item.load}%${ui.progress(item.load)}</td><td>${item.wear}%${ui.progress(item.wear,item.wear>70?"red":"")}</td><td>${item.lastService}</td><td>${item.nextService}</td><td>${ui.badge(item.status,statusTone(item))}</td><td><a class="btn" href="/equipment-detail?id=${encodeURIComponent(item.id)}">Паспорт</a></td></tr>`).join("") : `<tr><td colspan="11"><div class="empty-state">По выбранным фильтрам активы не найдены</div></td></tr>`;
    const attention=rows.filter(item=>item.tone!=="green").slice(0,4);
    document.getElementById("asset-cards").innerHTML = attention.map(item=>`<a class="card asset-card" href="/equipment-detail?id=${encodeURIComponent(item.id)}"><img src="${item.image}" alt="${item.name}"><div class="card-body"><div class="asset-meta"><span>${item.category}</span>${ui.badge(item.status,statusTone(item))}</div><h3>${item.name}</h3><div class="asset-meta"><span>Износ по нагрузке</span><b>${item.wear}%</b></div>${ui.progress(item.wear,item.wear>70?"red":"")}</div></a>`).join("") || `<article class="card empty-state">Нет активов повышенного внимания</article>`;
  }
  function exportCsv() {
    const columns=["Название","Категория","Локация","Внутренний номер","Износ","Следующее ТО","Статус"];
    const lines=[columns,...filtered().map(a=>[a.name,a.category,a.location,a.internal,a.wear,a.nextService,a.status])].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(";"));
    const link=document.createElement("a");link.href=URL.createObjectURL(new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv"}));link.download="BNT_equipment.csv";link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);ui.toast("Реестр экспортирован",`${filtered().length} активов`);
  }
  renderFilters(); render();
  document.getElementById("asset-filters").addEventListener("input",event=>{const key=event.target.dataset.filter;if(!key)return;filters[key]=event.target.value;render();});
  document.getElementById("export-assets").addEventListener("click",exportCsv);
})();

