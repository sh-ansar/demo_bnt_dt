const state = {
  view: 'dashboard',
  selectedZone: 'section1',
  selectedTank: 'P-3',
  selectedScenario: 'base',
  scenarioImpact: 20,
  modal: null,
};

const assets = {
  map: 'assets/terminal-map.jpg',
  pumpHero: 'assets/pump-hero.jpg',
  pumpAssembly: 'assets/pump-assembly.jpg',
  valve: 'assets/valve.jpg',
  cabinet: 'assets/cabinet.jpg',
};

const appData = {
  headerUser: { initials: 'ИА', name: 'Иванов А.В.', role: 'Диспетчер' },
  dashboard: {
    selectedObject: {
      name: 'Насос Н-101',
      status: 'Работает',
      location: 'Насосная станция №1 · Секция 1',
      wear: 72,
      load: 85,
      nextTo: '11 сентября 2024',
      nextToNote: 'через 22 дня',
      repairCost: '$ 18 400',
      downtimeRisk: 'Высокий',
      recommendation: 'Провести вибродиагностику',
    },
    relatedObjects: [
      { name: 'Клапан К-24', loc: 'Эстакада №2', status: 'Работает', color: 'green', img: assets.valve },
      { name: 'Шкаф управления ШУ-3', loc: 'Насосная станция №1', status: 'Работает', color: 'green', img: assets.cabinet },
      { name: 'Стендер №4', loc: 'Причал №3', status: 'Требует внимания', color: 'orange', img: assets.pumpAssembly },
      { name: 'Расходомер Р-7', loc: 'Технологическая линия', status: 'Работает', color: 'green', img: assets.valve },
    ],
    zones: [
      { id: 'rack', title: 'Ж/д эстакада', subtitle: 'Железнодорожная приемка', x: 23, y: 20, theme: 'blue' },
      { id: 'station2', title: 'Насосная станция №2', subtitle: 'Перекачка / резерв', x: 14, y: 56, theme: 'blue' },
      { id: 'station1', title: 'Насосная станция №1', subtitle: 'Основной поток', x: 29, y: 76, theme: 'blue' },
      { id: 'section1', title: 'Секция 1', subtitle: 'Резервуарный парк', x: 49, y: 37, theme: 'blue' },
      { id: 'section2', title: 'Секция 2', subtitle: 'Резервуарный парк', x: 66, y: 42, theme: 'green' },
      { id: 'products', title: 'Резервуарный парк', subtitle: 'Нефтепродукты', x: 78, y: 14, theme: 'purple' },
      { id: 'compressor', title: 'Компрессорная', subtitle: 'Воздушная система', x: 96, y: 46, theme: 'orange' },
      { id: 'warehouse', title: 'Склад', subtitle: 'МТР и запчасти', x: 58, y: 92, theme: 'blue' },
      { id: 'pier', title: 'Причал / стендер', subtitle: 'Налив / отгрузка', x: 89, y: 80, theme: 'blue' },
    ],
  },
  sections: {
    section1: {
      title: 'Секция 1 / Резервуарный парк',
      subtitle: 'Резервуарный парк. Нефтепродукты',
      totalVolume: '80 000 м³',
      tanks: 8,
      currentLoadPercent: 68,
      currentLoadVolume: '54 400 м³',
      freeCapacity: '25 600 м³',
      expectedIncoming: '12 000 м³',
      downtimeCount: 7,
      linkedEquipment: [
        { title: 'Насосы', value: '3 шт.', note: '2 работают', icon: 'pump' },
        { title: 'Клапаны', value: '6 шт.', note: '5 открыты', icon: 'valve' },
        { title: 'Шкафы управления', value: '2 шт.', note: 'Все в норме', icon: 'cabinet' },
      ],
      reservoirs: [
        { id: 'P-1', load: 65, volume: '13 000 м³', capacity: '20 000 м³', temp: '27.8 °C', risk: 'Средний', next: '25.09.2024', status: 'В эксплуатации', pos: {x:40, y:28} },
        { id: 'P-2', load: 78, volume: '15 600 м³', capacity: '20 000 м³', temp: '30.5 °C', risk: 'Высокий', next: '18.09.2024', status: 'В эксплуатации', pos: {x:49, y:28} },
        { id: 'P-3', load: 72, volume: '14 400 м³', capacity: '20 000 м³', temp: '28.4 °C', risk: 'Высокий', next: '11.09.2024', status: 'В эксплуатации', pos: {x:58, y:28} },
        { id: 'P-4', load: 58, volume: '11 600 м³', capacity: '20 000 м³', temp: '27.2 °C', risk: 'Средний', next: '02.10.2024', status: 'В эксплуатации', pos: {x:67, y:28} },
        { id: 'P-5', load: 61, volume: '12 200 м³', capacity: '20 000 м³', temp: '28.0 °C', risk: 'Средний', next: '29.09.2024', status: 'В эксплуатации', pos: {x:40, y:64} },
        { id: 'P-6', load: 55, volume: '11 000 м³', capacity: '20 000 м³', temp: '26.9 °C', risk: 'Низкий', next: '04.10.2024', status: 'В эксплуатации', pos: {x:49, y:64} },
        { id: 'P-7', load: 67, volume: '13 400 м³', capacity: '20 000 м³', temp: '28.1 °C', risk: 'Средний', next: '21.09.2024', status: 'В эксплуатации', pos: {x:58, y:64} },
        { id: 'P-8', load: 49, volume: '9 800 м³', capacity: '20 000 м³', temp: '26.5 °C', risk: 'Низкий', next: '12.10.2024', status: 'В эксплуатации', pos: {x:67, y:64} },
      ],
      events: [
        ['12.09.2024 14:32', 'Р-3', 'Рост уровня: 72% (+3%)'],
        ['12.09.2024 11:15', 'Насос Н-101', 'Запуск в автоматическом режиме'],
        ['12.09.2024 09:40', 'Клапан К-24', 'Открыт'],
        ['11.09.2024 18:20', 'Р-2', 'Температура: 31.2 °C (норма)'],
        ['11.09.2024 16:11', 'Датчик LT-03', 'Плановая калибровка завершена'],
      ],
    }
  },
  analytics: {
    scenarios: [
      { id: 'base', name: 'Базовый сценарий', subtitle: 'Текущий план', risk: 12, riskLabel: 'Средний', cost: '$ 241 000', effect: '—', effectText: '', load: 68, repairs: 7,
        details: {
          title: 'Базовый сценарий', sub: 'Текущий план эксплуатации',
          desc: 'Сохранение текущих объемов, планов ТОиР и графика закупок. Используется как базовая точка для сравнения других сценариев.',
          bullets: ['Риск простоя на среднем уровне (12%).', 'Наиболее уязвимые узлы: насос Н-101, клапан К-24.', 'Бюджет ТОиР достаточен при соблюдении плана.', 'Доступность мощностей — 92%.'],
          actions: ['Провести вибродиагностику насоса Н-101 до 11 сентября', 'Контролировать срок поставки клапана К-24', 'Подготовить резервные запчасти для М-101', 'Оптимизировать график ремонтов по секциям'],
        }
      },
      { id: 'growth', name: 'Рост объемов +12%', subtitle: 'Увеличение перевалки', risk: 18, riskLabel: 'Высокий', cost: '$ 268 000', effect: '+ $ 42 000', effectText: 'доп. выручка', load: 80, repairs: 12,
        details: {
          title: 'Рост объемов +12%', sub: 'Сценарий увеличения приема',
          desc: 'Повышение плановых объемов перевалки увеличивает загрузку секций и нагрузку на насосно-компрессорный контур.',
          bullets: ['Увеличение дохода возможно только при перераспределении загрузки.', 'На секции 1 прогнозируется рост износа на 18%.', 'Требуется усилить контроль очереди вагонов и графика закупок.', 'Вероятность аварийного ремонта возрастает до 12 случаев.'],
          actions: ['Включить резервную насосную станцию №2', 'Перенести часть поступлений в секцию 2', 'Ускорить тендер по подшипникам и уплотнениям', 'Обновить недельный график подачи вагонов']
        }
      },
      { id: 'transfer', name: 'Перенос части вагонов', subtitle: 'На соседний терминал', risk: 8, riskLabel: 'Низкий', cost: '$ 195 000', effect: '- $ 46 000', effectText: 'снижение затрат', load: 55, repairs: 4,
        details: {
          title: 'Перенос части вагонов', sub: 'Разгрузка секций',
          desc: 'Перераспределение части потоков на соседний терминал снижает нагрузку на резервуарный парк и вероятность простоев.',
          bullets: ['Секция 1 выходит из красной зоны риска.', 'Снижается очередь на Ж/Д эстакаде.', 'Свободная емкость возрастает на 14%.', 'Годовой бюджет ТОиР уменьшается за счет снижения аварийности.'],
          actions: ['Подтвердить маршрутизацию с логистами', 'Пересчитать график налива по причалам', 'Обновить прогноз по компрессорной', 'Согласовать изменения с диспетчером смены']
        }
      },
      { id: 'delay', name: 'Задержка закупки ЗИП', subtitle: 'Клапан К-24 (12 дней)', risk: 28, riskLabel: 'Высокий', cost: '$ 312 000', effect: '- $ 120 000', effectText: 'потери от простоя', load: 68, repairs: 18,
        details: {
          title: 'Задержка закупки ЗИП', sub: 'Дефицит критических запасов',
          desc: 'Отсутствие критического ЗИП повышает длительность ремонтного окна и увеличивает риск незапланированной остановки секции.',
          bullets: ['Максимальный вклад в риск простоя дают клапан К-24 и уплотнение MTG-45.', 'Запас критических запасных частей ниже минимума.', 'Сдвигается график планового ТО на 6–8 дней.', 'Потенциальные потери составляют до $120 000.'],
          actions: ['Запустить ускоренную закупку', 'Использовать резервный комплект склада', 'Перенастроить график ремонтов', 'Уведомить бухгалтерию и склад']
        }
      },
      { id: 'merge', name: 'Объединение ремонта', subtitle: 'С плановой остановкой', risk: 6, riskLabel: 'Низкий', cost: '$ 176 000', effect: '- $ 65 000', effectText: 'оптимизация', load: 62, repairs: 3,
        details: {
          title: 'Объединение ремонта', sub: 'Оптимизированное окно ТО',
          desc: 'Совмещение ремонта секции с плановым обслуживанием насосной станции уменьшает суммарный простой и повышает эффективность бригад.',
          bullets: ['Потенциальная экономия — до 18 часов простоя.', 'Снижается количество аварийных выездов.', 'Высвобождается резерв бюджета ТОиР.', 'Улучшение доступности мощностей на 4%.'],
          actions: ['Зафиксировать ремонтное окно 12–18 октября', 'Утвердить объединенный план работ', 'Подготовить комплект ЗИП на складе', 'Назначить ответственных мастеров']
        }
      },
    ],
    riskRanking: [
      ['Насос Н-101', 82, 'Высокий'],
      ['Клапан К-24', 78, 'Высокий'],
      ['Электродвигатель М-101', 54, 'Средний'],
      ['Компрессор КВ-3', 52, 'Средний'],
      ['Стендер №4', 50, 'Средний'],
    ],
  },
  logistics: {
    warnings: [
      { level: 'red', title: 'Секция 1 близка к пределу загрузки', text: 'Текущая загрузка 85%. Ожидается достижение 95% к 13.09.', badge: 'Высокий', time: '2 часа назад' },
      { level: 'red', title: 'Насосная станция №2 недоступна', text: 'Плановое ТО с 10.09 08:00 по 12.09 20:00. Рекомендуется перераспределить поток.', badge: 'Высокий', time: '4 часа назад' },
      { level: 'orange', title: 'Требуется сдвинуть поставку', text: '8 вагонов с дизтопливом рекомендуется перенести на 15.09 из‑за ограничений емкости.', badge: 'Средний', time: '6 часов назад' },
      { level: 'orange', title: 'Риск простоя при задержке закупки клапана', text: 'При задержке поставки возможен простой насосной и причала.', badge: 'Средний', time: '8 часов назад' },
      { level: 'blue', title: 'Возможно объединить остановки', text: 'Потенциальная экономия простоя: 18 часов.', badge: 'Низкий', time: '12 часов назад' },
    ],
    scenarios: [
      ['Перенести 8 вагонов на 15 сентября', '-2 дня', 'риск простоя'],
      ['Объединить остановку с ремонтом', '-18 часов', 'простоя'],
      ['Перераспределить поток в секцию 2', '-3 дня', 'риск простоя'],
    ]
  },
  procurement: {
    parts: [
      { name: 'Подшипник 6312', code: 'SKF-6312', category: 'Подшипники', asset: 'Насос Н-101', loc: 'Насосная станция №1', stock: '2 шт.', min: '8 шт.', lead: '12 дней', status: 'Открыт тендер', effect: '-42%', priority: 'Критично', img: assets.valve },
      { name: 'Клапан предохранительный K-24', code: 'К-24-150', category: 'Клапаны', asset: 'Эстакада №2', loc: 'Резервуарный парк', stock: '1 шт.', min: '4 шт.', lead: '25 дней', status: 'Заявка на закупку', effect: '-36%', priority: 'Высокий', img: assets.valve },
      { name: 'Уплотнение торцевое', code: 'MTG-45', category: 'Уплотнения', asset: 'Насос Н-101', loc: 'Насосная станция №1', stock: '0 шт.', min: '4 шт.', lead: '17 дней', status: 'Ожидает поставки', effect: '-28%', priority: 'Высокий', img: assets.valve },
      { name: 'Электродвигатель М-101', code: 'MTR-100-4', category: 'Электрика', asset: 'Насос Н-101', loc: 'Насосная станция №1', stock: '1 шт.', min: '2 шт.', lead: '30 дней', status: 'В закупке', effect: '-25%', priority: 'Средний', img: assets.pumpAssembly },
      { name: 'Датчик уровня LT-01', code: 'LT-01-24V', category: 'КИП', asset: 'Резервуар Р-3', loc: 'Резервуарный парк', stock: '5 шт.', min: '4 шт.', lead: '14 дней', status: 'Планируется', effect: '-18%', priority: 'Средний', img: assets.cabinet },
      { name: 'Фильтр воздушный', code: 'AF-2000', category: 'Расходные', asset: 'Компрессор КВ-3', loc: 'Компрессорная', stock: '8 шт.', min: '6 шт.', lead: '10 дней', status: 'В наличии', effect: '-12%', priority: 'Низкий', img: assets.valve },
    ],
    tenders: [
      ['T-2024-017', 'Подшипники и уплотнения', 'ТехПромСнаб', '$ 48 000', '15.09.2024', 'Открыт'],
      ['T-2024-016', 'Клапаны К-24', 'ПромАрматура', '$ 96 000', '18.09.2024', 'Открыт'],
      ['T-2024-015', 'Электродвигатели', 'ЭнергоКомплект', '$ 97 000', '20.09.2024', 'Рассмотрение'],
    ]
  },
  toir: {
    workOrders: [
      ['WO-24091', 'Насос Н-101', 'Вибродиагностика', '11.09.2024', 'Назначено', 'Мастер Ли Л.Л.'],
      ['WO-24092', 'Резервуар Р-3', 'Внутренний осмотр', '12.10.2024', 'Подготовка', 'Сервисная бригада №2'],
      ['WO-24093', 'Клапан К-24', 'Замена уплотнения', '17.09.2024', 'Критично', 'Бригада КИП'],
      ['WO-24094', 'Компрессор КВ-3', 'Плановое ТО', '21.09.2024', 'Согласовано', 'Механический участок'],
      ['WO-24095', 'Шкаф ШУ-101', 'Проверка контакторов', '24.09.2024', 'В работе', 'Электролаборатория'],
    ],
  }
};

