(function initChartFilter() {
  const modalTemplate = document.createElement('template');
  modalTemplate.innerHTML = `
<div id="chart-filter-modal" class="filter-modal" role="dialog" aria-modal="true" aria-labelledby="chart-filter-title" hidden>
  <div class="filter-modal__overlay" data-chart-filter-close></div>
  <section class="filter-modal__drawer dt3-drawer_static" aria-label="Фильтр">
    <header class="filter-modal__head">
      <h2 id="chart-filter-title" class="filter-modal__title typography-caption-small">Фильтр</h2>
      <button class="dt3-drawer-toggle button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest is-expanded" type="button" data-chart-filter-close aria-label="Закрыть фильтр">
        <svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
      </button>
    </header>
    <span class="ui-divider brand-divider" aria-hidden="true"></span>
    <div class="filter-modal__body">
      <form class="filter-modal__search dt3-multisearch shell-search" role="search" aria-label="Поиск по фильтру" data-chart-static-search-form>
        <div class="dt3-multisearch-field dt3-multisearch-field--icon shell-search-field">
          <span class="dt3-multisearch-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>
          </span>
          <input class="typography-body-smallest" type="search" placeholder="Поиск" data-chart-static-search autocomplete="off">
          <button class="dt3-search-submit" type="submit" aria-label="Найти">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>
          </button>
        </div>
      </form>
      <div class="filter-modal__fields ui-scrollbar">
        <div class="form-input" data-form-input="chartDepartments" data-chart-departments-filter>
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
          <div class="equipment-date-field" data-chart-date-root="from" data-chart-date-default="2026-01-01">
            <span class="typography-label-smallest">Дата от</span>
            <span class="equipment-date-input">
              <button class="equipment-date-display typography-body-smallest" type="button" data-chart-date-toggle aria-haspopup="dialog" aria-expanded="false">
                <span data-chart-date-text>01.01.2026</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.75 19.5H6.25V21H17.75V19.5ZM6.25 19.5C5.28371 19.5 4.5 18.7163 4.5 17.75H3C3 19.5447 4.45529 21 6.25 21V19.5ZM4.5 17.75V6.25H3V17.75H4.5ZM4.5 6.25C4.5 5.28371 5.28371 4.5 6.25 4.5V3C4.45529 3 3 4.45529 3 6.25H4.5ZM6.25 4.5H17.75V3H6.25V4.5ZM17.75 4.5C18.7163 4.5 19.5 5.28371 19.5 6.25H21C21 4.45529 19.5447 3 17.75 3V4.5ZM19.5 6.25V17.75H21V6.25H19.5ZM19.5 17.75C19.5 18.7163 18.7163 19.5 17.75 19.5V21C19.5447 21 21 19.5447 21 17.75H19.5ZM3.75 8.5H20.25V7H3.75V8.5ZM13.75 13.5H15.75V12H13.75V13.5ZM15.75 13.5C15.8883 13.5 16 13.6117 16 13.75H17.5C17.5 12.7833 16.7167 12 15.75 12V13.5ZM16 13.75V15.75H17.5V13.75H16ZM16 15.75C16 15.8883 15.8883 16 15.75 16V17.5C16.7167 17.5 17.5 16.7167 17.5 15.75H16ZM15.75 16H13.75V17.5H15.75V16ZM13.75 16C13.6117 16 13.5 15.8883 13.5 15.75H12C12 16.7167 12.7833 17.5 13.75 17.5V16ZM13.5 15.75V13.75H12V15.75H13.5ZM13.5 13.75C13.5 13.6117 13.6117 13.5 13.75 13.5V12C12.7833 12 12 12.7833 12 13.75H13.5Z" fill="currentColor"/></svg>
              </button>
              <input type="hidden" data-chart-date="from">
              <span class="equipment-date-popover" data-chart-date-popover hidden></span>
            </span>
          </div>
          <div class="equipment-date-field" data-chart-date-root="to" data-chart-date-default="2026-09-29">
            <span class="typography-label-smallest">Дата до</span>
            <span class="equipment-date-input">
              <button class="equipment-date-display typography-body-smallest" type="button" data-chart-date-toggle aria-haspopup="dialog" aria-expanded="false">
                <span data-chart-date-text>29.09.2026</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.75 19.5H6.25V21H17.75V19.5ZM6.25 19.5C5.28371 19.5 4.5 18.7163 4.5 17.75H3C3 19.5447 4.45529 21 6.25 21V19.5ZM4.5 17.75V6.25H3V17.75H4.5ZM4.5 6.25C4.5 5.28371 5.28371 4.5 6.25 4.5V3C4.45529 3 3 4.45529 3 6.25H4.5ZM6.25 4.5H17.75V3H6.25V4.5ZM17.75 4.5C18.7163 4.5 19.5 5.28371 19.5 6.25H21C21 4.45529 19.5447 3 17.75 3V4.5ZM19.5 6.25V17.75H21V6.25H19.5ZM19.5 17.75C19.5 18.7163 18.7163 19.5 17.75 19.5V21C19.5447 21 21 19.5447 21 17.75H19.5ZM3.75 8.5H20.25V7H3.75V8.5ZM13.75 13.5H15.75V12H13.75V13.5ZM15.75 13.5C15.8883 13.5 16 13.6117 16 13.75H17.5C17.5 12.7833 16.7167 12 15.75 12V13.5ZM16 13.75V15.75H17.5V13.75H16ZM16 15.75C16 15.8883 15.8883 16 15.75 16V17.5C16.7167 17.5 17.5 16.7167 17.5 15.75H16ZM15.75 16H13.75V17.5H15.75V16ZM13.75 16C13.6117 16 13.5 15.8883 13.5 15.75H12C12 16.7167 12.7833 17.5 13.75 17.5V16ZM13.5 15.75V13.75H12V15.75H13.5ZM13.5 13.75C13.5 13.6117 13.6117 13.5 13.75 13.5V12C12.7833 12 12 12.7833 12 13.75H13.5Z" fill="currentColor"/></svg>
              </button>
              <input type="hidden" data-chart-date="to">
              <span class="equipment-date-popover" data-chart-date-popover hidden></span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <span class="ui-divider brand-divider" aria-hidden="true"></span>
    <footer class="filter-modal__footer">
      <button class="button-smallest-primary-radius typography-button-smallest" type="button" data-chart-filter-apply>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>
        <span>Поиск</span>
      </button>
      <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-chart-filter-reset>
        <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
        <span>Сбросить всё</span>
      </button>
    </footer>
  </section>
</div>
  `;
  const filterModal = modalTemplate.content.firstElementChild;
  document.body.appendChild(filterModal);


  const title = filterModal.querySelector('#chart-filter-title');
  const drawer = filterModal.querySelector('.filter-modal__drawer');
  const search = filterModal.querySelector('[data-chart-static-search]');
  let activeTrigger = null;

  function close() {
    if (filterModal.hidden) return;
    filterModal.hidden = true;
    activeTrigger?.setAttribute('aria-expanded', 'false');
    activeTrigger?.focus({ preventScroll: true });
    activeTrigger = null;
  }

  function open(trigger) {
    close();
    activeTrigger = trigger;
    const chartTitle = trigger.closest('header')?.querySelector('h2, h3')?.textContent.trim();
    const label = chartTitle ? `Фильтр: ${chartTitle}` : 'Фильтр';
    title.textContent = label;
    drawer.setAttribute('aria-label', label);
    drawer.classList.toggle('dt3-drawer_static-date', trigger.dataset.chartFilterVariant === 'static-date');
    filterModal.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    search.focus();
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-chart-filter]');
    if (!trigger) return;
    event.preventDefault();
    open(trigger);
  });

  filterModal.addEventListener('click', function (event) {
    if (event.target.closest('[data-chart-filter-close], [data-chart-filter-apply]')) {
      close();
    } else if (event.target.closest('[data-chart-filter-reset]')) {
      search.value = '';
      close();
    }
  });

  filterModal.querySelector('[data-chart-static-search-form]').addEventListener('submit', function (event) {
    event.preventDefault();
  });

  document.addEventListener('keydown', function (event) {
    if (filterModal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
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

  window.BNTChartFilter = { open, close };
}());
