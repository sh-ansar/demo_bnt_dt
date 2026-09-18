window.BNTNavigation = {
  groups: [
    {
      label: "Предприятие",
      defaultPage: "dispatcher",
      defaultHref: "/digital-twin",
      items: [
        {
          id: "enterprise-home",
          label: "Главная",
          icon: "home",
          children: [
            ["dispatcher", "/digital-twin", "Цифровой двойник", "dispatcher"],
            ["operations", "/operations", "Операционная аналитика", "templates"],
            ["analytics", "/analytics", "Предиктивная аналитика", "analytics"]
          ]
        },
        {
          id: "finance",
          label: "Финансы и договоры",
          icon: "finance",
          children: [
            ["financial-results", "/financial-results", "Финансовые результаты", "templates"],
            ["budget-payments", "/budget-payments", "Бюджет и платежи", "templates"],
            ["contracts", "/contracts", "Договоры и обязательства", "templates"]
          ]
        },
        {
          id: "enterprise-logistics",
          label: "Логистика",
          icon: "logistics",
          children: [
            ["logistics", "/logistics", "Вагоны", "logistics"],
            ["transshipment", "/transshipment", "Перевалка", "templates"]
          ]
        },
        ["equipment", "/equipment", "Активы", "equipment"],
        ["procurement", "/procurement", "Закупки", "procurement"],
        ["toir", "/toir", "ТОиР", "toir"],
        ["hr", "/hr", "Кадры", "hr"],
        ["projects", "/projects", "Проекты", "projects"]
      ]
    },
    {
      label: "Управление",
      defaultPage: "reports",
      defaultHref: "/reports",
      items: [
        ["reports", "/reports", "Отчеты", "reports"],
        ["templates", "/templates", "Шаблоны", "templates"],
        ["builder", "/builder", "Конструктор", "builder"],
        ["data", "/data", "Данные", "data"],
        ["mailings", "/mailings", "Рассылки", "mailings"],
        ["sync", "/sync", "Синхронизация", "sync"]
      ]
    }
  ],
  pages: {
    overview: ["Обзор", "Диспетчерский центр и текущее состояние терминала"],
    dispatcher: ["Цифровой двойник", "Интерактивная 3D-модель терминала, зон, резервуаров и оборудования"],
    operations: ["Операционная аналитика", "Обзор операционной деятельности предприятия"],
    "operations-archive": ["Операционная аналитика_archiv", "Архивная версия операционной аналитики"],
    analytics: ["Предиктивная аналитика", "Риски простоев, сценарии, доступность и бюджет ТОиР"],
    "financial-results": ["Финансовые результаты", ""],
    "budget-payments": ["Бюджет и платежи", ""],
    contracts: ["Договоры и обязательства", ""],
    logistics: ["Вагоны", "Подача вагонов, входящие объемы и ограничения емкостей"],
    transshipment: ["Перевалка", ""],
    equipment: ["Активы", "Реестр активов, техническое состояние и сервисные интервалы"],
    "equipment-detail": ["Паспорт оборудования", "Метрики, связанные узлы, история ремонтов и прогноз"],
    procurement: ["Закупки", "Критический ЗИП, покрытие склада, тендеры и поставщики"],
    toir: ["ТОиР", "Заявки, наряды, история ремонтов и оценка качества"],
    hr: ["Кадры", ""],
    projects: ["Проекты", ""],
    reports: ["Управленческая отчетность", "Report Studio v5 · рабочие отчеты и экспорт"],
    templates: ["Шаблоны отчетов", "Report Studio v5 · готовые и пользовательские шаблоны"],
    builder: ["Конструктор отчетов", "Report Studio v5 · компоновка и настройка блоков"],
    data: ["Данные", "Report Studio v5 · наборы 1С и Pelogas"],
    mailings: ["Рассылки", "Report Studio v5 · расписания и тестовая отправка"],
    sync: ["Синхронизация", "Report Studio v5 · состояние источников и срезов"]
  }
};
