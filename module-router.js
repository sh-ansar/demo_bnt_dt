(function () {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const requested =
    params.get("module");

  if (!requested) {
    return;
  }

  const aliases = {

    equipment: [
      "оборудование",
      "тоир и активы",
      "активы"
    ],

    analytics: [
      "предиктивная аналитика",
      "аналитика"
    ],

    toir: [
      "тоир",
      "тоир и активы"
    ],

    logistics: [
      "логистика"
    ],

    procurement: [
      "закупки",
      "склад",
      "запчасти"
    ],

    reports: [
      "отчеты",
      "отчёты"
    ],

    templates: [
      "шаблоны"
    ],

    builder: [
      "конструктор"
    ],

    data: [
      "данные"
    ],

    schedules: [
      "рассылки",
      "автоматические рассылки"
    ],

    sync: [
      "синхронизация"
    ]
  };

  const names =
    aliases[requested] ||
    [requested];

  function normalize(value) {

    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function tryOpen() {

    const candidates = [
      ...document.querySelectorAll(
        [
          "button",
          "a",
          "[role='button']",
          "[data-nav]",
          "[data-view]",
          "[data-page]"
        ].join(",")
      )
    ];

    const target =
      candidates.find(element => {

        const text =
          normalize(
            element.textContent
          );

        const datasets = [
          element.dataset?.nav,
          element.dataset?.view,
          element.dataset?.page
        ]
        .filter(Boolean)
        .map(normalize);

        return names.some(name => {

          const needle =
            normalize(name);

          return (
            text === needle ||
            text.includes(needle) ||
            datasets.includes(needle)
          );
        });
      });

    if (!target) {
      return false;
    }

    target.click();

    return true;
  }

  let attempts = 0;

  const timer =
    setInterval(() => {

      attempts++;

      if (
        tryOpen() ||
        attempts > 30
      ) {

        clearInterval(timer);
      }

    }, 180);

})();
