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


  function sourceBadge(
    scenario
  ) {

    return `

      <span
        class="
          scenario-source
          ${scenario.source}
        "
      >
        ${scenario.sourceLabel}
      </span>
    `;
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
        k => analyticsKpiCard({
          label: k.label,
          value: k.value,
          tone: k.tone,
          contextHtml: `
            <p class="analytics-kpi__context typography-body-smallest">
              ${selected.name}
            </p>
          `,
          actionHtml: `
            <span class="analytics-kpi__info-wrap">
              <button class="analytics-kpi__info" type="button" data-analytics-kpi-info="${k.key}" aria-label="Информация: ${k.label}">
                <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Info"></use></svg>
              </button>
            </span>
          `
        })
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
              scenario-row
              ${
                scenario.id ===
                selected.id
                  ? "active"
                  : ""
              }
            "
            data-scenario="${scenario.id}"
          >

            <td>
              <div class="table-cell-content">
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


            <td>
              <span class="analytics-table__risk-value ${riskTone(scenario.risk)}">
                ${scenario.risk}%
              </span>
            </td>


            <td class="analytics-table__numeric-cell analytics-table__budget-cell">
              <div class="table-header-content table-header-content--numeric">
                <strong>
                  ${financialNumberFormat.format(scenario.budget * 1000)}
                </strong>
                <small>USD</small>
              </div>
            </td>


            <td>
              ${scenario.availability}%
            </td>


            <td class="analytics-table__numeric-cell analytics-table__repairs-cell">
              ${scenario.repairs}
            </td>


            <td>
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
                <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Info"></use></svg>
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
    .getElementById(
      "analytics-kpis"
    )
    .addEventListener(
      "click",
      event => {
        const button = event.target.closest("[data-analytics-kpi-info]");
        if (!button) return;
        const info = kpiInfo[button.dataset.analyticsKpiInfo];
        if (info) ui.toast(info.title, info.text);
      }
    );


  document
    .querySelector(
      ".analytics-table thead"
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
                    <path d="M2.5 5.20832L4.16667 7.08332L7.5 2.91666" stroke="#E6EFF4" stroke-width="0.8" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
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

  capacityForecast.innerHTML = `

      <div class="analytics-capacity-chart__plot">

        <div class="analytics-capacity-chart__axis" aria-hidden="true">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>


        <div class="analytics-capacity-chart__body">

          <div class="analytics-capacity-chart__grid" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
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

                    <span class="analytics-capacity-chart__track" style="--capacity-value:${row[1]}%" aria-hidden="true">
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


      <div class="analytics-capacity-chart__legend" aria-label="Легенда графика">
        <span><i class="analytics-capacity-chart__legend-dot analytics-capacity-chart__legend-dot--primary"></i>Базовый</span>
        <span><i class="analytics-capacity-chart__legend-dot analytics-capacity-chart__legend-dot--positive"></i>Улучшение</span>
        <span><i class="analytics-capacity-chart__legend-dot analytics-capacity-chart__legend-dot--negative"></i>Негативный сценарий</span>
      </div>
    `;


  function syncCapacityLabelWidth() {
    const labels = Array.from(
      capacityForecast.querySelectorAll(".analytics-capacity-chart__label")
    );

    const labelWidth = labels.reduce(
      (maxWidth, label) => Math.max(maxWidth, label.scrollWidth),
      0
    );

    capacityForecast.style.setProperty(
      "--capacity-label-width",
      `${Math.ceil(labelWidth)}px`
    );
  }


  syncCapacityLabelWidth();
  window.addEventListener("resize", syncCapacityLabelWidth);
  document.fonts?.ready.then(syncCapacityLabelWidth);


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
