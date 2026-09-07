(function () {
  const viewport = document.getElementById("dt-viewport");
  const artboard = document.getElementById("dt-artboard");
  const markers = document.getElementById("dt-markers");
  const stage = document.querySelector(".dt-stage");
  const drawer = document.getElementById("dt-drawer");

  const objects = [
    {
      code:"ЖД", name:"Ж/д эстакада", type:"Логистика",
      x:16, y:43, tone:"orange",
      status:"Требует внимания", load:"76%", wear:"31%", risk:"22%",
      next:"02.10.2026", cost:"$12 300",
      rec:"Учитывать текущую очередь вагонов при планировании приемки и технологических окон.",
      links:[["Логистика","/logistics"],["ТОиР","/toir"]]
    },
    {
      code:"Н-101", name:"Насос Н-101", type:"Центробежный насос",
      x:59, y:50, tone:"red", pulse:true,
      status:"Высокий риск", load:"85%", wear:"72%", risk:"82%",
      next:"11.09.2026", cost:"$18 400",
      rec:"Рост вибрации +28%. Рекомендуется вибродиагностика и подготовка подшипникового узла.",
      links:[
        ["Паспорт оборудования","/equipment-detail?id=pump101"],
        ["Предиктивная аналитика","/analytics"],
        ["ТОиР","/toir"],
        ["Закупки / ЗИП","/procurement"]
      ]
    },
    {
      code:"Н-102", name:"Насос Н-102", type:"Центробежный насос",
      x:63, y:46, tone:"green",
      status:"В эксплуатации", load:"63%", wear:"48%", risk:"18%",
      next:"28.09.2026", cost:"$6 240",
      rec:"Текущие показатели находятся в рабочем диапазоне.",
      links:[["Паспорт оборудования","/equipment-detail?id=pump102"],["ТОиР","/toir"]]
    },
    {
      code:"R-16", name:"Резервуар R-16", type:"Резервуар",
      x:62, y:30, tone:"red", pulse:true,
      status:"Повышенный риск", load:"72%", wear:"61%", risk:"76%",
      next:"12.10.2026", cost:"$12 600",
      rec:"Ограничить загрузку и выполнить дополнительный контроль технического состояния.",
      links:[["Предиктивная аналитика","/analytics"],["ТОиР","/toir"]]
    },
    {
      code:"К-24", name:"Клапан К-24", type:"Предохранительный клапан",
      x:56, y:57, tone:"red", pulse:true,
      status:"Высокий риск", load:"69%", wear:"78%", risk:"78%",
      next:"17.09.2026", cost:"$7 600",
      rec:"Ускорить обеспечение ремкомплектом и совместить работу с ближайшим ремонтным окном.",
      links:[["Закупки / ЗИП","/procurement"],["ТОиР","/toir"]]
    },
    {
      code:"МТР", name:"Склад МТР", type:"Склад критического ЗИП",
      x:36, y:50, tone:"orange",
      status:"Требует внимания", load:"78%", wear:"—", risk:"42%",
      next:"—", cost:"$186 000",
      rec:"Три критические позиции находятся ниже страхового минимума.",
      links:[["Закупки и склад","/procurement"]]
    }
  ];

  const layerDefs = [
    ["zones","Зоны"],
    ["assets","Объекты"],
    ["risks","Риски"],
    ["toir","ТОиР"],
    ["logistics","Логистика"],
    ["spares","Критический ЗИП"]
  ];

  const active = new Set(["zones","assets"]);
  let scale = 1, tx = 0, ty = 0, dragging = false, dragStart = null;

  function fitArtboard() {
    const rect = viewport.getBoundingClientRect();
    const ratio = 1024 / 576;
    let width = rect.width;
    let height = width / ratio;

    if (height > rect.height) {
      height = rect.height;
      width = height * ratio;
    }

    artboard.style.width = `${width}px`;
    artboard.style.height = `${height}px`;
    applyTransform();
  }

  function applyTransform() {
    artboard.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    document.getElementById("dt-scale").textContent = `${Math.round(scale * 100)}%`;
    stage.classList.toggle("detail-on", scale >= 1.45);
  }

  function createMarker(item) {
    const button = document.createElement("button");
    button.className = `dt-marker ${item.tone}`;
    button.dataset.risk = item.pulse ? "1" : "0";
    button.style.left = `${item.x}%`;
    button.style.top = `${item.y}%`;
    button.innerHTML = `
      <span class="dt-marker-dot">${item.code}</span>
      <span class="dt-marker-label">${item.name}</span>
    `;
    button.addEventListener("click", event => {
      event.stopPropagation();
      openObject(item);
    });
    return button;
  }

  objects.forEach(item => markers.append(createMarker(item)));

  function buildLayerButtons() {
    const root = document.getElementById("dt-layer-buttons");
    root.innerHTML = layerDefs.map(([id,label]) => `
      <button class="dt-layer-btn ${active.has(id) ? "active" : ""}" data-layer="${id}">
        <i></i>${label}
      </button>
    `).join("");

    root.addEventListener("click", event => {
      const button = event.target.closest("[data-layer]");
      if (!button) return;
      const id = button.dataset.layer;
      active.has(id) ? active.delete(id) : active.add(id);
      updateLayers();
    });
  }

  function updateLayers() {
    document.querySelectorAll(".dt-layer-btn").forEach(button => {
      button.classList.toggle("active", active.has(button.dataset.layer));
    });

    document.querySelectorAll("[data-layer-group]").forEach(group => {
      group.style.display = active.has(group.dataset.layerGroup) ? "" : "none";
    });

    markers.style.display = active.has("assets") ? "" : "none";

    markers.querySelectorAll(".dt-marker").forEach(marker => {
      marker.classList.toggle(
        "risk",
        active.has("risks") && marker.dataset.risk === "1"
      );
    });
  }

  function openObject(item) {
    document.getElementById("dt-drawer-type").textContent = item.type;
    document.getElementById("dt-drawer-title").textContent = item.name;

    const metrics = [
      ["Загрузка",item.load],
      ["Износ",item.wear],
      ["Риск простоя",item.risk],
      ["Следующее ТО",item.next],
      ["Расходы на ремонт",item.cost],
      ["Состояние данных","Актуально"]
    ];

    document.getElementById("dt-drawer-body").innerHTML = `
      <span class="dt-status ${item.tone}">${item.status}</span>

      <div class="dt-metric-grid">
        ${metrics.map(([label,value]) => `
          <div><span>${label}</span><strong>${value}</strong></div>
        `).join("")}
      </div>

      <div class="dt-reco">
        <strong>Рекомендация системы</strong>
        <p>${item.rec}</p>
      </div>

      <nav class="dt-links">
        ${item.links.map(([label,href]) => `
          <a href="${href}"><span>${label}</span><b>→</b></a>
        `).join("")}
      </nav>
    `;

    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden","false");
  }

  document.getElementById("dt-drawer-close").addEventListener("click", () => {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden","true");
  });

  function zoom(delta) {
    scale = Math.max(1, Math.min(2.2, scale + delta));
    if (scale === 1) { tx = 0; ty = 0; }
    applyTransform();
  }

  function reset() {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  }

  document.getElementById("dt-plus").addEventListener("click", () => zoom(.18));
  document.getElementById("dt-minus").addEventListener("click", () => zoom(-.18));
  document.getElementById("dt-home").addEventListener("click", reset);
  document.getElementById("dt-reset").addEventListener("click", reset);

  document.getElementById("dt-risks").addEventListener("click", () => {
    active.add("risks");
    updateLayers();
    window.BNTUI?.toast(
      "Критические риски",
      "На схеме выделены объекты, требующие повышенного внимания"
    );
  });

  document.getElementById("dt-search").addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    const query = event.currentTarget.value.trim().toLowerCase();
    const item = objects.find(object =>
      object.name.toLowerCase().includes(query) ||
      object.code.toLowerCase().includes(query)
    );

    if (item) {
      openObject(item);
    } else {
      window.BNTUI?.toast("Объект не найден","Проверьте обозначение или название объекта");
    }
  });

  viewport.addEventListener("wheel", event => {
    event.preventDefault();
    zoom(event.deltaY < 0 ? .10 : -.10);
  }, {passive:false});

  viewport.addEventListener("pointerdown", event => {
    if (event.target.closest("button,input")) return;
    dragging = true;
    dragStart = {x:event.clientX - tx, y:event.clientY - ty};
    viewport.classList.add("dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", event => {
    if (!dragging) return;
    tx = event.clientX - dragStart.x;
    ty = event.clientY - dragStart.y;
    applyTransform();
  });

  viewport.addEventListener("pointerup", () => {
    dragging = false;
    viewport.classList.remove("dragging");
  });

  new ResizeObserver(fitArtboard).observe(viewport);

  buildLayerButtons();
  updateLayers();
  fitArtboard();
})();
