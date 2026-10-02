(function initTransshipmentPage() {
  const host = document.querySelector('#page-content[data-transshipment-analytics]');
  if (!host) return;
  const charts = window.BNTCharts;
  const palette = ['series-crude', 'series-dark', 'series-gas', 'series-light', 'series-negative', 'series-purple'];
  const clients = ['AzTransRail', 'Maddox', 'Metropol', 'OGMA', 'PT-DeltaTrans', 'Остальные компании'];
  // The references provide proportions, not exact source values.
  const clientData = [
    { label: '2022', values: [95000, 150000, 18000, 160000, 160000, 402000] },
    { label: '2023', values: [470000, 0, 0, 105000, 235000, 450000] },
    { label: '2024', values: [215000, 285000, 25000, 335000, 500000, 430000] },
    { label: '2025', values: [175000, 395000, 14000, 290000, 325000, 401000] },
    { label: '2026', values: [18000, 690000, 0, 160000, 145000, 492000] }
  ];
  let randomSeed = 202024;
  function random() {
    randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  }
  function demoDataset(data, seriesCount) {
    return data.map(row => {
      const total = Math.round(row.values.reduce((sum, value) => sum + value, 0) * (.6 + random() * .35));
      const labels = Array.from({ length: seriesCount || row.values.length }, (_, index) => String(index));
      const weights = labels.map(() => .1 + random());
      return { label: row.label, values: charts.splitCategory({ label: row.label, values: [total] }, labels, weights).map(part => part.values[0]) };
    });
  }
  charts.mountStackedBars({
    host, id: 'transshipment-clients', title: 'Данные по клиентам', position: 'afterbegin', orientation: 'horizontal',
    periodLabel: 'с 01.01.2022 до 31.12.2026', axisMax: 1837500, tickStep: 200000,
    series: clients.map((label, index) => ({ label, className: palette[index] })),
    tabs: [{ key: 'all', label: 'Все' }, { key: 'receipt', label: 'Приём' }, { key: 'storage', label: 'Хранение' }, { key: 'shipment', label: 'Отгрузка' }],
    datasets: { all: clientData, receipt: demoDataset(clientData), storage: demoDataset(clientData), shipment: demoDataset(clientData) }
  });

  const countryCodes = ['A.O.', 'AL', 'AM', 'AZ', 'BE', 'BG', 'HR', 'GE', 'GI', 'GR', 'IL', 'IT', 'LB', 'MT', 'MD', 'NL', 'NG', 'RO', 'RU', 'SG', 'TR', 'GB', 'GB GI', 'UA'];
  const countryNames = {
    'A.O.': 'Остальные страны', AL: 'Албания', AM: 'Армения', AZ: 'Азербайджан',
    BE: 'Бельгия', BG: 'Болгария', HR: 'Хорватия', GE: 'Грузия', GI: 'Гибралтар',
    GR: 'Греция', IL: 'Израиль', IT: 'Италия', LB: 'Ливан', MT: 'Мальта', MD: 'Молдова',
    NL: 'Нидерланды', NG: 'Нигерия', RO: 'Румыния', RU: 'Россия', SG: 'Сингапур',
    TR: 'Турция', GB: 'Великобритания', 'GB GI': 'Великобритания и Гибралтар', UA: 'Украина'
  };
  const countryValues = [
    [550000, 0, 0, 0], [0, 15000, 0, 0], [475000, 0, 0, 0], [30000, 0, 0, 0],
    [45000, 0, 0, 0], [40000, 0, 0, 0], [0, 0, 0, 100000], [790000, 0, 0, 0],
    [60000, 0, 0, 0], [130000, 0, 450000, 0], [35000, 0, 0, 0], [115000, 0, 0, 280000],
    [35000, 0, 0, 0], [0, 0, 695000, 35000], [35000, 0, 0, 0], [0, 15000, 1695000, 0],
    [0, 20000, 0, 0], [55000, 55000, 35000, 15000], [0, 0, 95000, 0], [0, 0, 65000, 0],
    [0, 650000, 350000, 0], [110000, 0, 65000, 0], [50000, 0, 0, 0], [135000, 35000, 20000, 0]
  ];
  const countryData = countryCodes.map((code, index) => ({ label: countryNames[code], values: countryValues[index] }));
  const gradeSeries = ['Нефть Light', 'Нефть Medium', 'Бензин АИ-95', 'ДТ Евро-5', 'Мазут М-100', 'СУГ']
    .map((label, index) => ({ label, className: palette[index] }));
  const fpnSeries = ['FPN-101', 'FPN-201', 'FPN-203', 'FPN-301', 'FPN-401']
    .map((label, index) => ({ label, className: palette[index] }));
  charts.mountStackedBars({
    host, id: 'transshipment-countries', title: 'Данные по странам получателям за период с 2020 по 2024', orientation: 'horizontal', axisPosition: 'top', categoryLabel: 'Страна',
    periodLabel: 'с 01.01.2020 до 31.12.2024', axisMax: 1830000, tickStep: 200000,
    formatTick: value => value ? `${new Intl.NumberFormat('ru-RU').format(value / 1000)}K` : '0',
    series: [
      { label: 'Crude Oil', className: 'series-crude' }, { label: 'Dark', className: 'series-dark' },
      { label: 'Gas', className: 'series-gas' }, { label: 'Light', className: 'series-light' }
    ],
    tabs: [{ key: 'all', label: 'Все' }, { key: 'type', label: 'По типам' }, { key: 'grade', label: 'По сортам', series: gradeSeries }, { key: 'fpn', label: 'По кодам FPN', series: fpnSeries }],
    datasets: { all: countryData, type: demoDataset(countryData), grade: demoDataset(countryData, gradeSeries.length), fpn: demoDataset(countryData, fpnSeries.length) }
  });
}());
