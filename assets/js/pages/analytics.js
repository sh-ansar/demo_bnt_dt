(function () {

  const data =
    window.BNT_DATA.scenarios;

  const ui =
    window.BNTUI;


  let selected =
    data.items[0];


  let intensity =
    100;


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
        item => `

          <article
            class="
              analytics-evidence-item
              ${item.tone || ""}
            "
          >

            <span>
              ${item.label}
            </span>

            <strong>
              ${item.value}
            </strong>

            <small>
              ${item.note}
            </small>

          </article>

        `
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

        [
          "Риск простоя",
          `${risk}%`,
          risk > 18
            ? "delta-down"
            : ""
        ],

        [
          "Бюджет ТОиР",
          `$${budget} тыс.`,
          budget < base.budget
            ? "delta-up"
            : ""
        ],

        [
          "Доступность",
          `${availability}%`,
          availability >= 92
            ? "delta-up"
            : ""
        ],

        [
          "Свободная емкость",
          `${capacity}%`,
          capacity < 22
            ? "delta-down"
            : ""
        ]

      ]
      .map(
        k => `

          <article class="card kpi">

            <span class="label">
              ${k[0]}
            </span>

            <strong class="${k[2]}">
              ${k[1]}
            </strong>

            <small>
              ${selected.name}
            </small>

          </article>
        `
      )
      .join("");


    document
      .getElementById(
        "scenario-rows"
      )
      .innerHTML =
      data.items.map(
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

              <strong>
                ${scenario.name}
              </strong>

              <small>
                ${scenario.subtitle}
              </small>

              ${sourceBadge(scenario)}

            </td>


            <td>

              ${
                ui.badge(
                  `${scenario.risk}%`,
                  scenario.risk > 20
                    ? "red"
                    : scenario.risk > 10
                      ? "orange"
                      : "green"
                )
              }

            </td>


            <td>
              $${scenario.budget} тыс.
            </td>


            <td>
              ${scenario.availability}%
            </td>


            <td>
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

          <h3>
            ${selected.name}
          </h3>

          <p>
            ${selected.description}
          </p>

          ${sourceBadge(selected)}

        </div>


        <div class="range-line">

          <label>

            <span>
              Интенсивность сценария
            </span>

            <b>
              ${intensity}%
            </b>

          </label>


          <input
            id="scenario-intensity"
            type="range"
            min="0"
            max="140"
            step="10"
            value="${intensity}"
          >

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


        <h4>
          Рекомендуемые действия
        </h4>


        <ol
          style="
            padding-left:18px;
            color:var(--ink-2);
            font-size:9px;
            line-height:17px
          "
        >

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

          <i>
            ${index + 1}
          </i>

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
      row => `

        <div class="timeline-row">

          <strong>
            ${row[0]}
          </strong>

          <span>
            ${row[1]}
          </span>

        </div>
      `
    )
    .join("");


  document
    .getElementById(
      "capacity-forecast"
    )
    .innerHTML = `

      <div
        class="bar-list"
        style="padding:0"
      >

        ${
          [
            [
              "Базовая доступность",
              92,
              "92%"
            ],

            [
              "Плановый ремонт",
              95,
              "95%"
            ],

            [
              "Ускоренный ЗИП",
              96,
              "96%"
            ],

            [
              "Стресс +12%",
              87,
              "87%"
            ]
          ]
          .map(
            row => `

              <div class="bar-row">

                <span>
                  ${row[0]}
                </span>

                ${
                  ui.progress(
                    row[1],
                    row[1] < 90
                      ? "red"
                      : ""
                  )
                }

                <b>
                  ${row[2]}
                </b>

              </div>
            `
          )
          .join("")
        }

      </div>


      <p
        style="
          color:var(--muted);
          font-size:9px;
          line-height:15px
        "
      >
        Модель позволяет сравнивать влияние
        ремонтных решений, обеспеченности ЗИП
        и изменения эксплуатационной нагрузки.
      </p>
    `;


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


  renderEvidence();

  render();

})();
