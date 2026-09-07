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
  }
};

