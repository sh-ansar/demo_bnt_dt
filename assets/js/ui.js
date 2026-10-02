window.BNTUI = {
  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char]));
  },
  attrs(attributes = {}) {
    return Object.entries(attributes).map(([name, value]) => {
      if (value === false || value == null) return "";
      if (value === true) return ` ${name}`;
      return ` ${name}="${this.escape(value)}"`;
    }).join("");
  },
  badge(label, tone = "") {
    return `<span class="badge ${tone}">${this.escape(label)}</span>`;
  },
  progress(value, tone = "") {
    const safe = Math.max(0, Math.min(100, Number(value) || 0));
    const toneClass = tone ? ` ${this.escape(tone)}` : "";
    return `<div class="progress scenario-range__track${toneClass}" style="--scenario-progress:${safe}%" aria-hidden="true"><span class="scenario-range__line"></span></div>`;
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
      chevron: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',
      plus: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4.375V15.625M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>',
      minus: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>',
      check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',
      close: '<svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>',
      search: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>',
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
  renderFormInput({name, label, options = [], allValue = "Всё", emptyMessage = "Ничего не выбрано"} = {}) {
    const safeName = this.escape(name);
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
  renderDateField({name, label, prefix = "bnt", value = ""} = {}) {
    const safeName = this.escape(name);
    const safeValue = this.escape(value);
    const dataPrefix = this.escape(prefix);
    return `<div class="equipment-date-field" data-${dataPrefix}-date-root="${safeName}">
      <span class="typography-label-smallest">${this.escape(label)}</span>
      <span class="equipment-date-input">
        <button class="equipment-date-display typography-body-smallest" type="button" data-${dataPrefix}-date-toggle aria-haspopup="dialog" aria-expanded="false">
          <span data-${dataPrefix}-date-text>дд.мм.гггг</span>
          ${this.icon("calendar")}
        </button>
        <input type="hidden" data-${dataPrefix}-date="${safeName}" value="${safeValue}">
        <span class="equipment-date-popover" data-${dataPrefix}-date-popover hidden></span>
      </span>
    </div>`;
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
  toggleMultiSelectValue(set, value, {allValue = "Всё"} = {}) {
    if (!(set instanceof Set)) return;
    if (value === allValue) {
      set.clear();
      set.add(allValue);
      return;
    }
    if (set.has(allValue)) set.clear();
    if (set.has(value)) set.delete(value);
    else set.add(value);
    if (!set.size) set.add(allValue);
  },
  removeMultiSelectValue(set, value, {allValue = "Всё"} = {}) {
    if (!(set instanceof Set) || set.has(allValue)) return;
    set.delete(value);
    if (!set.size) set.add(allValue);
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
  speedDialSecondary({label = "Ещё", ariaLabel = "Ещё действия", items = [], className = "", rootAttributes = {}, triggerAttributes = {}, menuAttributes = {}} = {}) {
    if (!items.length) return "";
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.6501 12H4.6606M12.0001 12H12.0106M19.3501 12H19.3606M5.7001 12C5.7001 12.5799 5.23 13.05 4.6501 13.05C4.0702 13.05 3.6001 12.5799 3.6001 12C3.6001 11.4201 4.0702 10.95 4.6501 10.95C5.23 10.95 5.7001 11.4201 5.7001 12ZM13.0501 12C13.0501 12.5799 12.58 13.05 12.0001 13.05C11.4202 13.05 10.9501 12.5799 10.9501 12C10.9501 11.4201 11.4202 10.95 12.0001 10.95C12.58 10.95 13.0501 11.4201 13.0501 12ZM20.4001 12C20.4001 12.5799 19.93 13.05 19.3501 13.05C18.7702 13.05 18.3001 12.5799 18.3001 12C18.3001 11.4201 18.7702 10.95 19.3501 10.95C19.93 10.95 20.4001 11.4201 20.4001 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
    const links = items.map(item => {
      const itemIcon = item.icon ? `<span class="speed-dial-secondary__item-icon" aria-hidden="true">${item.icon}</span>` : "";
      const tag = item.href ? "a" : "button";
      const attributes = item.href
        ? {class: "speed-dial-secondary__link typography-body-smallest", href: item.href, role: "menuitem", ...(item.attributes || {})}
        : {class: "speed-dial-secondary__link typography-body-smallest", type: item.type || "button", role: "menuitem", ...(item.attributes || {})};
      return `<${tag}${this.attrs(attributes)}>${itemIcon}<span class="speed-dial-secondary__link-text">${this.escape(item.label)}</span></${tag}>`;
    }).join("");
    const rootClass = ["speed-dial-secondary", className].filter(Boolean).join(" ");
    const rootAttrs = this.attrs({class: rootClass, "data-speed-dial-secondary": true, ...rootAttributes});
    const triggerAttrs = this.attrs({class: "speed-dial-secondary__trigger button-smallest-secondary-radius", type: "button", "aria-haspopup": "menu", "aria-expanded": "false", "aria-label": ariaLabel, ...triggerAttributes});
    const menuAttrs = this.attrs({class: "speed-dial-secondary__menu", role: "menu", hidden: true, ...menuAttributes});
    return `<div${rootAttrs}><button${triggerAttrs}><span class="speed-dial-secondary__icon">${icon}</span><span class="speed-dial-secondary__label typography-indicator-small">${this.escape(label)}</span></button><div${menuAttrs}>${links}</div></div>`;
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
    const filters = [
      ["primary", "#0697e0"],
      ["secondary", "#20b9ee"],
      ["positive", "#12a131"],
      ["warning", "#e5a500"],
      ["negative", "#d01717"],
      ["purple", "#705ac8"]
    ];

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
  renderFinancialLineChart(chart, {
    categories = [],
    series = [],
    legend = null,
    max = 0,
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
    const plotRight = chartWidth - chartMargin.right;
    const plotBottom = height - chartMargin.bottom;
    const plotWidth = plotRight - chartMargin.left;
    const plotHeight = plotBottom - chartMargin.top;
    const maxValue = Math.max(
      Number(max) || 0,
      ...series.flatMap(seriesItem => Array.isArray(seriesItem.values) ? seriesItem.values : []),
      1
    );
    const groupWidth = plotWidth / Math.max(1, categories.length);
    const xCenterFor = index => chartMargin.left + groupWidth * index + groupWidth / 2;
    const yFor = value => plotBottom - value / maxValue * plotHeight;
    const filterPrefix = (
      chart.dataset.financialLineChartUid ||
      chart.dataset.analyticsLineChart ||
      `financial-line-${Math.random().toString(36).slice(2)}`
    ).replace(/[^a-z0-9_-]/gi, "-");
    chart.dataset.financialLineChartUid = filterPrefix;
    const svg = [this.financialLineChartFilterDefs(filterPrefix)];

    Array.from({length: tickCount}).forEach((_, index) => {
      const value = maxValue / Math.max(1, tickCount - 1) * index;
      const y = yFor(value);
      const tickX = chartMargin.left > 0 ? chartMargin.left - 10 : 8;
      const tickAnchor = chartMargin.left > 0 ? "end" : "start";

      svg.push(`<line class="financial-chart__grid-line" x1="${chartMargin.left}" y1="${y.toFixed(1)}" x2="${plotRight}" y2="${y.toFixed(1)}"/>`);
      svg.push(`<text class="financial-chart__tick" x="${tickX}" y="${y.toFixed(1)}" text-anchor="${tickAnchor}" dominant-baseline="middle">${this.escape(formatTick(value))}</text>`);
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

    svg.push(`<line class="financial-chart__axis-line" x1="${chartMargin.left}" y1="${plotBottom}" x2="${plotRight}" y2="${plotBottom}"/>`);

    series.forEach(seriesItem => {
      const tone = String(seriesItem.className || "primary").replace(/[^a-z0-9_-]/gi, "") || "primary";
      const points = (seriesItem.values || []).map((value, index) => ({
        x: xCenterFor(index),
        y: yFor(value),
        value
      }));
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

      points.forEach((point, index) => {
        const label = makePointLabel({
          category: categories[index],
          seriesItem,
          value: point.value
        });
        const formattedValue = label.includes(":") ? label.slice(label.lastIndexOf(":") + 1).trim() : String(point.value);

        svg.push(`<circle class="financial-chart__point financial-chart__point--${tone}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" tabindex="0" role="img" aria-label="${this.escape(label)}" data-category="${this.escape(categories[index])}" data-series-label="${this.escape(seriesItem.label)}" data-formatted-value="${this.escape(formattedValue)}"></circle>`);
      });
    });

    chart.innerHTML = svg.join("");
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
  stepFormInputNumber(stepper, direction = 1) {
    const field = stepper?.closest(".form-input__text-field");
    const input = field?.querySelector('input[type="number"].form-input__control--text');
    if (!input) return;

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
    input.classList.add("is-touched");
    input.closest(".form-input")?.classList.add("is-touched");
    if (input.value !== previous) {
      input.dispatchEvent(new Event("input", {bubbles: true}));
      input.dispatchEvent(new Event("change", {bubbles: true}));
    }
  },
  stepFormInputNumberFromPointer(stepper, event) {
    const rect = stepper?.getBoundingClientRect?.();
    const hasPointer = rect && Number.isFinite(event?.clientY) && event.clientY > 0;
    const direction = hasPointer && event.clientY > rect.top + rect.height / 2 ? -1 : 1;
    this.stepFormInputNumber(stepper, direction);
  }
};

document.addEventListener("click", event => {
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
  requestAnimationFrame(() => window.BNTUI.positionOpenFormInputMenus());
});

document.addEventListener("scroll", () => {
  requestAnimationFrame(() => window.BNTUI.positionOpenFormInputMenus());
}, true);

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

document.addEventListener("focusout", event => {
  const textControl = event.target.closest(".form-input__control--text");
  if (textControl) {
    textControl.classList.add("is-touched");
    textControl.closest(".form-input")?.classList.add("is-touched");
  }

  const point = event.target.closest(".financial-chart__point");
  const chart = point?.closest(".financial-chart__line-chart");
  if (chart) window.BNTUI.hideFinancialLineChartTooltip(chart);
});

document.addEventListener("click", event => {
  const ui = window.BNTUI;
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

