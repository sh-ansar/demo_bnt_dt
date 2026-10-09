(function () {
  const ui = window.BNTUI;
  const assets = window.BNT_DATA.assets;
  const requested = new URLSearchParams(location.search).get("id") || "pump101";
  let asset = assets.find(item => item.id.toLowerCase() === requested.toLowerCase() || item.code.toLowerCase() === requested.toLowerCase());
  if (!asset && /^r-?\d+/i.test(requested)) {
    asset = {...assets.find(item => item.id === "tankp3"), id: requested, code: requested.toUpperCase(), name: `Резервуар ${requested.toUpperCase()}`, internal: `TNK-${requested.replace(/\D/g, "").padStart(5, "0")}`};
  }
  asset ||= assets[0];
  const tone = asset.status === "Онлайн" ? "purple" : asset.tone === "red" ? "red" : asset.tone === "orange" ? "orange" : "green";
  const escape = value => ui.escape(value);
  const href = value => window.BNTShell.routeHref(value);

  function info(title, description) {
    return `<button class="sign_BTN_smallest" type="button" data-drawer-info="${escape(description)}" data-drawer-info-title="${escape(title)}" aria-label="О блоке: ${escape(title)}" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=14#Info"></use></svg></button>`;
  }

  function heading(id, title, description = "", actions = "", size = "small") {
    return `<header class="page-title-actions">
      <div class="page-title-actions__heading analytics-block-heading">
        <div class="page-title-actions__title-row">
          <h3 id="${id}" class="typography-caption-${size}">${escape(title)}</h3>
          ${description ? info(title, description) : ""}
        </div>
      </div>
      ${actions ? `<div class="page-title-actions__buttons">${actions}</div>` : ""}
    </header>`;
  }

  function progress(label, value, progressTone = "brand") {
    return `<div class="payment-summary-card payment-summary-card--${progressTone} payment-summary-card__content">
      ${ui.progressRing({label, percent: value, display: `${value}%`})}
      <p class="payment-summary-card__description typography-body-smallest">${escape(label)}</p>
    </div>`;
  }

  function metric(label, value, description) {
    return `<article class="analytics-kpi">
      <header class="analytics-kpi__heading"><h4 class="analytics-kpi__label typography-body-smallest">${escape(label)}</h4></header>
      <div class="kpi-card__body">
        <strong class="payment-summary-card__amount payment-summary-card__amount--multiline typography-label-base">${escape(value)}</strong>
        <p class="analytics-kpi__context typography-body-smallest">${escape(description)}</p>
      </div>
    </article>`;
  }

  const passport = [
    ["Внутренний номер", asset.internal], ["Модель", asset.model],
    ["Серийный номер", asset.serial], ["Год ввода", asset.year], ["Наработка", asset.runtime]
  ];
  const metrics = [
    ["Следующее ТО", asset.nextService, "По регламенту"],
    ["Накопленные ремонты", asset.cost, "За 12 месяцев"],
    ["Прогноз ремонта", asset.predictive, "Предиктивная модель"],
    ["Вероятность отказа", `${Math.max(8, asset.wear - 40)}%`, asset.wear > 70 ? "Повышенный риск" : "Низкий риск"]
  ];
  const linkedNodes = asset.nodes.map(([name, status]) => `<tr>
    <td><div class="table-cell-content"><strong>${escape(name)}</strong></div></td>
    <td>${ui.badge(status, status === "Работает" ? "green" : status === "Норма" ? "neutral" : "default")}</td>
  </tr>`).join("") || ui.renderEmptyTableRow(2, "Нет связанных узлов");
  const repairs = asset.repairs.map(row => `<tr>
    <td class="data-table__date-cell">${escape(row[0])}</td>
    <td>${ui.badge(row[1], row[1] === "Аварийный" ? "red" : "green")}</td>
    <td><div class="table-cell-content"><strong>${escape(row[2])}</strong></div></td>
    <td class="data-table__numeric-cell"><div class="table-cell-content table-cell-content--numeric"><strong>${escape(row[3])}</strong></div></td>
    <td>${escape(row[4])}</td>
  </tr>`).join("") || ui.renderEmptyTableRow(5, "Нет истории ремонтов");

  const steps = [
    {title: "Диагностика и ремонт", description: asset.recommendation, action: "Создать задачу", href: `/toir?action=work-order&asset=${encodeURIComponent(asset.name)}`, tone: tone === "red" ? "error" : tone === "orange" ? "warning" : "info"},
    {title: "Ремонтное окно", description: `Прогноз ремонта: ${asset.predictive}. Следующее ТО: ${asset.nextService}.`, action: "Оценить сценарий", href: "/analytics", tone: "info"},
    {title: "Готовность ЗИП", description: "Проверить наличие запасных частей для выполнения рекомендации.", action: "Проверить ЗИП", href: "/procurement", tone: "info"}
  ];

  document.title = `BNT — ${asset.name}`;
  window.BNTShell.setBreadcrumbs([{label: "Активы", href: "/equipment"}, {label: asset.category}, {label: asset.code}]);
  document.getElementById("equipment-detail").innerHTML = `
    <header class="page-title-actions page-actions analytics-page-actions">
      <div class="page-title-actions__heading analytics-page-actions__heading analytics-block-heading">
        <span class="analytics-eyebrow typography-label-smallest">${escape(asset.location)} · ${escape(asset.model)}</span>
        <div class="page-title-actions__title-row analytics-title-row"><h2 class="typography-h4">${escape(asset.name)}</h2><button class="sign_BTN_smallest" type="button" data-drawer-info="Износ рассчитан по фактической наработке и режимам нагрузки" data-drawer-info-title="Износ оборудования" aria-label="Как рассчитан износ" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=14#Info"></use></svg></button></div>
      </div>
      <div class="page-title-actions__buttons">
        <a class="button-small button-small--secondary typography-button-small" href="${href(`/digital-twin?object=${encodeURIComponent(asset.id)}`)}"><span>Открыть в 3D</span></a>
        <a class="button-small button-small--primary typography-button-small" href="${href(`/toir?action=repair&asset=${encodeURIComponent(asset.name)}`)}"><span>Создать заявку</span></a>
      </div>
    </header>
    <div class="grid-4 equipment-detail-metrics" aria-label="Показатели оборудования">${metrics.map(row => metric(...row)).join("")}</div>
    <article class="card-with-image card-with-image--horizontal equipment-detail-overview" aria-label="${escape(asset.name)}">
      <div class="card-with-image__visual">
        <span class="card-with-image__media" data-equipment-photo><img src="${escape(asset.image)}" alt="${escape(asset.name)}"></span>
        ${ui.badge(asset.status, tone)}
        <div id="equipment-video" class="card-with-image__video" role="status" aria-live="polite" hidden>${ui.renderEmptyState("Видеопоток не подключён", {size: "smallest"})}</div>
      </div>
      <div class="card-h__body">
        ${ui.renderToggle({label: "Включить видео", tone: "positive", attributes: {"data-equipment-video-toggle": true, "aria-controls": "equipment-video"}})}
        <div class="card-with-image__heading">
          <span class="card-with-image__eyebrow typography-indicator-small">${escape(asset.category)}</span>
          <h3 class="card-with-image__title typography-caption-smallest">${escape(asset.model)}</h3>
        </div>
        <div class="dt3-metrics scenario-impact scenario-impact--progress" aria-label="Состояние оборудования">
          ${progress("Износ по нагрузке", asset.wear, asset.wear > 70 ? "error" : "brand")}
          ${progress("Текущая загрузка", asset.load)}
        </div>
        ${ui.renderCanvasAlertList([
          {title: "Местоположение", value: asset.location, icon: "location", href: href(`/digital-twin?object=${encodeURIComponent(asset.id)}`)},
          {title: "Поставщик", value: "TAKISH ENGINEERING", image: "/assets/takish-engineering.webp", href: "https://takish.kz/about_us"}
        ], {label: "Местоположение и поставщик оборудования"})}
      </div>
      <div class="card-h__body card-with-image__aside" data-table-height-group="smallest">
        <section class="div-block div-block--compact" aria-labelledby="equipment-passport-title">
          ${heading("equipment-passport-title", "Паспорт", "", "", "smallest")}
          <div class="table-block"><div class="table-wrap"><table class="data-table" aria-labelledby="equipment-passport-title"><tbody>
            ${passport.map(([label, value]) => `<tr><td>${escape(label)}</td><td${typeof value === "number" ? ' class="data-table__numeric-cell"' : ""}>${escape(value)}</td></tr>`).join("")}
          </tbody></table></div></div>
        </section>
        <section class="div-block div-block--compact" aria-labelledby="equipment-nodes-title">
          ${heading("equipment-nodes-title", "Связанные узлы", "", "", "smallest")}
          <div class="table-block"><div class="table-wrap"><table class="data-table" aria-labelledby="equipment-nodes-title"><tbody>${linkedNodes}</tbody></table></div></div>
        </section>
      </div>
    </article>
    <article class="chart-card chart-card--wide payment-risk-map risk-map-left" aria-labelledby="equipment-prediction-title">
      ${heading("equipment-prediction-title", "Предиктивная рекомендация", "С учетом поступлений, ремонтного окна и наличия ЗИП", `<button class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" type="button" data-equipment-risk-export aria-label="Скачать рекомендации и историю ремонтов" title="Скачать рекомендации и историю ремонтов"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Download"></use></svg></button>
        <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-chart-filter data-chart-filter-variant="static-date" data-chart-filter-title="История ремонтов" aria-expanded="false" aria-controls="chart-filter-modal"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Filter"></use></svg><span>Фильтр</span></button>`)}
      <div class="payment-risk-map__layout">
        <div class="payment-risk-map__risk-column">
          <div class="payment-risk-map__scroller ui-scrollbar" tabindex="0" aria-label="Рекомендуемые действия по оборудованию">
            <ol class="payment-risk-list">
              ${steps.map((step, index) => `<li class="payment-risk-item payment-risk-item--${step.tone}">
                <span class="payment-risk-item__marker typography-indicator-small" aria-hidden="true">${index + 1}</span>
                <div class="payment-risk-item__content table-cell-content table-cell-content--with-pill">
                  <div class="payment-risk-item__header table-header-content">
                    <h4 class="payment-risk-item__title typography-label-smallest">${escape(step.title)}</h4>
                    <p class="payment-risk-item__description typography-body-smallest">${escape(step.description)}</p>
                  </div>
                  <a class="pill pill--default pill--round payment-risk-item__action typography-body-smallest" href="${escape(href(step.href))}"><span class="pill__title">${escape(step.action)}</span><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#ArrowUpRight"></use></svg></a>
                </div>
              </li>`).join("")}
            </ol>
          </div>
        </div>
        <section class="payment-risk-map__opposite payment-risk-map__table-panel div-block div-block--compact" aria-labelledby="equipment-history-title">
          <header class="payment-risk-map__table-head">
            <div class="page-title-actions__heading analytics-block-heading">
              <div class="page-title-actions__title-row">
                <h4 id="equipment-history-title" class="payment-risk-map__panel-title typography-caption-small">История ремонтов</h4>
                ${info("История ремонтов", "Фактические затраты и исполнители")}
              </div>
            </div>
          </header>
          <div class="table-block payment-risk-map__table-block"><div class="table-wrap"><table class="data-table" aria-labelledby="equipment-history-title">
            <thead><tr>${["Дата", "Тип", "Описание", "Стоимость", "Исполнитель"].map(label => `<th scope="col"><span class="data-table__column-heading"><span>${label}</span></span></th>`).join("")}</tr></thead>
            <tbody>${repairs}</tbody>
          </table></div></div>
        </section>
      </div>
    </article>`;

  const videoToggle = document.querySelector("[data-equipment-video-toggle]");
  const videoPanel = document.getElementById("equipment-video");
  const photo = document.querySelector("[data-equipment-photo]");
  videoToggle.addEventListener("click", () => {
    const enabled = videoToggle.getAttribute("aria-pressed") !== "true";
    videoToggle.setAttribute("aria-pressed", String(enabled));
    videoPanel.hidden = !enabled;
    photo.hidden = enabled;
  });

  document.querySelector("[data-equipment-risk-export]").addEventListener("click", () => {
    ui.downloadCsv(`BNT_equipment-${asset.id}-risk.csv`, [
      ["Оборудование", asset.name],
      ["Шаг", "Рекомендация", "Действие"],
      ...steps.map(step => [step.title, step.description, step.action]),
      [],
      ["Дата", "Тип", "Описание", "Стоимость", "Исполнитель"],
      ...asset.repairs
    ]);
    ui.toast("Экспорт", "Рекомендации и история ремонтов скачаны в CSV");
  });
})();

