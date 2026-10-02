(function initTransshipmentAnalytics() {
  const root = document.querySelector('[data-transshipment-analytics]');
  if (!root) return;

  const chartHost = root.querySelector('[data-transshipment-charts]') || root;
  chartHost.innerHTML = `

      <article class="chart-card chart-card--wide" aria-labelledby="transshipment-volume-title">
        <header class="chart-card__header">
          <div class="chart-card__heading">
            <div class="chart-card__title-row">
              <h3 id="transshipment-volume-title" class="typography-caption-small">Объем перевалки по периодам</h3>
              <button class="sign_BTN_smallest info-icon-button" type="button" data-transshipment-info="volume" aria-label="Информация об объеме перевалки">
                <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=10#Info"></use></svg>
              </button>
            </div>
            <div class="chart-card__filters">
              <span class="filter-summary__count filter-summary__count_static pill pill--default pill--radius typography-body-smallest"><span class="filter-summary__count-title" data-transshipment-period-label>с 01.01.2020 до 31.12.2025</span><button class="filter-summary__count-chevron" type="button" aria-label="Убрать период"><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button></span>
              <span class="filter-summary__count filter-summary__count_static pill pill--default pill--radius typography-body-smallest"><span class="filter-summary__count-title">Ед. изм. МТ</span><button class="filter-summary__count-chevron" type="button" aria-label="Убрать единицу измерения"><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button></span>
            </div>
          </div>
          <div class="chart-actions">
            <button class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" type="button" data-transshipment-export="volume" aria-label="Скачать данные об объеме перевалки"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Download"></use></svg></button>
            <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-chart-filter data-chart-filter-variant="static-date" aria-expanded="false" aria-controls="chart-filter-modal"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Filter"></use></svg><span>Фильтр</span></button>
          </div>
        </header>
        <div class="chart-tabs" role="tablist" aria-label="Операция перевалки">
          <button class="typography-label-small is-active" type="button" role="tab" aria-selected="true" data-transshipment-tab="shipment">Отгрузка</button>
          <button class="typography-label-small" type="button" role="tab" aria-selected="false" data-transshipment-tab="receipt">Приёмка</button>
          <button class="typography-label-small" type="button" role="tab" aria-selected="false" data-transshipment-tab="storage">Хранение</button>
        </div>
        <div class="chart-viewport chart-scrollbar" data-transshipment-chart-viewport>
          <svg class="chart-bars" data-transshipment-cylinder viewBox="0 0 1440 420" role="img" aria-label="Объем перевалки по периодам"></svg>
          <div class="chart-tooltip typography-body-smallest" data-chart-tooltip data-transshipment-chart-tooltip role="tooltip" hidden>
            <strong class="chart-tooltip__title typography-caption-small" data-tooltip-title></strong>
            <div><span>Период</span><strong data-tooltip-period></strong></div>
            <div><span>Кол-во</span><strong data-tooltip-value></strong></div>
          </div>
        </div>
        <div class="chart-legend typography-body-smallest" data-transshipment-cylinder-legend aria-label="Легенда диаграммы">
          <span class="chart-legend__item" data-transshipment-series="0" role="button" tabindex="0"><i class="chart-legend__dot series-crude"></i>Crude Oil</span>
          <span class="chart-legend__item" data-transshipment-series="2" role="button" tabindex="0"><i class="chart-legend__dot series-dark"></i>Dark</span>
          <span class="chart-legend__item" data-transshipment-series="3" role="button" tabindex="0"><i class="chart-legend__dot series-gas"></i>Gas</span>
          <span class="chart-legend__item" data-transshipment-series="1" role="button" tabindex="0"><i class="chart-legend__dot series-light"></i>Light</span>
        </div>
      </article>

      <div class="chart-grid--two-column">
        <article class="chart-card" aria-labelledby="transshipment-product-title">
          <header class="chart-card__header">
            <div class="chart-card__heading">
              <div class="chart-card__title-row">
                <h3 id="transshipment-product-title" class="typography-caption-small">Объем перевалки по периодам</h3>
                <button class="sign_BTN_smallest info-icon-button" type="button" data-transshipment-info="products" aria-label="Информация о продуктах"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=10#Info"></use></svg></button>
              </div>
              <div class="chart-card__filters">
                <span class="filter-summary__count filter-summary__count_static pill pill--default pill--radius typography-body-smallest"><span class="filter-summary__count-title">с 01.09 по 30.09.2025</span><button class="filter-summary__count-chevron" type="button" aria-label="Убрать период"><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button></span>
                <span class="filter-summary__count filter-summary__count_static pill pill--default pill--radius typography-body-smallest"><span class="filter-summary__count-title">Ед. изм. МТ</span><button class="filter-summary__count-chevron" type="button" aria-label="Убрать единицу измерения"><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button></span>
              </div>
            </div>
            <div class="chart-actions">
              <button class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" type="button" data-transshipment-export="products" aria-label="Скачать данные по продуктам"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Download"></use></svg></button>
              <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-chart-filter data-chart-filter-variant="static-date" aria-expanded="false" aria-controls="chart-filter-modal"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Filter"></use></svg><span>Фильтр</span></button>
            </div>
          </header>
          <div class="chart-tabs" role="tablist" aria-label="Операция по продуктам">
            <button class="typography-label-small is-active" type="button" role="tab" aria-selected="true" data-product-tab="shipment">Отгрузка</button>
            <button class="typography-label-small" type="button" role="tab" aria-selected="false" data-product-tab="receipt">Приёмка</button>
            <button class="typography-label-small" type="button" role="tab" aria-selected="false" data-product-tab="storage">Хранение</button>
          </div>
          <div class="chart-donut__viewport"><svg class="chart-donut" data-transshipment-donut viewBox="0 0 640 390" role="img" aria-label="Распределение объема перевалки по нефтепродуктам"></svg></div>
          <div class="chart-legend chart-legend--wrap typography-body-smallest" data-product-legend aria-label="Легенда нефтепродуктов"></div>
        </article>

        <article class="chart-card chart-card--origin" aria-labelledby="transshipment-origin-title">
          <header class="chart-card__header">
            <div class="chart-card__heading">
              <div class="chart-card__title-row">
                <h3 id="transshipment-origin-title" class="typography-caption-small">Происхождение нефтепродукта</h3>
                <div class="origin-title-info">
                  <button class="sign_BTN_smallest info-icon-button" type="button" data-transshipment-info="origin" aria-expanded="false" aria-controls="origin-title-info" aria-label="Информация о происхождении нефтепродукта"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=10#Info"></use></svg></button>
                  <div id="origin-title-info" class="origin-breakdown__info-popover" data-origin-info-popover role="dialog" aria-label="Информация о диаграмме" hidden>
                    <button class="origin-breakdown__info-close" type="button" data-origin-info-close aria-label="Закрыть информацию"><svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button>
                    <p class="typography-body-smallest">«Все» показывает долю стран. «По типам», «По сортам» и «По кодам FPN» показывают состав внутри выбранной страны. Разбивка демонстрационная.</p>
                  </div>
                </div>
              </div>
              <div class="chart-card__filters">
                <span class="filter-summary__count filter-summary__count_static pill pill--default pill--radius typography-body-smallest"><span class="filter-summary__count-title">за 2025 год</span><button class="filter-summary__count-chevron" type="button" aria-label="Убрать год"><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button></span>
                <span class="filter-summary__count filter-summary__count_static pill pill--default pill--radius typography-body-smallest"><span class="filter-summary__count-title">Ед. изм. МТ</span><button class="filter-summary__count-chevron" type="button" aria-label="Убрать единицу измерения"><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button></span>
              </div>
            </div>
            <div class="chart-actions">
              <button class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" type="button" data-transshipment-export="origin" aria-label="Скачать данные о происхождении"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Download"></use></svg></button>
              <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-chart-filter data-chart-filter-variant="static-date" aria-expanded="false" aria-controls="chart-filter-modal"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Filter"></use></svg><span>Фильтр</span></button>
            </div>
          </header>
          <div class="chart-tabs chart-tabs--four" role="tablist" aria-label="Группировка происхождения">
            <button id="origin-tab-all" class="typography-label-small is-active" type="button" role="tab" aria-selected="true" aria-controls="origin-chart-panel" data-origin-tab="all">Все</button>
            <button id="origin-tab-type" class="typography-label-small" type="button" role="tab" aria-selected="false" aria-controls="origin-chart-panel" tabindex="-1" data-origin-tab="type">По типам</button>
            <button id="origin-tab-grade" class="typography-label-small" type="button" role="tab" aria-selected="false" aria-controls="origin-chart-panel" tabindex="-1" data-origin-tab="grade">По сортам</button>
            <button id="origin-tab-fpn" class="typography-label-small" type="button" role="tab" aria-selected="false" aria-controls="origin-chart-panel" tabindex="-1" data-origin-tab="fpn">По кодам FPN</button>
          </div>
          <div id="origin-chart-panel" class="origin-chart-panel" role="tabpanel" aria-labelledby="origin-tab-all" data-origin-panel>
            <div class="chart-donut__viewport" data-origin-pie-viewport><svg class="chart-donut" data-transshipment-pie viewBox="0 0 640 390" role="img" aria-label="Распределение нефтепродуктов по происхождению"></svg></div>
            <div class="chart-legend chart-legend--wrap typography-body-smallest" data-origin-legend aria-label="Легенда происхождения"></div>
            <div class="origin-breakdown" data-origin-breakdown hidden>
              <div class="origin-breakdown__plot">
                <div class="origin-breakdown__grid" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
                <div class="origin-breakdown__scale" aria-hidden="true"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
                <div class="origin-breakdown__rows" data-origin-rows></div>
              </div>
              <div class="origin-breakdown__details" data-origin-details aria-live="polite"></div>
              <div class="origin-breakdown__tooltip" data-origin-tooltip role="tooltip" hidden><strong data-origin-tooltip-title></strong><span data-origin-tooltip-value></span></div>
            </div>
          </div>
        </article>
      </div>
  `;

  const cylinderChart = root.querySelector('[data-transshipment-cylinder]');
  const cylinderViewport = root.querySelector('[data-transshipment-chart-viewport]');
  const cylinderTooltip = root.querySelector('[data-transshipment-chart-tooltip], [data-chart-tooltip]');
  const cylinderLegend = root.querySelector('[data-transshipment-cylinder-legend]');
  const donutChart = root.querySelector('[data-transshipment-donut]');
  const pieChart = root.querySelector('[data-transshipment-pie]');
  const productLegend = root.querySelector('[data-product-legend]');
  const originLegend = root.querySelector('[data-origin-legend]');
  const originPanel = root.querySelector('[data-origin-panel]');
  const originCard = originPanel.closest('.chart-card');
  const originPieViewport = root.querySelector('[data-origin-pie-viewport]');
  const originBreakdown = root.querySelector('[data-origin-breakdown]');
  const originPlot = root.querySelector('.origin-breakdown__plot');
  const originRows = root.querySelector('[data-origin-rows]');
  const originDetails = root.querySelector('[data-origin-details]');
  const originTooltip = root.querySelector('[data-origin-tooltip]');
  const originInfoTrigger = root.querySelector('[data-transshipment-info="origin"]');
  const originInfoPopover = root.querySelector('[data-origin-info-popover]');
  const originInfoClose = root.querySelector('[data-origin-info-close]');
  const numberFormat = new Intl.NumberFormat('ru-RU');
  const percentFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
  const series = [
    { label: 'Crude Oil', className: 'series-crude' },
    { label: 'Light', className: 'series-light' },
    { label: 'Dark', className: 'series-dark' },
    { label: 'Gas', className: 'series-gas' }
  ];
  const cylinderDatasets = {
    shipment: [
      { label: '2020', values: [55, 290, 105, 640] },
      { label: '2021', values: [82, 360, 105, 795] },
      { label: '2022', values: [76, 330, 120, 510] },
      { label: '2023', values: [84, 720, 190, 540] },
      { label: '2024', values: [70, 655, 165, 535] },
      { label: '2025', values: [66, 480, 142, 420] }
    ],
    receipt: [
      { label: '2020', values: [48, 250, 92, 590] },
      { label: '2021', values: [75, 325, 115, 720] },
      { label: '2022', values: [68, 295, 108, 455] },
      { label: '2023', values: [76, 665, 176, 505] },
      { label: '2024', values: [65, 610, 154, 490] },
      { label: '2025', values: [58, 435, 128, 385] }
    ],
    storage: [
      { label: '2020', values: [70, 310, 125, 710] },
      { label: '2021', values: [92, 405, 135, 850] },
      { label: '2022', values: [88, 365, 145, 575] },
      { label: '2023', values: [98, 790, 220, 575] },
      { label: '2024', values: [82, 725, 195, 570] },
      { label: '2025', values: [75, 540, 165, 460] }
    ]
  };
  const productDatasets = {
    shipment: [
      { label: 'Crude Oil', value: 553, percent: '7,63%', className: 'series-soft-blue' },
      { label: 'Kerosene', value: 111, percent: '0,01%', className: 'series-dark' },
      { label: 'Gas', value: 760, percent: '10,48%', className: 'series-orange' },
      { label: 'Fuel Oil', value: 3053, percent: '42,10%', className: 'series-light' },
      { label: 'Gasoil', value: 1260, percent: '17,38%', className: 'series-gas' },
      { label: 'Vacuum Gasoil', value: 144, percent: '1,99%', className: 'series-deep-blue' },
      { label: 'Gasoline', value: 1480, percent: '20,41%', className: 'series-crude' }
    ],
    receipt: [
      { label: 'Crude Oil', value: 690, percent: '9,65%', className: 'series-soft-blue' },
      { label: 'Kerosene', value: 95, percent: '1,33%', className: 'series-dark' },
      { label: 'Gas', value: 625, percent: '8,74%', className: 'series-orange' },
      { label: 'Fuel Oil', value: 2780, percent: '38,89%', className: 'series-light' },
      { label: 'Gasoil', value: 1390, percent: '19,45%', className: 'series-gas' },
      { label: 'Vacuum Gasoil', value: 168, percent: '2,35%', className: 'series-deep-blue' },
      { label: 'Gasoline', value: 1400, percent: '19,59%', className: 'series-crude' }
    ],
    storage: [
      { label: 'Crude Oil', value: 735, percent: '9,40%', className: 'series-soft-blue' },
      { label: 'Kerosene', value: 128, percent: '1,64%', className: 'series-dark' },
      { label: 'Gas', value: 845, percent: '10,81%', className: 'series-orange' },
      { label: 'Fuel Oil', value: 3150, percent: '40,28%', className: 'series-light' },
      { label: 'Gasoil', value: 1255, percent: '16,05%', className: 'series-gas' },
      { label: 'Vacuum Gasoil', value: 187, percent: '2,39%', className: 'series-deep-blue' },
      { label: 'Gasoline', value: 1520, percent: '19,44%', className: 'series-crude' }
    ]
  };
  const originData = [
    { label: 'Azerbaijan', value: 304788, percent: '44%', className: 'series-crude' },
    { label: 'Kazakhstan', value: 256299, percent: '37%', className: 'series-secondary' },
    { label: 'Russia', value: 124686, percent: '18%', className: 'series-orange' },
    { label: 'Turkmenistan', value: 6927, percent: '1%', className: 'series-light' }
  ];
  // Demo product rows preserve each country's total shown on the "Все" tab.
  const originComposition = [
    { key: 'azerbaijan', values: [140300, 35120, 49480, 31920, 37760, 10208] },
    { key: 'kazakhstan', values: [56000, 34500, 55240, 62560, 38410, 9589] },
    { key: 'russia', values: [4100, 7500, 36680, 28320, 40960, 7126] },
    { key: 'turkmenistan', values: [0, 0, 1040, 2210, 2390, 1287] }
  ];
  const originDimensions = {
    type: {
      title: 'Состав по типам',
      categories: ['Нефть', 'Светлые', 'Тёмные', 'Газ'],
      productGroups: [0, 0, 1, 1, 2, 3]
    },
    grade: {
      title: 'Состав по сортам',
      categories: ['Нефть Light', 'Нефть Medium', 'Бензин АИ-95', 'ДТ Евро-5', 'Мазут М-100', 'СУГ'],
      productGroups: [0, 1, 2, 3, 4, 5]
    },
    fpn: {
      title: 'Состав по кодам FPN',
      categories: ['FPN-101', 'FPN-201', 'FPN-203', 'FPN-301', 'FPN-401'],
      productGroups: [0, 0, 1, 2, 3, 4]
    }
  };
  let activeOriginTab = 'all';
  let selectedOriginCountry = 0;
  let activeCylinderDataset = 'shipment';
  let activeProductDataset = 'shipment';
  let selectedCylinderSeries = null;
  const cylinderDrill = {
    level: 'year',
    yearIndex: null,
    quarterIndex: null
  };
  let cylinderWheelLocked = false;

  const quarterLabels = ['1 кв', '2 кв', '3 кв', '4 кв'];
  const quarterWeights = [.21, .24, .26, .29];
  const monthLabels = [
    ['январь', 'февраль', 'март'],
    ['апрель', 'май', 'июнь'],
    ['июль', 'август', 'сентябрь'],
    ['октябрь', 'ноябрь', 'декабрь']
  ];
  const monthWeights = [.31, .34, .35];

  function escapeXml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  function toast(title, message) {
    if (window.BNTUI && typeof window.BNTUI.toast === 'function') {
      window.BNTUI.toast(title, message);
    }
  }

  function distributeCylinderCategory(source, labels, weights, periodLabel) {
    const allocated = source.values.map(function () { return 0; });
    return labels.map(function (label, categoryIndex) {
      const values = source.values.map(function (total, seriesIndex) {
        const value = categoryIndex === labels.length - 1
          ? total - allocated[seriesIndex]
          : Math.round(total * weights[categoryIndex]);
        allocated[seriesIndex] += value;
        return value;
      });
      return {
        label,
        period: periodLabel(label),
        values
      };
    });
  }

  function resetCylinderDrill() {
    cylinderDrill.level = 'year';
    cylinderDrill.yearIndex = null;
    cylinderDrill.quarterIndex = null;
  }

  function getCylinderAxisMax(data) {
    const largestTotal = Math.max.apply(null, data.map(function (category) {
      return category.values.reduce(function (sum, value) { return sum + value; }, 0);
    }));
    const rawStep = Math.max(1, largestTotal / 6);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const niceStep = [1, 2, 2.5, 5, 10].find(function (step) { return step >= normalized; }) || 10;
    return Math.ceil(niceStep * magnitude) * 6;
  }

  function getCylinderView(datasetKey) {
    const annualData = cylinderDatasets[datasetKey] || cylinderDatasets.shipment;
    if (cylinderDrill.level === 'year' || cylinderDrill.yearIndex === null) {
      return {
        data: annualData.map(function (category, yearIndex) {
          return {
            label: category.label,
            period: category.label,
            values: category.values,
            kind: 'year',
            yearIndex,
            weight: 1
          };
        }),
        max: 1890,
        description: 'по годам'
      };
    }

    const year = annualData[cylinderDrill.yearIndex] || annualData[annualData.length - 1];
    const quarters = distributeCylinderCategory(year, quarterLabels, quarterWeights, function (label) {
      return `${year.label} · ${label}`;
    }).map(function (category, quarterIndex) {
      return Object.assign(category, {
        label: `${category.label} ${year.label}`,
        kind: 'quarter',
        yearIndex: cylinderDrill.yearIndex,
        quarterIndex,
        weight: 1
      });
    });
    if (cylinderDrill.level === 'quarter' || cylinderDrill.quarterIndex === null) {
      return {
        data: annualData.flatMap(function (category, yearIndex) {
          if (yearIndex === cylinderDrill.yearIndex) return quarters;
          return [{
            label: category.label,
            period: category.label,
            values: category.values,
            kind: 'year',
            yearIndex,
            isContext: true,
            weight: .32
          }];
        }),
        max: 1890,
        description: `${year.label}: по кварталам`
      };
    }

    const quarter = quarters[cylinderDrill.quarterIndex] || quarters[0];
    const months = distributeCylinderCategory(
      quarter,
      monthLabels[cylinderDrill.quarterIndex] || monthLabels[0],
      monthWeights,
      function (label) { return `${year.label} · ${quarter.label} · ${label}`; }
    ).map(function (category, monthIndex) {
      return Object.assign(category, {
        label: `${category.label} ${year.label}`,
        kind: 'month',
        yearIndex: cylinderDrill.yearIndex,
        quarterIndex: cylinderDrill.quarterIndex,
        monthIndex,
        weight: 1
      });
    });
    return {
      data: annualData.flatMap(function (category, yearIndex) {
        if (yearIndex !== cylinderDrill.yearIndex) {
          return [{
            label: category.label,
            period: category.label,
            values: category.values,
            kind: 'year',
            yearIndex,
            isContext: true,
            weight: .18
          }];
        }
        return quarters.flatMap(function (quarterCategory, quarterIndex) {
          if (quarterIndex === cylinderDrill.quarterIndex) return months;
          return [Object.assign({}, quarterCategory, { isContext: true, weight: .42 })];
        });
      }),
      max: 1890,
      description: `${year.label}, ${quarter.label}: по месяцам`
    };
  }

  function renderCylinder(datasetKey) {
    const view = getCylinderView(datasetKey);
    const data = view.data;
    const width = Math.max(960, Math.round(cylinderChart.getBoundingClientRect().width || 1440));
    const height = 420;
    const max = view.max;
    const margin = { top: 16, right: 18, bottom: 44, left: 58 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const plotBottom = margin.top + plotHeight;
    const totalWeight = data.reduce(function (sum, category) {
      return sum + (category.weight || 1);
    }, 0);
    const renderOrder = series.map(function (_, index) { return index; });
    if (selectedCylinderSeries !== null) {
      renderOrder.splice(renderOrder.indexOf(selectedCylinderSeries), 1);
      renderOrder.unshift(selectedCylinderSeries);
    }
    const svg = [];

    for (let tick = 0; tick <= 6; tick += 1) {
      const value = max * tick / 6;
      const y = plotBottom - plotHeight * tick / 6;
      svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/>`);
      svg.push(`<text class="chart-bars__tick" x="${margin.left - 10}" y="${y + 5}" text-anchor="end">${escapeXml(numberFormat.format(value))}</text>`);
    }

    let boundaryWeight = 0;
    data.forEach(function (category) {
      const x = margin.left + plotWidth * boundaryWeight / totalWeight;
      svg.push(`<line class="chart-bars__vertical-line" x1="${x}" y1="${margin.top}" x2="${x}" y2="${plotBottom}"/>`);
      boundaryWeight += category.weight || 1;
    });
    svg.push(`<line class="chart-bars__vertical-line" x1="${width - margin.right}" y1="${margin.top}" x2="${width - margin.right}" y2="${plotBottom}"/>`);
    svg.push(`<line class="chart-bars__axis-line" x1="${margin.left}" y1="${plotBottom}" x2="${width - margin.right}" y2="${plotBottom}"/>`);

    let categoryWeight = 0;
    data.forEach(function (category, categoryIndex) {
      const groupWidth = plotWidth * (category.weight || 1) / totalWeight;
      const centerX = margin.left + plotWidth * categoryWeight / totalWeight + groupWidth / 2;
      const barWidth = category.isContext
        ? Math.max(14, Math.min(44, groupWidth * .5))
        : Math.max(42, Math.min(92, groupWidth * .58));
      let stackY = plotBottom;
      renderOrder.forEach(function (seriesIndex) {
        const value = category.values[seriesIndex];
        const segmentHeight = Math.max(2, plotHeight * value / max);
        const y = stackY - segmentHeight;
        const className = series[seriesIndex].className;
        const pressed = selectedCylinderSeries === seriesIndex;
        svg.push(`<rect class="chart-bars__segment ${category.isContext ? 'is-context' : ''} ${className}" x="${centerX - barWidth / 2}" y="${y}" width="${barWidth}" height="${segmentHeight + 1}" tabindex="0" role="button" aria-pressed="${pressed}" aria-label="${escapeXml(`${category.period || category.label}, ${series[seriesIndex].label}, ${numberFormat.format(value)} МТ`)}" data-chart-segment data-category-index="${categoryIndex}" data-period-kind="${category.kind}" data-year-index="${category.yearIndex}" data-quarter-index="${category.quarterIndex ?? ''}" data-period="${escapeXml(category.period || category.label)}" data-series-index="${seriesIndex}" data-series-label="${escapeXml(series[seriesIndex].label)}" data-value="${value}"/>`);
        stackY = y;
      });
      svg.push(`<text class="chart-bars__category ${category.isContext ? 'is-context' : ''}" x="${centerX}" y="${plotBottom + 26}" text-anchor="middle">${escapeXml(category.label)}</text>`);
      categoryWeight += category.weight || 1;
    });

    cylinderChart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    cylinderChart.innerHTML = svg.join('');
    cylinderChart.setAttribute('aria-label', `Объем перевалки по периодам: ${datasetKey === 'shipment' ? 'отгрузка' : datasetKey === 'receipt' ? 'приёмка' : 'хранение'}, ${view.description}`);
    cylinderLegend?.querySelectorAll('[data-transshipment-series]').forEach(function (legendItem) {
      const selected = Number(legendItem.dataset.transshipmentSeries) === selectedCylinderSeries;
      legendItem.classList.toggle('is-selected', selected);
      legendItem.setAttribute('aria-pressed', String(selected));
    });
    activeCylinderDataset = datasetKey;
  }

  function renderDonut(datasetKey, chartElement, legendElement, datasetOverride, accessibleLabel, startAngleOffset) {
    const targetChart = chartElement || donutChart;
    const targetLegend = legendElement || productLegend;
    const productData = datasetOverride || productDatasets[datasetKey] || productDatasets.shipment;
    window.BNTCharts.renderDonut({
      chart: targetChart,
      legend: targetLegend,
      data: productData,
      accessibleLabel: accessibleLabel || `Распределение объема перевалки по нефтепродуктам: ${datasetKey === 'receipt' ? 'приёмка' : datasetKey === 'storage' ? 'хранение' : 'отгрузка'}`,
      startAngle: startAngleOffset,
      unit: 'МТ'
    });
    if (!datasetOverride) activeProductDataset = datasetKey;
  }

  function renderPie() {
    renderDonut('origin', pieChart, originLegend, originData, 'Распределение нефтепродуктов по происхождению', 6);
  }

  function hideCylinderTooltip() {
    if (cylinderTooltip) cylinderTooltip.hidden = true;
  }

  function positionCylinderTooltip(clientX, clientY) {
    if (!cylinderTooltip || !cylinderViewport) return;
    const viewportBounds = cylinderViewport.getBoundingClientRect();
    const localX = clientX - viewportBounds.left + cylinderViewport.scrollLeft;
    const localY = clientY - viewportBounds.top;
    const visibleLeft = cylinderViewport.scrollLeft + 8;
    const visibleRight = cylinderViewport.scrollLeft + cylinderViewport.clientWidth - 8;
    const visibleBottom = cylinderViewport.clientHeight - 8;
    let left = localX + 12;
    let top = localY + 12;
    if (left + cylinderTooltip.offsetWidth > visibleRight) left = localX - cylinderTooltip.offsetWidth - 12;
    if (top + cylinderTooltip.offsetHeight > visibleBottom) top = localY - cylinderTooltip.offsetHeight - 12;
    cylinderTooltip.style.left = `${Math.max(visibleLeft, left)}px`;
    cylinderTooltip.style.top = `${Math.max(8, top)}px`;
  }

  function showCylinderTooltip(segment, clientX, clientY) {
    if (!cylinderTooltip || !segment) return;
    const title = cylinderTooltip.querySelector('[data-tooltip-title]');
    const type = cylinderTooltip.querySelector('[data-tooltip-type]');
    if (title) title.textContent = segment.dataset.seriesLabel;
    cylinderTooltip.querySelector('[data-tooltip-period]').textContent = segment.dataset.period;
    if (type) type.textContent = segment.dataset.seriesLabel;
    cylinderTooltip.querySelector('[data-tooltip-value]').textContent = numberFormat.format(Number(segment.dataset.value));
    cylinderTooltip.hidden = false;
    positionCylinderTooltip(clientX, clientY);
  }

  function selectCylinderSeries(seriesIndex) {
    if (!Number.isInteger(seriesIndex) || seriesIndex < 0 || seriesIndex >= series.length) return;
    selectedCylinderSeries = seriesIndex;
    hideCylinderTooltip();
    renderCylinder(activeCylinderDataset);
  }

  cylinderChart.addEventListener('pointerover', function (event) {
    const segment = event.target.closest('[data-chart-segment]');
    if (segment) showCylinderTooltip(segment, event.clientX, event.clientY);
  });

  cylinderChart.addEventListener('pointermove', function (event) {
    if (!cylinderTooltip?.hidden && event.target.closest('[data-chart-segment]')) {
      positionCylinderTooltip(event.clientX, event.clientY);
    }
  });

  cylinderChart.addEventListener('pointerout', function (event) {
    if (event.target.closest('[data-chart-segment]')) hideCylinderTooltip();
  });

  cylinderChart.addEventListener('focusin', function (event) {
    const segment = event.target.closest('[data-chart-segment]');
    if (!segment) return;
    const bounds = segment.getBoundingClientRect();
    showCylinderTooltip(segment, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  });

  cylinderChart.addEventListener('focusout', hideCylinderTooltip);

  cylinderChart.addEventListener('click', function (event) {
    const segment = event.target.closest('[data-chart-segment]');
    if (segment) selectCylinderSeries(Number(segment.dataset.seriesIndex));
  });

  cylinderChart.addEventListener('keydown', function (event) {
    const segment = event.target.closest('[data-chart-segment]');
    if (!segment || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    selectCylinderSeries(Number(segment.dataset.seriesIndex));
  });

  cylinderChart.addEventListener('wheel', function (event) {
    const segment = event.target.closest('[data-chart-segment]');
    const zoomingIn = event.deltaY < 0 && segment && cylinderDrill.level !== 'month';
    const zoomingOut = event.deltaY > 0 && cylinderDrill.level !== 'year';
    if (!zoomingIn && !zoomingOut) return;

    event.preventDefault();
    if (cylinderWheelLocked) return;
    cylinderWheelLocked = true;
    window.setTimeout(function () { cylinderWheelLocked = false; }, 360);
    hideCylinderTooltip();

    if (zoomingIn) {
      const periodKind = segment.dataset.periodKind;
      const yearIndex = Number(segment.dataset.yearIndex);
      const quarterIndex = Number(segment.dataset.quarterIndex);
      if (cylinderDrill.level === 'year') {
        cylinderDrill.level = 'quarter';
        cylinderDrill.yearIndex = yearIndex;
        cylinderDrill.quarterIndex = null;
      } else if (periodKind === 'year') {
        cylinderDrill.level = 'quarter';
        cylinderDrill.yearIndex = yearIndex;
        cylinderDrill.quarterIndex = null;
      } else if (periodKind === 'quarter') {
        cylinderDrill.level = 'month';
        cylinderDrill.yearIndex = yearIndex;
        cylinderDrill.quarterIndex = quarterIndex;
      }
    } else if (cylinderDrill.level === 'month') {
      cylinderDrill.level = 'quarter';
      cylinderDrill.quarterIndex = null;
    } else {
      resetCylinderDrill();
    }
    renderCylinder(activeCylinderDataset);
  }, { passive: false });

  cylinderLegend?.addEventListener('click', function (event) {
    const legendItem = event.target.closest('[data-transshipment-series]');
    if (legendItem) selectCylinderSeries(Number(legendItem.dataset.transshipmentSeries));
  });

  cylinderLegend?.addEventListener('keydown', function (event) {
    const legendItem = event.target.closest('[data-transshipment-series]');
    if (!legendItem || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    selectCylinderSeries(Number(legendItem.dataset.transshipmentSeries));
  });

  function getOriginValues(countryIndex, dimensionKey) {
    const dimension = originDimensions[dimensionKey];
    const groupedValues = dimension.categories.map(function () { return 0; });
    originComposition[countryIndex].values.forEach(function (value, productIndex) {
      groupedValues[dimension.productGroups[productIndex]] += value;
    });
    return groupedValues;
  }

  function renderOriginDetails() {
    const country = originData[selectedOriginCountry];
    const composition = originComposition[selectedOriginCountry];
    const dimension = originDimensions[activeOriginTab];
    const values = getOriginValues(selectedOriginCountry, activeOriginTab);
    originDetails.className = `origin-breakdown__details origin-breakdown__row--${composition.key}`;
    originDetails.innerHTML = `
      <div class="origin-breakdown__details-heading"><span>${escapeXml(country.label)}</span><span class="origin-breakdown__details-values"><span>100%</span><span aria-hidden="true">·</span><strong>${escapeXml(numberFormat.format(country.value))} МТ</strong></span></div>
      <div class="origin-breakdown__details-list">
        ${dimension.categories.map(function (category, categoryIndex) {
          const value = values[categoryIndex];
          const percent = percentFormat.format(value / country.value * 100);
          return `<div class="origin-breakdown__details-item">
            <span class="origin-breakdown__details-label"><i class="chart-legend__dot origin-breakdown__swatch origin-breakdown__swatch--${categoryIndex}" aria-hidden="true"></i>${escapeXml(category)} (${categoryIndex + 1})</span>
            <span class="origin-breakdown__details-values"><span>${escapeXml(percent)}%</span><span aria-hidden="true">·</span><strong>${escapeXml(numberFormat.format(value))}</strong></span>
          </div>`;
        }).join('')}
      </div>`;
    originRows.querySelectorAll('.origin-breakdown__country').forEach(function (button) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.originCountry) === selectedOriginCountry));
    });
  }

  function fitOriginLabelColumn() {
    if (originBreakdown.hidden) return;
    const countryButton = originRows.querySelector('.origin-breakdown__country');
    if (!countryButton) return;
    const buttonStyle = window.getComputedStyle(countryButton);
    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.whiteSpace = 'nowrap';
    probe.style.fontFamily = buttonStyle.fontFamily;
    probe.style.fontSize = buttonStyle.fontSize;
    probe.style.fontWeight = buttonStyle.fontWeight;
    probe.style.letterSpacing = buttonStyle.letterSpacing;
    originPlot.appendChild(probe);
    const widestName = Math.max.apply(null, originData.map(function (country) {
      probe.textContent = country.label;
      return probe.getBoundingClientRect().width;
    }));
    probe.remove();
    const horizontalPadding = parseFloat(buttonStyle.paddingLeft) + parseFloat(buttonStyle.paddingRight);
    originPlot.style.setProperty('--origin-label-width', `${Math.min(160, Math.ceil(widestName + horizontalPadding))}px`);
  }

  function renderOriginBreakdown(dimensionKey) {
    const dimension = originDimensions[dimensionKey];
    if (!dimension || !originRows) return;
    activeOriginTab = dimensionKey;
    originRows.innerHTML = originData.map(function (country, countryIndex) {
      const values = getOriginValues(countryIndex, dimensionKey);
      const composition = originComposition[countryIndex];
      const segments = values.map(function (value, categoryIndex) {
        if (value === 0) return '';
        const category = dimension.categories[categoryIndex];
        const percent = percentFormat.format(value / country.value * 100);
        const label = `${country.label}, ${category}: ${numberFormat.format(value)} МТ, ${percent}% объёма страны`;
        return `<button class="origin-breakdown__segment origin-breakdown__segment--${categoryIndex}" type="button" style="flex: ${value} 1 0" aria-label="${escapeXml(label)}" data-origin-segment data-origin-country="${countryIndex}" data-origin-category="${categoryIndex}" data-origin-value="${value}"></button>`;
      }).join('');
      return `<div class="origin-breakdown__row origin-breakdown__row--${composition.key}">
        <button class="origin-breakdown__country typography-body-smallest" type="button" data-origin-country="${countryIndex}" aria-pressed="false" aria-label="Показать состав: ${escapeXml(country.label)}">${escapeXml(country.label)}</button>
        <div class="origin-breakdown__bar" role="group" aria-label="${escapeXml(country.label)}: ${escapeXml(dimension.title.toLowerCase())}">${segments}</div>
      </div>`;
    }).join('');
    fitOriginLabelColumn();
    renderOriginDetails();
  }

  function renderOriginTab(tabKey, tabId) {
    const showBreakdown = tabKey !== 'all';
    originTooltip.hidden = true;
    originInfoPopover.hidden = true;
    originInfoTrigger.setAttribute('aria-expanded', 'false');
    originPanel.setAttribute('aria-labelledby', tabId);
    originPieViewport.hidden = showBreakdown;
    originLegend.hidden = showBreakdown;
    originBreakdown.hidden = !showBreakdown;
    originCard.classList.toggle('is-origin-breakdown-active', showBreakdown);
    if (showBreakdown) {
      renderOriginBreakdown(tabKey);
    } else {
      activeOriginTab = 'all';
      renderPie();
    }
  }

  function closeOriginInfo(returnFocus) {
    originInfoPopover.hidden = true;
    originInfoTrigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) originInfoTrigger.focus();
  }

  originInfoTrigger.addEventListener('click', function () {
    const nextOpen = originInfoPopover.hidden;
    originInfoPopover.hidden = !nextOpen;
    originInfoTrigger.setAttribute('aria-expanded', String(nextOpen));
  });
  originInfoClose.addEventListener('click', function () {
    closeOriginInfo(true);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !originInfoPopover.hidden) closeOriginInfo(true);
  });
  document.addEventListener('pointerdown', function (event) {
    if (!originInfoPopover.hidden && !event.target.closest('.origin-title-info')) {
      closeOriginInfo(false);
    }
  });

  function positionOriginTooltip(clientX, clientY) {
    const bounds = originBreakdown.getBoundingClientRect();
    const left = clientX - bounds.left + 12;
    const top = clientY - bounds.top + 12;
    originTooltip.style.left = `${Math.max(4, Math.min(left, bounds.width - originTooltip.offsetWidth - 4))}px`;
    originTooltip.style.top = `${Math.max(4, Math.min(top, bounds.height - originTooltip.offsetHeight - 4))}px`;
  }

  function showOriginTooltip(segment, clientX, clientY) {
    const countryIndex = Number(segment.dataset.originCountry);
    const categoryIndex = Number(segment.dataset.originCategory);
    const value = Number(segment.dataset.originValue);
    const country = originData[countryIndex];
    const category = originDimensions[activeOriginTab].categories[categoryIndex];
    originTooltip.querySelector('[data-origin-tooltip-title]').textContent = `${country.label} · ${category}`;
    originTooltip.querySelector('[data-origin-tooltip-value]').textContent = `${numberFormat.format(value)} МТ · ${percentFormat.format(value / country.value * 100)}% страны`;
    originTooltip.hidden = false;
    positionOriginTooltip(clientX, clientY);
  }

  originBreakdown.addEventListener('pointerover', function (event) {
    const segment = event.target.closest('[data-origin-segment]');
    if (segment) showOriginTooltip(segment, event.clientX, event.clientY);
  });
  originBreakdown.addEventListener('pointermove', function (event) {
    if (!originTooltip.hidden && event.target.closest('[data-origin-segment]')) {
      positionOriginTooltip(event.clientX, event.clientY);
    }
  });
  originBreakdown.addEventListener('pointerout', function (event) {
    if (event.target.closest('[data-origin-segment]')) originTooltip.hidden = true;
  });
  originBreakdown.addEventListener('focusin', function (event) {
    const segment = event.target.closest('[data-origin-segment]');
    if (!segment) return;
    const bounds = segment.getBoundingClientRect();
    showOriginTooltip(segment, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  });
  originBreakdown.addEventListener('focusout', function () {
    originTooltip.hidden = true;
  });
  originBreakdown.addEventListener('click', function (event) {
    const countryControl = event.target.closest('[data-origin-country]');
    if (!countryControl) return;
    selectedOriginCountry = Number(countryControl.dataset.originCountry);
    renderOriginDetails();
  });

  function setActiveTab(tabList, activeTab) {
    Array.from(tabList.querySelectorAll('[role="tab"]')).forEach(function (tab) {
      const active = tab === activeTab;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }

  root.querySelectorAll('.chart-tabs').forEach(function (tabList) {
    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        setActiveTab(tabList, tab);
        if (tab.dataset.transshipmentTab) {
          if (tab.dataset.transshipmentTab !== activeCylinderDataset) resetCylinderDrill();
          renderCylinder(tab.dataset.transshipmentTab);
        }
        if (tab.dataset.productTab) renderDonut(tab.dataset.productTab);
        if (tab.dataset.originTab) renderOriginTab(tab.dataset.originTab, tab.id);
      });
      tab.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
        nextTab.focus();
        nextTab.click();
      });
    });
  });

  function downloadOriginCsv() {
    const dimension = originDimensions[activeOriginTab];
    const rows = dimension
      ? [['Страна', 'Всего, МТ'].concat(dimension.categories.map(function (category) { return `${category}, МТ`; }))]
      : [['Страна', 'Всего, МТ', 'Доля в общем объёме']];
    originData.forEach(function (country, countryIndex) {
      rows.push(dimension
        ? [country.label, country.value].concat(getOriginValues(countryIndex, activeOriginTab))
        : [country.label, country.value, country.percent]);
    });
    const csv = rows.map(function (row) {
      return row.map(function (value) {
        return `"${String(value).replaceAll('"', '""')}"`;
      }).join(';');
    }).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `origin-${activeOriginTab}-2025.csv`;
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  root.addEventListener('click', function (event) {
    const chipClose = event.target.closest('.pill button');
    if (chipClose) {
      chipClose.closest('.pill')?.remove();
      return;
    }
    const info = event.target.closest('[data-transshipment-info]');
    if (info) {
      if (info.dataset.transshipmentInfo === 'origin') return;
      if (window.BNTUI?.showInfoPopover) {
        window.BNTUI.showInfoPopover(info, {
          title: 'Данные диаграммы',
          message: 'Значения рассчитаны для выбранного периода и единицы измерения'
        });
      }
      return;
    }
    const exportButton = event.target.closest('[data-transshipment-export]');
    if (exportButton?.dataset.transshipmentExport === 'origin') {
      downloadOriginCsv();
      toast('Экспорт', 'Данные происхождения скачаны в CSV');
    } else if (exportButton) {
      toast('Экспорт', 'Данные диаграммы подготовлены к скачиванию');
    }
  });

  renderCylinder(activeCylinderDataset);
  renderDonut(activeProductDataset);
  renderPie();

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitOriginLabelColumn);

  let resizeFrame = 0;
  if (typeof ResizeObserver === 'function') {
    const resizeObserver = new ResizeObserver(function () {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(function () {
        renderCylinder(activeCylinderDataset);
        renderDonut(activeProductDataset);
        renderPie();
        fitOriginLabelColumn();
      });
    });
    [cylinderChart, donutChart, pieChart].forEach(function (chart) {
      if (chart.parentElement) resizeObserver.observe(chart.parentElement);
    });
    resizeObserver.observe(originPlot);
  }
}());