const views = {
  dashboard: { title: 'Диспетчерский центр / Цифровой двойник предприятия', subtitle: 'Единое окно управления терминалом. Оперативный мониторинг, аналитика, планирование и прогнозирование.' },
  section: { title: 'Диспетчерский центр / Цифровой двойник предприятия', subtitle: 'Детальная визуализация секций резервуарного парка, потоков, загрузки и сценариев.' },
  equipment: { title: 'Диспетчерский центр / Оборудование', subtitle: 'Технический паспорт оборудования, связанные узлы, износ, история ремонта и рекомендации.' },
  analytics: { title: 'Предиктивная аналитика / Сценарии и прогнозы', subtitle: 'Оценка рисков, прогнозирование отказов и простоев. Сценарный анализ для принятия оптимальных решений.' },
  logistics: { title: 'Логистика / Плановые объемы и подача вагонов', subtitle: 'Управление железнодорожными поставками, координация с емкостями, оборудованием и отгрузкой для предотвращения простоев.' },
  procurement: { title: 'Закупки / Склад / Запасные части', subtitle: 'Интеграция предиктивной аналитики с закупками. Обеспечение непрерывности работы терминала.' },
  toir: { title: 'ТОиР / Операционные формы', subtitle: 'Формы системы ТОиР, планирование работ, заявки на ремонт, активы и управляемые маршруты обслуживания.' },
  reports: { title: 'Управленческая отчетность', subtitle: 'Компоновка отчетов для руководства: простои, загрузка, ремонтные затраты, закупки, эффективность персонала и сценарии.' },
  reference: { title: 'Справочники и данные', subtitle: 'Справочные сущности цифрового двойника: оборудование, зоны, типы отказов, нормативы и категории запасов.' },
};

function icon(name) {
  const common = 'class="ico" viewBox="0 0 24 24"';
  const icons = {
    home:`<svg ${common}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>`,
    pump:`<svg ${common}><rect x="3" y="9" width="6" height="6" rx="1"/><circle cx="16" cy="12" r="4"/><path d="M20 12h1.5M9 12h3M16 8V5"/></svg>`,
    chart:`<svg ${common}><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20v-11"/></svg>`,
    wrench:`<svg ${common}><path d="M14 6a4 4 0 0 0 4 4l-8 8a2 2 0 1 1-3-3l8-8a4 4 0 0 0 4 4"/><path d="M13 7l4-4"/></svg>`,
    truck:`<svg ${common}><path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
    cart:`<svg ${common}><path d="M4 6h2l2.5 9h9.5l2-6H8.2"/><circle cx="10" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/></svg>`,
    report:`<svg ${common}><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 14h6M10 18h6M10 10h3"/></svg>`,
    book:`<svg ${common}><path d="M4 6a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M6 4v16"/></svg>`,
    settings:`<svg ${common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z"/></svg>`,
    bell:`<svg ${common}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>`,
    calendar:`<svg ${common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
    refresh:`<svg ${common}><path d="M20 11a8 8 0 1 0 2 5.3"/><path d="M20 4v7h-7"/></svg>`,
    layers:`<svg ${common}><path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></svg>`,
    map:`<svg ${common}><path d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>`,
    expand:`<svg ${common}><path d="M15 3h6v6"/><path d="M21 3l-7 7"/><path d="M9 21H3v-6"/><path d="M3 21l7-7"/></svg>`,
    droplet:`<svg ${common}><path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"/></svg>`,
    warehouse:`<svg ${common}><path d="M3 10 12 4l9 6v10H3z"/><path d="M9 21v-6h6v6M3 10h18"/></svg>`,
    tank:`<svg ${common}><ellipse cx="12" cy="6" rx="6" ry="2.5"/><path d="M6 6v8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6"/><path d="M6 14v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/></svg>`,
    train:`<svg ${common}><rect x="5" y="4" width="14" height="12" rx="2"/><path d="M8 16l-2 4M16 16l2 4M8 20h8M8 8h2M14 8h2"/></svg>`,
    alert:`<svg ${common}><path d="M12 4 2.7 20h18.6L12 4z"/><path d="M12 9v4M12 17h.01"/></svg>`,
    dollar:`<svg ${common}><path d="M12 2v20"/><path d="M17 7a4 4 0 0 0-4-2H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H11a4 4 0 0 1-4-2"/></svg>`,
    percent:`<svg ${common}><path d="M19 5 5 19"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
    camera:`<svg ${common}><path d="M4 8h4l2-2h4l2 2h4v10H4z"/><circle cx="12" cy="13" r="3"/></svg>`,
    filePlus:`<svg ${common}><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M12 11v6M9 14h6"/></svg>`,
    search:`<svg ${common}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>`,
    checklist:`<svg ${common}><path d="M9 11l2 2 4-4"/><path d="M20 12a8 8 0 1 1-4.7-7.3"/></svg>`,
    export:`<svg ${common}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>`,
    plus:`<svg ${common}><path d="M12 5v14M5 12h14"/></svg>`,
    check:`<svg ${common}><path d="m5 12 4 4L19 6"/></svg>`,
    valve:`<svg ${common}><path d="M4 12h16"/><path d="M8 8l4 4-4 4"/><path d="M16 8l-4 4 4 4"/></svg>`,
    cabinet:`<svg ${common}><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h6"/></svg>`,
  };
  return icons[name] || icons.book;
}

function pill(label) {
  let cls = 'blue';
  if (/Высок|Критич/.test(label)) cls = 'red';
  else if (/Сред|Наблю|План/.test(label)) cls = 'orange';
  else if (/Низк|Работ|Норма|В эксплуатации|Открыт|Подтвержден|Онлайн|Согласовано|Назначено|В наличии|В работе|Подготовка|Рассмотрение/.test(label)) cls = 'green';
  return `<span class="pill ${cls}">${label}</span>`;
}

