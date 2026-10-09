(function () {
  const baseAssets = window.BNT_DATA.assets || [];
  const hierarchySource = window.BNT_DATA.assetsHierarchy || [];
  const ui = window.BNTUI;
  const allValue = "Всё";
  const emptyValue = "Ничего";
  const emptyFormInputMessage = "Ничего не выбрано";
  const currentYear = new Date().getFullYear();
  const ageOptions = [allValue, "До 5 лет", "5–8 лет", "Более 8 лет"];
  const searchScopes = [
    ["all", "Всё"],
    ["name", "Наименование"],
    ["number", "Номер"],
    ["type", "Тип"],
    ["location", "Локация"]
  ];
  const filterSummaryLabels = {
    search: "Поиск",
    location: "Локация",
    type: "Тип",
    status: "Статус",
    age: "Возраст",
    last: "Последнее ТО",
    next: "Следующее ТО"
  };

  const infoButton = document.querySelector("[data-equipment-info]");
  const filterToggle = document.querySelector("[data-asset-filter-toggle]");
  const exportButton = document.getElementById("export-assets");
  const filterSummary = document.getElementById("equipment-filter-summary");
  const filterSummaryList = filterSummary?.querySelector("[data-equipment-filter-summary-list]");
  const filterSummaryActions = filterSummary?.querySelector("[data-equipment-filter-summary-actions]");

  const escape = value => ui.escape(value);
  const emptyCell = '<span class="data-table__tree-caption">—</span>';
  const baseByInternal = new Map(baseAssets.map(item => [item.internal, item]));
  const baseByCode = new Map(baseAssets.map(item => [item.code, item]));

  function shortName(value) {
    return String(value || "").trim().replace(/\s*\([^)]*\)\s*$/, "");
  }

  function hierarchyStatusTone(status) {
    if (status === "Высокий риск") return "red";
    if (status === "Наблюдение") return "orange";
    if (status === "Онлайн") return "purple";
    if (status === "Работает") return "green";
    return "";
  }

  function normalizeHierarchyRows(sourceRows) {
    const rows = sourceRows.map((source, index) => {
      const base = baseByInternal.get(source.internal) || baseByCode.get(shortName(source.name).split(" ").pop());
      const status = String(source.status || "").trim();
      return {
        id: base?.id || `asset-hierarchy-${index}`,
        detailId: base?.id || "",
        name: String(source.name || "").trim(),
        model: base?.model || "",
        category: base?.category || "",
        type: String(source.type || "").trim(),
        parent: String(source.parent || "").trim(),
        location: source.parent && source.parent !== "—" ? String(source.parent).trim() : String(source.object || "").trim(),
        productionObject: String(source.object || "").trim(),
        internal: String(source.internal || "").trim(),
        age: source.age,
        year: source.age || source.age === 0 ? currentYear - Number(source.age) : null,
        load: source.load,
        wear: source.wear,
        lastService: source.lastService || "",
        nextService: source.nextService || "",
        status,
        tone: hierarchyStatusTone(status),
        image: base?.image || "",
        children: []
      };
    });
    const byName = new Map();
    rows.forEach(row => {
      [row.name, shortName(row.name)].forEach(name => {
        if (name && !byName.has(name)) byName.set(name, row);
      });
    });
    rows.forEach(row => {
      const parent = row.parent && row.parent !== "—"
        ? byName.get(row.parent) || byName.get(shortName(row.parent))
        : null;
      if (parent && parent !== row) parent.children.push(row);
    });
    return rows;
  }

  const assets = normalizeHierarchyRows(hierarchySource);
  const rootAssets = assets.filter(item => {
    if (!item.parent || item.parent === "—") return true;
    return !assets.some(candidate => candidate.children.includes(item));
  });
  const parentById = new Map();
  assets.forEach(item => item.children.forEach(child => parentById.set(child.id, item)));
  const expandedRows = new Set(assets.filter(item => item.children.length).map(item => item.id));
  const unique = key => [allValue, ...new Set(assets.map(item => item[key]).filter(Boolean))];
  const cloneSet = set => new Set(set);
  const defaultFilters = () => ({
    search: "",
    searchScope: "all",
    location: new Set([allValue]),
    type: new Set([allValue]),
    status: new Set([allValue]),
    age: new Set([allValue]),
    last: "",
    next: ""
  });
  const cloneFilters = source => ({
    search: source.search,
    searchScope: source.searchScope,
    location: cloneSet(source.location),
    type: cloneSet(source.type),
    status: cloneSet(source.status),
    age: cloneSet(source.age),
    last: source.last,
    next: source.next
  });

  let filters = defaultFilters();
  let draftFilters = cloneFilters(filters);
  let filterModal;
  let columnFilterPopover;
  let activeColumnFilterKey = null;
  let activeColumnFilterAnchor = null;
  let columnFilterOptionQuery = "";
  let tableGeometryFrame = 0;
  let lastFocusedElement;
  let explicitAllFormInputs = new Set();
  let assetSort = {
    key: null,
    direction: "default"
  };
  const textCollator = new Intl.Collator("ru-RU", {numeric: true, sensitivity: "base"});

  // Shared plus/minus: New active / ui-zoom__button.
  const sharedPlusIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4.375V15.625M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  const sharedMinusIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';

  const icons = {
    chevron: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',
    plus: sharedPlusIcon,
    minus: sharedMinusIcon,
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',
    close: '<svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.70831 4.04199C2.2941 4.04199 1.95831 4.37778 1.95831 4.79199C1.95831 5.20621 2.2941 5.54199 2.70831 5.54199V4.79199V4.04199ZM17.2916 5.54199C17.7059 5.54199 18.0416 5.20621 18.0416 4.79199C18.0416 4.37778 17.7059 4.04199 17.2916 4.04199V4.79199V5.54199ZM9.29165 8.12533C9.29165 7.71111 8.95586 7.37533 8.54165 7.37533C8.12743 7.37533 7.79165 7.71111 7.79165 8.12533H8.54165H9.29165ZM7.79165 14.3753C7.79165 14.7895 8.12743 15.1253 8.54165 15.1253C8.95586 15.1253 9.29165 14.7895 9.29165 14.3753H8.54165H7.79165ZM12.2083 8.12533C12.2083 7.71111 11.8725 7.37533 11.4583 7.37533C11.0441 7.37533 10.7083 7.71111 10.7083 8.12533H11.4583H12.2083ZM10.7083 14.3753C10.7083 14.7895 11.0441 15.1253 11.4583 15.1253C11.8725 15.1253 12.2083 14.7895 12.2083 14.3753H11.4583H10.7083ZM4.91316 4.71975C4.87326 4.30747 4.5067 4.00558 4.09441 4.04548C3.68212 4.08538 3.38024 4.45194 3.42013 4.86423L4.16665 4.79199L4.91316 4.71975ZM5.27081 16.2024L6.01734 16.1303L6.01733 16.1302L5.27081 16.2024ZM14.7287 16.2024L13.9822 16.1301L13.9822 16.1303L14.7287 16.2024ZM16.5798 4.86426C16.6197 4.45197 16.3179 4.08539 15.9056 4.04548C15.4933 4.00557 15.1267 4.30744 15.0868 4.71973L15.8333 4.79199L16.5798 4.86426ZM12.2916 4.79199H13.0416V4.58366H12.2916H11.5416V4.79199H12.2916ZM12.2916 4.58366H13.0416C13.0416 2.90361 11.68 1.54199 9.99998 1.54199V2.29199V3.04199C10.8516 3.04199 11.5416 3.73204 11.5416 4.58366H12.2916ZM9.99998 2.29199V1.54199C8.31993 1.54199 6.95831 2.90361 6.95831 4.58366H7.70831H8.45831C8.45831 3.73204 9.14836 3.04199 9.99998 3.04199V2.29199ZM7.70831 4.58366H6.95831V4.79199H7.70831H8.45831V4.58366H7.70831ZM2.70831 4.79199V5.54199H17.2916V4.79199V4.04199H2.70831V4.79199ZM8.54165 8.12533H7.79165V14.3753H8.54165H9.29165V8.12533H8.54165ZM11.4583 8.12533H10.7083V14.3753H11.4583H12.2083V8.12533H11.4583ZM4.16665 4.79199L3.42013 4.86423L4.5243 16.2746L5.27081 16.2024L6.01733 16.1302L4.91316 4.71975L4.16665 4.79199ZM5.27081 16.2024L4.52429 16.2745C4.64393 17.5132 5.68543 18.4587 6.92956 18.4587V17.7087V16.9587C6.45786 16.9587 6.0627 16.5999 6.01734 16.1303L5.27081 16.2024ZM6.92956 17.7087V18.4587H13.07V17.7087V16.9587H6.92956V17.7087ZM13.07 17.7087V18.4587C14.3145 18.4587 15.3556 17.5137 15.4753 16.2745L14.7287 16.2024L13.9822 16.1303C13.9368 16.6003 13.5421 16.9587 13.07 16.9587V17.7087ZM14.7287 16.2024L15.4752 16.2747L16.5798 4.86426L15.8333 4.79199L15.0868 4.71973L13.9822 16.1301L14.7287 16.2024Z" fill="currentColor"/></svg>',
    search: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><use href="/assets/icons/bnt-sprite.svg?v=3#search"></use></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8.33346 11.0828C8.33346 11.2669 8.18422 11.4161 8.00013 11.4161C7.81603 11.4161 7.66679 11.2669 7.66679 11.0828C7.66679 10.8987 7.81603 10.7495 8.00013 10.7495C8.18422 10.7495 8.33346 10.8987 8.33346 11.0828Z" fill="currentColor"/><path d="M8.00013 5.83358V9.16691M7.12113 2.68524L1.96079 12.0072C1.58979 12.6776 2.07413 13.5002 2.83979 13.5002H13.1608C13.9265 13.5002 14.4108 12.6776 14.0398 12.0072L8.87913 2.68524C8.49646 1.99424 7.50379 1.99424 7.12113 2.68524ZM8.33346 11.0828C8.33346 11.2669 8.18422 11.4161 8.00013 11.4161C7.81603 11.4161 7.66679 11.2669 7.66679 11.0828C7.66679 10.8987 7.81603 10.7495 8.00013 10.7495C8.18422 10.7495 8.33346 10.8987 8.33346 11.0828Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };

  const formatDisplayDate = value => ui.formatDate(value);

  function getDateRoot(name) {
    return filterModal?.querySelector(`[data-bnt-date-root="equipment-${name}"]`);
  }

  function selectedValues(set) {
    return set.has(allValue) ? [allValue] : [...set];
  }

  function formInputText(set) {
    const values = selectedValues(set);
    if (!values.length) return emptyFormInputMessage;
    if (set.has(allValue)) return allValue;
    return values.join(", ");
  }

  function formInputTag(value, className = "", isMeasured = true) {
    const safeValue = escape(value);
    const tagClass = `form-input__tag pill pill--default pill--radius typography-body-smallest${className ? ` ${className}` : ""}`;
    const measuredAttrs = isMeasured ? ` data-form-input-tag-item data-form-input-tag-value="${safeValue}"` : "";
    return `<span class="${tagClass}" data-form-input-tag="${safeValue}"${measuredAttrs}><span class="pill__title">${safeValue}</span><button class="form-input__tag-remove" type="button" data-form-input-tag-remove="${safeValue}" aria-label="Убрать ${safeValue}">${icons.close}</button></span>`;
  }

  function formInputValue(set) {
    const values = selectedValues(set);
    if (!values.length) return `<span class="form-input__empty typography-body-smallest">${escape(emptyValue)}</span>`;
    if (set.has(allValue)) return `<span class="form-input__all typography-body-smallest">${escape(allValue)}</span>`;
    const tags = values.map(value => formInputTag(value)).join("");
    const counter = values.length > 1 ? `<span class="form-input__tag-more" data-form-input-tag-more hidden><button class="form-input__tag-count pill pill--default pill--radius typography-body-smallest" type="button" data-form-input-hidden-toggle aria-expanded="false"><span class="form-input__tag-count-icon" aria-hidden="true">${icons.plus}</span><span class="form-input__tag-count-value" data-form-input-hidden-count>${values.length - 1}</span><span class="form-input__tag-count-chevron nav-chevron" aria-hidden="true">${icons.chevron}</span></button><span class="form-input__tag-rollover" data-form-input-hidden-menu role="menu" hidden></span></span>` : "";
    return `${tags}${counter}`;
  }

  function measureFormInputTag(tag) {
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
  }

  function closeFormInputHiddenMenus(except = null) {
    filterModal?.querySelectorAll(".form-input__tag-more.is-open").forEach(root => {
      if (root === except) return;
      root.classList.remove("is-open");
      root.closest(".form-input")?.classList.remove("has-tag-rollover");
      const toggle = root.querySelector("[data-form-input-hidden-toggle]");
      const menu = root.querySelector("[data-form-input-hidden-menu]");
      toggle?.setAttribute("aria-expanded", "false");
      if (menu) menu.hidden = true;
    });
  }

  function syncFormInputOverflow(root) {
    const valueRoot = root.querySelector("[data-form-input-value]");
    root.classList.remove("has-tag-rollover");
    if (!valueRoot) return;
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
    const tagWidths = tags.map(measureFormInputTag);
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
      const hiddenCount = tags.length - count;
      if (countNode) countNode.textContent = String(hiddenCount);
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
      menu.innerHTML = hiddenValues.map(value => formInputTag(value, "form-input__tag--rollover", false)).join("");
      menu.hidden = true;
    }
    more.hidden = false;
  }

  function syncAllFormInputOverflow() {
    filterModal?.querySelectorAll(".form-input").forEach(syncFormInputOverflow);
  }

  function syncFormInputSearch(root) {
    const search = root.querySelector("[data-form-input-search]");
    const clear = root.querySelector("[data-form-input-search-clear]");
    if (!search || !clear) return;
    clear.hidden = !search.value;
  }

  function filterFormInputOptions(root) {
    const search = root.querySelector("[data-form-input-search]");
    const query = search ? search.value.trim().toLowerCase() : "";
    root.querySelectorAll("[data-form-input-option]").forEach(option => {
      const label = option.querySelector(".form-input__option-label")?.textContent || option.textContent;
      option.hidden = Boolean(query) && !label.toLowerCase().includes(query);
    });
    syncFormInputSearch(root);
  }

  function columnFilterConfig(key) {
    if (key === "name") {
      return {
        key,
        type: "search",
        label: "Наименование",
        searchScope: "name"
      };
    }
    if (key === "type") {
      return {
        key,
        type: "multi",
        label: "Тип",
        filterKey: "type",
        options: unique("type")
      };
    }
    if (key === "location") {
      return {
        key,
        type: "multi",
        label: "Локация",
        filterKey: "location",
        options: unique("location")
      };
    }
    return null;
  }

  function columnFilterSearchValue(config) {
    return filters.searchScope === config.searchScope ? filters.search : "";
  }

  function createColumnFilterPopover() {
    const popover = document.createElement("section");
    popover.id = "equipment-column-filter-popover";
    popover.className = "column-filter-popover";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "Фильтр колонки");
    popover.setAttribute("data-column-filter-popover", "");
    popover.hidden = true;
    document.body.appendChild(popover);
    return popover;
  }

  function columnFilterSearchMarkup(config) {
    const value = columnFilterSearchValue(config);
    return `<form class="column-filter-popover__menu" data-column-filter-search-form>
      <label class="column-filter-popover__search form-input__search">
        <span aria-hidden="true">${icons.search}</span>
        <input class="typography-body-smallest" type="text" placeholder="Поиск" value="${escape(value)}" data-column-filter-search-input autocomplete="off">
        <button class="form-input__search-clear" type="button" data-column-filter-clear aria-label="Сбросить ${escape(config.label)}">${icons.close}</button>
      </label>
    </form>`;
  }

  function columnFilterOptionsMarkup(config, query = "") {
    const set = filters[config.filterKey];
    const normalizedQuery = query.trim().toLowerCase();
    const isAll = set.has(allValue);
    const isPartial = !isAll && set.size > 0;
    return config.options.map(option => {
      const isAllOption = option === allValue;
      const active = isAll || (!isAllOption && set.has(option));
      const indeterminate = isAllOption && isPartial;
      const hidden = normalizedQuery && !option.toLowerCase().includes(normalizedQuery) ? " hidden" : "";
      return `<button class="form-input__option typography-body-smallest${active ? " is-selected" : ""}${indeterminate ? " is-indeterminate" : ""}" type="button" role="option" data-column-filter-option="${escape(option)}" aria-selected="${active}" aria-checked="${indeterminate ? "mixed" : String(active)}"${hidden}>
        <span class="form-input__checkbox" aria-hidden="true">${indeterminate ? icons.minus : icons.check}</span>
        <span class="form-input__option-label">${escape(option)}</span>
      </button>`;
    }).join("");
  }

  function columnFilterMultiMarkup(config, query = "") {
    return `<div class="column-filter-popover__menu">
        <label class="column-filter-popover__search form-input__search">
          <span aria-hidden="true">${icons.search}</span>
          <input class="typography-body-smallest" type="text" placeholder="Поиск" value="${escape(query)}" data-column-filter-option-search autocomplete="off">
          <button class="form-input__search-clear" type="button" data-column-filter-clear aria-label="Сбросить ${escape(config.label)}">${icons.close}</button>
        </label>
        <span class="column-filter-popover__divider form-input__divider" aria-hidden="true"></span>
        <div class="column-filter-popover__options form-input__options ui-scrollbar" data-column-filter-options>
          ${columnFilterOptionsMarkup(config, query)}
        </div>
      </div>`;
  }

  function renderColumnFilterPopover(query = columnFilterOptionQuery) {
    if (!columnFilterPopover || !activeColumnFilterKey) return;
    const config = columnFilterConfig(activeColumnFilterKey);
    if (!config) return;
    columnFilterPopover.dataset.columnFilterType = config.type;
    columnFilterPopover.setAttribute("aria-label", `Фильтр: ${config.label}`);
    columnFilterPopover.innerHTML = config.type === "search"
      ? columnFilterSearchMarkup(config)
      : columnFilterMultiMarkup(config, query);
  }

  function positionColumnFilterPopover() {
    if (!columnFilterPopover || columnFilterPopover.hidden || !activeColumnFilterAnchor) return;
    const margin = 12;
    const gap = 4;
    const anchorRect = activeColumnFilterAnchor.getBoundingClientRect();
    const columnRect = activeColumnFilterAnchor.closest("th")?.getBoundingClientRect() || anchorRect;
    const width = columnFilterPopover.offsetWidth || 360;
    const height = columnFilterPopover.offsetHeight || 120;
    const left = Math.min(Math.max(columnRect.left, margin), Math.max(margin, window.innerWidth - width - margin));
    const bottomTop = anchorRect.bottom + gap;
    const topTop = anchorRect.top - height - gap;
    const useTop = bottomTop + height > window.innerHeight - margin && topTop >= margin;
    columnFilterPopover.dataset.placement = useTop ? "top" : "bottom";
    columnFilterPopover.style.left = `${Math.round(left)}px`;
    columnFilterPopover.style.top = `${Math.round(Math.max(margin, useTop ? topTop : bottomTop))}px`;
  }

  function openColumnFilterPopover(key, anchor) {
    const config = columnFilterConfig(key);
    if (!config) {
      openModal(key || "all");
      return;
    }
    if (!columnFilterPopover) columnFilterPopover = createColumnFilterPopover();
    if (!columnFilterPopover.hidden && activeColumnFilterKey === key && activeColumnFilterAnchor === anchor) {
      closeColumnFilterPopover();
      return;
    }
    closeFilterSummaryMenus();
    activeColumnFilterKey = key;
    activeColumnFilterAnchor = anchor;
    columnFilterOptionQuery = "";
    renderColumnFilterPopover();
    columnFilterPopover.hidden = false;
    document.querySelectorAll("[data-equipment-column-search]").forEach(button => {
      button.setAttribute("aria-expanded", String(button === anchor));
    });
    requestAnimationFrame(() => {
      if (!columnFilterPopover || columnFilterPopover.hidden) return;
      positionColumnFilterPopover();
      columnFilterPopover.querySelector("input")?.focus();
    });
  }

  function closeColumnFilterPopover(restoreFocus = false) {
    if (!columnFilterPopover) return;
    const anchor = activeColumnFilterAnchor;
    columnFilterPopover.hidden = true;
    document.querySelectorAll("[data-equipment-column-search]").forEach(button => {
      button.setAttribute("aria-expanded", "false");
    });
    activeColumnFilterKey = null;
    activeColumnFilterAnchor = null;
    columnFilterOptionQuery = "";
    if (restoreFocus) anchor?.focus?.();
  }

  function toggleColumnMultiFilter(key, value) {
    const set = filters[key];
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
  }

  function resetColumnFilterAndClose(config) {
    columnFilterOptionQuery = "";
    if (config.type === "search") {
      filters.search = "";
      filters.searchScope = "all";
    } else {
      filters[config.filterKey] = new Set([allValue]);
    }
    render();
    closeColumnFilterPopover(true);
  }

  function applyColumnSearch(value) {
    const query = value.trim();
    filters.search = query;
    filters.searchScope = query ? "name" : "all";
    render();
    requestAnimationFrame(positionColumnFilterPopover);
  }

  function filterColumnFilterOptions() {
    if (!columnFilterPopover) return;
    const input = columnFilterPopover.querySelector("[data-column-filter-option-search]");
    if (!input) return;
    columnFilterOptionQuery = input.value;
    const query = input.value.trim().toLowerCase();
    columnFilterPopover.querySelectorAll("[data-column-filter-option]").forEach(option => {
      const label = option.querySelector(".form-input__option-label")?.textContent || option.textContent;
      option.hidden = Boolean(query) && !label.toLowerCase().includes(query);
    });
    requestAnimationFrame(positionColumnFilterPopover);
  }

  function handleColumnFilterPopoverClick(event) {
    if (!event.target.closest("[data-column-filter-popover]")) return false;
    const config = columnFilterConfig(activeColumnFilterKey);
    if (!config) return true;

    const clearFilter = event.target.closest("[data-column-filter-clear]");
    if (clearFilter) {
      event.preventDefault();
      resetColumnFilterAndClose(config);
      return true;
    }

    const option = event.target.closest("[data-column-filter-option]");
    if (option && config.type === "multi") {
      event.preventDefault();
      columnFilterOptionQuery = columnFilterPopover.querySelector("[data-column-filter-option-search]")?.value || "";
      toggleColumnMultiFilter(config.filterKey, option.dataset.columnFilterOption);
      render();
      renderColumnFilterPopover(columnFilterOptionQuery);
      requestAnimationFrame(() => {
        if (!columnFilterPopover || columnFilterPopover.hidden) return;
        positionColumnFilterPopover();
        columnFilterPopover.querySelector("[data-column-filter-option-search]")?.focus();
      });
      return true;
    }

    return true;
  }

  function toggleMultiValue(set, value, name) {
    if (value === allValue) {
      const shouldSelectAll = !set.has(allValue) && !set.size;
      set.clear();
      if (shouldSelectAll) set.add(allValue);
      if (name) {
        if (set.has(allValue)) explicitAllFormInputs.add(name);
        else explicitAllFormInputs.delete(name);
      }
      return;
    }
    if (name) explicitAllFormInputs.delete(name);
    if (set.has(allValue)) set.delete(allValue);
    if (set.has(value)) set.delete(value);
    else set.add(value);
  }

  function removeMultiValue(set, value, name) {
    if (name) explicitAllFormInputs.delete(name);
    if (set.has(allValue)) return;
    set.delete(value);
  }

  function matchesMulti(value, set) {
    return set.has(allValue) || set.has(value);
  }

  function matchesAge(itemAge, set) {
    if (set.has(allValue)) return true;
    if (itemAge === null || itemAge === undefined || itemAge === "") return false;
    return (set.has("До 5 лет") && itemAge < 5)
      || (set.has("5–8 лет") && itemAge >= 5 && itemAge <= 8)
      || (set.has("Более 8 лет") && itemAge > 8);
  }

  const displayDateToISO = value => {
    if (!value) return "";
    const [d, m, y] = value.split(".");
    return `${y}-${m}-${d}`;
  };

  function multiFilterSummaryGroup(key) {
    const set = filters[key];
    if (!set || set.has(allValue)) return null;
    const values = [...set]
      .filter(value => value !== allValue)
      .map(value => ({value, label: value}));
    return {
      key,
      label: filterSummaryLabels[key],
      count: values.length,
      values: values.length ? values : [{value: emptyValue, label: emptyValue}]
    };
  }

  function activeFilterGroups() {
    const groups = [];
    const search = filters.search.trim();
    if (search) {
      const scope = searchScopes.find(([value]) => value === filters.searchScope) || searchScopes[0];
      groups.push({
        key: "search",
        label: filterSummaryLabels.search,
        count: 1,
        values: [{value: search, label: scope[0] === "all" ? search : `${scope[1]}: ${search}`}]
      });
    }
    ["location", "type", "status", "age"].forEach(key => {
      const group = multiFilterSummaryGroup(key);
      if (group) groups.push(group);
    });
    if (filters.last) {
      groups.push({
        key: "last",
        label: filterSummaryLabels.last,
        count: 1,
        values: [{value: filters.last, label: `с ${formatDisplayDate(filters.last)}`}]
      });
    }
    if (filters.next) {
      groups.push({
        key: "next",
        label: filterSummaryLabels.next,
        count: 1,
        values: [{value: filters.next, label: `до ${formatDisplayDate(filters.next)}`}]
      });
    }
    return groups;
  }

  function closeFilterSummaryMenus(except = null) {
    ui.closeFilterSummaryMenus(except, filterSummary);
  }

  function syncAppliedFilters() {
    draftFilters = cloneFilters(filters);
    explicitAllFormInputs = new Set();
    if (filterModal && !filterModal.hidden) syncModal();
    render();
    if (columnFilterPopover && !columnFilterPopover.hidden) {
      renderColumnFilterPopover(columnFilterOptionQuery);
      requestAnimationFrame(positionColumnFilterPopover);
    }
  }

  function resetFilterGroup(key) {
    if (key === "search") {
      filters.search = "";
      filters.searchScope = "all";
    } else if (key === "last" || key === "next") {
      filters[key] = "";
    } else if (filters[key] instanceof Set) {
      filters[key] = new Set([allValue]);
    }
    syncAppliedFilters();
  }

  function removeFilterSummaryValue(key, value) {
    if (key === "search" || key === "last" || key === "next" || value === emptyValue) {
      resetFilterGroup(key);
      return;
    }
    const set = filters[key];
    if (!(set instanceof Set) || set.has(allValue)) return;
    set.delete(value);
    if (!set.size) set.add(allValue);
    syncAppliedFilters();
  }

  function clearActiveFilters() {
    filters = defaultFilters();
    syncAppliedFilters();
  }

  function renderFilterSummary() {
    if (!filterSummary || !filterSummaryList || !filterSummaryActions) return;
    const groups = activeFilterGroups();
    filterSummary.hidden = !groups.length;
    if (!groups.length) {
      filterSummaryList.innerHTML = "";
      filterSummaryActions.innerHTML = "";
      return;
    }
    filterSummaryList.innerHTML = ui.renderFilterSummary(groups, {icons});
    filterSummaryActions.innerHTML = `
      <button class="filter-summary__clear button-smallest-ghost button-smallest-ghost--error typography-button-smallest" type="button" data-equipment-filter-summary-clear aria-label="Сбросить выбранные фильтры">${icons.trash}</button>
      <button class="filter-summary__template-action button-smallest-ghost button-smallest-ghost--2 typography-button-smallest" type="button" data-equipment-filter-template>${icons.plus}<span>Создать шаблон</span></button>`;
  }

  function matchesSearch(item) {
    const q = filters.search.trim().toLowerCase();
    if (!q) return true;
    const haystack = {
      all: `${item.name} ${item.model} ${item.internal} ${item.category} ${item.type} ${item.location} ${item.productionObject}`,
      name: `${item.name} ${item.model}`,
      number: item.internal,
      type: item.type,
      location: item.location
    }[filters.searchScope] || "";
    return haystack.toLowerCase().includes(q);
  }

  function matchesItem(item) {
    return matchesSearch(item)
      && matchesMulti(item.location, filters.location)
      && matchesMulti(item.type, filters.type)
      && matchesMulti(item.status, filters.status)
      && matchesAge(item.age, filters.age)
      && (!filters.last || displayDateToISO(item.lastService) >= filters.last)
      && (!filters.next || displayDateToISO(item.nextService) <= filters.next);
  }

  function selectedAssetTypeSet() {
    if (!(filters.type instanceof Set) || filters.type.has(allValue) || !filters.type.size) return null;
    const flatTypes = new Set(["Оборудование", "Компонент"]);
    return [...filters.type].every(type => flatTypes.has(type)) ? filters.type : null;
  }

  function isFlatTypeOnlyFilter(typeSet) {
    return typeSet?.size === 1;
  }

  function collectVisibleSet() {
    const visible = new Set();
    const visit = item => {
      let childVisible = false;
      item.children.forEach(child => {
        if (visit(child)) childVisible = true;
      });
      const selfVisible = matchesItem(item);
      if (selfVisible || childVisible) visible.add(item);
      return selfVisible || childVisible;
    };
    rootAssets.forEach(visit);
    return visible;
  }

  function sortValue(item, key) {
    const values = {
      location: item.location,
      internal: item.internal,
      age: item.age ?? -1,
      load: item.load,
      wear: item.wear,
      lastService: displayDateToISO(item.lastService),
      nextService: displayDateToISO(item.nextService),
      status: item.status,
      type: item.type
    };
    return values[key] ?? "";
  }

  function sortedRows(rows) {
    if (!assetSort.key || assetSort.direction === "default") return rows;
    const direction = assetSort.direction === "descending" ? -1 : 1;
    return [...rows].sort((left, right) => {
      const leftValue = sortValue(left, assetSort.key);
      const rightValue = sortValue(right, assetSort.key);
      const result = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : textCollator.compare(String(leftValue), String(rightValue));
      return result * direction;
    });
  }

  function visibleTreeRows() {
    const selectedTypeSet = selectedAssetTypeSet();
    if (selectedTypeSet) {
      const selected = new Set(assets.filter(matchesItem));
      const roots = assets.filter(item => selected.has(item) && !selected.has(parentById.get(item.id)));
      const flat = isFlatTypeOnlyFilter(selectedTypeSet);
      const walkSelected = (nodes, level = 0, parentBranches = []) => sortedRows(nodes.filter(item => selected.has(item))).flatMap((item, index, siblings) => {
        const isLast = index === siblings.length - 1;
        const selectedChildren = item.children.filter(child => selected.has(child));
        const hasVisibleChildren = selectedChildren.length > 0;
        const visibleChildren = hasVisibleChildren && expandedRows.has(item.id) ? selectedChildren : [];
        const branches = level > 0
          ? [
              ...parentBranches.map(continues => continues ? "line" : "spacer"),
              isLast && !visibleChildren.length ? "last" : "branch"
            ]
          : [];
        const entry = {item, level, branches, isFlat: flat, hasVisibleChildren};
        const childBranches = level > 0 ? [...parentBranches, !isLast || visibleChildren.length > 0] : [];
        return visibleChildren.length
          ? [entry, ...walkSelected(visibleChildren, level + 1, childBranches)]
          : [entry];
      });
      const rows = walkSelected(roots);
      rows.forEach((entry, index) => {
        const nextLevel = rows[index + 1]?.level ?? 0;
        entry.branches = entry.branches.map((type, branchIndex) => {
          if (type === "spacer") return type;
          return branchIndex + 1 > nextLevel ? "last" : type;
        });
      });
      return rows;
    }

    const visible = collectVisibleSet();
    const walk = (nodes, level = 0, parentBranches = []) => sortedRows(nodes.filter(item => visible.has(item))).flatMap((item, index, siblings) => {
      const isLast = index === siblings.length - 1;
      const childMatches = item.children.filter(child => visible.has(child));
      const hasVisibleChildren = childMatches.length > 0;
      const visibleChildren = hasVisibleChildren && expandedRows.has(item.id) ? childMatches : [];
      const branches = level > 0
        ? [
            ...parentBranches.map(continues => continues ? "line" : "spacer"),
            isLast && !hasVisibleChildren ? "last" : "branch"
          ]
        : [];
      const entry = {item, level, branches, hasVisibleChildren};
      const childBranches = level > 0 ? [...parentBranches, !isLast || hasVisibleChildren] : [];
      return hasVisibleChildren
        ? [entry, ...walk(visibleChildren, level + 1, childBranches)]
        : [entry];
    });
    const rows = walk(rootAssets);
    rows.forEach((entry, index) => {
      const nextLevel = rows[index + 1]?.level ?? 0;
      entry.branches = entry.branches.map((type, branchIndex) => {
        if (type === "spacer") return type;
        return branchIndex + 1 > nextLevel ? "last" : type;
      });
    });
    return rows;
  }

  function filtered() {
    return visibleTreeRows().map(entry => entry.item);
  }

  function updateSortControls() {
    document.querySelectorAll("[data-equipment-sort]").forEach(button => {
      const active = button.dataset.equipmentSort === assetSort.key;
      const direction = active ? assetSort.direction : "default";
      const icon = direction === "descending" ? "SortDescending" : direction === "ascending" ? "SortAscending" : "SortDefault";
      const nextLabel = direction === "descending" ? "от меньшего к большему" : direction === "ascending" ? "по умолчанию" : "от большего к меньшему";
      button.dataset.sortDirection = direction;
      button.setAttribute("aria-label", `Сортировать ${button.dataset.sortLabel} ${nextLabel}`);
      button.closest("th")?.setAttribute("aria-sort", direction === "default" ? "none" : direction);
      button.querySelector("use")?.setAttribute("href", `/assets/icons/financial-interface.svg?v=5#${icon}`);
    });
  }

  const statusTone = item => item.tone || (item.status === "Онлайн" ? "purple" : item.status === "Работает" ? "green" : "");

  function treeChevron() {
    return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  function treeBranch(type) {
    if (type === "spacer") return "";
    if (type === "line") {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="26" viewBox="0 0 16 26" fill="none" aria-hidden="true"><path d="M8 0L8 26" stroke="currentColor" vector-effect="non-scaling-stroke"/></svg>';
    }
    return type === "last"
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="25" viewBox="0 0 16 25" fill="none" aria-hidden="true"><path d="M8 0L8 5C8 9.41828 11.5817 13 16 13" stroke="currentColor" vector-effect="non-scaling-stroke"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="26" viewBox="0 0 16 26" fill="none" aria-hidden="true"><path d="M16 13C11.5817 13 8.00001 9.41829 8.00001 5.00001L8.00001 0L8 26" stroke="currentColor" vector-effect="non-scaling-stroke"/></svg>';
  }

  function treeCell(item, level, branches = [], isFlat = false, hasVisibleChildren = item.children.length > 0) {
    const depth = Math.min(level, 5);
    const hasChildren = hasVisibleChildren && !isFlat;
    const branch = branches.map(type => `<span class="data-table__tree-branch data-table__tree-branch--${escape(type)}" aria-hidden="true">${treeBranch(type)}</span>`).join("");
    const toggle = hasChildren
      ? `<button class="data-table__tree-toggle" type="button" data-equipment-tree-toggle="${escape(item.id)}" aria-expanded="${expandedRows.has(item.id)}" aria-label="${expandedRows.has(item.id) ? "Свернуть" : "Раскрыть"} ${escape(item.name)}">${treeChevron()}</button>`
      : level === 0 && !isFlat
        ? '<span class="data-table__tree-spacer" aria-hidden="true"></span>'
        : "";
    const caption = item.category ? `<small class="data-table__tree-caption">${escape(item.category)}</small>` : "";
    return `<span class="data-table__tree-node data-table__tree-node--depth-${depth}${hasChildren ? " data-table__tree-node--parent" : ""}">
      ${branch}${toggle}
      <span class="data-table__tree-label"><strong class="data-table__tree-title">${escape(item.name)}</strong>${caption}</span>
    </span>`;
  }

  function numericContent(value, unit = "") {
    if (value === null || value === undefined || value === "") return emptyCell;
    const caption = unit ? `<small>${escape(unit)}</small>` : "";
    return `<div class="table-header-content table-header-content--numeric"><strong>${escape(value)}</strong>${caption}</div>`;
  }

  function progressContent(value, tone = "") {
    if (value === null || value === undefined || value === "") return emptyCell;
    return `<div class="table-cell-content table-cell-content--numeric"><strong>${Number(value) || 0}%</strong>${ui.progress(value, tone)}</div>`;
  }

  function passportAction(item) {
    if (!item.detailId) return emptyCell;
    return `<a class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" href="${window.BNTShell.routeHref(`/equipment-detail?id=${encodeURIComponent(item.detailId)}`)}" aria-label="Открыть паспорт ${escape(item.name)}"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=11#StrokeDoc"></use></svg></a>`;
  }

  function syncStickyHeaderScrollOffset() {
    document.querySelectorAll(".table-block--sticky-head").forEach(block => {
      const head = block.querySelector("thead");
      if (!head) return;
      block.style.setProperty("--table-block-sticky-head-height", `${Math.ceil(head.getBoundingClientRect().height)}px`);
    });
  }

  function syncTableGeometry() {
    syncStickyHeaderScrollOffset();
    ui.bindTableBlockScrollbars?.();
  }

  function scheduleTableGeometrySync() {
    if (tableGeometryFrame) cancelAnimationFrame(tableGeometryFrame);
    tableGeometryFrame = requestAnimationFrame(() => {
      tableGeometryFrame = 0;
      syncTableGeometry();
    });
  }

  function attentionCard(item) {
    const tone = statusTone(item);
    const toneClass = tone ? ` card-with-image--${escape(tone)}` : "";
    const category = item.category || item.type;
    const wear = item.wear ?? 0;
    return `<a class="card-with-image${toneClass}" href="${window.BNTShell.routeHref(`/equipment-detail?id=${encodeURIComponent(item.detailId)}`)}">
      <span class="card-with-image__media" aria-hidden="true"><img src="${escape(item.image)}" alt=""></span>
      ${item.status ? ui.badge(item.status, tone) : ""}
      <div class="card-with-image__body">
        <div class="card-with-image__heading">
          <span class="card-with-image__eyebrow typography-indicator-small">${escape(category)}</span>
          <h3 class="card-with-image__title typography-caption-smallest">${escape(item.name)}</h3>
        </div>
        <div class="card-with-image__progress">
          <div class="card-with-image__progress-head typography-body-smallest"><span>Износ по нагрузке</span><b>${escape(wear)}%</b></div>
          ${ui.progress(wear, tone)}
        </div>
      </div>
    </a>`;
  }

  function render() {
    const rows = visibleTreeRows();
    document.getElementById("asset-rows").innerHTML = rows.length ? rows.map(({item, level, branches, isFlat, hasVisibleChildren}) => `<tr data-tree-level="${level}"><td class="data-table__tree-cell">${treeCell(item, level, branches, isFlat, hasVisibleChildren)}</td><td>${escape(item.type)}</td><td>${escape(item.location)}</td><td>${escape(item.internal)}</td><td class="data-table__numeric-cell table-number-cell">${numericContent(item.age, "лет")}</td><td class="data-table__numeric-cell data-table__progress-cell">${progressContent(item.load)}</td><td class="data-table__numeric-cell data-table__progress-cell">${progressContent(item.wear, item.wear > 70 ? "red" : "")}</td><td class="data-table__date-cell">${item.lastService ? escape(item.lastService) : emptyCell}</td><td class="data-table__date-cell">${item.nextService ? escape(item.nextService) : emptyCell}</td><td>${item.status ? ui.badge(item.status, statusTone(item)) : emptyCell}</td><td class="data-table__action-cell">${passportAction(item)}</td></tr>`).join("") : ui.renderEmptyTableRow(11, "По выбранным фильтрам активы не найдены");
    updateSortControls();
    renderFilterSummary();
    scheduleTableGeometrySync();
    const attention = assets.filter(item => item.detailId && item.tone && item.tone !== "green").slice(0, 4);
    document.getElementById("asset-cards").innerHTML = attention.map(attentionCard).join("") || ui.renderEmptyState("Нет активов повышенного внимания", {size: "smallest"});
  }

  function formInput(name, label, options) {
    return `<div class="form-input" data-form-input="${escape(name)}">
      <span class="form-input__label typography-label-smallest">${escape(label)}</span>
      <div class="form-input__field">
        <div class="form-input__control" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false">
          <span class="form-input__value form-input__tags" data-form-input-value>${formInputValue(new Set([allValue]))}</span>
          <span class="form-input__chevron nav-chevron" aria-hidden="true">${icons.chevron}</span>
        </div>
        <div class="form-input__menu" role="listbox" aria-multiselectable="true" hidden>
          <span class="form-input__divider" aria-hidden="true"></span>
          <label class="form-input__search"><span aria-hidden="true">${icons.search}</span><input class="typography-body-smallest" type="search" placeholder="Поиск" data-form-input-search autocomplete="off"><button class="form-input__search-clear" type="button" data-form-input-search-clear aria-label="Очистить поиск" hidden>${icons.close}</button></label>
          <div class="form-input__options" data-form-input-options>
            ${options.map(option => `<button class="form-input__option typography-body-smallest" type="button" role="option" data-form-input-option="${escape(option)}" aria-selected="false"><span class="form-input__checkbox" aria-hidden="true">${icons.check}</span><span class="form-input__option-label">${escape(option)}</span></button>`).join("")}
          </div>
        </div>
      </div>
      <span class="form-input__warning typography-indicator-small" data-form-input-empty-warning hidden>${icons.warning}<span>${emptyFormInputMessage}</span></span>
    </div>`;
  }

  function dateField(name, label) {
    return ui.renderDateField({name: `equipment-${name}`, label, value: draftFilters[name] || ""});
  }

  function closeDatePickers(except = null) {
    if (filterModal) ui.closeDatePickers("bnt", except, filterModal);
  }

  function syncDateFields() {
    ["last", "next"].forEach(name => ui.syncDateField(getDateRoot(name), draftFilters[name] || ""));
  }

  function createFilterModal() {
    const modal = document.createElement("div");
    modal.id = "equipment-filter-modal";
    modal.className = "filter-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "equipment-filter-title");
    modal.hidden = true;
    modal.innerHTML = `
      <div class="filter-modal__overlay" data-equipment-filter-close></div>
      <section class="filter-modal__drawer dt3-drawer">
        <header class="filter-modal__head">
          <h2 id="equipment-filter-title" class="filter-modal__title typography-caption-small">Фильтр по активам</h2>
          <button class="dt3-drawer-toggle button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest is-expanded" type="button" data-equipment-filter-close aria-label="Закрыть фильтр">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
          </button>
        </header>
        <span class="ui-divider brand-divider" aria-hidden="true"></span>
        <div class="filter-modal__body">
          <form class="filter-modal__search dt3-multisearch shell-search" role="search" data-equipment-filter-search-form>
            <div class="dt3-multisearch-field shell-search-field">
              <span class="dt3-search-scope ui-dropdown" data-equipment-search-scope>
                <button class="dt3-search-scope-trigger ui-dropdown__trigger typography-caption-smallest" type="button" data-equipment-search-scope-trigger data-value="all" aria-haspopup="listbox" aria-expanded="false" aria-controls="equipment-search-scope-list">
                  <span data-equipment-search-scope-label>Всё</span>
                  <span class="dt3-search-scope-chevron ui-dropdown__chevron nav-chevron" aria-hidden="true">${icons.chevron}</span>
                </button>
                <div id="equipment-search-scope-list" class="dt3-search-scope-menu ui-dropdown__menu" role="listbox" aria-label="Область поиска" hidden>
                  ${searchScopes.map(([value, label], index) => `<button class="dt3-search-scope-option ui-dropdown__option ${index === 0 ? "is-selected typography-caption-smallest" : "typography-body-smallest"}" type="button" role="option" aria-selected="${index === 0}" data-equipment-search-scope-option="${escape(value)}">${escape(label)}</button>`).join("")}
                </div>
              </span>
              <input class="typography-body-smallest" type="search" placeholder="Поиск" data-equipment-filter-search autocomplete="off">
              <button class="dt3-search-submit" type="submit" aria-label="Найти">${icons.search}</button>
            </div>
          </form>
          <div class="filter-modal__fields ui-scrollbar">
            ${formInput("location", "Локация", unique("location"))}
            ${formInput("type", "Тип", unique("type"))}
            ${formInput("status", "Статус", unique("status"))}
            ${formInput("age", "Возраст", ageOptions)}
            <div class="equipment-date-grid">
              ${dateField("last", "Последнее ТО после")}
              ${dateField("next", "Следующее ТО до")}
            </div>
          </div>
        </div>
        <span class="ui-divider brand-divider" aria-hidden="true"></span>
        <footer class="filter-modal__footer">
          <button class="button-smallest-primary-radius typography-button-smallest" type="button" data-equipment-filter-apply>${icons.search}<span>Поиск</span></button>
          <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-equipment-filter-reset>${icons.close}<span>Сбросить всё</span></button>
        </footer>
      </section>`;
    document.body.appendChild(modal);
    return modal;
  }

  function closeAllDropdowns(except) {
    closeFormInputHiddenMenus();
    closeDatePickers(except);
    filterModal?.querySelectorAll(".form-input.is-open").forEach(root => {
      if (root === except) return;
      root.classList.remove("is-open", "is-open-up");
      root.querySelector(".form-input__control")?.setAttribute("aria-expanded", "false");
      const menu = root.querySelector(".form-input__menu");
      if (menu) menu.hidden = true;
    });
    const searchScope = filterModal?.querySelector("[data-equipment-search-scope]");
    if (searchScope && searchScope !== except) closeSearchScope();
  }

  function closeSearchScope() {
    const scope = filterModal?.querySelector("[data-equipment-search-scope]");
    if (!scope) return;
    scope.classList.remove("is-open");
    scope.querySelector("[data-equipment-search-scope-trigger]")?.setAttribute("aria-expanded", "false");
    const menu = scope.querySelector(".dt3-search-scope-menu");
    if (menu) menu.hidden = true;
  }

  function toggleSearchScope() {
    const scope = filterModal.querySelector("[data-equipment-search-scope]");
    const trigger = scope.querySelector("[data-equipment-search-scope-trigger]");
    const menu = scope.querySelector(".dt3-search-scope-menu");
    const open = trigger.getAttribute("aria-expanded") !== "true";
    closeAllDropdowns(scope);
    scope.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
  }

  function syncSearchScope() {
    const selected = searchScopes.find(([value]) => value === draftFilters.searchScope) || searchScopes[0];
    filterModal.querySelector("[data-equipment-search-scope-label]").textContent = selected[1];
    filterModal.querySelector("[data-equipment-search-scope-trigger]").dataset.value = selected[0];
    filterModal.querySelectorAll("[data-equipment-search-scope-option]").forEach(option => {
      const active = option.dataset.equipmentSearchScopeOption === selected[0];
      option.classList.toggle("is-selected", active);
      option.classList.toggle("typography-caption-smallest", active);
      option.classList.toggle("typography-body-smallest", !active);
      option.setAttribute("aria-selected", String(active));
    });
  }

  function syncFormInput(name) {
    const root = filterModal.querySelector(`[data-form-input="${name}"]`);
    if (!root) return;
    const set = draftFilters[name];
    const explicitAll = explicitAllFormInputs.has(name);
    const isEmpty = !set.size;
    root.classList.toggle("has-selection", !set.has(allValue));
    root.classList.toggle("is-explicit-all", set.has(allValue) && explicitAll);
    root.classList.toggle("is-empty", isEmpty);
    root.querySelector("[data-form-input-value]").innerHTML = formInputValue(set);
    const control = root.querySelector(".form-input__control");
    control?.setAttribute("aria-label", `${root.querySelector(".form-input__label")?.textContent || ""}: ${formInputText(set)}`);
    control?.setAttribute("aria-invalid", String(isEmpty));
    const warning = root.querySelector("[data-form-input-empty-warning]");
    if (warning) warning.hidden = !isEmpty;
    const options = [...root.querySelectorAll("[data-form-input-option]")];
    const isAll = set.has(allValue);
    const isPartial = !isAll && set.size > 0;
    options.forEach(option => {
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
      if (checkbox) checkbox.innerHTML = indeterminate ? icons.minus : icons.check;
    });
    const search = root.querySelector("[data-form-input-search]");
    if (search) search.value = "";
    syncFormInputSearch(root);
    syncFormInputOverflow(root);
  }

  function syncModal() {
    filterModal.querySelector("[data-equipment-filter-search]").value = draftFilters.search;
    filterModal.querySelector('[data-bnt-date="equipment-last"]').value = draftFilters.last;
    filterModal.querySelector('[data-bnt-date="equipment-next"]').value = draftFilters.next;
    syncDateFields();
    syncSearchScope();
    ["location", "type", "status", "age"].forEach(syncFormInput);
  }

  function openModal(searchScope = null) {
    closeColumnFilterPopover();
    if (!filterModal) filterModal = createFilterModal();
    draftFilters = cloneFilters(filters);
    if (searchScope) draftFilters.searchScope = searchScope;
    explicitAllFormInputs = new Set();
    lastFocusedElement = document.activeElement;
    filterModal.hidden = false;
    syncModal();
    filterToggle?.setAttribute("aria-expanded", "true");
    requestAnimationFrame(syncAllFormInputOverflow);
    filterModal.querySelector("[data-equipment-filter-search]")?.focus();
  }

  function closeModal() {
    if (!filterModal) return;
    closeAllDropdowns();
    filterModal.hidden = true;
    filterToggle?.setAttribute("aria-expanded", "false");
    lastFocusedElement?.focus?.();
  }

  function applyFilters() {
    draftFilters.search = filterModal.querySelector("[data-equipment-filter-search]").value;
    draftFilters.last = filterModal.querySelector('[data-bnt-date="equipment-last"]').value;
    draftFilters.next = filterModal.querySelector('[data-bnt-date="equipment-next"]').value;
    filters = cloneFilters(draftFilters);
    render();
    closeModal();
  }

  function resetFilters() {
    draftFilters = defaultFilters();
    filters = cloneFilters(draftFilters);
    explicitAllFormInputs = new Set();
    syncModal();
    render();
  }

  function bindModalEvents() {
    document.addEventListener("click", event => {
      const modal = event.target.closest(".filter-modal");
      if (!modal) return;
      if (event.target.closest("[data-equipment-filter-close]")) {
        closeModal();
        return;
      }

      const dateRoot = event.target.closest("[data-bnt-date-root]");
      if (dateRoot) {
        closeAllDropdowns(dateRoot);
        return;
      }

      const scopeTrigger = event.target.closest("[data-equipment-search-scope-trigger]");
      if (scopeTrigger) {
        event.preventDefault();
        toggleSearchScope();
        return;
      }

      const scopeOption = event.target.closest("[data-equipment-search-scope-option]");
      if (scopeOption) {
        draftFilters.searchScope = scopeOption.dataset.equipmentSearchScopeOption;
        syncSearchScope();
        closeSearchScope();
        return;
      }

      const formSearchClear = event.target.closest("[data-form-input-search-clear]");
      if (formSearchClear) {
        const root = formSearchClear.closest(".form-input");
        const search = root.querySelector("[data-form-input-search]");
        search.value = "";
        filterFormInputOptions(root);
        requestAnimationFrame(() => ui.positionFormInputMenu(root));
        search.focus();
        return;
      }

      const formTagRemove = event.target.closest("[data-form-input-tag-remove]");
      if (formTagRemove) {
        event.preventDefault();
        event.stopPropagation();
        const root = formTagRemove.closest(".form-input");
        const name = root.dataset.formInput;
        removeMultiValue(draftFilters[name], formTagRemove.dataset.formInputTagRemove, name);
        syncFormInput(name);
        filterFormInputOptions(root);
        requestAnimationFrame(() => ui.positionFormInputMenu(root));
        return;
      }

      const hiddenToggle = event.target.closest("[data-form-input-hidden-toggle]");
      if (hiddenToggle) {
        event.preventDefault();
        event.stopPropagation();
        const more = hiddenToggle.closest("[data-form-input-tag-more]");
        const menu = more.querySelector("[data-form-input-hidden-menu]");
        const open = hiddenToggle.getAttribute("aria-expanded") !== "true";
        const root = more.closest(".form-input");
        closeFormInputHiddenMenus(more);
        more.classList.toggle("is-open", open);
        root?.classList.toggle("has-tag-rollover", open);
        hiddenToggle.setAttribute("aria-expanded", String(open));
        if (menu) menu.hidden = !open;
        return;
      }

      if (!event.target.closest(".form-input__tag-more")) closeFormInputHiddenMenus();

      const formControl = event.target.closest(".form-input__control");
      if (formControl) {
        event.preventDefault();
        const root = formControl.closest(".form-input");
        const menu = root.querySelector(".form-input__menu");
        const open = formControl.getAttribute("aria-expanded") !== "true";
        closeAllDropdowns(root);
        root.classList.toggle("is-open", open);
        root.classList.remove("is-open-up");
        formControl.setAttribute("aria-expanded", String(open));
        menu.hidden = !open;
        if (open) requestAnimationFrame(() => ui.positionFormInputMenu(root));
        return;
      }

      const formOption = event.target.closest("[data-form-input-option]");
      if (formOption) {
        const root = formOption.closest(".form-input");
        const name = root.dataset.formInput;
        toggleMultiValue(draftFilters[name], formOption.dataset.formInputOption, name);
        syncFormInput(name);
        filterFormInputOptions(root);
        requestAnimationFrame(() => ui.positionFormInputMenu(root));
        return;
      }

      if (!event.target.closest(".form-input") && !event.target.closest("[data-equipment-search-scope]")) closeAllDropdowns();
      if (event.target.closest("[data-equipment-filter-apply]")) applyFilters();
      if (event.target.closest("[data-equipment-filter-reset]")) resetFilters();
    });

    document.addEventListener("input", event => {
      const modal = event.target.closest(".filter-modal");
      if (!modal) return;
      if (event.target.matches("[data-equipment-filter-search]")) draftFilters.search = event.target.value;
      if (event.target.matches("[data-form-input-search]")) {
        const root = event.target.closest(".form-input");
        filterFormInputOptions(root);
        requestAnimationFrame(() => ui.positionFormInputMenu(root));
      }
    });

    document.addEventListener("submit", event => {
      if (!event.target.matches("[data-equipment-filter-search-form]")) return;
      event.preventDefault();
      applyFilters();
    });

    document.addEventListener("keydown", event => {
      const modal = event.target.closest(".filter-modal");
      const formControl = modal?.querySelector(".form-input__control:focus");
      if (formControl && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        formControl.click();
        return;
      }
      if (event.key === "Escape" && filterModal && !filterModal.hidden) closeModal();
    });

    window.addEventListener("resize", () => {
      scheduleTableGeometrySync();
      requestAnimationFrame(syncAllFormInputOverflow);
    });
  }

  function bindHeaderControls() {
    document.addEventListener("click", event => {
      if (handleColumnFilterPopoverClick(event)) return;

      const columnSearchButton = event.target.closest("[data-equipment-column-search]");
      if (!columnSearchButton && columnFilterPopover && !columnFilterPopover.hidden) closeColumnFilterPopover();

      const summaryValueRemove = event.target.closest("[data-equipment-filter-remove-value]");
      if (summaryValueRemove) {
        event.preventDefault();
        event.stopPropagation();
        removeFilterSummaryValue(summaryValueRemove.dataset.equipmentFilterRemoveValue, summaryValueRemove.dataset.equipmentFilterRemoveItem);
        return;
      }

      const summaryGroupRemove = event.target.closest("[data-equipment-filter-remove-group]");
      if (summaryGroupRemove) {
        event.preventDefault();
        event.stopPropagation();
        resetFilterGroup(summaryGroupRemove.dataset.equipmentFilterRemoveGroup);
        return;
      }

      const summaryClear = event.target.closest("[data-equipment-filter-summary-clear]");
      if (summaryClear) {
        event.preventDefault();
        clearActiveFilters();
        return;
      }

      const templateButton = event.target.closest("[data-equipment-filter-template]");
      if (templateButton) {
        event.preventDefault();
        ui.toast("Шаблон создан", "Текущий набор фильтров сохранён");
        return;
      }

      if (!event.target.closest("[data-equipment-filter-summary]")) closeFilterSummaryMenus();

      const treeToggle = event.target.closest("[data-equipment-tree-toggle]");
      if (treeToggle) {
        const id = treeToggle.dataset.equipmentTreeToggle;
        if (expandedRows.has(id)) expandedRows.delete(id);
        else expandedRows.add(id);
        render();
        return;
      }

      const sortButton = event.target.closest("[data-equipment-sort]");
      if (sortButton) {
        const key = sortButton.dataset.equipmentSort;
        const directions = ["default", "descending", "ascending"];
        const nextDirection = assetSort.key === key
          ? directions[(directions.indexOf(assetSort.direction) + 1) % directions.length]
          : "descending";
        assetSort = {
          key: nextDirection === "default" ? null : key,
          direction: nextDirection
        };
        render();
        return;
      }

      const searchButton = event.target.closest("[data-equipment-column-search]");
      if (searchButton) {
        event.preventDefault();
        openColumnFilterPopover(searchButton.dataset.equipmentColumnSearch || "all", searchButton);
        return;
      }
    });

    document.addEventListener("input", event => {
      if (event.target.matches("[data-column-filter-search-input]")) {
        applyColumnSearch(event.target.value);
        return;
      }
      if (event.target.matches("[data-column-filter-option-search]")) filterColumnFilterOptions();
    });

    document.addEventListener("submit", event => {
      if (!event.target.matches("[data-column-filter-search-form]")) return;
      event.preventDefault();
      closeColumnFilterPopover();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeFilterSummaryMenus();
        closeColumnFilterPopover();
      }
    });

    window.addEventListener("resize", () => requestAnimationFrame(positionColumnFilterPopover));
    document.addEventListener("scroll", () => requestAnimationFrame(positionColumnFilterPopover), true);
  }

  function exportCsv() {
    const columns = ["Название", "Тип", "Категория", "Локация", "Внутренний номер", "Износ", "Следующее ТО", "Статус"];
    const lines = [columns, ...filtered().map(a => [a.name, a.type, a.category, a.location, a.internal, a.wear, a.nextService, a.status])].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(";"));
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\n")], {type: "text/csv"}));
    link.download = "BNT_equipment.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    ui.toast("Реестр экспортирован", `${filtered().length} активов`);
  }

  render();
  bindModalEvents();
  bindHeaderControls();
  exportButton?.addEventListener("click", exportCsv);
  infoButton?.addEventListener("click", event => ui.showInfoPopover(event.currentTarget, {title: "Реестр оборудования", message: "Техническое состояние и сервисные интервалы по всем объектам терминала"}));
  filterToggle?.addEventListener("click", () => {
    closeColumnFilterPopover();
    openModal();
  });
  window.addEventListener("load", scheduleTableGeometrySync);
})();
