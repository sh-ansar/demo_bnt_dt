(function () {
  const original = JSON.parse(JSON.stringify(window.BNT_DATA.logistics));
  let data = JSON.parse(JSON.stringify(original));
  const ui = window.BNTUI;
  const numberFormatter = new Intl.NumberFormat('ru-RU');
  const textCollator = new Intl.Collator('ru-RU', { numeric: true, sensitivity: 'base' });
  let wagonSort = { key: null, direction: 'default' };

  const chartConfigs = {
    products: {
      title: 'Входящий объём по продукту',
      description: 'Суммарный входящий объём по недельному плану подачи вагонов.',
      scaleMax: 1600,
      tickCount: 5,
      fileName: 'incoming-volume-by-product.csv'
    },
    capacities: {
      title: 'Свободная ёмкость резервуаров',
      description: 'Доступная ёмкость по секциям и резервуарному парку на текущую дату.',
      scaleMax: 45000,
      tickCount: 4,
      percentBase: 35000,
      fileName: 'free-tank-capacity.csv'
    }
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function wagonSortValue(row, key) {
    if (key === 'date') {
      const parts = String(row.date).split('.').map(Number);
      return (parts[1] || 0) * 100 + (parts[0] || 0);
    }
    return row[key];
  }

  function sortedWagons() {
    const rows = [...data.wagons];
    if (!wagonSort.key || wagonSort.direction === 'default') return rows;

    const direction = wagonSort.direction === 'descending' ? -1 : 1;
    return rows.sort(function (left, right) {
      const leftValue = wagonSortValue(left, wagonSort.key);
      const rightValue = wagonSortValue(right, wagonSort.key);
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : textCollator.compare(String(leftValue), String(rightValue));
      return comparison * direction;
    });
  }

  function updateWagonSortControls() {
    document.querySelectorAll('[data-logistics-sort]').forEach(function (button) {
      const active = button.dataset.logisticsSort === wagonSort.key;
      const direction = active ? wagonSort.direction : 'default';
      const icon = direction === 'descending'
        ? 'SortDescending'
        : direction === 'ascending'
          ? 'SortAscending'
          : 'SortDefault';
      const nextLabel = direction === 'descending'
        ? 'от меньшего к большему'
        : direction === 'ascending'
          ? 'по умолчанию'
          : 'от большего к меньшему';

      button.dataset.sortDirection = direction;
      button.setAttribute('aria-label', `Сортировать ${button.dataset.sortLabel} ${nextLabel}`);
      button.closest('th')?.setAttribute('aria-sort', direction === 'default' ? 'none' : direction);
      button.querySelector('use')?.setAttribute('href', `/assets/icons/financial-interface.svg?v=5#${icon}`);
    });
  }

  function queueTone(value) {
    return value > 7 ? 'is-negative' : value > 4 ? 'is-warning' : 'is-positive';
  }

  function chartRows(type) {
    return type === 'products' ? data.products : data.capacities;
  }

  function renderBarChart(host, rows, config) {
    if (!host) return;

    const ticks = Array.from({ length: config.tickCount }, function (_, index) {
      return numberFormatter.format(config.scaleMax * index / (config.tickCount - 1));
    });

    const bars = rows.map(function (row) {
      const label = String(row[0]);
      const value = Number(row[1]);
      const width = Math.min(100, Math.max(0, value / config.scaleMax * 100));
      const labelHtml = label === 'Восточный парк' ? 'Восточный<br>парк' : escapeHtml(label);
      const percent = config.percentBase
        ? `<span>${Math.round(value / config.percentBase * 100)}%</span><span aria-hidden="true">·</span>`
        : '';

      return `<div class="logistics-bar-row typography-body-smallest" role="img" aria-label="${escapeHtml(`${label}: ${numberFormatter.format(value)} м³`)}">
        <span class="logistics-bar-row__label">${labelHtml}</span>
        <span class="logistics-bar-row__track" style="--logistics-bar-value:${width}%" aria-hidden="true">
          <i class="logistics-bar-row__fill"></i>
          <span class="logistics-bar-row__value">${percent}<strong>${numberFormatter.format(value)}</strong></span>
        </span>
      </div>`;
    }).join('');

    host.innerHTML = `<div class="logistics-bar-scale" aria-hidden="true">${ticks.map(function (tick) {
      return `<span>${tick}</span>`;
    }).join('')}</div>
      <div class="logistics-bar-grid" aria-hidden="true">${ticks.map(function () {
        return '<span></span>';
      }).join('')}</div>
      <div class="logistics-bar-rows">${bars}</div>`;

    function syncLabelWidth() {
      const labels = Array.from(host.querySelectorAll('.logistics-bar-row__label'));
      const width = labels.reduce(function (maxWidth, label) {
        const range = document.createRange();
        range.selectNodeContents(label);
        const lineWidth = Array.from(range.getClientRects()).reduce(function (maxLineWidth, rect) {
          return Math.max(maxLineWidth, rect.width);
        }, 0);
        return Math.max(maxWidth, lineWidth);
      }, 0);
      host.style.setProperty('--logistics-label-width', `${width ? Math.ceil(width) : 0}px`);
    }

    syncLabelWidth();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncLabelWidth);
  }

  function renderAnalytics() {
    renderBarChart(document.getElementById('product-volume'), data.products, chartConfigs.products);
    renderBarChart(document.getElementById('tank-capacity'), data.capacities, chartConfigs.capacities);
  }

  function render() {
    const total = data.wagons.reduce((sum, row) => sum + row.wagons, 0);
    const confirmed = data.wagons
      .filter(row => row.status !== 'План')
      .reduce((sum, row) => sum + row.wagons, 0);
    const volume = data.wagons.reduce((sum, row) => sum + row.volume, 0);
    const maxQueue = Math.max(...data.wagons.map(row => row.queue));
    const confirmedPercent = total ? Math.round(confirmed / total * 100) : 0;

    document.getElementById('logistics-kpis').innerHTML = `
      <article class="analytics-kpi">
        <div class="analytics-kpi__heading">
          <span class="analytics-kpi__label typography-body-smallest">ВСЕГО ВАГОНОВ</span>
          <div class="financial-kpi__info-wrap" data-logistics-popover-root>
            <button class="analytics-kpi__info" type="button" data-logistics-popover-trigger aria-expanded="false" aria-controls="logistics-total-info" aria-label="Информация об общем количестве вагонов">
              <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Info"></use></svg>
            </button>
            <div id="logistics-total-info" class="origin-breakdown__info-popover logistics-kpi-popover" data-logistics-popover role="dialog" aria-label="О количестве вагонов" hidden>
              <button class="origin-breakdown__info-close" type="button" data-logistics-popover-close aria-label="Закрыть информацию"><svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button>
              <p class="typography-body-smallest">Расчёт общего плана подачи на ближайшие 7 дней.</p>
            </div>
          </div>
        </div>
        <div class="kpi-card__body">
          <strong class="analytics-kpi__value typography-label-base">${total}</strong>
          <p class="analytics-kpi__context typography-body-smallest">Расчёт плана на 7 дней</p>
        </div>
      </article>

      <article class="payment-summary-card payment-summary-card--brand">
        <header class="payment-summary-card__heading">
          <h2 class="payment-summary-card__title typography-body-smallest">ПОДТВЕРЖДЕНО</h2>
          <a class="payment-summary-card__link" href="#wagon-plan" aria-label="Перейти к плану подачи вагонов">
            <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#ArrowUpRight"></use></svg>
          </a>
        </header>
        <div class="payment-summary-card__content">
          <div class="payment-progress-ring" role="img" aria-label="Подтверждено ${confirmedPercent} процентов общего плана">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <circle class="payment-progress-ring__track" cx="24" cy="24" r="20"></circle>
              <circle class="payment-progress-ring__bar" cx="24" cy="24" r="20" pathLength="100" stroke-dasharray="${confirmedPercent} 100" transform="rotate(-90 24 24)"></circle>
            </svg>
            <strong class="payment-progress-ring__value typography-label-smallest">${confirmedPercent}%</strong>
          </div>
          <div class="payment-summary-card__copy">
            <strong class="payment-summary-card__amount typography-label-base">${confirmed} вагонов</strong>
            <span class="payment-summary-card__description typography-body-smallest">Общий план ${total}</span>
          </div>
        </div>
      </article>

      <article class="analytics-kpi">
        <div class="analytics-kpi__heading">
          <span class="analytics-kpi__label typography-body-smallest">ВХОДЯЩИЙ ОБЪЁМ</span>
          <div class="financial-kpi__info-wrap" data-logistics-popover-root>
            <button class="analytics-kpi__info" type="button" data-logistics-popover-trigger aria-expanded="false" aria-controls="logistics-volume-info" aria-label="Информация о входящем объёме">
              <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Info"></use></svg>
            </button>
            <div id="logistics-volume-info" class="origin-breakdown__info-popover logistics-kpi-popover" data-logistics-popover role="dialog" aria-label="О входящем объёме" hidden>
              <button class="origin-breakdown__info-close" type="button" data-logistics-popover-close aria-label="Закрыть информацию"><svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button>
              <p class="typography-body-smallest">Суммарный объём нефтепродуктов по недельному плану подачи.</p>
            </div>
          </div>
        </div>
        <div class="kpi-card__body">
          <strong class="analytics-kpi__value typography-label-base">${numberFormatter.format(volume)} м³</strong>
          <p class="analytics-kpi__context typography-body-smallest">4 продукта</p>
        </div>
      </article>

      <article class="analytics-kpi">
        <div class="analytics-kpi__heading">
          <span class="analytics-kpi__label typography-body-smallest">ПРОГНОЗ ОЧЕРЕДИ</span>
          <a class="payment-summary-card__link" href="#logistics-warnings" aria-label="Перейти к предупреждениям">
            <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#ArrowUpRight"></use></svg>
          </a>
        </div>
        <div class="kpi-card__body">
          <strong class="analytics-kpi__value typography-label-base ${maxQueue > 7 ? 'is-negative' : ''}">${maxQueue} ч</strong>
          <p class="analytics-kpi__context typography-body-smallest">${maxQueue > 7 ? 'Требует решения' : 'В норме'}</p>
        </div>
      </article>`;

    document.getElementById('wagon-plan').innerHTML = sortedWagons().map(row => `<tr>
      <td>${escapeHtml(row.date)}</td>
      <td><strong>${escapeHtml(row.product)}</strong></td>
      <td class="analytics-table__numeric-cell">${numberFormatter.format(row.wagons)}</td>
      <td class="analytics-table__numeric-cell"><div class="table-header-content table-header-content--numeric"><strong>${numberFormatter.format(row.volume)}</strong><small>м³</small></div></td>
      <td>${ui.badge(row.status, row.status === 'Разгрузка' ? 'green' : row.status === 'В пути' ? 'orange' : row.status === 'План' ? 'purple' : '')}</td>
      <td>${escapeHtml(row.section)}</td>
      <td class="analytics-table__numeric-cell"><div class="table-header-content table-header-content--numeric"><strong class="analytics-table__risk-value ${queueTone(row.queue)}">${numberFormatter.format(row.queue)}</strong><small>часы</small></div></td>
    </tr>`).join('');
    updateWagonSortControls();

    document.getElementById('logistics-warnings').innerHTML = data.warnings.map(warning => `<article class="logistics-alert logistics-alert--${warning.tone}">
      <span class="logistics-alert__marker" aria-hidden="true"></span>
      <div class="table-cell-content">
        <strong class="typography-label-smallest">${escapeHtml(warning.title)}</strong>
        <span class="typography-body-smallest">${escapeHtml(warning.text)}</span>
      </div>
    </article>`).join('');
    renderAnalytics();
  }

  function act(action) {
    if (action === 'reset') data = JSON.parse(JSON.stringify(original));
    if (action === 'transfer') {
      data.wagons[5].wagons = 0;
      data.wagons[5].volume = 0;
      data.wagons[3].queue = 4;
      data.wagons[5].queue = 0;
      data.warnings = data.warnings.filter((_, index) => index !== 2);
    }
    if (action === 'section2') {
      data.wagons.filter(row => row.section === 'Секция 1').slice(-2).forEach(row => {
        row.section = 'Секция 2';
        row.queue = Math.max(0, row.queue - 4);
      });
      data.capacities[0][1] += 840;
      data.capacities[1][1] -= 840;
    }
    if (action === 'merge') {
      data.wagons.forEach(row => { row.queue = Math.max(0, row.queue - 2); });
      data.warnings = [{ tone: 'green', title: 'Окна объединены', text: 'Прогнозируемый простой снижен на 18 часов.' }, ...data.warnings.slice(0, 2)];
    }
    if (action === 'recalculate') {
      data.warnings = [{ tone: 'green', title: 'План пересчитан', text: 'Ограничения ёмкостей и ТОиР учтены.' }, ...data.warnings];
    }

    render();
  }

  function downloadCsv(type) {
    const config = chartConfigs[type];
    if (!config) return;
    const rows = [['Показатель', 'Значение, м³'], ...chartRows(type)];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = config.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function closePopovers() {
    document.querySelectorAll('[data-logistics-popover]').forEach(function (popover) {
      popover.hidden = true;
      const trigger = popover.closest('[data-logistics-popover-root]')?.querySelector('[data-logistics-popover-trigger]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', function (event) {
    const popoverClose = event.target.closest('[data-logistics-popover-close]');
    if (popoverClose) {
      closePopovers();
      return;
    }

    const popoverTrigger = event.target.closest('[data-logistics-popover-trigger]');
    if (popoverTrigger) {
      const popoverRoot = popoverTrigger.closest('[data-logistics-popover-root]');
      const popover = popoverRoot?.querySelector('[data-logistics-popover]');
      const opening = Boolean(popover?.hidden);
      closePopovers();
      if (popover) {
        const counter = popoverRoot.querySelector('.button-smallest-secondary-radius__counter');
        const summary = popover.querySelector('[data-logistics-filter-summary]');
        if (counter && summary) summary.textContent = `Выбрано параметров: ${counter.textContent}`;
        popover.hidden = !opening;
        popoverTrigger.setAttribute('aria-expanded', String(opening));
      }
      return;
    }

    if (!event.target.closest('[data-logistics-popover-root]')) closePopovers();

    const sortButton = event.target.closest('[data-logistics-sort]');
    if (sortButton) {
      const key = sortButton.dataset.logisticsSort;
      const nextDirection = wagonSort.key !== key
        ? 'descending'
        : wagonSort.direction === 'descending'
          ? 'ascending'
          : wagonSort.direction === 'ascending'
            ? 'default'
            : 'descending';

      wagonSort = nextDirection === 'default'
        ? { key: null, direction: 'default' }
        : { key, direction: nextDirection };
      render();
      return;
    }

    const actionButton = event.target.closest('[data-log-action]');
    if (actionButton) {
      act(actionButton.dataset.logAction);
      return;
    }

    const chipClose = event.target.closest('.pill button');
    if (chipClose) {
      const card = chipClose.closest('[data-logistics-overview-card]');
      chipClose.closest('.pill')?.remove();
      const counter = card?.querySelector('.button-smallest-secondary-radius__counter');
      if (counter) counter.textContent = String(Math.max(0, Number(counter.textContent) - 1));
      return;
    }

    const exportButton = event.target.closest('[data-logistics-overview-export]');
    if (exportButton) downloadCsv(exportButton.dataset.logisticsOverviewExport);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closePopovers();
  });

  render();
}());
