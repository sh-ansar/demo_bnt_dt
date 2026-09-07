window.BNTDigitalTwin = {

  config: null,

  map: null,

  overlays: [],

  markers: [],

  currentLayer: "operations",

  equipment: [
    {
      id: "pump-101",
      title: "Насос Н-101",
      type: "Центробежный насос",
      status: "Высокий риск",
      statusColor: "red",

      position: {
        lat: 41.64395,
        lng: 41.65880
      },

      load: "85%",
      wear: "72%",
      nextMaintenance: "11.09.2024",
      downtimeRisk: "82%",
      repairCost: "$18 400",

      recommendation:
        "Провести вибродиагностику " +
        "и подготовить подшипниковый " +
        "узел к замене."
    },

    {
      id: "pump-102",
      title: "Насос Н-102",
      type: "Центробежный насос",
      status: "Работает",
      statusColor: "green",

      position: {
        lat: 41.64410,
        lng: 41.65920
      },

      load: "63%",
      wear: "48%",
      nextMaintenance: "28.09.2024",
      downtimeRisk: "18%",
      repairCost: "$6 240",

      recommendation:
        "Продолжить эксплуатацию " +
        "по плановому графику."
    },

    {
      id: "rail-rack",
      title: "Ж/д эстакада",
      type: "Логистический объект",
      status: "Работает",
      statusColor: "green",

      position: {
        lat: 41.64625,
        lng: 41.65700
      },

      load: "76%",
      wear: "31%",
      nextMaintenance: "02.10.2024",
      downtimeRisk: "22%",
      repairCost: "$12 300",

      recommendation:
        "Контролировать очередь " +
        "на 12–13 сентября."
    },

    {
      id: "warehouse",
      title: "Склад МТР",
      type: "Склад запасных частей",
      status: "Требует внимания",
      statusColor: "orange",

      position: {
        lat: 41.64295,
        lng: 41.66090
      },

      load: "78%",
      wear: "—",
      nextMaintenance: "—",
      downtimeRisk: "3 позиции",
      repairCost: "$186 000",

      recommendation:
        "Ускорить закупку подшипников " +
        "6312 и уплотнений MTG-45."
    },

    {
      id: "pier",
      title: "Причал / Стендер",
      type: "Отгрузочный объект",
      status: "Работает",
      statusColor: "green",

      position: {
        lat: 41.64260,
        lng: 41.66320
      },

      load: "54%",
      wear: "50%",
      nextMaintenance: "13.09.2024",
      downtimeRisk: "21%",
      repairCost: "$9 700",

      recommendation:
        "Совместить диагностику " +
        "с ближайшим технологическим окном."
    }
  ],

  sections: [
    {
      id: "section-1",
      title: "Секция 1",

      color: "#1683e8",

      path: [
        { lat: 41.64560, lng: 41.65780 },
        { lat: 41.64565, lng: 41.66025 },
        { lat: 41.64435, lng: 41.66025 },
        { lat: 41.64430, lng: 41.65780 }
      ],

      load: "68%",
      volume: "54 400 м³",
      capacity: "80 000 м³",
      risk: "Высокий",
      equipmentCount: "24 объекта"
    },

    {
      id: "section-2",
      title: "Секция 2",

      color: "#17a66c",

      path: [
        { lat: 41.64545, lng: 41.66030 },
        { lat: 41.64550, lng: 41.66210 },
        { lat: 41.64415, lng: 41.66210 },
        { lat: 41.64415, lng: 41.66030 }
      ],

      load: "58%",
      volume: "46 400 м³",
      capacity: "80 000 м³",
      risk: "Средний",
      equipmentCount: "21 объект"
    }
  ],

  async init() {

    this.bindUI();

    try {

      await this.loadConfig();

      if (!this.config.googleMapsApiKey) {
        this.showFallback();
        return;
      }

      await this.loadGoogleMaps();

      this.createMap();

      this.renderTerminal();

    }
    catch (error) {

      console.error(error);

      this.showFallback();

      this.toast(
        "Google Maps API",
        "Используется fallback-карта. " +
        error.message
      );
    }
  },

  async loadConfig() {

    const response =
      await fetch("/api/config");

    if (!response.ok) {
      throw new Error(
        "Не удалось загрузить /api/config"
      );
    }

    this.config =
      await response.json();
  },

  loadGoogleMaps() {

    return new Promise(
      (resolve, reject) => {

        if (
          window.google &&
          window.google.maps
        ) {
          resolve();
          return;
        }

        window.__bntMapsReady =
          () => resolve();

        const script =
          document.createElement("script");

        script.src =
          "https://maps.googleapis.com/maps/api/js" +
          "?key=" +
          encodeURIComponent(
            this.config.googleMapsApiKey
          ) +
          "&callback=__bntMapsReady" +
          "&v=weekly";

        script.async = true;

        script.defer = true;

        script.onerror =
          () => reject(
            new Error(
              "Google Maps JavaScript API " +
              "не загрузился"
            )
          );

        document.head.appendChild(script);
      }
    );
  },

  createMap() {

    this.map =
      new google.maps.Map(
        document.getElementById(
          "bnt-google-map"
        ),
        {
          center: this.config.center,

          zoom:
            this.config.zoom || 17,

          mapTypeId: "satellite",

          tilt: 0,

          heading: 0,

          streetViewControl: false,

          mapTypeControl: false,

          fullscreenControl: false,

          zoomControl: true,

          gestureHandling: "greedy"
        }
      );
  },

  renderTerminal() {

    this.clear();

    this.drawSections();

    this.drawPipelines();

    this.drawEquipment();

  },

  clear() {

    this.overlays.forEach(
      item => item.setMap?.(null)
    );

    this.markers.forEach(
      item => item.setMap?.(null)
    );

    this.overlays = [];

    this.markers = [];
  },

  drawSections() {

    this.sections.forEach(
      section => {

        const polygon =
          new google.maps.Polygon({
            map: this.map,

            paths:
              section.path,

            strokeColor:
              section.color,

            strokeOpacity: .95,

            strokeWeight: 3,

            fillColor:
              section.color,

            fillOpacity: .16,

            clickable: true
          });

        polygon.addListener(
          "mouseover",
          () => {

            polygon.setOptions({
              fillOpacity: .32,
              strokeWeight: 4
            });
          }
        );

        polygon.addListener(
          "mouseout",
          () => {

            polygon.setOptions({
              fillOpacity: .16,
              strokeWeight: 3
            });
          }
        );

        polygon.addListener(
          "click",
          () => {

            this.openSection(section);

            const bounds =
              new google.maps.LatLngBounds();

            section.path.forEach(
              point =>
                bounds.extend(point)
            );

            this.map.fitBounds(
              bounds,
              80
            );
          }
        );

        this.overlays.push(
          polygon
        );
      }
    );
  },

  drawPipelines() {

    const lines = [
      {
        color: "#24a7f3",

        path: [
          {
            lat: 41.64620,
            lng: 41.65670
          },
          {
            lat: 41.64535,
            lng: 41.65790
          },
          {
            lat: 41.64500,
            lng: 41.66030
          },
          {
            lat: 41.64420,
            lng: 41.66210
          },
          {
            lat: 41.64270,
            lng: 41.66310
          }
        ]
      },

      {
        color: "#28c985",

        path: [
          {
            lat: 41.64405,
            lng: 41.65870
          },
          {
            lat: 41.64470,
            lng: 41.65930
          },
          {
            lat: 41.64435,
            lng: 41.66110
          },
          {
            lat: 41.64320,
            lng: 41.66225
          }
        ]
      }
    ];

    lines.forEach(
      item => {

        const line =
          new google.maps.Polyline({
            map: this.map,

            path: item.path,

            strokeColor:
              item.color,

            strokeOpacity: .95,

            strokeWeight: 5
          });

        this.overlays.push(
          line
        );
      }
    );
  },

  drawEquipment() {

    this.equipment.forEach(
      item => {

        const color =
          item.statusColor === "red"
            ? "#ed4657"
            : item.statusColor === "orange"
              ? "#f0a12d"
              : "#1683e8";

        const marker =
          new google.maps.Marker({
            map: this.map,

            position:
              item.position,

            title:
              item.title,

            icon: {
              path:
                google.maps.SymbolPath.CIRCLE,

              scale: 12,

              fillColor:
                color,

              fillOpacity: 1,

              strokeColor:
                "#ffffff",

              strokeWeight: 3
            }
          });

        marker.addListener(
          "click",
          () => {

            this.openEquipment(
              item
            );

            this.focus(
              item.position,
              20
            );
          }
        );

        this.markers.push(
          marker
        );
      }
    );
  },

  focus(position, zoom = 19) {

    if (!this.map) {
      return;
    }

    this.map.panTo(
      position
    );

    setTimeout(
      () => this.map.setZoom(zoom),
      180
    );
  },

  openEquipment(item) {

    const drawer =
      document.getElementById(
        "dt-drawer"
      );

    document
      .getElementById(
        "dt-drawer-title"
      )
      .textContent =
      item.title;

    document
      .getElementById(
        "dt-drawer-subtitle"
      )
      .textContent =
      item.type;

    document
      .getElementById(
        "dt-drawer-body"
      )
      .innerHTML = `
        <span
          class="dt-status
          ${item.statusColor}"
        >
          ${item.status}
        </span>

        <div class="dt-object-grid">

          ${this.metric(
            "Текущая загрузка",
            item.load
          )}

          ${this.metric(
            "Расчетный износ",
            item.wear
          )}

          ${this.metric(
            "Следующее ТО",
            item.nextMaintenance
          )}

          ${this.metric(
            "Риск простоя",
            item.downtimeRisk
          )}

          ${this.metric(
            "Стоимость ремонтов",
            item.repairCost
          )}

          ${this.metric(
            "Состояние данных",
            "Онлайн"
          )}

        </div>

        <div class="dt-recommendation">

          <b>
            Рекомендация системы
          </b>

          <p>
            ${item.recommendation}
          </p>

        </div>

        <div class="dt-drawer-actions">

          <button
            class="dt-button primary"
            onclick="
              BNTDigitalTwin.openModule(
                'equipment'
              )
            "
          >
            Карточка оборудования
          </button>

          <button
            class="dt-button"
            onclick="
              BNTDigitalTwin.openModule(
                'toir'
              )
            "
          >
            ТОиР
          </button>

          <button
            class="dt-button"
            onclick="
              BNTDigitalTwin.openModule(
                'analytics'
              )
            "
          >
            Прогноз
          </button>

          <b            class="dt-button"
            onclick="
              BNTDigitalTwin.openModule(
                'procurement'
              )
            "
          >
            ЗИП / Закупки
          </button>

        </div>
      `;

    drawer
      .classList
      .add("visible");
  },

  openSection(section) {

    const drawer =
      document.getElementById(
        "dt-drawer"
      );

    document
      .getElementById(
        "dt-drawer-title"
      )
      .textContent =
      section.title;

    document
      .getElementById(
        "dt-drawer-subtitle"
      )
      .textContent =
      "Резервуарный парк";

    document
      .getElementById(
        "dt-drawer-body"
      )
      .innerHTML = `
        <span
          class="dt-status
          ${
            section.risk === "Высокий"
              ? "red"
              : "orange"
          }"
        >
          Риск:
          ${section.risk}
        </span>

        <div class="dt-object-grid">

          ${this.metric(
            "Загрузка",
            section.load
          )}

          ${this.metric(
            "Текущий объем",
            section.volume
          )}

          ${this.metric(
            "Общая емкость",
            section.capacity
          )}

          ${this.metric(
            "Объекты",
            section.equipmentCount
          )}

        </div>

        <div class="dt-recommendation">

          <b>
            Оперативный вывод
          </b>

          <p>
            План поступления необходимо
            сопоставить со свободной
            емкостью и ремонтными окнами.
            При превышении 85% загрузки
            система предлагает перенос
            части потока на соседнюю секцию.
          </p>

        </div>

        <div class="dt-drawer-actions">

          <button
            class="dt-button primary"
            onclick="
              BNTDigitalTwin.toast(
                'Секция',
                'Детальный уровень секции открыт'
              )
            "
          >
            Открыть секцию
          </button>

          <button
            class="dt-button"
            onclick="
              BNTDigitalTwin.openModule(
                'analytics'
              )
            "
          >
            Сценарии
          </button>

        </div>
      `;

    drawer
      .classList
      .add("visible");
  },

  metric(label, value) {

    return `
      <div class="dt-object-metric">

        <span>
          ${label}
        </span>

        <strong>
          ${value}
        </strong>

      </div>
    `;
  },

  closeDrawer() {

    document
      .getElementById(
        "dt-drawer"
      )
      .classList
      .remove("visible");
  },

  openModule(module) {

    this.toast(
      "Переход",
      "Модуль: " + module
    );

    const oldApp =
      window.location.origin + "/";

    setTimeout(
      () => {

        window.location.href =
          oldApp +
          "?module=" +
          encodeURIComponent(module);

      },
      500
    );
  },

  setLayer(layer, button) {

    this.currentLayer =
      layer;

    document
      .querySelectorAll(
        ".dt-layer"
      )
      .forEach(
        item =>
          item.classList.remove(
            "active"
          )
      );

    button.classList.add(
      "active"
    );

    let message = "";

    if (layer === "operations") {
      message =
        "Показаны технологические объекты.";
    }

    if (layer === "risk") {
      message =
        "Выделены объекты с повышенным риском.";
    }

    if (layer === "maintenance") {
      message =
        "Показаны плановые окна ТОиР.";
    }

    if (layer === "logistics") {
      message =
        "Показаны логистические ограничения.";
    }

    if (layer === "procurement") {
      message =
        "Показаны объекты с дефицитом ЗИП.";
    }

    this.toast(
      "Слой карты",
      message
    );
  },

  showFallback() {

    document
      .getElementById(
        "bnt-google-map"
      )
      .style.display =
      "none";

    document
      .getElementById(
        "bnt-map-fallback"
      )
      .style.display =
      "block";
  },

  bindUI() {

    const search =
      document.getElementById(
        "dt-search"
      );

    search.addEventListener(
      "keydown",
      event => {

        if (
          event.key !== "Enter"
        ) {
          return;
        }

        const value =
          search.value
            .trim()
            .toLowerCase();

        const found =
          this.equipment.find(
            item =>
              item.title
                .toLowerCase()
                .includes(value)
          );

        if (found) {

          this.openEquipment(
            found
          );

          this.focus(
            found.position,
            20
          );

          return;
        }

        this.toast(
          "Поиск",
          "Объект не найден"
        );
      }
    );
  },

  toast(title, message) {

    const toast =
      document.getElementById(
        "dt-toast"
      );

    toast.innerHTML = `
      <b>${title}</b>
      <span>${message}</span>
    `;

    toast
      .classList
      .add("visible");

    clearTimeout(
      this.toastTimer
    );

    this.toastTimer =
      setTimeout(
        () =>
          toast
            .classList
            .remove("visible"),
        2600
      );
  }
};

window.addEventListener(
  "DOMContentLoaded",
  () => {
    BNTDigitalTwin.init();
  }
);
