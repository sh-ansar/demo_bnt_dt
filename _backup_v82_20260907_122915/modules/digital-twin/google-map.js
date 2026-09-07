window.BNTDigitalTwin = {

  map: null,

  config: null,

  mode: "fallback",

  googleLayers: {
    objects: [],
    risk: [],
    maintenance: [],
    logistics: [],
    procurement: []
  },

  activeLayers:
    new Set([
      "objects",
      "risk",
      "logistics"
    ]),

  selectedObject: null,

  DATA: {

    sections: [
      {
        id: "section1",

        title: "Секция 1",

        subtitle:
          "Резервуарный парк",

        risk: "Высокий",

        color: "#1287ea",

        center: {
          lat: 41.64495,
          lng: 41.65900
        },

        path: [
          {
            lat: 41.64560,
            lng: 41.65775
          },
          {
            lat: 41.64565,
            lng: 41.66015
          },
          {
            lat: 41.64430,
            lng: 41.66015
          },
          {
            lat: 41.64425,
            lng: 41.65775
          }
        ],

        load: "68%",

        volume: "54 400 м³",

        capacity: "80 000 м³",

        freeCapacity: "25 600 м³"
      },

      {
        id: "section2",

        title: "Секция 2",

        subtitle:
          "Резервуарный парк",

        risk: "Средний",

        color: "#16a66c",

        center: {
          lat: 41.64485,
          lng: 41.66115
        },

        path: [
          {
            lat: 41.64545,
            lng: 41.66020
          },
          {
            lat: 41.64550,
            lng: 41.66215
          },
          {
            lat: 41.64410,
            lng: 41.66215
          },
          {
            lat: 41.64410,
            lng: 41.66020
          }
        ],

        load: "58%",

        volume: "46 400 м³",

        capacity: "80 000 м³",

        freeCapacity: "33 600 м³"
      }
    ],


    equipment: [

      {
        id: "pump101",

        code: "Н-101",

        title: "Насос Н-101",

        type:
          "Центробежный насос",

        zone:
          "Насосная станция №1",

        status:
          "Высокий риск",

        statusColor:
          "red",

        x: 31,
        y: 70,

        position: {
          lat: 41.64390,
          lng: 41.65865
        },

        wear: 72,

        load: 85,

        risk: 82,

        nextTo:
          "11.09.2024",

        repairCost:
          "$18 400",

        stock:
          "2 / 8",

        recommendation:
          "Рост вибрации +28%. " +
          "Рекомендуется провести " +
          "вибродиагностику и заменить " +
          "подшипниковый узел при " +
          "ближайшем ремонтном окне."
      },

      {
        id: "pump102",

        code: "Н-102",

        title: "Насос Н-102",

        type:
          "Центробежный насос",

        zone:
          "Насосная станция №1",

        status:
          "Работает",

        statusColor:
          "green",

        x: 36,
        y: 68,

        position: {
          lat: 41.64405,
          lng: 41.65900
        },

        wear: 48,

        load: 63,

        risk: 18,

        nextTo:
          "28.09.2024",

        repairCost:
          "$6 240",

        stock:
          "8 / 8",

        recommendation:
          "Отклонений не выявлено. " +
          "Продолжить эксплуатацию " +
          "по плановому графику."
      },

      {
        id: "tankP3",

        code: "Р-3",

        title: "Резервуар Р-3",

        type:
          "Вертикальный резервуар",

        zone:
          "Секция 1",

        status:
          "Требует внимания",

        statusColor:
          "orange",

        x: 52,
        y: 35,

        position: {
          lat: 41.64495,
          lng: 41.65925
        },

        wear: 58,

        load: 72,

        risk: 61,

        nextTo:
          "12.10.2024",

        repairCost:
          "$9 450",

        stock:
          "5 / 4",

        recommendation:
          "При ожидаемом поступлении " +
          "рекомендуется ограничить " +
          "загрузку резервуара до 85%."
      },

      {
        id: "valve24",

        code: "К-24",

        title: "Клапан К-24",

        type:
          "Предохранительный клапан",

        zone:
          "Эстакада №2",

        status:
          "Высокий риск",

        statusColor:
          "red",

        x: 47,
        y: 57,

        position: {
          lat: 41.64425,
          lng: 41.65995
        },

        wear: 78,

        load: 69,

        risk: 78,

        nextTo:
          "17.09.2024",

        repairCost:
          "$7 600",

        stock:
          "1 / 4",

        recommendation:
          "Критический дефицит ЗИП. " +
          "Необходимо ускорить поставку " +
          "ремкомплекта клапана."
      },

      {
        id: "cabinet101",

        code: "ШУ-101",

        title:
          "Шкаф управления ШУ-101",

        type:
          "Электротехническое оборудование",

        zone:
          "Насосная станция №1",

        status:
          "Работает",

        statusColor:
          "green",

        x: 28,
        y: 62,

        position: {
          lat: 41.64425,
          lng: 41.65825
        },

        wear: 31,

        load: 55,

        risk: 14,

        nextTo:
          "24.09.2024",

        repairCost:
          "$2 100",

        stock:
          "6 / 4",

        recommendation:
          "Работа в пределах нормы. " +
          "Проверить контакторы " +
          "в рамках планового ТО."
      },

      {
        id: "rail",

        code: "ЖД",

        title:
          "Ж/д эстакада",

        type:
          "Логистический объект",

        zone:
          "Прием нефтепродуктов",

        status:
          "Работает",

        statusColor:
          "green",

        x: 23,
        y: 20,

        position: {
          lat: 41.64620,
          lng: 41.65710
        },

        wear: 31,

        load: 76,

        risk: 22,

        nextTo:
          "02.10.2024",

        repairCost:
          "$12 300",

        stock:
          "—",

        recommendation:
          "Прогнозируется очередь " +
          "до 18 вагонов 11 сентября."
      },

      {
        id: "warehouse",

        code: "МТР",

        title:
          "Склад МТР",

        type:
          "Запасные части",

        zone:
          "Складской комплекс",

        status:
          "Требует внимания",

        statusColor:
          "orange",

        x: 61,
        y: 79,

        position: {
          lat: 41.64295,
          lng: 41.66085
        },

        wear: 0,

        load: 78,

        risk: 42,

        nextTo:
          "—",

        repairCost:
          "$186 000",

        stock:
          "78%",

        recommendation:
          "Три критические позиции " +
          "имеют остаток ниже " +
          "страхового минимума."
      },

      {
        id: "pier",

        code: "П-3",

        title:
          "Причал / Стендер №3",

        type:
          "Отгрузочный объект",

        zone:
          "Причальный комплекс",

        status:
          "Работает",

        statusColor:
          "green",

        x: 86,
        y: 71,

        position: {
          lat: 41.64265,
          lng: 41.66300
        },

        wear: 50,

        load: 54,

        risk: 21,

        nextTo:
          "13.09.2024",

        repairCost:
          "$9 700",

        stock:
          "4 / 4",

        recommendation:
          "Диагностику рекомендуется " +
          "выполнить в технологическое " +
          "окно 13 сентября."
      }
    ]
  },


  async init() {

    this.renderFallbackObjects();

    this.bindLayerButtons();

    this.bindSearch();

    this.startClock();

    try {

      await this.loadConfig();

      if (
        this.config.googleMapsApiKey
      ) {

        await this.loadGoogleMaps();

        this.createGoogleMap();

        this.buildGoogleLayers();

        this.mode = "google";

        document
          .getElementById(
            "dt-overlay-stage"
          )
          .classList
          .add("google-active");

        document
          .getElementById(
            "dt-fallback"
          )
          .style.display = "none";

        document
          .getElementById(
            "dt-google-map"
          )
          .style.display = "block";

        this.updateModeLabel(
          "Google Maps · Live"
        );

      }
      else {

        this.activateFallback();
      }

    }
    catch(error) {

      console.error(error);

      this.activateFallback();
    }

    this.updateLayers();

  },


  async loadConfig() {

    const response =
      await fetch("/api/config");

    if (!response.ok) {
      throw new Error(
        "/api/config недоступен"
      );
    }

    this.config =
      await response.json();
  },


  loadGoogleMaps() {

    return new Promise(
      (resolve, reject) => {

        if (
          window.google?.maps
        ) {

          resolve();

          return;
        }

        window.__BNT_MAP_READY =
          () => resolve();

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://maps.googleapis.com/maps/api/js" +
          "?key=" +
          encodeURIComponent(
            this.config.googleMapsApiKey
          ) +
          "&callback=__BNT_MAP_READY" +
          "&libraries=marker" +
          "&v=weekly";

        script.async = true;

        script.defer = true;

        script.onerror =
          () => reject(
            new Error(
              "Google Maps API " +
              "не загрузился"
            )
          );

        document.head.appendChild(
          script
        );
      }
    );
  },


  createGoogleMap() {

    this.map =
      new google.maps.Map(
        document.getElementById(
          "dt-google-map"
        ),
        {
          center:
            this.config.center || {
              lat: 41.6438169,
              lng: 41.6605911
            },

          zoom:
            this.config.zoom || 17,

          mapTypeId:
            "satellite",

          mapId:
            this.config.googleMapsMapId ||
            "DEMO_MAP_ID",

          tilt: 0,

          heading: 0,

          streetViewControl: false,

          mapTypeControl: false,

          fullscreenControl: false,

          scaleControl: true,

          zoomControl: true,

          gestureHandling:
            "greedy"
        }
      );
  },


  activateFallback() {

    this.mode =
      "fallback";

    document
      .getElementById(
        "dt-google-map"
      )
      .style.display =
      "none";

    document
      .getElementById(
        "dt-fallback"
      )
      .style.display =
      "block";

    document
      .getElementById(
        "dt-overlay-stage"
      )
      .classList
      .remove(
        "google-active"
      );

    this.updateModeLabel(
      "Satellite · Demo"
    );
  },


  buildGoogleLayers() {

    this.resetGoogleLayers();

    this.drawGoogleSections();

    this.drawGoogleEquipment();

    this.drawGoogleRisk();

    this.drawGoogleMaintenance();

    this.drawGoogleLogistics();

    this.drawGoogleProcurement();
  },


  resetGoogleLayers() {

    Object.values(
      this.googleLayers
    )
    .flat()
    .forEach(
      item =>
        item.setVisible(false)
    );

    Object.keys(
      this.googleLayers
    )
    .forEach(
      key =>
        this.googleLayers[key] = []
    );
  },


  pushGoogleLayer(
    layer,
    object
  ) {

    this.googleLayers[layer]
      .push(object);
  },


  mapObjectAdapter(object) {

    return {
      setVisible:
        visible => {

          object.setMap(
            visible
              ? this.map
              : null
          );
        }
    };
  },


  advancedMarkerAdapter(marker) {

    return {
      setVisible:
        visible => {

          marker.map =
            visible
              ? this.map
              : null;
        }
    };
  },


  drawGoogleSections() {

    this.DATA.sections
      .forEach(section => {

        const polygon =
          new google.maps.Polygon({
            paths:
              section.path,

            strokeColor:
              section.color,

            strokeOpacity:
              .95,

            strokeWeight:
              3,

            fillColor:
              section.color,

            fillOpacity:
              .16
          });

        polygon.addListener(
          "mouseover",
          () => {

            polygon.setOptions({
              fillOpacity: .30,
              strokeWeight: 5
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

            this.openSection(
              section.id
            );
          }
        );

        this.pushGoogleLayer(
          "objects",
          this.mapObjectAdapter(
            polygon
          )
        );

        this.addGoogleMarker(
          "objects",
          {
            title:
              section.title,

            code:
              section.title,

            position:
              section.center,

            color:
              "green",

            click:
              () =>
                this.openSection(
                  section.id
                )
          }
        );
      });
  },


  drawGoogleEquipment() {

    this.DATA.equipment
      .forEach(item => {

        this.addGoogleMarker(
          "objects",
          {
            title:
              item.title,

            code:
              item.code,

            position:
              item.position,

            color:
              item.statusColor,

            click:
              () =>
                this.openObject(
                  item.id
                )
          }
        );
      });
  },


  addGoogleMarker(
    layer,
    options
  ) {

    const content =
      document.createElement(
        "button"
      );

    content.className =
      "gm-bnt-marker " +
      options.color;

    content.dataset.title =
      options.title;

    content.innerHTML =
      `<span class="gm-bnt-pin">
         ${options.code}
       </span>`;

    content.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        options.click?.();
      }
    );

    if (
      google.maps.marker
      ?.AdvancedMarkerElement
    ) {

      const marker =
        new google.maps
        .marker
        .AdvancedMarkerElement({
          position:
            options.position,

          content:
            content,

          title:
            options.title
        });

      this.pushGoogleLayer(
        layer,
        this.advancedMarkerAdapter(
          marker
        )
      );

      return;
    }

    const marker =
      new google.maps.Marker({
        position:
          options.position,

        title:
          options.title
      });

    marker.addListener(
      "click",
      options.click
    );

    this.pushGoogleLayer(
      layer,
      this.mapObjectAdapter(
        marker
      )
    );
  },


  drawGoogleRisk() {

    this.DATA.equipment
      .filter(
        item =>
          item.risk >= 50
      )
      .forEach(item => {

        const circle =
          new google.maps.Circle({
            center:
              item.position,

            radius:
              38,

            strokeColor:
              "#ec4658",

            strokeOpacity:
              .9,

            strokeWeight:
              2,

            fillColor:
              "#ec4658",

            fillOpacity:
              .16
          });

        circle.addListener(
          "click",
          () =>
            this.openObject(
              item.id
            )
        );

        this.pushGoogleLayer(
          "risk",
          this.mapObjectAdapter(
            circle
          )
        );
      });
  },


  drawGoogleMaintenance() {

    [
      {
        position: {
          lat: 41.64385,
          lng: 41.65835
        },

        title:
          "ТО насосной станции №2",

        code:
          "ТО",

        color:
          "orange"
      },

      {
        position: {
          lat: 41.64495,
          lng: 41.65940
        },

        title:
          "Осмотр резервуара Р-3",

        code:
          "12.10",

        color:
          "orange"
      },

      {
        position: {
          lat: 41.64275,
          lng: 41.66280
        },

        title:
          "Диагностика причала №3",

        code:
          "13.09",

        color:
          "orange"
      }
    ]
    .forEach(item => {

      this.addGoogleMarker(
        "maintenance",
        {
          ...item,

          click:
            () =>
              this.toast(
                "ТОиР",
                item.title
              )
        }
      );
    });
  },


  drawGoogleLogistics() {

    const path = [
      {
        lat: 41.64625,
        lng: 41.65650
      },
      {
        lat: 41.64575,
        lng: 41.65710
      },
      {
        lat: 41.64520,
        lng: 41.65860
      },
      {
        lat: 41.64460,
        lng: 41.66020
      },
      {
        lat: 41.64330,
        lng: 41.66200
      },
      {
        lat: 41.64265,
        lng: 41.66300
      }
    ];

    const line =
      new google.maps.Polyline({
        path,

        geodesic: true,

        strokeColor:
          "#20c982",

        strokeOpacity:
          .95,

        strokeWeight:
          5
      });

    this.pushGoogleLayer(
      "logistics",
      this.mapObjectAdapter(
        line
      )
    );

    this.addGoogleMarker(
      "logistics",
      {
        title:
          "48 вагонов подтверждено",

        code:
          "48 ЖД",

        color:
          "green",

        position: {
          lat: 41.64590,
          lng: 41.65735
        },

        click:
          () =>
            this.toast(
              "Логистика",
              "48 из 63 вагонов подтверждено"
            )
      }
    );
  },


  drawGoogleProcurement() {

    [
      {
        title:
          "Подшипник 6312",

        code:
          "2/8",

        position: {
          lat: 41.64384,
          lng: 41.65865
        }
      },

      {
        title:
          "Клапан К-24",

        code:
          "1/4",

        position: {
          lat: 41.64422,
          lng: 41.65996
        }
      },

      {
        title:
          "Уплотнение MTG-45",

        code:
          "0/4",

        position: {
          lat: 41.64394,
          lng: 41.65840
        }
      }
    ]
    .forEach(item => {

      this.addGoogleMarker(
        "procurement",
        {
          ...item,

          color:
            "red",

          click:
            () =>
              this.toast(
                "Дефицит ЗИП",
                item.title +
                ": " +
                item.code
              )
        }
      );
    });
  },


  renderFallbackObjects() {

    const stage =
      document.getElementById(
        "dt-overlay-stage"
      );

    const equipmentHtml =
      this.DATA.equipment
      .map(item => `
        <button
          class="
            dt-object-marker
            ${
              item.risk >= 70
                ? "risk"
                : ""
            }
          "
          style="
            left:${item.x}%;
            top:${item.y}%;
          "
          data-object="${item.id}"
        >

          <span
            class="
              dt-object-pin
              ${item.statusColor}
            "
          >
            ${item.code}
          </span>

          <span class="dt-marker-label">
            ${item.title}
          </span>

          <span class="dt-marker-tooltip">

            <strong>
              ${item.title}
            </strong>

            <span>
              ${item.zone}
            </span>

            <span>
              Загрузка:
              ${item.load}%
              · Износ:
              ${item.wear}%
            </span>

            <span>
              Риск простоя:
              ${item.risk}%
            </span>

          </span>

        </button>
      `)
      .join("");

    stage.innerHTML = `

      <svg
        class="dt-stage-svg"
        viewBox="0 0 1000 620"
        preserveAspectRatio="none"
      >

        <defs>

          <filter id="softGlow">

            <feGaussianBlur
              stdDeviation="4"
              result="blur"
            />

            <feMerge>

              <feMergeNode
                in="blur"
              />

              <feMergeNode
                in="SourceGraphic"
              />

            </feMerge>

          </filter>

        </defs>


        <g
          class="dt-stage-group"
          data-stage-layer="objects"
        >

          <polygon
            class="dt-zone"
            data-section="section1"
            points="
              365,135
              590,145
              575,335
              355,325
            "
          ></polygon>

          <polygon
            class="dt-zone green"
            data-section="section2"
            points="
              590,145
              755,160
              745,340
              575,335
            "
          ></polygon>

          <polygon
            class="dt-zone purple"
            points="
              730,55
              890,72
              850,195
              740,175
            "
          ></polygon>


          <polyline
            class="dt-pipeline"
            points="
              190,110
              330,125
              430,175
              535,170
              625,245
              795,300
              860,435
            "
          ></polyline>

          <polyline
            class="
              dt-pipeline-flow
            "
            points="
              190,110
              330,125
              430,175
              535,170
              625,245
              795,300
              860,435
            "
          ></polyline>

          <polyline
            class="
              dt-pipeline
              secondary
            "
            points="
              310,435
              390,400
              450,350
              520,265
              615,245
              670,360
              825,420
            "
          ></polyline>

          <polyline
            class="
              dt-pipeline-flow
            "
            points="
              310,435
              390,400
              450,350
              520,265
              615,245
              670,360
              825,420
            "
          ></polyline>

        </g>


        <g
          class="dt-stage-group"
          data-stage-layer="risk"
        >

          <circle
            cx="310"
            cy="435"
            r="34"
            fill="rgba(236,70,88,.15)"
            stroke="#ec4658"
            stroke-width="3"
            filter="url(#softGlow)"
          ></circle>

          <circle
            cx="470"
            cy="355"
            r="29"
            fill="rgba(236,70,88,.14)"
            stroke="#ec4658"
            stroke-width="3"
          ></circle>

          <circle
            cx="520"
            cy="218"
            r="33"
            fill="rgba(242,160,39,.14)"
            stroke="#f2a027"
            stroke-width="3"
          ></circle>

        </g>


        <g
          class="
            dt-stage-group
            hidden
          "
          data-stage-layer="logistics"
        >

          <polyline
            points="
              150,100
              260,145
              355,210
              455,270
              605,330
              725,385
              860,435
            "
            fill="none"
            stroke="#22c982"
            stroke-width="9"
            opacity=".8"
            stroke-linecap="round"
          ></polyline>

          <polyline
            points="
              150,100
              260,145
              355,210
              455,270
              605,330
              725,385
              860,435
            "
            fill="none"
            stroke="white"
            stroke-width="3"
            stroke-dasharray="3 18"
            class="dt-pipeline-flow"
          ></polyline>

        </g>


        <g
          class="
            dt-stage-group
            hidden
          "
          data-stage-layer="procurement"
        >

          <line
            x1="610"
            y1="490"
            x2="310"
            y2="435"
            stroke="#7358d6"
            stroke-width="3"
            stroke-dasharray="7 8"
          ></line>

          <line
            x1="610"
            y1="490"
            x2="470"
            y2="355"
            stroke="#7358d6"
            stroke-width="3"
            stroke-dasharray="7 8"
          ></line>

        </g>

      </svg>


      <div
        class="dt-stage-group"
        data-stage-layer="objects"
      >

        ${equipmentHtml}

      </div>


      <div
        class="
          dt-stage-group
          hidden
        "
        data-stage-layer="maintenance"
      >

        <button
          class="dt-floating-badge"
          style="
            left:29%;
            top:75%;
          "
        >
          ТО · 10–12 сен
        </button>

        <button
          class="dt-floating-badge"
          style="
            left:53%;
            top:29%;
          "
        >
          Осмотр · 12 окт
        </button>

        <button
          class="dt-floating-badge"
          style="
            left:84%;
            top:70%;
          "
        >
          Диагностика · 13 сен
        </button>

      </div>


      <div
        class="
          dt-stage-group
          hidden
        "
        data-stage-layer="logistics"
      >

        <button
          class="dt-wagon"
          style="
            left:18%;
            top:18%;
          "
        >
          🚃 12
        </button>

        <button
          class="dt-wagon"
          style="
            left:29%;
            top:28%;
          "
        >
          🚃 8
        </button>

        <button
          class="dt-wagon"
          style="
            left:40%;
            top:40%;
          "
        >
          🚃 14
        </button>

      </div>


      <div
        class="
          dt-stage-group
          hidden
        "
        data-stage-layer="procurement"
      >

        <button
          class="
            dt-floating-badge
            purple
          "
          style="
            left:31%;
            top:62%;
          "
        >
          Подшипник 2/8
        </button>

        <button
          class="
            dt-floating-badge
            red
          "
          style="
            left:48%;
            top:51%;
          "
        >
          К-24 · 1/4
        </button>

        <button
          class="
            dt-floating-badge
            purple
          "
          style="
            left:61%;
            top:78%;
          "
        >
          Склад · 78%
        </button>

      </div>
    `;


    stage
      .querySelectorAll(
        "[data-object]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            this.openObject(
              button.dataset.object
            )
        );
      });


    stage
      .querySelectorAll(
        "[data-section]"
      )
      .forEach(section => {

        section.style
          .pointerEvents =
          "auto";

        section.addEventListener(
          "click",
          () =>
            this.openSection(
              section.dataset.section
            )
        );
      });
  },


  bindLayerButtons() {

    document
      .querySelectorAll(
        ".dt-layer"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const layer =
              button.dataset.layer;

            if (
              this.activeLayers
              .has(layer)
            ) {

              if (
                layer !==
                "objects"
              ) {

                this.activeLayers
                  .delete(layer);
              }

            }
            else {

              this.activeLayers
                .add(layer);
            }

            this.updateLayers();
          }
        );
      });
  },


  updateLayers() {

    document
      .querySelectorAll(
        ".dt-layer"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",

          this.activeLayers.has(
            button.dataset.layer
          )
        );
      });


    document
      .querySelectorAll(
        "[data-stage-layer]"
      )
      .forEach(group => {

        const visible =
          this.activeLayers.has(
            group.dataset.stageLayer
          );

        group.classList.toggle(
          "hidden",
          !visible
        );
      });


    if (
      this.mode === "google"
    ) {

      Object.entries(
        this.googleLayers
      )
      .forEach(
        ([layer, items]) => {

          const visible =
            this.activeLayers.has(
              layer
            );

          items.forEach(
            item =>
              item.setVisible(
                visible
              )
          );
        }
      );
    }


    const labels = [];

    if (
      this.activeLayers
      .has("risk")
    ) {
      labels.push(
        "7 объектов риска"
      );
    }

    if (
      this.activeLayers
      .has("maintenance")
    ) {
      labels.push(
        "12 работ ТОиР"
      );
    }

    if (
      this.activeLayers
      .has("logistics")
    ) {
      labels.push(
        "48 вагонов"
      );
    }

    if (
      this.activeLayers
      .has("procurement")
    ) {
      labels.push(
        "3 критических ЗИП"
      );
    }

    document
      .getElementById(
        "dt-map-status"
      )
      .innerHTML =
      "<strong>Отображается:</strong> " +
      (
        labels.length
          ? labels.join(" · ")
          : "объекты предприятия"
      );
  },


  bindSearch() {

    document
      .getElementById(
        "dt-search"
      )
      .addEventListener(
        "keydown",
        event => {

          if (
            event.key !==
            "Enter"
          ) {
            return;
          }

          const value =
            event.target.value
            .trim()
            .toLowerCase();

          const object =
            this.DATA.equipment
            .find(
              item =>
                item.title
                .toLowerCase()
                .includes(value) ||

                item.code
                .toLowerCase()
                .includes(value)
            );

          if (object) {

            this.openObject(
              object.id
            );

            if (
              this.mode ===
              "google"
            ) {

              this.map.panTo(
                object.position
              );

              this.map.setZoom(
                20
              );
            }

            return;
          }

          this.toast(
            "Поиск",
            "Объект не найден"
          );
        }
      );
  },


  openObject(id) {

    const item =
      this.DATA.equipment
      .find(
        object =>
          object.id === id
      );

    if (!item) {
      return;
    }

    this.selectedObject =
      item;

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
      item.type +
      " · " +
      item.zone;

    document
      .getElementById(
        "dt-drawer-body"
      )
      .innerHTML = `

        <span
          class="
            dt-status
            ${item.statusColor}
          "
        >
          ${item.status}
        </span>


        <div class="dt-metric-grid">

          ${this.metric(
            "Загрузка",
            item.load + "%"
          )}

          ${this.metric(
            "Износ",
            item.wear + "%"
          )}

          ${this.metric(
            "Риск простоя",
            item.risk + "%"
          )}

          ${this.metric(
            "Следующее ТО",
            item.nextTo
          )}

          ${this.metric(
            "Ремонты",
            item.repairCost
          )}

          ${this.metric(
            "ЗИП",
            item.stock
          )}

        </div>


        <div class="dt-recommendation">

          <strong>
            Предиктивная рекомендация
          </strong>

          <p>
            ${item.recommendation}
          </p>

        </div>


        <div class="dt-tabs">

          <button
            class="dt-tab active"
            data-detail-tab="events"
          >
            События
          </button>

          <button
            class="dt-tab"
            data-detail-tab="toir"
          >
            ТОиР
          </button>

          <button
            class="dt-tab"
            data-detail-tab="prediction"
          >
            Прогноз
          </button>

          <button
            class="dt-tab"
            data-detail-tab="parts"
          >
            ЗИП
          </button>

        </div>


        <div
          id="dt-tab-content"
          class="dt-tab-content"
        ></div>


        <div class="dt-drawer-actions">

          <button
            class="dt-button primary"
            onclick="
              BNTDigitalTwin.showObjectTab(
                'prediction'
              )
            "
          >
            Анализ объекта
          </button>

          <button
            class="dt-button"
            onclick="
              BNTDigitalTwin.showObjectTab(
                'toir'
              )
            "
          >
            Открыть ТОиР
          </button>

        </div>
    `;

    drawer.classList.add(
      "visible"
    );


    drawer
      .querySelectorAll(
        "[data-detail-tab]"
      )
      .forEach(tab => {

        tab.addEventListener(
          "click",
          () => {

            this.showObjectTab(
              tab.dataset.detailTab
            );
          }
        );
      });


    this.showObjectTab(
      "events"
    );
  },


  showObjectTab(tab) {

    if (
      !this.selectedObject
    ) {
      return;
    }

    const item =
      this.selectedObject;

    document
      .querySelectorAll(
        ".dt-tab"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",

          button.dataset
            .detailTab === tab
        );
      });


    const target =
      document.getElementById(
        "dt-tab-content"
      );

    if (!target) {
      return;
    }


    if (
      tab === "events"
    ) {

      target.innerHTML = `
        ${this.event(
          "10:42",
          "Вибрация",
          "4.2 мм/с · рост +28%"
        )}

        ${this.event(
          "09:30",
          "Температура",
          "76 °C · в пределах нормы"
        )}

        ${this.event(
          "08:15",
          "Нагрузка",
          item.load + "% мощности"
        )}

        ${this.event(
          "Вчера",
          "Диагностика",
          "Сформирована новая рекомендация"
        )}
      `;
    }


    if (
      tab === "toir"
    ) {

      target.innerHTML = `

        ${this.event(
          "11.09",
          "Диагностика",
          "Вибродиагностика оборудования"
        )}

        ${this.event(
          "17.09",
          "Ремонт",
          "Замена критического узла"
        )}

        ${this.event(
          "28.09",
          "ТО",
          "Регламентное обслуживание"
        )}

        <button
          class="dt-button primary"
          style="
            width:100%;
            margin-top:9px;
          "
          onclick="
            BNTDigitalTwin.toast(
              'ТОиР',
              'Работа добавлена в план'
            )
          "
        >
          + Создать работу ТОиР
        </button>
      `;
    }


    if (
      tab === "prediction"
    ) {

      target.innerHTML = `

        <div class="dt-object-grid">

          <div class="dt-object-row">

            <div>

              <strong>
                Вероятность отказа
              </strong>

              <small>
                горизонт 90 дней
              </small>

            </div>

            <b>
              ${item.risk}%
            </b>

          </div>

          <div class="dt-object-row">

            <div>

              <strong>
                Прогноз износа
              </strong>

              <small>
                при текущей загрузке
              </small>

            </div>

            <b>
              ${
                Math.min(
                  98,
                  item.wear + 11
                )
              }%
            </b>

          </div>

          <div class="dt-object-row">

            <div>

              <strong>
                Возможный простой
              </strong>

              <small>
                без выполнения рекомендаций
              </small>

            </div>

            <b>
              18 ч
            </b>

          </div>

          <div class="dt-object-row">

            <div>

              <strong>
                Потенциальные потери
              </strong>

              <small>
                оценка модели
              </small>

            </div>

            <b>
              $18 400
            </b>

          </div>

        </div>
      `;
    }


    if (
      tab === "parts"
    ) {

      target.innerHTML = `

        ${this.event(
          "Критично",
          "Подшипник 6312",
          "2 шт. на складе · минимум 8"
        )}

        ${this.event(
          "Высокий",
          "Уплотнение MTG-45",
          "0 шт. · поставка 17 дней"
        )}

        ${this.event(
          "Норма",
          "Ремкомплект",
          "4 шт. · запас достаточен"
        )}

        <button
          class="dt-button primary"
          style="
            width:100%;
            margin-top:9px;
          "
          onclick="
            BNTDigitalTwin.toast(
              'Закупки',
              'Открыта потребность по активу'
            )
          "
        >
          Открыть потребность
        </button>
      `;
    }
  },


  openSection(id) {

    const section =
      this.DATA.sections
      .find(
        item =>
          item.id === id
      );

    if (!section) {
      return;
    }

    const related =
      this.DATA.equipment
      .filter(
        item =>
          item.zone.includes(
            "Секция"
          ) ||
          item.zone.includes(
            "Насосная"
          )
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
      section.subtitle;


    document
      .getElementById(
        "dt-drawer-body"
      )
      .innerHTML = `

        <span
          class="
            dt-status
            ${
              section.risk ===
              "Высокий"
                ? "red"
                : "orange"
            }
          "
        >
          Риск:
          ${section.risk}
        </span>


        <div class="dt-metric-grid">

          ${this.metric(
            "Загрузка",
            section.load
          )}

          ${this.metric(
            "Текущий объем",
            section.volume
          )}

          ${this.metric(
            "Емкость",
            section.capacity
          )}

          ${this.metric(
            "Свободно",
            section.freeCapacity
          )}

          ${this.metric(
            "План прихода",
            "+12 000 м³"
          )}

          ${this.metric(
            "Риск простоев",
            "7 объектов"
          )}

        </div>


        <div class="dt-recommendation">

          <strong>
            Рекомендация диспетчерского центра
          </strong>

          <p>
            При текущем графике поставок
            загрузка секции достигнет 89%.
            Рекомендуется перенести часть
            поступления в Секцию 2 и
            совместить обслуживание Н-101
            с плановым технологическим окном.
          </p>

        </div>


        <div
          style="
            margin-top:13px;
            font-size:9px;
            font-weight:900;
          "
        >
          Оборудование секции
        </div>


        <div class="dt-object-list">

          ${
            related
            .map(item => `

              <button
                class="dt-object-row"
                onclick="
                  BNTDigitalTwin.openObject(
                    '${item.id}'
                  )
                "
              >

                <div>

                  <strong>
                    ${item.title}
                  </strong>

                  <small>
                    ${item.type}
                  </small>

                </div>

                <span
                  class="
                    dt-status
                    ${item.statusColor}
                  "
                >
                  ${item.risk}%
                </span>

              </button>

            `)
            .join("")
          }

        </div>
      `;


    document
      .getElementById(
        "dt-drawer"
      )
      .classList
      .add("visible");
  },


  metric(
    label,
    value
  ) {

    return `

      <div class="dt-metric">

        <span>
          ${label}
        </span>

        <strong>
          ${value}
        </strong>

      </div>
    `;
  },


  event(
    time,
    title,
    description
  ) {

    return `

      <div class="dt-event">

        <time>
          ${time}
        </time>

        <div>

          <strong>
            ${title}
          </strong>

          <span>
            ${description}
          </span>

        </div>

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


  focusTerminal() {

    if (
      this.mode === "google"
    ) {

      this.map.panTo({
        lat: 41.6438169,
        lng: 41.6605911
      });

      this.map.setZoom(17);

    }

    this.toast(
      "Карта",
      "Показана территория терминала"
    );
  },


  updateModeLabel(
    text
  ) {

    document
      .getElementById(
        "dt-mode"
      )
      .textContent =
      text;
  },


  startClock() {

    const update =
      () => {

        const now =
          new Date();

        document
          .getElementById(
            "dt-time"
          )
          .textContent =
          now.toLocaleTimeString(
            "ru-RU",
            {
              hour:
                "2-digit",

              minute:
                "2-digit",

              second:
                "2-digit"
            }
          );
      };

    update();

    setInterval(
      update,
      1000
    );
  },


  toast(
    title,
    message
  ) {

    const toast =
      document.getElementById(
        "dt-toast"
      );

    toast.innerHTML = `

      <strong>
        ${title}
      </strong>

      <span>
        ${message}
      </span>
    `;

    toast.classList.add(
      "visible"
    );

    clearTimeout(
      this.toastTimer
    );

    this.toastTimer =
      setTimeout(
        () =>
          toast.classList.remove(
            "visible"
          ),
        2700
      );
  }

};


window.addEventListener(
  "DOMContentLoaded",
  () =>
    BNTDigitalTwin.init()
);

