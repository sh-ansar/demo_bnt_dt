(function initContractsDashboard() {
  const page = document.querySelector('.contracts-page');
  const supplierRoot = page && page.querySelector('[data-contract-suppliers]');
  if (!page) return;

  const numberFormatter = new Intl.NumberFormat('ru-RU');
  const donutDatasets = {
    execution: {
      accessibleLabel: 'Исполнение договоров за январь — сентябрь 2025 года',
      centerValue: '18 450M',
      startAngle: 0,
      data: [
        { label: 'Исполнено (оплачено)', value: 12870000000, percent: '69,76%', className: 'series-gas' },
        { label: 'В обязательствах', value: 3220000000, percent: '17,45%', className: 'series-negative' },
        { label: 'Остаток', value: 2360000000, percent: '12,79%', className: 'series-orange' }
      ]
    },
    issues: {
      accessibleLabel: 'Отклонения и проблемные зоны за сентябрь 2025 года',
      centerValue: '30',
      startAngle: 0,
      data: [
        { label: 'Просроченные оплаты', value: 5, percent: '16,67%', className: 'series-negative' },
        { label: 'Превышение бюджета', value: 3, percent: '10,00%', className: 'series-orange' },
        { label: 'Частые корректировки (3+ доп. соглашения)', value: 7, percent: '23,33%', className: 'series-soft-blue' },
        { label: 'Риск по поставщику (задержка >30 дней)', value: 11, percent: '36,67%', className: 'series-crude' },
        { label: 'Резкие изменения цен', value: 4, percent: '13,33%', className: 'series-secondary' }
      ]
    },
    'type-count': {
      accessibleLabel: 'Распределение договоров по типам и количеству',
      centerValue: '249',
      startAngle: 0,
      data: [
        { label: 'Разовые', value: 95, percent: '38,15%', className: 'series-secondary' },
        { label: 'Рамочные', value: 60, percent: '24,10%', className: 'series-gas' },
        { label: 'Периодические', value: 50, percent: '20,08%', className: 'series-crude' },
        { label: 'Сервисные', value: 44, percent: '17,67%', className: 'series-orange' }
      ]
    },
    'type-amount': {
      accessibleLabel: 'Распределение договоров по типам и суммам',
      centerValue: '12 930M',
      startAngle: 0,
      data: [
        { label: 'Разовые', value: 4070000000, percent: '31,48%', className: 'series-secondary' },
        { label: 'Рамочные', value: 1200000000, percent: '9,28%', className: 'series-gas' },
        { label: 'Периодические', value: 4100000000, percent: '31,71%', className: 'series-crude' },
        { label: 'Сервисные', value: 3560000000, percent: '27,53%', className: 'series-orange' }
      ]
    }
  };

  const suppliers = [
    { label: 'ТОО «KazTechSupply»', contracts: 840000000, paid: 620000000 },
    { label: 'ТОО «EnergoProm»', contracts: 620000000, paid: 450000000 },
    { label: '«ArmaTech KZ»', contracts: 540000000, paid: 390000000 },
    { label: '«MechTorg Group»', contracts: 480000000, paid: 360000000 },
    { label: '«FilterPro Asia»', contracts: 410000000, paid: 265000000 }
  ];

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderDonut(key) {
    if (!window.BNTCharts || typeof window.BNTCharts.renderDonut !== 'function') return;
    const config = donutDatasets[key];
    const chart = page.querySelector(`[data-contract-donut="${key}"]`);
    const legend = page.querySelector(`[data-contract-legend="${key}"]`);

    window.BNTCharts.renderDonut({
      chart,
      legend,
      data: config.data,
      accessibleLabel: config.accessibleLabel,
      centerValue: config.centerValue,
      startAngle: config.startAngle,
      unit: ''
    });
  }

  function renderDonuts() {
    Object.keys(donutDatasets).forEach(renderDonut);
  }

  function renderSuppliers() {
    const chart = supplierRoot && supplierRoot.querySelector('[data-contract-suppliers-chart]');
    if (!chart) return;

    const axisMax = 1000000000;
    const axisStep = 200000000;
    const tickCount = Math.round(axisMax / axisStep) + 1;
    const ticks = Array.from({ length: tickCount }, function (_, index) {
      const value = index * axisStep;
      return `<span>${value === 0 ? '0' : `${numberFormatter.format(value / 1000000)}M`}</span>`;
    }).join('');
    const grid = Array.from({ length: tickCount - 1 }, function () { return '<span></span>'; }).join('');
    const rows = suppliers.map(function (supplier) {
      const label = escapeHtml(supplier.label);
      const contractsWidth = supplier.contracts / axisMax * 100;
      const paidWidth = supplier.paid / axisMax * 100;
      const contractsAmount = numberFormatter.format(supplier.contracts);
      const paidAmount = numberFormatter.format(supplier.paid);

      return `
        <div class="payment-deviation-chart__row" role="img" aria-label="${label}: сумма договоров ${contractsAmount} KZT, оплачено ${paidAmount} KZT">
          <span class="payment-deviation-chart__label" title="${label}">${label}</span>
          <span class="payment-deviation-chart__tracks" aria-hidden="true">
            <span class="payment-deviation-chart__track" style="--payment-deviation-value:${contractsWidth}%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--fact"></i><strong class="payment-deviation-chart__value">${contractsAmount}</strong></span>
            <span class="payment-deviation-chart__track" style="--payment-deviation-value:${paidWidth}%"><i class="payment-deviation-chart__bar series-gas"></i><strong class="payment-deviation-chart__value">${paidAmount}</strong></span>
          </span>
        </div>`;
    }).join('');

    chart.style.setProperty('--payment-deviation-divisions', String(tickCount - 1));
    chart.innerHTML = `<div class="payment-deviation-chart__axis" aria-hidden="true">${ticks}</div><div class="payment-deviation-chart__body"><div class="payment-deviation-chart__grid" aria-hidden="true">${grid}</div><div class="payment-deviation-chart__rows">${rows}</div></div>`;
  }

  function closeInfo() {
    const button = supplierRoot && supplierRoot.querySelector('[data-contract-info]');
    const popover = supplierRoot && supplierRoot.querySelector('[data-contract-info-popover]');
    if (button) button.setAttribute('aria-expanded', 'false');
    if (popover) popover.hidden = true;
  }

  function toast(title, message) {
    if (window.BNTUI && typeof window.BNTUI.toast === 'function') window.BNTUI.toast(title, message);
  }

  page.addEventListener('click', function (event) {
    const clearButton = event.target.closest('[data-contract-filter-clear]');
    if (clearButton) {
      clearButton.closest('.pill')?.remove();
      toast('Фильтр', 'Период удалён');
      return;
    }

    const infoButton = event.target.closest('[data-contract-info]');
    if (infoButton) {
      const popover = supplierRoot && supplierRoot.querySelector('[data-contract-info-popover]');
      const opening = infoButton.getAttribute('aria-expanded') !== 'true';
      if (popover) popover.hidden = !opening;
      infoButton.setAttribute('aria-expanded', String(opening));
      return;
    }

    if (event.target.closest('[data-contract-info-close]')) {
      closeInfo();
      return;
    }

    const filterButton = event.target.closest('[data-contract-filter]');
    if (filterButton) {
      const count = filterButton.querySelector('.button-smallest-secondary-radius__counter')?.textContent || '0';
      toast('Фильтр', `Выбрано параметров: ${count}`);
      return;
    }

    if (event.target.closest('[data-contract-export]')) {
      toast('Экспорт', 'Данные диаграммы подготовлены к выгрузке');
    }
  });

  document.addEventListener('click', function (event) {
    if (!event.target.closest('[data-contract-info-wrap]')) closeInfo();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeInfo();
  });

  renderDonuts();
  renderSuppliers();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderDonuts);

  if (typeof ResizeObserver === 'function') {
    let resizeFrame = 0;
    const observer = new ResizeObserver(function () {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(renderDonuts);
    });
    page.querySelectorAll('.chart-donut__viewport').forEach(function (viewport) { observer.observe(viewport); });
  }
}());
