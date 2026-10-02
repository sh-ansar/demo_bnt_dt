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
            <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-department-filter aria-expanded="false" aria-controls="department-filter-modal">
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

  const modalTemplate = document.createElement('template');
  modalTemplate.innerHTML = `
<div id="department-filter-modal" class="filter-modal" role="dialog" aria-modal="true" aria-labelledby="department-filter-title" hidden>
  <div class="filter-modal__overlay" data-department-filter-close></div>
  <section class="filter-modal__drawer dt3-drawer_static" aria-label="Фильтр: KPI подразделений и их укомплектованность">
    <header class="filter-modal__head">
      <h2 id="department-filter-title" class="filter-modal__title typography-caption-small">Фильтр: KPI подразделений и их укомплектованность</h2>
      <button class="dt3-drawer-toggle button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest is-expanded" type="button" data-department-filter-close aria-label="Закрыть фильтр">
        <svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
      </button>
    </header>
    <span class="ui-divider brand-divider" aria-hidden="true"></span>
    <div class="filter-modal__body">
      <form class="filter-modal__search dt3-multisearch shell-search" role="search" aria-label="Поиск по фильтру показателей подразделений" data-department-static-search-form>
        <div class="dt3-multisearch-field dt3-multisearch-field--icon shell-search-field">
          <span class="dt3-multisearch-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>
          </span>
          <input class="typography-body-smallest" type="search" placeholder="Поиск" data-department-static-search autocomplete="off">
          <button class="dt3-search-submit" type="submit" aria-label="Найти">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>
          </button>
        </div>
      </form>
      <div class="filter-modal__fields ui-scrollbar">
        <div class="form-input" data-form-input="departmentDepartments" data-department-departments-filter>
          <span class="form-input__label typography-label-smallest">Подразделения</span>
          <div class="form-input__field">
            <div class="form-input__control" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false" aria-label="Подразделения: Все">
              <span class="form-input__value form-input__tags" data-form-input-value><span class="form-input__all typography-body-smallest">Все</span></span>
              <span class="form-input__chevron nav-chevron" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
              </span>
            </div>
            <div class="form-input__menu" role="listbox" aria-label="Подразделения" aria-multiselectable="true" hidden>
              <span class="form-input__divider" aria-hidden="true"></span>
              <label class="form-input__search"><span aria-hidden="true"><svg width="20" height="20" viewBox="0 0 20 20"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg></span><input class="typography-body-smallest" type="search" placeholder="Поиск" data-form-input-search autocomplete="off"><button class="form-input__search-clear" type="button" data-form-input-search-clear aria-label="Очистить поиск" hidden><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button></label>
              <div class="form-input__options ui-scrollbar" data-form-input-options>
                <button class="form-input__option typography-body-smallest is-selected" type="button" role="option" aria-selected="true" data-form-input-option="Все">
                  <span class="form-input__checkbox" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>
                  <span class="form-input__option-label">Все</span>
                </button>
                <button class="form-input__option typography-body-smallest" type="button" role="option" aria-selected="false" data-form-input-option="Отдел безопасности">
                  <span class="form-input__checkbox" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>
                  <span class="form-input__option-label">Отдел безопасности</span>
                </button>
                <button class="form-input__option typography-body-smallest" type="button" role="option" aria-selected="false" data-form-input-option="Планово-экономический отдел">
                  <span class="form-input__checkbox" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>
                  <span class="form-input__option-label">Планово-экономический отдел</span>
                </button>
                <button class="form-input__option typography-body-smallest" type="button" role="option" aria-selected="false" data-form-input-option="Отдел коммерции и логистики">
                  <span class="form-input__checkbox" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>
                  <span class="form-input__option-label">Отдел коммерции и логистики</span>
                </button>
                <button class="form-input__option typography-body-smallest" type="button" role="option" aria-selected="false" data-form-input-option="Административный отдел">
                  <span class="form-input__checkbox" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>
                  <span class="form-input__option-label">Административный отдел</span>
                </button>
                <button class="form-input__option typography-body-smallest" type="button" role="option" aria-selected="false" data-form-input-option="Отдел качества и контроля нефтепродуктов">
                  <span class="form-input__checkbox" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>
                  <span class="form-input__option-label">Отдел качества и контроля нефтепродуктов</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="equipment-date-grid">
          <div class="equipment-date-field" data-department-date-root="from" data-department-date-default="2026-01-01">
            <span class="typography-label-smallest">Дата от</span>
            <span class="equipment-date-input">
              <button class="equipment-date-display typography-body-smallest" type="button" data-department-date-toggle aria-haspopup="dialog" aria-expanded="false">
                <span data-department-date-text>01.01.2026</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.75 19.5H6.25V21H17.75V19.5ZM6.25 19.5C5.28371 19.5 4.5 18.7163 4.5 17.75H3C3 19.5447 4.45529 21 6.25 21V19.5ZM4.5 17.75V6.25H3V17.75H4.5ZM4.5 6.25C4.5 5.28371 5.28371 4.5 6.25 4.5V3C4.45529 3 3 4.45529 3 6.25H4.5ZM6.25 4.5H17.75V3H6.25V4.5ZM17.75 4.5C18.7163 4.5 19.5 5.28371 19.5 6.25H21C21 4.45529 19.5447 3 17.75 3V4.5ZM19.5 6.25V17.75H21V6.25H19.5ZM19.5 17.75C19.5 18.7163 18.7163 19.5 17.75 19.5V21C19.5447 21 21 19.5447 21 17.75H19.5ZM3.75 8.5H20.25V7H3.75V8.5ZM13.75 13.5H15.75V12H13.75V13.5ZM15.75 13.5C15.8883 13.5 16 13.6117 16 13.75H17.5C17.5 12.7833 16.7167 12 15.75 12V13.5ZM16 13.75V15.75H17.5V13.75H16ZM16 15.75C16 15.8883 15.8883 16 15.75 16V17.5C16.7167 17.5 17.5 16.7167 17.5 15.75H16ZM15.75 16H13.75V17.5H15.75V16ZM13.75 16C13.6117 16 13.5 15.8883 13.5 15.75H12C12 16.7167 12.7833 17.5 13.75 17.5V16ZM13.5 15.75V13.75H12V15.75H13.5ZM13.5 13.75C13.5 13.6117 13.6117 13.5 13.75 13.5V12C12.7833 12 12 12.7833 12 13.75H13.5Z" fill="currentColor"/></svg>
              </button>
              <input type="hidden" data-department-date="from">
              <span class="equipment-date-popover" data-department-date-popover hidden></span>
            </span>
          </div>
          <div class="equipment-date-field" data-department-date-root="to" data-department-date-default="2026-09-29">
            <span class="typography-label-smallest">Дата до</span>
            <span class="equipment-date-input">
              <button class="equipment-date-display typography-body-smallest" type="button" data-department-date-toggle aria-haspopup="dialog" aria-expanded="false">
                <span data-department-date-text>29.09.2026</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.75 19.5H6.25V21H17.75V19.5ZM6.25 19.5C5.28371 19.5 4.5 18.7163 4.5 17.75H3C3 19.5447 4.45529 21 6.25 21V19.5ZM4.5 17.75V6.25H3V17.75H4.5ZM4.5 6.25C4.5 5.28371 5.28371 4.5 6.25 4.5V3C4.45529 3 3 4.45529 3 6.25H4.5ZM6.25 4.5H17.75V3H6.25V4.5ZM17.75 4.5C18.7163 4.5 19.5 5.28371 19.5 6.25H21C21 4.45529 19.5447 3 17.75 3V4.5ZM19.5 6.25V17.75H21V6.25H19.5ZM19.5 17.75C19.5 18.7163 18.7163 19.5 17.75 19.5V21C19.5447 21 21 19.5447 21 17.75H19.5ZM3.75 8.5H20.25V7H3.75V8.5ZM13.75 13.5H15.75V12H13.75V13.5ZM15.75 13.5C15.8883 13.5 16 13.6117 16 13.75H17.5C17.5 12.7833 16.7167 12 15.75 12V13.5ZM16 13.75V15.75H17.5V13.75H16ZM16 15.75C16 15.8883 15.8883 16 15.75 16V17.5C16.7167 17.5 17.5 16.7167 17.5 15.75H16ZM15.75 16H13.75V17.5H15.75V16ZM13.75 16C13.6117 16 13.5 15.8883 13.5 15.75H12C12 16.7167 12.7833 17.5 13.75 17.5V16ZM13.5 15.75V13.75H12V15.75H13.5ZM13.5 13.75C13.5 13.6117 13.6117 13.5 13.75 13.5V12C12.7833 12 12 12.7833 12 13.75H13.5Z" fill="currentColor"/></svg>
              </button>
              <input type="hidden" data-department-date="to">
              <span class="equipment-date-popover" data-department-date-popover hidden></span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <span class="ui-divider brand-divider" aria-hidden="true"></span>
    <footer class="filter-modal__footer">
      <button class="button-smallest-primary-radius typography-button-smallest" type="button" data-department-filter-apply>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>
        <span>Поиск</span>
      </button>
      <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-department-filter-reset>
        <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
        <span>Сбросить всё</span>
      </button>
    </footer>
  </section>
</div>
  `;
  const filterModal = modalTemplate.content.firstElementChild;
  document.body.appendChild(filterModal);

  const filterButton = root.querySelector('[data-department-filter]');
  const periodPill = root.querySelector('[data-department-period-pill]');
  let selectedPeriod = '2025';
  const rows = [
    ['Отдел безопасности', 96, 98],
    ['Планово-экономический отдел', 94, 91],
    ['Отдел коммерции и логистики', 92, 87],
    ['Административный отдел', 99, 94],
    ['Отдел качества и контроля нефтепродуктов', 99, 97]
  ];

  function closeFilter() {
    filterModal.hidden = true;
    filterButton.setAttribute('aria-expanded', 'false');
    filterButton.focus({ preventScroll: true });
  }

  filterButton.addEventListener('click', function () {
    filterModal.hidden = false;
    filterButton.setAttribute('aria-expanded', 'true');
    filterModal.querySelector('[data-department-static-search]').focus();
  });

  filterModal.addEventListener('click', function (event) {
    if (event.target.closest('[data-department-filter-close], [data-department-filter-apply]')) {
      closeFilter();
    } else if (event.target.closest('[data-department-filter-reset]')) {
      filterModal.querySelector('[data-department-static-search]').value = '';
      closeFilter();
    }
  });

  filterModal.querySelector('[data-department-static-search-form]').addEventListener('submit', function (event) {
    event.preventDefault();
  });

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

  document.addEventListener('keydown', function (event) {
    if (filterModal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeFilter();
    } else if (event.key === 'Tab') {
      const focusable = [...filterModal.querySelectorAll('button, input, [tabindex="0"]')]
        .filter(element => !element.disabled && element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}());
