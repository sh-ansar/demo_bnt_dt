window.BNTUI = {
  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char]));
  },
  downloadCsv(filename, rows) {
    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], {type: "text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  },
  attrs(attributes = {}) {
    return Object.entries(attributes).map(([name, value]) => {
      if (value === false || value == null) return "";
      if (value === true) return ` ${name}`;
      return ` ${name}="${this.escape(value)}"`;
    }).join("");
  },
  renderEmptyState(message, {size = "small", title = "", action = null} = {}) {
    const smallest = size === "smallest";
    return `<section class="empty-state empty-state--illustrated${smallest ? " empty-state--smallest" : ""}" aria-label="${this.escape(title || message)}">
      <div class="div-block empty-state__content">
        <svg class="empty-state__illustration" width="${smallest ? 96 : 120}" height="${smallest ? 96 : 120}" viewBox="0 0 120 120" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=2#EmptyStateBox"></use></svg>
        ${title ? `<h2 class="empty-state__title typography-label-base">${this.escape(title)}</h2>` : ''}<p class="empty-state__description typography-body-${smallest ? "smallest" : "small"}">${this.escape(message)}</p>
        ${action ? `<button class="button-small button-small--secondary typography-button-small" type="button"${this.attrs(action.attributes)}><span>${this.escape(action.label)}</span></button>` : ''}
      </div>
    </section>`;
  },
  renderEmptyTableRow(columnCount, message = "Нет данных") {
    const columns = Number.isFinite(Number(columnCount)) ? Math.max(1, Math.trunc(Number(columnCount))) : 1;
    return `<tr data-table-empty><td class="data-table__empty-cell" colspan="${columns}">${this.renderEmptyState(message, {size: "smallest"})}</td></tr>`;
  },
  renderDrawerCancel(attributes = {}) {
    return `<button class="button-smallest-secondary-radius typography-button-smallest" type="button"${this.attrs({"data-close": true, ...attributes})}>${this.icon("close")}<span>Отмена</span></button>`;
  },
  renderDrawer({id, title, description = "", fields = "", content = null, footer = "", form = true, formAttributes = {}, emptyMessage = null}) {
    const heading = `<h2 id="${this.escape(id)}-title" class="filter-modal__title typography-caption-small">${this.escape(title)}</h2>`;
    const titleRow = description ? `<div class="scenario-copy__title-row">${heading}<button class="sign_BTN_smallest" type="button" data-drawer-info="${this.escape(description)}" data-drawer-info-title="${this.escape(title)}" aria-label="О форме: ${this.escape(title)}" aria-haspopup="dialog" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=14#Info"></use></svg></button></div>` : heading;
    const body = emptyMessage == null ? `<div class="filter-modal__body filter-modal__body--form">${content ?? `<div class="filter-modal__fields ui-scrollbar">${fields}</div>`}</div>${content == null || footer ? `
        <span class="ui-divider brand-divider" aria-hidden="true"></span>
        <footer class="filter-modal__footer">${footer}</footer>` : ''}` : `<div class="filter-modal__body filter-modal__body--empty ui-scrollbar">
          ${this.renderEmptyState(emptyMessage, {size: "smallest"})}
        </div>`;
    return `<div id="${this.escape(id)}" class="filter-modal" role="dialog" aria-modal="true" aria-labelledby="${this.escape(id)}-title" data-studio-drawer>
      <div class="filter-modal__overlay" data-close></div>
      <${form ? 'form' : 'section'} class="filter-modal__drawer dt3-drawer"${this.attrs(formAttributes)} aria-label="${this.escape(title)}"${form ? ' novalidate' : ''}>
        <header class="filter-modal__head">
          ${titleRow}
          <button class="dt3-drawer-toggle button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest is-expanded" type="button" data-close aria-label="Закрыть">${this.icon("close")}</button>
        </header>
        <span class="ui-divider brand-divider" aria-hidden="true"></span>
        ${body}
      </${form ? 'form' : 'section'}>
    </div>`;
  },
  bindDrawer(host) {
    if (host.bntDrawerController) return host.bntDrawerController;
    const ui = this;
    let trigger = null;
    let cleanup = null;
    function close({restoreFocus = true} = {}) {
      ui.closeInfoPopover();
      ui.closeSingleFormInputs(host);
      ui.closeTimeFields(host);
      ui.closeDatePickers('bnt', null, host);
      cleanup?.();
      cleanup = null;
      host.innerHTML = '';
      trigger?.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger?.focus?.();
      trigger = null;
    }
    host.addEventListener('click', event => {
      if (event.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', event => {
      const drawer = host.querySelector('[data-studio-drawer]');
      if (!drawer || event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...drawer.querySelectorAll('button, input:not([type="hidden"]), textarea, [tabindex="0"]')].filter(control => !control.disabled && !control.closest('[hidden]'));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    host.bntDrawerController = {
      open(options, source = document.activeElement, dispose = null) {
        ui.closeDropdowns();
        ui.closeSpeedDials();
        ui.closeFilterSummaryMenus();
        close({restoreFocus: false});
        trigger = source;
        cleanup = dispose;
        if (!trigger?.closest('[data-speed-dial-secondary]')) trigger?.setAttribute('aria-expanded', 'true');
        host.innerHTML = ui.renderDrawer(options);
        requestAnimationFrame(() => host.querySelector('.dt3-drawer-toggle')?.focus());
      },
      close
    };
    return host.bntDrawerController;
  },
  updateDrawerHeader(head) {
    const title = head.querySelector(".filter-modal__title");
    if (!title || !title.getClientRects().length) return;
    let multiline;
    if (document.createRange) {
      const range = document.createRange();
      range.selectNodeContents(title);
      const lines = [];
      for (const rect of range.getClientRects()) {
        if (rect.width > 0 && rect.height > 0 && !lines.some(top => Math.abs(top - rect.top) < rect.height / 2)) lines.push(rect.top);
      }
      if (!lines.length) return;
      multiline = lines.length > 1;
    } else {
      const style = window.getComputedStyle(title);
      const lineHeight = parseFloat(style.lineHeight);
      if (!(lineHeight > 0)) return;
      const height = title.clientHeight ?? title.getBoundingClientRect().height;
      multiline = height - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0) > lineHeight * 1.5;
    }
    if (head.classList.contains("is-title-long") !== multiline) head.classList.toggle("is-title-long", multiline);
  },
  renderWorkspaceItem({label, caption = "", icon = "", actionIcon = "", attributes = {}}) {
    return `<button class="layout-item" type="button"${this.attrs(attributes)}><span class="layout-item-icon" aria-hidden="true">${icon}</span><span class="layout-item-label"><strong>${this.escape(label)}</strong><small>${this.escape(caption)}</small></span><span class="layout-item-action button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" aria-hidden="true">${actionIcon}</span></button>`;
  },
  updateCanvasGrid(grid) {
    if (!grid || !grid.getClientRects().length) return;
    const style = window.getComputedStyle(grid);
    const width = grid.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    const maxWidth = parseFloat(style.getPropertyValue("--canvas-block-max-width"));
    if (!(width > 0) || !(maxWidth > 0)) return;
    const gap = parseFloat(style.columnGap) || 0;
    const columns = String(Math.max(1, Math.ceil((width + gap) / (maxWidth + gap))));
    if (grid.style.getPropertyValue("--canvas-grid-columns") !== columns) grid.style.setProperty("--canvas-grid-columns", columns);
  },
  updateWorkspace(root) {
    if (!root) return;
    if (root.hasAttribute("data-workspace-fill") && root.getClientRects().length) {
      const gutter = parseFloat(window.getComputedStyle(root).getPropertyValue("--space-5")) || 0;
      const height = Math.round(Math.max(410, (window.innerHeight || document.documentElement.clientHeight) - root.getBoundingClientRect().top - gutter));
      const value = `${height}px`;
      if (root.style.getPropertyValue("--layout-workspace-height") !== value) root.style.setProperty("--layout-workspace-height", value);
    }
    const body = root.querySelector(".layout-drawer-body"), group = root.querySelector(".layout-drawer-list-group");
    if (body && group) {
      group.classList.toggle("has-fade-top", body.scrollTop > 1);
      group.classList.toggle("has-fade-bottom", body.scrollHeight - body.clientHeight - body.scrollTop > 1);
    }
    this.updateCanvasGrid(root.querySelector(".canvas-grid"));
  },
  setWorkspaceDrawerOpen(root, open, {notify = true, focus = false} = {}) {
    if (!root) return;
    const drawer = root.querySelector("[data-workspace-drawer]");
    root.classList.toggle("is-drawer-collapsed", !open);
    if (drawer) { drawer.hidden = !open; drawer.inert = !open; }
    root.querySelectorAll("[data-workspace-toggle], [data-workspace-open], [data-workspace-close]").forEach(button => {
      button.setAttribute("aria-expanded", String(open));
      button.classList.toggle("is-expanded", open);
      const label = button.dataset[open ? "workspaceLabelOpen" : "workspaceLabelClosed"];
      if (label) button.setAttribute("aria-label", label);
    });
    root.querySelectorAll("[data-workspace-expanded]").forEach(element => { element.hidden = !open; });
    root.querySelectorAll("[data-workspace-collapsed]").forEach(element => { element.hidden = open; });
    this.updateWorkspace(root);
    if (focus) root.querySelector(open ? '[role="tab"][data-workspace-tab][aria-selected="true"]' : "[data-workspace-toggle]")?.focus();
    if (notify) root.dispatchEvent(new CustomEvent("workspacechange", {bubbles: true, detail: {open, tab: root.dataset.workspaceTab}}));
  },
  setWorkspaceTab(root, value, {notify = true, focus = false} = {}) {
    const tabs = [...root.querySelectorAll('[role="tab"][data-workspace-tab]')];
    const selected = tabs.find(tab => tab.dataset.workspaceTab === value);
    if (!selected) return;
    root.dataset.workspaceTab = value;
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    root.querySelectorAll("[data-workspace-panel]").forEach(panel => { panel.hidden = panel.dataset.workspacePanel !== value; });
    const body = root.querySelector(".layout-drawer-body");
    if (body) body.scrollTop = 0;
    this.updateWorkspace(root);
    if (focus) selected.focus();
    if (notify) root.dispatchEvent(new CustomEvent("workspacechange", {bubbles: true, detail: {open: !root.classList.contains("is-drawer-collapsed"), tab: value}}));
  },
  bindWorkspaces() {
    if (this.workspacesBound) return;
    this.workspacesBound = true;
    let pending = false, observer = null;
    const targets = new Set();
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const next = new Set();
        document.querySelectorAll("[data-workspace]").forEach(root => {
          this.updateWorkspace(root);
          [root, root.querySelector(".layout-drawer-body"), root.querySelector(".canvas-grid")].filter(Boolean).forEach(element => next.add(element));
        });
        if (next.size && !observer && typeof ResizeObserver !== "undefined") observer = new ResizeObserver(requestUpdate);
        targets.forEach(element => { if (!next.has(element)) { observer?.unobserve(element); targets.delete(element); } });
        next.forEach(element => { if (!targets.has(element)) { observer?.observe(element); targets.add(element); } });
      });
    };
    document.addEventListener("click", event => {
      const button = event.target.closest('[data-workspace-toggle], [data-workspace-open], [data-workspace-close], [role="tab"][data-workspace-tab]');
      const root = button?.closest("[data-workspace]");
      if (!root) return;
      event.preventDefault();
      if (button.getAttribute("role") === "tab") this.setWorkspaceTab(root, button.dataset.workspaceTab);
      else {
        if (button.dataset.workspaceOpen) this.setWorkspaceTab(root, button.dataset.workspaceOpen);
        this.setWorkspaceDrawerOpen(root, button.hasAttribute("data-workspace-open") || !button.hasAttribute("data-workspace-close") && root.classList.contains("is-drawer-collapsed"), {focus: true});
      }
    });
    document.addEventListener("keydown", event => {
      const root = event.target.closest("[data-workspace]");
      if (!root) return;
      const tab = event.target.closest('[role="tab"][data-workspace-tab]');
      if (tab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        const tabs = [...root.querySelectorAll('[role="tab"][data-workspace-tab]')];
        const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (tabs.indexOf(tab) + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        event.preventDefault();
        this.setWorkspaceTab(root, tabs[index].dataset.workspaceTab, {focus: true});
      } else if (event.key === "Escape" && root.hasAttribute("data-workspace-dismiss") && !root.classList.contains("is-drawer-collapsed") && !this.infoPopoverTrigger && !root.querySelector('[aria-haspopup][aria-expanded="true"]')) {
        event.preventDefault();
        this.setWorkspaceDrawerOpen(root, false, {focus: true});
      }
    });
    document.addEventListener("scroll", event => {
      if (event.target.matches?.(".layout-drawer-body")) this.updateWorkspace(event.target.closest("[data-workspace]"));
    }, true);
    if (typeof MutationObserver !== "undefined") {
      this.workspaceMutations = new MutationObserver(requestUpdate);
      this.workspaceMutations.observe(document.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"]});
    }
    window.addEventListener("resize", requestUpdate);
    document.fonts?.ready?.then(requestUpdate);
    document.fonts?.addEventListener("loadingdone", requestUpdate);
    requestUpdate();
  },
  bindDrawerHeaders() {
    if (this.drawerHeadersBound) return;
    this.drawerHeadersBound = true;
    let pending = false, observer = null;
    const targets = new Set();
    const update = () => {
      pending = false;
      const next = new Set();
      document.querySelectorAll(".filter-modal__head").forEach(head => {
        this.updateDrawerHeader(head);
        const title = head.querySelector(".filter-modal__title");
        if (title) next.add(title);
      });
      if (next.size && !observer && typeof ResizeObserver !== "undefined") observer = new ResizeObserver(requestUpdate);
      targets.forEach(title => { if (!next.has(title)) { observer?.unobserve(title); targets.delete(title); } });
      next.forEach(title => { if (!targets.has(title)) { observer?.observe(title); targets.add(title); } });
    };
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    };
    if (typeof MutationObserver !== "undefined") {
      this.drawerHeaderMutations = new MutationObserver(requestUpdate);
      this.drawerHeaderMutations.observe(document.documentElement, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden"]});
    }
    window.addEventListener("resize", requestUpdate);
    window.visualViewport?.addEventListener("resize", requestUpdate);
    document.fonts?.ready?.then(requestUpdate);
    document.fonts?.addEventListener("loadingdone", requestUpdate);
    requestUpdate();
  },
  updateImageCardBodies(container) {
    if (!container?.getClientRects().length) return;
    const property = "--card-with-image-body-min-height";
    // Measure intrinsic heights again so the group can also shrink after reflow.
    container.style.removeProperty(property);
    const bodies = [...container.querySelectorAll(":scope > .card-with-image")]
      .map(card => card.querySelector(":scope > .card-with-image__body"))
      .filter(body => body?.getClientRects().length);
    const height = Math.max(0, ...bodies.map(body => body.getBoundingClientRect().height).filter(Number.isFinite));
    if (height > 0) container.style.setProperty(property, `${height.toFixed(3)}px`);
    return height;
  },
  bindImageCards() {
    if (this.imageCardsBound) return;
    this.imageCardsBound = true;
    let pending = false, observer = null;
    const targets = new Set();
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const next = new Set();
        const containers = new Set([...document.querySelectorAll(".card-with-image")].map(card => card.parentElement).filter(Boolean));
        containers.forEach(container => {
          this.updateImageCardBodies(container);
          next.add(container);
          container.querySelectorAll(":scope > .card-with-image > .card-with-image__body").forEach(body => next.add(body));
        });
        if (next.size && !observer && typeof ResizeObserver !== "undefined") observer = new ResizeObserver(requestUpdate);
        targets.forEach(element => { if (!next.has(element)) { observer?.unobserve(element); targets.delete(element); } });
        next.forEach(element => { if (!targets.has(element)) { observer?.observe(element); targets.add(element); } });
      });
    };
    if (typeof MutationObserver !== "undefined") {
      this.imageCardMutations = new MutationObserver(requestUpdate);
      this.imageCardMutations.observe(document.documentElement, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden", "class"]});
    }
    document.addEventListener("load", event => {
      if (event.target.closest?.(".card-with-image")) requestUpdate();
    }, true);
    window.addEventListener("resize", requestUpdate);
    window.visualViewport?.addEventListener("resize", requestUpdate);
    document.fonts?.ready?.then(requestUpdate);
    document.fonts?.addEventListener("loadingdone", requestUpdate);
    requestUpdate();
  },
  compactLabelLines(label) {
    const text = label.textContent.trim();
    const doc = label.ownerDocument || document;
    if (!text || !doc.createRange) return [text];
    const range = doc.createRange();
    range.selectNodeContents(label);
    const tops = [];
    for (const rect of range.getClientRects()) {
      if (rect.width > 0 && rect.height > 0 && !tops.some(top => Math.abs(top - rect.top) < rect.height / 2)) tops.push(rect.top);
    }
    if (tops.length < 2 || !doc.createTreeWalker) return [text];
    tops.sort((a, b) => a - b);
    const lines = tops.map(() => "");
    const walker = doc.createTreeWalker(label, 4);
    let node;
    while ((node = walker.nextNode())) {
      let offset = 0;
      for (const character of node.textContent) {
        range.setStart(node, offset);
        offset += character.length;
        range.setEnd(node, offset);
        const rect = [...range.getClientRects()].find(rect => rect.width > 0 && rect.height > 0);
        if (!rect) continue;
        const line = tops.findIndex(top => Math.abs(top - rect.top) < rect.height / 2);
        if (line >= 0) lines[line] += character;
      }
    }
    return lines.map(line => line.trim()).filter(Boolean);
  },
  updateCompactLabel(label) {
    if (!label.getClientRects().length) return;
    const doc = label.ownerDocument || document;
    const canvas = this.compactLabelCanvas || doc.createElement("canvas");
    const context = canvas.getContext?.("2d");
    if (!context) return;
    this.compactLabelCanvas = canvas;
    const style = window.getComputedStyle(label);
    context.font = `${style.fontStyle || "normal"} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.textBaseline = "alphabetic";
    const lines = this.compactLabelLines(label);
    if (!lines.length || !lines[0]) return;
    const transform = text => style.textTransform === "uppercase" ? text.toLocaleUpperCase() : style.textTransform === "lowercase" ? text.toLocaleLowerCase() : text;
    const first = context.measureText(transform(lines[0]));
    const last = lines.length === 1 ? first : context.measureText(transform(lines.at(-1)));
    const metrics = [first.actualBoundingBoxAscent, last.actualBoundingBoxDescent, first.fontBoundingBoxAscent, first.fontBoundingBoxDescent];
    if (!metrics.every(Number.isFinite)) return;
    // Center the actual first/last glyph edges, keeping line boxes and wrapping intact.
    const offset = (metrics[0] - metrics[1] - metrics[2] + metrics[3]) / 2;
    const value = `${offset}px`;
    if (label.style.getPropertyValue("--compact-label-offset") !== value) label.style.setProperty("--compact-label-offset", value);
  },
  bindCompactLabels() {
    if (this.compactLabelsBound) return;
    this.compactLabelsBound = true;
    let pending = false, observer = null;
    const targets = new Set();
    const update = () => {
      pending = false;
      document.querySelectorAll(".badge, .pill.pill--default").forEach(root => {
        for (const node of [...root.childNodes]) {
          if (node.nodeType !== 3 || !node.textContent.trim()) continue;
          const label = (root.ownerDocument || document).createElement("span");
          label.className = root.classList.contains("badge") ? "badge__label" : "pill__title";
          if (!root.classList.contains("badge")) label.setAttribute("data-pill-plain-label", "");
          root.insertBefore(label, node);
          label.appendChild(node);
        }
      });
      const next = new Set(document.querySelectorAll(".badge__label, .pill__title, .filter-summary__count-title, .form-input__tag-count-value"));
      next.forEach(label => this.updateCompactLabel(label));
      if (next.size && !observer && typeof ResizeObserver !== "undefined") observer = new ResizeObserver(requestUpdate);
      targets.forEach(label => { if (!next.has(label)) { observer?.unobserve(label); targets.delete(label); } });
      next.forEach(label => { if (!targets.has(label)) { observer?.observe(label); targets.add(label); } });
    };
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    };
    if (typeof MutationObserver !== "undefined") {
      this.compactLabelMutations = new MutationObserver(requestUpdate);
      this.compactLabelMutations.observe(document.documentElement, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "hidden", "data-theme"]});
    }
    window.addEventListener("resize", requestUpdate);
    window.visualViewport?.addEventListener("resize", requestUpdate);
    document.fonts?.ready?.then(requestUpdate);
    document.fonts?.addEventListener("loadingdone", requestUpdate);
    requestUpdate();
  },
  renderDropdownOptions(options, value, size = "smallest", variant = "default") {
    const optionClass = variant === "search" ? "dt3-search-scope-option" : "dt3-zone-dropdown__option";
    return options.map(item => {
      const selected = String(item.value) === String(value);
      return `<button class="${optionClass} ui-dropdown__option typography-${selected ? "caption" : "body"}-${size}${selected ? " is-selected" : ""}" type="button" role="option" aria-selected="${selected}" data-ui-dropdown-option="${this.escape(item.value)}"><span>${this.escape(item.label)}${item.count == null ? "" : ` <span class="ui-dropdown__count">(${this.escape(item.count)})</span>`}</span></button>`;
    }).join("");
  },
  renderDropdown({id, label, options = [], value, size = "smallest", variant = "default"}) {
    const selected = options.find(item => String(item.value) === String(value)) || options[0];
    const scope = variant === "search";
    const classes = scope ? ["dt3-search-scope", "dt3-search-scope-trigger", "dt3-search-scope-chevron", "dt3-search-scope-menu"] : ["dt3-zone-dropdown", "dt3-zone-dropdown__trigger", "dt3-zone-dropdown__chevron", "dt3-zone-dropdown__menu"];
    return `<span class="${classes[0]} ui-dropdown${size === "small" ? " ui-dropdown--small" : ""}" data-ui-dropdown="${this.escape(id)}" data-value="${this.escape(selected?.value)}">
      <button id="${this.escape(id)}" type="button" class="${classes[1]} ui-dropdown__trigger typography-caption-${size}" aria-label="${this.escape(label)}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${this.escape(id)}-options"><span data-ui-dropdown-label>${this.escape(selected?.label)}${selected?.count == null ? "" : ` <span class="ui-dropdown__count">(${this.escape(selected.count)})</span>`}</span><span class="${classes[2]} ui-dropdown__chevron nav-chevron" aria-hidden="true">${this.icon("chevron")}</span></button>
      <div id="${this.escape(id)}-options" class="${classes[3]} ui-dropdown__menu ui-scrollbar" role="listbox" aria-label="${this.escape(label)}" hidden>${this.renderDropdownOptions(options, selected?.value, size, variant)}</div>
    </span>`;
  },
  renderScopedSearch({id, label, placeholder = label, options = [], scope, query = "", active = false, appliedQuery = query}) {
    return `<form class="dt3-multisearch shell-search" role="search" aria-label="${this.escape(label)}" data-scoped-search="${this.escape(id)}" data-scoped-search-active="${active}" data-scoped-search-query="${this.escape(active ? appliedQuery : "")}">
      <div class="dt3-multisearch-field shell-search-field">
        ${this.renderDropdown({id: `${id}-scope`, label: "Область поиска", options, value: scope, variant: "search"})}
        <input id="${this.escape(id)}" class="typography-body-smallest" type="search" value="${this.escape(query)}" placeholder="${this.escape(placeholder)}" autocomplete="off" aria-label="${this.escape(label)}">
        <button class="dt3-search-submit shell-search-button" type="${active ? "button" : "submit"}" data-scoped-search-submit aria-label="${active ? "Очистить поиск" : "Найти"}">${this.icon(active ? "close" : "search")}</button>
      </div>
    </form>`;
  },
  notifyScopedSearch(root) {
    root.dispatchEvent(new CustomEvent("scopedsearchchange", {bubbles: true, detail: {
      active: root.dataset.scopedSearchActive === "true",
      query: root.dataset.scopedSearchQuery || "",
      scope: root.querySelector("[data-ui-dropdown]")?.dataset.value || "all"
    }}));
  },
  applyScopedSearch(root, {reset = false, focus = false} = {}) {
    if (!root) return;
    const input = root.querySelector('input[type="search"]');
    const button = root.querySelector("[data-scoped-search-submit]");
    if (!input || !button) return;
    if (reset) input.value = "";
    const query = input.value.trim(), active = query.length > 0;
    root.dataset.scopedSearchActive = String(active);
    root.dataset.scopedSearchQuery = query;
    button.type = active ? "button" : "submit";
    button.setAttribute("aria-label", active ? "Очистить поиск" : "Найти");
    button.innerHTML = this.icon(active ? "close" : "search");
    if (focus) input.focus();
    this.notifyScopedSearch(root);
  },
  bindScopedSearches() {
    if (this.scopedSearchesBound) return;
    this.scopedSearchesBound = true;
    document.addEventListener("submit", event => {
      if (!event.target.hasAttribute("data-scoped-search")) return;
      event.preventDefault();
      this.applyScopedSearch(event.target);
    });
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-scoped-search-submit]");
      const root = button?.closest("[data-scoped-search]");
      if (!root || root.dataset.scopedSearchActive !== "true") return;
      event.preventDefault();
      this.applyScopedSearch(root, {reset: true, focus: true});
    });
    document.addEventListener("keydown", event => {
      const root = event.target.closest("[data-scoped-search]");
      if (!root || event.key !== "Enter" || !event.target.matches('input[type="search"]') || event.isComposing) return;
      event.preventDefault();
      this.applyScopedSearch(root);
    });
    document.addEventListener("input", event => {
      const root = event.target.closest("[data-scoped-search]");
      if (root && event.target.matches('input[type="search"]') && !event.target.value.trim()) this.applyScopedSearch(root);
    });
    document.addEventListener("change", event => {
      const root = event.target.closest("[data-scoped-search]");
      if (root && event.target.hasAttribute("data-ui-dropdown")) this.notifyScopedSearch(root);
    });
  },
  setDropdownOpen(root, open, {focus = false} = {}) {
    if (!root) return;
    if (open) { this.closeDropdowns(root); this.closeSingleFormInputs(); this.closeTimeFields(); this.closeDatePickers(); }
    root.classList.toggle("is-open", open);
    root.querySelector(".ui-dropdown__trigger")?.setAttribute("aria-expanded", String(open));
    const menu = root.querySelector(".ui-dropdown__menu");
    if (menu) menu.hidden = !open;
    if (focus) (open ? root.querySelector('[data-ui-dropdown-option][aria-selected="true"]') || root.querySelector("[data-ui-dropdown-option]") : root.querySelector(".ui-dropdown__trigger"))?.focus();
  },
  closeDropdowns(except = null) {
    document.querySelectorAll("[data-ui-dropdown].is-open").forEach(root => { if (root !== except) this.setDropdownOpen(root, false); });
  },
  syncDropdown(root, value) {
    if (!root) return;
    const options = [...root.querySelectorAll("[data-ui-dropdown-option]")];
    const selected = options.find(option => option.dataset.uiDropdownOption === String(value));
    if (!selected) return;
    root.dataset.value = String(value);
    const label = root.querySelector("[data-ui-dropdown-label]");
    if (label) label.innerHTML = selected.innerHTML;
    options.forEach(option => {
      const active = option === selected;
      const size = root.classList.contains("ui-dropdown--small") ? "small" : "smallest";
      option.classList.toggle("is-selected", active);
      option.classList.toggle(`typography-caption-${size}`, active);
      option.classList.toggle(`typography-body-${size}`, !active);
      option.setAttribute("aria-selected", String(active));
    });
  },
  selectDropdownOption(option) {
    const root = option.closest("[data-ui-dropdown]");
    if (!root || option.disabled) return;
    this.syncDropdown(root, option.dataset.uiDropdownOption);
    this.setDropdownOpen(root, false, {focus: true});
    root.dispatchEvent(new Event("change", {bubbles: true}));
  },
  badge(label, tone = "") {
    return `<span class="badge ${tone}"><span class="badge__label">${this.escape(label)}</span></span>`;
  },
  renderFilterSummary(groups, {counted = false, readonly = false, icons = {}, rows = 0} = {}) {
    groups = groups.filter(group => (group.count ?? group.values.length) > 0);
    const closeIcon = icons.close || this.icon("close");
    const chevron = icons.chevron || this.icon("chevron");
    const remove = (group, item, rollover) => `<button${rollover ? ' class="form-input__tag-remove"' : ""} type="button"${readonly ? ' disabled tabindex="-1"' : ` data-equipment-filter-remove-value="${this.escape(group.key)}" data-equipment-filter-remove-item="${this.escape(item.value)}"`} aria-label="Удалить ${this.escape(item.label)}">${closeIcon}</button>`;
    const valuePills = group => group.values.map((item, index) => `<span class="filter-summary__pill pill pill--default pill--radius typography-body-smallest"${rows > 0 ? ` data-filter-summary-item="${index}"` : ""}><span class="pill__title">${this.escape(item.label)}</span>${remove(group, item, false)}</span>`).join("");
    const renderGroup = (group, overflow = false) => {
      const id = `filter-summary-${this.filterSummarySequence = (this.filterSummarySequence || 0) + 1}`;
      return `<span class="filter-summary__group form-input__tag-more" data-filter-summary-group="${this.escape(group.key)}"${overflow ? ' data-filter-summary-overflow hidden' : ""}>
        <button class="filter-summary__count pill pill--default pill--radius typography-body-smallest" type="button" data-filter-summary-toggle aria-expanded="false" aria-controls="${id}"${group.values.length ? "" : " disabled"}>
          <span class="filter-summary__count-title"${overflow ? " data-filter-summary-count" : ""}>${overflow ? `+${group.values.length}` : `${this.escape(group.label)} (${this.escape(group.count ?? group.values.length)})`}</span><span class="filter-summary__count-chevron" aria-hidden="true">${chevron}</span>
        </button>
        <span id="${id}" class="filter-summary__rollover form-input__tag-rollover ui-scrollbar" data-filter-summary-menu role="list" aria-label="${this.escape(group.label)}" hidden>
          ${group.values.map((item, index) => `<span class="filter-summary__rollover-item form-input__tag form-input__tag--rollover pill pill--default pill--radius typography-body-smallest" role="listitem"${overflow ? ` data-filter-summary-overflow-item="${index}"` : ""}><span class="pill__title">${this.escape(item.label)}</span>${remove(group, item, true)}</span>`).join("")}
        </span>
      </span>`;
    };
    if (!counted && groups.length === 1) {
      const pills = valuePills(groups[0]);
      if (!(rows > 0)) return pills;
      const limit = Math.max(1, Math.floor(rows));
      return `<div class="filter-summary__pills filter-summary__pills--rows" data-filter-summary-rows="${limit}" style="--filter-summary-rows:${limit}" aria-label="${this.escape(groups[0].label)}">${pills}${groups[0].values.length > 1 ? renderGroup(groups[0], true) : ""}</div>`;
    }
    return groups.map(group => renderGroup(group)).join("");
  },
  updateFilterSummaryRows(root) {
    const bounds = root.getBoundingClientRect();
    if (!bounds.width) return;
    const items = [...root.querySelectorAll("[data-filter-summary-item]")];
    const more = root.querySelector("[data-filter-summary-overflow]");
    if (!more) return;
    const budget = parseFloat(window.getComputedStyle(root).minHeight);
    if (!(budget > 0)) return;
    const fits = elements => elements.every(item => item.getBoundingClientRect().bottom - bounds.top <= budget + .5);
    items.forEach(item => { item.hidden = false; });
    more.hidden = true;
    let visible = items.length;
    const count = more.querySelector("[data-filter-summary-count]");
    const trigger = more.querySelector("[data-filter-summary-toggle]");
    if (!fits(items)) {
      more.hidden = false;
      // Reserve space for the counter in the last visible row using actual pill geometry.
      do {
        items[--visible].hidden = true;
        const remaining = items.length - visible;
        if (count.textContent !== `+${remaining}`) count.textContent = `+${remaining}`;
        trigger.setAttribute("aria-label", `Ещё значений: ${remaining}`);
      } while (visible > 0 && !fits([...items.slice(0, visible), more]));
    }
    more.querySelectorAll("[data-filter-summary-overflow-item]").forEach((item, index) => { item.hidden = index < visible; });
    if (more.hidden && more.classList.contains("is-open")) this.setFilterSummaryOpen(more, false);
    return visible;
  },
  bindFilterSummaryRows() {
    if (this.filterSummaryRowsBound) return;
    this.filterSummaryRowsBound = true;
    let pending = false, observer = null;
    const targets = new Set();
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const next = new Set(document.querySelectorAll("[data-filter-summary-rows]"));
        next.forEach(root => this.updateFilterSummaryRows(root));
        if (next.size && !observer && typeof ResizeObserver !== "undefined") observer = new ResizeObserver(requestUpdate);
        targets.forEach(root => { if (!next.has(root)) { observer?.unobserve(root); targets.delete(root); } });
        next.forEach(root => { if (!targets.has(root)) { observer?.observe(root); targets.add(root); } });
      });
    };
    if (typeof MutationObserver !== "undefined") {
      this.filterSummaryRowsMutations = new MutationObserver(requestUpdate);
      this.filterSummaryRowsMutations.observe(document.documentElement, {childList: true, subtree: true, characterData: true});
    }
    window.addEventListener("resize", requestUpdate);
    window.visualViewport?.addEventListener("resize", requestUpdate);
    document.fonts?.ready?.then(requestUpdate);
    document.fonts?.addEventListener("loadingdone", requestUpdate);
    requestUpdate();
  },
  setFilterSummaryOpen(group, open, {focus = false} = {}) {
    if (!group) return;
    const trigger = group.querySelector("[data-filter-summary-toggle]");
    if (open && trigger?.disabled) return;
    if (open) { this.closeFilterSummaryMenus(group); this.closeDropdowns(); this.closeSingleFormInputs(); this.closeTimeFields(); this.closeDatePickers(); this.closeSpeedDials(); }
    group.classList.toggle("is-open", open);
    trigger?.setAttribute("aria-expanded", String(open));
    const menu = group.querySelector("[data-filter-summary-menu]");
    if (menu) menu.hidden = !open;
    if (open) this.positionFilterSummaryMenu(group);
    if (focus && !open) trigger?.focus();
  },
  closeFilterSummaryMenus(except = null, scope = document) {
    scope?.querySelectorAll("[data-filter-summary-group].is-open").forEach(group => {
      if (group !== except) this.setFilterSummaryOpen(group, false);
    });
  },
  positionFilterSummaryMenu(group) {
    const menu = group?.querySelector("[data-filter-summary-menu]");
    if (!menu || menu.hidden) return;
    const rect = group.getBoundingClientRect(), viewport = document.documentElement;
    const space = parseFloat(window.getComputedStyle(group).getPropertyValue("--space-3")) || 0;
    let bottom = viewport.clientHeight, right = viewport.clientWidth;
    // A backdrop mask clips descendants even when their overflow is visible.
    for (let parent = group.parentElement; parent; parent = parent.parentElement) {
      const style = window.getComputedStyle(parent);
      if ((style.maskImage && style.maskImage !== "none") || (style.webkitMaskImage && style.webkitMaskImage !== "none")) {
        const bounds = parent.getBoundingClientRect();
        bottom = Math.min(bottom, bounds.bottom);
        right = Math.min(right, bounds.right);
      }
    }
    menu.style.setProperty("--filter-summary-menu-max-height", `${Math.max(0, bottom - rect.bottom - space - 2)}px`);
    menu.style.setProperty("--filter-summary-menu-offset", `${Math.min(0, right - space - rect.left - menu.offsetWidth)}px`);
  },
  progress(value, tone = "") {
    const safe = Math.max(0, Math.min(100, Number(value) || 0));
    const toneClass = tone ? ` ${this.escape(tone)}` : "";
    return `<div class="progress scenario-range__track${toneClass}" style="--scenario-progress:${safe}%" aria-hidden="true"><span class="scenario-range__line"></span></div>`;
  },
  renderCanvasAlertList(items, {label = ""} = {}) {
    return `<div class="logistics-alert-list"${this.attrs({"aria-label": label || null})}>${items.map(({title, value, href, icon, image}) => {
      const imageUrl = image ? encodeURI(image).replace(/[()'"]/g, char => `%${char.charCodeAt(0).toString(16)}`) : "";
      const media = image ? `<span class="layout-item-icon__image"${this.attrs({style: `--layout-item-image: url("${imageUrl}")`})}></span>` : this.icon(icon);
      return `<article class="logistics-alert logistics-alert--canvas">
        <div class="canvas-block canvas-block--static">
          <span class="layout-item-icon layout-item-icon--neutral" aria-hidden="true">${media}</span>
          <div class="layout-item-label">
            <strong class="typography-label-smallest">${this.escape(title)}</strong>
            <small class="typography-body-smallest"><a class="layout-item-label__link"${this.attrs(href ? {href} : {role: "link", "aria-disabled": "true", tabindex: "0"})}>${this.escape(value)}</a></small>
          </div>
        </div>
      </article>`;
    }).join("")}</div>`;
  },
  renderToggle({label = "", pressed = false, tone = "", attributes = {}} = {}) {
    return `<button type="button" class="dt3-risk-toggle${tone === "positive" ? " dt3-risk-toggle--positive" : ""} typography-label-smallest" aria-pressed="${Boolean(pressed)}"${this.attrs(attributes)}><span class="dt3-risk-toggle__track" aria-hidden="true"><span class="dt3-risk-toggle__knob"></span></span><span class="dt3-risk-toggle__label">${this.escape(label)}</span></button>`;
  },
  updateMetricsGrid(grid) {
    const target = document.getElementById(grid.dataset.metricsFor);
    if (!target) return;
    if (!target.clientWidth) return target;
    const style = window.getComputedStyle(target);
    const width = parseFloat(style.width) || target.clientWidth;
    const minimum = parseFloat(style.getPropertyValue("--card-with-image-min-width"));
    const gap = parseFloat(style.columnGap) || 0;
    if (!(minimum > 0)) return;
    const columns = Math.max(1, Math.floor((width + gap) / (minimum + gap)));
    grid.style.setProperty("--metrics-grid-columns", String(columns * 2));
    return target;
  },
  bindMetricsGrids() {
    if (this.metricsGridsBound) return;
    this.metricsGridsBound = true;
    let pending = false, observer = null;
    const targets = new Set();
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const next = new Set();
        document.querySelectorAll(".metrics-grid--paired[data-metrics-for]").forEach(grid => {
          const target = this.updateMetricsGrid(grid);
          if (target) next.add(target);
        });
        if (next.size && !observer && typeof ResizeObserver !== "undefined") observer = new ResizeObserver(requestUpdate);
        targets.forEach(target => { if (!next.has(target)) { observer?.unobserve(target); targets.delete(target); } });
        next.forEach(target => { if (!targets.has(target)) { observer?.observe(target); targets.add(target); } });
      });
    };
    if (typeof MutationObserver !== "undefined") {
      this.metricsGridMutations = new MutationObserver(requestUpdate);
      this.metricsGridMutations.observe(document.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "data-metrics-for"]});
    }
    window.addEventListener("resize", requestUpdate);
    window.visualViewport?.addEventListener("resize", requestUpdate);
    requestUpdate();
  },
  updateRiskScrollFades(column) {
    const scroller = column?.querySelector(".payment-risk-map__scroller");
    if (!scroller) return null;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    column.classList.toggle("has-fade-top", scroller.scrollTop > 1);
    column.classList.toggle("has-fade-bottom", maxScroll - scroller.scrollTop > 1);
    return scroller;
  },
  bindRiskScrollFades() {
    if (this.riskScrollFadesBound) return;
    this.riskScrollFadesBound = true;
    let pending = false, observer = null;
    const targets = new Set();
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const next = new Set();
        document.querySelectorAll(".payment-risk-map__risk-column").forEach(column => {
          const scroller = this.updateRiskScrollFades(column);
          if (scroller) [column, scroller, ...scroller.children].forEach(element => next.add(element));
        });
        if (next.size && !observer && typeof ResizeObserver !== "undefined") observer = new ResizeObserver(requestUpdate);
        targets.forEach(element => { if (!next.has(element)) { observer?.unobserve(element); targets.delete(element); } });
        next.forEach(element => { if (!targets.has(element)) { observer?.observe(element); targets.add(element); } });
      });
    };
    document.addEventListener("scroll", event => {
      if (event.target.matches?.(".payment-risk-map__scroller")) this.updateRiskScrollFades(event.target.closest(".payment-risk-map__risk-column"));
    }, true);
    if (typeof MutationObserver !== "undefined") {
      this.riskScrollMutations = new MutationObserver(requestUpdate);
      this.riskScrollMutations.observe(document.documentElement, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden"]});
    }
    window.addEventListener("resize", requestUpdate);
    document.fonts?.ready?.then(requestUpdate);
    document.fonts?.addEventListener("loadingdone", requestUpdate);
    requestUpdate();
  },
  progressRingArcPath(value) {
    const radius = 20;
    const center = 24;
    const angle = Math.max(0, Math.min(100, Number(value) || 0)) * 3.6;
    const radians = (angle - 90) * Math.PI / 180;
    const x = center + radius * Math.cos(radians);
    const y = center + radius * Math.sin(radians);
    const largeArc = angle > 180 ? 1 : 0;
    return `M ${center} ${center - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x.toFixed(4)} ${y.toFixed(4)}`;
  },
  progressRing({label = "", percent = 0, display = "", ariaLabel = "", shortThreshold = 12} = {}) {
    const safe = Math.max(0, Math.min(100, Math.abs(Number(percent) || 0)));
    const value = display || `${safe}%`;
    const bar = safe <= 0
      ? ""
      : safe >= 100
        ? `<circle class="payment-progress-ring__bar" cx="24" cy="24" r="20"></circle>`
        : `<path class="payment-progress-ring__bar" d="${this.progressRingArcPath(safe)}"></path>`;
    const accessible = ariaLabel || `${label}: ${value}`;
    return `<div class="payment-progress-ring" role="img" aria-label="${this.escape(accessible)}"><svg viewBox="0 0 48 48" aria-hidden="true"><circle class="payment-progress-ring__track" cx="24" cy="24" r="20" pathLength="100"></circle>${bar}</svg><strong class="payment-progress-ring__value typography-label-smallest">${this.escape(value)}</strong></div>`;
  },
  icon(name) {
    const icons = {
      location: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=17#LocationMap"></use></svg>',
      sync: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><use x="2" y="2" width="20" height="20" href="/assets/icons/navigation.svg?v=3#nav-sync-outline"></use></svg>',
      chevron: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',
      plus: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4.375V15.625M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>',
      minus: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>',
      check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',
      close: '<svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>',
      info: '<svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=16#Info"></use></svg>',
      search: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>',
      clock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12.5 6.75C12.5 6.33579 12.1642 6 11.75 6C11.3358 6 11 6.33579 11 6.75H11.75H12.5ZM11.75 12.75H11C11 13.1642 11.3358 13.5 11.75 13.5V12.75ZM15.75 13.5C16.1642 13.5 16.5 13.1642 16.5 12.75C16.5 12.3358 16.1642 12 15.75 12V12.75V13.5ZM21.25 12H20.5C20.5 16.6944 16.6944 20.5 12 20.5V21.25V22C17.5228 22 22 17.5228 22 12H21.25ZM12 21.25V20.5C7.30558 20.5 3.5 16.6944 3.5 12H2.75H2C2 17.5228 6.47715 22 12 22V21.25ZM2.75 12H3.5C3.5 7.30558 7.30558 3.5 12 3.5V2.75V2C6.47715 2 2 6.47715 2 12H2.75ZM12 2.75V3.5C16.6944 3.5 20.5 7.30558 20.5 12H21.25H22C22 6.47715 17.5228 2 12 2V2.75ZM11.75 6.75H11V12.75H11.75H12.5V6.75H11.75ZM11.75 12.75V13.5H15.75V12.75V12H11.75V12.75Z" fill="currentColor"/></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8.33346 11.0828C8.33346 11.2669 8.18422 11.4161 8.00013 11.4161C7.81603 11.4161 7.66679 11.2669 7.66679 11.0828C7.66679 10.8987 7.81603 10.7495 8.00013 10.7495C8.18422 10.7495 8.33346 10.8987 8.33346 11.0828Z" fill="currentColor"/><path d="M8.00013 5.83358V9.16691M7.12113 2.68524L1.96079 12.0072C1.58979 12.6776 2.07413 13.5002 2.83979 13.5002H13.1608C13.9265 13.5002 14.4108 12.6776 14.0398 12.0072L8.87913 2.68524C8.49646 1.99424 7.50379 1.99424 7.12113 2.68524ZM8.33346 11.0828C8.33346 11.2669 8.18422 11.4161 8.00013 11.4161C7.81603 11.4161 7.66679 11.2669 7.66679 11.0828C7.66679 10.8987 7.81603 10.7495 8.00013 10.7495C8.18422 10.7495 8.33346 10.8987 8.33346 11.0828Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.75 19.5H6.25V21H17.75V19.5ZM6.25 19.5C5.28371 19.5 4.5 18.7163 4.5 17.75H3C3 19.5447 4.45529 21 6.25 21V19.5ZM4.5 17.75V6.25H3V17.75H4.5ZM4.5 6.25C4.5 5.28371 5.28371 4.5 6.25 4.5V3C4.45529 3 3 4.45529 3 6.25H4.5ZM6.25 4.5H17.75V3H6.25V4.5ZM17.75 4.5C18.7163 4.5 19.5 5.28371 19.5 6.25H21C21 4.45529 19.5447 3 17.75 3V4.5ZM19.5 6.25V17.75H21V6.25H19.5ZM19.5 17.75C19.5 18.7163 18.7163 19.5 17.75 19.5V21C19.5447 21 21 19.5447 21 17.75H19.5ZM3.75 8.5H20.25V7H3.75V8.5ZM13.75 13.5H15.75V12H13.75V13.5ZM15.75 13.5C15.8883 13.5 16 13.6117 16 13.75H17.5C17.5 12.7833 16.7167 12 15.75 12V13.5ZM16 13.75V15.75H17.5V13.75H16ZM16 15.75C16 15.8883 15.8883 16 15.75 16V17.5C16.7167 17.5 17.5 16.7167 17.5 15.75H16ZM15.75 16H13.75V17.5H15.75V16ZM13.75 16C13.6117 16 13.5 15.8883 13.5 15.75H12C12 16.7167 12.7833 17.5 13.75 17.5V16ZM13.5 15.75V13.75H12V15.75H13.5ZM13.5 13.75C13.5 13.6117 13.6117 13.5 13.75 13.5V12C12.7833 12 12 12.7833 12 13.75H13.5Z" fill="currentColor"/></svg>'
    };
    return icons[name] || "";
  },
  formInputSelectedValues(set, allValue = "Всё") {
    return set?.has?.(allValue) ? [allValue] : [...(set || [])];
  },
  formInputText(set, {allValue = "Всё", emptyMessage = "Ничего не выбрано"} = {}) {
    const values = this.formInputSelectedValues(set, allValue);
    if (!values.length) return emptyMessage;
    if (set?.has?.(allValue)) return allValue;
    return values.join(", ");
  },
  formInputTag(value, className = "", isMeasured = true) {
    const safeValue = this.escape(value);
    const tagClass = `form-input__tag pill pill--default pill--radius typography-body-smallest${className ? ` ${className}` : ""}`;
    const measuredAttrs = isMeasured ? ` data-form-input-tag-item data-form-input-tag-value="${safeValue}"` : "";
    return `<span class="${tagClass}" data-form-input-tag="${safeValue}"${measuredAttrs}><span class="pill__title">${safeValue}</span><button class="form-input__tag-remove" type="button" data-form-input-tag-remove="${safeValue}" aria-label="Убрать ${safeValue}">${this.icon("close")}</button></span>`;
  },
  formInputValue(set, {allValue = "Всё", emptyMessage = "Ничего не выбрано"} = {}) {
    const values = this.formInputSelectedValues(set, allValue);
    if (!values.length) return `<span class="form-input__empty typography-body-smallest">${this.escape(emptyMessage)}</span>`;
    if (set?.has?.(allValue)) return `<span class="form-input__all typography-body-smallest">${this.escape(allValue)}</span>`;
    const tags = values.map(value => this.formInputTag(value)).join("");
    const counter = values.length > 1 ? `<span class="form-input__tag-more" data-form-input-tag-more hidden><button class="form-input__tag-count pill pill--default pill--radius typography-body-smallest" type="button" data-form-input-hidden-toggle aria-expanded="false"><span class="form-input__tag-count-icon" aria-hidden="true">${this.icon("plus")}</span><span class="form-input__tag-count-value" data-form-input-hidden-count>${values.length - 1}</span><span class="form-input__tag-count-chevron nav-chevron" aria-hidden="true">${this.icon("chevron")}</span></button><span class="form-input__tag-rollover" data-form-input-hidden-menu role="menu" hidden></span></span>` : "";
    return `${tags}${counter}`;
  },
  renderFormInput({name, label, options = [], allValue = "Всё", emptyMessage = "Ничего не выбрано", mode = "multiple", value = "", id = name} = {}) {
    const safeName = this.escape(name);
    if (mode === "single") {
      const items = options.map(option => typeof option === "object" ? option : {value: option, label: option});
      const selected = items.find(option => String(option.value) === String(value)) || items[0];
      return `<div class="form-input${selected ? " has-selection" : ""}" data-form-input="${safeName}" data-form-input-mode="single">
        <span id="${safeName}-label" class="form-input__label typography-label-smallest">${this.escape(label)}</span>
        <div class="form-input__field">
          <button class="form-input__control" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${safeName}-options" aria-label="${this.escape(`${label}: ${selected?.label || emptyMessage}`)}">
            <span class="form-input__value typography-body-smallest" data-form-input-value>${this.escape(selected?.label || emptyMessage)}</span>
            <span class="form-input__chevron nav-chevron" aria-hidden="true">${this.icon("chevron")}</span>
          </button>
          <div id="${safeName}-options" class="form-input__menu" role="listbox" aria-labelledby="${safeName}-label" aria-multiselectable="false" hidden>
            <span class="form-input__divider" aria-hidden="true"></span>
            <div class="form-input__options ui-scrollbar" data-form-input-options>
              ${items.map(option => `<button class="form-input__option typography-body-smallest${option === selected ? " is-selected" : ""}" type="button" role="option" data-form-input-option="${this.escape(option.value)}" aria-selected="${option === selected}"><span class="form-input__checkbox" aria-hidden="true">${this.icon("check")}</span><span class="form-input__option-label">${this.escape(option.label)}</span></button>`).join("")}
            </div>
          </div>
        </div>
        <input type="hidden" id="${this.escape(id)}" name="${safeName}" data-form-input-selected value="${this.escape(selected?.value ?? "")}">
      </div>`;
    }
    return `<div class="form-input" data-form-input="${safeName}" data-form-input-all="${this.escape(allValue)}" data-form-input-empty="${this.escape(emptyMessage)}">
      <span class="form-input__label typography-label-smallest">${this.escape(label)}</span>
      <div class="form-input__field">
        <div class="form-input__control" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false">
          <span class="form-input__value form-input__tags" data-form-input-value>${this.formInputValue(new Set([allValue]), {allValue, emptyMessage})}</span>
          <span class="form-input__chevron nav-chevron" aria-hidden="true">${this.icon("chevron")}</span>
        </div>
        <div class="form-input__menu" role="listbox" aria-multiselectable="true" hidden>
          <span class="form-input__divider" aria-hidden="true"></span>
          <label class="form-input__search"><span aria-hidden="true">${this.icon("search")}</span><input class="typography-body-smallest" type="search" placeholder="Поиск" data-form-input-search autocomplete="off"><button class="form-input__search-clear" type="button" data-form-input-search-clear aria-label="Очистить поиск" hidden>${this.icon("close")}</button></label>
          <div class="form-input__options ui-scrollbar" data-form-input-options>
            ${options.map(option => `<button class="form-input__option typography-body-smallest" type="button" role="option" data-form-input-option="${this.escape(option)}" aria-selected="false"><span class="form-input__checkbox" aria-hidden="true">${this.icon("check")}</span><span class="form-input__option-label">${this.escape(option)}</span></button>`).join("")}
          </div>
        </div>
      </div>
      <span class="form-input__warning typography-indicator-small" data-form-input-empty-warning hidden>${this.icon("warning")}<span>${this.escape(emptyMessage)}</span></span>
    </div>`;
  },
  renderDateField({name, label, prefix = "bnt", value = "", min = "", max = ""} = {}) {
    const safeName = this.escape(name);
    const safeValue = this.escape(value);
    const dataPrefix = this.escape(prefix);
    return `<div class="equipment-date-field${value ? " has-value" : ""}" data-${dataPrefix}-date-root="${safeName}" data-${dataPrefix}-date-value="${safeValue}"${this.attrs({"data-date-min": min || null, "data-date-max": max || null})}>
      <span class="typography-label-smallest">${this.escape(label)}</span>
      <span class="equipment-date-input">
        <button class="equipment-date-display typography-body-smallest" type="button" data-${dataPrefix}-date-toggle aria-haspopup="dialog" aria-expanded="false">
          <span data-${dataPrefix}-date-text>${this.formatDate(value)}</span>
          ${this.icon("calendar")}
        </button>
        <input type="hidden" id="${safeName}" name="${safeName}" data-${dataPrefix}-date="${safeName}" value="${safeValue}">
        <span class="equipment-date-popover" data-${dataPrefix}-date-popover hidden></span>
      </span>
    </div>`;
  },
  parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
  },
  isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  },
  formatDate(value) {
    const date = this.parseDate(value);
    return date ? `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}` : "дд.мм.гггг";
  },
  syncDateField(root, value, prefix = "bnt") {
    if (!root) return;
    root.setAttribute(`data-${prefix}-date-value`, value || "");
    root.classList.toggle("has-value", Boolean(value));
    const input = root.querySelector(`[data-${prefix}-date]`);
    if (input) input.value = value || "";
    const text = root.querySelector(`[data-${prefix}-date-text]`);
    if (text) text.textContent = this.formatDate(value || root.getAttribute(`data-${prefix}-date-default`));
    if (root.classList.contains("is-open")) this.renderDatePicker(root, prefix);
  },
  renderDatePicker(root, prefix = "bnt") {
    const selected = this.parseDate(root.getAttribute(`data-${prefix}-date-value`));
    const current = this.parseDate(`${root.getAttribute(`data-${prefix}-date-month`)}-01`) || new Date(selected || this.parseDate(root.getAttribute(`data-${prefix}-date-default`)) || new Date());
    current.setDate(1);
    root.setAttribute(`data-${prefix}-date-month`, this.isoDate(current).slice(0, 7));
    const start = new Date(current);
    start.setDate(1 - ((start.getDay() + 6) % 7));
    const min = root.dataset.dateMin, max = root.dataset.dateMax;
    const days = Array.from({length: 42}, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = this.isoDate(date), active = iso === (selected && this.isoDate(selected));
      const classes = ["equipment-date-popover__day", "typography-body-smallest", date.getMonth() !== current.getMonth() ? "is-outside" : "", iso === this.isoDate(new Date()) ? "is-today" : "", active ? "is-selected" : ""].filter(Boolean).join(" ");
      return `<button class="${classes}" type="button" data-${prefix}-date-day="${iso}" aria-pressed="${active}"${this.attrs({disabled: Boolean(min && iso < min || max && iso > max)})}>${date.getDate()}</button>`;
    }).join("");
    const title = new Intl.DateTimeFormat("ru-RU", {month: "long", year: "numeric"}).format(current);
    const nav = direction => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${direction < 0 ? "M15 6L9 12L15 18" : "M9 6L15 12L9 18"}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    root.querySelector(`[data-${prefix}-date-popover]`).innerHTML = `<span class="equipment-date-popover__head"><span class="equipment-date-popover__title typography-caption-small">${this.escape(title)}</span><button class="equipment-date-popover__nav" type="button" data-${prefix}-date-nav="-1" aria-label="Предыдущий месяц">${nav(-1)}</button><button class="equipment-date-popover__nav" type="button" data-${prefix}-date-nav="1" aria-label="Следующий месяц">${nav(1)}</button></span><span class="equipment-date-popover__grid" aria-hidden="true">${["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => `<span class="equipment-date-popover__weekday typography-caption-smallest">${day}</span>`).join("")}</span><span class="equipment-date-popover__grid" role="grid" aria-label="${this.escape(title)}">${days}</span><span class="equipment-date-popover__footer"><button class="equipment-date-popover__action button-smallest-ghost typography-button-smallest" type="button" data-${prefix}-date-clear>Удалить</button><button class="equipment-date-popover__action button-smallest-ghost typography-button-smallest" type="button" data-${prefix}-date-today>Сегодня</button></span>`;
  },
  positionDatePicker(root, prefix = "bnt") {
    const control = root.querySelector(".equipment-date-input"), popover = root.querySelector(`[data-${prefix}-date-popover]`);
    if (!control || !popover || popover.hidden) return;
    const rect = control.getBoundingClientRect();
    const below = window.innerHeight - 16 - rect.bottom - 4, above = rect.top - 16 - 4;
    root.classList.toggle("is-open-up", below < (popover.scrollHeight || 360) && above > below);
  },
  closeDatePickers(prefix = "bnt", except = null, scope = document) {
    scope.querySelectorAll(`[data-${prefix}-date-root].is-open`).forEach(root => {
      if (root === except) return;
      root.classList.remove("is-open", "is-open-up");
      root.querySelector(`[data-${prefix}-date-toggle]`)?.setAttribute("aria-expanded", "false");
      const popover = root.querySelector(`[data-${prefix}-date-popover]`);
      if (popover) popover.hidden = true;
    });
  },
  handleDateFieldClick(event, prefix = "bnt", beforeOpen = () => {}) {
    const root = event.target.closest(`[data-${prefix}-date-root]`);
    if (!root) return false;
    const toggle = event.target.closest(`[data-${prefix}-date-toggle]`);
    const nav = event.target.closest(`[data-${prefix}-date-nav]`);
    const day = event.target.closest(`[data-${prefix}-date-day]`);
    const clear = event.target.closest(`[data-${prefix}-date-clear]`);
    const today = event.target.closest(`[data-${prefix}-date-today]`);
    if (!toggle && !nav && !day && !clear && !today) return false;
    event.preventDefault();
    if (toggle) {
      const open = !root.classList.contains("is-open");
      beforeOpen();
      this.closeDatePickers(prefix, open ? root : null);
      if (open) {
        const initial = this.parseDate(root.getAttribute(`data-${prefix}-date-value`)) || this.parseDate(root.getAttribute(`data-${prefix}-date-default`)) || new Date();
        root.setAttribute(`data-${prefix}-date-month`, this.isoDate(initial).slice(0, 7));
        root.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        root.querySelector(`[data-${prefix}-date-popover]`).hidden = false;
        this.renderDatePicker(root, prefix);
        requestAnimationFrame(() => this.positionDatePicker(root, prefix));
      }
    } else if (nav) {
      const current = this.parseDate(`${root.getAttribute(`data-${prefix}-date-month`)}-01`) || new Date();
      current.setMonth(current.getMonth() + Number(nav.getAttribute(`data-${prefix}-date-nav`)));
      root.setAttribute(`data-${prefix}-date-month`, this.isoDate(current).slice(0, 7));
      this.renderDatePicker(root, prefix);
      requestAnimationFrame(() => this.positionDatePicker(root, prefix));
    } else {
      if (day?.disabled) return true;
      const value = day ? day.getAttribute(`data-${prefix}-date-day`) : today ? this.isoDate(new Date()) : "";
      if (value && (root.dataset.dateMin && value < root.dataset.dateMin || root.dataset.dateMax && value > root.dataset.dateMax)) return true;
      this.syncDateField(root, value, prefix);
      this.touchFormInput(root);
      this.closeDatePickers(prefix);
      root.querySelector(`[data-${prefix}-date-toggle]`)?.focus();
      root.querySelector(`[data-${prefix}-date]`)?.dispatchEvent(new Event("change", {bubbles: true}));
    }
    return true;
  },
  syncSingleFormInput(root, value) {
    if (!root) return;
    const options = Array.from(root.querySelectorAll("[data-form-input-option]"));
    const selected = options.find(option => option.dataset.formInputOption === String(value));
    if (!selected) return;
    const label = selected.querySelector(".form-input__option-label")?.textContent || "";
    root.querySelector("[data-form-input-value]").textContent = label;
    const input = root.querySelector("[data-form-input-selected]");
    if (input) input.value = String(value);
    root.classList.add("has-selection");
    root.querySelector(".form-input__control")?.setAttribute("aria-label", `${root.querySelector(".form-input__label")?.textContent || ""}: ${label}`);
    options.forEach(option => {
      const active = option === selected;
      option.classList.toggle("is-selected", active);
      option.setAttribute("aria-selected", String(active));
    });
  },
  setSingleFormInputOpen(root, open, {focus = false, edge = "selected"} = {}) {
    if (!root) return;
    const control = root.querySelector(".form-input__control");
    const menu = root.querySelector(".form-input__menu");
    if (open) {
      this.closeSingleFormInputs(document, root);
      this.closeTimeFields();
      this.closeDatePickers();
    }
    root.classList.toggle("is-open", open);
    if (!open) root.classList.remove("is-open-up");
    control?.setAttribute("aria-expanded", String(open));
    if (menu) menu.hidden = !open;
    if (open) {
      this.positionFormInputMenu(root);
      if (focus) {
        const options = Array.from(root.querySelectorAll("[data-form-input-option]")).filter(option => !option.hidden && !option.disabled);
        const selected = options.find(option => option.getAttribute("aria-selected") === "true");
        (edge === "last" ? options.at(-1) : edge === "first" ? options[0] : selected || options[0])?.focus();
      }
    } else if (focus) control?.focus();
  },
  closeSingleFormInputs(scope = document, except = null) {
    scope.querySelectorAll('[data-form-input-mode="single"].is-open').forEach(root => {
      if (root !== except) this.setSingleFormInputOpen(root, false);
    });
  },
  selectSingleFormInput(option) {
    const root = option?.closest('[data-form-input-mode="single"]');
    if (!root || option.disabled) return;
    const input = root.querySelector("[data-form-input-selected]");
    const previous = input?.value;
    this.syncSingleFormInput(root, option.dataset.formInputOption);
    this.touchFormInput(root);
    this.setSingleFormInputOpen(root, false, {focus: true});
    if (input && input.value !== previous) {
      input.dispatchEvent(new Event("input", {bubbles: true}));
      input.dispatchEvent(new Event("change", {bubbles: true}));
    }
  },
  renderTimeField({name, label, id = name, value = "08:00"} = {}) {
    const safeName = this.escape(name);
    const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "08:00";
    const [hours, minutes] = time.split(":");
    const numberField = (part, caption, max, initial) => `<label class="form-input"><span class="form-input__label typography-label-smallest">${caption}</span><span class="form-input__text-field form-input__text-field--inline-icon"><input class="form-input__control form-input__control--text typography-body-smallest" type="number" min="0" max="${max}" step="1" required value="${initial}" data-time-input-part="${part}"><button class="form-input__number-stepper" type="button" data-form-input-number-stepper aria-label="Изменить ${caption.toLowerCase()}"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#SortDefault"></use></svg></button></span></label>`;
    return `<div class="equipment-date-field has-value" data-time-input="${safeName}">
      <span id="${safeName}-label" class="form-input__label typography-label-smallest">${this.escape(label)}</span>
      <div class="equipment-date-input">
        <button class="equipment-date-display typography-body-smallest" type="button" data-time-input-toggle aria-haspopup="dialog" aria-expanded="false" aria-controls="${safeName}-popover" aria-label="${this.escape(`${label}: ${time}`)}"><span data-time-input-text>${time}</span>${this.icon("clock")}</button>
        <input type="hidden" id="${this.escape(id)}" name="${safeName}" data-time-input-value value="${time}">
        <div id="${safeName}-popover" class="equipment-date-popover" data-time-input-popover role="dialog" aria-labelledby="${safeName}-label" hidden>
          <div class="equipment-date-grid">${numberField("hours", "Часы", 23, hours)}${numberField("minutes", "Минуты", 59, minutes)}</div>
          <div class="equipment-date-popover__footer"><button class="equipment-date-popover__action button-smallest-ghost typography-button-smallest" type="button" data-time-input-apply><span>Применить</span></button><button class="equipment-date-popover__action button-smallest-ghost typography-button-smallest" type="button" data-time-input-cancel>${this.icon("close")}<span>Отмена</span></button></div>
        </div>
      </div>
    </div>`;
  },
  setTimeFieldValue(root, value) {
    if (!root || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
    const input = root.querySelector("[data-time-input-value]");
    if (input) input.value = value;
    root.querySelector("[data-time-input-text]").textContent = value;
    root.querySelector("[data-time-input-toggle]")?.setAttribute("aria-label", `${root.querySelector(".form-input__label")?.textContent || ""}: ${value}`);
    return true;
  },
  positionTimeField(root) {
    const control = root?.querySelector("[data-time-input-toggle]");
    const popover = root?.querySelector("[data-time-input-popover]");
    if (!control || !popover || popover.hidden) return;
    const rect = control.getBoundingClientRect();
    const gap = 4;
    const availableBelow = window.innerHeight - rect.bottom - gap - 16;
    const availableAbove = rect.top - gap - 16;
    root.classList.toggle("is-open-up", availableBelow < popover.offsetHeight && availableAbove > availableBelow);
  },
  setTimeFieldOpen(root, open, {focus = false} = {}) {
    if (!root) return;
    const control = root.querySelector("[data-time-input-toggle]");
    const popover = root.querySelector("[data-time-input-popover]");
    if (open) {
      this.closeSingleFormInputs();
      this.closeDatePickers();
      this.closeTimeFields(document, root);
      const [hours, minutes] = (root.querySelector("[data-time-input-value]")?.value || "08:00").split(":");
      root.querySelector('[data-time-input-part="hours"]').value = hours;
      root.querySelector('[data-time-input-part="minutes"]').value = minutes;
    }
    root.classList.toggle("is-open", open);
    if (!open) root.classList.remove("is-open-up");
    control?.setAttribute("aria-expanded", String(open));
    if (popover) popover.hidden = !open;
    if (open) {
      this.positionTimeField(root);
      if (focus) root.querySelector("[data-time-input-part]")?.focus();
    } else if (focus) control?.focus();
  },
  closeTimeFields(scope = document, except = null) {
    scope.querySelectorAll("[data-time-input].is-open").forEach(root => {
      if (root !== except) this.setTimeFieldOpen(root, false);
    });
  },
  applyTimeField(root) {
    const parts = Array.from(root?.querySelectorAll("[data-time-input-part]") || []);
    if (parts.length !== 2) return false;
    for (const part of parts) {
      if (!part.reportValidity()) return false;
    }
    const value = parts.map(part => String(Number(part.value)).padStart(2, "0")).join(":");
    const input = root.querySelector("[data-time-input-value]");
    const previous = input?.value;
    if (!this.setTimeFieldValue(root, value)) return false;
    this.touchFormInput(root);
    this.setTimeFieldOpen(root, false, {focus: true});
    if (input && previous !== value) {
      input.dispatchEvent(new Event("input", {bubbles: true}));
      input.dispatchEvent(new Event("change", {bubbles: true}));
    }
    return true;
  },
  measureFormInputTag(tag) {
    const clone = tag.cloneNode(true);
    clone.hidden = false;
    clone.style.position = "absolute";
    clone.style.inset = "auto";
    clone.style.left = "-9999px";
    clone.style.top = "-9999px";
    clone.style.width = "max-content";
    clone.style.maxWidth = "none";
    clone.style.visibility = "hidden";
    document.body.appendChild(clone);
    const width = Math.ceil(clone.getBoundingClientRect().width);
    clone.remove();
    return width;
  },
  closeFormInputHiddenMenus(scope = document, except = null) {
    scope?.querySelectorAll?.(".form-input__tag-more.is-open").forEach(root => {
      if (root === except) return;
      root.classList.remove("is-open");
      root.closest(".form-input")?.classList.remove("has-tag-rollover");
      root.querySelector("[data-form-input-hidden-toggle]")?.setAttribute("aria-expanded", "false");
      const menu = root.querySelector("[data-form-input-hidden-menu]");
      if (menu) menu.hidden = true;
    });
  },
  syncFormInputOverflow(root) {
    const valueRoot = root?.querySelector("[data-form-input-value]");
    root?.classList.remove("has-tag-rollover");
    if (!root || !valueRoot) return;
    const tags = [...valueRoot.querySelectorAll("[data-form-input-tag-item]")];
    const more = valueRoot.querySelector("[data-form-input-tag-more]");
    const setPrimaryMode = primary => {
      valueRoot.dataset.formInputTagMode = primary ? "primary" : "full";
      tags[0]?.classList.toggle("form-input__tag--primary", primary);
    };

    if (!more) {
      setPrimaryMode(tags.length === 1);
      return;
    }
    if (tags.length <= 1 || valueRoot.offsetParent === null) {
      more.hidden = true;
      return;
    }

    valueRoot.dataset.formInputTagMode = "full";
    tags.forEach(tag => {
      tag.hidden = false;
      tag.style.flex = "";
      tag.style.width = "";
      tag.style.minWidth = "";
      tag.style.maxWidth = "";
      tag.classList.remove("form-input__tag--primary");
    });
    more.hidden = true;
    more.classList.remove("is-open");
    root.classList.remove("has-tag-rollover");
    const toggle = more.querySelector("[data-form-input-hidden-toggle]");
    const menu = more.querySelector("[data-form-input-hidden-menu]");
    const countNode = more.querySelector("[data-form-input-hidden-count]");
    toggle?.setAttribute("aria-expanded", "false");
    if (menu) menu.hidden = true;

    const gap = parseFloat(getComputedStyle(valueRoot).columnGap) || 0;
    const tagWidths = tags.map(tag => this.measureFormInputTag(tag));
    const applyVisibleTags = (count, primary) => {
      const visibleLimit = primary ? 1 : count;
      setPrimaryMode(primary);
      tags.forEach((tag, index) => {
        const visible = index < visibleLimit;
        tag.hidden = !visible;
        tag.style.flex = "";
        tag.style.width = "";
        tag.style.minWidth = "";
        tag.style.maxWidth = "";
        if (visible && !primary) {
          tag.style.flex = `0 0 ${tagWidths[index]}px`;
          tag.style.width = `${tagWidths[index]}px`;
          tag.style.minWidth = `${tagWidths[index]}px`;
          tag.style.maxWidth = `${tagWidths[index]}px`;
        }
      });
    };
    const fullVisibleLayoutFits = count => {
      const valueRight = valueRoot.getBoundingClientRect().right + 0.5;
      const firstTitle = tags[0]?.querySelector(".pill__title");
      const firstIsFull = firstTitle ? firstTitle.scrollWidth <= firstTitle.clientWidth + 1 : true;
      const visibleInside = tags.slice(0, count).every(tag => tag.getBoundingClientRect().right <= valueRight);
      const counterInside = more.hidden || more.getBoundingClientRect().right <= valueRight;
      return firstIsFull && visibleInside && counterInside;
    };
    const fullWidth = tagWidths.reduce((sum, width, index) => sum + width + (index ? gap : 0), 0);
    if (fullWidth <= valueRoot.clientWidth) {
      applyVisibleTags(tags.length, false);
      if (countNode) countNode.textContent = "";
      if (menu) menu.innerHTML = "";
      return;
    }

    let visibleCount = 1;
    let primaryMode = true;
    for (let count = tags.length - 1; count >= 2; count -= 1) {
      if (countNode) countNode.textContent = String(tags.length - count);
      more.hidden = false;
      const visibleTagsWidth = tagWidths.slice(0, count).reduce((sum, width, index) => sum + width + (index ? gap : 0), 0);
      const totalWidth = visibleTagsWidth + (count ? gap : 0) + more.offsetWidth;
      more.hidden = true;
      if (totalWidth <= valueRoot.clientWidth) {
        visibleCount = count;
        primaryMode = false;
        break;
      }
    }

    if (primaryMode && countNode) countNode.textContent = String(tags.length - 1);
    more.hidden = false;
    applyVisibleTags(visibleCount, primaryMode);
    if (!primaryMode && visibleCount > 1 && !fullVisibleLayoutFits(visibleCount)) {
      visibleCount = 1;
      primaryMode = true;
      if (countNode) countNode.textContent = String(tags.length - 1);
      applyVisibleTags(visibleCount, primaryMode);
    }
    const hiddenValues = tags.slice(visibleCount).map(tag => tag.dataset.formInputTagValue);
    if (!hiddenValues.length) {
      more.hidden = true;
      if (countNode) countNode.textContent = "";
      if (menu) menu.innerHTML = "";
      return;
    }
    if (countNode) countNode.textContent = String(hiddenValues.length);
    toggle?.setAttribute("aria-label", `Показать скрытые выбранные: ${hiddenValues.join(", ")}`);
    if (menu) {
      menu.innerHTML = hiddenValues.map(value => this.formInputTag(value, "form-input__tag--rollover", false)).join("");
      menu.hidden = true;
    }
    more.hidden = false;
  },
  syncAllFormInputOverflow(scope = document) {
    scope?.querySelectorAll?.(".form-input").forEach(root => this.syncFormInputOverflow(root));
  },
  syncFormInputSearch(root) {
    const search = root?.querySelector("[data-form-input-search]");
    const clear = root?.querySelector("[data-form-input-search-clear]");
    if (!search || !clear) return;
    clear.hidden = !search.value;
  },
  filterFormInputOptions(root) {
    const search = root?.querySelector("[data-form-input-search]");
    const query = search ? search.value.trim().toLocaleLowerCase("ru-RU") : "";
    root?.querySelectorAll?.("[data-form-input-option]").forEach(option => {
      const label = option.querySelector(".form-input__option-label")?.textContent || option.textContent;
      option.hidden = Boolean(query) && !label.toLocaleLowerCase("ru-RU").includes(query);
    });
    this.syncFormInputSearch(root);
  },
  syncFormInput(root, set, {allValue = root?.dataset.formInputAll || "Всё", emptyMessage = root?.dataset.formInputEmpty || "Ничего не выбрано", explicitAll = false} = {}) {
    if (!root || !(set instanceof Set)) return;
    const isEmpty = !set.size;
    const isAll = set.has(allValue);
    const isPartial = !isAll && set.size > 0;
    root.classList.toggle("has-selection", !isAll);
    root.classList.toggle("is-explicit-all", isAll && explicitAll);
    root.classList.toggle("is-empty", isEmpty);
    root.querySelector("[data-form-input-value]").innerHTML = this.formInputValue(set, {allValue, emptyMessage});
    const control = root.querySelector(".form-input__control");
    control?.setAttribute("aria-label", `${root.querySelector(".form-input__label")?.textContent || ""}: ${this.formInputText(set, {allValue, emptyMessage})}`);
    control?.setAttribute("aria-invalid", String(isEmpty));
    const warning = root.querySelector("[data-form-input-empty-warning]");
    if (warning) warning.hidden = !isEmpty;
    root.querySelectorAll("[data-form-input-option]").forEach(option => {
      const value = option.dataset.formInputOption;
      const isAllOption = value === allValue;
      const active = isAll || (!isAllOption && set.has(value));
      const indeterminate = isAllOption && isPartial;
      const checkbox = option.querySelector(".form-input__checkbox");
      option.classList.toggle("is-selected", active);
      option.classList.toggle("is-indeterminate", indeterminate);
      option.setAttribute("aria-selected", String(active));
      option.setAttribute("aria-checked", indeterminate ? "mixed" : String(active));
      option.hidden = false;
      if (checkbox) checkbox.innerHTML = indeterminate ? this.icon("minus") : this.icon("check");
    });
    const search = root.querySelector("[data-form-input-search]");
    if (search) search.value = "";
    this.syncFormInputSearch(root);
    this.syncFormInputOverflow(root);
  },
  bindMultiFormInput(root, {values = new Set(), required = false} = {}) {
    const ui = this;
    const allValue = root.dataset.formInputAll || 'Всё';
    let explicitAll = false;
    const listeners = [];
    const on = (target, type, handler) => {
      target.addEventListener(type, handler);
      listeners.push(() => target.removeEventListener(type, handler));
    };
    function sync() {
      const search = root.querySelector('[data-form-input-search]');
      const query = search?.value || '';
      ui.syncFormInput(root, values, {explicitAll});
      if (!required) {
        root.classList.remove('is-empty');
        root.querySelector('.form-input__control')?.setAttribute('aria-invalid', 'false');
        const warning = root.querySelector('[data-form-input-empty-warning]');
        if (warning) warning.hidden = true;
      }
      if (search) search.value = query;
      ui.filterFormInputOptions(root);
    }
    function setOpen(open, focus = false) {
      root.classList.toggle('is-open', open);
      root.classList.remove('is-open-up');
      root.querySelector('.form-input__control')?.setAttribute('aria-expanded', String(open));
      const menu = root.querySelector('.form-input__menu');
      if (menu) menu.hidden = !open;
      if (open) {
        ui.closeSingleFormInputs();
        ui.closeDatePickers();
        ui.closeDropdowns();
        requestAnimationFrame(() => ui.positionFormInputMenu(root));
      } else ui.closeFormInputHiddenMenus(root);
      if (focus) root.querySelector(open ? '[data-form-input-search]' : '.form-input__control')?.focus();
    }
    on(root, 'click', event => {
      const remove = event.target.closest('[data-form-input-tag-remove]');
      const option = event.target.closest('[data-form-input-option]');
      const hiddenToggle = event.target.closest('[data-form-input-hidden-toggle]');
      const clear = event.target.closest('[data-form-input-search-clear]');
      if (remove || option || hiddenToggle || clear || event.target.closest('.form-input__control')) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (remove || option) {
        explicitAll = Boolean(option && option.dataset.formInputOption === allValue && !values.size);
        if (remove) ui.removeMultiSelectValue(values, remove.dataset.formInputTagRemove, {allValue, allowEmpty: true});
        else ui.toggleMultiSelectValue(values, option.dataset.formInputOption, {allValue, allowEmpty: true, toggleAll: true});
        sync();
        ui.positionFormInputMenu(root);
      } else if (hiddenToggle) {
        const more = hiddenToggle.closest('[data-form-input-tag-more]');
        const open = hiddenToggle.getAttribute('aria-expanded') !== 'true';
        ui.closeFormInputHiddenMenus(document, more);
        more.classList.toggle('is-open', open);
        root.classList.toggle('has-tag-rollover', open);
        hiddenToggle.setAttribute('aria-expanded', String(open));
        const menu = more.querySelector('[data-form-input-hidden-menu]');
        if (menu) menu.hidden = !open;
      } else if (clear) {
        const search = root.querySelector('[data-form-input-search]');
        search.value = '';
        ui.filterFormInputOptions(root);
        requestAnimationFrame(() => ui.positionFormInputMenu(root));
        search.focus();
      } else if (event.target.closest('.form-input__control')) setOpen(!root.classList.contains('is-open'));
    });
    on(root, 'input', event => {
      if (event.target.closest('[data-form-input-search]')) {
        ui.filterFormInputOptions(root);
        requestAnimationFrame(() => ui.positionFormInputMenu(root));
      }
    });
    on(root, 'keydown', event => {
      if (event.key === 'Escape' && (root.classList.contains('is-open') || root.classList.contains('has-tag-rollover'))) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (root.classList.contains('has-tag-rollover')) ui.closeFormInputHiddenMenus(root);
        else setOpen(false, true);
        return;
      }
      const control = event.target.closest('.form-input__control');
      if (control && ['Enter', ' ', 'ArrowDown'].includes(event.key) && !event.target.closest('[data-form-input-tag-remove], [data-form-input-hidden-toggle]')) {
        event.preventDefault(); setOpen(true, true); return;
      }
      const options = [...root.querySelectorAll('[data-form-input-option]')].filter(option => !option.hidden && !option.disabled);
      const option = event.target.closest('[data-form-input-option]');
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const index = options.indexOf(option);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
        options[next]?.focus();
      } else if (event.key === 'Enter' && event.target.closest('[data-form-input-search]')) event.preventDefault();
    });
    const closeOutside = event => { if (!root.contains(event.target)) setOpen(false); };
    on(document, 'click', closeOutside);
    on(document, 'focusin', closeOutside);
    on(window, 'resize', () => ui.syncFormInputOverflow(root));
    sync();
    return () => { setOpen(false); listeners.forEach(remove => remove()); };
  },
  toggleMultiSelectValue(set, value, {allValue = "Всё", allowEmpty = false, toggleAll = false} = {}) {
    if (!(set instanceof Set)) return;
    if (value === allValue) {
      const selectAll = !toggleAll || !set.size;
      set.clear();
      if (selectAll) set.add(allValue);
      return;
    }
    if (set.has(allValue)) set.clear();
    if (set.has(value)) set.delete(value);
    else set.add(value);
    if (!set.size && !allowEmpty) set.add(allValue);
  },
  removeMultiSelectValue(set, value, {allValue = "Всё", allowEmpty = false} = {}) {
    if (!(set instanceof Set) || set.has(allValue)) return;
    set.delete(value);
    if (!set.size && !allowEmpty) set.add(allValue);
  },
  updateTableViewport(wrap) {
    const table = wrap?.querySelector(":scope > table");
    if (!table || !wrap.getClientRects().length) return;
    const style = window.getComputedStyle(wrap);
    const rowCount = Math.max(1, Number(style.getPropertyValue("--table-wrap-readable-rows")) || 6);
    const rows = Array.from(table.tBodies).flatMap(body => Array.from(body.rows)).filter(row => row.getClientRects().length);
    const headerHeight = table.tHead?.getBoundingClientRect().height || 0;
    const footerHeight = table.tFoot?.getBoundingClientRect().height || 0;
    const scrollbarHeight = Math.max(0, wrap.offsetHeight - wrap.clientHeight);
    const outsideBar = wrap.parentElement?.querySelector(":scope > .table-scrollbar--horizontal.is-visible");
    const outsideScrollbarHeight = outsideBar?.getBoundingClientRect().height || 0;
    const readableHeight = headerHeight + footerHeight + scrollbarHeight + rows.slice(0, rowCount).reduce((height, row) => height + row.getBoundingClientRect().height, 0);
    const rect = wrap.getBoundingClientRect();
    const boundary = wrap.closest(".filter-modal__fields, .filter-modal__body, .drawer-body, .dt-drawer-body, .quality-detail-drawer-card__body");
    let available;
    if (boundary) {
      const offset = Math.max(0, rect.top - boundary.getBoundingClientRect().top + boundary.scrollTop);
      available = boundary.clientHeight - offset - outsideScrollbarHeight;
    } else {
      const scrollY = window.scrollY || 0;
      const documentTop = rect.top + scrollY;
      const page = wrap.closest("#page-content");
      const section = wrap.closest(".div-block, .content-block, .analytics-layout__block") || page;
      // Lower-page tables use their section's chrome, not its distance down the page.
      const top = page && section ? Math.min(documentTop, page.getBoundingClientRect().top + scrollY + Math.max(0, rect.top - section.getBoundingClientRect().top)) : documentTop;
      const bottomSpace = parseFloat(style.getPropertyValue("--table-wrap-bottom-space")) || 0;
      const surface = wrap.parentElement && window.getComputedStyle(wrap.parentElement);
      const border = parseFloat(surface?.borderBottomWidth) || 0;
      available = (window.visualViewport?.height || window.innerHeight) - Math.max(0, top) - bottomSpace - border - outsideScrollbarHeight;
    }
    const height = `${Math.max(Math.ceil(readableHeight), Math.floor(available))}px`;
    if (wrap.style.getPropertyValue("--table-wrap-max-height") !== height) wrap.style.setProperty("--table-wrap-max-height", height);
    const block = wrap.closest(".table-block");
    const head = `${headerHeight}px`;
    if (block && block.style.getPropertyValue("--table-block-sticky-head-height") !== head) block.style.setProperty("--table-block-sticky-head-height", head);
  },
  updateTableHeightGroup(group) {
    if (group?.dataset.tableHeightGroup !== "smallest" || !group.getClientRects().length) return;
    const heights = Array.from(group.querySelectorAll(".table-wrap")).filter(wrap => wrap.closest("[data-table-height-group]") === group && wrap.getClientRects().length).map(wrap => {
      const table = wrap.querySelector(":scope > table");
      if (!table?.getClientRects().length) return null;
      return table.getBoundingClientRect().height + Math.max(0, wrap.offsetHeight - wrap.clientHeight);
    }).filter(height => height !== null);
    const property = "--table-height-group-height";
    if (!heights.length) {
      if (group.style.getPropertyValue(property)) group.style.removeProperty(property);
      return;
    }
    const minimum = parseFloat(window.getComputedStyle(group).getPropertyValue("--table-height-group-min-height")) || 0;
    const height = `${Math.ceil(Math.max(minimum, Math.min(...heights)))}px`;
    if (group.style.getPropertyValue(property) !== height) group.style.setProperty(property, height);
  },
  updateTableEmptyState(wrap) {
    const table = wrap.querySelector(":scope > table");
    if (!table?.matches?.(".data-table, .analytics-table") || !table.getClientRects().length) return;
    const columns = Math.max(1, ...Array.from(table.rows).filter(row => !row.hasAttribute("data-table-empty")).map(row => Array.from(row.cells).reduce((count, cell) => count + cell.colSpan, 0)));
    Array.from(table.tBodies).forEach(body => {
      const placeholder = body.querySelector(":scope > tr[data-table-empty]");
      const hasRows = Array.from(body.rows).some(row => !row.hasAttribute("data-table-empty") && row.getClientRects().length);
      if (hasRows) {
        placeholder?.remove();
      } else if (placeholder) {
        if (placeholder.cells[0].colSpan !== columns) placeholder.cells[0].colSpan = columns;
      } else {
        body.insertAdjacentHTML("beforeend", this.renderEmptyTableRow(columns, body.dataset.tableEmptyMessage || table.dataset.tableEmptyMessage || "Нет данных"));
      }
    });
  },
  updateTableColumns(wrap) {
    const table = wrap.querySelector(":scope > table");
    if (!table?.matches?.(".data-table, .analytics-table") || !wrap.clientWidth || !table.getClientRects().length) return;
    const layoutProperty = "--data-table-layout";
    if (!table.style.getPropertyValue(layoutProperty) && window.getComputedStyle(table).tableLayout === "fixed") return;
    const rows = Array.from(table.rows).filter(row => row.getClientRects().length).map(row => Array.from(row.cells).filter(cell => cell.getClientRects().length));
    const count = Math.max(0, ...rows.map(cells => cells.reduce((sum, cell) => sum + cell.colSpan, 0)));
    if (table.querySelector("colgroup") || count < 2 || rows.some(cells => cells.some(cell => cell.rowSpan > 1))) {
      if (table.style.getPropertyValue(layoutProperty)) table.style.removeProperty(layoutProperty);
      return;
    }
    const controlCells = "tbody td:is(.data-table__action-cell, .analytics-table__action-cell, :has(> .badge), :has(> button:not(.data-table__tree-toggle)), :has(> a:is([role='button'], .button-small, .button-smallest-secondary-radius, .button-smallest-primary-radius)))";
    if (table.querySelector(controlCells)) {
      if (table.style.getPropertyValue(layoutProperty) !== "auto") table.style.setProperty(layoutProperty, "auto");
      return;
    }
    const savedStyle = table.style.cssText;
    const scrollLeft = wrap.scrollLeft, scrollTop = wrap.scrollTop;
    const equalWidth = wrap.clientWidth / count;
    let fits;
    try {
      // Intrinsic column widths include the real fonts, controls, gaps and cell padding.
      table.style.width = "max-content";
      table.style.minWidth = "0";
      table.style.tableLayout = "auto";
      fits = rows.every(cells => cells.every(cell => cell.getBoundingClientRect().width <= equalWidth * cell.colSpan));
    } finally {
      table.style.cssText = savedStyle;
      wrap.scrollLeft = scrollLeft;
      wrap.scrollTop = scrollTop;
    }
    const layout = fits ? "fixed" : "auto";
    if (table.style.getPropertyValue(layoutProperty) !== layout) table.style.setProperty(layoutProperty, layout);
  },
  bindTableViewports() {
    if (this.tableViewportsBound) return;
    this.tableViewportsBound = true;
    let pending = false;
    const targets = new Set();
    const update = () => {
      pending = false;
      const next = new Set([document.documentElement]);
      document.querySelectorAll(".table-wrap").forEach(wrap => {
        this.updateTableEmptyState(wrap);
        this.updateTableColumns(wrap);
        this.updateTableViewport(wrap);
        [wrap, wrap.querySelector(":scope > table"), wrap.closest(".filter-modal__fields, .filter-modal__body, .drawer-body, .dt-drawer-body, .quality-detail-drawer-card__body")].filter(Boolean).forEach(element => next.add(element));
      });
      document.querySelectorAll('[data-table-height-group="smallest"]').forEach(group => {
        this.updateTableHeightGroup(group);
        next.add(group);
      });
      targets.forEach(element => { if (!next.has(element)) { observer?.unobserve(element); targets.delete(element); } });
      next.forEach(element => { if (element && !targets.has(element)) { observer?.observe(element); targets.add(element); } });
    };
    const requestUpdate = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(requestUpdate);
    if (typeof MutationObserver !== "undefined") {
      this.tableViewportMutations = new MutationObserver(requestUpdate);
      this.tableViewportMutations.observe(document.documentElement, {childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden", "open", "data-table-height-group"]});
    }
    window.addEventListener("resize", requestUpdate);
    window.visualViewport?.addEventListener("resize", requestUpdate);
    document.fonts?.ready?.then(requestUpdate);
    document.fonts?.addEventListener("loadingdone", requestUpdate);
    requestUpdate();
  },
  bindTableBlockScrollbars(scope = document) {
    const root = scope || document;
    const blocks = [];
    if (root.matches?.(".table-block--scroll-outside")) blocks.push(root);
    root.querySelectorAll?.(".table-block--scroll-outside").forEach(block => blocks.push(block));
    blocks.forEach(block => this.bindTableBlockScrollbar(block));
  },
  bindTableBlockScrollbar(block) {
    const wrap = block?.querySelector(":scope > .table-wrap");
    if (!wrap) return;

    const ensureBar = axis => {
      const modifier = `table-scrollbar--${axis}`;
      let bar = Array.from(block.children).find(child => child.classList?.contains(modifier));
      if (!bar) {
        bar = document.createElement("div");
        bar.className = `table-scrollbar ${modifier}`;
        bar.setAttribute("aria-hidden", "true");
        block.appendChild(bar);
      }

      let thumb = bar.querySelector(".table-scrollbar__thumb");
      if (!thumb) {
        thumb = document.createElement("span");
        thumb.className = "table-scrollbar__thumb";
        bar.appendChild(thumb);
      }

      return {bar, thumb};
    };

    const vertical = ensureBar("vertical");
    const horizontal = ensureBar("horizontal");
    let state = block.__bntTableScrollbars;

    const setVisible = (bar, visible) => {
      bar.hidden = !visible;
      bar.classList.toggle("is-visible", visible);
    };

    const update = () => {
      const maxTop = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
      const maxLeft = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
      const canScrollY = maxTop > 1;
      const canScrollX = maxLeft > 1;

      wrap.classList.toggle("is-drag-scrollable", canScrollY || canScrollX);
      setVisible(vertical.bar, canScrollY);
      setVisible(horizontal.bar, canScrollX);

      if (canScrollY) {
        const trackHeight = vertical.bar.clientHeight;
        const thumbHeight = Math.max(24, Math.round(trackHeight * wrap.clientHeight / wrap.scrollHeight));
        const thumbTop = Math.round((trackHeight - thumbHeight) * wrap.scrollTop / maxTop);
        vertical.thumb.style.height = `${Math.min(trackHeight, thumbHeight)}px`;
        vertical.thumb.style.transform = `translateY(${Math.max(0, thumbTop)}px)`;
      } else {
        vertical.thumb.style.height = "";
        vertical.thumb.style.transform = "";
      }

      if (canScrollX) {
        const trackWidth = horizontal.bar.clientWidth;
        const thumbWidth = Math.max(24, Math.round(trackWidth * wrap.clientWidth / wrap.scrollWidth));
        const thumbLeft = Math.round((trackWidth - thumbWidth) * wrap.scrollLeft / maxLeft);
        horizontal.thumb.style.width = `${Math.min(trackWidth, thumbWidth)}px`;
        horizontal.thumb.style.transform = `translateX(${Math.max(0, thumbLeft)}px)`;
      } else {
        horizontal.thumb.style.width = "";
        horizontal.thumb.style.transform = "";
      }
    };

    const requestUpdate = () => {
      if (state?.frame) return;
      state.frame = requestAnimationFrame(() => {
        state.frame = 0;
        update();
      });
    };

    const scrollFromTrackPoint = (elements, axis, point) => {
      const trackSize = axis === "y" ? elements.bar.clientHeight : elements.bar.clientWidth;
      const thumbSize = axis === "y" ? elements.thumb.offsetHeight : elements.thumb.offsetWidth;
      const scrollMax = axis === "y"
        ? wrap.scrollHeight - wrap.clientHeight
        : wrap.scrollWidth - wrap.clientWidth;
      const trackMax = Math.max(1, trackSize - thumbSize);
      const nextScroll = Math.max(0, Math.min(trackMax, point - thumbSize / 2)) / trackMax * scrollMax;
      if (axis === "y") wrap.scrollTop = nextScroll;
      else wrap.scrollLeft = nextScroll;
      update();
    };

    const bindDrag = (elements, axis) => {
      if (elements.bar.dataset.bntScrollbarBound) return;
      elements.bar.dataset.bntScrollbarBound = "true";
      elements.bar.addEventListener("pointerdown", event => {
        if (event.button !== 0) return;
        event.preventDefault();

        const pointerStart = axis === "y" ? event.clientY : event.clientX;
        const scrollStart = axis === "y" ? wrap.scrollTop : wrap.scrollLeft;
        const trackSize = axis === "y" ? elements.bar.clientHeight : elements.bar.clientWidth;
        const thumbSize = axis === "y" ? elements.thumb.offsetHeight : elements.thumb.offsetWidth;
        const scrollMax = axis === "y"
          ? wrap.scrollHeight - wrap.clientHeight
          : wrap.scrollWidth - wrap.clientWidth;
        const trackMax = Math.max(1, trackSize - thumbSize);

        if (!elements.thumb.contains(event.target)) {
          const rect = elements.bar.getBoundingClientRect();
          const point = axis === "y" ? event.clientY - rect.top : event.clientX - rect.left;
          scrollFromTrackPoint(elements, axis, point);
          return;
        }

        elements.bar.setPointerCapture?.(event.pointerId);
        const handlePointerMove = moveEvent => {
          const pointerCurrent = axis === "y" ? moveEvent.clientY : moveEvent.clientX;
          const nextScroll = scrollStart + (pointerCurrent - pointerStart) / trackMax * scrollMax;
          if (axis === "y") wrap.scrollTop = nextScroll;
          else wrap.scrollLeft = nextScroll;
          update();
        };
        const stopDrag = endEvent => {
          elements.bar.releasePointerCapture?.(endEvent.pointerId);
          elements.bar.removeEventListener("pointermove", handlePointerMove);
          elements.bar.removeEventListener("pointerup", stopDrag);
          elements.bar.removeEventListener("pointercancel", stopDrag);
        };
        elements.bar.addEventListener("pointermove", handlePointerMove);
        elements.bar.addEventListener("pointerup", stopDrag);
        elements.bar.addEventListener("pointercancel", stopDrag);
      });
    };

    const bindContentDrag = () => {
      if (wrap.dataset.bntTableDragBound) return;
      wrap.dataset.bntTableDragBound = "true";
      const ignoreSelector = "a, button, input, textarea, select, label, summary, [role='button'], [contenteditable='true'], .table-scrollbar";

      wrap.addEventListener("pointerdown", event => {
        if (event.button !== 0 || event.pointerType !== "mouse") return;
        if (event.target.closest(ignoreSelector)) return;
        const maxTop = wrap.scrollHeight - wrap.clientHeight;
        const maxLeft = wrap.scrollWidth - wrap.clientWidth;
        if (maxTop <= 1 && maxLeft <= 1) return;

        const startX = event.clientX;
        const startY = event.clientY;
        const startLeft = wrap.scrollLeft;
        const startTop = wrap.scrollTop;
        let dragging = false;

        wrap.setPointerCapture?.(event.pointerId);

        const handlePointerMove = moveEvent => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          if (!dragging && Math.hypot(deltaX, deltaY) < 4) return;
          dragging = true;
          moveEvent.preventDefault();
          wrap.classList.add("is-dragging");
          wrap.scrollLeft = startLeft - deltaX;
          wrap.scrollTop = startTop - deltaY;
          requestUpdate();
        };

        const stopDrag = endEvent => {
          wrap.releasePointerCapture?.(endEvent.pointerId);
          wrap.classList.remove("is-dragging");
          wrap.removeEventListener("pointermove", handlePointerMove);
          wrap.removeEventListener("pointerup", stopDrag);
          wrap.removeEventListener("pointercancel", stopDrag);
        };

        wrap.addEventListener("pointermove", handlePointerMove);
        wrap.addEventListener("pointerup", stopDrag);
        wrap.addEventListener("pointercancel", stopDrag);
      });
    };

    if (!state) {
      state = {frame: 0};
      block.__bntTableScrollbars = state;
      wrap.addEventListener("scroll", requestUpdate, {passive: true});
      window.addEventListener("resize", requestUpdate);

      if (typeof ResizeObserver !== "undefined") {
        state.resizeObserver = new ResizeObserver(requestUpdate);
        [block, wrap, wrap.firstElementChild].filter(Boolean).forEach(element => state.resizeObserver.observe(element));
      }
    }

    bindDrag(vertical, "y");
    bindDrag(horizontal, "x");
    bindContentDrag();
    requestUpdate();
  },
  toast(title, message = "", {tone = "default"} = {}) {
    title = String(title ?? "");
    message = String(message ?? "");
    const closeLabel = title.trim() || message.trim() || "Внимание!";
    if (!message.trim()) {
      message = title.trim() ? title : "";
      title = "Внимание!";
    } else if (!title.trim()) {
      title = "Внимание!";
    }
    const variant = ["positive", "warning", "error", "neutral", "default"].includes(tone) ? tone : "default";
    let root = document.querySelector(".toast-root");
    if (!root) {
      root = document.createElement("div");
      root.className = "toast-root";
      document.body.appendChild(root);
    }
    root.classList.add("ui-scrollbar");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Уведомления");
    const trigger = document.activeElement;
    const item = document.createElement("div");
    item.className = `app-toast app-toast--${variant}`;
    item.setAttribute("role", variant === "warning" || variant === "error" ? "alert" : "status");
    item.setAttribute("aria-atomic", "true");
    const icon = variant === "positive" ? "check" : variant === "warning" || variant === "error" ? "warning" : "info";
    item.innerHTML = `<span class="layout-item-icon app-toast__icon" aria-hidden="true">${this.icon(icon)}</span><div class="app-toast__copy"><strong class="typography-caption-smallest">${this.escape(title)}</strong>${message ? `<p class="typography-body-smallest">${this.escape(message)}</p>` : ""}</div><button class="sign_BTN_small app-toast__close" type="button" data-toast-close aria-label="Закрыть уведомление: ${this.escape(closeLabel)}" title="Закрыть">${this.icon("close")}</button>`;
    item.addEventListener("click", event => {
      if (!event.target.closest("[data-toast-close]")) return;
      const restoreFocus = item.contains(document.activeElement);
      const next = item.nextElementSibling || item.previousElementSibling;
      item.remove();
      if (restoreFocus) {
        const control = next?.querySelector("[data-toast-close]") || (trigger?.isConnected ? trigger : null);
        control?.focus();
      }
    });
    root.appendChild(item);
    root.scrollTop = root.scrollHeight;
    return item;
  },
  ensureInfoPopover() {
    if (this.infoPopoverElement) return this.infoPopoverElement;
    const popover = document.createElement("div");
    popover.className = "bnt-info-popover typography-body-smallest";
    popover.id = "bnt-info-popover";
    popover.setAttribute("role", "dialog");
    popover.hidden = true;
    document.body.appendChild(popover);
    popover.addEventListener("click", event => {
      if (event.target.closest("[data-bnt-info-close]")) this.closeInfoPopover();
    });
    this.infoPopoverElement = popover;
    return popover;
  },
  positionInfoPopover() {
    const popover = this.infoPopoverElement;
    const trigger = this.infoPopoverTrigger;
    if (!popover || !trigger || popover.hidden) return;
    const gap = 8;
    const margin = 12;
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    const popoverWidth = Math.min(popoverRect.width, viewportWidth - margin * 2);
    const popoverHeight = Math.min(popoverRect.height, viewportHeight - margin * 2);
    let placement = triggerRect.bottom + gap + popoverHeight <= viewportHeight - margin ? "bottom" : "top";
    if (placement === "top" && triggerRect.top - gap - popoverHeight < margin) placement = "bottom";
    let left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;
    let top = placement === "bottom" ? triggerRect.bottom + gap : triggerRect.top - popoverHeight - gap;
    left = Math.min(Math.max(margin, left), viewportWidth - margin - popoverWidth);
    top = Math.min(Math.max(margin, top), viewportHeight - margin - popoverHeight);
    const arrowLeft = Math.min(Math.max(14, triggerRect.left + triggerRect.width / 2 - left), popoverWidth - 14);
    popover.style.setProperty("--bnt-info-left", `${left}px`);
    popover.style.setProperty("--bnt-info-top", `${top}px`);
    popover.style.setProperty("--bnt-info-arrow-left", `${arrowLeft}px`);
    popover.dataset.bntInfoPlacement = placement;
  },
  showInfoPopover(trigger, {title = "", message = ""} = {}) {
    if (!trigger) return;
    const popover = this.ensureInfoPopover();
    const isSameOpen = this.infoPopoverTrigger === trigger && !popover.hidden;
    if (isSameOpen) {
      this.closeInfoPopover();
      return;
    }
    if (this.infoPopoverTrigger && this.infoPopoverTrigger !== trigger) this.infoPopoverTrigger.setAttribute("aria-expanded", "false");
    this.infoPopoverTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-controls", popover.id);
    popover.innerHTML = `<button class="bnt-info-popover__close" type="button" data-bnt-info-close aria-label="Закрыть"><svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button><strong class="bnt-info-popover__title typography-label-smallest">${this.escape(title)}</strong><span class="bnt-info-popover__text typography-body-smallest">${this.escape(message)}</span>`;
    popover.hidden = false;
    this.positionInfoPopover();
  },
  closeInfoPopover() {
    const popover = this.infoPopoverElement;
    if (this.infoPopoverTrigger) this.infoPopoverTrigger.setAttribute("aria-expanded", "false");
    this.infoPopoverTrigger = null;
    if (!popover) return;
    popover.hidden = true;
    popover.removeAttribute("data-bnt-info-placement");
    popover.style.removeProperty("--bnt-info-left");
    popover.style.removeProperty("--bnt-info-top");
    popover.style.removeProperty("--bnt-info-arrow-left");
  },
  speedDialSecondary({label = "Ещё", ariaLabel = "Ещё действия", size = "smallest", items = [], className = "", rootAttributes = {}, triggerAttributes = {}, menuAttributes = {}} = {}) {
    if (!items.length) return "";
    const small = size === "small";
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.6501 12H4.6606M12.0001 12H12.0106M19.3501 12H19.3606M5.7001 12C5.7001 12.5799 5.23 13.05 4.6501 13.05C4.0702 13.05 3.6001 12.5799 3.6001 12C3.6001 11.4201 4.0702 10.95 4.6501 10.95C5.23 10.95 5.7001 11.4201 5.7001 12ZM13.0501 12C13.0501 12.5799 12.58 13.05 12.0001 13.05C11.4202 13.05 10.9501 12.5799 10.9501 12C10.9501 11.4201 11.4202 10.95 12.0001 10.95C12.58 10.95 13.0501 11.4201 13.0501 12ZM20.4001 12C20.4001 12.5799 19.93 13.05 19.3501 13.05C18.7702 13.05 18.3001 12.5799 18.3001 12C18.3001 11.4201 18.7702 10.95 19.3501 10.95C19.93 10.95 20.4001 11.4201 20.4001 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
    const links = items.map(item => {
      const itemIcon = item.icon ? `<span class="speed-dial-secondary__item-icon" aria-hidden="true">${item.icon}</span>` : "";
      const tag = item.href ? "a" : "button";
      const attributes = item.href
        ? {class: `speed-dial-secondary__link typography-body-${small ? "small" : "smallest"}`, href: item.href, role: "menuitem", ...(item.attributes || {})}
        : {class: `speed-dial-secondary__link typography-body-${small ? "small" : "smallest"}`, type: item.type || "button", role: "menuitem", ...(item.attributes || {})};
      return `<${tag}${this.attrs(attributes)}>${itemIcon}<span class="speed-dial-secondary__link-text">${this.escape(item.label)}</span></${tag}>`;
    }).join("");
    const rootClass = ["speed-dial-secondary", small ? "speed-dial-secondary--small" : "", className].filter(Boolean).join(" ");
    const rootAttrs = this.attrs({class: rootClass, "data-speed-dial-secondary": true, ...rootAttributes});
    const triggerAttrs = this.attrs({class: `speed-dial-secondary__trigger ${small ? "button-small button-small--secondary typography-button-small" : "button-smallest-secondary-radius"}`, type: "button", "aria-haspopup": "menu", "aria-expanded": "false", "aria-label": ariaLabel, ...triggerAttributes});
    const menuAttrs = this.attrs({class: "speed-dial-secondary__menu", role: "menu", hidden: true, ...menuAttributes});
    const chevron = small ? `<span class="speed-dial-secondary__chevron nav-chevron" aria-hidden="true">${this.icon("chevron")}</span>` : "";
    return `<div${rootAttrs}><button${triggerAttrs}><span class="speed-dial-secondary__icon">${icon}</span><span class="speed-dial-secondary__label typography-${small ? "button-small" : "indicator-small"}">${this.escape(label)}</span>${chevron}</button><div${menuAttrs}>${links}</div></div>`;
  },
  chartLinePath(points) {
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ");
  },
  chartSmoothLinePath(points) {
    if (!Array.isArray(points) || points.length < 3) return this.chartLinePath(points || []);

    const commands = [`M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];

    for (let index = 0; index < points.length - 1; index += 1) {
      const point = points[index];
      const nextPoint = points[index + 1];
      const previousPoint = points[index - 1] || point;
      const afterNextPoint = points[index + 2] || nextPoint;
      const controlPointOne = {
        x: point.x + (nextPoint.x - previousPoint.x) / 6,
        y: point.y + (nextPoint.y - previousPoint.y) / 6
      };
      const controlPointTwo = {
        x: nextPoint.x - (afterNextPoint.x - point.x) / 6,
        y: nextPoint.y - (afterNextPoint.y - point.y) / 6
      };

      commands.push(
        `C${controlPointOne.x.toFixed(1)} ${controlPointOne.y.toFixed(1)} ` +
        `${controlPointTwo.x.toFixed(1)} ${controlPointTwo.y.toFixed(1)} ` +
        `${nextPoint.x.toFixed(1)} ${nextPoint.y.toFixed(1)}`
      );
    }

    return commands.join(" ");
  },
  financialLineChartFilterDefs(prefix) {
    const filters = ["primary", "secondary", "positive", "warning", "negative", "purple"]
      .map(tone => [tone, `var(--chart-color-${tone})`]);

    return `<defs>${filters.map(([tone, color]) => `
      <filter id="${prefix}-shadow-${tone}" x="-12%" y="-18%" width="124%" height="150%" color-interpolation-filters="sRGB">
        <feDropShadow dx="0" dy="9" stdDeviation="9" flood-color="${color}" flood-opacity="0.2"/>
        <feDropShadow dx="0" dy="6" stdDeviation="4.5" flood-color="${color}" flood-opacity="0.2"/>
        <feDropShadow dx="0" dy="3" stdDeviation="1.5" flood-color="${color}" flood-opacity="0.2"/>
      </filter>
    `).join("")}</defs>`;
  },
  ensureFinancialLineChartTooltip(chart) {
    const viewport = chart?.parentElement;
    if (!viewport) return null;
    const existingTooltip = viewport.querySelector(".financial-chart__tooltip");
    if (existingTooltip) return existingTooltip;

    const tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip financial-chart__tooltip typography-body-smallest";
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
    tooltip.innerHTML = `
      <strong class="financial-chart__tooltip-title typography-caption-small" data-financial-line-tooltip-title></strong>
      <div><span>Период</span><strong data-financial-line-tooltip-period></strong></div>
      <div><span>Значение</span><strong data-financial-line-tooltip-value></strong></div>
    `;
    viewport.appendChild(tooltip);
    return tooltip;
  },
  positionFinancialLineChartTooltip(chart, tooltip, clientX, clientY) {
    const viewport = chart?.parentElement;
    if (!viewport || !tooltip) return;

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
  },
  showFinancialLineChartTooltip(chart, point, clientX, clientY) {
    const tooltip = this.ensureFinancialLineChartTooltip(chart);
    if (!tooltip || !point) return;

    tooltip.querySelector("[data-financial-line-tooltip-title]").textContent = point.dataset.seriesLabel || "";
    tooltip.querySelector("[data-financial-line-tooltip-period]").textContent = point.dataset.category || "";
    tooltip.querySelector("[data-financial-line-tooltip-value]").textContent = point.dataset.formattedValue || "";
    tooltip.hidden = false;
    this.positionFinancialLineChartTooltip(chart, tooltip, clientX, clientY);
  },
  hideFinancialLineChartTooltip(chart) {
    const tooltip = chart?.parentElement?.querySelector(".financial-chart__tooltip");
    if (tooltip) tooltip.hidden = true;
  },
  measureChartLabel(label, chart) {
    const text = String(label ?? "");
    const doc = chart?.ownerDocument || (typeof document !== "undefined" ? document : null);
    const canvas = this.chartMeasureCanvas || doc?.createElement?.("canvas");
    const context = canvas?.getContext?.("2d");

    if (context) {
      this.chartMeasureCanvas = canvas;
      const styles = window.getComputedStyle?.(chart);
      const fontSize = styles?.fontSize || "14px";
      const fontWeight = styles?.fontWeight || "400";
      const fontFamily = styles?.fontFamily || "Golos Text, Segoe UI, Arial, sans-serif";
      context.font = `${fontWeight} ${fontSize} ${fontFamily}`;
      return context.measureText(text).width;
    }

    return text.length * 8;
  },
  splitChartLabel(label, maxLines = 2, maxWidth = Infinity, chart = null) {
    const text = String(label ?? "");
    if (!Number.isFinite(maxWidth) || this.measureChartLabel(text, chart) <= maxWidth) return [text];

    const words = String(label ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1 || maxLines <= 1) return [String(label ?? "")];

    const lines = [""];

    words.forEach(word => {
      const index = lines.length - 1;
      const candidate = lines[index] ? `${lines[index]} ${word}` : word;
      const shouldWrap = lines.length < maxLines && lines[index];

      if (shouldWrap && this.measureChartLabel(candidate, chart) > maxWidth) {
        lines.push(word);
      } else {
        lines[index] = candidate;
      }
    });

    return lines.slice(0, maxLines);
  },
  fitChartTableLayout(chart, minimumWidth) {
    const grid = chart.closest?.(".chart-grid--two-column");
    if (!grid) return;
    const table = grid.querySelector(":scope > .table-block .data-table");
    const columns = Array.from(table?.tHead?.rows?.[0]?.cells || []).reduce((count, cell) => count + (cell.colSpan || 1), 0);
    const gap = parseFloat(window.getComputedStyle(grid).columnGap) || 0;
    let column = chart;
    while (column.parentElement && column.parentElement !== grid) column = column.parentElement;
    const inset = Math.max(0, column.clientWidth - (chart.parentElement?.clientWidth || column.clientWidth));
    const halfWidth = (grid.clientWidth - gap) / 2 - inset;
    grid.classList.toggle("chart-grid--chart-emphasis", columns === 2 && minimumWidth > halfWidth);
  },
  chartScale(minimum, maximum, {intervals = 4, step} = {}) {
    const values = [minimum, maximum].map(Number).filter(Number.isFinite);
    minimum = Math.min(0, ...values);
    maximum = Math.max(0, ...values);
    intervals = Math.max(minimum < 0 && maximum > 0 ? 2 : 1, Math.trunc(Number(intervals) || 4));
    if (maximum === minimum) maximum = minimum + 1;
    if (Number.isFinite(Number(step)) && Number(step) > 0) {
      step = Math.max(1, Math.ceil(Number(step)));
      return {step, min: Math.floor(minimum / step) * step || 0, max: Math.ceil(maximum / step) * step};
    }
    const rawStep = (maximum - minimum) / intervals;
    const magnitude = Math.max(1, Math.pow(10, Math.floor(Math.log10(rawStep))));
    for (const factor of [1, 2, 3, 4, 5, 6, 8, 10, 20]) {
      const step = Math.ceil(factor * magnitude);
      const min = Math.floor(minimum / step) * step || 0;
      const max = min + step * intervals;
      if (step >= rawStep && max >= maximum) return {step, min, max};
    }
  },
  renderFinancialLineChart(chart, {
    categories = [],
    series = [],
    legend = null,
    max = 0,
    autoAxisGutter = false,
    width = 960,
    minWidth = 1,
    height = 320,
    margin = {},
    tickCount = 5,
    categoryLineHeight = 16,
    maxCategoryLines = 2,
    formatTick = value => String(value),
    makePointLabel = ({category, seriesItem, value}) => `${category}, ${seriesItem.label}: ${value}`
  } = {}) {
    if (!chart) return;
    this.fitChartTableLayout(chart, minWidth);

    const chartRect = chart.getBoundingClientRect?.();
    const viewportWidth = chart.parentElement?.clientWidth || 0;
    const chartWidth = Math.max(
      minWidth,
      Math.round(chartRect?.width || viewportWidth || width)
    );
    chart.setAttribute("viewBox", `0 0 ${chartWidth} ${height}`);

    const chartMargin = {
      top: 8,
      right: 28,
      bottom: 54,
      left: 68,
      ...margin
    };
    const values = series.flatMap(seriesItem => (seriesItem.values || []).filter(value => value != null && Number.isFinite(Number(value))).map(Number));
    const {step, min: minValue, max: maxValue} = this.chartScale(Math.min(0, ...values), Math.max(Number(max) || 0, ...values), {intervals: Math.max(1, tickCount - 1)});
    const valueRange = maxValue - minValue || 1;
    const ticks = Array.from({length: Math.round(valueRange / step) + 1}, (_, index) => minValue + step * index);
    if (autoAxisGutter) {
      chartMargin.left = Math.max(chartMargin.left, ...ticks.map(value => this.measureChartLabel(formatTick(value), chart) + 10));
    }
    const plotRight = chartWidth - chartMargin.right;
    const plotBottom = height - chartMargin.bottom;
    const plotWidth = plotRight - chartMargin.left;
    const plotHeight = plotBottom - chartMargin.top;
    const groupWidth = plotWidth / Math.max(1, categories.length);
    const xCenterFor = index => chartMargin.left + groupWidth * index + groupWidth / 2;
    const yFor = value => plotBottom - (value - minValue) / valueRange * plotHeight;
    const filterPrefix = (
      chart.dataset.financialLineChartUid ||
      chart.dataset.analyticsLineChart ||
      `financial-line-${Math.random().toString(36).slice(2)}`
    ).replace(/[^a-z0-9_-]/gi, "-");
    chart.dataset.financialLineChartUid = filterPrefix;
    const svg = [this.financialLineChartFilterDefs(filterPrefix)];

    ticks.forEach(value => {
      const y = yFor(value);
      const tickX = chartMargin.left > 0 ? chartMargin.left - 10 : 8;
      const tickAnchor = chartMargin.left > 0 ? "end" : "start";

      svg.push(`<line class="financial-chart__grid-line" x1="${chartMargin.left}" y1="${y.toFixed(1)}" x2="${plotRight}" y2="${y.toFixed(1)}"/>`);
      svg.push(`<text class="financial-chart__tick" x="${tickX}" y="${y.toFixed(1)}" text-anchor="${tickAnchor}" dominant-baseline="middle" data-tick-value="${value}">${this.escape(formatTick(value))}</text>`);
    });

    for (let boundary = 0; boundary <= categories.length; boundary += 1) {
      const x = chartMargin.left + groupWidth * boundary;
      svg.push(`<line class="financial-chart__grid-line financial-chart__grid-line--vertical" x1="${x.toFixed(1)}" y1="${chartMargin.top}" x2="${x.toFixed(1)}" y2="${plotBottom}"/>`);
    }

    categories.forEach((category, index) => {
      const x = xCenterFor(index);
      const categoryWidth = Math.max(24, groupWidth - 12);
      const lines = this.splitChartLabel(category, maxCategoryLines, categoryWidth, chart);
      svg.push(`<text class="financial-chart__category" x="${x.toFixed(1)}" y="${plotBottom + 8}" dominant-baseline="hanging">`);
      lines.forEach((line, lineIndex) => {
        svg.push(`<tspan x="${x.toFixed(1)}" dy="${lineIndex === 0 ? 0 : categoryLineHeight}">${this.escape(line)}</tspan>`);
      });
      svg.push("</text>");
    });

    svg.push(`<line class="financial-chart__axis-line" x1="${chartMargin.left}" y1="${yFor(0)}" x2="${plotRight}" y2="${yFor(0)}"/>`);

    series.forEach(seriesItem => {
      const tone = String(seriesItem.className || "primary").replace(/[^a-z0-9_-]/gi, "") || "primary";
      const points = (seriesItem.values || []).map((value, index) => value == null || !Number.isFinite(Number(value)) ? null : ({
        x: xCenterFor(index),
        y: yFor(value),
        value: Number(value),
        index
      })).filter(Boolean);
      if (!points.length) return;
      const isFlatLine =
        points.length > 1 &&
        points.every(point => Math.abs(point.y - points[0].y) < 0.1);
      const linePath =
        isFlatLine
          ? this.chartLinePath(points)
          : this.chartSmoothLinePath(points);
      const shadowFilter = ["primary", "secondary", "positive", "warning", "negative", "purple"].includes(tone)
        ? ` filter="url(#${filterPrefix}-shadow-${tone})"`
        : "";

      if (isFlatLine && points.length > 1) {
        svg.push(`<line class="financial-chart__line financial-chart__line--${tone}" x1="${points[0].x.toFixed(1)}" y1="${points[0].y.toFixed(1)}" x2="${points[points.length - 1].x.toFixed(1)}" y2="${points[points.length - 1].y.toFixed(1)}"></line>`);
      } else {
        svg.push(`<path class="financial-chart__line financial-chart__line--${tone}" d="${linePath}"${shadowFilter}></path>`);
      }

      points.forEach(point => {
        const index = point.index;
        const label = makePointLabel({
          category: categories[index],
          seriesItem,
          value: point.value
        });
        const formattedValue = label.includes(":") ? label.slice(label.lastIndexOf(":") + 1).trim() : String(point.value);

        svg.push(`<circle class="financial-chart__point financial-chart__point--${tone}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" tabindex="0" role="img" aria-label="${this.escape(label)}" data-category="${this.escape(categories[index])}" data-series-label="${this.escape(seriesItem.label)}" data-formatted-value="${this.escape(formattedValue)}"></circle>`);
      });
    });

    const markup = svg.join("");
    if (chart.bntFinancialLineMarkup !== markup) {
      chart.innerHTML = markup;
      chart.bntFinancialLineMarkup = markup;
    }
    this.ensureFinancialLineChartTooltip(chart);

    if (legend) {
      legend.innerHTML = series
        .map(seriesItem => {
          const tone = String(seriesItem.className || "primary").replace(/[^a-z0-9_-]/gi, "") || "primary";
          return `<span><i class="financial-chart__legend-dot financial-chart__legend-dot--${tone}" aria-hidden="true"></i>${this.escape(seriesItem.label)}</span>`;
        })
        .join("");
    }
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
  },
  positionFormInputMenu(root) {
    const control = root?.querySelector(".form-input__control");
    const menu = root?.querySelector(".form-input__menu");
    if (!control || !menu || menu.hidden) return;
    const gap = 4;
    const viewportGap = 16;
    const maxHeight = 420;
    const minHeight = 120;
    const rect = control.getBoundingClientRect();
    const desiredHeight = Math.min(maxHeight, menu.scrollHeight || maxHeight);
    const availableBelow = window.innerHeight - viewportGap - rect.bottom - gap;
    const availableAbove = rect.top - viewportGap - gap;
    const fitsBelow = availableBelow >= desiredHeight;
    const fitsAbove = availableAbove >= desiredHeight;
    const openUp = !fitsBelow && (fitsAbove || availableAbove > availableBelow);
    const available = Math.max(minHeight, Math.min(maxHeight, openUp ? availableAbove : availableBelow));
    root.classList.toggle("is-open-up", openUp);
    menu.style.setProperty("--form-input-menu-max-height", `${Math.round(available)}px`);
  },
  positionOpenFormInputMenus(scope = document) {
    scope.querySelectorAll(".form-input.is-open").forEach(root => this.positionFormInputMenu(root));
  },
  touchFormInput(input) {
    if (!input || input.readOnly || input.disabled) return;
    input.classList.add("is-touched");
    input.closest(".form-input")?.classList.add("is-touched");
    input.closest(".equipment-date-field")?.classList.add("is-touched");
  },
  stepFormInputNumber(stepper, direction = 1) {
    const field = stepper?.closest(".form-input__text-field");
    const input = field?.querySelector('input[type="number"].form-input__control--text');
    if (!input || input.readOnly || input.disabled) return;

    const previous = input.value;
    try {
      if (direction > 0) input.stepUp();
      else input.stepDown();
    } catch (error) {
      const stepValue = input.step && input.step !== "any" ? Number(input.step) : 1;
      const step = Number.isFinite(stepValue) && stepValue > 0 ? stepValue : 1;
      const min = input.min === "" ? -Infinity : Number(input.min);
      const max = input.max === "" ? Infinity : Number(input.max);
      const current = Number(input.value);
      const base = Number.isFinite(current) ? current : Number.isFinite(min) ? min : 0;
      const next = Math.min(max, Math.max(min, base + direction * step));
      input.value = Number.isFinite(next) ? String(next) : "";
    }

    input.focus();
    this.touchFormInput(input);
    if (input.value !== previous) {
      input.dispatchEvent(new Event("input", {bubbles: true}));
      input.dispatchEvent(new Event("change", {bubbles: true}));
    }
  },
  bindChartMotion() {
    if (this.chartMotion || typeof Element === "undefined" || !Element.prototype.animate) return;
    const charts = 'svg.chart-bars, svg.chart-donut, svg.financial-chart__line-chart, svg.payment-risk-chart, svg.compare-chart, .svgchart > svg, .financial-chart__viewport > svg, .chart-viewport > svg:not(.chart-viewport__axis), .chart-donut__viewport > svg, .payment-deviation-chart, .procurement-plan-fact-chart, .procurement-budget-deviation-chart, .procurement-annual-chart, .procurement-stock-chart, .procurement-turnover-bar-chart, .analytics-capacity-chart__plot, .logistics-bar-list, .origin-breakdown__plot';
    const bars = '.payment-deviation-chart__bar, .procurement-plan-fact-chart__bar, .procurement-budget-deviation-chart__bar, .procurement-annual-chart__bar, .procurement-stock-chart__segment, .procurement-turnover-bar-chart__bar, .analytics-capacity-chart__bar, .logistics-bar-row__fill, .origin-breakdown__segment';
    const geometry = 'rect, .chart-donut__slice, .financial-chart__line, .financial-chart__point, path.line, circle.point, polyline, ' + bars;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const styles = window.getComputedStyle(document.documentElement);
    const time = styles.getPropertyValue("--chart-motion-duration").trim();
    const duration = parseFloat(time) * (time.endsWith("ms") ? 1 : 1000);
    if (!(duration > 0)) return;
    const easing = styles.getPropertyValue("--chart-motion-easing").trim() || "ease-out";
    const signatures = new WeakMap(), queued = new Set(), active = new Map();
    const animationTargets = new WeakMap();
    let frame = null, disposed = false;
    const targets = chart => [...chart.querySelectorAll(geometry)].filter(element => element.closest(charts) === chart && !element.closest('defs, clipPath, mask, pattern, [data-chart-motion="off"]') && !element.matches('[class*="grid"], [class*="axis"]') && !(element.matches("rect") && element.closest(".procurement-annual-chart__bar")));
    const finish = () => {
      for (const animation of active.keys()) animation.cancel();
      active.clear();
    };
    const lineSelector = ".financial-chart__line, path.line, polyline";
    const pointSelector = ".financial-chart__point, circle.point";
    const keyframesFor = element => {
      if (element.matches(pointSelector)) return [{opacity: 0}, {opacity: 1}];
      if (element.matches(lineSelector) && typeof element.getTotalLength === "function") {
        const length = element.getTotalLength();
        if (length > 0) return [
          {strokeDasharray: `${length} ${length}`, strokeDashoffset: length},
          {strokeDasharray: `${length} ${length}`, strokeDashoffset: 0}
        ];
      }
      const vertical = element.dataset.chartMotionAxis === "y" || element.matches(".procurement-annual-chart__bar") || (element.matches("rect") && element.dataset.chartMotionAxis !== "x");
      const negative = Number(element.dataset.value) < 0 || element.matches(".procurement-budget-deviation-chart__bar--negative");
      const from = vertical ? (negative ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)") : (negative ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)");
      return [{clipPath: from}, {clipPath: "inset(0 0 0 0)"}];
    };
    const reveal = chart => {
      if (!chart.isConnected || chart.closest('[data-chart-motion="off"]')) return;
      const elements = targets(chart);
      if (!elements.length) return;
      const values = [...chart.querySelectorAll("[data-formatted-value]")].map(point => point.dataset.formattedValue);
      const signature = JSON.stringify([chart.getAttribute("aria-label"), values, elements.map(element => element.getAttribute("aria-label") || element.getAttribute("data-value") || (element.matches("rect, path, circle, polyline") ? "" : element.parentElement.textContent))]);
      if (signatures.get(chart) === signature) {
        // Resize/font layout may replace SVG nodes while the same data is animating.
        for (const [animation, owner] of active) {
          if (owner !== chart) continue;
          const target = animationTargets.get(animation);
          const replacement = target && elements[target.index];
          if (replacement && replacement !== target.element) {
            animation.effect.target = replacement;
            animation.effect.setKeyframes(keyframesFor(replacement));
            target.element = replacement;
          }
        }
        return;
      }
      if (!chart.getClientRects().length) { visibility?.observe(chart); return; }
      const bounds = chart.getBoundingClientRect();
      if (visibility && (bounds.bottom <= 0 || bounds.top >= window.innerHeight || bounds.right <= 0 || bounds.left >= window.innerWidth)) { visibility.observe(chart); return; }
      visibility?.unobserve(chart);
      signatures.set(chart, signature);
      for (const [animation, owner] of active) {
        if (owner === chart || !owner.isConnected) { animation.cancel(); active.delete(animation); }
      }
      if (media?.matches || window.matchMedia?.("print").matches) return;
      const play = (element, keyframes, options = {}, index = -1) => {
        const animation = element.animate(keyframes, {duration, easing, fill: "backwards", ...options});
        active.set(animation, chart);
        animationTargets.set(animation, {element, index});
        animation.onfinish = animation.oncancel = () => { active.delete(animation); };
        return animation;
      };
      const donut = chart.bntDonutMotion;
      if (donut) {
        donut.update(0);
        const animation = play(chart, [{}, {}]);
        let sweepFrame = null;
        const draw = () => {
          donut.update(animation.effect.getComputedTiming().progress ?? 0);
          sweepFrame = requestAnimationFrame(draw);
        };
        animation.onfinish = animation.oncancel = () => {
          if (sweepFrame != null) cancelAnimationFrame(sweepFrame);
          donut.restore();
          active.delete(animation);
        };
        sweepFrame = requestAnimationFrame(draw);
      }
      const hasLines = elements.some(element => element.matches(lineSelector));
      elements.forEach((element, index) => {
        if (element.matches(".chart-donut__slice")) return;
        const point = element.matches(pointSelector);
        play(element, keyframesFor(element), point ? {delay: hasLines ? duration : 0, duration: duration * .3} : {}, index);
      });
    };
    const flush = () => {
      frame = null;
      for (const chart of queued) reveal(chart);
      queued.clear();
      for (const [animation, owner] of active) {
        if (!owner.isConnected) { animation.cancel(); active.delete(animation); }
      }
    };
    const enqueue = scope => {
      if (disposed || !scope?.querySelectorAll) return;
      if (scope.matches?.(charts)) queued.add(scope);
      const parent = scope.closest?.(charts);
      if (parent) queued.add(parent);
      scope.querySelectorAll(charts).forEach(chart => queued.add(chart));
      if (queued.size && frame == null) frame = requestAnimationFrame(flush);
    };
    const visibility = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) enqueue(entry.target);
    });
    const mutations = typeof MutationObserver === "undefined" ? null : new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "attributes") enqueue(record.target);
        else {
          if (record.target.closest?.(charts)) enqueue(record.target);
          record.addedNodes.forEach(enqueue);
        }
      }
    });
    mutations?.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"]});
    const resized = () => enqueue(document);
    const preference = () => { if (media.matches) finish(); else enqueue(document); };
    window.addEventListener("resize", resized);
    window.addEventListener("beforeprint", finish);
    media?.addEventListener("change", preference);
    this.chartMotion = {refresh: enqueue, destroy: () => {
      disposed = true;
      if (frame != null) cancelAnimationFrame(frame);
      queued.clear();
      finish();
      mutations?.disconnect();
      visibility?.disconnect();
      media?.removeEventListener("change", preference);
      window.removeEventListener("resize", resized);
      window.removeEventListener("beforeprint", finish);
      this.chartMotion = null;
    }};
    enqueue(document);
  },
  stepFormInputNumberFromPointer(stepper, event) {
    const rect = stepper?.getBoundingClientRect?.();
    const hasPointer = rect && Number.isFinite(event?.clientY) && event.clientY > 0;
    const direction = hasPointer && event.clientY > rect.top + rect.height / 2 ? -1 : 1;
    this.stepFormInputNumber(stepper, direction);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.BNTUI.bindTableViewports();
    window.BNTUI.bindDrawerHeaders();
    window.BNTUI.bindImageCards();
    window.BNTUI.bindFilterSummaryRows();
    window.BNTUI.bindMetricsGrids();
    window.BNTUI.bindCompactLabels();
    window.BNTUI.bindWorkspaces();
    window.BNTUI.bindScopedSearches();
    window.BNTUI.bindRiskScrollFades();
    window.BNTUI.bindChartMotion();
  }, {once: true});
} else {
  window.BNTUI.bindTableViewports();
  window.BNTUI.bindDrawerHeaders();
  window.BNTUI.bindImageCards();
  window.BNTUI.bindFilterSummaryRows();
  window.BNTUI.bindMetricsGrids();
  window.BNTUI.bindCompactLabels();
  window.BNTUI.bindWorkspaces();
  window.BNTUI.bindScopedSearches();
  window.BNTUI.bindRiskScrollFades();
  window.BNTUI.bindChartMotion();
}

document.addEventListener("click", event => {
  const ui = window.BNTUI;
  const summaryGroup = event.target.closest("[data-filter-summary-group]");
  ui.closeFilterSummaryMenus(summaryGroup);
  const summaryToggle = summaryGroup && event.target.closest("[data-filter-summary-toggle]");
  if (summaryToggle) { event.preventDefault(); ui.setFilterSummaryOpen(summaryGroup, summaryToggle.getAttribute("aria-expanded") !== "true"); return; }
  const dropdown = event.target.closest("[data-ui-dropdown]");
  ui.closeDropdowns(dropdown);
  const dropdownOption = dropdown && event.target.closest("[data-ui-dropdown-option]");
  if (dropdownOption) { event.preventDefault(); ui.selectDropdownOption(dropdownOption); return; }
  const dropdownTrigger = dropdown && event.target.closest(".ui-dropdown__trigger");
  if (dropdownTrigger) { event.preventDefault(); ui.setDropdownOpen(dropdown, dropdownTrigger.getAttribute("aria-expanded") !== "true"); return; }
  const dateRoot = event.target.closest("[data-bnt-date-root]");
  ui.closeDatePickers("bnt", dateRoot);
  if (ui.handleDateFieldClick(event, "bnt", () => { ui.closeSingleFormInputs(); ui.closeTimeFields(); })) return;
  ui.touchFormInput(event.target.closest(".form-input__option, .form-input__tag-remove, .equipment-date-popover button"));
  const singleRoot = event.target.closest('[data-form-input-mode="single"]');
  ui.closeSingleFormInputs(document, singleRoot);
  const singleOption = singleRoot && event.target.closest("[data-form-input-option]");
  if (singleOption) {
    event.preventDefault();
    ui.selectSingleFormInput(singleOption);
    return;
  }
  const singleControl = singleRoot && event.target.closest(".form-input__control");
  if (singleControl) {
    event.preventDefault();
    ui.setSingleFormInputOpen(singleRoot, singleControl.getAttribute("aria-expanded") !== "true");
    return;
  }

  const timeRoot = event.target.closest("[data-time-input]");
  ui.closeTimeFields(document, timeRoot);
  if (timeRoot && event.target.closest("[data-time-input-toggle]")) {
    event.preventDefault();
    ui.setTimeFieldOpen(timeRoot, !timeRoot.classList.contains("is-open"), {focus: true});
    return;
  }
  if (timeRoot && event.target.closest("[data-time-input-apply]")) {
    event.preventDefault();
    ui.applyTimeField(timeRoot);
    return;
  }
  if (timeRoot && event.target.closest("[data-time-input-cancel]")) {
    event.preventDefault();
    ui.setTimeFieldOpen(timeRoot, false, {focus: true});
    return;
  }

  const numberStepper = event.target.closest("[data-form-input-number-stepper]");
  if (numberStepper) {
    event.preventDefault();
    window.BNTUI.stepFormInputNumberFromPointer(numberStepper, event);
    return;
  }

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

  const formInputControl = event.target.closest(".form-input__control");
  if (formInputControl) {
    requestAnimationFrame(() => window.BNTUI.positionFormInputMenu(formInputControl.closest(".form-input")));
  }
});

window.addEventListener("resize", () => {
  document.querySelectorAll("[data-filter-summary-group].is-open").forEach(root => window.BNTUI.positionFilterSummaryMenu(root));
  requestAnimationFrame(() => window.BNTUI.positionOpenFormInputMenus());
  document.querySelectorAll("[data-bnt-date-root].is-open").forEach(root => window.BNTUI.positionDatePicker(root));
  document.querySelectorAll("[data-time-input].is-open").forEach(root => window.BNTUI.positionTimeField(root));
});

document.addEventListener("scroll", () => {
  document.querySelectorAll("[data-filter-summary-group].is-open").forEach(root => window.BNTUI.positionFilterSummaryMenu(root));
  requestAnimationFrame(() => window.BNTUI.positionOpenFormInputMenus());
  document.querySelectorAll("[data-bnt-date-root].is-open").forEach(root => window.BNTUI.positionDatePicker(root));
  document.querySelectorAll("[data-time-input].is-open").forEach(root => window.BNTUI.positionTimeField(root));
}, true);

document.addEventListener("focusin", event => {
  window.BNTUI.closeFilterSummaryMenus(event.target.closest("[data-filter-summary-group]"));
  window.BNTUI.closeDropdowns(event.target.closest("[data-ui-dropdown]"));
  window.BNTUI.closeDatePickers("bnt", event.target.closest("[data-bnt-date-root]"));
  window.BNTUI.closeSingleFormInputs(document, event.target.closest('[data-form-input-mode="single"]'));
  window.BNTUI.closeTimeFields(document, event.target.closest("[data-time-input]"));
});

document.addEventListener("keydown", event => {
  const ui = window.BNTUI;
  const summaryGroup = event.target.closest("[data-filter-summary-group]");
  if (event.key === "Escape" && summaryGroup?.classList.contains("is-open")) {
    event.preventDefault(); event.stopImmediatePropagation(); ui.setFilterSummaryOpen(summaryGroup, false, {focus: true}); return;
  }
  const dropdown = event.target.closest("[data-ui-dropdown]");
  if (dropdown && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const wasOpen = dropdown.classList.contains("is-open");
    ui.setDropdownOpen(dropdown, true, {focus: !wasOpen});
    if (!wasOpen) return;
    const options = [...dropdown.querySelectorAll("[data-ui-dropdown-option]")].filter(item => !item.disabled && !item.hidden);
    const index = options.indexOf(event.target.closest("[data-ui-dropdown-option]"));
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowUp" ? -1 : 1) + options.length) % options.length;
    options[next]?.focus();
    return;
  }
  const root = event.target.closest('[data-form-input-mode="single"]');
  const control = root && event.target.closest(".form-input__control");
  if (control && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    ui.setSingleFormInputOpen(root, true, {focus: true, edge: event.key === "ArrowUp" ? "last" : "selected"});
    return;
  }
  const option = root && event.target.closest("[data-form-input-option]");
  if (option && ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") {
      ui.selectSingleFormInput(option);
      return;
    }
    const options = Array.from(root.querySelectorAll("[data-form-input-option]")).filter(item => !item.hidden && !item.disabled);
    const index = options.indexOf(option);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowUp" ? -1 : 1) + options.length) % options.length;
    options[next]?.focus();
    return;
  }
  const timeRoot = event.target.closest("[data-time-input]");
  if (timeRoot && event.key === "Enter" && event.target.closest("[data-time-input-part]")) {
    event.preventDefault();
    ui.applyTimeField(timeRoot);
    return;
  }
  if (event.key !== "Escape") return;
  const openDropdown = document.querySelector("[data-ui-dropdown].is-open");
  const openDate = document.querySelector("[data-bnt-date-root].is-open");
  if (openDropdown || openDate) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (openDropdown) ui.setDropdownOpen(openDropdown, false, {focus: true});
    if (openDate) { ui.closeDatePickers(); openDate.querySelector("[data-bnt-date-toggle]")?.focus(); }
    return;
  }
  const open = document.querySelector('[data-form-input-mode="single"].is-open, [data-time-input].is-open');
  if (!open) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (open.dataset.formInputMode === "single") ui.setSingleFormInputOpen(open, false, {focus: true});
  else ui.setTimeFieldOpen(open, false, {focus: true});
});

document.addEventListener("pointerover", event => {
  const point = event.target.closest(".financial-chart__point");
  const chart = point?.closest(".financial-chart__line-chart");
  if (!point || !chart) return;
  window.BNTUI.showFinancialLineChartTooltip(chart, point, event.clientX, event.clientY);
});

document.addEventListener("pointermove", event => {
  const point = event.target.closest(".financial-chart__point");
  const chart = point?.closest(".financial-chart__line-chart");
  const tooltip = chart?.parentElement?.querySelector(".financial-chart__tooltip");
  if (!point || !chart || !tooltip || tooltip.hidden) return;
  window.BNTUI.positionFinancialLineChartTooltip(chart, tooltip, event.clientX, event.clientY);
});

document.addEventListener("pointerout", event => {
  const point = event.target.closest(".financial-chart__point");
  const chart = point?.closest(".financial-chart__line-chart");
  if (!point || !chart || point.contains(event.relatedTarget)) return;
  window.BNTUI.hideFinancialLineChartTooltip(chart);
});

document.addEventListener("focusin", event => {
  const point = event.target.closest(".financial-chart__point");
  const chart = point?.closest(".financial-chart__line-chart");
  if (!point || !chart) return;
  const rect = point.getBoundingClientRect();
  window.BNTUI.showFinancialLineChartTooltip(chart, point, rect.left + rect.width / 2, rect.top + rect.height / 2);
});

document.addEventListener("input", event => {
  window.BNTUI.touchFormInput(event.target.closest(".form-input__control--text"));
});

document.addEventListener("focusout", event => {
  window.BNTUI.touchFormInput(event.target.closest(".form-input__control, .equipment-date-display"));

  const point = event.target.closest(".financial-chart__point");
  const chart = point?.closest(".financial-chart__line-chart");
  if (chart) window.BNTUI.hideFinancialLineChartTooltip(chart);
});

document.addEventListener("click", event => {
  const ui = window.BNTUI;
  const info = event.target.closest("[data-drawer-info]");
  if (info) {
    ui.showInfoPopover(info, {title: info.dataset.drawerInfoTitle, message: info.dataset.drawerInfo});
    return;
  }
  const popover = ui?.infoPopoverElement;
  if (!popover || popover.hidden) return;
  if (popover.contains(event.target) || ui.infoPopoverTrigger?.contains(event.target)) return;
  ui.closeInfoPopover();
});

window.addEventListener("resize", () => window.BNTUI?.positionInfoPopover());
window.addEventListener("scroll", () => window.BNTUI?.positionInfoPopover(), true);

document.addEventListener("keydown", event => {
  const numberStepper = event.target.closest("[data-form-input-number-stepper]");
  if (numberStepper && ["ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    window.BNTUI.stepFormInputNumber(numberStepper, event.key === "ArrowDown" ? -1 : 1);
    return;
  }

  if (event.key !== "Escape") return;
  if (window.BNTUI?.infoPopoverElement && !window.BNTUI.infoPopoverElement.hidden) {
    window.BNTUI.closeInfoPopover();
    event.stopImmediatePropagation();
    return;
  }
  const openSpeedDial = document.querySelector('[data-speed-dial-secondary] .speed-dial-secondary__trigger[aria-expanded="true"]');
  if (!openSpeedDial) return;
  window.BNTUI.closeSpeedDials();
  event.stopImmediatePropagation();
});

