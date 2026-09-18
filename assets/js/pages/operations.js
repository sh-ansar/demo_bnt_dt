(function () {
  const viewport = document.querySelector('[data-flow-viewport]');
  const board = document.querySelector('[data-flow-board]');
  const overview = document.querySelector('[data-summary-overview]');
  const primaryHost = document.querySelector('[data-summary-primary]');
  const importHost = document.querySelector('[data-summary-import]');
  const bottomHost = document.querySelector('[data-summary-bottom]');
  const pageContent = document.querySelector('#page-content.operations-page');
  if (!viewport || !board || !overview || !primaryHost || !importHost || !bottomHost || !pageContent) return;

  const assetBase = '/assets/icons/daily-summary/';
  const assetSizes = {
    car: [38, 28],
    storage: [36, 28],
    wagon: [38, 28]
  };

  const topPanels = [
    {
      stationNumber: 1,
      title: 'Станция приема и перевалки СУГ',
      parallel: true,
      facilities: [
        { icon: 'storage', name: 'Наличие', cards: [{ products: ['СУГ'], values: ['1 846'] }] },
        { icon: 'wagon', name: 'Ж/Д Эст. №8', cards: [{ tone: 'incoming', products: ['СУГ'], values: ['428'] }] }
      ]
    },
    {
      stationNumber: 2,
      title: 'Цех приема и распределения импортной<br>нефтепереработки',
      wide: true,
      autoGapAfterFirst: true,
      facilities: [
        { icon: 'storage', name: 'Наличие', cards: [{ products: ['ДТ', 'Бензин'], values: ['2 418', '1 690'] }] },
        { icon: 'wagon', name: 'Ж/Д Эст. №8', cards: [{ tone: 'outgoing', products: ['ДТ', 'Бензин'], values: ['768', '412'] }] },
        { icon: 'car', name: 'Автоналив', cards: [{ tone: 'outgoing', products: ['ДТ', 'Бензин'], values: ['286', '194'] }] }
      ]
    },
    {
      stack: [
        {
          stationNumber: 3,
          title: 'Ст. Холодная Слобода',
          facilities: [{ icon: 'storage', name: 'Наличие', cards: [{ products: ['СУГ'], values: ['932'] }] }]
        },
        {
          stationNumber: 4,
          title: 'Станция Капрешуми',
          facilities: [{ icon: 'storage', name: 'Наличие', cards: [{ products: ['СУГ'], values: ['714'] }] }]
        }
      ]
    }
  ];

  const bottomPanels = [
    {
      stationNumber: 5,
      title: 'Станция приема и перевалки<br>дизельного топлива и керосина',
      facilities: [
        { icon: 'storage', name: 'Наличие', cards: [{ products: ['ДТ', 'Керосин'], values: ['1 326', '584'] }] },
        {
          icon: 'wagon', name: 'Ж/Д Эст. №1', cards: [
            { tone: 'outgoing', products: ['ДТ', 'Керосин'], values: ['742', '318'] },
            { tone: 'incoming', products: ['ДТ', 'Керосин'], values: ['419', '126'] }
          ]
        }
      ]
    },
    {
      stationNumber: 6,
      title: 'Станция приема и перевалки керосина<br>и автобензина',
      facilities: [
        { icon: 'storage', name: 'Наличие', cards: [{ products: ['ДТ', 'Бензин', 'Керосин'], values: ['1 148', '936', '422'] }] },
        {
          icon: 'wagon', name: 'Ж/Д Эст. №5', cards: [
            { tone: 'outgoing', products: ['ДТ', 'Бензин'], values: ['635', '408'] },
            { tone: 'incoming', products: ['ДТ', 'Нафта'], values: ['297', '185'] }
          ]
        }
      ]
    },
    {
      stationNumber: 7,
      title: 'Станция приема и перевалки нефти<br>и мазута',
      facilities: [
        { icon: 'storage', name: 'Наличие', cards: [{ products: ['Мазут', 'Нефть'], values: ['2 746', '1 982'] }] },
        {
          icon: 'wagon', name: 'Ж/Д Эст. №1', cards: [
            { tone: 'outgoing', products: ['Мазут', 'Нефть'], values: ['1 228', '864'] },
            { tone: 'incoming', products: ['Мазут', 'Нефть'], values: ['716', '542'] }
          ]
        }
      ]
    }
  ];

  function metricCard(card) {
    const count = Math.min(3, card.products.length);
    const toneClass = card.tone ? ` metric-card--${card.tone}` : '';
    const directionIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12.8335V3.16683M6 5.16683L8 3.16683L10 5.16683" stroke="currentColor" stroke-width="1.2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const direction = card.tone === 'incoming'
      ? `<span class="metric-direction metric-direction--incoming" aria-hidden="true">${directionIcon}</span>`
      : card.tone === 'outgoing'
        ? `<span class="metric-direction metric-direction--outgoing" aria-hidden="true">${directionIcon}</span>`
        : '';
    const labels = card.products.map((product) => `<span class="metric-label">${product}</span>`).join('');
    const values = card.values.map((value) => `<strong class="metric-value typography-body-smallest">${value}</strong>`).join('');

    return `<div class="metric-card${toneClass}">
      ${direction}
      <div class="metric-grid metric-grid--${count === 1 ? 'one' : count === 2 ? 'two' : 'three'}">${labels}${values}</div>
    </div>`;
  }

  function facility(item) {
    const [width, height] = assetSizes[item.icon];
    const cards = item.cards.map(metricCard).join('');
    return `<div class="flow-facility">
      <div class="flow-identity">
        <img src="${assetBase}${item.icon}.svg" alt="" width="${width}" height="${height}">
        <span>${item.name}</span>
      </div>
      ${item.cards.length > 1 ? `<div class="metric-stack">${cards}</div>` : cards}
    </div>`;
  }

  function panel(item, location) {
    const panelBaseClass = location === 'bottom' ? 'flow-section' : 'flow-panel';
    const panelClass = location === 'bottom'
      ? 'flow-panel--bottom'
      : item.compact
        ? 'flow-panel--compact'
        : 'flow-panel--top';
    const wideClass = item.wide ? ' flow-panel--wide' : '';
    const modifierClass = item.modifier ? ` ${item.modifier}` : '';
    const facilitiesClass = item.parallel ? ' flow-panel__facilities--parallel' : '';
    const sourceAttribute = item.flowSource ? ' data-flow-source' : '';
    const connectionTargetAttribute = Number.isInteger(item.connectionIndex)
      ? ` data-pier-three-target="${item.connectionIndex}"`
      : '';
    const pierTwoTargetAttribute = item.pierTwoTarget ? ' data-pier-two-target' : '';
    const pierOneColdTargetAttribute = item.pierOneColdTarget ? ' data-pier-one-cold-target' : '';
    const stationNumber = Number.isInteger(item.stationNumber)
      ? `<span class="flow-panel__number" aria-label="Станция ${item.stationNumber}">${item.stationNumber}</span>`
      : '';
    const facilities = item.facilities.map(facility);
    if (item.autoGapAfterFirst) facilities.splice(1, 0, '<div class="flow-panel__auto-gap" aria-hidden="true"></div>');
    return `<article class="${panelBaseClass} ${panelClass}${wideClass}${modifierClass}"${sourceAttribute}>
      <h2${connectionTargetAttribute}${pierTwoTargetAttribute}${pierOneColdTargetAttribute}><span>${item.title}</span>${stationNumber}</h2>
      <div class="ui-divider flow-panel__divider"></div>
      <div class="flow-panel__facilities${facilitiesClass}">${facilities.join('')}</div>
    </article>`;
  }

  topPanels[2].stack[1].pierTwoTarget = true;
  topPanels[2].stack[0].pierOneColdTarget = true;

  primaryHost.innerHTML = `${panel({ ...topPanels[0], modifier: 'flow-panel--supply', flowSource: true }, 'top')}
    <div class="daily-summary__storage-grid">
      ${topPanels[2].stack.map((entry) => panel({ ...entry, compact: true }, 'top')).join('')}
    </div>`;
  importHost.innerHTML = panel({ ...topPanels[1], modifier: 'flow-panel--import' }, 'top');
  bottomHost.innerHTML = `<span class="daily-summary__count">9</span>${bottomPanels
    .map((item, index) => panel({ ...item, connectionIndex: index }, 'bottom'))
    .join('')}`;

  const svg = board.querySelector('[data-flow-svg]');
  const path = board.querySelector('[data-flow-path]');
  const pierOneColdPath = board.querySelector('[data-pier-one-cold-path]');
  const importPierOnePath = board.querySelector('[data-import-pier-one-path]');
  const importSvmBranch = board.querySelector('[data-import-svm-branch]');
  const source = board.querySelector('[data-flow-source]');
  const target = board.querySelector('[data-flow-target]');
  const pierOneColdTarget = board.querySelector('[data-pier-one-cold-target]');
  const pierSvmTarget = board.querySelector('[data-pier-svm-target]');
  const importPanel = importHost.querySelector('.flow-panel--import');
  const toggle = board.querySelector('[data-flow-toggle]');
  const symbol = board.querySelector('[data-flow-toggle-symbol]');
  const detail = board.querySelector('[data-flow-detail]');
  const pierTwoSource = board.querySelector('[data-pier-two-source]');
  const pierTwoTarget = board.querySelector('[data-pier-two-target]');
  const pierTwoPath = board.querySelector('[data-pier-two-path]');
  const pierThreeSource = board.querySelector('[data-pier-three-source]');
  const pierThreeTargets = Array.from(board.querySelectorAll('[data-pier-three-target]'));
  const pierThreeSourcePath = board.querySelector('[data-pier-three-source-path]');
  const pierThreeTrunk = board.querySelector('[data-pier-three-trunk]');
  const pierThreeBranches = Array.from(board.querySelectorAll('[data-pier-three-branch]'));
  const summaryToggle = document.querySelector('[data-summary-toggle]');
  const zoomControl = viewport.querySelector('[data-zoom-control]');
  const zoomRange = viewport.querySelector('[data-zoom-range]');
  const zoomOut = viewport.querySelector('[data-zoom-out]');
  const zoomIn = viewport.querySelector('[data-zoom-in]');
  const zoomValue = viewport.querySelector('[data-zoom-value]');
  if (!svg || !path || !pierOneColdPath || !importPierOnePath || !importSvmBranch
    || !source || !target || !pierOneColdTarget || !pierSvmTarget || !importPanel
    || !toggle || !symbol || !detail
    || !pierTwoSource || !pierTwoTarget || !pierTwoPath || !pierThreeSource
    || !pierThreeSourcePath || !pierThreeTrunk || pierThreeTargets.length !== bottomPanels.length
    || pierThreeBranches.length !== bottomPanels.length || !summaryToggle
    || !zoomControl || !zoomRange || !zoomOut || !zoomIn || !zoomValue) return;

  const numberFormatter = new Intl.NumberFormat('ru-RU');

  function availabilityCards(panel) {
    const storageFacility = panel.facilities.find((entry) => entry.icon === 'storage');
    if (!storageFacility) return [];

    return storageFacility.cards.map((card) => ({
      ...card,
      tone: 'outgoing'
    }));
  }

  const primaryRailFacility = topPanels[0].facilities.find((entry) => entry.icon === 'wagon');
  const primaryConnection = {
    title: 'на Причал №1',
    cards: primaryRailFacility.cards
  };
  const pierOneColdStation = topPanels[2].stack[0];
  const pierOneColdConnection = {
    title: 'на Причал №1',
    cards: availabilityCards(pierOneColdStation)
  };
  const pierThreeConnections = bottomPanels.map(function (item) {
    const railFacility = item.facilities.find((entry) => entry.icon === 'wagon');
    return {
      title: 'на Причал №3',
      cards: railFacility.cards
    };
  });
  const pierTwoStation = topPanels[2].stack[1];
  const pierTwoConnection = {
    title: 'на Причал №2',
    cards: availabilityCards(pierTwoStation)
  };

  const pierCardTwoConnection = {
    title: 'Причал №2',
    cards: availabilityCards(pierTwoStation),
    routeSummary: [{ label: 'Выбытие из', stationNumbers: [4] }]
  };

  function totalDirectionByProduct(tone) {
    const totals = new Map();

    bottomPanels.forEach(function (panelItem) {
      const railFacility = panelItem.facilities.find((entry) => entry.icon === 'wagon');
      if (!railFacility) return;

      railFacility.cards
        .filter((card) => card.tone === tone)
        .forEach(function (card) {
          card.products.forEach(function (product, index) {
            const value = Number(String(card.values[index]).replace(/\s/g, ''));
            totals.set(product, (totals.get(product) || 0) + value);
          });
        });
    });

    const directionTotal = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

    return {
      tone,
      products: [...totals.keys(), 'Итого'],
      values: [
        ...Array.from(totals.values(), (value) => numberFormatter.format(value)),
        numberFormatter.format(directionTotal)
      ]
    };
  }

  const pierCardThreeConnection = {
    title: 'Причал №3',
    cards: [
      totalDirectionByProduct('incoming'),
      totalDirectionByProduct('outgoing')
    ],
    routeSummary: [
      { label: 'Поступление из', stationNumbers: [5, 6, 7] },
      { label: 'Выбытие из', stationNumbers: [5, 6, 7] }
    ]
  };

  const importMovementTotals = new Map();
  topPanels[1].facilities
    .filter((facilityItem) => facilityItem.icon !== 'storage')
    .flatMap((facilityItem) => facilityItem.cards)
    .forEach(function (card) {
      card.products.forEach(function (product, index) {
        const value = Number(String(card.values[index]).replace(/\s/g, ''));
        importMovementTotals.set(product, (importMovementTotals.get(product) || 0) + value);
      });
    });
  const importPierConnection = {
    title: 'Цех приема и распределения импортной нефтепереработки',
    cards: [{
      tone: 'outgoing',
      products: Array.from(importMovementTotals.keys()),
      values: Array.from(importMovementTotals.values(), (value) => numberFormatter.format(value))
    }]
  };
  const importSvmConnection = {
    ...importPierConnection,
    title: 'на Причал СВМ'
  };
  const importPierOneConnection = {
    ...importPierConnection,
    title: 'на Причал №1'
  };
  const pierCardOneConnection = {
    title: 'Причал №1',
    cards: [
      ...primaryRailFacility.cards,
      ...availabilityCards(pierOneColdStation),
      ...importPierConnection.cards
    ],
    layout: 'paired-first-row',
    routeSummary: [
      { label: 'Поступление из', stationNumbers: [1] },
      { label: 'Выбытие из', stationNumbers: [2, 3] }
    ]
  };
  const pierCardSvmConnection = {
    ...importPierConnection,
    title: 'Причал СВМ',
    routeSummary: [{ label: 'Выбытие из', stationNumbers: [2] }]
  };

  function detailDirection(card) {
    const count = Math.min(3, card.products.length);
    const directionIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12.8335V3.16683M6 5.16683L8 3.16683L10 5.16683" stroke="currentColor" stroke-width="1.2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const toneClass = card.tone ? ` flow-line-detail__direction--${card.tone}` : '';
    const metrics = card.products.map(function (product, index) {
      return `<div class="flow-line-detail__metric">
        <span class="flow-line-detail__label">${product}</span>
        <div class="flow-line-detail__field-wrap">
          <strong class="flow-line-detail__field typography-body-smallest">${card.values[index]}</strong>
          ${card.tone ? `<i aria-hidden="true">${directionIcon}</i>` : ''}
        </div>
      </div>`;
    }).join('');

    return `<div class="flow-line-detail__direction${toneClass}">
      <div class="flow-line-detail__metric-grid flow-line-detail__metric-grid--${count === 1 ? 'one' : count === 2 ? 'two' : 'three'}">
        ${metrics}
      </div>
    </div>`;
  }

  function renderDetailData(detailElement, connection) {
    const maxColumns = Math.min(3, Math.max(...connection.cards.map((card) => card.products.length)));
    const routeSummary = connection.routeSummary || [];
    const routeHost = detailElement.querySelector('[data-flow-detail-routes]');
    detailElement.classList.toggle(
      'flow-line-detail--paired-first-row',
      connection.layout === 'paired-first-row'
    );
    detailElement.style.width = `${136 + (maxColumns - 1) * 84}px`;
    detailElement.querySelector('h3').textContent = connection.title;
    routeHost.hidden = routeSummary.length === 0;
    routeHost.innerHTML = routeSummary.map((route) => (
      `<span>${route.label} ${route.stationNumbers.join(', ')}</span>`
    )).join('');
    detailElement.querySelector('[data-flow-detail-cards]').innerHTML = connection.cards.map(detailDirection).join('');
  }

  renderDetailData(detail, primaryConnection);

  const pierOneColdDetail = detail.cloneNode(true);
  pierOneColdDetail.removeAttribute('data-flow-detail');
  pierOneColdDetail.setAttribute('data-pier-one-cold-detail', '');
  pierOneColdDetail.hidden = true;
  board.appendChild(pierOneColdDetail);
  renderDetailData(pierOneColdDetail, pierOneColdConnection);

  const importSvmDetail = detail.cloneNode(true);
  importSvmDetail.removeAttribute('data-flow-detail');
  importSvmDetail.setAttribute('data-import-svm-detail', '');
  importSvmDetail.hidden = true;
  board.appendChild(importSvmDetail);
  renderDetailData(importSvmDetail, importSvmConnection);

  const importPierOneDetail = detail.cloneNode(true);
  importPierOneDetail.removeAttribute('data-flow-detail');
  importPierOneDetail.setAttribute('data-import-pier-one-detail', '');
  importPierOneDetail.hidden = true;
  board.appendChild(importPierOneDetail);
  renderDetailData(importPierOneDetail, importPierOneConnection);

  const pierCardOneDetail = detail.cloneNode(true);
  pierCardOneDetail.removeAttribute('data-flow-detail');
  pierCardOneDetail.setAttribute('data-pier-card-one-detail', '');
  pierCardOneDetail.classList.add('flow-line-detail--pier-card');
  pierCardOneDetail.hidden = true;
  board.appendChild(pierCardOneDetail);
  renderDetailData(pierCardOneDetail, pierCardOneConnection);

  const pierCardSvmDetail = detail.cloneNode(true);
  pierCardSvmDetail.removeAttribute('data-flow-detail');
  pierCardSvmDetail.setAttribute('data-pier-card-svm-detail', '');
  pierCardSvmDetail.classList.add('flow-line-detail--pier-card');
  pierCardSvmDetail.hidden = true;
  board.appendChild(pierCardSvmDetail);
  renderDetailData(pierCardSvmDetail, pierCardSvmConnection);

  const pierTwoDetail = detail.cloneNode(true);
  pierTwoDetail.removeAttribute('data-flow-detail');
  pierTwoDetail.setAttribute('data-pier-two-detail', '');
  pierTwoDetail.hidden = true;
  board.appendChild(pierTwoDetail);
  renderDetailData(pierTwoDetail, pierTwoConnection);

  const pierThreeDetail = detail.cloneNode(true);
  pierThreeDetail.removeAttribute('data-flow-detail');
  pierThreeDetail.setAttribute('data-pier-three-detail', '');
  pierThreeDetail.hidden = true;
  board.appendChild(pierThreeDetail);

  const pierCardTwoDetail = detail.cloneNode(true);
  pierCardTwoDetail.removeAttribute('data-flow-detail');
  pierCardTwoDetail.setAttribute('data-pier-card-two-detail', '');
  pierCardTwoDetail.classList.add('flow-line-detail--pier-card');
  pierCardTwoDetail.hidden = true;
  board.appendChild(pierCardTwoDetail);
  renderDetailData(pierCardTwoDetail, pierCardTwoConnection);

  const pierCardThreeDetail = detail.cloneNode(true);
  pierCardThreeDetail.removeAttribute('data-flow-detail');
  pierCardThreeDetail.setAttribute('data-pier-card-three-detail', '');
  pierCardThreeDetail.classList.add('flow-line-detail--pier-card');
  pierCardThreeDetail.hidden = true;
  board.appendChild(pierCardThreeDetail);
  renderDetailData(pierCardThreeDetail, pierCardThreeConnection);

  const pierTwoToggle = toggle.cloneNode(true);
  const pierTwoToggleSymbol = pierTwoToggle.querySelector('[data-flow-toggle-symbol]');
  pierTwoToggle.removeAttribute('data-flow-toggle');
  pierTwoToggle.setAttribute('data-pier-two-toggle', '');
  pierTwoToggle.setAttribute('aria-label', `Показать данные линии Причал №2 — ${pierTwoConnection.title}`);
  if (pierTwoToggleSymbol) pierTwoToggleSymbol.removeAttribute('data-flow-toggle-symbol');
  board.appendChild(pierTwoToggle);

  const pierOneColdToggle = toggle.cloneNode(true);
  const pierOneColdToggleSymbol = pierOneColdToggle.querySelector('[data-flow-toggle-symbol]');
  pierOneColdToggle.removeAttribute('data-flow-toggle');
  pierOneColdToggle.setAttribute('data-pier-one-cold-toggle', '');
  pierOneColdToggle.setAttribute('aria-label', 'Показать наличие Холодной Слободы');
  if (pierOneColdToggleSymbol) pierOneColdToggleSymbol.removeAttribute('data-flow-toggle-symbol');
  board.appendChild(pierOneColdToggle);

  const importSvmToggle = toggle.cloneNode(true);
  const importSvmToggleSymbol = importSvmToggle.querySelector('[data-flow-toggle-symbol]');
  importSvmToggle.removeAttribute('data-flow-toggle');
  importSvmToggle.setAttribute('data-import-svm-toggle', '');
  importSvmToggle.setAttribute('aria-label', 'Показать данные импортного цеха');
  if (importSvmToggleSymbol) importSvmToggleSymbol.removeAttribute('data-flow-toggle-symbol');
  board.appendChild(importSvmToggle);

  const importPierOneToggle = toggle.cloneNode(true);
  const importPierOneToggleSymbol = importPierOneToggle.querySelector('[data-flow-toggle-symbol]');
  importPierOneToggle.removeAttribute('data-flow-toggle');
  importPierOneToggle.setAttribute('data-import-pier-one-toggle', '');
  importPierOneToggle.setAttribute('aria-label', 'Показать данные линии Цех — Причал №1');
  if (importPierOneToggleSymbol) importPierOneToggleSymbol.removeAttribute('data-flow-toggle-symbol');
  board.appendChild(importPierOneToggle);

  const pierThreeToggles = pierThreeConnections.map(function (connection, index) {
    const control = toggle.cloneNode(true);
    const controlSymbol = control.querySelector('[data-flow-toggle-symbol]');
    control.removeAttribute('data-flow-toggle');
    control.setAttribute('data-pier-three-toggle', String(index));
    control.setAttribute('aria-label', `Показать данные линии Причал №3 — ${connection.title}`);
    if (controlSymbol) controlSymbol.removeAttribute('data-flow-toggle-symbol');
    board.appendChild(control);
    return control;
  });

  const pierCardTwoToggle = toggle.cloneNode(true);
  const pierCardTwoToggleSymbol = pierCardTwoToggle.querySelector('[data-flow-toggle-symbol]');
  pierCardTwoToggle.removeAttribute('data-flow-toggle');
  pierCardTwoToggle.setAttribute('data-pier-card-two-toggle', '');
  pierCardTwoToggle.classList.add('flow-line-toggle--pier-card');
  pierCardTwoToggle.setAttribute('aria-label', 'Показать данные Причала №2');
  if (pierCardTwoToggleSymbol) pierCardTwoToggleSymbol.removeAttribute('data-flow-toggle-symbol');
  board.appendChild(pierCardTwoToggle);

  const pierCardThreeToggle = toggle.cloneNode(true);
  const pierCardThreeToggleSymbol = pierCardThreeToggle.querySelector('[data-flow-toggle-symbol]');
  pierCardThreeToggle.removeAttribute('data-flow-toggle');
  pierCardThreeToggle.setAttribute('data-pier-card-three-toggle', '');
  pierCardThreeToggle.classList.add('flow-line-toggle--pier-card');
  pierCardThreeToggle.setAttribute('aria-label', 'Показать данные Причала №3');
  if (pierCardThreeToggleSymbol) pierCardThreeToggleSymbol.removeAttribute('data-flow-toggle-symbol');
  board.appendChild(pierCardThreeToggle);

  const pierCardOneToggle = toggle.cloneNode(true);
  const pierCardOneToggleSymbol = pierCardOneToggle.querySelector('[data-flow-toggle-symbol]');
  pierCardOneToggle.removeAttribute('data-flow-toggle');
  pierCardOneToggle.setAttribute('data-pier-card-one-toggle', '');
  pierCardOneToggle.classList.add('flow-line-toggle--pier-card');
  pierCardOneToggle.setAttribute('aria-label', 'Показать данные Причала №1');
  if (pierCardOneToggleSymbol) pierCardOneToggleSymbol.removeAttribute('data-flow-toggle-symbol');
  board.appendChild(pierCardOneToggle);

  const pierCardSvmToggle = toggle.cloneNode(true);
  const pierCardSvmToggleSymbol = pierCardSvmToggle.querySelector('[data-flow-toggle-symbol]');
  pierCardSvmToggle.removeAttribute('data-flow-toggle');
  pierCardSvmToggle.setAttribute('data-pier-card-svm-toggle', '');
  pierCardSvmToggle.classList.add('flow-line-toggle--pier-card');
  pierCardSvmToggle.setAttribute('aria-label', 'Показать данные Причала СВМ');
  if (pierCardSvmToggleSymbol) pierCardSvmToggleSymbol.removeAttribute('data-flow-toggle-symbol');
  board.appendChild(pierCardSvmToggle);

  let expanded = false;
  let pierOneColdExpanded = false;
  let importSvmExpanded = false;
  let importPierOneExpanded = false;
  let pierTwoExpanded = false;
  let pierThreeExpandedIndex = null;
  let pierCardTwoExpanded = false;
  let pierCardThreeExpanded = false;
  let pierCardOneExpanded = false;
  let pierCardSvmExpanded = false;
  let closedTogglePosition = { x: 0, y: 0 };
  let pierOneColdTogglePosition = { x: 0, y: 0 };
  let importSvmTogglePosition = { x: 0, y: 0 };
  let importPierOneTogglePosition = { x: 0, y: 0 };
  let pierTwoTogglePosition = { x: 0, y: 0 };
  const pierThreeTogglePositions = pierThreeConnections.map(() => ({ x: 0, y: 0 }));
  let pierCardTwoTogglePosition = { x: 0, y: 0 };
  let pierCardThreeTogglePosition = { x: 0, y: 0 };
  let pierCardOneTogglePosition = { x: 0, y: 0 };
  let pierCardSvmTogglePosition = { x: 0, y: 0 };
  let viewScale = 1;
  let panX = 0;
  let panY = 0;
  let userAdjustedZoom = false;
  let activePointer = null;
  let pointerX = 0;
  let pointerY = 0;

  const minScale = Number(zoomRange.min) / 100;
  const maxScale = Number(zoomRange.max) / 100;
  const zoomStep = Number(zoomRange.step) / 100;
  const panMargin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-7')) || 48;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function clampPan() {
    const viewportWidth = viewport.clientWidth;
    const viewportHeight = board.offsetHeight;
    const scaledWidth = board.offsetWidth * viewScale;
    const scaledHeight = board.offsetHeight * viewScale;

    if (scaledWidth <= viewportWidth) {
      const centeredX = (viewportWidth - scaledWidth) / 2;
      panX = clamp(panX, centeredX - panMargin, centeredX + panMargin);
    } else {
      panX = clamp(panX, viewportWidth - scaledWidth - panMargin, panMargin);
    }

    if (scaledHeight <= viewportHeight) {
      panY = clamp(panY, -panMargin, panMargin);
    } else {
      panY = clamp(panY, viewportHeight - scaledHeight - panMargin, panMargin);
    }
  }

  function renderViewport() {
    clampPan();
    const percent = Math.round(viewScale * 100);
    const progress = ((viewScale - minScale) / (maxScale - minScale)) * 100;

    board.style.transform = `translate3d(${Math.round(panX)}px, ${Math.round(panY)}px, 0) scale(${viewScale})`;
    zoomRange.value = String(percent);
    zoomRange.setAttribute('aria-valuetext', `${percent} процентов`);
    zoomValue.value = `${percent}%`;
    zoomValue.textContent = `${percent}%`;
    zoomControl.style.setProperty('--zoom-progress', `${clamp(progress, 0, 100)}%`);
    zoomOut.disabled = viewScale <= minScale;
    zoomIn.disabled = viewScale >= maxScale;
  }

  function setZoom(nextScale, resetPan) {
    const previousScale = viewScale;
    const next = clamp(nextScale, minScale, maxScale);

    if (resetPan) {
      panX = 0;
      panY = 0;
    } else if (Math.abs(next - 1) < .001 && Math.abs(previousScale - 1) >= .001) {
      panX = 0;
      panY = 0;
    } else {
      const focusX = viewport.clientWidth / 2;
      const focusY = board.offsetHeight / 2;
      const sceneX = (focusX - panX) / previousScale;
      const sceneY = (focusY - panY) / previousScale;
      panX = focusX - sceneX * next;
      panY = focusY - sceneY * next;
    }

    viewScale = next;
    renderViewport();
    syncViewportHeight();
    renderConnection();
  }

  function syncViewportHeight() {
    const content = board.classList.contains('is-summary-collapsed') ? overview : bottomHost;
    const viewportRect = viewport.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const nextHeight = Math.ceil(contentRect.bottom - viewportRect.top + 32);

    if (nextHeight > 0 && Math.abs(viewport.offsetHeight - nextHeight) > 1) {
      viewport.style.height = `${nextHeight}px`;
    }
  }

  function fitInitialView() {
    const fitScale = Math.min(1, viewport.clientWidth / board.offsetWidth);
    viewScale = clamp(fitScale, minScale, maxScale);
    panX = 0;
    panY = 0;
    renderViewport();
    syncViewportHeight();
  }

  function setTogglePosition(control, x, y) {
    control.style.left = `${Math.round(x)}px`;
    control.style.top = `${Math.round(y)}px`;
  }

  function positionOpenDetail(detailElement, control, position, width, height) {
    const detailWidth = detailElement.offsetWidth;
    const detailHeight = detailElement.offsetHeight;
    const controlHalfWidth = control.offsetWidth / 2;
    const controlHalfHeight = control.offsetHeight / 2;
    const controlLeft = position.x - controlHalfWidth;
    const controlRight = position.x + controlHalfWidth;
    const controlTop = position.y - controlHalfHeight;
    const controlBottom = position.y + controlHalfHeight;
    const availableRight = width - controlLeft;
    const availableLeft = controlRight;
    const availableBelow = height - controlTop;
    const availableAbove = controlBottom;
    const opensRight = availableRight >= detailWidth || availableRight >= availableLeft;
    const opensBelow = availableBelow >= detailHeight || availableBelow >= availableAbove;
    const detailLeft = opensRight ? controlLeft : controlRight - detailWidth;
    const detailTop = opensBelow ? controlTop : controlBottom - detailHeight;

    detailElement.style.left = `${Math.round(detailLeft)}px`;
    detailElement.style.top = `${Math.round(detailTop)}px`;
    setTogglePosition(control, detailLeft + detailWidth - 16, detailTop + 16);
  }

  function positionCollapsedPierDetail(detailElement, control, cardRect, boardRect, width) {
    const detailWidth = detailElement.offsetWidth;
    const cardRight = (cardRect.right - boardRect.left) / viewScale;
    const cardTop = (cardRect.top - boardRect.top) / viewScale;
    const detailLeft = clamp(cardRight - detailWidth, 0, width - detailWidth);

    detailElement.style.left = `${Math.round(detailLeft)}px`;
    detailElement.style.top = `${Math.round(cardTop)}px`;
    setTogglePosition(control, detailLeft + detailWidth - 16, cardTop + 16);
  }

  function renderPierTwoConnection(boardRect, width, height) {
    const pierRect = pierTwoSource.getBoundingClientRect();
    const pierPanelRect = pierTwoSource.closest('.pier-panel').getBoundingClientRect();
    const targetPanel = pierTwoTarget.closest('.flow-panel');
    const upperPanelRect = source.getBoundingClientRect();
    const targetPanelRect = targetPanel.getBoundingClientRect();
    const primaryLineTargetRect = target.getBoundingClientRect();
    const startX = (pierPanelRect.right - boardRect.left) / viewScale;
    const startY = (pierRect.top + pierRect.height / 2 - boardRect.top) / viewScale;
    const endX = (targetPanelRect.left + targetPanelRect.width / 2 - boardRect.left) / viewScale;
    const endY = (targetPanelRect.top - boardRect.top) / viewScale;
    const corridorTop = (upperPanelRect.bottom - boardRect.top) / viewScale;
    const corridorBottom = (targetPanelRect.top - boardRect.top) / viewScale;
    const naturalCorridorY = corridorTop + Math.max(0, corridorBottom - corridorTop) / 2;
    const primaryLineY = (
      primaryLineTargetRect.top + primaryLineTargetRect.height / 2 - boardRect.top
    ) / viewScale;
    const routeGap = 12;
    const corridorY = Math.max(
      corridorTop + routeGap,
      Math.min(naturalCorridorY, primaryLineY - routeGap)
    );
    const verticalRoom = Math.min(Math.abs(startY - corridorY), Math.abs(endY - corridorY));
    const horizontalRoom = Math.max(0, endX - startX);
    const radius = Math.min(12, verticalRoom / 2, horizontalRoom / 8);
    const firstCornerX = startX + radius * 2;

    pierTwoPath.setAttribute('d', [
      `M ${startX} ${startY}`,
      `H ${firstCornerX - radius}`,
      `Q ${firstCornerX} ${startY} ${firstCornerX} ${startY - radius}`,
      `V ${corridorY + radius}`,
      `Q ${firstCornerX} ${corridorY} ${firstCornerX + radius} ${corridorY}`,
      `H ${endX - radius}`,
      `Q ${endX} ${corridorY} ${endX} ${corridorY + radius}`,
      `V ${endY}`
    ].join(' '));

    pierTwoTogglePosition = {
      x: endX - 28,
      y: corridorY
    };

    if (!pierTwoExpanded) {
      setTogglePosition(pierTwoToggle, pierTwoTogglePosition.x, pierTwoTogglePosition.y);
    } else {
      positionOpenDetail(pierTwoDetail, pierTwoToggle, pierTwoTogglePosition, width, height);
    }

    pierCardTwoTogglePosition = {
      x: (pierRect.right - boardRect.left) / viewScale - 8,
      y: (pierRect.top - boardRect.top) / viewScale + 8
    };

    if (!pierCardTwoExpanded) {
      setTogglePosition(
        pierCardTwoToggle,
        pierCardTwoTogglePosition.x,
        pierCardTwoTogglePosition.y
      );
    } else {
      positionOpenDetail(
        pierCardTwoDetail,
        pierCardTwoToggle,
        pierCardTwoTogglePosition,
        width,
        height
      );
    }
  }

  function renderPierThreeConnections(boardRect, width, height) {
    const pierRect = pierThreeSource.getBoundingClientRect();
    const pierPanelRect = pierThreeSource.closest('.pier-panel').getBoundingClientRect();
    const overviewRect = overview.getBoundingClientRect();
    const bottomRect = bottomHost.getBoundingClientRect();
    const startX = (pierRect.left + pierRect.width / 2 - boardRect.left) / viewScale;
    const startY = (pierPanelRect.bottom - boardRect.top) / viewScale;
    const corridorTop = (overviewRect.bottom - boardRect.top) / viewScale;
    const corridorBottom = (bottomRect.top - boardRect.top) / viewScale;
    const corridorHeight = Math.max(0, corridorBottom - corridorTop);
    const trunkY = corridorTop + corridorHeight / 2;
    const sourceRadius = Math.min(12, Math.max(0, (trunkY - startY) / 2));
    const branchPositions = pierThreeTargets.map(function (connectionTarget) {
      const targetRect = connectionTarget.getBoundingClientRect();
      return {
        x: (targetRect.left + targetRect.width / 2 - boardRect.left) / viewScale,
        y: (bottomRect.top - boardRect.top) / viewScale
      };
    });
    const orderedBranches = branchPositions
      .map((position, index) => ({ ...position, index }))
      .sort((first, second) => first.x - second.x);
    let previousJunctionX = startX + sourceRadius;

    orderedBranches.forEach(function (branch) {
      const horizontalRoom = Math.max(0, branch.x - previousJunctionX);
      const verticalRoom = Math.max(0, branch.y - trunkY);
      branch.radius = Math.min(12, horizontalRoom / 2, verticalRoom / 2);
      branch.bendStartX = branch.x - branch.radius;
      previousJunctionX = branch.x;
    });

    const lastBranch = orderedBranches[orderedBranches.length - 1];
    const trunkEndX = lastBranch ? lastBranch.bendStartX : startX + sourceRadius;

    const sharedPathPrefix = [
      `M ${startX} ${startY}`,
      `V ${trunkY - sourceRadius}`,
      `Q ${startX} ${trunkY} ${startX + sourceRadius} ${trunkY}`,
      `H ${trunkEndX}`
    ];
    pierThreeSourcePath.setAttribute('d', sharedPathPrefix.join(' '));
    pierThreeTrunk.setAttribute('d', '');

    const sharedPathLength = pierThreeSourcePath.getTotalLength();
    const branchGeometry = new Map(orderedBranches.map((branch) => [branch.index, branch]));

    if (lastBranch) {
      pierThreeSourcePath.setAttribute('d', [
        ...sharedPathPrefix,
        `Q ${lastBranch.x} ${trunkY} ${lastBranch.x} ${trunkY + lastBranch.radius}`,
        `V ${lastBranch.y}`
      ].join(' '));
      pierThreeSourcePath.setAttribute('marker-end', 'url(#daily-pier-three-arrow)');
    }

    pierThreeBranches.forEach(function (connectionPath, index) {
      const branchPosition = branchGeometry.get(index);
      const isLastBranch = branchPosition === lastBranch;
      connectionPath.setAttribute('d', isLastBranch ? '' : [
          `M ${branchPosition.bendStartX} ${trunkY}`,
          `Q ${branchPosition.x} ${trunkY} ${branchPosition.x} ${trunkY + branchPosition.radius}`,
          `V ${branchPosition.y}`
        ].join(' '));
      const distanceToBend = sharedPathLength - (trunkEndX - branchPosition.bendStartX);
      connectionPath.style.strokeDashoffset = `${-distanceToBend}px`;
      pierThreeTogglePositions[index] = {
        x: Math.max(startX + 24, branchPosition.x - 28),
        y: trunkY
      };

      if (pierThreeExpandedIndex !== index) {
        setTogglePosition(
          pierThreeToggles[index],
          pierThreeTogglePositions[index].x,
          pierThreeTogglePositions[index].y
        );
      }
    });

    pierCardThreeTogglePosition = {
      x: (pierRect.right - boardRect.left) / viewScale - 8,
      y: (pierRect.top - boardRect.top) / viewScale + 8
    };

    if (!pierCardThreeExpanded) {
      setTogglePosition(
        pierCardThreeToggle,
        pierCardThreeTogglePosition.x,
        pierCardThreeTogglePosition.y
      );
    } else {
      positionOpenDetail(
        pierCardThreeDetail,
        pierCardThreeToggle,
        pierCardThreeTogglePosition,
        width,
        height
      );
    }

    if (pierThreeExpandedIndex === null) return;

    const activePosition = pierThreeTogglePositions[pierThreeExpandedIndex];
    const activeToggle = pierThreeToggles[pierThreeExpandedIndex];
    positionOpenDetail(pierThreeDetail, activeToggle, activePosition, width, height);
  }

  function renderImportPierConnections(boardRect, width, height) {
    const importRect = importPanel.getBoundingClientRect();
    const svmRect = pierSvmTarget.getBoundingClientRect();
    const pierOneRect = target.getBoundingClientRect();
    const pierPanelRect = pierSvmTarget.closest('.pier-panel').getBoundingClientRect();
    const overviewRect = overview.getBoundingClientRect();
    const bottomRect = bottomHost.getBoundingClientRect();
    const corridorTop = (overviewRect.bottom - boardRect.top) / viewScale;
    const corridorBottom = (bottomRect.top - boardRect.top) / viewScale;
    const pierThreeLaneY = corridorTop + Math.max(0, corridorBottom - corridorTop) / 2;
    const routeGap = 12;
    const routeY = Math.max(corridorTop + routeGap, pierThreeLaneY - routeGap);
    const startX = (importRect.left + importRect.width / 2 - boardRect.left) / viewScale;
    const startY = (importRect.bottom - boardRect.top) / viewScale;
    const targetX = (pierPanelRect.right - boardRect.left) / viewScale;
    const trunkX = (pierPanelRect.right - boardRect.left) / viewScale + 32;
    const importLeftX = (importRect.left - boardRect.left) / viewScale;
    const primaryRect = source.getBoundingClientRect();
    const primaryStartX = (
      primaryRect.left + primaryRect.width / 2 - boardRect.left
    ) / viewScale;
    const primaryStartY = (primaryRect.bottom - boardRect.top) / viewScale;
    const svmY = (svmRect.top + svmRect.height / 2 - boardRect.top) / viewScale;
    const pierOneY = (
      pierOneRect.top + pierOneRect.height / 2 - boardRect.top
    ) / viewScale;
    const primaryHorizontalDirection = targetX < primaryStartX ? -1 : 1;
    const primaryRadius = Math.min(
      16,
      Math.abs(primaryStartX - targetX) / 4,
      Math.abs(primaryStartY - pierOneY) / 2
    );
    const primaryJunctionX = primaryStartX + primaryHorizontalDirection * primaryRadius;
    const verticalRadius = Math.min(12, Math.max(0, (routeY - startY) / 2));
    const horizontalRadius = Math.min(12, Math.max(0, (startX - trunkX) / 4));
    const svmRadius = Math.min(12, Math.max(0, (routeY - svmY) / 4));

    importSvmBranch.setAttribute('d', [
      `M ${startX} ${startY}`,
      `V ${routeY - verticalRadius}`,
      `Q ${startX} ${routeY} ${startX - horizontalRadius} ${routeY}`,
      `H ${trunkX + horizontalRadius}`,
      `Q ${trunkX} ${routeY} ${trunkX} ${routeY - horizontalRadius}`,
      `V ${svmY + svmRadius}`,
      `Q ${trunkX} ${svmY} ${trunkX - svmRadius} ${svmY}`,
      `H ${(pierPanelRect.right - boardRect.left) / viewScale}`
    ].join(' '));

    importPierOnePath.setAttribute('d', [
      `M ${importLeftX} ${pierOneY}`,
      `H ${primaryJunctionX}`
    ].join(' '));

    importSvmTogglePosition = {
      x: startX - 28,
      y: routeY
    };

    importPierOneTogglePosition = {
      x: importLeftX - 28,
      y: pierOneY
    };

    if (!importSvmExpanded) {
      setTogglePosition(importSvmToggle, importSvmTogglePosition.x, importSvmTogglePosition.y);
    } else {
      positionOpenDetail(
        importSvmDetail,
        importSvmToggle,
        importSvmTogglePosition,
        width,
        height
      );
    }

    if (!importPierOneExpanded) {
      setTogglePosition(
        importPierOneToggle,
        importPierOneTogglePosition.x,
        importPierOneTogglePosition.y
      );
    } else {
      positionOpenDetail(
        importPierOneDetail,
        importPierOneToggle,
        importPierOneTogglePosition,
        width,
        height
      );
    }
  }

  function positionPierCardControl(card, detailElement, control, position, isExpanded, boardRect, width, height) {
    const cardRect = card.getBoundingClientRect();
    position.x = (cardRect.right - boardRect.left) / viewScale - 8;
    position.y = (cardRect.top - boardRect.top) / viewScale + 8;

    if (!isExpanded) {
      setTogglePosition(control, position.x, position.y);
    } else if (board.classList.contains('is-summary-collapsed')) {
      positionCollapsedPierDetail(detailElement, control, cardRect, boardRect, width);
    } else {
      positionOpenDetail(detailElement, control, position, width, height);
    }
  }

  function renderPierCardControls(boardRect, width, height) {
    positionPierCardControl(
      target,
      pierCardOneDetail,
      pierCardOneToggle,
      pierCardOneTogglePosition,
      pierCardOneExpanded,
      boardRect,
      width,
      height
    );
    positionPierCardControl(
      pierSvmTarget,
      pierCardSvmDetail,
      pierCardSvmToggle,
      pierCardSvmTogglePosition,
      pierCardSvmExpanded,
      boardRect,
      width,
      height
    );
    positionPierCardControl(
      pierTwoSource,
      pierCardTwoDetail,
      pierCardTwoToggle,
      pierCardTwoTogglePosition,
      pierCardTwoExpanded,
      boardRect,
      width,
      height
    );
    positionPierCardControl(
      pierThreeSource,
      pierCardThreeDetail,
      pierCardThreeToggle,
      pierCardThreeTogglePosition,
      pierCardThreeExpanded,
      boardRect,
      width,
      height
    );
  }

  function separateClosedLineToggles(width) {
    const lineToggles = [
      { control: toggle, position: closedTogglePosition, isOpen: expanded },
      { control: pierOneColdToggle, position: pierOneColdTogglePosition, isOpen: pierOneColdExpanded },
      { control: importSvmToggle, position: importSvmTogglePosition, isOpen: importSvmExpanded },
      { control: importPierOneToggle, position: importPierOneTogglePosition, isOpen: importPierOneExpanded },
      { control: pierTwoToggle, position: pierTwoTogglePosition, isOpen: pierTwoExpanded },
      ...pierThreeToggles.map((control, index) => ({
        control,
        position: pierThreeTogglePositions[index],
        isOpen: pierThreeExpandedIndex === index
      }))
    ].filter((entry) => !entry.isOpen)
      .sort((first, second) => first.position.y - second.position.y || first.position.x - second.position.x);
    const placed = [];
    const controlSize = toggle.offsetWidth || 24;
    const minimumCenterGap = controlSize + 8;
    const edgeInset = controlSize / 2;

    lineToggles.forEach(function (entry) {
      let nextX = entry.position.x;
      const overlapsAt = (candidateX) => placed.some((placedEntry) => (
        Math.abs(candidateX - placedEntry.x) < minimumCenterGap
          && Math.abs(entry.position.y - placedEntry.y) < minimumCenterGap
      ));

      for (let step = 0; step <= placed.length + 1; step += 1) {
        const candidates = step === 0
          ? [entry.position.x]
          : [
              entry.position.x + minimumCenterGap * step,
              entry.position.x - minimumCenterGap * step
            ];
        const availableX = candidates.find((candidateX) => (
          candidateX >= edgeInset
            && candidateX <= width - edgeInset
            && !overlapsAt(candidateX)
        ));

        if (availableX !== undefined) {
          nextX = availableX;
          break;
        }
      }

      setTogglePosition(entry.control, nextX, entry.position.y);
      placed.push({ x: nextX, y: entry.position.y });
    });
  }

  function renderConnection() {
    const pierDetailOpen = board.classList.contains('is-summary-collapsed') && (
      pierCardOneExpanded || pierCardSvmExpanded || pierCardTwoExpanded || pierCardThreeExpanded
    );
    board.classList.toggle('is-pier-detail-open', pierDetailOpen);
    board.closest('.daily-summary')?.classList.toggle('is-pier-detail-open', pierDetailOpen);

    const boardRect = board.getBoundingClientRect();
    const width = board.clientWidth;
    const height = board.clientHeight;

    renderPierCardControls(boardRect, width, height);
    if (board.classList.contains('is-summary-collapsed')) return;

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const pierPanelRect = target.closest('.pier-panel').getBoundingClientRect();
    const pierOneColdPanel = pierOneColdTarget.closest('.flow-panel');
    const pierOneColdRect = pierOneColdPanel.getBoundingClientRect();

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const startX = (sourceRect.left + sourceRect.width / 2 - boardRect.left) / viewScale;
    const startY = (sourceRect.bottom - boardRect.top) / viewScale;
    const endX = (pierPanelRect.right - boardRect.left) / viewScale;
    const endY = (targetRect.top + targetRect.height / 2 - boardRect.top) / viewScale;
    const verticalDirection = endY < startY ? -1 : 1;
    const horizontalDirection = endX < startX ? -1 : 1;
    const radius = Math.min(16, Math.abs(startX - endX) / 4, Math.abs(startY - endY) / 2);
    const beforeCornerY = endY - verticalDirection * radius;
    const afterCornerX = startX + horizontalDirection * radius;
    const coldEndY = (pierOneColdRect.top - boardRect.top) / viewScale;
    const desiredColdX = (
      pierOneColdRect.left + pierOneColdRect.width / 2 - boardRect.left
    ) / viewScale;
    const sharedMinX = Math.min(afterCornerX, endX) + 24;
    const sharedMaxX = Math.max(afterCornerX, endX) - 24;
    const coldEndX = sharedMinX <= sharedMaxX
      ? clamp(desiredColdX, sharedMinX, sharedMaxX)
      : desiredColdX;
    const coldDirection = coldEndY >= endY ? 1 : -1;
    const coldRadius = Math.min(12, Math.abs(coldEndY - endY) / 2);
    const coldBranchStartX = coldEndX + horizontalDirection * coldRadius;

    path.setAttribute('d', [
      `M ${startX} ${startY}`,
      `V ${beforeCornerY}`,
      `Q ${startX} ${endY} ${afterCornerX} ${endY}`,
      `H ${endX}`
    ].join(' '));

    pierOneColdPath.setAttribute('d', [
      `M ${coldBranchStartX} ${endY}`,
      `Q ${coldEndX} ${endY} ${coldEndX} ${endY + coldDirection * coldRadius}`,
      `V ${coldEndY}`
    ].join(' '));

    closedTogglePosition = {
      x: startX - 28,
      y: endY
    };
    pierOneColdTogglePosition = {
      x: coldEndX - 28,
      y: endY
    };

    renderPierTwoConnection(boardRect, width, height);
    renderPierThreeConnections(boardRect, width, height);
    renderImportPierConnections(boardRect, width, height);

    if (!expanded) {
      setTogglePosition(toggle, closedTogglePosition.x, closedTogglePosition.y);
    } else {
      positionOpenDetail(detail, toggle, closedTogglePosition, width, height);
    }

    if (!pierOneColdExpanded) {
      setTogglePosition(
        pierOneColdToggle,
        pierOneColdTogglePosition.x,
        pierOneColdTogglePosition.y
      );
    } else {
      positionOpenDetail(
        pierOneColdDetail,
        pierOneColdToggle,
        pierOneColdTogglePosition,
        width,
        height
      );
    }

    separateClosedLineToggles(width);
  }

  function updatePrimaryDetailState() {
    detail.hidden = !expanded;
    toggle.classList.toggle('is-open', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded
      ? 'Скрыть данные Ж/Д эстакады №8'
      : 'Показать данные Ж/Д эстакады №8');
  }

  function updatePierOneColdDetailState() {
    pierOneColdDetail.hidden = !pierOneColdExpanded;
    pierOneColdToggle.classList.toggle('is-open', pierOneColdExpanded);
    pierOneColdToggle.setAttribute('aria-expanded', String(pierOneColdExpanded));
    pierOneColdToggle.setAttribute('aria-label', pierOneColdExpanded
      ? 'Скрыть наличие Холодной Слободы'
      : 'Показать наличие Холодной Слободы');
  }

  function updateImportSvmDetailState() {
    importSvmDetail.hidden = !importSvmExpanded;
    importSvmToggle.classList.toggle('is-open', importSvmExpanded);
    importSvmToggle.setAttribute('aria-expanded', String(importSvmExpanded));
    importSvmToggle.setAttribute('aria-label', importSvmExpanded
      ? 'Скрыть данные импортного цеха'
      : 'Показать данные импортного цеха');
  }

  function updateImportPierOneDetailState() {
    importPierOneDetail.hidden = !importPierOneExpanded;
    importPierOneToggle.classList.toggle('is-open', importPierOneExpanded);
    importPierOneToggle.setAttribute('aria-expanded', String(importPierOneExpanded));
    importPierOneToggle.setAttribute('aria-label', importPierOneExpanded
      ? 'Скрыть данные линии Цех — Причал №1'
      : 'Показать данные линии Цех — Причал №1');
  }

  function updatePierTwoDetailState() {
    pierTwoDetail.hidden = !pierTwoExpanded;
    pierTwoToggle.classList.toggle('is-open', pierTwoExpanded);
    pierTwoToggle.setAttribute('aria-expanded', String(pierTwoExpanded));
    pierTwoToggle.setAttribute('aria-label', pierTwoExpanded
      ? `Скрыть данные линии Причал №2 — ${pierTwoConnection.title}`
      : `Показать данные линии Причал №2 — ${pierTwoConnection.title}`);
  }

  function updatePierThreeDetailState() {
    pierThreeDetail.hidden = pierThreeExpandedIndex === null;
    pierThreeToggles.forEach(function (control, controlIndex) {
      const isOpen = controlIndex === pierThreeExpandedIndex;
      const connection = pierThreeConnections[controlIndex];
      control.classList.toggle('is-open', isOpen);
      control.setAttribute('aria-expanded', String(isOpen));
      control.setAttribute('aria-label', isOpen
        ? `Скрыть данные линии Причал №3 — ${connection.title}`
        : `Показать данные линии Причал №3 — ${connection.title}`);
    });
  }

  function updatePierCardTwoDetailState() {
    pierCardTwoDetail.hidden = !pierCardTwoExpanded;
    pierCardTwoToggle.classList.toggle('is-open', pierCardTwoExpanded);
    pierCardTwoToggle.setAttribute('aria-expanded', String(pierCardTwoExpanded));
    pierCardTwoToggle.setAttribute('aria-label', pierCardTwoExpanded
      ? 'Скрыть данные Причала №2'
      : 'Показать данные Причала №2');
  }

  function updatePierCardThreeDetailState() {
    pierCardThreeDetail.hidden = !pierCardThreeExpanded;
    pierCardThreeToggle.classList.toggle('is-open', pierCardThreeExpanded);
    pierCardThreeToggle.setAttribute('aria-expanded', String(pierCardThreeExpanded));
    pierCardThreeToggle.setAttribute('aria-label', pierCardThreeExpanded
      ? 'Скрыть данные Причала №3'
      : 'Показать данные Причала №3');
  }

  function updatePierCardOneDetailState() {
    pierCardOneDetail.hidden = !pierCardOneExpanded;
    pierCardOneToggle.classList.toggle('is-open', pierCardOneExpanded);
    pierCardOneToggle.setAttribute('aria-expanded', String(pierCardOneExpanded));
    pierCardOneToggle.setAttribute('aria-label', pierCardOneExpanded
      ? 'Скрыть данные Причала №1'
      : 'Показать данные Причала №1');
  }

  function updatePierCardSvmDetailState() {
    pierCardSvmDetail.hidden = !pierCardSvmExpanded;
    pierCardSvmToggle.classList.toggle('is-open', pierCardSvmExpanded);
    pierCardSvmToggle.setAttribute('aria-expanded', String(pierCardSvmExpanded));
    pierCardSvmToggle.setAttribute('aria-label', pierCardSvmExpanded
      ? 'Скрыть данные Причала СВМ'
      : 'Показать данные Причала СВМ');
  }

  function closePierCardOneAndSvm() {
    pierCardOneExpanded = false;
    pierCardSvmExpanded = false;
    importPierOneExpanded = false;
    updatePierCardOneDetailState();
    updatePierCardSvmDetailState();
    updateImportPierOneDetailState();
  }

  function setExpanded(nextExpanded) {
    if (nextExpanded) {
      closePierCardOneAndSvm();
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePierTwoDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
    }

    expanded = nextExpanded;
    updatePrimaryDetailState();
    renderConnection();
  }

  function setImportSvmExpanded(nextExpanded) {
    if (nextExpanded) {
      closePierCardOneAndSvm();
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
    }

    importSvmExpanded = nextExpanded;
    updateImportSvmDetailState();
    renderConnection();
  }

  function setImportPierOneExpanded(nextExpanded) {
    if (nextExpanded) {
      closePierCardOneAndSvm();
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
    }

    importPierOneExpanded = nextExpanded;
    updateImportPierOneDetailState();
    renderConnection();
  }

  function setPierOneColdExpanded(nextExpanded) {
    if (nextExpanded) {
      closePierCardOneAndSvm();
      expanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePrimaryDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
    }

    pierOneColdExpanded = nextExpanded;
    updatePierOneColdDetailState();
    renderConnection();
  }

  function setPierThreeExpanded(index) {
    const nextIndex = pierThreeExpandedIndex === index ? null : index;

    if (nextIndex !== null) {
      closePierCardOneAndSvm();
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
      renderDetailData(pierThreeDetail, pierThreeConnections[nextIndex]);
    }

    pierThreeExpandedIndex = nextIndex;
    updatePierThreeDetailState();
    renderConnection();
  }

  function setPierCardTwoExpanded(nextExpanded) {
    if (nextExpanded) {
      closePierCardOneAndSvm();
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardThreeExpanded = false;
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierThreeDetailState();
      updatePierCardThreeDetailState();
    }

    pierCardTwoExpanded = nextExpanded;
    updatePierCardTwoDetailState();
    renderConnection();
  }

  function setPierCardThreeExpanded(nextExpanded) {
    if (nextExpanded) {
      closePierCardOneAndSvm();
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
    }

    pierCardThreeExpanded = nextExpanded;
    updatePierCardThreeDetailState();
    renderConnection();
  }

  function setPierTwoExpanded(nextExpanded) {
    if (nextExpanded) {
      closePierCardOneAndSvm();
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
    }

    pierTwoExpanded = nextExpanded;
    updatePierTwoDetailState();
    renderConnection();
  }

  function setPierCardOneExpanded(nextExpanded) {
    if (nextExpanded) {
      pierCardSvmExpanded = false;
      importPierOneExpanded = false;
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePierCardSvmDetailState();
      updateImportPierOneDetailState();
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
    }

    pierCardOneExpanded = nextExpanded;
    updatePierCardOneDetailState();
    renderConnection();
  }

  function setPierCardSvmExpanded(nextExpanded) {
    if (nextExpanded) {
      pierCardOneExpanded = false;
      importPierOneExpanded = false;
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePierCardOneDetailState();
      updateImportPierOneDetailState();
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
    }

    pierCardSvmExpanded = nextExpanded;
    updatePierCardSvmDetailState();
    renderConnection();
  }

  function setSummaryExpanded(nextExpanded) {
    board.classList.toggle('is-summary-collapsed', !nextExpanded);
    viewport.classList.toggle('is-summary-collapsed', !nextExpanded);
    pageContent.classList.toggle('is-summary-collapsed', !nextExpanded);
    summaryToggle.classList.toggle('is-expanded', nextExpanded);
    summaryToggle.setAttribute('aria-expanded', String(nextExpanded));
    summaryToggle.setAttribute('aria-label', nextExpanded
      ? 'Свернуть суточную сводку'
      : 'Развернуть суточную сводку');

    if (!nextExpanded) {
      closePierCardOneAndSvm();
      expanded = false;
      pierOneColdExpanded = false;
      importSvmExpanded = false;
      pierTwoExpanded = false;
      pierThreeExpandedIndex = null;
      pierCardTwoExpanded = false;
      pierCardThreeExpanded = false;
      updatePrimaryDetailState();
      updatePierOneColdDetailState();
      updateImportSvmDetailState();
      updatePierTwoDetailState();
      updatePierThreeDetailState();
      updatePierCardTwoDetailState();
      updatePierCardThreeDetailState();
    }
    userAdjustedZoom = false;
    setZoom(1, true);
    requestAnimationFrame(function () {
      fitInitialView();
      renderConnection();
    });
  }

  toggle.addEventListener('click', function () {
    setExpanded(!expanded);
  });

  pierOneColdToggle.addEventListener('click', function () {
    setPierOneColdExpanded(!pierOneColdExpanded);
  });

  importSvmToggle.addEventListener('click', function () {
    setImportSvmExpanded(!importSvmExpanded);
  });

  importPierOneToggle.addEventListener('click', function () {
    setImportPierOneExpanded(!importPierOneExpanded);
  });

  pierTwoToggle.addEventListener('click', function () {
    setPierTwoExpanded(!pierTwoExpanded);
  });

  pierThreeToggles.forEach(function (control, index) {
    control.addEventListener('click', function () {
      setPierThreeExpanded(index);
    });
  });

  pierCardTwoToggle.addEventListener('click', function () {
    setPierCardTwoExpanded(!pierCardTwoExpanded);
  });

  pierCardThreeToggle.addEventListener('click', function () {
    setPierCardThreeExpanded(!pierCardThreeExpanded);
  });

  pierCardOneToggle.addEventListener('click', function () {
    setPierCardOneExpanded(!pierCardOneExpanded);
  });

  pierCardSvmToggle.addEventListener('click', function () {
    setPierCardSvmExpanded(!pierCardSvmExpanded);
  });

  summaryToggle.addEventListener('click', function () {
    setSummaryExpanded(summaryToggle.getAttribute('aria-expanded') !== 'true');
  });

  zoomOut.addEventListener('click', function () {
    userAdjustedZoom = true;
    setZoom(viewScale - zoomStep, false);
  });

  zoomIn.addEventListener('click', function () {
    userAdjustedZoom = true;
    setZoom(viewScale + zoomStep, false);
  });

  zoomRange.addEventListener('input', function () {
    userAdjustedZoom = true;
    setZoom(Number(zoomRange.value) / 100, false);
  });

  viewport.addEventListener('pointerdown', function (event) {
    if (event.button !== 0 || event.target.closest('button, input, a, [data-flow-detail], [data-pier-one-cold-detail], [data-import-svm-detail], [data-import-pier-one-detail], [data-pier-two-detail], [data-pier-three-detail], [data-pier-card-one-detail], [data-pier-card-svm-detail], [data-pier-card-two-detail], [data-pier-card-three-detail]')) return;
    activePointer = event.pointerId;
    pointerX = event.clientX;
    pointerY = event.clientY;
    viewport.setPointerCapture(activePointer);
    viewport.classList.add('is-dragging');
    event.preventDefault();
  });

  viewport.addEventListener('pointermove', function (event) {
    if (event.pointerId !== activePointer) return;
    panX += event.clientX - pointerX;
    panY += event.clientY - pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;
    renderViewport();
  });

  function finishPan(event) {
    if (event.pointerId !== activePointer) return;
    if (viewport.hasPointerCapture(activePointer)) viewport.releasePointerCapture(activePointer);
    activePointer = null;
    viewport.classList.remove('is-dragging');
  }

  viewport.addEventListener('pointerup', finishPan);
  viewport.addEventListener('pointercancel', finishPan);

  overview.addEventListener('transitionend', renderConnection);
  bottomHost.addEventListener('transitionend', renderConnection);

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(function () {
      if (!userAdjustedZoom) fitInitialView();
      else renderViewport();
      renderConnection();
    })
    : null;

  if (resizeObserver) {
    resizeObserver.observe(viewport);
    resizeObserver.observe(board);
    resizeObserver.observe(source);
    resizeObserver.observe(target);
    resizeObserver.observe(pierOneColdTarget);
    resizeObserver.observe(importPanel);
    resizeObserver.observe(pierSvmTarget);
    resizeObserver.observe(pierTwoSource);
    resizeObserver.observe(pierTwoTarget);
    resizeObserver.observe(pierThreeSource);
    pierThreeTargets.forEach((connectionTarget) => resizeObserver.observe(connectionTarget));
  }

  window.addEventListener('resize', function () {
    if (!userAdjustedZoom) fitInitialView();
    else renderViewport();
    renderConnection();
  }, { passive: true });
  window.addEventListener('load', function () {
    fitInitialView();
    renderConnection();
  }, { once: true });
  requestAnimationFrame(function () {
    fitInitialView();
    renderConnection();
  });
}());