function progress(value, color='') { return `<div class="progress ${color}"><i style="width:${value}%"></i></div>`; }
function esc(s) { return String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

function render() {
  const root = document.getElementById('app');
  root.innerHTML = layout();
  bind();
  renderModal();
}

function layout() {
  const meta = views[state.view] || views.dashboard;
  return `
    <div class="app-shell">
      ${sidebar()}
      <main class="main">
        <header class="topbar">
          <div class="top-title">
            <h1>${meta.title}</h1>
            <p>${meta.subtitle}</p>
          </div>
          <div class="top-actions">
            <button class="btn" data-action="noop">${icon('calendar')}<span>Период: ${state.view === 'logistics' ? '7 дней' : '90 дней'}</span></button>
            <button class="btn primary" data-action="toast" data-message="Данные успешно пересчитаны с учетом текущего сценария.">${icon('refresh')}<span>${state.view === 'logistics' ? 'Пересчитать план' : 'Пересчитать данные'}</span></button>
            <button class="icon-btn notify" data-action="toast" data-message="3 новых события в диспетчерском центре.">${icon('bell')}<span class="badge">3</span></button>
            <div class="profile"><div class="avatar">${appData.headerUser.initials}</div><div><b>${appData.headerUser.name}</b><small>${appData.headerUser.role}</small></div></div>
          </div>
        </header>
        <section class="content">${pageContent()}</section>
      </main>
    </div>`;
}

function sidebar() {
  const items = [
    ['dashboard','Диспетчерский центр','home'],
    ['equipment','Оборудование','pump'],
    ['analytics','Аналитика','chart'],
    ['toir','ТОиР','wrench'],
    ['logistics','Логистика','truck'],
    ['procurement','Закупки','cart'],
    ['reports','Отчеты','report'],
    ['reference','Справочники','book'],
  ];
  return `<aside class="sidebar">
    <div class="brand"><div class="brand-mark">${icon('droplet')}</div><div class="brand-copy"><b>BNT</b><small>Нефтеналивной терминал</small></div></div>
    <div class="nav">${items.map(([id,label,ico]) => `<button class="nav-item ${state.view===id?'active':''}" data-action="view" data-view="${id}"><span class="ico">${icon(ico)}</span><span>${label}</span></button>`).join('')}</div>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-bottom"><button class="nav-item" data-action="toast" data-message="Настройки прототипа не изменяют исходные данные."><span class="ico">${icon('settings')}</span><span>Настройки</span></button></div>
  </aside>`;
}

function pageContent() {
  switch (state.view) {
    case 'dashboard': return renderDashboard();
    case 'section': return renderSection();
    case 'equipment': return renderEquipment();
    case 'analytics': return renderAnalytics();
    case 'logistics': return renderLogistics();
    case 'procurement': return renderProcurement();
    case 'toir': return renderToir();
    case 'reports': return renderReports();
    case 'reference': return renderReference();
    default: return renderDashboard();
  }
}

function renderDashboard() {
  const d = appData.dashboard;
  const selectedZone = d.zones.find(z => z.id === state.selectedZone) || d.zones[3];
  return `
    <div class="control-layout">
      <div class="card asset-side">
        <div class="asset-side-title"><span>Выбранный объект</span><button data-action="view" data-view="equipment">К списку</button></div>
        <div class="asset-name-line"><h3>${d.selectedObject.name}</h3>${pill(d.selectedObject.status)}</div>
        <div class="asset-sub">${d.selectedObject.location}</div>
        <div class="asset-photo"><img src="${assets.pumpHero}" alt="насос"/></div>
        <div class="asset-metrics">
          <div class="metric-tile"><span>Износ (по нагрузке)</span><b style="color:var(--red)">${d.selectedObject.wear}%</b>${progress(d.selectedObject.wear,'red')}</div>
          <div class="metric-tile"><span>Текущая загрузка</span><b>${d.selectedObject.load}%</b>${progress(d.selectedObject.load)}</div>
          <div class="metric-tile"><span>Следующее ТО</span><b class="small">${d.selectedObject.nextTo}</b><small>${d.selectedObject.nextToNote}</small></div>
          <div class="metric-tile"><span>Стоимость ремонтов (накоп.)</span><b class="small">${d.selectedObject.repairCost}</b></div>
          <div class="metric-tile risk"><span>Риск простоя</span><b class="small">${d.selectedObject.downtimeRisk}</b></div>
          <div class="metric-tile"><span>Рекомендация</span><b class="small">${d.selectedObject.recommendation}</b></div>
        </div>
        <div class="related"><h4>Связанные объекты (4)</h4>${d.relatedObjects.map(r => `<button class="related-item" data-action="view" data-view="equipment"><span class="related-thumb"><img src="${r.img}" alt=""/></span><span><b>${r.name}</b><small>${r.loc}</small></span>${pill(r.status)}</button>`).join('')}</div>
      </div>
      <div>
        <div class="card map-card">
          <div class="map-toolbar">
            <div class="map-search">${icon('search')}<input value="Поиск по объектам, оборудованию, тегам..."/></div>
            <button class="map-filter">Все объекты</button>
            <button class="map-filter">Статус</button>
            <button class="map-filter">Тип оборудования</button>
            <button class="map-filter">Зоны</button>
            <button class="btn small">${icon('layers')} Слои</button>
            <button class="icon-btn">${icon('map')}</button>
            <button class="icon-btn">${icon('expand')}</button>
          </div>
          <div class="map-canvas">
            <img class="map-img" src="${assets.map}" alt="карта БНТ"/>
            ${networkSvg()}
            ${d.zones.map(z => `<button class="zone-marker ${z.theme}" style="left:${z.x}%;top:${z.y}%" data-action="zone" data-zone="${z.id}">${icon(zoneIcon(z.id))}<span>${z.title}<small>${z.subtitle}</small></span></button>`).join('')}
            ${mapNodes()}
            ${zonePopup(selectedZone)}
            <div class="map-controls"><button>N</button><button>+</button><button>-</button><button>${icon('settings')}</button></div>
            <div class="map-legend"><button class="active">Спутник</button><button>Схема</button></div>
          </div>
        </div>
        ${dashboardBottom()}
      </div>
    </div>`;
}

function zoneIcon(id) {
  if (id.includes('section') || id === 'products') return 'tank';
  if (id.includes('station')) return 'pump';
  if (id === 'rack') return 'train';
  if (id === 'warehouse') return 'warehouse';
  return 'truck';
}

function networkSvg() {
  return `<svg class="network-svg" viewBox="0 0 1000 500" preserveAspectRatio="none">
    <polyline points="205,128 322,128 470,85 603,95 796,123 849,199 805,255 905,264" fill="none" stroke="#2b9df0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="343,377 418,377 418,330 510,330 510,165 585,165 585,215 700,215 700,340 615,340 615,412 761,412 805,255" fill="none" stroke="#29d38a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="343,377 343,250 255,250" fill="none" stroke="#2b9df0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="510,165 438,165 438,112 322,112" fill="none" stroke="#31b6f7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="700,215 760,215 815,246 889,246" fill="none" stroke="#ff9b2f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${[ [205,128],[322,128],[470,85],[603,95],[796,123],[849,199],[805,255],[905,264],[343,377],[418,377],[510,330],[585,165],[700,215],[615,412],[761,412],[255,250] ].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="#0c83ed" stroke-width="3"></circle>`).join('')}
  </svg>`;
}

function mapNodes() {
  const nodes = [{x:49,y:38},{x:32,y:77},{x:15,y:56},{x:67,y:42},{x:78,y:15},{x:58,y:92},{x:89,y:80},{x:95,y:46}];
  return nodes.map((n,i) => `<span class="map-node ${i===7?'red':''}" style="left:${n.x}%;top:${n.y}%"></span>`).join('');
}

function zonePopup(zone) {
  const isSection = zone.id === 'section1';
  return `<div class="zone-pop" style="left:${isSection?53:zone.x}%;top:${isSection?52:zone.y+15}%;transform:translate(-50%,-50%)">
    <div class="pop-head"><div style="display:flex;gap:10px"><div class="pop-icon">${icon(zoneIcon(zone.id))}</div><div><h4>${zone.title}</h4><div class="subtitle">${zone.subtitle}</div></div></div><button class="icon-btn" style="width:28px;height:28px">×</button></div>
    <div class="pop-metrics"><div><span>${zone.id.startsWith('section')?'Резервуары':'Объекты'}</span><b>${zone.id.startsWith('section')?'8 шт.':'12 ед.'}</b></div><div><span>${zone.id.startsWith('section')?'Общий объем':'Производительность'}</span><b>${zone.id.startsWith('section')?'80 000 м³':'240 м³/ч'}</b></div><div><span>Загрузка</span><b>${zone.id === 'compressor' ? '56%' : '68%'}</b>${progress(zone.id === 'compressor' ? 56 : 68)}</div></div>
    <div class="pop-risk"><span>${icon('alert')} Риск простоя ${zone.id === 'section2' ? 'Средний' : 'Высокий'}</span><span>${icon('chart')}</span></div>
    <button class="btn primary" data-action="view" data-view="section">${zone.id.startsWith('section')?'Подробнее о секции':'Перейти к объекту'} →</button>
  </div>`;
}

function dashboardBottom() {
  return `<div class="control-bottom" style="margin-top:9px">
    <div class="card mini-panel"><div class="card-head"><div><h3>Прогноз простоев</h3><small>Все риски →</small></div></div><div class="body"><div class="big-number red">7</div><div style="font-size:12px;color:var(--red);font-weight:800;margin-top:-2px">объектов<br/>в зоне риска</div><div class="mini-chart">${[55,46,73,49,52,47].map((h,i)=>`<div class="mini-bar-col"><div class="mini-bar red" style="height:${Math.round(h*.35)}px"></div><div class="mini-bar orange" style="height:${Math.round(h*.24)}px"></div><div class="mini-bar" style="height:${Math.round(h*.33)}px"></div><small>${['Сен','Окт','Ноя','Дек','Янв','Фев'][i]}</small></div>`).join('')}</div><div style="display:flex;gap:12px;font-size:8px;color:var(--muted);margin-top:10px"><span><span class="status-dot" style="background:var(--red)"></span>Высокий риск</span><span><span class="status-dot" style="background:var(--orange)"></span>Средний риск</span><span><span class="status-dot blue"></span>Низкий риск</span></div></div></div>
    <div class="card mini-panel"><div class="card-head"><div><h3>Плановые объемы поставок</h3><small>Все поставки →</small></div></div><div class="body"><div class="big-number">241 000 м³</div><div style="font-size:10px;color:var(--muted)">ожидается к приему <span class="delta pos" style="margin-left:8px">↑ +12%</span></div><div class="split-bars">${[52,67,71,58,63,66].map((h,i)=>`<div><div class="stack"><i style="height:${h}% ;background:#2b8fe6"></i><i style="height:${Math.max(12,h*0.35)}%;background:#cfe6fb"></i></div><small>${['Сен','Окт','Ноя','Дек','Янв','Фев'][i]}</small></div>`).join('')}</div><div style="display:flex;gap:14px;font-size:8px;color:var(--muted);margin-top:7px"><span><span class="status-dot" style="background:#cfe6fb"></span>План</span><span><span class="status-dot blue"></span>Факт</span><span><span class="status-dot" style="background:#7bb8ef"></span>Прогноз</span></div></div></div>
    <div class="card mini-panel"><div class="card-head"><div><h3>Подача вагонов</h3><small>График →</small></div></div><div class="body"><div class="big-number">48</div><div style="font-size:10px;color:var(--muted)">вагонов в плане <span class="delta pos" style="margin-left:8px">+6</span></div><div class="wagon-list">${[['12.09','12','В пути','blue'],['13.09','8','Подтвержден','green'],['15.09','14','План','gray'],['17.09','10','План','gray'],['19.09','4','План','gray']].map(r=>`<div class="wagon-row"><span>${r[0]}</span><b>${r[1]}</b><span><span class="status-dot ${r[3]}"></span>${r[2]}</span></div>`).join('')}</div></div></div>
    <div class="card mini-panel"><div class="card-head"><div><h3>Закупки и запчасти</h3><small>Критические позиции →</small></div></div><div class="body"><div class="big-number red">3</div><div style="font-size:10px;color:var(--muted);font-weight:700">критические позиции<br/>из 12 наименований</div><div class="critical-list" style="margin-top:8px">${[['Подшипник 6312','2 шт.','12 дней'],['Уплотнение торцевое','1 шт.','17 дней'],['Клапан предохранительный','1 шт.','25 дней']].map(x=>`<div class="critical-row"><span><b>${x[0]}</b></span><span>${x[1]}</span><span class="pill ${Number.parseInt(x[2])<20?'red':'orange'}">${x[2]}</span></div>`).join('')}</div><button class="btn soft" style="margin-top:10px;width:100%" data-action="view" data-view="procurement">${icon('cart')} Перейти к закупкам</button></div></div>
    <div class="card mini-panel"><div class="card-head"><div><h3>Рейтинг риска оборудования</h3><small>Все объекты →</small></div></div><div class="body"><div class="risk-list-mini">${appData.analytics.riskRanking.map((r,i)=>`<div class="risk-mini"><span class="rank r${i+1}">${i+1}</span><span><b>${r[0]}</b></span><b>${r[1]}</b>${pill(r[2])}</div>`).join('')}</div></div></div>
    <div class="card bottom-wide">
      <div class="card"><div class="card-head"><div><h3>План работ (ближайшие 30 дней)</h3></div><button class="link" data-action="view" data-view="toir">Открыть план →</button></div><div class="gantt"><div class="gantt-head"><span>Сен</span>${Array.from({length:23},(_,i)=>`<span>${i+8}</span>`).join('')}</div>${[['Насос Н-101','blue',4,4],['Резервуар Р-3','blue',9,8],['Клапан К-24','green',15,5],['Стендер №4','orange',21,2]].map(r=>`<div class="gantt-row"><span>${r[0]}</span>${Array.from({length:23},(_,i)=>`<span>${i+1===r[2]?`<i class="gantt-task ${r[1]}" style="grid-column:${r[2]+1}/span ${r[3]}"></i>`:''}</span>`).join('')}</div>`).join('')}</div></div>
      <div class="card"><div class="card-head"><div><h3>Бюджет ТОиР</h3></div><button class="link" data-action="view" data-view="analytics">Детализация →</button></div><div class="budget-box"><div class="budget-top"><strong>$ 241 000</strong><span style="font-size:9px;color:var(--muted)">на 6 месяцев</span></div>${progress(38)}<div class="budget-meta"><div><span>Использовано 38%</span><b>$ 92 000</b></div><div><span>Остаток</span><b>$ 149 000</b></div></div><div class="effect-box"><strong>-21%</strong><small>снижение аварийных простоев при выполнении плана</small></div></div></div>
      <div class="card"><div class="card-head"><div><h3>Износ оборудования</h3></div><button class="link" data-action="view" data-view="equipment">По типам →</button></div><div class="wear-list">${[['Насосы',72],['Резервуары',58],['Клапаны',46],['Компрессоры',39],['Прочее',28]].map(w=>`<div class="wear-line"><span>${w[0]}</span>${progress(w[1])}<b>${w[1]}%</b></div>`).join('')}</div></div>
    </div>
  </div>`;
}

function renderSection() {
  const s = appData.sections[state.selectedZone] || appData.sections.section1;
  const reservoir = s.reservoirs.find(r => r.id === state.selectedTank) || s.reservoirs[2];
  return `
  <div class="section-layout">
    <div class="card section-summary">
      <button class="back-link" data-action="view" data-view="dashboard">← К списку объектов</button>
      <h3>${s.title}</h3>
      <p>${s.subtitle}</p>
      <div class="summary-metric"><div class="summary-icon">${icon('tank')}</div><div><span>Общий объем секции</span><b>${s.totalVolume}</b></div><em>${s.tanks} шт.</em></div>
      <div class="summary-metric"><div class="summary-icon">${icon('chart')}</div><div><span>Текущая загрузка</span><b>${s.currentLoadPercent}%</b>${progress(s.currentLoadPercent)}</div><em>${s.currentLoadVolume}</em></div>
      <div class="summary-metric"><div class="summary-icon">${icon('warehouse')}</div><div><span>Свободная емкость</span><b>${s.freeCapacity}</b></div><em>32%</em></div>
      <div class="summary-metric green"><div class="summary-icon">${icon('plus')}</div><div><span>Ожидаемый приход</span><b>${s.expectedIncoming}</b></div><em>в течение 7 дней</em></div>
      <div class="summary-metric red"><div class="summary-icon">${icon('alert')}</div><div><span>Прогноз простоев</span><b>${s.downtimeCount}</b></div><em>объектов в зоне риска</em></div>
      <div class="linked-list"><h4>Связанное оборудование</h4>${s.linkedEquipment.map(l=>`<div class="linked-row"><div class="summary-icon">${icon(l.icon)}</div><div><b>${l.title}</b><small>${l.note}</small></div><div><em>${l.value}</em></div></div>`).join('')}</div>
    </div>
    <div>
      <div class="card map-card section-map">
        <div class="map-toolbar"><div class="map-search">${icon('search')}<input value="Поиск по объектам в секции..."/></div><button class="map-filter">Тип объекта: Все</button><button class="btn small">${icon('layers')} Слои</button><button class="icon-btn">${icon('map')}</button><button class="icon-btn">${icon('expand')}</button></div>
        <div class="map-canvas" style="height:425px"><img class="map-img" src="${assets.map}" alt=""/><svg class="network-svg" viewBox="0 0 1000 430" preserveAspectRatio="none"><rect x="340" y="95" width="360" height="220" rx="6" fill="rgba(13,114,201,.10)" stroke="#2b9df0" stroke-width="3"/><line x1="340" y1="205" x2="700" y2="205" stroke="#39d39d" stroke-width="4"/><line x1="340" y1="145" x2="700" y2="145" stroke="#2b9df0" stroke-width="4"/><line x1="340" y1="265" x2="700" y2="265" stroke="#39d39d" stroke-width="4"/>${s.reservoirs.map(r=>`<circle cx="${r.pos.x*10}" cy="${r.pos.y*4.2}" r="38" fill="rgba(255,255,255,.85)" stroke="rgba(12,131,237,.7)" stroke-width="3"/>`).join('')}</svg>${s.reservoirs.map(r=>`<button class="tank-marker ${state.selectedTank===r.id?'active':''}" style="left:${r.pos.x}%;top:${r.pos.y}%" data-action="tank" data-tank="${r.id}">${r.id}</button>`).join('')}<button class="zone-marker blue" style="left:29%;top:17%">${icon('pump')}<span>Насосная станция №1</span></button><button class="zone-marker blue" style="left:21%;top:63%">${icon('pump')}<span>Насосная станция №2</span></button>
        <div class="zone-pop" style="right:18px;top:28px;left:auto;transform:none;width:340px"><div class="pop-head"><div style="display:flex;gap:10px"><div class="pop-icon">${icon('tank')}</div><div><h4>Резервуар ${reservoir.id}</h4><div class="subtitle">Секция 1 · Резервуарный парк</div></div></div><button class="icon-btn" style="width:28px;height:28px">×</button></div><div style="display:grid;gap:10px;margin-top:8px">${metricInline('Текущая загрузка',`${reservoir.load}%`,progress(reservoir.load),`${reservoir.volume} из ${reservoir.capacity}`)}${metricInline('План поступления','↑ 5 000 м³','', 'до 14.09.2024', 'var(--green)')}${metricInline('Температура продукта',reservoir.temp,'', 'Норма', 'var(--blue)')}${metricInline('Следующий осмотр',reservoir.next,'', 'через 22 дня')}<div class="pop-risk"><span>${icon('alert')} Риск коррозии ${reservoir.risk}</span><span>${icon('chart')}</span></div>${metricInline('Статус',reservoir.status,'', '', 'var(--green)')}</div><button class="btn primary" style="width:100%;margin-top:10px" data-action="view" data-view="equipment">Перейти к объекту →</button></div>
        <div class="map-controls" style="top:120px"><button>N</button><button>+</button><button>-</button><button>${icon('settings')}</button></div></div>
      </div>
      <div class="section-tabs" style="margin-top:10px"><button class="active">Аналитика секции</button><button>Планирование</button><button>ТОиР</button><button>Сценарии</button><button>Документы</button><div style="margin-left:auto;display:flex;gap:8px"><button class="btn">${icon('calendar')}01.09.2024 – 30.11.2024</button><button class="btn">${icon('export')}Экспорт</button></div></div>
      <div class="analytics-row">${sectionAnalyticsCards(s)}</div>
      <div class="section-table-events">
        <div class="card"><div class="card-head"><div><h3>Объекты секции 1 (24)</h3></div><div class="section-tabs"><button class="active">Все 24</button><button>Резервуары 8</button><button>Насосы 3</button><button>Клапаны 6</button><button>Датчики 5</button><button>Шкафы 2</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>№</th><th>Наименование</th><th>Тип</th><th>Объем / параметры</th><th>Текущая загрузка</th><th>Статус</th><th>Риск</th><th>Следующее ТО</th><th></th></tr></thead><tbody>${s.reservoirs.slice(0,4).map((r,i)=>`<tr ${state.selectedTank===r.id?'style="background:#f0f8ff"':''}><td>${i+1}</td><td><b>Резервуар ${r.id}</b></td><td>Резервуар</td><td>20 000 м³</td><td>${progress(r.load)}<small>${r.load}%</small></td><td>${pill(r.status)}</td><td>${pill(r.risk)}</td><td>${r.next}</td><td><button class="icon-btn" style="width:28px;height:28px" data-action="tank" data-tank="${r.id}">⋮</button></td></tr>`).join('')}</tbody></table></div></div>
        <div class="card"><div class="card-head"><div><h3>Последние события</h3></div><button class="link">Все события →</button></div><div class="events">${s.events.map(e=>`<div class="event-row"><time>${e[0]}</time><b>${e[1]}</b><span>${e[2]}</span></div>`).join('')}</div></div>
      </div>
    </div>
  </div>`;
}

function metricInline(label, value, extraHtml='', note='', color='var(--text)') {
  return `<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center"><div><div style="font-size:8px;color:var(--muted)">${label}</div><div style="font-size:10px;font-weight:800;color:${color};margin-top:4px">${value}</div>${extraHtml?`<div style="margin-top:4px">${extraHtml}</div>`:''}</div><div style="font-size:8px;color:var(--muted)">${note}</div></div>`;
}

