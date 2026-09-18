(function initPaymentAnalytics() {
  const page = document.querySelector('.budget-payments-page');
  const root = page && page.querySelector('[data-payment-analytics]');
  const deviationRoot = page && page.querySelector('[data-payment-deviation]');
  const riskRoot = page && page.querySelector('[data-payment-risk-map]');
  const riskScroller = riskRoot && riskRoot.querySelector('[data-payment-risk-scroll]');
  const riskColumn = riskRoot && riskRoot.querySelector('[data-payment-risk-column]');
  if (!page) return;

  const numberFormatter = new Intl.NumberFormat('ru-RU');
  const datasets = {
    statuses: {
      accessibleLabel: 'Статусы исполнения платежей за сентябрь 2025 года',
      centerValue: '77',
      startAngle: -16.36,
      data: [
        { label: 'Просрочено (не закрыты, срок истёк)', value: 7, percent: '9,09%', className: 'series-negative' },
        { label: 'Выполнено вовремя', value: 38, percent: '49,35%', className: 'series-gas' },
        { label: 'Выполнено с просрочкой', value: 7, percent: '9,09%', className: 'series-orange' },
        { label: 'В работе', value: 19, percent: '24,68%', className: 'series-crude' },
        { label: 'На контроле (<7 дней до срока)', value: 6, percent: '7,79%', className: 'series-dark' }
      ],
      legendOrder: ['В работе', 'Выполнено вовремя', 'Выполнено с просрочкой', 'На контроле (<7 дней до срока)', 'Просрочено (не закрыты, срок истёк)']
    },
    budget: {
      accessibleLabel: 'Исполнение бюджета по обязательствам за январь — сентябрь 2025 года',
      centerValue: '1 000M',
      startAngle: -9,
      data: [
        { label: 'Остаток', value: 2360000000, weight: 5, percent: '5,00%', className: 'series-orange' },
        { label: 'Исполнено (оплачено)', value: 12870000000, weight: 78, percent: '78,00%', className: 'series-gas' },
        { label: 'В обязательствах', value: 3220000000, weight: 17, percent: '17,00%', className: 'series-negative' }
      ],
      legendOrder: ['Исполнено (оплачено)', 'В обязательствах', 'Остаток']
    }
  };
  const deviationDatasets = {
    departments: {
      axisMax: 600000000,
      axisStep: 100000000,
      accessibleLabel: 'График отклонений плана и факта по подразделениям',
      rows: [
        { label: 'Производственный департамент', plan: 520000000, fact: 495000000 },
        { label: 'Технический департамент', plan: 440000000, fact: 485000000 },
        { label: 'Цех КИПиА', plan: 360000000, fact: 410000000 },
        { label: 'Логистика и склад', plan: 310000000, fact: 330000000 },
        { label: 'Энергетики', plan: 260000000, fact: 280000000 }
      ]
    },
    categories: {
      axisMax: 400000000,
      axisStep: 50000000,
      accessibleLabel: 'График отклонений плана и факта по категориям ТРУ',
      rows: [
        { label: 'Электрооборудование', plan: 310000000, fact: 295000000 },
        { label: 'Механика', plan: 270000000, fact: 280000000 },
        { label: 'КИПиА', plan: 240000000, fact: 250000000 },
        { label: 'Металлопрокат', plan: 210000000, fact: 195000000 },
        { label: 'Сервисные услуги', plan: 180000000, fact: 165000000 }
      ]
    }
  };
  const upcomingPaymentsData = [
    { label: '30 дней', plan: 260000000, fact: 240000000 },
    { label: '60 дней', plan: 220000000, fact: 190000000 },
    { label: '90 дней', plan: 240000000, fact: 140000000 }
  ];
  let activeDeviationDataset = 'departments';

  function closeDeviationInfo() {
    const button = deviationRoot && deviationRoot.querySelector('[data-payment-deviation-info]');
    const popover = deviationRoot && deviationRoot.querySelector('[data-payment-deviation-info-popover]');
    if (button) button.setAttribute('aria-expanded', 'false');
    if (popover) popover.hidden = true;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function getLegendData(config) {
    return config.legendOrder.map(function (label) {
      return config.data.find(function (item) { return item.label === label; });
    }).filter(Boolean);
  }

  function renderCard(key) {
    if (!root || !window.BNTCharts || typeof window.BNTCharts.renderDonut !== 'function') return;
    const config = datasets[key];
    const chart = root.querySelector(`[data-payment-donut="${key}"]`);
    const legend = root.querySelector(`[data-payment-legend="${key}"]`);
    const legendData = getLegendData(config);

    window.BNTCharts.renderDonut({
      chart,
      legend,
      data: config.data,
      legendData,
      accessibleLabel: config.accessibleLabel,
      centerValue: config.centerValue,
      startAngle: config.startAngle,
      unit: ''
    });
  }

  function renderAll() {
    Object.keys(datasets).forEach(renderCard);
  }

  function renderDeviationChart(key) {
    if (!deviationRoot) return;
    const config = deviationDatasets[key] || deviationDatasets.departments;
    const chart = deviationRoot.querySelector('[data-payment-deviation-chart]');
    const panel = deviationRoot.querySelector('#payment-deviation-panel');
    if (!chart) return;

    const tickCount = Math.round(config.axisMax / config.axisStep) + 1;
    const ticks = Array.from({ length: tickCount }, function (_, index) {
      const value = index * config.axisStep;
      return `<span>${value === 0 ? '0' : `${value / 1000000}M`}</span>`;
    }).join('');
    const grid = Array.from({ length: tickCount - 1 }, function () { return '<span></span>'; }).join('');
    const rows = config.rows.map(function (row) {
      const label = escapeHtml(row.label);
      const planWidth = row.plan / config.axisMax * 100;
      const factWidth = row.fact / config.axisMax * 100;
      const planAmount = numberFormatter.format(row.plan);
      const factAmount = numberFormatter.format(row.fact);
      return `
        <div class="payment-deviation-chart__row" role="img" aria-label="${label}: план ${planAmount} KZT, факт ${factAmount} KZT">
          <span class="payment-deviation-chart__label" title="${label}">${label}</span>
          <span class="payment-deviation-chart__tracks" aria-hidden="true">
            <span class="payment-deviation-chart__track" style="--payment-deviation-value:${planWidth}%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--plan"></i><strong class="payment-deviation-chart__value">${planAmount}</strong></span>
            <span class="payment-deviation-chart__track" style="--payment-deviation-value:${factWidth}%"><i class="payment-deviation-chart__bar payment-deviation-chart__bar--fact"></i><strong class="payment-deviation-chart__value">${factAmount}</strong></span>
          </span>
        </div>`;
    }).join('');

    chart.style.setProperty('--payment-deviation-divisions', String(tickCount - 1));
    chart.setAttribute('aria-label', config.accessibleLabel);
    chart.innerHTML = `<div class="payment-deviation-chart__axis" aria-hidden="true">${ticks}</div><div class="payment-deviation-chart__body"><div class="payment-deviation-chart__grid" aria-hidden="true">${grid}</div><div class="payment-deviation-chart__rows">${rows}</div></div>`;
    if (panel) panel.setAttribute('aria-labelledby', `payment-deviation-${key}-tab`);
    activeDeviationDataset = key;
  }

  function renderRiskChart() {
    const chart = riskRoot && riskRoot.querySelector('[data-payment-risk-chart]');
    if (!chart) return;

    const width = 720;
    const height = 360;
    const margin = { top: 38, right: 18, bottom: 54, left: 58 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const plotBottom = height - margin.bottom;
    const axisMax = 300000000;
    const tickStep = 75000000;
    const groupWidth = plotWidth / upcomingPaymentsData.length;
    const barWidth = 38;
    const barGap = 8;
    const svg = [];

    for (let value = 0; value <= axisMax; value += tickStep) {
      const y = plotBottom - value / axisMax * plotHeight;
      const label = value === 0 ? '0' : `${numberFormatter.format(value / 1000000)}M`;
      svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/>`);
      svg.push(`<text class="chart-bars__tick" x="${margin.left - 12}" y="${y + 5}" text-anchor="end">${label}</text>`);
    }

    for (let index = 0; index <= upcomingPaymentsData.length; index += 1) {
      const x = margin.left + groupWidth * index;
      svg.push(`<line class="chart-bars__vertical-line" x1="${x}" y1="${margin.top}" x2="${x}" y2="${plotBottom}"/>`);
    }
    svg.push(`<line class="chart-bars__axis-line" x1="${margin.left}" y1="${plotBottom}" x2="${width - margin.right}" y2="${plotBottom}"/>`);

    upcomingPaymentsData.forEach(function (item, index) {
      const centerX = margin.left + groupWidth * (index + .5);
      const bars = [
        { kind: 'plan', label: 'план', value: item.plan },
        { kind: 'fact', label: 'факт', value: item.fact }
      ];
      const pairWidth = barWidth * bars.length + barGap;
      const pairStart = centerX - pairWidth / 2;

      bars.forEach(function (bar, barIndex) {
        const barHeight = bar.value / axisMax * plotHeight;
        const x = pairStart + barIndex * (barWidth + barGap);
        const y = plotBottom - barHeight;
        const valueLabel = `${numberFormatter.format(bar.value / 1000000)}M`;
        svg.push(`<rect class="chart-bars__segment payment-risk-chart__bar--${bar.kind}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" tabindex="0" role="img" aria-label="${item.label}, ${bar.label}: ${numberFormatter.format(bar.value)} KZT"/>`);
        svg.push(`<text class="payment-risk-chart__value" x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle">${valueLabel}</text>`);
      });

      svg.push(`<text class="chart-bars__category" x="${centerX}" y="${plotBottom + 32}" text-anchor="middle">${item.label}</text>`);
    });

    chart.innerHTML = svg.join('');
  }

  function updateRiskScrollFades() {
    if (!riskScroller || !riskColumn) return;
    const maxScroll = Math.max(0, riskScroller.scrollHeight - riskScroller.clientHeight);
    riskColumn.classList.toggle('has-fade-top', riskScroller.scrollTop > 1);
    riskColumn.classList.toggle('has-fade-bottom', maxScroll - riskScroller.scrollTop > 1);
  }

  function toast(title, message) {
    if (window.BNTUI && typeof window.BNTUI.toast === 'function') window.BNTUI.toast(title, message);
  }

  function downloadCsv(key) {
    const config = datasets[key];
    const rows = [['Показатель', 'Значение', 'Доля']].concat(config.data.map(function (item) {
      return [item.label, item.value, item.percent];
    }));
    const csv = rows.map(function (row) {
      return row.map(function (value) { return `"${String(value).replaceAll('"', '""')}"`; }).join(';');
    }).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = key === 'statuses' ? 'payment-statuses-2025-09.csv' : 'budget-obligations-2025-09.csv';
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadDeviationCsv() {
    const config = deviationDatasets[activeDeviationDataset];
    const rows = [['Показатель', 'План, KZT', 'Факт, KZT']].concat(config.rows.map(function (row) {
      return [row.label, row.plan, row.fact];
    }));
    const csv = rows.map(function (row) {
      return row.map(function (value) { return `"${String(value).replaceAll('"', '""')}"`; }).join(';');
    }).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-deviation-${activeDeviationDataset}-2025-09.csv`;
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadRiskCsv() {
    const rows = [['Период', 'План, KZT', 'Факт, KZT']].concat(upcomingPaymentsData.map(function (item) {
      return [item.label, item.plan, item.fact];
    }));
    const csv = rows.map(function (row) {
      return row.map(function (value) { return `"${String(value).replaceAll('"', '""')}"`; }).join(';');
    }).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payment-risks-upcoming-2025-09.csv';
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  page.addEventListener('click', function (event) {
    const clearButton = event.target.closest('[data-payment-filter-clear]');
    if (clearButton) {
      const card = clearButton.closest('[data-payment-chart-card]');
      clearButton.closest('.pill')?.remove();
      const counter = card?.querySelector('.button-smallest-secondary-radius__counter');
      if (counter) counter.textContent = String(card.querySelectorAll('.chart-card__filters .pill').length);
      return;
    }

    const tab = event.target.closest('[data-payment-deviation-tab]');
    if (tab) {
      deviationRoot.querySelectorAll('[data-payment-deviation-tab]').forEach(function (button) {
        const active = button === tab;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      renderDeviationChart(tab.dataset.paymentDeviationTab);
      return;
    }

    if (event.target.closest('[data-payment-deviation-info-close]')) {
      closeDeviationInfo();
      return;
    }

    const infoButton = event.target.closest('[data-payment-deviation-info]');
    if (infoButton) {
      const popover = deviationRoot.querySelector('[data-payment-deviation-info-popover]');
      const opening = Boolean(popover && popover.hidden);
      closeDeviationInfo();
      if (popover) popover.hidden = !opening;
      infoButton.setAttribute('aria-expanded', String(opening));
      return;
    }

    const filterButton = event.target.closest('[data-payment-filter]');
    if (filterButton) {
      const count = filterButton.querySelector('.button-smallest-secondary-radius__counter')?.textContent || '0';
      toast('Фильтр', `Выбрано параметров: ${count}`);
      return;
    }

    const exportButton = event.target.closest('[data-payment-export]');
    if (exportButton) {
      if (exportButton.dataset.paymentExport === 'deviation') downloadDeviationCsv();
      else if (exportButton.dataset.paymentExport === 'risk-map') downloadRiskCsv();
      else downloadCsv(exportButton.dataset.paymentExport);
      toast('Экспорт', 'Данные диаграммы скачаны в CSV');
    }
  });

  deviationRoot?.addEventListener('keydown', function (event) {
    const current = event.target.closest('[data-payment-deviation-tab]');
    if (!current || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const tabs = Array.from(deviationRoot.querySelectorAll('[data-payment-deviation-tab]'));
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(tabs.indexOf(current) + direction + tabs.length) % tabs.length];
    next.focus();
    next.click();
  });

  document.addEventListener('click', function (event) {
    if (!event.target.closest('[data-payment-deviation-info-wrap]')) closeDeviationInfo();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDeviationInfo();
  });

  renderAll();
  renderDeviationChart(activeDeviationDataset);
  renderRiskChart();
  window.requestAnimationFrame(updateRiskScrollFades);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderAll);

  riskScroller?.addEventListener('scroll', updateRiskScrollFades, { passive: true });

  if (typeof ResizeObserver === 'function') {
    let resizeFrame = 0;
    const observer = new ResizeObserver(function () {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(renderAll);
    });
    root?.querySelectorAll('.chart-donut__viewport').forEach(function (viewport) { observer.observe(viewport); });

    const riskObserver = new ResizeObserver(updateRiskScrollFades);
    if (riskScroller) riskObserver.observe(riskScroller);
    const riskList = riskScroller && riskScroller.querySelector('.payment-risk-list');
    if (riskList) riskObserver.observe(riskList);
  }
}());
