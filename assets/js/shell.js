(function () {
  const nav = window.BNTNavigation;
  if (!nav) return;
  const page = document.body.dataset.page || "home";
  const activePage = page === "equipment-detail" ? "equipment" : page;
  const meta = nav.pages[page] || nav.pages.home;
  const content = document.querySelector("#page-content");
  if (!content) return;

  const sidebar = document.createElement("aside");
  sidebar.className = "app-sidebar";
  sidebar.innerHTML = `<a class="brand" href="/"><span class="brand-mark">BNT</span><span class="brand-copy"><strong>BNT</strong><span>Enterprise Management</span></span></a><nav class="app-nav" aria-label="Основная навигация">${nav.groups.map(group => `<div class="nav-label">${group.label}</div>${group.items.map(([id,href,label,icon]) => `<a class="nav-link ${activePage === id ? "active" : ""}" href="${href}" ${activePage === id ? "aria-current=\"page\"" : ""}><span class="nav-icon">${icon}</span><span>${label}</span></a>`).join("")}`).join("")}</nav><div class="sidebar-foot"><div class="live-line"><i class="live-dot"></i><span>Данные обновляются</span></div></div>`;

  const topbar = document.createElement("header");
  topbar.className = "app-topbar";
  topbar.innerHTML = `<button class="icon-btn mobile-menu" type="button" aria-label="Меню">☰</button><div class="page-heading"><h1>${meta[0]}</h1><p>${meta[1]}</p></div><div class="topbar-tools"><button class="btn btn-secondary" type="button" data-shell-sync>Обновить данные</button><div class="profile"><span class="avatar">ИА</span><div><strong>Иванов А.В.</strong><small>Диспетчер</small></div></div></div>`;

  const main = document.createElement("div");
  main.className = "app-main";
  content.parentNode.insertBefore(main, content);
  main.append(topbar, content);
  const shell = document.createElement("div");
  shell.className = "app-shell";
  main.parentNode.insertBefore(shell, main);
  shell.append(sidebar, main);

  topbar.querySelector(".mobile-menu").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  sidebar.addEventListener("click", () => document.body.classList.remove("nav-open"));
  topbar.querySelector("[data-shell-sync]").addEventListener("click", () => window.BNTUI?.toast("Данные обновлены", "Локальный демонстрационный срез пересчитан"));
})();
