(function () {

  const data =
    window.BNT_DATA.scenarios;

  const ui =
    window.BNTUI;


  let selected =
    data.items[0];


  let intensity =
    100;


  let scenarioSort = {
    key: null,
    direction: "default"
  };


  const financialNumberFormat =
    new Intl.NumberFormat(
      "ru-RU",
      {
        maximumFractionDigits: 0
      }
    );

  const compactFinancialNumberFormat =
    new Intl.NumberFormat(
      "ru-RU",
      {
        maximumFractionDigits: 1
      }
    );


  const financialForecastCharts = {
    incomeExpense: {
      max: 1300000,
      categories: [
        "Сен",
        "Окт",
        "Ноя",
        "Дек",
        "Янв",
        "Фев"
      ],
      series: [
        {
          label: "Доход — план",
          className: "primary",
          values: [
            1220000,
            1190000,
            1160000,
            1230000,
            1170000,
            1200000
          ]
        },
        {
          label: "Доход — прогноз",
          className: "secondary",
          values: [
            1180000,
            1215000,
            1200000,
            1245000,
            1195000,
            1225000
          ]
        },
        {
          label: "Расход — план",
          className: "positive",
          values: [
            1105000,
            1080000,
            1050000,
            1110000,
            1060000,
            1085000
          ]
        },
        {
          label: "Расход — прогноз",
          className: "warning",
          values: [
            1071000,
            1090000,
            1078000,
            1121000,
            1072000,
            1090000
          ]
        }
      ]
    },
    cashFlow: {
      max: 1700000,
      categories: [
        "01-06 мар",
        "07-13 мар",
        "14-20 мар",
        "21-27 мар",
        "28-30 мар",
        "30-31 мар"
      ],
      series: [
        {
          label: "Поступления",
          className: "primary",
          values: [
            930000,
            640000,
            820000,
            910000,
            860000,
            790000
          ]
        },
        {
          label: "Платежи",
          className: "secondary",
          values: [
            780000,
            760000,
            950000,
            770000,
            730000,
            850000
          ]
        },
        {
          label: "Остаток денежных средств",
          className: "positive",
          values: [
            1600000,
            1480000,
            1350000,
            1490000,
            1620000,
            1560000
          ]
        }
      ]
    },
    transshipmentCapacity: {
      max: 1600000,
      unit: "МТ",
      categories: [
        "Сен",
        "Окт",
        "Ноя",
        "Дек",
        "Янв",
        "Фев"
      ],
      series: [
        {
          label: "Перевалка — план, МТ",
          className: "primary",
          values: [
            1360000,
            1400000,
            1320000,
            1380000,
            1300000,
            1350000
          ]
        },
        {
          label: "Перевалка — прогноз, МТ",
          className: "warning",
          values: [
            1420000,
            1460000,
            1350000,
            1415000,
            1340000,
            1390000
          ]
        },
        {
          label: "Доступная мощность, МТ",
          className: "positive",
          values: [
            1550000,
            1550000,
            1550000,
            1550000,
            1550000,
            1550000
          ]
        }
      ]
    }
  };


  const transshipmentLoadChart = {
    axisMax: 120,
    axisStep: 30,
    threshold: 90,
    rows: [
      {
        label: "Ж/д эстакада №8",
        current: 82,
        peak: 96
      },
      {
        label: "Ж/д эстакада №4",
        current: 76,
        peak: 88
      },
      {
        label: "Причал №1",
        current: 77,
        peak: 91
      },
      {
        label: "Причал №2",
        current: 63,
        peak: 83
      },
      {
        label: "Резервуарная группа 4",
        current: 81,
        peak: 93
      },
      {
        label: "Резервуарная группа 2",
        current: 69,
        peak: 78
      },
      {
        label: "Насосная группа 3",
        current: 74,
        peak: 97
      },
      {
        label: "Наливная линия L-2",
        current: 71,
        peak: 89
      }
    ]
  };


  const resourceStabilityData = {
    info: "Доля контура = риск-балл контура / сумма риск-баллов всех контуров. Проекты не выделяются отдельным ресурсом: их влияние отражается через финансы, кадры, ТОиР, закупки, запасы и ограничения мощности.",
    cards: [
      {
        label: "ФИНАНСЫ",
        percent: 6,
        value: "0 разрывов",
        description: "Доля в общем риске"
      },
      {
        label: "ЗАКУПКИ",
        percent: 19,
        value: "3 позиции",
        description: "Доля в общем риске"
      },
      {
        label: "ЗАПАСЫ И ЗИП",
        percent: 15,
        value: "2 позиции",
        description: "Доля в общем риске"
      },
      {
        label: "КАДРЫ",
        percent: 16,
        value: "3 роли",
        description: "Доля в общем риске"
      },
      {
        label: "АКТИВЫ И ТОиР",
        percent: 26,
        value: "2 объекта",
        description: "Доля в общем риске"
      },
      {
        label: "ЛОГИСТИКА И\u00A0МОЩНОСТИ",
        percent: 18,
        value: "3 операции",
        description: "Доля в общем риске"
      }
    ],
    riskShare: {
      axisMax: 30,
      axisStep: 10,
      rows: [
        {
          label: "Финансы",
          value: 6
        },
        {
          label: "Закупки",
          value: 19
        },
        {
          label: "Запасы и ЗИП",
          value: 15
        },
        {
          label: "Кадры",
          value: 16
        },
        {
          label: "Активы и ТОиР",
          value: 26
        },
        {
          label: "Логистика и\u00A0мощности",
          value: 18
        }
      ]
    },
    deficit: {
      axisMax: 5,
      axisStep: 1,
      rows: [
        {
          label: "Закупки",
          day30: 3,
          day60: 2,
          day90: 1
        },
        {
          label: "Запчасти и материалы",
          day30: 4,
          day60: 2,
          day90: 2
        },
        {
          label: "Критические роли",
          day30: 2,
          day60: 2,
          day90: 1
        },
        {
          label: "Квалификации / допуски",
          day30: 1,
          day60: 2,
          day90: 3
        },
        {
          label: "Подрядчики",
          day30: 1,
          day60: 1,
          day90: 0
        }
      ]
    }
  };


  function sortedScenarioItems() {
    const items = [...data.items];

    if (
      !scenarioSort.key ||
      scenarioSort.direction === "default"
    ) {
      return items;
    }

    const direction =
      scenarioSort.direction === "descending"
        ? -1
        : 1;

    return items.sort(
      (left, right) =>
        (
          Number(left[scenarioSort.key]) -
          Number(right[scenarioSort.key])
        ) * direction
    );
  }


  function riskTone(value) {
    return value > 20
      ? "is-negative"
      : value > 10
        ? "is-warning"
        : "is-positive";
  }


  function updateScenarioSortControls() {
    document
      .querySelectorAll("[data-scenario-sort]")
      .forEach(button => {
        const active =
          button.dataset.scenarioSort === scenarioSort.key;
        const direction =
          active
            ? scenarioSort.direction
            : "default";
        const icon =
          direction === "descending"
            ? "SortDescending"
            : direction === "ascending"
              ? "SortAscending"
              : "SortDefault";
        const nextLabel =
          direction === "descending"
            ? "от меньшего к большему"
            : direction === "ascending"
              ? "по умолчанию"
              : "от большего к меньшему";

        button.dataset.sortDirection = direction;
        button.setAttribute(
          "aria-label",
          `Сортировать ${button.dataset.sortLabel.toLowerCase()} ${nextLabel}`
        );
        button
          .closest("th")
          .setAttribute(
            "aria-sort",
            direction === "default"
              ? "none"
              : direction
          );
        button
          .querySelector("use")
          .setAttribute(
            "href",
            `/assets/icons/financial-interface.svg?v=5#${icon}`
          );
      });
  }


  const kpiInfo = {
    risk: {
      title: "Риск простоя",
      text: "Расчётная вероятность простоя оборудования для выбранного сценария."
    },
    budget: {
      title: "Бюджет ТОиР",
      text: "Расчётный бюджет технического обслуживания и ремонта на шесть месяцев."
    },
    availability: {
      title: "Доступность",
      text: "Доля времени, в течение которого мощности доступны для эксплуатации."
    },
    capacity: {
      title: "Свободная ёмкость",
      text: "Доля свободной резервуарной ёмкости в выбранном сценарии."
    }
  };


  function adjusted(
    value,
    base
  ) {

    return Math.round(
      base +
      (
        value - base
      ) *
      intensity /
      100
    );
  }


  function sourceBadge(scenario) {
    return window.BNTUI.badge(scenario.sourceLabel, scenario.source === "data" ? "green" : scenario.source === "model" ? "purple" : "neutral");
  }

  function analyticsKpiCard({
    label,
    value,
    tone = "",
    contextHtml,
    actionHtml = "",
    modifier = ""
  }) {

    return `

      <article class="analytics-kpi${modifier ? ` ${modifier}` : ""}">

        <div class="analytics-kpi__heading">
          <span class="analytics-kpi__label typography-body-smallest">
            ${label}
          </span>
          ${actionHtml}
        </div>

        <div class="kpi-card__body">
          <strong class="analytics-kpi__value typography-label-base ${tone}">
            ${value}
          </strong>
          ${contextHtml}
        </div>

      </article>

    `;
  }


  function renderEvidence() {

    const target =
      document.getElementById(
        "analytics-evidence"
      );


    if (!target) {
      return;
    }


    target.innerHTML =
      data.evidence
      .map(
        item => {
          const tone =
            item.tone === "risk"
              ? "is-negative"
              : item.tone === "good"
                ? "is-positive"
                : "";

          return analyticsKpiCard({
            label: item.label,
            value: item.value,
            tone,
            modifier: "analytics-evidence-item",
            contextHtml: item.noteAccent
              ? `
                <p class="analytics-kpi__context analytics-evidence-trend typography-body-smallest">
                  <span class="analytics-evidence-trend__metric typography-label-smallest is-negative">${item.noteAccent}</span> <span class="analytics-evidence-trend__context typography-body-smallest">${item.note}</span>
                </p>
              `
              : `
                <p class="analytics-kpi__context typography-body-smallest">
                  ${item.note}
                </p>
              `
          });
        }
      )
      .join("");
  }


  function render() {

    const base =
      data.items[0];


    const risk =
      adjusted(
        selected.risk,
        base.risk
      );


    const budget =
      adjusted(
        selected.budget,
        base.budget
      );


    const availability =
      adjusted(
        selected.availability,
        base.availability
      );


    const capacity =
      adjusted(
        selected.capacity,
        base.capacity
      );


    document
      .getElementById(
        "analytics-kpis"
      )
      .innerHTML = [
        {
          key: "risk",
          label: "Риск простоя",
          value: `${risk}%`,
          tone: risk > 18 ? "is-negative" : risk > 10 ? "is-warning" : "is-positive"
        },
        {
          key: "budget",
          label: "Бюджет ТОиР",
          value: `$${budget}K`,
          tone: budget < base.budget ? "is-positive" : budget > base.budget ? "is-negative" : ""
        },
        {
          key: "availability",
          label: "Доступность",
          value: `${availability}%`,
          tone: availability >= 92 ? "is-positive" : availability >= 90 ? "is-warning" : "is-negative"
        },
        {
          key: "capacity",
          label: "Свободная ёмкость",
          value: `${capacity}%`,
          tone: capacity < 22 ? "is-negative" : capacity > base.capacity ? "is-positive" : ""
        }
      ]
      .map(
        k => {
          const info =
            kpiInfo[k.key] || {
              title: k.label,
              text: ""
            };
          const popoverId =
            `analytics-kpi-info-${k.key}`;

          return analyticsKpiCard({
            label: k.label,
            value: k.value,
            tone: k.tone,
            contextHtml: `
              <p class="analytics-kpi__context typography-body-smallest">
                ${selected.name}
              </p>
            `,
            actionHtml: `
              <span class="analytics-kpi__info-wrap" data-analytics-info-root>
                <button class="analytics-kpi__info" type="button" data-analytics-info-trigger aria-expanded="false" aria-controls="${popoverId}" aria-label="Информация: ${ui.escape(k.label)}">
                  <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=10#Info"></use></svg>
                </button>
                <span id="${popoverId}" class="analytics-title-popover analytics-kpi__popover" data-analytics-info-popover role="dialog" aria-label="${ui.escape(info.title)}" hidden>
                  <button class="analytics-title-popover__close" type="button" data-analytics-info-close aria-label="Закрыть информацию">
                    <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
                  </button>
                  <span class="analytics-title-popover__text typography-body-smallest">${ui.escape(info.text)}</span>
                </span>
              </span>
            `
          });
        }
      )
      .join("");


    document
      .getElementById(
        "scenario-rows"
      )
      .innerHTML =
      sortedScenarioItems().map(
        scenario => `

          <tr
            class="
              table-row--selectable
              ${
                scenario.id ===
                selected.id
                  ? "table-row--selected"
                  : ""
              }
            "
            data-scenario="${scenario.id}"
            aria-selected="${scenario.id === selected.id ? "true" : "false"}"
          >

            <td>
              <div class="table-cell-content table-cell-content--with-pill">
                <div class="table-header-content">
                  <strong>
                    ${scenario.name}
                  </strong>

                  <small>
                    ${scenario.subtitle}
                  </small>
                </div>

                ${sourceBadge(scenario)}
              </div>
            </td>


            <td class="data-table__percent-cell">
              <span class="data-table__risk-value ${riskTone(scenario.risk)}">
                ${scenario.risk}%
              </span>
            </td>


            <td class="data-table__numeric-cell table-number-cell">
              <div class="table-number-content">
                <strong>
                  ${financialNumberFormat.format(scenario.budget * 1000)}
                </strong>
                <small>USD</small>
              </div>
            </td>


            <td class="data-table__percent-cell">
              ${scenario.availability}%
            </td>


            <td class="data-table__numeric-cell table-number-cell">
              ${scenario.repairs}
            </td>


            <td class="data-table__percent-cell">
              ${scenario.capacity}%
            </td>

          </tr>

        `
      )
      .join("");


    document
      .getElementById(
        "scenario-detail"
      )
      .innerHTML = `

        <div class="scenario-copy">

          <div class="scenario-copy__title-row">
            <h3>
              ${selected.name}
            </h3>
            <span class="scenario-copy__title-info" data-analytics-info-root>
              <button class="analytics-kpi__info" type="button" data-analytics-info-trigger aria-expanded="false" aria-controls="scenario-description-popover" aria-label="Информация о сценарии ${selected.name}">
                <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=10#Info"></use></svg>
              </button>
              <span id="scenario-description-popover" class="analytics-title-popover" data-analytics-info-popover role="dialog" aria-label="Описание сценария" hidden>
                <button class="analytics-title-popover__close" type="button" data-analytics-info-close aria-label="Закрыть описание сценария">
                  <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
                </button>
                <span class="analytics-title-popover__text typography-body-smallest">
                  ${selected.description}
                </span>
              </span>
            </span>
          </div>

          ${sourceBadge(selected)}

        </div>


        <div class="range-line" style="--scenario-progress:${Math.max(0, Math.min(100, intensity / 140 * 100))}%">

          <label>

            <span>
              Интенсивность сценария
            </span>

            <b>
              ${intensity}%
            </b>

          </label>


          <div class="scenario-range">
            <span class="scenario-range__track" aria-hidden="true">
              <span class="scenario-range__line"></span>
            </span>
            <input
              id="scenario-intensity"
              type="range"
              min="0"
              max="140"
              step="10"
              value="${intensity}"
              aria-label="Интенсивность сценария"
              aria-valuetext="${intensity} процентов"
            >
          </div>

        </div>


        <div class="scenario-impact">

          <div>
            <span>Риск</span>
            <strong>${risk}%</strong>
          </div>

          <div>
            <span>Бюджет</span>
            <strong>$${budget}K</strong>
          </div>

          <div>
            <span>Доступность</span>
            <strong>${availability}%</strong>
          </div>

          <div>
            <span>Резерв</span>
            <strong>${capacity}%</strong>
          </div>

        </div>


        <div class="scenario-recommendations">

          <h4>
            Рекомендуемые действия
          </h4>


          <ol>

            ${
              selected.actions
              .map(
                action => `

                  <li>
                    ${action}
                  </li>
                `
              )
              .join("")
            }

          </ol>

        </div>


        <div class="decision-note">

          Фактические показатели используются
          как исходные данные. Изменение риска,
          бюджета и доступности в сценарии является
          демонстрационной расчетной оценкой и
          предназначено для сравнения вариантов.

        </div>
      `;


    document
      .getElementById(
        "scenario-intensity"
      )
      .addEventListener(
        "input",
        event => {

          intensity =
            Number(
              event.target.value
            );

          render();
        }
      );
  }


  document
    .getElementById(
      "scenario-rows"
    )
    .addEventListener(
      "click",
      event => {

        const row =
          event.target.closest(
            "[data-scenario]"
          );


        if (!row) {
          return;
        }


        selected =
          data.items.find(
            item =>
              item.id ===
              row.dataset.scenario
          );


        intensity = 100;


        render();
      }
    );


  document
    .querySelector(
      "[data-scenario-table] thead"
    )
    .addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-scenario-sort]"
          );

        if (!button) {
          return;
        }

        const key =
          button.dataset.scenarioSort;
        const nextDirection =
          scenarioSort.key !== key
            ? "descending"
            : scenarioSort.direction === "descending"
              ? "ascending"
              : scenarioSort.direction === "ascending"
                ? "default"
                : "descending";

        scenarioSort =
          nextDirection === "default"
            ? {
                key: null,
                direction: "default"
              }
            : {
                key,
                direction: nextDirection
              };

        updateScenarioSortControls();
        render();
      }
    );


  document
    .getElementById(
      "risk-ranking"
    )
    .innerHTML =
    data.riskRanking
    .map(
      (
        row,
        index
      ) => `

        <div class="rank-row">

          <span class="flow-panel__number">
            ${index + 1}
          </span>

          <strong>
            ${row[0]}
          </strong>

          <b>
            ${row[1]}
          </b>

          ${
            ui.badge(
              row[1] > 70
                ? "Высокий"
                : "Средний",
              row[2]
            )
          }

        </div>
      `
    )
    .join("");


  document
    .getElementById(
      "repair-windows"
    )
    .innerHTML =
    data.repairWindows
    .map(
      (row, index) => {
        const state =
          index === 0
            ? "complete"
            : index === 1
              ? "active"
              : "pending";

        return `

        <div class="timeline-row timeline-row--${state}"${state === "active" ? ' aria-current="step"' : ""}>

          <span class="timeline-row__marker" aria-hidden="true">
            ${
              state === "complete"
                ? `
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2.5 5.20832L4.16667 7.08332L7.5 2.91666" stroke="var(--design-elements-icon-tertiary)" stroke-width="0.8" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
                  </svg>
                `
                : ""
            }
          </span>

          <div class="timeline-row__content table-header-content">
            <strong>
              ${row[0]}
            </strong>

            <span>
              ${row[1]}
            </span>
          </div>

        </div>
      `;
      }
    )
    .join("");


  const capacityForecast = document.getElementById("capacity-forecast");
  const capacityAxisMax = 125;
  const capacityTicks = Array.from({ length: 6 }, (_, index) => index * 25);

  capacityForecast.innerHTML = `

      <div class="analytics-capacity-chart__plot">

        <div class="analytics-capacity-chart__axis" aria-hidden="true">
          ${capacityTicks.map(value => `<span style="--capacity-tick-position:${value / capacityAxisMax * 100}%">${value}%</span>`).join("")}
        </div>


        <div class="chart-viewport__plot chart-scrollbar">
        <div class="analytics-capacity-chart__body">

          <div class="analytics-capacity-chart__grid" aria-hidden="true">
            ${capacityTicks.map(() => "<span></span>").join("")}
          </div>


          <div class="analytics-capacity-chart__rows">

            ${
              [
                [
                  "Базовая доступность",
                  92,
                  "primary"
                ],

                [
                  "Плановый ремонт",
                  95,
                  "positive"
                ],

                [
                  "Ускоренный ЗИП",
                  96,
                  "positive"
                ],

                [
                  "Стресс +12%",
                  87,
                  "negative"
                ]
              ]
              .map(
                row => `

                  <div class="analytics-capacity-chart__row" role="img" aria-label="${row[0]}: ${row[1]} процентов">

                    <span class="analytics-capacity-chart__label">
                      ${row[0]}
                    </span>

                    <span class="analytics-capacity-chart__track" style="--capacity-value:${row[1] / capacityAxisMax * 100}%" aria-hidden="true">
                      <i class="analytics-capacity-chart__bar analytics-capacity-chart__bar--${row[2]}"></i>
                      <span class="analytics-capacity-chart__value">${row[1]}%</span>
                    </span>

                  </div>
                `
              )
              .join("")
            }

          </div>

        </div>

      </div>


      </div>
      <div class="analytics-capacity-chart__legend" aria-label="Легенда графика">
        <span><i class="analytics-capacity-chart__legend-dot analytics-capacity-chart__legend-dot--primary"></i>Базовый</span>
        <span><i class="analytics-capacity-chart__legend-dot analytics-capacity-chart__legend-dot--positive"></i>Улучшение</span>
        <span><i class="analytics-capacity-chart__legend-dot analytics-capacity-chart__legend-dot--negative"></i>Негативный сценарий</span>
      </div>
    `;


  function formatChartTick(value) {
    if (value >= 1000000) {
      return `${compactFinancialNumberFormat.format(value / 1000000)} млн`;
    }

    if (value >= 1000) {
      return `${compactFinancialNumberFormat.format(value / 1000)} тыс`;
    }

    return financialNumberFormat.format(value);
  }


  function renderFinancialForecastChart(key) {
    const chartData =
      financialForecastCharts[key];
    const chart =
      document.querySelector(
        `[data-analytics-line-chart="${key}"]`
      );
    const legend =
      document.querySelector(
        `[data-analytics-line-legend="${key}"]`
      );


    if (!chartData || !chart) {
      return;
    }

    const unit =
      chartData.unit || "USD";

    ui.renderFinancialLineChart(
      chart,
      {
        categories: chartData.categories,
        series: chartData.series,
        legend,
        max: chartData.max,
        width: 960,
        height: 320,
        margin: {
          top: 8,
          right: chartData.rightMargin ?? 0,
          bottom: 38,
          left: 68
        },
        formatTick: formatChartTick,
        makePointLabel: ({category, seriesItem, value}) =>
          `${category}, ${seriesItem.label}: ${financialNumberFormat.format(value)} ${unit}`
      }
    );
  }


  function renderFinancialForecastCharts() {
    Object
      .keys(financialForecastCharts)
      .forEach(renderFinancialForecastChart);
  }


  function renderTransshipmentLoadChart() {
    const chart =
      document.querySelector("[data-analytics-transshipment-load-chart]");

    if (!chart) {
      return;
    }

    const tickCount =
      Math.round(transshipmentLoadChart.axisMax / transshipmentLoadChart.axisStep) + 1;
    const ticks =
      Array
        .from(
          {
            length: tickCount
          },
          (_, index) => {
            const value =
              index * transshipmentLoadChart.axisStep;

            return `<span>${value === 0 ? "0" : `${financialNumberFormat.format(value)}%`}</span>`;
          }
        )
        .join("");
    const grid =
      Array
        .from(
          {
            length: tickCount - 1
          },
          () => "<span></span>"
        )
        .join("");
    const rows =
      transshipmentLoadChart.rows
        .map(row => {
          const label =
            ui.escape(row.label);
          const currentWidth =
            row.current / transshipmentLoadChart.axisMax * 100;
          const peakWidth =
            row.peak / transshipmentLoadChart.axisMax * 100;
          const threshold =
            row.threshold ?? transshipmentLoadChart.threshold;
          const thresholdWidth =
            threshold / transshipmentLoadChart.axisMax * 100;
          const currentLabel =
            `${financialNumberFormat.format(row.current)}%`;
          const peakLabel =
            `${financialNumberFormat.format(row.peak)}%`;
          const thresholdLabel =
            `${financialNumberFormat.format(threshold)}%`;

          return `
            <div class="payment-deviation-chart__row" role="img" aria-label="${label}: текущая загрузка ${currentLabel}, прогноз пика ${peakLabel}, порог ${thresholdLabel}">
              <span class="payment-deviation-chart__label" title="${label}">${label}</span>
              <span class="payment-deviation-chart__tracks" aria-hidden="true">
                <span class="payment-deviation-chart__track" style="--payment-deviation-value:${currentWidth}%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--plan"></i><strong class="payment-deviation-chart__value">${currentLabel}</strong></span>
                <span class="payment-deviation-chart__track" style="--payment-deviation-value:${peakWidth}%"><i class="payment-deviation-chart__bar series-light"></i><strong class="payment-deviation-chart__value">${peakLabel}</strong></span>
                <span class="payment-deviation-chart__track" style="--payment-deviation-value:${thresholdWidth}%"><i class="payment-deviation-chart__bar series-gas"></i><strong class="payment-deviation-chart__value">${thresholdLabel}</strong></span>
              </span>
            </div>
          `;
        })
        .join("");

    chart.style.setProperty(
      "--payment-deviation-divisions",
      String(tickCount - 1)
    );
    chart.innerHTML =
      `<div class="payment-deviation-chart__axis" aria-hidden="true">${ticks}</div><div class="chart-viewport__plot chart-scrollbar"><div class="payment-deviation-chart__body"><div class="payment-deviation-chart__grid" aria-hidden="true">${grid}</div><div class="payment-deviation-chart__rows">${rows}</div></div></div>`;
  }


  function renderResourceCards() {
    const target =
      document.querySelector("[data-analytics-resource-cards]");

    if (!target) {
      return;
    }

    target.innerHTML =
      resourceStabilityData.cards
        .map((card, index) => {
          const percent =
            Math.max(0, Math.min(card.percent, 100));
          const label =
            ui.escape(card.label);
          const value =
            ui.escape(card.value);
          const description =
            ui.escape(card.description);
          const infoId =
            `resource-card-info-${index}`;
          const infoText =
            ui.escape(resourceStabilityData.info);
          const cardToneClass =
            percent > 15
              ? "payment-summary-card--error"
              : percent >= 10
                ? "payment-summary-card--warning"
                : "";
          const cardToneStyle =
            percent < 10
              ? ` style="--payment-semantic-color: var(--system-elements-semantic-neutral-primary)"`
              : "";

          return `
            <article class="payment-summary-card${cardToneClass ? ` ${cardToneClass}` : ""}"${cardToneStyle}>
              <header class="payment-summary-card__heading">
                <h3 class="payment-summary-card__title typography-body-smallest">${label}</h3>
                <span class="financial-kpi__info-wrap" data-analytics-info-root>
                  <button class="analytics-kpi__info" type="button" data-analytics-info-trigger aria-expanded="false" aria-controls="${infoId}" aria-label="Информация о ${label}">
                    <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=10#Info"></use></svg>
                  </button>
                  <span id="${infoId}" class="analytics-title-popover analytics-forecast-kpi__popover" data-analytics-info-popover role="dialog" aria-label="О доле риска ${label}" hidden>
                    <button class="analytics-title-popover__close" type="button" data-analytics-info-close aria-label="Закрыть информацию">
                      <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
                    </button>
                    <span class="analytics-title-popover__text typography-body-smallest">${infoText}</span>
                  </span>
                </span>
              </header>
              <div class="payment-summary-card__content">
                ${ui.progressRing({label,percent,display:`${financialNumberFormat.format(percent)}%`,ariaLabel:`${label}: ${financialNumberFormat.format(percent)} процентов общего риска`})}
                <div class="payment-summary-card__copy">
                  <strong class="payment-summary-card__amount typography-label-base">${value}</strong>
                  <span class="payment-summary-card__description typography-body-smallest">${description}</span>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
  }


  function renderResourceRiskChart() {
    const chart =
      document.querySelector("[data-analytics-resource-risk-chart]");

    if (!chart) {
      return;
    }

    const tickCount =
      Math.round(resourceStabilityData.riskShare.axisMax / resourceStabilityData.riskShare.axisStep) + 1;
    const ticks =
      Array
        .from(
          {
            length: tickCount
          },
          (_, index) => {
            const value =
              index * resourceStabilityData.riskShare.axisStep;

            return `<span>${value === 0 ? "0" : `${financialNumberFormat.format(value)}%`}</span>`;
          }
        )
        .join("");
    const grid =
      Array
        .from(
          {
            length: tickCount - 1
          },
          () => "<span></span>"
        )
        .join("");
    const rows =
      resourceStabilityData.riskShare.rows
        .map(row => {
          const label =
            ui.escape(row.label);
          const width =
            row.value / resourceStabilityData.riskShare.axisMax * 100;
          const valueLabel =
            `${financialNumberFormat.format(row.value)}%`;

          return `
            <div class="payment-deviation-chart__row" role="img" aria-label="${label}: доля риска ${valueLabel}">
              <span class="payment-deviation-chart__label" title="${label}">${label}</span>
              <span class="payment-deviation-chart__tracks" aria-hidden="true">
                <span class="payment-deviation-chart__track" style="--payment-deviation-value:${width}%"><i class="payment-deviation-chart__bar series-light"></i><strong class="payment-deviation-chart__value">${valueLabel}</strong></span>
              </span>
            </div>
          `;
        })
        .join("");

    chart.style.setProperty(
      "--payment-deviation-divisions",
      String(tickCount - 1)
    );
    chart.innerHTML =
      `<div class="payment-deviation-chart__axis" aria-hidden="true">${ticks}</div><div class="chart-viewport__plot chart-scrollbar"><div class="payment-deviation-chart__body"><div class="payment-deviation-chart__grid" aria-hidden="true">${grid}</div><div class="payment-deviation-chart__rows">${rows}</div></div></div>`;
  }


  function renderResourceDeficitChart() {
    const chart =
      document.querySelector("[data-analytics-resource-deficit-chart]");

    if (!chart) {
      return;
    }

    const tickCount =
      Math.round(resourceStabilityData.deficit.axisMax / resourceStabilityData.deficit.axisStep) + 1;
    const ticks =
      Array
        .from(
          {
            length: tickCount
          },
          (_, index) =>
            `<span>${financialNumberFormat.format(index * resourceStabilityData.deficit.axisStep)}</span>`
        )
        .join("");
    const grid =
      Array
        .from(
          {
            length: tickCount - 1
          },
          () => "<span></span>"
        )
        .join("");
    const rows =
      resourceStabilityData.deficit.rows
        .map(row => {
          const label =
            ui.escape(row.label);
          const day30Width =
            row.day30 / resourceStabilityData.deficit.axisMax * 100;
          const day60Width =
            row.day60 / resourceStabilityData.deficit.axisMax * 100;
          const day90Width =
            row.day90 / resourceStabilityData.deficit.axisMax * 100;

          return `
            <div class="payment-deviation-chart__row" role="img" aria-label="${label}: 30 дней ${financialNumberFormat.format(row.day30)}, 60 дней ${financialNumberFormat.format(row.day60)}, 90 дней ${financialNumberFormat.format(row.day90)}">
              <span class="payment-deviation-chart__label" title="${label}">${label}</span>
              <span class="payment-deviation-chart__tracks" aria-hidden="true">
                <span class="payment-deviation-chart__track" style="--payment-deviation-value:${day30Width}%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--fact"></i><strong class="payment-deviation-chart__value">${financialNumberFormat.format(row.day30)}</strong></span>
                <span class="payment-deviation-chart__track" style="--payment-deviation-value:${day60Width}%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--plan"></i><strong class="payment-deviation-chart__value">${financialNumberFormat.format(row.day60)}</strong></span>
                <span class="payment-deviation-chart__track" style="--payment-deviation-value:${day90Width}%"><i class="payment-deviation-chart__bar series-light"></i><strong class="payment-deviation-chart__value">${financialNumberFormat.format(row.day90)}</strong></span>
              </span>
            </div>
          `;
        })
        .join("");

    chart.style.setProperty(
      "--payment-deviation-divisions",
      String(tickCount - 1)
    );
    chart.innerHTML =
      `<div class="payment-deviation-chart__axis" aria-hidden="true">${ticks}</div><div class="chart-viewport__plot chart-scrollbar"><div class="payment-deviation-chart__body"><div class="payment-deviation-chart__grid" aria-hidden="true">${grid}</div><div class="payment-deviation-chart__rows">${rows}</div></div></div>`;
  }


  function renderResourceStability() {
    renderResourceCards();
    renderResourceRiskChart();
    renderResourceDeficitChart();
  }


  function downloadCsv(filename, rows) {
    const csv =
      rows
      .map(
        row =>
          row
          .map(
            value =>
              `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(";")
      )
      .join("\n");
    const blob =
      new Blob(
        [`\ufeff${csv}`],
        {
          type: "text/csv;charset=utf-8"
        }
      );
    const link =
      document.createElement("a");

    link.href =
      URL.createObjectURL(blob);
    link.download =
      filename;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
  }


  function exportFinancialForecastChart(key) {
    if (key === "resourceRisk") {
      downloadCsv(
        "analytics-resourceRisk.csv",
        [
          [
            "Контур",
            "Доля риска"
          ],
          ...resourceStabilityData.riskShare.rows.map(
            row => [
              row.label,
              `${row.value}%`
            ]
          )
        ]
      );
      ui.toast(
        "Данные диаграммы",
        "CSV подготовлен"
      );
      return;
    }

    if (key === "resourceDeficit") {
      downloadCsv(
        "analytics-resourceDeficit.csv",
        [
          [
            "Ресурс",
            "30 дней",
            "60 дней",
            "90 дней"
          ],
          ...resourceStabilityData.deficit.rows.map(
            row => [
              row.label,
              row.day30,
              row.day60,
              row.day90
            ]
          )
        ]
      );
      ui.toast(
        "Данные диаграммы",
        "CSV подготовлен"
      );
      return;
    }

    if (key === "transshipmentLoad") {
      downloadCsv(
        "analytics-transshipmentLoad.csv",
        [
          [
            "Узел",
            "Текущая загрузка",
            "Прогноз пика",
            "Порог"
          ],
          ...transshipmentLoadChart.rows.map(
            row => [
              row.label,
              `${row.current}%`,
              `${row.peak}%`,
              `${row.threshold ?? transshipmentLoadChart.threshold}%`
            ]
          )
        ]
      );
      ui.toast(
        "Данные диаграммы",
        "CSV подготовлен"
      );
      return;
    }

    const chartData =
      financialForecastCharts[key];

    if (!chartData) {
      return;
    }

    const rows = [
      [
        "Период",
        ...chartData.series.map(
          seriesItem => seriesItem.label
        )
      ]
    ];

    chartData.categories.forEach(
      (category, index) => {
        rows.push([
          category,
          ...chartData.series.map(
            seriesItem =>
              seriesItem.values[index]
          )
        ]);
      }
    );

    downloadCsv(
      `analytics-${key}.csv`,
      rows
    );
    ui.toast(
      "Данные диаграммы",
      "CSV подготовлен"
    );
  }


  function initFinancialForecastActions() {
    document
      .querySelectorAll(
        "[data-analytics-line-export]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => exportFinancialForecastChart(
            button.dataset.analyticsLineExport
          )
        );
      });

  }


  function syncCapacityLabelWidth() {
    const labels = Array.from(
      capacityForecast.querySelectorAll(".analytics-capacity-chart__label")
    );

    const labelWidth = labels.reduce((maxWidth, label) => {
      label.style.whiteSpace = "nowrap";
      const range = document.createRange();
      range.selectNodeContents(label);
      const textWidth = range.getBoundingClientRect().width;
      label.style.removeProperty("white-space");
      return Math.max(maxWidth, textWidth);
    }, 0);
    const plot = capacityForecast.querySelector(".analytics-capacity-chart__plot");
    const axis = capacityForecast.querySelector(".analytics-capacity-chart__axis");
    const ticks = Array.from(axis.querySelectorAll("span"));
    const styles = window.getComputedStyle(capacityForecast);
    const gap = parseFloat(styles.getPropertyValue("--space-2"));
    const labelLimit = plot.clientWidth
      - parseFloat(styles.getPropertyValue("--capacity-chart-gap"))
      - parseFloat(styles.getPropertyValue("--capacity-value-space"))
      - ticks[0].scrollWidth - ticks[ticks.length - 1].scrollWidth - gap;

    capacityForecast.style.setProperty(
      "--capacity-label-width",
      `${Math.max(0, Math.min(Math.ceil(labelWidth), plot.clientWidth / 2, labelLimit))}px`
    );

    const lastLabelLeft = axis.clientWidth - ticks[ticks.length - 1].scrollWidth;
    let previousRight = ticks[0].scrollWidth;
    ticks.forEach((tick, index) => {
      const position = axis.clientWidth * index / (ticks.length - 1);
      const visible = index === 0 || index === ticks.length - 1
        || (position - tick.scrollWidth >= previousRight + gap && position <= lastLabelLeft - gap);
      tick.style.visibility = visible ? "visible" : "hidden";
      if (visible && index > 0) previousRight = position;
    });
  }


  syncCapacityLabelWidth();
  renderResourceStability();
  renderTransshipmentLoadChart();
  renderFinancialForecastCharts();
  initFinancialForecastActions();
  window.addEventListener("resize", syncCapacityLabelWidth);
  window.addEventListener("resize", renderResourceStability);
  window.addEventListener("resize", renderTransshipmentLoadChart);
  window.addEventListener("resize", renderFinancialForecastCharts);
  document.fonts?.ready.then(syncCapacityLabelWidth);
  document.fonts?.ready.then(renderResourceStability);
  document.fonts?.ready.then(renderTransshipmentLoadChart);
  document.fonts?.ready.then(renderFinancialForecastCharts);


  document
    .getElementById(
      "accept-scenario"
    )
    .addEventListener(
      "click",
      () => {

        ui.toast(
          "Сценарий принят",
          `${selected.name}, интенсивность ${intensity}%`
        );
      }
    );


  function setInfoOpen(infoRoot, open) {
    const infoButton =
      infoRoot?.querySelector(
        "[data-analytics-info-trigger]"
      );
    const infoPopover =
      infoRoot?.querySelector(
        "[data-analytics-info-popover]"
      );


    if (!infoButton || !infoPopover) {
      return;
    }


    infoPopover.hidden = !open;
    infoButton.setAttribute(
      "aria-expanded",
      String(open)
    );
  }


  function closeInfoPopovers(exceptRoot = null) {
    document
      .querySelectorAll(
        "[data-analytics-info-root]"
      )
      .forEach(infoRoot => {
        if (infoRoot !== exceptRoot) {
          setInfoOpen(infoRoot, false);
        }
      });
  }


  document.addEventListener(
    "click",
    event => {
      const infoClose =
        event.target.closest(
          "[data-analytics-info-close]"
        );


      if (infoClose) {
        setInfoOpen(
          infoClose.closest(
            "[data-analytics-info-root]"
          ),
          false
        );
        return;
      }


      const infoButton =
        event.target.closest(
          "[data-analytics-info-trigger]"
        );


      if (infoButton) {
        const infoRoot =
          infoButton.closest(
            "[data-analytics-info-root]"
          );
        const infoPopover =
          infoRoot?.querySelector(
            "[data-analytics-info-popover]"
          );
        const shouldOpen =
          Boolean(infoPopover?.hidden);


        closeInfoPopovers(infoRoot);
        setInfoOpen(infoRoot, shouldOpen);
        return;
      }


      if (
        event.target.closest(
          "[data-analytics-info-root]"
        )
      ) {
        return;
      }


      closeInfoPopovers();
    }
  );


  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeInfoPopovers();
      }
    }
  );


  renderEvidence();

  updateScenarioSortControls();

  render();

})();
