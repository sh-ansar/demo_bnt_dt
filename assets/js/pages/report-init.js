(function () {
  const page = document.body.dataset.page;
  const view = page === "mailings" ? "schedules" : page;
  const allowed = new Set(["reports","templates","builder","data","schedules","sync"]);
  if (!allowed.has(view)) return;
  try {
    const key = "bnt-studio-v5";
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    state.view = view;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (_) {
    /* Report Studio falls back to its built-in state when storage is unavailable. */
  }
})();
