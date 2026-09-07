(function () {
  const data = window.BNT_DATA.operations;
  const ui = window.BNTUI;
  const state = { mode: "fallback", zoom: 17, active: new Set(data.layers.map(layer => layer[0])), overlays: {}, map: null };
  const byId = id => document.getElementById(id);
  const tone = value => value === "red" ? "#e94759" : value === "orange" ? "#e99919" : "#168eea";

  function buildLayerButtons() {
    byId("layer-buttons").innerHTML = data.layers.map(([id,label,color]) => `<button class="layer-button active" data-layer="${id}"><i style="--layer-color:${color}"></i>${label}</button>`).join("");
    byId("layer-buttons").addEventListener("click", event => {
      const button = event.target.closest("[data-layer]");
      if (!button) return;
      const layer = button.dataset.layer;
      state.active.has(layer) ? state.active.delete(layer) : state.active.add(layer);
      updateVisibility();
    });
  }

  function loadGoogleMaps(key) {
    return new Promise((resolve,reject) => {
      if (window.google?.maps) return resolve();
      const callback = `__bntMapReady${Date.now()}`;
      const script = document.createElement("script");
      window[callback] = () => { delete window[callback]; resolve(); };
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callback}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onerror = () => { delete window[callback]; reject(new Error("Google Maps unavailable")); };
      document.head.appendChild(script);
    });
  }

  const adapter = (object, meta = {}) => ({ object, meta, show(visible) { object.setMap(visible ? state.map : null); } });
  function push(layer, object, meta) { (state.overlays[layer] ||= []).push(adapter(object, meta)); }

  function buildGoogleOverlays() {
    data.zones.forEach(zone => {
      const polygon = new google.maps.Polygon({paths:zone.path,strokeColor:zone.color,strokeOpacity:.78,strokeWeight:2,fillColor:zone.color,fillOpacity:.075,clickable:true});
      polygon.addListener("click", () => openDrawer({name:zone.name,type:"Операционная зона",status:"В эксплуатации",tone:"green",load:68,wear:31,risk:18,next:"По графику",cost:"$34 000",recommendation:"Отклонений по пропускной способности нет.",id:zone.id}));
      push("zones", polygon, {minZoom:0});
    });
    data.tanks.forEach(tank => {
      const circle = new google.maps.Circle({center:tank.position,radius:tank.radius,strokeColor:tank.critical?"#e94759":"#26bdec",strokeOpacity:.9,strokeWeight:2,fillColor:tank.critical?"#e94759":"#26bdec",fillOpacity:tank.critical?.10:.045,clickable:true});
      circle.addListener("click", () => openTank(tank));
      push("tanks", circle, {minZoom:tank.major?17:19});
      const label = new google.maps.Marker({position:tank.position,label:{text:tank.id,color:"#fff",fontSize:"9px",fontWeight:"700"},icon:{path:google.maps.SymbolPath.CIRCLE,scale:0},clickable:false});
      push("tanks", label, {minZoom:19,label:true});
    });
    data.pipelines.forEach(pipe => push("pipelines", new google.maps.Polyline({path:pipe.path,strokeColor:pipe.color,strokeOpacity:.86,strokeWeight:4,clickable:false}), {minZoom:17}));
    data.equipment.forEach(item => {
      const marker = new google.maps.Marker({position:item.position,title:item.name,label:{text:item.code,color:"#fff",fontSize:"9px",fontWeight:"700"},icon:{path:google.maps.SymbolPath.CIRCLE,scale:item.major?12:9,fillColor:tone(item.tone),fillOpacity:1,strokeColor:"#fff",strokeWeight:2}});
      marker.addListener("click", () => openDrawer(item));
      push("equipment", marker, {minZoom:item.major?0:19});
    });
    data.equipment.filter(item => item.risk >= 40).forEach(item => {
      const ring = new google.maps.Circle({center:item.position,radius:item.major?42:28,strokeColor:"#e94759",strokeOpacity:.7,strokeWeight:2,fillColor:"#e94759",fillOpacity:.05,clickable:false});
      push("risks", ring, {minZoom:item.major?0:18});
    });
    data.maintenance.forEach(item => push("maintenance", new google.maps.Marker({position:item.position,title:item.name,label:{text:"ТО",color:"#fff",fontSize:"8px",fontWeight:"700"},icon:{path:google.maps.SymbolPath.CIRCLE,scale:10,fillColor:"#e99919",fillOpacity:1,strokeColor:"#fff",strokeWeight:2}}), {minZoom:19}));
    push("logistics", new google.maps.Polyline({path:data.logistics.path,strokeColor:"#16a76c",strokeOpacity:.9,strokeWeight:4,icons:[{icon:{path:google.maps.SymbolPath.FORWARD_CLOSED_ARROW,scale:2.4},offset:"55%"}]}), {minZoom:17});
    data.procurement.forEach(item => push("procurement", new google.maps.Marker({position:item.position,title:item.name,label:{text:"ЗИП",color:"#fff",fontSize:"8px",fontWeight:"700"},icon:{path:google.maps.SymbolPath.CIRCLE,scale:12,fillColor:"#705ac8",fillOpacity:1,strokeColor:"#fff",strokeWeight:2}}), {minZoom:17}));
  }

  function project(position) {
    const bounds = data.bounds;
    return {left:(position.lng-bounds.west)/(bounds.east-bounds.west)*100,top:(bounds.north-position.lat)/(bounds.north-bounds.south)*100};
  }
  function points(path) { return path.map(p => { const q=project(p); return `${q.left},${q.top}`; }).join(" "); }
  function buildFallback() {
    const root = byId("fallback-overlays");
    const zones = data.zones.map(zone => `<polygon data-fallback-layer="zones" points="${points(zone.path)}" fill="${zone.color}" fill-opacity=".08" stroke="${zone.color}" stroke-width=".18"/>`).join("");
    const pipes = data.pipelines.map(pipe => `<polyline data-fallback-layer="pipelines" points="${points(pipe.path)}" fill="none" stroke="${pipe.color}" stroke-width=".28"/>`).join("");
    const logistics = `<polyline data-fallback-layer="logistics" points="${points(data.logistics.path)}" fill="none" stroke="#16a76c" stroke-width=".32" stroke-dasharray=".7 .45"/>`;
    const tankNodes = data.tanks.filter(t => t.major).map(tank => {const p=project(tank.position);return `<button data-fallback-layer="tanks" class="fallback-tank ${tank.critical?"risk":""}" style="left:${p.left}%;top:${p.top}%" data-tank="${tank.id}" title="${tank.id}"></button>`;}).join("");
    const equipment = data.equipment.filter(item => item.major).map(item => {const p=project(item.position);return `<button data-fallback-layer="equipment" class="fallback-marker ${item.tone}" style="left:${p.left}%;top:${p.top}%" data-object="${item.id}"><b>${item.code}</b><span>${item.name}</span></button>`;}).join("");
    const risks = data.equipment.filter(item => item.major && item.risk>=40).map(item => {const p=project(item.position);return `<i data-fallback-layer="risks" class="fallback-risk" style="left:${p.left}%;top:${p.top}%"></i>`;}).join("");
    const maintenance = data.maintenance.map(item => {const p=project(item.position);return `<i data-fallback-layer="maintenance" class="fallback-mini maintenance" style="left:${p.left}%;top:${p.top}%">ТО</i>`;}).join("");
    const procurement = data.procurement.map(item => {const p=project(item.position);return `<i data-fallback-layer="procurement" class="fallback-mini procurement" style="left:${p.left}%;top:${p.top}%">ЗИП</i>`;}).join("");
    root.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${zones}${pipes}${logistics}</svg>${tankNodes}${equipment}${risks}${maintenance}${procurement}`;
    root.addEventListener("click", event => {
      const object = event.target.closest("[data-object]");
      const tank = event.target.closest("[data-tank]");
      if (object) openDrawer(data.equipment.find(item => item.id === object.dataset.object));
      if (tank) openTank(data.tanks.find(item => item.id === tank.dataset.tank));
    });
  }

  function lodVisible(meta) { return state.zoom >= (meta.minZoom || 0) && (!meta.maxZoom || state.zoom <= meta.maxZoom); }
  function updateVisibility() {
    document.querySelectorAll("[data-layer]").forEach(button => button.classList.toggle("active", state.active.has(button.dataset.layer)));
    if (state.mode === "google") Object.entries(state.overlays).forEach(([layer,items]) => items.forEach(item => item.show(state.active.has(layer) && lodVisible(item.meta))));
    document.querySelectorAll("[data-fallback-layer]").forEach(node => {node.hidden = !state.active.has(node.dataset.fallbackLayer);});
    byId("zoom-level").textContent = `LOD ${state.zoom}`;
    byId("layer-status").textContent = `Активно: ${data.layers.filter(layer => state.active.has(layer[0])).map(layer => layer[1]).join(" · ")}`;
  }

  function openTank(tank) {
    openDrawer({id:tank.id,name:`Резервуар ${tank.id}`,type:"Резервуарный парк",status:tank.critical?"Высокий риск":"В эксплуатации",tone:tank.critical?"red":"green",load:tank.load,wear:tank.wear,risk:tank.critical?76:18,next:tank.next,cost:"$12 600",recommendation:tank.critical?"Ограничить загрузку до 72% и выполнить контроль толщины стенки.":"Продолжить эксплуатацию по текущему графику."});
  }
  function openDrawer(item) {
    if (!item) return;
    byId("drawer-title").textContent = item.name;
    byId("drawer-subtitle").textContent = item.type;
    byId("drawer-body").innerHTML = `<span class="badge ${item.tone || "green"}">${ui.escape(item.status)}</span><div class="drawer-metrics">${[["Загрузка",`${item.load}%`],["Износ",`${item.wear || 0}%`],["Риск простоя",`${item.risk}%`],["Следующее ТО",item.next],["Стоимость ремонтов",item.cost],["Телеметрия","Онлайн"]].map(([label,value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}</div><div class="drawer-recommend"><strong>Рекомендация системы</strong><p>${ui.escape(item.recommendation)}</p></div><nav class="drawer-links"><a href="/equipment-detail?id=${encodeURIComponent(item.id)}">Паспорт оборудования <b>→</b></a><a href="/analytics">Предиктивная аналитика <b>→</b></a><a href="/toir">Работы ТОиР <b>→</b></a><a href="/procurement">Закупки / ЗИП <b>→</b></a></nav>`;
    byId("object-drawer").classList.add("open");
    byId("object-drawer").setAttribute("aria-hidden","false");
  }

  function setZoom(value) {
    const next = Math.max(16,Math.min(21,value));
    state.zoom = next;
    if (state.mode === "google" && state.map.getZoom() !== next) state.map.setZoom(next);
    byId("fallback-map").style.setProperty("--fallback-scale", String(1 + (next-17)*.08));
    updateVisibility();
  }
  function reset() {
    setZoom(17);
    if (state.map) state.map.panTo(data.center);
  }
  function bind() {
    byId("zoom-in").addEventListener("click", () => setZoom(state.zoom+1));
    byId("zoom-out").addEventListener("click", () => setZoom(state.zoom-1));
    byId("map-reset").addEventListener("click", reset);
    byId("show-risks").addEventListener("click", () => {state.active.add("risks");updateVisibility();ui.toast("Риски включены","На карте показаны объекты повышенного внимания");});
    byId("drawer-close").addEventListener("click", () => {byId("object-drawer").classList.remove("open");byId("object-drawer").setAttribute("aria-hidden","true");});
    byId("map-search").addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      const q = event.currentTarget.value.trim().toLowerCase();
      const object = data.equipment.find(item => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q));
      const tank = data.tanks.find(item => item.id.toLowerCase().includes(q));
      if (object) {openDrawer(object);if(state.map){state.map.panTo(object.position);setZoom(19);}}
      else if (tank) {openTank(tank);if(state.map){state.map.panTo(tank.position);setZoom(19);}}
      else ui.toast("Объект не найден","Проверьте обозначение или внутренний номер");
    });
  }

  async function init() {
    buildLayerButtons(); buildFallback(); bind(); updateVisibility();
    try {
      const response = await fetch("/api/config", {cache:"no-store"});
      if (!response.ok) return;
      const config = await response.json();
      const key = String(config.googleMapsApiKey || "");
      if (!/^[A-Za-z0-9_-]{20,}$/.test(key)) return;
      await loadGoogleMaps(key);
      state.map = new google.maps.Map(byId("google-map"), {center:config.center || data.center,zoom:Number(config.zoom)||17,mapTypeId:"satellite",streetViewControl:false,fullscreenControl:false,mapTypeControl:false,rotateControl:false,tilt:0,gestureHandling:"greedy"});
      state.mode = "google";
      buildGoogleOverlays();
      state.map.addListener("zoom_changed", () => {state.zoom=state.map.getZoom()||17;updateVisibility();});
      byId("google-map").hidden=false; byId("fallback-map").hidden=true; byId("map-mode").textContent="Google Maps · Live";
      updateVisibility();
    } catch (_) {
      byId("map-mode").textContent="Satellite · Demo";
    }
  }
  window.addEventListener("DOMContentLoaded", init);
})();