function sectionAnalyticsCards(s) {
  return `
    <div class="card analytics-card"><h4>Баланс секции</h4><div class="balance-lines"><div class="balance-line"><span class="status-dot blue"></span><span>Текущий объем</span><b>${s.currentLoadVolume}</b></div><div class="balance-line"><span class="status-dot green"></span><span>Ожидаемый приход</span><b>${s.expectedIncoming}</b></div><div class="balance-line"><span class="status-dot" style="background:#9bb3c9"></span><span>Свободная емкость</span><b>${s.freeCapacity}</b></div></div><div class="balance-strip"><i style="width:68%"></i><i style="width:15%"></i><i style="width:17%"></i></div></div>
    <div class="card analytics-card"><h4>Плановые объемы</h4><div style="display:grid;gap:9px"><div><span style="font-size:8px;color:var(--muted)">План (90 дней)</span><b style="float:right">241 000 м³</b>${progress(100)}</div><div><span style="font-size:8px;color:var(--muted)">Факт (прогноз)</span><b style="float:right">228 000 м³</b>${progress(95)}</div><div style="margin-top:6px;color:var(--green);font-weight:800;font-size:19px">95%</div></div></div>
    <div class="card analytics-card"><h4>Влияние загрузки на износ</h4><div class="gauge"></div><div class="gauge-value">72%</div><p style="text-align:center;color:var(--orange);font-weight:800;font-size:9px;margin:5px 0 0">Повышенный износ</p><p style="text-align:center;color:var(--muted);font-size:8px;line-height:12px;margin:4px 0 0">При загрузке > 70% скорость коррозии выше на 35%</p></div>
    <div class="card analytics-card"><h4>Прогноз ремонтного окна</h4><div style="display:flex;gap:8px"><div class="kpi-icon">${icon('calendar')}</div><div><b style="display:block">Октябрь 2024<br/>12–18 октября</b><span class="pill orange" style="margin-top:6px">Рекомендуется</span></div></div><p style="font-size:8px;color:var(--muted);line-height:12px;margin-top:12px">Снижение загрузки до 50%. Ожидаемая длительность: 6 дней.</p></div>
    <div class="card analytics-card"><h4>Рекомендации</h4><div class="recommend-box"><div class="kpi-icon">${icon('chart')}</div><p>Перераспределить часть приходящего объема на Секцию 2 для снижения загрузки Р-3 и Р-4 до 65%.</p></div><button class="btn soft" style="margin-top:14px;width:100%" data-action="view" data-view="analytics">Применить сценарий →</button></div>`;
}

