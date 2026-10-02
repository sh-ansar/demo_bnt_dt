(function initDepartmentPerformance() {
  const root = document.querySelector('[data-department-performance]');
  if (!root) return;

  const titleClass = root.dataset.departmentTitleClass === 'typography-caption-small'
    ? 'typography-caption-small'
    : 'typography-h5';
  root.innerHTML = `
      <article class="chart-card chart-card--wide cash-flow-card department-performance-card">
        <header class="chart-card__header">
          <div class="chart-card__heading">
            <div class="chart-card__title-row">
              <h2 id="department-performance-title" class="${titleClass}">KPI подразделений и их укомплектованность</h2>
            </div>
            <div class="chart-card__filters">
              <span class="filter-summary__count filter-summary__count_static pill pill--default pill--radius typography-body-smallest" data-department-period-pill>
                <span class="filter-summary__count-title" data-department-period-label>На текущую дату</span>
                <button class="filter-summary__count-chevron" type="button" data-department-period-clear aria-label="Убрать период">
                  <svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
                </button>
              </span>
            </div>
          </div>
          <div class="chart-actions">
            <button class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" type="button" data-department-export aria-label="Скачать показатели подразделений">
              <svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Download"></use></svg>
            </button>
            <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-chart-filter aria-expanded="false" aria-controls="chart-filter-modal">
              <svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Filter"></use></svg>
              <span>Фильтр</span>
            </button>
            <a class="section-expand-link button-smallest-secondary-radius typography-button-smallest" href="/hr" aria-label="К кадрам">
              <svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#ArrowUpRight"></use></svg>
              <span>К кадрам</span>
            </a>
          </div>
        </header>

        <div class="chart-viewport chart-scrollbar payment-deviation-chart__viewport">
          <div class="payment-deviation-chart" role="img" aria-label="Укомплектованность и KPI подразделений в процентах">
            <div class="payment-deviation-chart__axis" aria-hidden="true">
              <span>80</span><span>82</span><span>84</span><span>86</span><span>88</span><span>90</span><span>92</span><span>94</span><span>96</span><span>98</span><span>100</span>
            </div>
            <div class="payment-deviation-chart__body">
              <div class="payment-deviation-chart__grid" aria-hidden="true">
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
              <div class="payment-deviation-chart__rows">
                <div class="payment-deviation-chart__row" role="img" aria-label="Отдел безопасности: укомплектованность 96 процентов, KPI подразделения 98 процентов">
                  <span class="payment-deviation-chart__label" title="Отдел безопасности">Отдел безопасности</span>
                  <span class="payment-deviation-chart__tracks" aria-hidden="true">
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:80%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--plan"></i></span>
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:90%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--fact"></i></span>
                  </span>
                </div>
                <div class="payment-deviation-chart__row" role="img" aria-label="Планово-экономический отдел: укомплектованность 94 процента, KPI подразделения 91 процент">
                  <span class="payment-deviation-chart__label" title="Планово-экономический отдел">Планово-экономический отдел</span>
                  <span class="payment-deviation-chart__tracks" aria-hidden="true">
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:70%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--plan"></i></span>
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:55%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--fact"></i></span>
                  </span>
                </div>
                <div class="payment-deviation-chart__row" role="img" aria-label="Отдел коммерции и логистики: укомплектованность 92 процента, KPI подразделения 87 процентов">
                  <span class="payment-deviation-chart__label" title="Отдел коммерции и логистики">Отдел коммерции и логистики</span>
                  <span class="payment-deviation-chart__tracks" aria-hidden="true">
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:60%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--plan"></i></span>
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:35%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--fact"></i></span>
                  </span>
                </div>
                <div class="payment-deviation-chart__row" role="img" aria-label="Административный отдел: укомплектованность 99 процентов, KPI подразделения 94 процента">
                  <span class="payment-deviation-chart__label" title="Административный отдел">Административный отдел</span>
                  <span class="payment-deviation-chart__tracks" aria-hidden="true">
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:95%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--plan"></i></span>
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:70%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--fact"></i></span>
                  </span>
                </div>
                <div class="payment-deviation-chart__row" role="img" aria-label="Отдел качества и контроля нефтепродуктов: укомплектованность 99 процентов, KPI подразделения 97 процентов">
                  <span class="payment-deviation-chart__label" title="Отдел качества и контроля нефтепродуктов">Отдел качества и контроля нефтепродуктов</span>
                  <span class="payment-deviation-chart__tracks" aria-hidden="true">
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:95%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--plan"></i></span>
                    <span class="payment-deviation-chart__track" style="--payment-deviation-value:85%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--fact"></i></span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-legend typography-body-smallest" aria-label="Легенда показателей подразделений">
          <span><i class="chart-legend__dot payment-deviation__dot--plan" aria-hidden="true"></i>Укомплектованность, %</span>
          <span><i class="chart-legend__dot payment-deviation__dot--fact" aria-hidden="true"></i>KPI подразделений, %</span>
        </div>
      </article>
  `;

  const periodPill = root.querySelector('[data-department-period-pill]');
  let selectedPeriod = '2025';
  const rows = [
    ['Отдел безопасности', 96, 98],
    ['Планово-экономический отдел', 94, 91],
    ['Отдел коммерции и логистики', 92, 87],
    ['Административный отдел', 99, 94],
    ['Отдел качества и контроля нефтепродуктов', 99, 97]
  ];

  root.querySelector('[data-department-period-clear]').addEventListener('click', function () {
    selectedPeriod = '';
    periodPill.hidden = true;
  });

  root.querySelector('[data-department-export]').addEventListener('click', function () {
    const csvRows = [['Подразделение', 'Укомплектованность, %', 'KPI подразделения, %']].concat(rows);
    const csv = csvRows.map(function (row) {
      return row.map(function (value) {
        return `"${String(value).replaceAll('"', '""')}"`;
      }).join(';');
    }).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `department-performance-${selectedPeriod || 'all-periods'}.csv`;
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

}());
