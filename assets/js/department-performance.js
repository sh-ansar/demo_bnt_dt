(function initDepartmentPerformance() {
  const root = document.querySelector('[data-department-performance]');
  if (!root) return;
  const ui = window.BNTUI;
  const numberFormat = new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 1});
  const format = value => numberFormat.format(value);
  const titleClass = root.dataset.departmentTitleClass === 'typography-caption-small'
    ? 'typography-caption-small'
    : 'typography-h5';
  const rows = [
    {label: 'Отдел безопасности', staffing: 96, kpi: 98, turnover: 3.4},
    {label: 'Планово-экономический отдел', staffing: 94, kpi: 91, turnover: 4.8},
    {label: 'Отдел коммерции и логистики', staffing: 92, kpi: 87, turnover: 6.2},
    {label: 'Административный отдел', staffing: 99, kpi: 94, turnover: 3.9},
    {label: 'Отдел качества и контроля нефтепродуктов', staffing: 99, kpi: 97, turnover: 2.7}
  ];
  const metrics = [
    {key: 'kpi', title: 'KPI подразделений', tone: 'turquoise', maximum: 125, step: 25},
    {key: 'staffing', title: 'Укомплектованность', tone: 'secondary', maximum: 125, step: 25,
      info: 'Фактическая численность сотрудников / штатная численность × 100%.'},
    {key: 'turnover', title: 'Текучесть персонала за период', tone: 'light', maximum: 15, step: 5,
      info: 'Уволившиеся по собственному желанию и за нарушения трудовой дисциплины за период / средняя численность сотрудников за тот же период × 100%.'}
  ];
  root.innerHTML = `
    <section class="transshipment-analytics" aria-labelledby="department-performance-title">
      <header class="transshipment-analytics__header">
        <div class="transshipment-analytics__heading">
          <h2 id="department-performance-title" class="${titleClass}">Кадровая аналитика</h2>
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
      <div class="chart-grid--three-column">
        ${metrics.map(metric => `
          <article class="chart-card department-performance-card" aria-labelledby="department-${metric.key}-title">
            <header class="chart-card__header">
              <div class="chart-card__title-row">
                <h3 id="department-${metric.key}-title" class="typography-caption-small">${metric.title}</h3>
                ${metric.info ? `<button class="sign_BTN_smallest info-icon-button" type="button" data-department-${metric.key}-info aria-label="Как рассчитывается ${metric.title.toLowerCase()}" aria-haspopup="dialog" aria-expanded="false">
                  <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Info"></use></svg>
                </button>` : ''}
              </div>
            </header>
            <div class="chart-viewport payment-deviation-chart__viewport">
              <div class="payment-deviation-chart" data-department-chart="${metric.key}" role="img" aria-label="${metric.title}, %">
                <div class="payment-deviation-chart__axis" aria-hidden="true"></div>
                <div class="chart-viewport__plot chart-scrollbar">
                  <div class="payment-deviation-chart__body">
                    <div class="payment-deviation-chart__grid" aria-hidden="true"></div>
                    <div class="payment-deviation-chart__rows">
                      ${rows.map(row => `
                        <div class="payment-deviation-chart__row" role="img" aria-label="${row.label}: ${metric.title}, ${format(row[metric.key])}%">
                          <span class="payment-deviation-chart__label" title="${row.label}">${row.label}</span>
                          <span class="payment-deviation-chart__tracks" aria-hidden="true">
                            <span class="payment-deviation-chart__track">
                              <i class="payment-deviation-chart__bar series-${metric.tone}" data-value="${row[metric.key]}"></i>
                              <strong class="payment-deviation-chart__value">${format(row[metric.key])}%</strong>
                            </span>
                          </span>
                        </div>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="chart-legend typography-body-smallest" aria-label="Легенда графика">
              <span><i class="chart-legend__dot series-${metric.tone}" aria-hidden="true"></i>${metric.title}, %</span>
            </div>
          </article>`).join('')}
      </div>
      <footer class="chart-footer-actions">
        <div class="chart-footer-actions__row">
          <button class="button-smallest-ghost typography-button-smallest" type="button" data-department-reset>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#CircleCross"></use></svg>
            <span>Сбросить всё</span>
          </button>
          <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-department-template-save>
            <svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Download"></use></svg>
            <span>Сохранить шаблон</span>
          </button>
        </div>
      </footer>
    </section>`;

  const charts = metrics.map(metric => ({metric, chart: root.querySelector(`[data-department-chart="${metric.key}"]`)}));
  function syncCharts() {
    charts.forEach(({metric, chart}) => {
      if (!chart.clientWidth) return;
      const styles = window.getComputedStyle(chart);
      const gap = parseFloat(styles.getPropertyValue('--payment-deviation-chart-gap')) || 0;
      const tickGap = parseFloat(styles.getPropertyValue('--space-2')) || 0;
      const labelWidth = Math.min(chart.clientWidth / 2, Math.ceil(Math.max(...rows.map(row => ui.measureChartLabel(row.label, chart)))));
      chart.style.setProperty('--payment-deviation-label-width', `${labelWidth}px`);
      const axisWidth = Math.max(1, chart.clientWidth - labelWidth - gap);
      const valueWidth = Math.max(...Array.from(chart.querySelectorAll('.payment-deviation-chart__value'), value => value.getBoundingClientRect().width));
      const maximumValue = Math.max(...rows.map(row => row[metric.key]));
      const reservedSpace = maximum => {
        const position = maximumValue / maximum;
        return Math.max(0, Math.ceil(((position - 1) * axisWidth + tickGap + valueWidth) / position));
      };
      let scale = ui.chartScale(0, metric.maximum, {
        step: metric.step, width: axisWidth,
        measureTick: value => ui.measureChartLabel(format(value), chart), gap: tickGap
      });
      scale = ui.chartScale(0, scale.max, {
        step: scale.step, width: Math.max(1, axisWidth - reservedSpace(scale.max)),
        measureTick: value => ui.measureChartLabel(format(value), chart), gap: tickGap
      });
      const count = Math.round(scale.max / scale.step);
      const ticks = Array.from({length: count + 1}, (_, index) => `<span>${format(index * scale.step)}</span>`).join('');
      const grid = '<span></span>'.repeat(count);
      const axis = chart.querySelector('.payment-deviation-chart__axis');
      const gridElement = chart.querySelector('.payment-deviation-chart__grid');
      if (axis.innerHTML !== ticks) axis.innerHTML = ticks;
      if (gridElement.innerHTML !== grid) gridElement.innerHTML = grid;
      chart.style.setProperty('--payment-deviation-divisions', String(count));
      const valueSpace = reservedSpace(scale.max);
      chart.style.setProperty('--payment-deviation-value-space', `${valueSpace}px`);
      chart.querySelectorAll('.payment-deviation-chart__track').forEach((track, index) => {
        track.style.setProperty('--payment-deviation-value', `${rows[index][metric.key] / scale.max * 100}%`);
      });
    });
  }
  syncCharts();
  window.addEventListener('resize', syncCharts);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(syncCharts);
    charts.forEach(({chart}) => observer.observe(chart));
  }
  document.fonts?.ready.then(syncCharts);

  const periodPill = root.querySelector('[data-department-period-pill]');
  metrics.filter(metric => metric.info).forEach(metric => {
    const trigger = root.querySelector(`[data-department-${metric.key}-info]`);
    trigger.addEventListener('click', () => ui.showInfoPopover(trigger, {title: metric.title, message: metric.info}));
  });
  let selectedPeriod = '2025';
  root.querySelector('[data-department-period-clear]').addEventListener('click', function () {
    selectedPeriod = '';
    periodPill.hidden = true;
  });
  root.querySelector('[data-department-reset]').addEventListener('click', function () {
    selectedPeriod = '2025';
    periodPill.hidden = false;
    ui.closeInfoPopover();
    syncCharts();
  });
  root.querySelector('[data-department-export]').addEventListener('click', function () {
    ui.downloadCsv(`department-performance-${selectedPeriod || 'all-periods'}.csv`, [
      ['Подразделение', 'Укомплектованность, %', 'KPI подразделения, %', 'Текучесть персонала за период, %'],
      ...rows.map(row => [row.label, row.staffing, row.kpi, row.turnover])
    ]);
  });
}());