function renderEquipment() {
  return `
  <div class="equipment-head">
    <div><div class="breadcrumbs">Оборудование  ›  Насосы  ›  Насос Н-101</div><div class="equipment-title"><h2>Насос Н-101</h2>${pill('Работает')}</div><div class="equipment-sub">Насосная станция №1 · Секция 1 · Резервуарный парк</div></div>
    <div class="equipment-facts"><button class="btn" data-action="view" data-view="section">${icon('map')} Открыть на схеме</button><button class="btn" data-action="toast" data-message="Действия по объекту доступны в расширенной версии.">Действия</button>${[['Инвентарный номер','PMP-00101'],['Тип','Центробежный насос'],['Производитель','KSB'],['Модель','Etanorm 200-250'],['Год ввода','2018']].map(f=>`<div class="equipment-fact"><span>${f[0]}</span><b>${f[1]}</b></div>`).join('')}</div>
  </div>
  <div class="equipment-grid">
    <div class="card eq-photo"><img src="${assets.pumpHero}" alt="Насос"/><button class="btn small" style="position:absolute;transform:translate(16px,-56px);background:#173d5d;color:#fff;border-color:#173d5d">${icon('camera')} Ещё 6 фото</button></div>
    <div class="eq-tabs"><button>Общее</button><button class="active">Связанные узлы</button><button>Показатели</button><button>История ремонта</button><button>Документы</button><button>Бюджет</button><button>Предиктивная модель</button></div>
    <div class="card assembly"><h3>Состав оборудования</h3><div class="assembly-img"><img src="${assets.pumpAssembly}" alt="сборка насоса"/><div class="part-card" style="left:16px;top:16px"><span class="mini"><img src="${assets.pumpAssembly}"/></span><span>Электродвигатель<br/>${pill('Работает')}</span></div><div class="part-card" style="right:156px;top:16px"><span class="mini"><img src="${assets.valve}"/></span><span>Муфта К-101<br/>${pill('Норма')}</span></div><div class="part-card" style="right:18px;top:16px"><span class="mini"><img src="${assets.valve}"/></span><span>Подшипниковый узел<br/>${pill('Норма')}</span></div><div class="part-card" style="left:18px;bottom:16px"><span class="mini"><img src="${assets.cabinet}"/></span><span>Шкаф управления ШУ-101<br/>${pill('Работает')}</span></div><div class="part-card" style="right:18px;bottom:16px"><span class="mini"><img src="${assets.valve}"/></span><span>Вибродатчик ВД-101<br/>${pill('Онлайн')}</span></div></div></div>
    <div class="card metrics-panel"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Ключевые показатели</h3>${pill('Онлайн')}</div><div class="metric-grid">${[['Износ по нагрузке','72%','red',''],['Наработка','18 420 ч','','+12% к прошлому периоду'],['Текущая загрузка','85%','',''],['КПД','68%','',''],['Вибрация (RMS)','4,2 мм/с','','+28%, норма до 4.5'],['Температура','76 °C','','норма до 80'],['Следующее ТО','11 сентября 2024','','через 22 дня'],['Суммарная стоимость ремонтов','$ 18 400','','за 12 месяцев'],['Прогнозируемая дата ремонта','15 декабря 2024','','через 93 дня'],['Вероятность отказа','32%','','Средний риск']].map(m=>`<div class="eq-metric"><span>${m[0]}</span><strong ${m[2]==='red'?'style="color:var(--red)"':''}>${m[1]}</strong><small>${m[3]}</small>${/Износ|Текущая|Вероятность/.test(m[0])?progress(parseInt(m[1]),m[0].includes('Износ')?'red':''):''}</div>`).join('')}</div></div>
  </div>
  <div class="equipment-bottom">
    <div class="card line-chart"><div class="card-head" style="padding:0 0 8px;border:0"><div><h3>Динамика износа</h3></div><div class="section-tabs"><button>6 мес</button><button class="active">1 год</button><button>3 года</button><button>Весь период</button></div></div>${lineChart()}</div>
    <div class="card"><div class="card-head"><div><h3>История ремонтов</h3></div><button class="link">Все записи →</button></div><div class="repair-table"><table class="data-table"><thead><tr><th>Дата</th><th>Тип работ</th><th>Описание</th><th>Стоимость</th><th>Исполнитель</th></tr></thead><tbody>${[['12.03.2024','Плановый','Замена подшипников','$ 4 800','ТехСервис'],['18.09.2023','Аварийный','Ремонт уплотнения','$ 7 200','ПромРемонт'],['02.02.2023','Плановый','Замена муфты','$ 3 100','ТехСервис'],['14.08.2022','Плановый','ТО, замена масла','$ 1 200','БНТ-Сервис'],['27.01.2022','Аварийный','Ремонт корпуса насоса','$ 8 600','ПромРемонт']].map(r=>`<tr><td>${r[0]}</td><td>${pill(r[1])}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="card-head"><div><h3>Рекомендации</h3></div></div><div class="recommendations">${recCard('Средний риск','Прогноз: 15 дек 2024','Запланировать замену подшипникового узла','По данным виброанализа наблюдается рост вибрации. Рекомендуется замена подшипников при ближайшем ТО.','$ 6 200 · 3 позиции запчастей · 8 ч')}${recCard('Низкий риск','Прогноз: Q2 2025','Проверить уплотнение вала','Незначительное увеличение утечки. Контроль при следующем ТО.','$ 1 500 · 1 позиция запчастей · 4 ч')}</div></div>
  </div>`;
}

function lineChart() {
  return `<svg viewBox="0 0 520 170"><rect x="0" y="0" width="520" height="40" class="chart-risk"/><g class="chart-grid">${[20,60,100,140].map(y=>`<line x1="0" y1="${y}" x2="520" y2="${y}"/>`).join('')}${[20,70,120,170,220,270,320,370,420,470].map(x=>`<line x1="${x}" y1="0" x2="${x}" y2="160"/>`).join('')}</g><path class="chart-area" d="M20 130 L70 118 L120 104 L170 90 L220 82 L270 78 L320 72 L370 52 L420 40 L470 28 L520 22 L520 160 L20 160Z"/><path class="chart-path" d="M20 130 L70 118 L120 104 L170 90 L220 82 L270 78 L320 72 L370 52 L420 40 L470 28 L520 22"/></svg><div style="display:flex;justify-content:space-between;font-size:8px;color:var(--muted);padding:0 10px 8px">${['Сен','Окт','Ноя','Дек','Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен'].map(m=>`<span>${m}</span>`).join('')}</div><div style="display:flex;gap:14px;font-size:8px;color:var(--muted);padding:0 10px"><span><span class="status-dot blue"></span>Фактический износ</span><span><span class="status-dot" style="background:#7bb8ef"></span>Прогноз</span><span><span class="status-dot" style="background:#f7ccd3"></span>Зона риска (> 80%)</span></div>`;
}

function recCard(risk, forecast, title, text, meta) {
  return `<div class="rec-card"><div style="display:flex;justify-content:space-between;align-items:center">${pill(risk)}<small style="color:var(--muted)">${forecast}</small></div><h4>${title}</h4><p>${text}</p><div class="rec-foot"><div class="rec-meta">${meta}</div><button class="btn primary small" data-action="toast" data-message="Рекомендация добавлена в план ТО.">Добавить в план ТО</button></div></div>`;
}

function renderAnalytics() {
  const current = appData.analytics.scenarios.find(s => s.id === state.selectedScenario) || appData.analytics.scenarios[0];
  const whatIf = calcWhatIf();
  return `
    <div class="kpi-grid">${[
      ['Вероятность отказов','12%','средняя по оборудованию','red', '+2%'],
      ['Прогноз простоев','7 объектов','в ближайшие 90 дней','blue','-28%'],
      ['Влияние загрузки на износ','+18%','при текущих объемах','green',''],
      ['Прогноз бюджета ТОиР','$ 241 000','на 6 месяцев','orange','-12%'],
      ['Плановые объемы','241 000 м³','в месяц','blue','+12%'],
      ['Доступность мощностей','92%','с учетом прогнозов','green','-3%'],
    ].map(k=>`<div class="kpi ${k[3]}"><div class="kpi-icon">${icon(k[3]==='red'?'alert':k[3]==='green'?'chart':k[3]==='orange'?'dollar':'calendar')}</div><div><div class="label">${k[0]}</div><strong>${k[1]}</strong><div class="meta">${k[2]} ${k[4]?`<span class="delta ${k[4].startsWith('+')?'neg':'pos'}" style="margin-left:8px">${k[4]}</span>`:''}</div></div></div>`).join('')}</div>
    <div class="analytics-main" style="display:grid;grid-template-columns:1.55fr .7fr .62fr;gap:9px">
      <div class="card"><div class="card-head"><div><h3>Сценарии и их сравнение</h3><p>Оцените влияние различных сценариев на ключевые показатели терминала</p></div><div style="display:flex;gap:7px"><button class="btn small" data-action="toast" data-message="В прототипе добавление сценариев показано как концепция.">${icon('plus')} Добавить сценарий</button><button class="icon-btn">⋮</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Сценарий</th><th>Риск простоя</th><th>Стоимость (6 мес)</th><th>Ожидаемый эффект</th><th>Загрузка секций</th><th>Аварийные ремонты</th></tr></thead><tbody>${appData.analytics.scenarios.map((s,idx)=>`<tr style="cursor:pointer;${state.selectedScenario===s.id?'background:#eef6ff':''}" data-action="scenario" data-scenario="${s.id}"><td>${idx+1}</td><td><b>${s.name}</b><small>${s.subtitle}</small></td><td>${pill(s.riskLabel)} <b>${s.risk}%</b></td><td>${s.cost}</td><td><b>${s.effect}</b><small>${s.effectText}</small></td><td>${s.load}%</td><td>${s.repairs}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="card-head"><div><h3>Рейтинг риска оборудования</h3></div><button class="link" data-action="view" data-view="equipment">Все объекты →</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Оборудование</th><th>Индекс риска</th><th>Статус</th></tr></thead><tbody>${appData.analytics.riskRanking.map((r,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${pill(r[2])}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card scenario-side"><div class="card-head"><div><h3>Детали сценария</h3></div><button class="icon-btn">×</button></div><div style="padding:14px"><div style="display:flex;align-items:center;gap:10px;background:#eef5ff;border-radius:12px;padding:12px"><div class="avatar" style="background:#0c83ed">01</div><div><b style="font-size:18px">${current.details.title}</b><div style="color:var(--muted);font-size:10px">${current.details.sub}</div></div></div><h4 style="font-size:12px;margin:14px 0 6px">Краткое описание</h4><p style="font-size:10px;color:var(--muted);line-height:16px;margin:0">${current.details.desc}</p><h4 style="font-size:12px;margin:14px 0 6px">Ключевые выводы</h4><ul style="padding-left:18px;font-size:10px;color:var(--text-2);line-height:18px;margin:0">${current.details.bullets.map(b=>`<li>${b}</li>`).join('')}</ul><div style="margin-top:14px;background:#f6fbff;border:1px solid var(--line);border-radius:12px;padding:12px"><b style="font-size:12px">Рекомендуемые действия</b><div style="display:grid;gap:8px;margin-top:10px">${current.details.actions.map(a=>`<div style="display:grid;grid-template-columns:20px 1fr;gap:8px;align-items:flex-start;font-size:10px">${icon('check')}<span>${a}</span></div>`).join('')}</div></div><button class="btn primary" style="width:100%;margin-top:14px" data-action="toast" data-message="Сценарий принят в работу диспетчером.">${icon('check')} Принять сценарий</button><button class="btn" style="width:100%;margin-top:8px" data-action="toast" data-message="Экспорт сценарного отчета подготовлен.">${icon('export')} Экспортировать отчет</button></div></div>
    </div>
    <div class="analytics-charts" style="display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:9px;margin-top:9px">
      <div class="card chart-card"><div class="card-head"><div><h3>Матрица риск / эффект</h3><small>Сравнение сценариев по ключевым параметрам</small></div></div><div style="height:220px;padding:10px 12px;position:relative">${scatterPlot()}</div></div>
      <div class="card chart-card"><div class="card-head"><div><h3>Прогноз износа оборудования</h3><small>Ожидаемый износ по типам оборудования при различных сценариях</small></div></div><div class="stack-bars">${stackBars()}</div></div>
      <div class="card chart-card"><div class="card-head"><div><h3>Прогноз ремонтов по месяцам</h3></div><button class="link">Все работы →</button></div><div class="stack-bars">${repairsBars()}</div></div>
    </div>
    <div class="analytics-footer">
      <div class="card"><div class="card-head"><div><h3>Эффект от выполнения рекомендаций</h3><small>Потенциальное снижение рисков и затрат</small></div></div><div class="effect-grid">${[['-21%','риск аварийных простоев'],['$ 68 000','экономия за 6 месяцев'],['+4%','доступность мощностей'],['-35%','количество аварийных ремонтов']].map(x=>`<div class="effect-mini"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('')}</div></div>
      <div class="card"><div class="card-head"><div><h3>Что будет, если...</h3><small>Интерактивная оценка влияния изменений</small></div></div><div class="whatif"><div class="whatif-controls"><select><option>Увеличить объемы перевалки</option></select><select id="impact-select"><option value="10">на 10%</option><option value="20" ${state.scenarioImpact===20?'selected':''}>на 20%</option><option value="30" ${state.scenarioImpact===30?'selected':''}>на 30%</option></select></div><div class="whatif-result"><div><span>Риск простоя</span><b>${whatIf.risk}%</b></div><div><span>Загрузка секций</span><b>${whatIf.load}%</b></div><div><span>Бюджет ТОиР</span><b>${whatIf.budget}</b></div><div><span>Доступность</span><b>${whatIf.availability}%</b></div></div></div></div>
      <div class="card"><div class="card-head"><div><h3>Влияние плановых объемов на доступность</h3></div></div><div class="availability-chart">${availabilityChart()}</div></div>
    </div>`;
}

function calcWhatIf() {
  const impact = Number(state.scenarioImpact) || 20;
  return { risk: impact===10?18:impact===20?24:31, load: impact===10?79:impact===20?89:95, budget: impact===10?'$ 271 000':impact===20?'$ 298 000':'$ 334 000', availability: impact===10?89:impact===20?86:81 };
}

function scatterPlot() {
  const points = [['Объединение ремонта',8,95,'#18ad70'],['Перенос вагонов',6,-70,'#18ad70'],['Базовый сценарий',12,18,'#0c83ed'],['Рост объемов +12%',20,68,'#f59e0b'],['Задержка закупки ЗИП',28,-90,'#f04455']];
  return `<svg viewBox="0 0 360 190" style="width:100%;height:100%"><line x1="40" y1="10" x2="40" y2="170" stroke="#d9e7f0"/><line x1="40" y1="170" x2="330" y2="170" stroke="#d9e7f0"/>${[0,10,20,30,40].map((x,i)=>`<text x="${40+i*72}" y="186" font-size="8" fill="#7f98ad">${x}</text>`).join('')}${[150,100,50,0,-50,-100,-150].map((y,i)=>`<text x="5" y="${16+i*26}" font-size="8" fill="#7f98ad">${y}</text>`).join('')}${points.map(p=>{const x=40+p[1]*7.2; const y=90-p[2]*0.52; return `<circle cx="${x}" cy="${y}" r="8" fill="${p[3]}" opacity=".9"/><text x="${x+10}" y="${y-4}" font-size="8" fill="#23486e">${p[0]}</text>`;}).join('')}</svg>`;
}

function stackBars() {
  const groups = [['Насосы',[35,52,28,64,31]],['Клапаны',[42,47,26,77,35]],['Электродвигатели',[15,23,17,43,21]],['Компрессоры',[18,29,19,52,24]],['Резервуары',[24,35,22,41,29]],['Стендеры',[16,28,19,36,25]]];
  const colors = ['#2b8fe6','#f2a531','#16ad72','#f04455','#9b7bff'];
  return `<div style="display:flex;gap:13px;height:165px;padding:12px 12px 26px;align-items:flex-end">${groups.map(g=>`<div class="stack-col">${g[1].map((h,idx)=>`<i style="height:${h}px;background:${colors[idx]}"></i>`).join('')}<label>${g[0]}</label></div>`).join('')}</div><div style="display:flex;gap:12px;font-size:8px;color:var(--muted);padding:0 12px 12px">${['Базовый','Рост объемов +12%','Перенос вагонов','Задержка ЗИП','Объединение ремонта'].map((t,i)=>`<span><span class="status-dot" style="background:${colors[i]}"></span>${t}</span>`).join('')}</div>`;
}

function repairsBars() {
  const vals = [[3,8,5],[5,9,4],[4,7,3],[3,6,2],[2,5,2],[2,4,2]];
  return `<div style="display:flex;gap:13px;height:165px;padding:12px 16px 26px;align-items:flex-end">${vals.map((v,i)=>`<div class="stack-col"><i style="height:${v[0]*12}px;background:#f04455"></i><i style="height:${v[1]*12}px;background:#2b8fe6"></i><i style="height:${v[2]*12}px;background:#b8d8f7"></i><label>${['Сен','Окт','Ноя','Дек','Янв','Фев'][i]}</label></div>`).join('')}</div><div style="display:flex;gap:12px;font-size:8px;color:var(--muted);padding:0 12px 12px"><span><span class="status-dot" style="background:#f04455"></span>Аварийные</span><span><span class="status-dot blue"></span>Плановые</span><span><span class="status-dot" style="background:#b8d8f7"></span>Диагностика</span></div>`;
}

function availabilityChart() {
  return `<svg viewBox="0 0 350 120"><line x1="30" y1="10" x2="30" y2="95" stroke="#d9e7f0"/><line x1="30" y1="95" x2="330" y2="95" stroke="#d9e7f0"/><polyline points="30,18 90,23 150,31 210,39 270,51 330,62" fill="none" stroke="#0c83ed" stroke-width="3"/><polygon points="30,14 90,18 150,24 210,32 270,44 330,56 330,70 270,59 210,47 150,38 90,30 30,25" fill="rgba(12,131,237,.12)"/><circle cx="210" cy="39" r="6" fill="#fff" stroke="#0c83ed" stroke-width="3"/><rect x="190" y="14" width="42" height="18" rx="9" fill="#0c83ed"/><text x="201" y="27" font-size="8" fill="#fff">92%</text>${[180,200,220,241,260,280].map((x,i)=>`<text x="${24+i*60}" y="114" font-size="8" fill="#7f98ad">${x}000</text>`).join('')}</svg>`;
}

function renderLogistics() {
  return `<div class="kpi-grid">${[
    ['Ожидаемый объем поступления','241 000 м³','+12% к предыдущей неделе','blue'],
    ['Подтвержденные вагоны','48 / 63','76% от плановых','blue'],
    ['Риск перегрузки секций','2 секции','Секция 1, Секция 3','red'],
    ['Доступная емкость','80 000 м³','32% от общей','blue'],
    ['Прогноз очереди на эстакаде','12 вагонов','+6 к текущему','blue'],
    ['Влияние на простои','7 дней','+3 дней риск при текущем плане','red'],
  ].map(k=>`<div class="kpi ${k[3]==='red'?'red':''}"><div class="kpi-icon">${icon(k[0].includes('вагоны')?'train':k[0].includes('простои')?'calendar':k[0].includes('перегрузки')?'alert':'warehouse')}</div><div><div class="label">${k[0]}</div><strong>${k[1]}</strong><div class="meta">${k[2]}</div></div></div>`).join('')}</div>
  <div class="logistics-grid">
    <div class="card week-card"><div class="card-head"><div><h3>Плановая подача вагонов и статусы</h3></div></div><div class="week-toolbar"><button class="btn small">Неделя</button><button class="btn small">Месяц</button><button class="btn small">9–15 сентября 2024</button><button class="btn small">Сегодня</button></div><div class="week-table">${weekTable()}</div><div style="display:flex;gap:16px;font-size:8px;color:var(--muted);padding:10px 14px"><span><span class="status-dot blue"></span>Подтвержден</span><span><span class="status-dot" style="background:#a9d5f6"></span>В пути</span><span><span class="status-dot green"></span>Выгрузка</span><span><span class="status-dot" style="background:#f28993"></span>Отклонение</span></div></div>
    <div class="card"><div class="card-head"><div><h3>Предупреждения и рекомендации</h3></div><button class="link">Все (7) →</button></div><div class="warnings">${appData.logistics.warnings.map(w=>`<div class="warning-row"><div class="warning-icon ${w.level==='orange'?'orange':w.level==='blue'?'blue':''}">${icon(w.level==='red'?'alert':w.level==='orange'?'calendar':'chart')}</div><div><b>${w.title}</b><p>${w.text}</p></div><div style="text-align:right">${pill(w.badge)}<time>${w.time}</time></div></div>`).join('')}</div></div>
  </div>
  <div class="log-mid"><div class="card"><div class="card-head"><div><h3>Цепочка поставки и распределения</h3></div><button class="link">Показать детали →</button></div><div class="supply-chain"><div class="chain-node"><h4>Ж/д поставка</h4><strong>174</strong><small>вагонов</small><strong style="display:block;margin-top:10px">241 000 м³</strong><small>План на неделю</small></div><div class="chain-arrow">→</div><div class="chain-node"><h4>Резервуары</h4><strong>8 шт.</strong><small>Загрузка 68%</small>${progress(68)}</div><div class="chain-arrow">→</div><div class="chain-node"><h4>Насосные станции</h4><strong>2 из 3</strong><small>Доступны</small>${progress(64,'green')}</div><div class="chain-arrow">→</div><div class="chain-node"><h4>Причалы / Отгрузка</h4><strong>3 причала</strong><small>Загрузка 54%</small>${progress(54)}</div></div></div>
  <div class="card"><div class="card-head"><div><h3>Сценарное моделирование</h3></div><button class="link" data-action="view" data-view="analytics">Сравнить сценарии →</button></div><div class="scenario-actions">${appData.logistics.scenarios.map(s=>`<div class="scenario-action"><div><b>${s[0]}</b><p>Снижение риска при перераспределении потока и согласовании графика.</p></div><div class="scenario-effect">${s[1]}<small style="display:block;color:var(--muted)">${s[2]}</small></div><button class="btn primary small" data-action="toast" data-message="Сценарий применен к недельному плану поставок.">Применить</button></div>`).join('')}</div></div></div>
  <div class="log-bottom"><div class="card"><div class="card-head"><div><h3>Прогноз загрузки емкостей</h3></div></div><div class="coverage-chart">${[['Секция 1',85],['Секция 2',68],['Секция 3',52],['Резервуарный парк',39]].map(c=>`<div class="coverage-col"><i style="height:${c[1]}%;background:#0c83ed"></i><label>${c[0]}</label><b>${c[1]}%</b></div>`).join('')}</div></div>
  <div class="card"><div class="card-head"><div><h3>Прогноз очереди на ж/д эстакаде</h3></div></div><div class="availability-chart"><svg viewBox="0 0 350 120"><line x1="30" y1="95" x2="330" y2="95" stroke="#d9e7f0"/><polyline points="30,88 80,66 130,50 180,39 230,56 280,72 330,85" fill="none" stroke="#0c83ed" stroke-width="3"/><polyline points="30,88 80,66 130,50 180,39 230,56 280,72 330,85" fill="none" stroke="#7bb8ef" stroke-width="2" stroke-dasharray="6 5"/>${[8,14,18,22,16,12,8].map((v,i)=>`<rect x="${20+i*50}" y="${95-v*2.5}" width="20" height="${v*2.5}" fill="rgba(12,131,237,.18)"/><text x="${25+i*50}" y="${90-v*2.5}" font-size="8" fill="#0c83ed">${v}</text><text x="${18+i*50}" y="114" font-size="8" fill="#7f98ad">${['09.09','10.09','11.09','12.09','13.09','14.09','15.09'][i]}</text>`).join('')}</svg></div></div>
  <div class="card"><div class="card-head"><div><h3>Ближайшие ремонтные окна и ограничения</h3></div><button class="link">Все события →</button></div><div class="repair-table"><table class="data-table"><thead><tr><th>Объект</th><th>Тип</th><th>Начало</th><th>Окончание</th><th>Влияние</th></tr></thead><tbody>${[['Насосная станция №2','Плановое ТО','10.09 08:00','12.09 20:00','Высокое'],['Секция 2','Ремонт','15.09 08:00','17.09 18:00','Среднее'],['Причал №3','Диагностика','13.09 06:00','13.09 18:00','Низкое'],['Клапан К-24','Замена','До 17.09','—','Высокое']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${pill(r[4])}</td></tr>`).join('')}</tbody></table></div></div></div>`;
}

function weekTable() {
  const heads = ['Тип груза','Пн 09.09','Вт 10.09','Ср 11.09','Чт 12.09','Пт 13.09','Сб 14.09','Вс 15.09','Итого'];
  const rows = [['Сырая нефть','blue',[8,10,12,8,6,4,8],56],['Бензин Аи‑92','green',[4,6,8,6,4,4,4],36],['Дизельное топливо','orange',[6,8,6,8,6,4,6],44],['Мазут','purple',[2,4,4,4,2,2,4],22],['Прочее','gray',[2,4,2,2,2,2,2],16]];
  return `${heads.map((h,i)=>`<div class="week-cell head" ${i===0?'style="text-align:left;padding-left:12px"':''}>${h}</div>`).join('')}${rows.map(r=>`<div class="week-cell row-head"><span class="cargo-dot ${r[1]}"></span>${r[0]}</div>${r[2].map(v=>`<div class="week-cell"><b>${v}</b><div class="wagon-bars"><i></i><i class="light"></i>${v>7?'<i class="red"></i>':''}${v%2===0?'<i class="green"></i>':''}</div></div>`).join('')}<div class="week-cell head">${r[3]}</div>`).join('')}<div class="week-cell row-head"><b>Всего вагонов</b></div>${[22,32,32,28,20,16,24].map(v=>`<div class="week-cell head">${v}</div>`).join('')}<div class="week-cell head">174</div>`;
}

function renderProcurement() {
  return `
  <div class="kpi-grid">${[['Критические позиции','3','из 312 наименований','red','+2'],['Обеспеченность запасами','78%','к предыдущему периоду','green','+6%'],['Средний срок пополнения','14 дней','к предыдущему периоду','blue','-3 дня'],['Стоимость дефицита','$ 186 тыс.','потенциальные потери за 12 месяцев','red',''],['Предотвращаемый простой','-21%','снижение риска простоя','green','~7 дней'],['Открытые тендеры','3','на сумму $ 241 000','blue','']].map(k=>`<div class="kpi ${k[3]==='red'?'red':k[3]==='green'?'green':''}"><div class="kpi-icon">${icon(k[0].includes('тендеры')?'report':k[0].includes('запасами')?'layers':k[0].includes('дефицита')?'dollar':k[0].includes('позиции')?'alert':'calendar')}</div><div><div class="label">${k[0]}</div><strong>${k[1]}</strong><div class="meta">${k[2]} ${k[4]?`<span class="delta ${/\+/.test(k[4])?'pos':'neg'}">${k[4]}</span>`:''}</div></div></div>`).join('')}</div>
  <div class="proc-grid">
    <div class="card parts-table"><div class="card-head"><div><h3>Критические запчасти и потребности</h3><small>На основе предиктивной аналитики и планов ТОиР</small></div><div class="page-toolbar-actions"><button class="map-filter">Все категории</button><button class="map-filter">Все статусы</button><div class="map-search" style="min-width:280px">${icon('search')}<input value="Поиск по наименованию, артикулу, активу..."/></div></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th></th><th>Наименование / артикул</th><th>Категория</th><th>Связанный актив</th><th>Текущий остаток</th><th>Мин. остаток</th><th>Срок поставки</th><th>Статус закупки</th><th>Эффект на риск простоя</th></tr></thead><tbody>${appData.procurement.parts.map(p=>`<tr><td><input type="checkbox"/></td><td><div class="part-name"><span class="part-thumb"><img src="${p.img}" alt=""/></span><span><b>${p.name}</b><small>${p.code}</small></span></div></td><td>${pill(p.category)}</td><td><b>${p.asset}</b><small>${p.loc}</small></td><td style="color:var(--red);font-weight:800">${p.stock}</td><td>${p.min}</td><td><span class="pill ${parseInt(p.lead)<18?'red':'orange'}">${p.lead}</span></td><td>${pill(p.status)}</td><td><b style="color:var(--green)">${p.effect}</b><small>${p.priority}</small></td></tr>`).join('')}</tbody></table></div></div>
    <div class="card tender-panel"><div class="card-head"><div><h3>Открытый тендер</h3></div><button class="link">Перейти к тендеру →</button></div><div class="tender-body"><div class="tender-head"><div><h3>T-2024-017 — Подшипники и уплотнения</h3><p style="font-size:10px;color:var(--muted);margin:2px 0 0">Поставка подшипников, уплотнений и сопутствующих материалов</p></div>${pill('Открыт')}</div><div class="tender-meta"><div><span>Сумма закупки</span><b>$ 48 000</b></div><div><span>Срок подачи заявок</span><b>15.09.2024</b><small>3 дня</small></div><div><span>Статус</span><b>Открыт</b></div></div><div class="steps"><div class="step done">Подготовка</div><div class="step done">Прием заявок</div><div class="step">Рассмотрение</div><div class="step">Выбор поставщика</div><div class="step">Контракт</div></div><div class="tender-tabs"><button class="active">Состав тендера (5)</button><button>Поставщики (4)</button><button>Документы</button></div><table class="data-table"><thead><tr><th>Наименование</th><th>Кол-во</th><th>Ожид. цена</th></tr></thead><tbody>${[['Подшипник 6312','6 шт.','$ 12 000'],['Уплотнение торцевое MTG-45','8 шт.','$ 8 500'],['Подшипник 6308','4 шт.','$ 7 000'],['Ремкомплект уплотнений','10 шт.','$ 6 500'],['Смазка индустриальная','20 кг','$ 4 000']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}<tr><td><b>Итого (ориентировочно)</b></td><td></td><td><b>$ 48 000</b></td></tr></tbody></table><button class="btn primary" style="width:100%;margin-top:12px" data-action="toast" data-message="Заявка на тендер открыта в модуле закупок.">Перейти к тендеру</button></div></div>
  </div>
  <div class="proc-bottom"><div class="card"><div class="card-head"><div><h3>Покрытие склада по категориям</h3></div><button class="link">Все категории →</button></div><div class="coverage-chart">${[['Подшипники',62,78],['Клапаны',74,102],['Уплотнения',58,56],['Электрика',81,48],['КИП',76,66]].map(c=>`<div class="coverage-col"><i style="height:${Math.round(c[1]*.28)}%;background:#18ad70"></i><i style="height:15%;background:#2b8fe6"></i><i style="height:12%;background:#f2a531"></i><i style="height:10%;background:#f04455"></i><label>${c[0]}</label><b>${c[2]}<br/><span style="color:var(--green)">${c[1]}%</span></b></div>`).join('')}</div><div style="display:flex;gap:12px;font-size:8px;color:var(--muted);padding:0 12px 12px"><span><span class="status-dot" style="background:#f04455"></span>Ниже минимума</span><span><span class="status-dot" style="background:#f2a531"></span>На границе</span><span><span class="status-dot blue"></span>Достаточно</span><span><span class="status-dot green"></span>Избыток</span></div></div>
    <div class="card"><div class="card-head"><div><h3>Поставщики / Тендеры</h3></div><button class="link">Все тендеры →</button></div><div class="tender-list"><div class="tender-tabs"><button class="active">Открытые (3)</button><button>В работе (2)</button><button>Завершенные (8)</button></div><table class="data-table"><thead><tr><th>№</th><th>Наименование</th><th>Поставщик</th><th>Сумма</th><th>Срок подачи</th><th>Статус</th></tr></thead><tbody>${appData.procurement.tenders.map(t=>`<tr><td>${t[0]}</td><td>${t[1]}</td><td>${t[2]}</td><td>${t[3]}</td><td>${t[4]}</td><td>${pill(t[5])}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="card-head"><div><h3>Рекомендации системы</h3><small>На основе риска отказов, остатков и планов ТОиР</small></div><button class="link">Все рекомендации →</button></div><div class="rec-system">${[['Срочная закупка','Подшипник 6312, уплотнение MTG-45','Риск простоя насосов Н-101 — 42%','red'],['Объединить закупку','Клапаны К-24 и уплотнения','Возможна экономия до 11%','orange'],['Привязка к активам','Запчасти для насосов Н-101, Н-102','Высокий износ (72% и 68%)','blue']].map(r=>`<div class="system-rec"><div class="warning-icon ${r[3]==='orange'?'orange':r[3]==='blue'?'blue':''}">${icon(r[3]==='red'?'alert':r[3]==='orange'?'cart':'pump')}</div><div><b>${r[0]}</b><small>${r[1]}<br/>${r[2]}</small></div><div>→</div></div>`).join('')}</div></div>
  </div>`;
}

function renderToir() {
  return `
    <div class="module-grid">${[['Активы под контролем','207','оборудование, помещения, ЗИП'],['Плановые ремонты','12','в ближайшие 30 дней'],['Критические ремонты','3','требуют решения сегодня'],['Бюджет ТОиР','$ 241 000','горизонт 6 месяцев']].map(m=>`<div class="card module-card"><span>${m[0]}</span><strong>${m[1]}</strong><div style="font-size:9px;color:var(--muted)">${m[2]}</div></div>`).join('')}</div>
    <div class="toir-toolbar"><div class="search-box">${icon('search')}<input value="Поиск по активам, заказам, сотрудникам, видам работ..."/></div><div class="page-toolbar-actions"><button class="btn" data-action="modal" data-modal="asset">${icon('filePlus')} Новый актив</button><button class="btn primary" data-action="modal" data-modal="repair">${icon('wrench')} Новый ремонт</button></div></div>
    <div class="card"><div class="card-head"><div><h3>Операционные формы ТОиР</h3><small>Формы и статусы работ. Логика прототипа строится как отдельный модуль внутри цифрового двойника.</small></div><div class="section-tabs"><button class="active">Наряды-задания</button><button>История ремонта</button><button>Склад</button><button>Рейтинг сотрудников</button><button>Новый актив</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>№</th><th>Актив</th><th>Вид работ</th><th>Срок</th><th>Статус</th><th>Ответственный</th><th>Действия</th></tr></thead><tbody>${appData.toir.workOrders.map(w=>`<tr><td>${w[0]}</td><td><b>${w[1]}</b></td><td>${w[2]}</td><td>${w[3]}</td><td>${pill(w[4])}</td><td>${w[5]}</td><td><button class="btn small" data-action="toast" data-message="Карточка ${w[0]} открыта.">Открыть</button></td></tr>`).join('')}</tbody></table></div></div>
    <div class="report-landing" style="margin-top:10px">
      <div class="card report-preview"><h3>Форма «Новый актив»</h3><p>В расширенном прототипе форма создания актива связана с картой, категорией оборудования, паспортом актива, ответственным подразделением, регламентом обслуживания и бюджетом.</p><div class="form-grid" style="margin-top:12px"><div class="field"><span>Наименование</span><input value="Насос Н-103"/></div><div class="field"><span>Категория</span><input value="Оборудование"/></div><div class="field"><span>Местоположение</span><input value="Насосная станция №2"/></div><div class="field"><span>Внутренний номер</span><input value="PMP-00103"/></div><div class="field"><span>Первоначальная стоимость</span><input value="$ 12 400"/></div><div class="field"><span>Дата следующего обслуживания</span><input value="25.10.2024"/></div><div class="field full"><span>Описание актива</span><input value="Резервный насос для линии налива в автоцистерны."/></div></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn primary" data-action="toast" data-message="Черновик актива сохранен.">Сохранить черновик</button><button class="btn">Отправить на согласование</button></div></div>
      <div class="card report-preview"><h3>Форма «Заявка на ремонт»</h3><p>Заявка на ремонт интегрируется с прогнозом отказов, складом ЗИП и календарем логистических ограничений. Это позволяет не только фиксировать дефект, но и сразу оценивать риск простоя.</p><div class="form-grid" style="margin-top:12px"><div class="field"><span>Актив</span><input value="Клапан К-24"/></div><div class="field"><span>Приоритет</span><input value="Критичный"/></div><div class="field"><span>Вид дефекта</span><input value="Потеря герметичности"/></div><div class="field"><span>Ожидаемая длительность</span><input value="8 ч"/></div><div class="field"><span>Необходимые ЗИП</span><input value="Уплотнение, комплект крепежа"/></div><div class="field"><span>Окно ремонта</span><input value="17.09.2024"/></div><div class="field full"><span>Комментарий</span><input value="Рекомендуется совместить с плановой остановкой насосной станции №2."/></div></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn primary" data-action="toast" data-message="Заявка на ремонт зарегистрирована.">Зарегистрировать</button><button class="btn" data-action="view" data-view="analytics">Оценить влияние на риск</button></div></div>
    </div>`;
}

function renderReports() {
  return `
    <div class="module-grid">${[['Снижение аварийных простоев','-21%','по итогам сценарного плана'],['Плановый объем перевалки','241 000 м³','горизонт 90 дней'],['Расходы на ремонт','$ 92 000','использовано из бюджета'],['Критические закупки','3','в работе / тендеры']].map(m=>`<div class="card module-card"><span>${m[0]}</span><strong>${m[1]}</strong><div style="font-size:9px;color:var(--muted)">${m[2]}</div></div>`).join('')}</div>
    <div class="report-landing">
      <div class="card report-preview"><h3>Дашборд руководителя</h3><p>Витрина объединяет управленческие показатели терминала: объемы, бюджет ТОиР, закупки, риск простоев, загрузку резервуаров, дисциплину исполнения ремонтов и эффективность персонала. Прототип ориентирован на быстрое чтение управленческой картины без ухода в технические детали.</p><div class="report-blocks">${[['Загрузка секций','68%'],['Риск простоев','7 объектов'],['Подача вагонов','48'],['Критический ЗИП','3 позиции']].map(x=>`<div class="report-block-mini"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join('')}</div><div style="margin-top:12px"><button class="btn primary" data-action="toast" data-message="PDF-отчет для руководства сформирован.">${icon('export')} Сформировать PDF</button></div></div>
      <div class="card report-preview"><h3>Структура отчетности</h3><p>В прототип включены управленческие срезы, соответствующие исходным формам и расширенные логикой цифрового двойника.</p><ul style="margin:8px 0 0;padding-left:18px;font-size:10px;line-height:18px;color:var(--text-2)"><li>Отчет по ремонтам и качеству ремонта.</li><li>История ремонта по активам и узлам.</li><li>Наличие запчастей на складе и критические закупки.</li><li>Рейтинг сотрудников и исполнение нарядов.</li><li>Все активы, износ, плановые и аварийные работы.</li><li>Предиктивные сценарии: влияние объемов, износа и логистики на простой.</li></ul><div class="report-blocks"><div class="report-block-mini"><strong>$ 241 000</strong><span>Прогноз бюджета ТОиР</span></div><div class="report-block-mini"><strong>95%</strong><span>Выполнение плана поступлений</span></div></div></div>
    </div>
    <div style="margin-top:10px" class="card report-preview"><h3>Управленческий сценарный набор</h3><p>Для презентации заказчику в ZIP-сборке предусмотрены несколько полноценных сценариев использования: диспетчерский мониторинг, детальная работа с секцией, диагностика насоса, логистика, закупки, сценарное моделирование и формы ТОиР. Это позволяет демонстрировать не отдельный экран, а связанную систему поддержки решений.</p><div class="section-tabs" style="margin-top:10px"><button class="active" data-action="view" data-view="dashboard">Диспетчерский центр</button><button data-action="view" data-view="section">Секция</button><button data-action="view" data-view="equipment">Оборудование</button><button data-action="view" data-view="analytics">Сценарии</button><button data-action="view" data-view="logistics">Логистика</button><button data-action="view" data-view="procurement">Закупки</button><button data-action="view" data-view="toir">Формы ТОиР</button></div></div>`;
}

function renderReference() {
  return `<div class="card report-preview"><h3>Справочники цифрового двойника</h3><p>В демонстрационной сборке справочные данные показаны как концептуальный слой модели предприятия. Он обеспечивает единые идентификаторы оборудования, типов активов, зон терминала, причин отказов, сценариев ТОиР и категорий запасов.</p><div class="report-blocks">${[['Зоны терминала','8'],['Типы оборудования','26'],['Регламенты ТО','14'],['Категории ЗИП','12']].map(x=>`<div class="report-block-mini"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join('')}</div><div class="table-wrap" style="margin-top:14px"><table class="data-table"><thead><tr><th>Сущность</th><th>Назначение</th><th>Пример</th></tr></thead><tbody>${[['Зона','Пространственная привязка активов','Секция 1 / Резервуарный парк'],['Тип отказа','Предиктивная аналитика и ТОиР','Рост вибрации, потеря герметичности'],['Категория ЗИП','Связь со складом и закупками','Подшипники, уплотнения, КИП'],['Режим работы','Расчет загрузки и износа','Пиковый, плановый, резервный']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function bind() {
  document.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', handleAction));
  const impact = document.getElementById('impact-select');
  if (impact) impact.addEventListener('change', e => { state.scenarioImpact = Number(e.target.value); render(); });
}

function handleAction(e) {
  const el = e.currentTarget;
  const action = el.dataset.action;
  if (action === 'view') { state.view = el.dataset.view; render(); }
  if (action === 'zone') { state.selectedZone = el.dataset.zone; if (el.dataset.zone === 'section1' || el.dataset.zone === 'section2') state.view = 'section'; render(); }
  if (action === 'tank') { state.selectedTank = el.dataset.tank; state.view = 'section'; render(); }
  if (action === 'scenario') { state.selectedScenario = el.dataset.scenario; render(); }
  if (action === 'toast') toast(el.dataset.message || 'Действие выполнено.');
  if (action === 'modal') { state.modal = el.dataset.modal; renderModal(); }
}

function renderModal() {
  const root = document.getElementById('modal-root');
  if (!state.modal) { root.innerHTML = ''; return; }
  const isAsset = state.modal === 'asset';
  root.innerHTML = `<div class="overlay" id="overlay"><div class="modal"><div class="modal-head"><h3>${isAsset?'Новый актив':'Новая заявка на ремонт'}</h3><button class="icon-btn" id="modal-close">×</button></div><div class="modal-body"><div class="form-grid">${isAsset?assetForm():repairForm()}</div></div><div class="modal-foot"><button class="btn" id="modal-cancel">Отмена</button><button class="btn primary" id="modal-save">${isAsset?'Сохранить актив':'Создать заявку'}</button></div></div></div>`;
  root.querySelector('#modal-close').onclick = closeModal;
  root.querySelector('#modal-cancel').onclick = closeModal;
  root.querySelector('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeModal(); });
  root.querySelector('#modal-save').onclick = () => { toast(isAsset ? 'Актив успешно создан.' : 'Заявка на ремонт успешно зарегистрирована.'); closeModal(); };
}

function assetForm() {
  return `${field('Наименование','Насос Н-103')}${field('Категория','Оборудование')}${field('Местоположение','Насосная станция №2')}${field('Внутренний номер','PMP-00103')}${field('Первоначальная стоимость','$ 12 400')}${field('Дата следующего обслуживания','25.10.2024')}${field('Ответственное подразделение','Служба эксплуатации',true)}${field('Описание','Резервный насос для линии налива в автоцистерны.',true)}`;
}

function repairForm() {
  return `${field('Актив','Клапан К-24')}${field('Приоритет','Критичный')}${field('Тип работ','Замена уплотнения')}${field('Дата выполнения','17.09.2024')}${field('Требуемые ЗИП','Уплотнение, крепеж',true)}${field('Комментарий','Рекомендуется объединить с плановой остановкой насосной станции №2.',true)}`;
}

function field(label, val, full=false) { return `<div class="field ${full?'full':''}"><span>${label}</span><input value="${esc(val)}"/></div>`; }
function closeModal() { state.modal = null; renderModal(); }

function toast(message) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon('checklist')}<div><b>Действие выполнено</b><small>${message}</small></div>`;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(6px)'; }, 2600);
  setTimeout(() => el.remove(), 3200);
}

window.addEventListener('DOMContentLoaded', render);
