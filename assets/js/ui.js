window.BNTUI = {
  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char]));
  },
  badge(label, tone = "") {
    return `<span class="badge ${tone}">${this.escape(label)}</span>`;
  },
  progress(value, tone = "") {
    const safe = Math.max(0, Math.min(100, Number(value) || 0));
    return `<div class="progress ${tone}"><i style="width:${safe}%"></i></div>`;
  },
  toast(title, message = "") {
    let root = document.querySelector(".toast-root");
    if (!root) {
      root = document.createElement("div");
      root.className = "toast-root";
      document.body.appendChild(root);
    }
    const item = document.createElement("div");
    item.className = "app-toast";
    item.innerHTML = `<strong>${this.escape(title)}</strong><span>${this.escape(message)}</span>`;
    root.appendChild(item);
    window.setTimeout(() => item.remove(), 3200);
  },
  modal({title, fields = [], submitLabel = "Сохранить", onSubmit}) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<form class="modal-card"><div class="modal-head"><h3>${this.escape(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Закрыть">×</button></div><div class="modal-body"><div class="form-grid">${fields.map(field => `<label class="field ${field.full ? "full" : ""}"><span>${this.escape(field.label)}</span>${field.type === "textarea" ? `<textarea name="${this.escape(field.name)}" required>${this.escape(field.value || "")}</textarea>` : field.options ? `<select name="${this.escape(field.name)}">${field.options.map(option => `<option>${this.escape(option)}</option>`).join("")}</select>` : `<input name="${this.escape(field.name)}" type="${field.type || "text"}" value="${this.escape(field.value || "")}" ${field.required === false ? "" : "required"}>`}</label>`).join("")}</div></div><div class="modal-foot"><button type="button" class="btn" data-close>Отмена</button><button class="btn btn-primary" type="submit">${this.escape(submitLabel)}</button></div></form>`;
    const close = () => backdrop.remove();
    backdrop.addEventListener("click", event => { if (event.target === backdrop || event.target.closest("[data-close]")) close(); });
    backdrop.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      if (onSubmit) onSubmit(values);
      close();
    });
    document.body.appendChild(backdrop);
    backdrop.querySelector("input,select,textarea")?.focus();
  },
  speedDialSecondary({label = "Ещё", ariaLabel = "Ещё действия", items = []} = {}) {
    if (!items.length) return "";
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.6501 12H4.6606M12.0001 12H12.0106M19.3501 12H19.3606M5.7001 12C5.7001 12.5799 5.23 13.05 4.6501 13.05C4.0702 13.05 3.6001 12.5799 3.6001 12C3.6001 11.4201 4.0702 10.95 4.6501 10.95C5.23 10.95 5.7001 11.4201 5.7001 12ZM13.0501 12C13.0501 12.5799 12.58 13.05 12.0001 13.05C11.4202 13.05 10.9501 12.5799 10.9501 12C10.9501 11.4201 11.4202 10.95 12.0001 10.95C12.58 10.95 13.0501 11.4201 13.0501 12ZM20.4001 12C20.4001 12.5799 19.93 13.05 19.3501 13.05C18.7702 13.05 18.3001 12.5799 18.3001 12C18.3001 11.4201 18.7702 10.95 19.3501 10.95C19.93 10.95 20.4001 11.4201 20.4001 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const links = items.map(item => {
      const itemIcon = item.icon ? `<span class="speed-dial-secondary__item-icon" aria-hidden="true">${item.icon}</span>` : "";
      return `<a class="speed-dial-secondary__link typography-body-smallest" href="${this.escape(item.href)}" role="menuitem">${itemIcon}<span class="speed-dial-secondary__link-text">${this.escape(item.label)}</span></a>`;
    }).join("");
    return `<div class="speed-dial-secondary" data-speed-dial-secondary><button class="speed-dial-secondary__trigger button-smallest-secondary-radius" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="${this.escape(ariaLabel)}"><span class="speed-dial-secondary__icon">${icon}</span><span class="speed-dial-secondary__label typography-indicator-small">${this.escape(label)}</span></button><div class="speed-dial-secondary__menu" role="menu" hidden>${links}</div></div>`;
  },
  setSpeedDialOpen(root, open) {
    if (!root) return;
    const trigger = root.querySelector(".speed-dial-secondary__trigger");
    const menu = root.querySelector(".speed-dial-secondary__menu");
    root.classList.toggle("is-open", open);
    trigger?.setAttribute("aria-expanded", String(open));
    if (menu) menu.hidden = !open;
  },
  closeSpeedDials(except = null) {
    document.querySelectorAll("[data-speed-dial-secondary]").forEach(root => {
      if (root !== except) this.setSpeedDialOpen(root, false);
    });
  }
};

document.addEventListener("click", event => {
  const trigger = event.target.closest("[data-speed-dial-secondary] .speed-dial-secondary__trigger");
  if (trigger) {
    event.preventDefault();
    const root = trigger.closest("[data-speed-dial-secondary]");
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    window.BNTUI.closeSpeedDials(root);
    window.BNTUI.setSpeedDialOpen(root, !isOpen);
    return;
  }
  if (!event.target.closest("[data-speed-dial-secondary]")) window.BNTUI.closeSpeedDials();
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  const openSpeedDial = document.querySelector('[data-speed-dial-secondary] .speed-dial-secondary__trigger[aria-expanded="true"]');
  if (!openSpeedDial) return;
  window.BNTUI.closeSpeedDials();
  event.stopImmediatePropagation();
});