(function initTransshipmentAnalytics() {
  const root = document.querySelector('[data-transshipment-analytics]');
  const egpz = document.querySelector('[data-egpz-summary]');
  if (!root || !egpz) return;

  const cylinderChart = root.querySelector('[data-transshipment-cylinder]');
  const cylinderViewport = root.querySelector('[data-transshipment-chart-viewport]');
  const cylinderTooltip = root.querySelector('[data-transshipment-chart-tooltip]');
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
    cylinderTooltip.querySelector('[data-tooltip-period]').textContent = segment.dataset.period;
    cylinderTooltip.querySelector('[data-tooltip-type]').textContent = segment.dataset.seriesLabel;
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

  egpz.querySelector('[data-egpz-filter]')?.addEventListener('click', function () {
    toast('Текущий ЕГПЗ', 'Активен 1 параметр: «На текущую дату»');
  });
  egpz.querySelector('[data-egpz-clear-date]')?.addEventListener('click', function (event) {
    event.currentTarget.closest('.pill')?.remove();
    const counter = egpz.querySelector('[data-egpz-filter-count]');
    if (counter) counter.textContent = '0';
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
      const card = chipClose.closest('.chart-card');
      chipClose.closest('.pill')?.remove();
      const counter = card?.querySelector('.button-smallest-secondary-radius__counter');
      if (counter) counter.textContent = String(Math.max(0, Number(counter.textContent) - 1));
      return;
    }
    const filter = event.target.closest('[data-transshipment-filter]');
    if (filter) {
      toast('Фильтр', `Выбрано параметров: ${filter.querySelector('.button-smallest-secondary-radius__counter')?.textContent || '0'}`);
      return;
    }
    const info = event.target.closest('[data-transshipment-info]');
    if (info) {
      if (info.dataset.transshipmentInfo === 'origin') return;
      toast('Данные диаграммы', 'Значения рассчитаны для выбранного периода и единицы измерения');
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

(function initDepartmentPerformance() {
  const root = document.querySelector('[data-department-performance]');
  if (!root) return;

  const filterButton = root.querySelector('[data-department-filter]');
  const filterPanel = root.querySelector('[data-department-filter-panel]');
  const periodPill = root.querySelector('[data-department-period-pill]');
  const periodLabel = root.querySelector('[data-department-period-label]');
  const filterCount = root.querySelector('[data-department-filter-count]');
  let selectedPeriod = '2025';
  const rows = [
    ['Отдел безопасности', 96, 98],
    ['Планово-экономический отдел', 94, 91],
    ['Отдел коммерции и логистики', 92, 87],
    ['Административный отдел', 99, 94],
    ['Отдел качества и контроля нефтепродуктов', 99, 97]
  ];

  function closeFilter() {
    filterPanel.hidden = true;
    filterButton.setAttribute('aria-expanded', 'false');
  }

  filterButton.addEventListener('click', function () {
    const opening = filterPanel.hidden;
    filterPanel.hidden = !opening;
    filterButton.setAttribute('aria-expanded', String(opening));
  });

  root.querySelector('[data-department-filter-close]').addEventListener('click', closeFilter);
  root.querySelectorAll('[data-department-period]').forEach(function (button) {
    button.addEventListener('click', function () {
      root.querySelectorAll('[data-department-period]').forEach(function (option) {
        option.classList.toggle('is-active', option === button);
      });
      selectedPeriod = button.dataset.departmentPeriod;
      periodLabel.textContent = `за ${selectedPeriod} год`;
      periodPill.hidden = false;
      filterCount.textContent = '1';
      closeFilter();
    });
  });

  root.querySelector('[data-department-period-clear]').addEventListener('click', function () {
    selectedPeriod = '';
    periodPill.hidden = true;
    filterCount.textContent = '0';
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

  document.addEventListener('click', function (event) {
    if (!root.contains(event.target) || !event.target.closest('.cash-flow__filter')) closeFilter();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeFilter();
  });
}());

(function initLogisticsOverview() {
  const root = document.querySelector('[data-logistics-overview]');
  const source = window.BNT_DATA && window.BNT_DATA.logistics;
  if (!root || !source) return;

  const numberFormatter = new Intl.NumberFormat('ru-RU');
  const configs = {
    products: {
      title: 'Входящий объём по продукту',
      description: 'Суммарный входящий объём по недельному плану подачи вагонов.',
      rows: source.products,
      scaleMax: 1600,
      fileName: 'incoming-volume-by-product.csv'
    },
    capacities: {
      title: 'Свободная ёмкость резервуаров',
      description: 'Доступная ёмкость по секциям и резервуарному парку на текущую дату.',
      rows: source.capacities,
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

  function toast(title, message) {
    if (window.BNTUI && typeof window.BNTUI.toast === 'function') {
      window.BNTUI.toast(title, message);
    }
  }

  function renderRows(selector, config) {
    const host = root.querySelector(selector);
    if (!host) return;
    const tickCount = config.tickCount || 5;
    const ticks = Array.from({ length: tickCount }, function (_, index) {
      return numberFormatter.format(config.scaleMax * index / (tickCount - 1));
    });
    const rows = config.rows.map(function (row) {
      const value = Number(row[1]);
      const percentage = Math.min(100, Math.max(0, value / config.scaleMax * 100));
      const percentLabel = config.percentBase
        ? `<span>${Math.round(value / config.percentBase * 100)}%</span><span aria-hidden="true">·</span>`
        : '';
      const label = String(row[0]);
      const labelHtml = label === 'Восточный парк' ? 'Восточный<br>парк' : escapeHtml(label);
      return `<div class="logistics-bar-row typography-body-smallest" role="img" aria-label="${escapeHtml(`${row[0]}: ${numberFormatter.format(value)} м³`)}">
        <span class="logistics-bar-row__label">${labelHtml}</span>
        <span class="logistics-bar-row__track" style="--logistics-bar-value:${percentage}%" aria-hidden="true">
          <i class="logistics-bar-row__fill"></i>
          <span class="logistics-bar-row__value">${percentLabel}<strong>${numberFormatter.format(value)}</strong></span>
        </span>
      </div>`;
    }).join('');
    host.innerHTML = `<div class="logistics-bar-scale" aria-hidden="true">${ticks.map(function (tick) { return `<span>${tick}</span>`; }).join('')}</div>
      <div class="logistics-bar-grid" aria-hidden="true">${ticks.map(function () { return '<span></span>'; }).join('')}</div>
      <div class="logistics-bar-rows">${rows}</div>`;

    function syncLabelWidth() {
      const labels = Array.from(host.querySelectorAll('.logistics-bar-row__label'));
      const textWidth = labels.reduce(function (maxWidth, label) {
        const range = document.createRange();
        range.selectNodeContents(label);
        const lineWidth = Array.from(range.getClientRects()).reduce(function (maxLineWidth, rect) {
          return Math.max(maxLineWidth, rect.width);
        }, 0);
        return Math.max(maxWidth, lineWidth);
      }, 0);
      host.style.setProperty('--logistics-label-width', `${textWidth ? Math.ceil(textWidth) : 0}px`);
    }

    syncLabelWidth();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncLabelWidth);
  }

  function downloadCsv(config) {
    const rows = [['Показатель', 'Значение, м³']].concat(config.rows);
    const csv = rows.map(function (row) {
      return row.map(function (cell) { return `"${String(cell).replace(/"/g, '""')}"`; }).join(';');
    }).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = config.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  root.addEventListener('click', function (event) {
    const chipClose = event.target.closest('.pill button');
    if (chipClose) {
      const card = chipClose.closest('[data-logistics-overview-card]');
      chipClose.closest('.pill')?.remove();
      const counter = card?.querySelector('.button-smallest-secondary-radius__counter');
      if (counter) counter.textContent = String(Math.max(0, Number(counter.textContent) - 1));
      return;
    }

    const info = event.target.closest('[data-logistics-overview-info]');
    if (info) {
      const config = configs[info.dataset.logisticsOverviewInfo];
      if (config) toast(config.title, config.description);
      return;
    }

    const filter = event.target.closest('[data-logistics-overview-filter]');
    if (filter) {
      const count = filter.querySelector('.button-smallest-secondary-radius__counter')?.textContent || '0';
      toast('Фильтр', `Выбрано параметров: ${count}`);
      return;
    }

    const exportButton = event.target.closest('[data-logistics-overview-export]');
    if (exportButton) {
      const config = configs[exportButton.dataset.logisticsOverviewExport];
      if (config) downloadCsv(config);
    }
  });

  renderRows('[data-logistics-product-volume]', configs.products);
  renderRows('[data-logistics-capacity]', configs.capacities);
}());

(function initCashFlow() {
  const root = document.querySelector('[data-cash-flow]');
  if (!root) return;

  const chart = root.querySelector('[data-cash-chart]');
  const viewport = root.querySelector('[data-cash-chart-viewport]');
  const tooltip = root.querySelector('[data-cash-tooltip]');
  const periodLabel = root.querySelector('[data-cash-period-label]');
  const resetButton = root.querySelector('[data-cash-reset]');
  const filterButton = root.querySelector('[data-cash-filter]');
  const filterPanel = root.querySelector('[data-cash-filter-panel]');
  const monthOptions = root.querySelector('[data-cash-month-options]');
  const infoButton = root.querySelector('[data-cash-info]');
  const infoPopover = root.querySelector('[data-cash-info-popover]');
  const formatNumber = new Intl.NumberFormat('ru-RU');
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const shortMonths = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  // Demonstration values in KZT. Only completed months have a fact value.
  const plans = [72, 68, 75, 79, 74, 83, 81, 86, 77, 88, 84, 92].map(function (value) { return value * 1000000; });
  const facts = [69, 71, 73, 84, 70, 78, 86, 82, null, null, null, null].map(function (value) { return value === null ? null : value * 1000000; });
  let selectedMonth = null;
  let wheelLocked = false;

  function escapeXml(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  }

  function pad(value) { return String(value).padStart(2, '0'); }

  function monthRange(monthIndex) {
    const month = pad(monthIndex + 1);
    const lastDay = new Date(Date.UTC(2026, monthIndex + 1, 0)).getUTCDate();
    return `с 01.${month} по ${pad(lastDay)}.${month}.2026`;
  }

  function monthWeeks(monthIndex) {
    const lastDay = new Date(Date.UTC(2026, monthIndex + 1, 0)).getUTCDate();
    const weeks = [];
    for (let start = 1; start <= lastDay;) {
      const weekday = new Date(Date.UTC(2026, monthIndex, start)).getUTCDay();
      const end = Math.min(lastDay, start + (7 - weekday) % 7);
      weeks.push({
        label: `${pad(start)}–${pad(end)} ${shortMonths[monthIndex]}`,
        period: `${pad(start)}.${pad(monthIndex + 1)}–${pad(end)}.${pad(monthIndex + 1)}.2026`,
        days: end - start + 1
      });
      start = end + 1;
    }
    return weeks;
  }

  function allocateWeeks(total, weeks, variation) {
    if (total === null) return weeks.map(function () { return null; });
    const weights = weeks.map(function (week, index) { return week.days * variation[index % variation.length]; });
    const weightTotal = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
    let allocated = 0;
    return weights.map(function (weight, index) {
      const value = index === weights.length - 1 ? total - allocated : Math.round(total * weight / weightTotal);
      allocated += value;
      return value;
    });
  }

  function currentView() {
    if (selectedMonth === null) return months.map(function (month, index) {
      return { label: month, period: `${month} 2026`, plan: plans[index], fact: facts[index], monthIndex: index };
    });
    const weeks = monthWeeks(selectedMonth);
    const weeklyPlans = allocateWeeks(plans[selectedMonth], weeks, [1, .96, 1.05, .98, 1.02, 1]);
    const weeklyFacts = allocateWeeks(facts[selectedMonth], weeks, [.94, 1.07, 1.03, .97, 1.04, .95]);
    return weeks.map(function (week, index) {
      return { label: week.label, period: week.period, plan: weeklyPlans[index], fact: weeklyFacts[index], monthIndex: selectedMonth, isWeek: true };
    });
  }

  function chartView() {
    const periodData = currentView();
    if (selectedMonth === null) return periodData;
    return months.flatMap(function (month, index) {
      if (index === selectedMonth) return periodData;
      return [{
        label: month,
        period: `${month} 2026`,
        plan: plans[index],
        fact: facts[index],
        monthIndex: index,
        isContext: true
      }];
    });
  }

  function axisMax(data) {
    const largest = Math.max.apply(null, data.flatMap(function (category) {
      return [category.plan, category.fact || 0, category.fact === null ? 0 : Math.abs(category.plan - category.fact)];
    }));
    const rawStep = Math.max(1, largest / 5);
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceStep = [1, 2, 2.5, 5, 10].find(function (step) { return step >= rawStep / magnitude; }) || 10;
    return niceStep * magnitude * 5;
  }

  function render() {
    const data = chartView();
    const height = 420;
    const margin = { top: 16, right: 18, bottom: 44, left: 58 };
    const monthBarWidth = 48;
    const weekBarWidth = 24;
    const barGap = 8;
    const gridGap = 12;
    const minGroupWidths = data.map(function (category) {
      const barWidth = category.isWeek ? weekBarWidth : monthBarWidth;
      return barWidth * 3 + barGap * 2 + gridGap * 2;
    });
    const minPlotWidth = minGroupWidths.reduce(function (sum, groupWidth) { return sum + groupWidth; }, 0);
    const width = Math.max(viewport.clientWidth, minPlotWidth + margin.left + margin.right);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const bottom = margin.top + plotHeight;
    const extraGroupWidth = (plotWidth - minPlotWidth) / data.length;
    let groupStart = margin.left;
    const groups = minGroupWidths.map(function (minGroupWidth) {
      const groupWidth = minGroupWidth + extraGroupWidth;
      const group = { start: groupStart, width: groupWidth, center: groupStart + groupWidth / 2 };
      groupStart += groupWidth;
      return group;
    });
    const max = axisMax(data);
    const svg = [];

    for (let tick = 0; tick <= 5; tick += 1) {
      const value = max * tick / 5;
      const y = bottom - plotHeight * tick / 5;
      svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/>`);
      svg.push(`<text class="chart-bars__tick" x="${margin.left - 10}" y="${y + 5}" text-anchor="end">${value ? escapeXml(`${formatNumber.format(value / 1000000)} млн`) : '0'}</text>`);
    }
    for (let boundary = 0; boundary <= data.length; boundary += 1) {
      const x = boundary === data.length ? width - margin.right : groups[boundary].start;
      svg.push(`<line class="chart-bars__vertical-line" x1="${x}" y1="${margin.top}" x2="${x}" y2="${bottom}"/>`);
    }
    svg.push(`<line class="chart-bars__axis-line" x1="${margin.left}" y1="${bottom}" x2="${width - margin.right}" y2="${bottom}"/>`);

    data.forEach(function (category, index) {
      const center = groups[index].center;
      const barWidth = category.isWeek ? weekBarWidth : monthBarWidth;
      const start = center - (barWidth * 3 + barGap * 2) / 2;
      const delta = category.fact === null ? null : category.plan - category.fact;
      const bars = [
        { kind: 'plan', name: 'План', value: category.plan },
        { kind: 'fact', name: 'Факт', value: category.fact },
        { kind: delta === null ? 'positive' : delta < 0 ? 'negative' : 'positive', name: 'Дельта', accessibleName: delta < 0 ? 'Отрицательная дельта' : 'Положительная дельта', value: delta }
      ];
      bars.forEach(function (bar, barIndex) {
        if (bar.value === null || (barIndex === 2 && bar.value === 0)) return;
        const magnitude = Math.abs(bar.value);
        const barHeight = Math.max(2, plotHeight * magnitude / max);
        const x = start + barIndex * (barWidth + barGap);
        const y = bottom - barHeight;
        const signedValue = barIndex === 2 ? `${bar.value > 0 ? '+' : '−'}${formatNumber.format(magnitude)}` : formatNumber.format(magnitude);
        svg.push(`<rect class="chart-bars__segment ${category.isContext ? 'is-context' : ''} cash-flow-chart__bar cash-flow-chart__bar--${bar.kind}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" tabindex="0" role="button" aria-label="${escapeXml(`${category.period}, ${bar.accessibleName || bar.name}: ${signedValue} KZT`)}" data-cash-bar data-cash-month-index="${category.monthIndex}" ${category.isContext ? `data-cash-context-month-index="${category.monthIndex}"` : ''} data-period="${escapeXml(category.period)}" data-series="${bar.name}" data-is-delta="${barIndex === 2}" data-value="${bar.value}"/>`);
      });
      const drillable = selectedMonth === null || category.isContext;
      svg.push(`<text class="chart-bars__category ${category.isContext ? 'is-context' : ''} ${drillable ? 'cash-flow-chart__period' : ''}" x="${center}" y="${bottom + 26}" text-anchor="middle" ${drillable ? `tabindex="0" role="button" aria-label="Показать недели: ${escapeXml(category.period)}" data-cash-month-index="${category.monthIndex}" ${category.isContext ? `data-cash-context-month-index="${category.monthIndex}"` : ''}` : ''}>${escapeXml(category.label)}</text>`);
    });

    chart.style.width = `${width}px`;
    chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chart.innerHTML = svg.join('');
    chart.setAttribute('aria-label', selectedMonth === null ? 'Оплаты по месяцам: план, факт и дельта за 2026 год' : `Оплаты по неделям: ${months[selectedMonth]} 2026 года`);
    periodLabel.textContent = selectedMonth === null ? 'с 01.01 по 31.12.2026' : monthRange(selectedMonth);
    root.querySelectorAll('[data-cash-period-option]').forEach(function (option) {
      option.classList.toggle('is-active', option.dataset.cashPeriodOption === (selectedMonth === null ? 'year' : String(selectedMonth)));
    });
    tooltip.hidden = true;
    if (selectedMonth !== null) {
      const weekCount = currentView().length;
      const firstWeek = groups[selectedMonth];
      const lastWeek = groups[selectedMonth + weekCount - 1];
      return (firstWeek.start + lastWeek.start + lastWeek.width) / 2;
    }
    return null;
  }

  function positionTooltip(clientX, clientY) {
    const bounds = viewport.getBoundingClientRect();
    const localX = clientX - bounds.left + viewport.scrollLeft;
    const localY = clientY - bounds.top;
    const visibleLeft = viewport.scrollLeft + 8;
    const visibleRight = viewport.scrollLeft + viewport.clientWidth - 8;
    let left = localX + 12;
    let top = localY + 12;
    if (left + tooltip.offsetWidth > visibleRight) left = localX - tooltip.offsetWidth - 12;
    if (top + tooltip.offsetHeight > viewport.clientHeight - 8) top = localY - tooltip.offsetHeight - 12;
    tooltip.style.left = `${Math.max(visibleLeft, left)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
  }

  function showTooltip(bar, clientX, clientY) {
    const value = Number(bar.dataset.value);
    const isDelta = bar.dataset.isDelta === 'true';
    tooltip.querySelector('[data-cash-tooltip-title]').textContent = bar.dataset.series;
    tooltip.querySelector('[data-cash-tooltip-period]').textContent = bar.dataset.period;
    tooltip.querySelector('[data-cash-tooltip-value]').textContent = `${isDelta ? value > 0 ? '+' : '−' : ''}${formatNumber.format(Math.abs(value))} KZT`;
    tooltip.hidden = false;
    positionTooltip(clientX, clientY);
  }

  function closeFilter() {
    filterPanel.hidden = true;
    filterButton.setAttribute('aria-expanded', 'false');
  }

  function closeInfo() {
    infoPopover.hidden = true;
    infoButton.setAttribute('aria-expanded', 'false');
  }

  function drill(monthIndex) {
    if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex >= months.length) return;
    selectedMonth = monthIndex;
    closeFilter();
    const focusCenter = render();
    viewport.scrollLeft = Math.max(0, focusCenter - viewport.clientWidth / 2);
  }

  monthOptions.innerHTML = months.map(function (month, index) {
    return `<button class="cash-flow__filter-option typography-body-small" type="button" data-cash-period-option="${index}">${escapeXml(month)}</button>`;
  }).join('');

  chart.addEventListener('pointerover', function (event) {
    const bar = event.target.closest('[data-cash-bar]');
    if (bar) showTooltip(bar, event.clientX, event.clientY);
  });
  chart.addEventListener('pointermove', function (event) {
    if (!tooltip.hidden && event.target.closest('[data-cash-bar]')) positionTooltip(event.clientX, event.clientY);
  });
  chart.addEventListener('pointerout', function (event) {
    if (event.target.closest('[data-cash-bar]')) tooltip.hidden = true;
  });
  chart.addEventListener('focusin', function (event) {
    const bar = event.target.closest('[data-cash-bar]');
    if (!bar) return;
    const bounds = bar.getBoundingClientRect();
    showTooltip(bar, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  });
  chart.addEventListener('focusout', function () { tooltip.hidden = true; });
  chart.addEventListener('click', function (event) {
    const target = event.target.closest(selectedMonth === null ? '[data-cash-month-index]' : '[data-cash-context-month-index]');
    if (target) drill(Number(selectedMonth === null ? target.dataset.cashMonthIndex : target.dataset.cashContextMonthIndex));
  });
  chart.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target.closest(selectedMonth === null ? '[data-cash-month-index]' : '[data-cash-context-month-index]');
    if (!target) return;
    event.preventDefault();
    drill(Number(selectedMonth === null ? target.dataset.cashMonthIndex : target.dataset.cashContextMonthIndex));
  });
  chart.addEventListener('wheel', function (event) {
    const target = event.target.closest('[data-cash-month-index]');
    const zoomIn = event.deltaY < 0 && selectedMonth === null && target;
    const zoomOut = event.deltaY > 0 && selectedMonth !== null;
    if (!zoomIn && !zoomOut) return;
    event.preventDefault();
    if (wheelLocked) return;
    wheelLocked = true;
    window.setTimeout(function () { wheelLocked = false; }, 360);
    if (zoomIn) drill(Number(target.dataset.cashMonthIndex));
    else { selectedMonth = null; render(); viewport.scrollLeft = 0; }
  }, { passive: false });

  resetButton.addEventListener('click', function () { selectedMonth = null; render(); viewport.scrollLeft = 0; });
  filterButton.addEventListener('click', function () {
    const opening = filterPanel.hidden;
    closeInfo();
    filterPanel.hidden = !opening;
    filterButton.setAttribute('aria-expanded', String(opening));
  });
  root.querySelector('[data-cash-filter-close]').addEventListener('click', closeFilter);
  filterPanel.addEventListener('click', function (event) {
    const option = event.target.closest('[data-cash-period-option]');
    if (!option) return;
    if (option.dataset.cashPeriodOption === 'year') { selectedMonth = null; closeFilter(); render(); viewport.scrollLeft = 0; }
    else drill(Number(option.dataset.cashPeriodOption));
  });
  infoButton.addEventListener('click', function () {
    const opening = infoPopover.hidden;
    closeFilter();
    infoPopover.hidden = !opening;
    infoButton.setAttribute('aria-expanded', String(opening));
  });
  root.querySelector('[data-cash-info-close]').addEventListener('click', closeInfo);
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.cash-flow__filter')) closeFilter();
    if (!event.target.closest('.origin-title-info') || !root.contains(event.target)) closeInfo();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { closeFilter(); closeInfo(); }
  });

  root.querySelector('[data-cash-export]').addEventListener('click', function () {
    const rows = [['Период', 'План, KZT', 'Факт, KZT', 'Дельта, KZT']].concat(currentView().map(function (category) {
      return [category.period, category.plan, category.fact === null ? '' : category.fact, category.fact === null ? '' : category.plan - category.fact];
    }));
    const csv = rows.map(function (row) { return row.map(function (value) { return `"${String(value).replaceAll('"', '""')}"`; }).join(';'); }).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedMonth === null ? 'cash-flow-2026-months.csv' : `cash-flow-2026-${pad(selectedMonth + 1)}-weeks.csv`;
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  render();
  if (document.fonts?.ready) document.fonts.ready.then(render);
  if (typeof ResizeObserver === 'function') new ResizeObserver(render).observe(viewport);
}());

(function initFinancialOverview() {
  const root = document.querySelector('[data-financial-overview]');
  if (!root) return;

  const chart = root.querySelector('[data-financial-chart]');
  const tabs = Array.from(root.querySelectorAll('[data-financial-tab]'));
  const formatNumber = new Intl.NumberFormat('ru-RU');
  const series = [
    { label: 'Факт 09.2024', className: 'primary' },
    { label: 'План 09.2025', className: 'secondary' },
    { label: 'Факт 09.2025', className: 'positive' }
  ];
  const datasets = {
    income: {
      title: 'Доходы, тыс. $',
      max: 1300,
      categories: [
        { label: 'Доходы, всего', values: [1095, 1220, 1180] },
        { label: 'Доходы от основной деятельности', values: [965, 1085, 1040] },
        { label: 'Финансовые доходы', values: [22, 25, 24] },
        { label: 'Доходы от неосновной деятельности', values: [108, 110, 116] }
      ]
    },
    expenses: {
      title: 'Расходы, тыс. $',
      max: 1300,
      categories: [
        { label: 'Расходы, всего', values: [980, 1090, 1035] },
        { label: 'Себестоимость', values: [742, 815, 768] },
        { label: 'Общие и административные расходы', values: [138, 154, 148] },
        { label: 'Финансовые расходы', values: [55, 62, 58] }
      ]
    },
    profit: {
      title: 'Прибыль, тыс. $',
      max: 260,
      categories: [
        { label: 'Прибыль, всего', values: [208, 246, 238] },
        { label: 'Операционная прибыль', values: [128, 151, 142] },
        { label: 'Чистая прибыль', values: [72, 91, 86] },
        { label: 'EBITDA', values: [204, 252, 238] }
      ]
    }
  };
  let activeDataset = 'income';

  function escapeXml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  function splitLabel(label, preferredLength) {
    const words = label.split(' ');
    const lines = [''];
    words.forEach(function (word) {
      const index = lines.length - 1;
      const candidate = lines[index] ? `${lines[index]} ${word}` : word;
      if (candidate.length > preferredLength && lines[index] && lines.length < 2) {
        lines.push(word);
      } else {
        lines[index] = candidate;
      }
    });
    return lines;
  }

  function renderChart(datasetKey) {
    const dataset = datasets[datasetKey] || datasets.income;
    const width = Math.max(960, Math.round(chart.getBoundingClientRect().width || 1440));
    const height = 372;
    const margin = { top: 24, right: 18, bottom: 32, left: 58 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const plotBottom = margin.top + plotHeight;
    const groupWidth = plotWidth / dataset.categories.length;
    const barWidth = Math.max(42, groupWidth * .19);
    const barGap = 8;
    const barsWidth = series.length * barWidth + (series.length - 1) * barGap;
    const svg = [];

    for (let boundary = 0; boundary < dataset.categories.length; boundary += 1) {
      const x = margin.left + groupWidth * boundary;
      svg.push(`<line class="financial-chart__grid-line financial-chart__grid-line--vertical" x1="${x}" y1="${margin.top}" x2="${x}" y2="${plotBottom}"/>`);
    }

    for (let tick = 0; tick <= 5; tick += 1) {
      const value = dataset.max * tick / 5;
      const y = plotBottom - plotHeight * tick / 5;
      svg.push(`<line class="financial-chart__grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/>`);
      svg.push(`<text class="financial-chart__tick" x="${margin.left - 10}" y="${y + 5}" text-anchor="end">${escapeXml(formatNumber.format(value))}</text>`);
    }
    svg.push(`<line class="financial-chart__axis-line" x1="${margin.left}" y1="${plotBottom}" x2="${width - margin.right}" y2="${plotBottom}"/>`);

    dataset.categories.forEach(function (category, categoryIndex) {
      const groupCenter = margin.left + groupWidth * categoryIndex + groupWidth / 2;
      const groupStart = groupCenter - barsWidth / 2;
      category.values.forEach(function (value, seriesIndex) {
        const barHeight = Math.max(1, plotHeight * value / dataset.max);
        const x = groupStart + seriesIndex * (barWidth + barGap);
        const y = plotBottom - barHeight;
        const seriesItem = series[seriesIndex];
        svg.push(`<rect class="financial-chart__bar financial-chart__bar--${seriesItem.className}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"><title>${escapeXml(`${category.label}: ${seriesItem.label} — ${formatNumber.format(value)}`)}</title></rect>`);
        svg.push(`<text class="financial-chart__value" x="${x + barWidth / 2}" y="${Math.max(margin.top + 12, y - 8)}" text-anchor="middle">${escapeXml(formatNumber.format(value))}</text>`);
      });

      const labelLines = splitLabel(category.label, 40);
      svg.push(`<text class="financial-chart__category" x="${groupCenter}" y="${plotBottom + 8}" dominant-baseline="hanging">`);
      labelLines.forEach(function (line, lineIndex) {
        svg.push(`<tspan x="${groupCenter}" dy="${lineIndex === 0 ? 0 : 21}">${escapeXml(line)}</tspan>`);
      });
      svg.push('</text>');
    });

    chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chart.innerHTML = svg.join('');
    chart.setAttribute('aria-label', `Столбчатая диаграмма «${dataset.title}»: план и факт`);
    tabs.forEach(function (tab) {
      const isActive = tab.dataset.financialTab === datasetKey;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
    activeDataset = datasetKey;
  }

  function toast(title, message) {
    if (window.BNTUI && typeof window.BNTUI.toast === 'function') {
      window.BNTUI.toast(title, message);
    }
  }

  function downloadCsv(fileName, rows) {
    const csv = rows.map(function (row) {
      return row.map(function (value) {
        return `"${String(value).replaceAll('"', '""')}"`;
      }).join(';');
    }).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      renderChart(tab.dataset.financialTab);
    });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
      nextTab.focus();
      renderChart(nextTab.dataset.financialTab);
    });
  });

  function closeKpiInfo() {
    root.querySelectorAll('[data-financial-kpi-info]').forEach(function (button) {
      button.setAttribute('aria-expanded', 'false');
      button.closest('.financial-kpi__info-wrap').querySelector('.financial-kpi__popover').hidden = true;
    });
  }

  root.addEventListener('click', function (event) {
    if (event.target.closest('[data-financial-kpi-close]')) { closeKpiInfo(); return; }
    const button = event.target.closest('[data-financial-kpi-info]');
    if (!button) return;
    const popover = button.closest('.financial-kpi__info-wrap').querySelector('.financial-kpi__popover');
    const opening = popover.hidden;
    closeKpiInfo();
    popover.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
  });
  document.addEventListener('click', function (event) {
    if (!root.contains(event.target) || !event.target.closest('.financial-kpi__info-wrap')) closeKpiInfo();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeKpiInfo();
  });

  root.querySelectorAll('[data-financial-filter], [data-financial-chart-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      toast('Фильтр', 'Активен 1 параметр: «На текущую дату»');
    });
  });

  root.querySelector('[data-financial-info]')?.addEventListener('click', function () {
    toast('План vs Факт', 'Сравнение значений за выбранный период по трём срезам');
  });

  root.querySelector('[data-financial-export]')?.addEventListener('click', function () {
    downloadCsv('financial-indicators.csv', [
      ['Показатель', 'Значение'],
      ['Выручка', '$ 1 180 000,00'],
      ['Операционная прибыль', '$ 142 000,00'],
      ['Чистая прибыль', '$ 86 000,00'],
      ['EBITDA', '$ 238 000,00'],
      ['Рентабельность', '7,3%']
    ]);
    toast('Финансовые показатели', 'Файл CSV подготовлен');
  });

  root.querySelector('[data-financial-chart-export]')?.addEventListener('click', function () {
    const dataset = datasets[activeDataset];
    const rows = [['Категория'].concat(series.map(function (item) { return item.label; }))];
    dataset.categories.forEach(function (category) {
      rows.push([category.label].concat(category.values));
    });
    downloadCsv(`plan-fact-${activeDataset}.csv`, rows);
    toast('План vs Факт', 'Данные диаграммы выгружены в CSV');
  });

  function clearFilter(buttonSelector, chipSelector) {
    root.querySelector(buttonSelector)?.addEventListener('click', function (event) {
      event.currentTarget.closest(chipSelector)?.remove();
      root.querySelectorAll('[data-financial-filter-count]').forEach(function (counter) {
        counter.textContent = String(Math.max(0, Number(counter.textContent) - 1));
      });
    });
  }

  clearFilter('[data-financial-clear-date]', '.pill');
  clearFilter('[data-financial-clear-period]', '.pill');
  renderChart(activeDataset);

  const chartViewport = root.querySelector('.financial-chart__viewport');
  let chartResizeFrame = 0;
  if (chartViewport && typeof ResizeObserver === 'function') {
    const chartResizeObserver = new ResizeObserver(function () {
      window.cancelAnimationFrame(chartResizeFrame);
      chartResizeFrame = window.requestAnimationFrame(function () {
        renderChart(activeDataset);
      });
    });
    chartResizeObserver.observe(chartViewport);
  }
}());
