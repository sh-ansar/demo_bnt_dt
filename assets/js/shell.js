(function () {
  const nav = window.BNTNavigation;
  if (!nav) return;

  const page = document.body.dataset.page || "home";
  const activePage = page === "equipment-detail" ? "equipment" : page;
  const meta = nav.pages[page] || nav.pages.home;
  const content = document.querySelector("#page-content");
  if (!content) return;

  const icons = {
    home:'<path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5v-9Z"/>',
    dispatcher:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    equipment:'<circle cx="12" cy="12" r="3"/><path d="M9.5 3h5l.7 2.2 2 .8 2-1 2.5 4.3-1.8 1.5.1 2.3 1.8 1.5-2.5 4.3-2-1-2 .8-.7 2.3h-5l-.7-2.3-2-.8-2 1L2.4 14.6l1.8-1.5-.1-2.3-1.8-1.5L4.8 5l2 1 2-.8L9.5 3Z"/>',
    analytics:'<path d="M4 19V9M10 19V5M16 19v-7M22 19V3M3 14l7-5 6 2 6-6"/>',
    maintenance:'<path d="m14.2 5.1 4.7-2.2-.6 5-3.2 3.2-3.1-.7-7.5 7.5a2.1 2.1 0 0 0 3 3l7.5-7.5-.7-3.1 3.2-3.2 5-.6-2.2 4.7"/>',
    logistics:'<path d="M3 6h12v10H3zM15 9h3l3 3v4h-6z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    procurement:'<path d="M4 7h16l-1 14H5L4 7Zm4 0V5a4 4 0 0 1 8 0v2"/>',
    reports:'<path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h8"/>',
    templates:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h5M8 16h7"/>',
    builder:'<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>',
    data:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    mailings:'<path d="M3 5h18v14H3zM4 7l8 6 8-6"/>',
    sync:'<path d="M20 7V3l-2 2a8 8 0 0 0-13.3 3M4 17v4l2-2a8 8 0 0 0 13.3-3"/>',
    refresh:'<path d="M20 7V3l-2 2a8 8 0 1 0 2 8"/>'
  };

  function icon(id) {
    return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true">${icons[id] || icons.home}</svg>`;
  }

  const sidebar = document.createElement("aside");
  sidebar.className = "app-sidebar";
  sidebar.innerHTML = `
    <a class="brand" href="/">
      <span class="brand-mark">BNT</span>
      <span class="brand-copy">
        <strong>BNT</strong>
        <span>Enterprise Management</span>
      </span>
    </a>

    <nav class="app-nav" aria-label="Основная навигация">
      ${nav.groups.map(group => `
        <div class="nav-label">${group.label}</div>
        ${group.items.map(([id,href,label,iconId]) => `
          <a class="nav-link ${activePage === id ? "active" : ""}" href="${href}"
             ${activePage === id ? 'aria-current="page"' : ""}>
            <span class="nav-icon">${icon(iconId)}</span>
            <span>${label}</span>
          </a>
        `).join("")}
      `).join("")}
    </nav>

    <div class="sidebar-foot">
      <div class="live-line">
        <i class="live-dot"></i>
        <span>Данные обновляются</span>
      </div>
    </div>
  `;

  const topbar = document.createElement("header");
  topbar.className = "app-topbar";
  topbar.innerHTML = `
    <button class="icon-btn mobile-menu" type="button" aria-label="Меню">☰</button>

    <div class="page-heading">
      <h1>${meta[0]}</h1>
      <p>${meta[1]}</p>
    </div>

    <div class="topbar-tools">
      <button class="btn btn-secondary shell-action" type="button" data-shell-sync>
        ${icon("refresh")}
        <span>Обновить данные</span>
      </button>

      <div class="profile">
        <span class="avatar">ИА</span>
        <div>
          <strong>Иванов А.В.</strong>
          <small>Диспетчер</small>
        </div>
      </div>
    </div>
  `;

  const main = document.createElement("div");
  main.className = "app-main";
  content.parentNode.insertBefore(main, content);
  main.append(topbar, content);

  const shell = document.createElement("div");
  shell.className = "app-shell";
  main.parentNode.insertBefore(shell, main);
  shell.append(sidebar, main);

  topbar.querySelector(".mobile-menu").addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });

  sidebar.addEventListener("click", event => {
    if (event.target.closest("a")) document.body.classList.remove("nav-open");
  });

  topbar.querySelector("[data-shell-sync]").addEventListener("click", () => {
    window.BNTUI?.toast("Данные обновлены", "Демонстрационный срез пересчитан");
  });
})();
