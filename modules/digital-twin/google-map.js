window.BNTDigitalTwin = {

  map: null,

  config: null,

  mode: "fallback",

  fallbackZoom: 1,

  activeLayers:
    new Set([
      "zones",
      "tanks",
      "pipelines",
      "equipment",
      "risk"
    ]),

  googleLayers: {},

  tankCircles: [],

  tankLabels: [],


  /*
    Геометрия резервуаров восстановлена
    визуально по спутниковому снимку.

    Это прототипная геопривязка,
    а не исполнительная геодезическая
    схема предприятия.
  */

  TANKS: [

    {id:'R-01',x:83,y:311,r:10},
    {id:'R-02',x:113,y:316,r:17},
    {id:'R-03',x:147,y:321,r:15},
    {id:'R-04',x:215,y:376,r:11},

    {id:'R-05',x:345,y:403,r:12},
    {id:'R-06',x:382,y:389,r:11},
    {id:'R-07',x:400,y:421,r:12},
    {id:'R-08',x:367,y:433,r:13},
    {id:'R-09',x:433,y:407,r:11},
    {id:'R-10',x:467,y:395,r:13},
    {id:'R-11',x:448,y:364,r:11},
    {id:'R-12',x:501,y:458,r:15},
    {id:'R-13',x:455,y:477,r:16},
    {id:'R-14',x:409,y:493,r:15},

    {id:'R-15',x:459,y:279,r:24},
    {id:'R-16',x:505,y:271,r:32},
    {id:'R-17',x:563,y:245,r:13},
    {id:'R-18',x:574,y:189,r:13},
    {id:'R-19',x:613,y:230,r:15},
    {id:'R-20',x:511,y:347,r:13},
    {id:'R-21',x:549,y:337,r:22},
    {id:'R-22',x:581,y:323,r:15},
    {id:'R-23',x:597,y:374,r:14},
    {id:'R-24',x:632,y:350,r:16},

    {id:'R-25',x:671,y:179,r:16},
    {id:'R-26',x:707,y:178,r:28},
    {id:'R-27',x:727,y:181,r:16},
    {id:'R-28',x:687,y:203,r:16},
    {id:'R-29',x:845,y:181,r:33},

    {id:'R-30',x:715,y:256,r:12},
    {id:'R-31',x:770,y:271,r:29},
    {id:'R-32',x:812,y:279,r:13},
    {id:'R-33',x:697,y:293,r:15},
    {id:'R-34',x:731,y:329,r:14},
    {id:'R-35',x:770,y:323,r:13},
    {id:'R-36',x:700,y:352,r:17},

    {id:'R-37',x:595,y:459,r:17},
    {id:'R-38',x:644,y:469,r:13},
    {id:'R-39',x:693,y:482,r:11},
    {id:'R-40',x:743,y:495,r:13},
    {id:'R-41',x:601,y:509,r:13},
    {id:'R-42',x:651,y:521,r:11},
    {id:'R-43',x:701,y:536,r:13},
    {id:'R-44',x:724,y:413,r:17},
    {id:'R-45',x:781,y:427,r:17},

    {id:'R-46',x:926,y:268,r:34},
    {id:'R-47',x:872,y:322,r:22},
    {id:'R-48',x:950,y:201,r:18}

  ],


  EQUIPMENT: [

    {
      id: "pump101",
      code: "Н-101",
      title: "Насос Н-101",
      type: "Центробежный насос",
      x: 31,
      y: 70,
      status: "Высокий риск",
      color: "red",
      wear: "72%",
      load: "85%",
      risk: "82%",
      to: "11.09.2024",
      cost: "$18 400",
      recommendation:
        "Рост вибрации +28%. " +
        "Рекомендуется вибродиагностика " +
        "и подготовка подшипникового узла."
    },

    {
      id: "pump102",
      code: "Н-102",
      title: "Насос Н-102",
      type: "Центробежный насос",
      x: 35,
      y: 67,
      status: "Работает",
      color: "green",
      wear: "48%",
      load: "63%",
      risk: "18%",
      to: "28.09.2024",
      cost: "$6 240",
      recommendation:
        "Работа в пределах плановых параметров."
    },

    {
      id: "valve24",
      code: "К-24",
      title: "Клапан К-24",
      type: "Предохранительный клапан",
      x: 47,
      y: 57,
      status: "Высокий риск",
      color: "red",
      wear: "78%",
      load: "69%",
      risk: "78%",
      to: "17.09.2024",
      cost: "$7 600",
      recommendation:
        "Дефицит ремкомплекта. " +
        "Необходимо ускорить закупку."
    },

    {
      id: "rail",
      code: "ЖД",
      title: "Ж/д эстакада",
      type: "Логистика",
      x: 22,
      y: 21,
      status: "Работает",
      color: "green",
      wear: "31%",
      load: "76%",
      risk: "22%",
      to: "02.10.2024",
      cost: "$12 300",
      recommendation:
        "Прогнозируется очередь вагонов " +
        "в период 11–13 сентября."
    },

    {
      id: "warehouse",
      code: "МТР",
      title: "Склад МТР",
      type: "Склад ЗИП",
      x: 61,
      y: 79,
      status: "Требует внимания",
      color: "orange",
      wear: "—",
      load: "78%",
      risk: "42%",
      to: "—",
      cost: "$186 000",
      recommendation:
        "Три критические позиции " +
        "ниже страхового минимума."
    },

    {
      id: "pier",
      code: "П-3",
      title: "Причал / Стендер №3",
      type: "Отгрузочный объект",
      x: 85,
      y: 70,
      status: "Работает",
      color: "green",
      wear: "50%",
      load: "54%",
      risk: "21%",
      to: "13.09.2024",
      cost: "$9 700",
      recommendation:
        "Диагностику рекомендуется " +
        "совместить с технологическим окном."
    }

  ],


  /*
    Две точки калибровки спутникового снимка.
    По ним пиксельная геометрия переводится
    в географические координаты.
  */

  CALIBRATION: {

    a: {
      x: 806,
      y: 147,

      lat: 41.6450711,
      lng: 41.6656278
    },

    b: {
      x: 1060,
      y: 355,

      lat: 41.643529,
      lng: 41.669253
    }

  },


  async init() {

    this.renderFallback();

    this.bindLayers();

    this.bindSearch();

    this.startClock();

    try {

      const response =
        await fetch(
          "/api/config"
        );

      if (response.ok) {

        this.config =
          await response.json();

      }

      if (
        this.config
        ?.googleMapsApiKey
      ) {

        await this.loadGoogleMaps();

        this.createMap();

        this.drawGoogleTwin();

        this.mode =
          "google";

        document
          .getElementById(
            "dt-fallback-world"
          )
          .style.display =
          "none";

        document
          .getElementById(
            "dt-google-map"
          )
          .style.display =
          "block";

        this.setMode(
          "Google Maps · Live"
        );

      }
      else {

        this.setMode(
          "Satellite · Demo"
        );

      }

    }
    catch(error) {

      console.error(error);

      this.setMode(
        "Satellite · Demo"
      );

    }

    this.updateLayers();

  },


  loadGoogleMaps() {

    return new Promise(
      (resolve,reject) => {

        if (
          window.google
          ?.maps
        ) {

          resolve();

          return;
        }

        window.__BNT_READY =
          resolve;

        const script =
          document
          .createElement(
            "script"
          );

        script.src =
          "https://maps.googleapis.com/maps/api/js" +
          "?key=" +
          encodeURIComponent(
            this.config.googleMapsApiKey
          ) +
          "&callback=__BNT_READY" +
          "&v=weekly";

        script.async = true;
        script.defer = true;

        script.onerror =
          () =>
            reject(
              new Error(
                "Google Maps API не загрузился"
              )
            );

        document.head
          .appendChild(
            script
          );

      }
    );

  },


  createMap() {

    this.map =
      new google.maps.Map(
        document
          .getElementById(
            "dt-google-map"
          ),
        {

          center: {
            lat: 41.6438169,
            lng: 41.6605911
          },

          zoom: 17,

          mapTypeId:
            "satellite",

          streetViewControl:
            false,

          fullscreenControl:
            false,

          mapTypeControl:
            false,

          rotateControl:
            false,

          tilt: 0,

          gestureHandling:
            "greedy"

        }
      );


    this.map.addListener(
      "zoom_changed",
      () =>
        this.applyZoomStyle()
    );

  },


  pxToLatLng(x,y) {

    const a =
      this.CALIBRATION.a;

    const b =
      this.CALIBRATION.b;


    const lngScale =
      (b.lng - a.lng) /
      (b.x - a.x);


    const latScale =
      (b.lat - a.lat) /
      (b.y - a.y);


    return {

      lat:
        a.lat +
        (y - a.y) *
        latScale,

      lng:
        a.lng +
        (x - a.x) *
        lngScale

    };

  },


  drawGoogleTwin() {

    this.googleLayers = {

      zones: [],

      tanks: [],

      pipelines: [],

      equipment: [],

      risk: [],

      maintenance: [],

      logistics: []

    };


    this.drawGoogleZones();

    this.drawGoogleTanks();

    this.drawGooglePipelines();

    this.drawGoogleEquipment();

    this.drawGoogleMaintenance();

    this.drawGoogleLogistics();

    this.applyZoomStyle();

  },


  adapter(object) {

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


  drawGoogleZones() {

    const zones = [

      {
        title: "Секция 1",
        color: "#1188ea",

        px: [
          [52,288],
          [245,286],
          [265,395],
          [72,405]
        ]
      },

      {
        title: "Центральный парк",
        color: "#1188ea",

        px: [
          [315,335],
          [520,320],
          [550,520],
          [325,520]
        ]
      },

      {
        title: "Секция 2",
        color: "#16a66c",

        px: [
          [430,165],
          [655,155],
          [670,370],
          [430,350]
        ]
      },

      {
        title: "Резервуарный парк",
        color: "#16a66c",

        px: [
          [650,130],
          [900,130],
          [900,370],
          [670,370]
        ]
      },

      {
        title: "Южный парк",
        color: "#1188ea",

        px: [
          [555,390],
          [815,390],
          [815,565],
          [565,565]
        ]
      }

    ];


    zones.forEach(zone => {

      const polygon =
        new google.maps.Polygon({

          paths:
            zone.px.map(
              point =>
                this.pxToLatLng(
                  point[0],
                  point[1]
                )
            ),

          strokeColor:
            zone.color,

          strokeOpacity:
            .88,

          strokeWeight:
            2,

          fillColor:
            zone.color,

          fillOpacity:
            .08

        });


      polygon.addListener(
        "mouseover",
        () => {

          polygon.setOptions({
            fillOpacity: .20,
            strokeWeight: 4
          });

        }
      );


      polygon.addListener(
        "mouseout",
        () => {

          polygon.setOptions({
            fillOpacity: .08,
            strokeWeight: 2
          });

        }
      );


      this.googleLayers
        .zones
        .push(
          this.adapter(
            polygon
          )
        );

    });

  },


  drawGoogleTanks() {

    this.hoverInfo =
      new google.maps.InfoWindow();


    this.TANKS
      .forEach(
        (tank,index) => {

          const center =
            this.pxToLatLng(
              tank.x,
              tank.y
            );


          const risk =
            [5,15,25,30,33]
            .includes(
              index
            );


          const circle =
            new google.maps.Circle({

              center,

              radius:
                Math.max(
                  8,
                  tank.r * .95
                ),

              strokeColor:
                risk
                  ? "#ec4658"
                  : "#24bef5",

              strokeOpacity:
                .95,

              strokeWeight:
                2,

              fillColor:
                risk
                  ? "#ec4658"
                  : "#21bdf4",

              fillOpacity:
                risk
                  ? .10
                  : .055

            });


          circle.addListener(
            "mouseover",
            () => {

              circle.setOptions({
                fillOpacity:
                  risk
                    ? .22
                    : .20,

                strokeWeight: 4
              });


              this.hoverInfo
                .setPosition(
                  center
                );


              this.hoverInfo
                .setContent(
                  `
                    <div
                      style="
                        font-family:Segoe UI;
                        min-width:130px
                      "
                    >
                      <b>
                        ${tank.id}
                      </b>

                      <div
                        style="
                          margin-top:3px;
                          font-size:11px;
                          color:#60788e
                        "
                      >
                        Резервуар
                      </div>
                    </div>
                  `
                );


              this.hoverInfo.open(
                this.map
              );

            }
          );


          circle.addListener(
            "mouseout",
            () => {

              circle.setOptions({

                fillOpacity:
                  risk
                    ? .10
                    : .055,

                strokeWeight:
                  2

              });

              this.hoverInfo.close();

            }
          );


          circle.addListener(
            "click",
            () =>
              this.openTank(
                tank,
                index
              )
          );


          this.tankCircles
            .push(circle);


          this.googleLayers
            .tanks
            .push(
              this.adapter(
                circle
              )
            );


          const label =
            new google.maps.Marker({

              position:
                center,

              clickable:
                false,

              label: {

                text:
                  tank.id,

                color:
                  "#ffffff",

                fontSize:
                  "8px",

                fontWeight:
                  "700"

              },

              icon: {

                path:
                  google.maps
                  .SymbolPath
                  .CIRCLE,

                scale:
                  0

              }

            });


          this.tankLabels
            .push(label);

        }
      );

  },


  drawGooglePipelines() {

    const pipes = [

      {
        color: "#20a7ef",

        points: [
          [185,108],
          [325,125],
          [425,177],
          [535,170],
          [625,245],
          [790,300],
          [862,437]
        ]
      },

      {
        color: "#23c983",

        points: [
          [308,435],
          [390,400],
          [450,350],
          [520,264],
          [615,245],
          [670,360],
          [825,420]
        ]
      }

    ];


    pipes.forEach(pipe => {

      const polyline =
        new google.maps.Polyline({

          path:
            pipe.points
            .map(
              point =>
                this.pxToLatLng(
                  point[0],
                  point[1]
                )
            ),

          strokeColor:
            pipe.color,

          strokeOpacity:
            .92,

          strokeWeight:
            5

        });


      this.googleLayers
        .pipelines
        .push(
          this.adapter(
            polyline
          )
        );

    });

  },


  drawGoogleEquipment() {

    this.EQUIPMENT
      .forEach(item => {

        const source = {

          x:
            item.x / 100 * 1092,

          y:
            item.y / 100 * 594

        };


        const position =
          this.pxToLatLng(
            source.x,
            source.y
          );


        const marker =
          new google.maps.Marker({

            position,

            title:
              item.title,

            label: {

              text:
                item.code,

              color:
                "#ffffff",

              fontSize:
                "9px",

              fontWeight:
                "700"

            },

            icon: {

              path:
                google.maps
                .SymbolPath
                .CIRCLE,

              scale:
                13,

              fillColor:
                item.color === "red"
                  ? "#ec4658"
                  : item.color === "orange"
                    ? "#f0a028"
                    : "#1188ea",

              fillOpacity:
                1,

              strokeColor:
                "#ffffff",

              strokeWeight:
                3

            }

          });


        marker.addListener(
          "click",
          () =>
            this.openObject(
              item.id
            )
        );


        this.googleLayers
          .equipment
          .push(
            this.adapter(
              marker
            )
          );

    });

  },


  drawGoogleMaintenance() {

    const points = [

      [340,430,"ТО Н-101 · 11 сен"],

      [560,270,"Осмотр · 12 окт"],

      [850,420,"Диагностика · 13 сен"]

    ];


    points.forEach(point => {

      const marker =
        new google.maps.Marker({

          position:
            this.pxToLatLng(
              point[0],
              point[1]
            ),

          title:
            point[2],

          label: {

            text: "ТО",

            color: "#ffffff",

            fontSize: "8px",

            fontWeight: "700"

          },

          icon: {

            path:
              google.maps
              .SymbolPath
              .CIRCLE,

            scale: 11,

            fillColor:
              "#f0a028",

            fillOpacity: 1,

            strokeColor:
              "#ffffff",

            strokeWeight: 3

          }

        });


      this.googleLayers
        .maintenance
        .push(
          this.adapter(
            marker
          )
        );

    });

  },


  drawGoogleLogistics() {

    const line =
      new google.maps.Polyline({

        path:
          [
            [155,100],
            [260,145],
            [355,210],
            [455,270],
            [605,330],
            [725,385],
            [860,435]
          ]
          .map(
            point =>
              this.pxToLatLng(
                point[0],
                point[1]
              )
          ),

        strokeColor:
          "#20c982",

        strokeOpacity:
          .9,

        strokeWeight:
          7

      });


    this.googleLayers
      .logistics
      .push(
        this.adapter(
          line
        )
      );

  },


  applyZoomStyle() {

    if (
      this.mode !==
      "google"
    ) {
      return;
    }


    const zoom =
      this.map.getZoom();


    this.tankCircles
      .forEach(circle => {

        circle.setOptions({

          strokeWeight:
            zoom >= 19
              ? 3
              : zoom <= 16
                ? 1
                : 2

        });

      });


    const showLabels =
      zoom >= 19;


    this.tankLabels
      .forEach(label => {

        label.setMap(
          showLabels &&
          this.activeLayers.has(
            "tanks"
          )
            ? this.map
            : null
        );

      });

  },


  renderFallback() {

    const overlay =
      document
      .getElementById(
        "dt-overlay"
      );


    const tankSvg =
      this.TANKS
      .map(
        (tank,index) => {

          const risk =
            [5,15,25,30,33]
            .includes(index);

          return `
            <circle
              class="
                dt-tank-circle
                ${risk ? "risk" : ""}
              "
              data-fallback-layer="tanks"
              data-tank="${index}"
              cx="${tank.x}"
              cy="${tank.y}"
              r="${tank.r}"
            />
          `;
        }
      )
      .join("");


    const objects =
      this.EQUIPMENT
      .map(item => `

        <button
          class="
            dt-object
            ${
              item.color === "red"
                ? "risk"
                : ""
            }
          "
          data-fallback-layer="equipment"
          data-object="${item.id}"
          style="
            left:${item.x}%;
            top:${item.y}%;
          "
        >

          <span
            class="
              dt-object-pin
              ${item.color}
            "
          >
            ${item.code}
          </span>

          <span
            class="dt-object-label"
          >
            ${item.title}
          </span>

        </button>

      `)
      .join("");


    overlay.innerHTML = `

      <svg
        viewBox="0 0 1092 594"
        preserveAspectRatio="none"
      >

        <g
          data-fallback-layer="zones"
        >

          <polygon
            class="dt-zone"
            points="
              52,288
              245,286
              265,395
              72,405
            "
          />

          <polygon
            class="dt-zone"
            points="
              315,335
              520,320
              550,520
              325,520
            "
          />

          <polygon
            class="dt-zone green"
            points="
              430,165
              655,155
              670,370
              430,350
            "
          />

          <polygon
            class="dt-zone green"
            points="
              650,130
              900,130
              900,370
              670,370
            "
          />

          <polygon
            class="dt-zone"
            points="
              555,390
              815,390
              815,565
              565,565
            "
          />

        </g>


        <g
          data-fallback-layer="pipelines"
        >

          <polyline
            class="dt-pipe"
            points="
              185,108
              325,125
              425,177
              535,170
              625,245
              790,300
              862,437
            "
          />

          <polyline
            class="dt-pipe-flow"
            points="
              185,108
              325,125
              425,177
              535,170
              625,245
              790,300
              862,437
            "
          />


          <polyline
            class="dt-pipe green"
            points="
              308,435
              390,400
              450,350
              520,264
              615,245
              670,360
              825,420
            "
          />


          <polyline
            class="dt-pipe-flow"
            points="
              308,435
              390,400
              450,350
              520,264
              615,245
              670,360
              825,420
            "
          />

        </g>


        <g>
          ${tankSvg}
        </g>


        <g
          data-fallback-layer="risk"
        >

          <circle
            cx="340"
            cy="420"
            r="38"
            fill="rgba(236,70,88,.10)"
            stroke="#ec4658"
            stroke-width="3"
          />

          <circle
            cx="510"
            cy="335"
            r="34"
            fill="rgba(236,70,88,.08)"
            stroke="#ec4658"
            stroke-width="3"
          />

        </g>


        <g
          data-fallback-layer="logistics"
        >

          <polyline
            points="
              155,100
              260,145
              355,210
              455,270
              605,330
              725,385
              860,435
            "
            fill="none"
            stroke="#20c982"
            stroke-width="8"
            opacity=".8"
          />

        </g>

      </svg>


      <div
        data-fallback-layer="equipment"
      >
        ${objects}
      </div>


      <div
        data-fallback-layer="maintenance"
        style="pointer-events:none"
      >

        <div
          class="dt-object"
          style="
            left:34%;
            top:71%;
          "
        >
          <span
            class="dt-object-pin orange"
          >
            ТО
          </span>
        </div>


        <div
          class="dt-object"
          style="
            left:53%;
            top:43%;
          "
        >
          <span
            class="dt-object-pin orange"
          >
            12.10
          </span>
        </div>

      </div>

    `;


    overlay
      .querySelectorAll(
        "[data-object]"
      )
      .forEach(element => {

        element.addEventListener(
          "click",
          () =>
            this.openObject(
              element.dataset.object
            )
        );

      });


    overlay
      .querySelectorAll(
        "[data-tank]"
      )
      .forEach(element => {

        element.addEventListener(
          "click",
          () => {

            const index =
              Number(
                element.dataset.tank
              );

            this.openTank(
              this.TANKS[index],
              index
            );

          }
        );

      });

  },


  bindLayers() {

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

              this.activeLayers
                .delete(layer);

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
        "[data-fallback-layer]"
      )
      .forEach(element => {

        const visible =
          this.activeLayers.has(
            element.dataset
              .fallbackLayer
          );

        element.style.display =
          visible
            ? ""
            : "none";

      });


    if (
      this.mode === "google"
    ) {

      Object.entries(
        this.googleLayers
      )
      .forEach(
        ([layer,objects]) => {

          const visible =
            this.activeLayers
            .has(layer);

          objects.forEach(
            object =>
              object.setVisible(
                visible
              )
          );

        }
      );


      this.applyZoomStyle();

    }


    const active = [
      ...this.activeLayers
    ];


    document
      .getElementById(
        "dt-layer-status"
      )
      .innerHTML =
      "<b>Активно:</b> " +
      active.join(" · ");

  },


  zoomIn() {

    if (
      this.mode === "google"
    ) {

      this.map.setZoom(
        Math.min(
          21,
          this.map.getZoom() + 1
        )
      );

      return;
    }


    this.fallbackZoom =
      Math.min(
        2.2,
        this.fallbackZoom + .18
      );


    this.applyFallbackZoom();

  },


  zoomOut() {

    if (
      this.mode === "google"
    ) {

      this.map.setZoom(
        Math.max(
          15,
          this.map.getZoom() - 1
        )
      );

      return;
    }


    this.fallbackZoom =
      Math.max(
        1,
        this.fallbackZoom - .18
      );


    this.applyFallbackZoom();

  },


  resetZoom() {

    if (
      this.mode === "google"
    ) {

      this.map.panTo({
        lat: 41.6438169,
        lng: 41.6605911
      });

      this.map.setZoom(17);

      return;
    }


    this.fallbackZoom = 1;

    this.applyFallbackZoom();

  },


  applyFallbackZoom() {

    document
      .getElementById(
        "dt-fallback-world"
      )
      .style.transform =
      `scale(${this.fallbackZoom})`;

  },


  openTank(tank,index) {

    const risk =
      [5,15,25,30,33]
      .includes(index);


    this.openDrawer(

      tank.id,

      "Резервуар · спутниковый контур",

      risk
        ? "Высокий риск"
        : "В эксплуатации",

      risk
        ? "red"
        : "green",

      [

        ["Уровень",
          (55 + index % 30) + "%"
        ],

        ["Температура",
          (26 + index % 6) +
          ".4 °C"
        ],

        ["Расчетный износ",
          (38 + index % 35) + "%"
        ],

        ["Следующий осмотр",
          index % 2
            ? "18.09.2024"
            : "12.10.2024"
        ],

        ["Свободная емкость",
          (22 + index % 21) + "%"
        ],

        ["Риск простоя",
          risk
            ? "Высокий"
            : "Низкий"
        ]

      ],

      risk
        ? "Резервуар находится в зоне повышенного внимания. При текущем плане поступлений рекомендуется ограничить загрузку и проверить ближайшее технологическое окно."
        : "Критических отклонений не выявлено. Эксплуатация может продолжаться по текущему графику."

    );

  },


  openObject(id) {

    const item =
      this.EQUIPMENT
      .find(
        object =>
          object.id === id
      );


    if (!item) {
      return;
    }


    this.openDrawer(

      item.title,

      item.type,

      item.status,

      item.color,

      [

        ["Загрузка",
          item.load
        ],

        ["Износ",
          item.wear
        ],

        ["Риск простоя",
          item.risk
        ],

        ["Следующее ТО",
          item.to
        ],

        ["Ремонты",
          item.cost
        ],

        ["Данные",
          "Онлайн"
        ]

      ],

      item.recommendation

    );

  },


  openDrawer(
    title,
    subtitle,
    status,
    statusColor,
    metrics,
    recommendation
  ) {

    document
      .getElementById(
        "dt-drawer-title"
      )
      .textContent =
      title;


    document
      .getElementById(
        "dt-drawer-subtitle"
      )
      .textContent =
      subtitle;


    document
      .getElementById(
        "dt-drawer-body"
      )
      .innerHTML = `

        <span
          class="
            dt-status
            ${statusColor}
          "
        >
          ${status}
        </span>


        <div class="dt-metrics">

          ${
            metrics.map(
              metric => `
                <div
                  class="dt-metric"
                >
                  <span>
                    ${metric[0]}
                  </span>

                  <strong>
                    ${metric[1]}
                  </strong>
                </div>
              `
            ).join("")
          }

        </div>


        <div
          class="dt-recommend"
        >

          <strong>
            Рекомендация системы
          </strong>

          <p>
            ${recommendation}
          </p>

        </div>


        <div
          class="dt-object-list"
        >

          <a
            class="dt-object-row"
            href="/?module=equipment"
          >
            <div>
              <strong>
                Карточка оборудования
              </strong>

              <small>
                Паспорт, узлы, показатели
              </small>
            </div>

            <b>→</b>
          </a>


          <a
            class="dt-object-row"
            href="/?module=analytics"
          >
            <div>
              <strong>
                Предиктивная аналитика
              </strong>

              <small>
                Прогноз отказа и сценарии
              </small>
            </div>

            <b>→</b>
          </a>


          <a
            class="dt-object-row"
            href="/?module=toir"
          >
            <div>
              <strong>
                ТОиР
              </strong>

              <small>
                Работы и история ремонта
              </small>
            </div>

            <b>→</b>
          </a>


          <a
            class="dt-object-row"
            href="/?module=procurement"
          >
            <div>
              <strong>
                Закупки / ЗИП
              </strong>

              <small>
                Остатки и потребность
              </small>
            </div>

            <b>→</b>
          </a>

        </div>

      `;


    document
      .getElementById(
        "dt-drawer"
      )
      .classList
      .add("visible");

  },


  closeDrawer() {

    document
      .getElementById(
        "dt-drawer"
      )
      .classList
      .remove(
        "visible"
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
            event.target
              .value
              .trim()
              .toLowerCase();


          const equipment =
            this.EQUIPMENT
            .find(
              item =>
                item.title
                  .toLowerCase()
                  .includes(value) ||

                item.code
                  .toLowerCase()
                  .includes(value)
            );


          if (equipment) {

            this.openObject(
              equipment.id
            );

            return;
          }


          const tank =
            this.TANKS
            .find(
              item =>
                item.id
                  .toLowerCase()
                  .includes(value)
            );


          if (tank) {

            this.openTank(
              tank,
              this.TANKS
                .indexOf(tank)
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


  setMode(text) {

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

        document
          .getElementById(
            "dt-time"
          )
          .textContent =
          new Date()
          .toLocaleTimeString(
            "ru-RU"
          );

      };


    update();

    setInterval(
      update,
      1000
    );

  },


  toast(title,message) {

    const element =
      document
      .getElementById(
        "dt-toast"
      );


    element.innerHTML = `

      <strong>
        ${title}
      </strong>

      <span>
        ${message}
      </span>

    `;


    element.classList
      .add(
        "visible"
      );


    clearTimeout(
      this.toastTimer
    );


    this.toastTimer =
      setTimeout(
        () =>
          element.classList
          .remove(
            "visible"
          ),
        2500
      );

  }

};


window.addEventListener(
  "DOMContentLoaded",
  () =>
    BNTDigitalTwin.init()
);

