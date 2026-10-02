(function(){
  const data = window.BNT_DATA.procurement;
  const ui = window.BNTUI;
  const allPriority = "Все";
  const searchScopes = [
    ["name", "Позиция"],
    ["code", "Код"]
  ];
  const defaultFilters = () => ({
    search: "",
    searchScope: "name",
    priority: allPriority
  });
  const cloneFilters = source => ({...source});
  const evidenceRoot = document.getElementById("procurement-evidence-primary");
  const kpiRoot = document.getElementById("procurement-kpis");
  const rowsRoot = document.getElementById("parts-rows");
  const urgentPurchaseButton = document.getElementById("urgent-purchase");
  const infoButton = document.querySelector("[data-procurement-info]");
  const stockInfoButton = document.querySelector("[data-procurement-stock-info]");
  const impactInfoButton = document.querySelector("[data-procurement-impact-info]");
  const egpzFilterToggle = document.querySelector("[data-egpz-filter]");
  const egpzChartFilterToggles = [...document.querySelectorAll("[data-egpz-chart-filter]")];
  const egpzFilterToggles = [egpzFilterToggle, ...egpzChartFilterToggles].filter(Boolean);
  const egpzFilterModal = document.getElementById("egpz-filter-modal");
  const filterToggle = document.querySelector("[data-procurement-filter-toggle]");
  const filterModal = document.getElementById("procurement-filter-modal");
  const purchaseDrawer = document.getElementById("procurement-purchase-drawer");
  const purchaseForm = purchaseDrawer?.querySelector("[data-procurement-purchase-form]");
  const filterSummary = document.getElementById("equipment-filter-summary");
  const filterSummaryList = filterSummary?.querySelector("[data-equipment-filter-summary-list]");
  const filterSummaryActions = filterSummary?.querySelector("[data-equipment-filter-summary-actions]");
  const exportButton = document.querySelector("[data-procurement-export]");
  const riskScroller = document.querySelector("[data-procurement-risk-scroll]");
  const riskColumn = document.querySelector("[data-procurement-risk-column]");
  const filterSummaryLabels = {
    search: "Поиск",
    priority: "Приоритет"
  };
  const egpzFilterDefaultTitle = "Фильтр текущего ЕГПЗ";
  const egpzAllDepartment = "Все";
  const egpzEmptyDepartment = "Ничего";
  const filterSummaryIcons = {
    chevron: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4.375V15.625M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>',
    close: '<svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2.70831 4.04199C2.2941 4.04199 1.95831 4.37778 1.95831 4.79199C1.95831 5.20621 2.2941 5.54199 2.70831 5.54199V4.79199V4.04199ZM17.2916 5.54199C17.7059 5.54199 18.0416 5.20621 18.0416 4.79199C18.0416 4.37778 17.7059 4.04199 17.2916 4.04199V4.79199V5.54199ZM9.29165 8.12533C9.29165 7.71111 8.95586 7.37533 8.54165 7.37533C8.12743 7.37533 7.79165 7.71111 7.79165 8.12533H8.54165H9.29165ZM7.79165 14.3753C7.79165 14.7895 8.12743 15.1253 8.54165 15.1253C8.95586 15.1253 9.29165 14.7895 9.29165 14.3753H8.54165H7.79165ZM12.2083 8.12533C12.2083 7.71111 11.8725 7.37533 11.4583 7.37533C11.0441 7.37533 10.7083 7.71111 10.7083 8.12533H11.4583H12.2083ZM10.7083 14.3753C10.7083 14.7895 11.0441 15.1253 11.4583 15.1253C11.8725 15.1253 12.2083 14.7895 12.2083 14.3753H11.4583H10.7083ZM4.91316 4.71975C4.87326 4.30747 4.5067 4.00558 4.09441 4.04548C3.68212 4.08538 3.38024 4.45194 3.42013 4.86423L4.16665 4.79199L4.91316 4.71975ZM5.27081 16.2024L6.01734 16.1303L6.01733 16.1302L5.27081 16.2024ZM14.7287 16.2024L13.9822 16.1301L13.9822 16.1303L14.7287 16.2024ZM16.5798 4.86426C16.6197 4.45197 16.3179 4.08539 15.9056 4.04548C15.4933 4.00557 15.1267 4.30744 15.0868 4.71973L15.8333 4.79199L16.5798 4.86426ZM12.2916 4.79199H13.0416V4.58366H12.2916H11.5416V4.79199H12.2916ZM12.2916 4.58366H13.0416C13.0416 2.90361 11.68 1.54199 9.99998 1.54199V2.29199V3.04199C10.8516 3.04199 11.5416 3.73204 11.5416 4.58366H12.2916ZM9.99998 2.29199V1.54199C8.31993 1.54199 6.95831 2.90361 6.95831 4.58366H7.70831H8.45831C8.45831 3.73204 9.14836 3.04199 9.99998 3.04199V2.29199ZM7.70831 4.58366H6.95831V4.79199H7.70831H8.45831V4.58366H7.70831ZM2.70831 4.79199V5.54199H17.2916V4.79199V4.04199H2.70831V4.79199ZM8.54165 8.12533H7.79165V14.3753H8.54165H9.29165V8.12533H8.54165ZM11.4583 8.12533H10.7083V14.3753H11.4583H12.2083V8.12533H11.4583ZM4.16665 4.79199L3.42013 4.86423L4.5243 16.2746L5.27081 16.2024L6.01733 16.1302L4.91316 4.71975L4.16665 4.79199ZM5.27081 16.2024L4.52429 16.2745C4.64393 17.5132 5.68543 18.4587 6.92956 18.4587V17.7087V16.9587C6.45786 16.9587 6.0627 16.5999 6.01734 16.1303L5.27081 16.2024ZM6.92956 17.7087V18.4587H13.07V17.7087V16.9587H6.92956V17.7087ZM13.07 17.7087V18.4587C14.3145 18.4587 15.3556 17.5137 15.4753 16.2745L14.7287 16.2024L13.9822 16.1303C13.9368 16.6003 13.5421 16.9587 13.07 16.9587V17.7087ZM14.7287 16.2024L15.4752 16.2747L16.5798 4.86426L15.8333 4.79199L15.0868 4.71973L13.9822 16.1301L14.7287 16.2024Z" fill="currentColor"/></svg>'
  };
  const egpzCheckIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.2L9.2 16.4L19 6.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  const egpzMinusIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 12H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  const egpzDateWeekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const egpzMonthFormatter = new Intl.DateTimeFormat("ru-RU", {month: "long", year: "numeric"});
  let egpzDepartments = new Set([egpzAllDepartment]);
  let filters = defaultFilters();
  let draftFilters = cloneFilters(filters);
  const procurementEvidenceCards = [
    {label: "Активы", value: "207", context: "реестр оборудования и связанных объектов"},
    {label: "Запасы склада", value: "76 800 USD", context: "дефицитных позиций из общего запаса 1 280 000 USD", ring: {percent: 6, display: "6%", tone: "info"}},
    {label: "Пополнение дефицита", value: "12 дней", context: "влияние ЗИП на ремонтное окно"},
    {label: "Плановая дисциплина", value: "+3 пункта", context: "к плановому уровню 91%", ring: {percent: 94, display: "94%", tone: "positive"}}
  ];

  const escape = value => ui.escape(value);
  const normalize = value => String(value ?? "").toLocaleLowerCase("ru-RU").trim();
  const priorityLabel = priority => priority === "Критично" ? "Критические" : priority;
  const priorityValue = label => label === "Критические" ? "Критично" : label;
  const statusTone = status => {
    if (status === "В наличии") return "green";
    if (status === "Ожидает поставки") return "orange";
    if (["В закупке", "Заявка", "Тендер открыт"].includes(status)) return "red";
    return "";
  };
  const riskTone = tone => tone === "red" ? "error" : tone === "orange" ? "warning" : "info";

  function selectedEgpzDepartments() {
    return egpzDepartments.has(egpzAllDepartment) ? [egpzAllDepartment] : [...egpzDepartments];
  }

  function egpzDepartmentTag(value, className = "", isMeasured = true) {
    const safeValue = escape(value);
    const tagClass = `form-input__tag pill pill--default pill--radius typography-body-smallest${className ? ` ${className}` : ""}`;
    const measuredAttrs = isMeasured ? ` data-form-input-tag-item data-form-input-tag-value="${safeValue}"` : "";
    return `<span class="${tagClass}" data-form-input-tag="${safeValue}"${measuredAttrs}>
      <span class="pill__title">${safeValue}</span>
      <button class="form-input__tag-remove" type="button" data-form-input-tag-remove="${safeValue}" aria-label="Убрать ${safeValue}">
        <svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg>
      </button>
    </span>`;
  }

  function egpzDepartmentsValue() {
    const values = selectedEgpzDepartments();
    if (!values.length) return `<span class="form-input__empty typography-body-smallest">${escape(egpzEmptyDepartment)}</span>`;
    if (egpzDepartments.has(egpzAllDepartment)) return `<span class="form-input__all typography-body-smallest">${escape(egpzAllDepartment)}</span>`;
    const tags = values.map(value => egpzDepartmentTag(value)).join("");
    const counter = values.length > 1 ? `<span class="form-input__tag-more" data-form-input-tag-more hidden>
      <button class="form-input__tag-count pill pill--default pill--radius typography-body-smallest" type="button" data-form-input-hidden-toggle aria-expanded="false">
        <span class="form-input__tag-count-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4.375V15.625M15.625 10H4.375" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
        </span>
        <span class="form-input__tag-count-value" data-form-input-hidden-count>${values.length - 1}</span>
        <span class="form-input__tag-count-chevron nav-chevron" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
        </span>
      </button>
      <span class="form-input__tag-rollover" data-form-input-hidden-menu role="menu" hidden></span>
    </span>` : "";
    return `${tags}${counter}`;
  }

  function measureEgpzDepartmentTag(tag) {
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
    const width = clone.getBoundingClientRect().width;
    clone.remove();
    return width;
  }

  function closeEgpzDepartmentHiddenMenus(except = null) {
    egpzFilterModal?.querySelectorAll(".form-input__tag-more.is-open").forEach(root => {
      if (root === except) return;
      root.classList.remove("is-open");
      root.closest(".form-input")?.classList.remove("has-tag-rollover");
      root.querySelector("[data-form-input-hidden-toggle]")?.setAttribute("aria-expanded", "false");
      const menu = root.querySelector("[data-form-input-hidden-menu]");
      if (menu) menu.hidden = true;
    });
  }

  function syncEgpzDepartmentOverflow() {
    const root = egpzDepartmentsRoot();
    if (!root) return;
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
    const tagWidths = tags.map(measureEgpzDepartmentTag);
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
      menu.innerHTML = hiddenValues.map(value => egpzDepartmentTag(value, "form-input__tag--rollover", false)).join("");
      menu.hidden = true;
    }
    more.hidden = false;
  }

  function syncEgpzDepartmentSearch(root) {
    const search = root?.querySelector("[data-form-input-search]");
    const clear = root?.querySelector("[data-form-input-search-clear]");
    if (!search || !clear) return;
    clear.hidden = !search.value;
  }

  function filterEgpzDepartmentOptions(root = egpzDepartmentsRoot()) {
    if (!root) return;
    const search = root.querySelector("[data-form-input-search]");
    const query = search ? search.value.trim().toLocaleLowerCase("ru-RU") : "";
    root.querySelectorAll("[data-form-input-option]").forEach(option => {
      const label = option.querySelector(".form-input__option-label")?.textContent || option.textContent;
      option.hidden = Boolean(query) && !label.toLocaleLowerCase("ru-RU").includes(query);
    });
    syncEgpzDepartmentSearch(root);
  }

  function egpzDepartmentsRoot() {
    return egpzFilterModal?.querySelector("[data-egpz-departments-filter]");
  }

  function syncEgpzDepartmentsField() {
    const root = egpzDepartmentsRoot();
    if (!root) return;
    const values = selectedEgpzDepartments();
    const isAll = egpzDepartments.has(egpzAllDepartment);
    const isEmpty = !egpzDepartments.size;
    const isPartial = !isAll && egpzDepartments.size > 0;
    const valueRoot = root.querySelector("[data-form-input-value]");
    root.classList.toggle("has-selection", !isAll);
    root.classList.toggle("is-empty", isEmpty);
    if (valueRoot) valueRoot.innerHTML = egpzDepartmentsValue();
    root.querySelector(".form-input__control")?.setAttribute("aria-label", `Подразделения: ${values.length ? values.join(", ") : egpzEmptyDepartment}`);
    root.querySelectorAll("[data-form-input-option]").forEach(option => {
      const value = option.dataset.formInputOption;
      const isAllOption = value === egpzAllDepartment;
      const active = isAll || (!isAllOption && egpzDepartments.has(value));
      const indeterminate = isAllOption && isPartial;
      const checkbox = option.querySelector(".form-input__checkbox");
      option.classList.toggle("is-selected", active);
      option.classList.toggle("is-indeterminate", indeterminate);
      option.setAttribute("aria-selected", String(active));
      option.setAttribute("aria-checked", indeterminate ? "mixed" : String(active));
      option.hidden = false;
      if (checkbox) checkbox.innerHTML = indeterminate ? egpzMinusIcon : egpzCheckIcon;
    });
    filterEgpzDepartmentOptions(root);
    requestAnimationFrame(syncEgpzDepartmentOverflow);
  }

  function closeEgpzDepartmentsField() {
    const root = egpzDepartmentsRoot();
    if (!root) return;
    root.classList.remove("is-open", "is-open-up");
    root.querySelector(".form-input__control")?.setAttribute("aria-expanded", "false");
    const menu = root.querySelector(".form-input__menu");
    if (menu) menu.hidden = true;
    closeEgpzDepartmentHiddenMenus();
  }

  function toggleEgpzDepartment(value) {
    if (value === egpzAllDepartment) {
      const shouldSelectAll = !egpzDepartments.has(egpzAllDepartment) && !egpzDepartments.size;
      egpzDepartments.clear();
      if (shouldSelectAll) egpzDepartments.add(egpzAllDepartment);
      return;
    }
    if (egpzDepartments.has(egpzAllDepartment)) egpzDepartments.clear();
    if (egpzDepartments.has(value)) egpzDepartments.delete(value);
    else egpzDepartments.add(value);
  }

  function parseEgpzISODate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function toEgpzISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatEgpzDisplayDate(value) {
    const date = parseEgpzISODate(value);
    if (!date) return "дд.мм.гггг";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${date.getFullYear()}`;
  }

  function egpzMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function parseEgpzMonthKey(value) {
    const match = /^(\d{4})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, 1);
  }

  function closeEgpzDatePickers(except = null) {
    document.querySelectorAll(".equipment-date-field.is-open").forEach(root => {
      if (root === except) return;
      root.classList.remove("is-open", "is-open-up");
      root.querySelector("[data-egpz-date-toggle]")?.setAttribute("aria-expanded", "false");
      const popover = root.querySelector("[data-egpz-date-popover]");
      if (popover) popover.hidden = true;
    });
  }

  function syncEgpzDateField(root, value) {
    const dateValue = value || "";
    if (dateValue) root.dataset.egpzDateValue = dateValue;
    else delete root.dataset.egpzDateValue;
    root.classList.toggle("has-value", Boolean(dateValue));
    const input = root.querySelector("[data-egpz-date]");
    if (input) input.value = dateValue;
    const defaultValue = root.dataset.egpzDateDefault || "";
    root.querySelector("[data-egpz-date-text]").textContent = formatEgpzDisplayDate(dateValue || defaultValue);
    if (root.classList.contains("is-open")) renderEgpzDatePicker(root);
  }

  function positionEgpzDatePicker(root) {
    const control = root.querySelector(".equipment-date-input");
    const popover = root.querySelector("[data-egpz-date-popover]");
    if (!control || !popover || popover.hidden) return;
    const gap = 4;
    const viewportGap = 16;
    const rect = control.getBoundingClientRect();
    const desiredHeight = popover.scrollHeight || 360;
    const availableBelow = window.innerHeight - viewportGap - rect.bottom - gap;
    const availableAbove = rect.top - viewportGap - gap;
    root.classList.toggle("is-open-up", availableBelow < desiredHeight && availableAbove > availableBelow);
  }

  function renderEgpzDatePicker(root) {
    const selected = parseEgpzISODate(root.dataset.egpzDateValue);
    const fallback = parseEgpzISODate(root.dataset.egpzDateDefault) || new Date();
    const current = parseEgpzMonthKey(root.dataset.egpzDateMonth) || new Date(selected || fallback);
    current.setDate(1);
    root.dataset.egpzDateMonth = egpzMonthKey(current);
    const start = new Date(current);
    start.setDate(1 - ((start.getDay() + 6) % 7));
    const selectedISO = selected ? toEgpzISODate(selected) : "";
    const todayISO = toEgpzISODate(new Date());
    const days = Array.from({length: 42}, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = toEgpzISODate(date);
      const classes = [
        "equipment-date-popover__day",
        "typography-body-smallest",
        date.getMonth() !== current.getMonth() ? "is-outside" : "",
        iso === todayISO ? "is-today" : "",
        iso === selectedISO ? "is-selected" : ""
      ].filter(Boolean).join(" ");
      return `<button class="${classes}" type="button" data-egpz-date-day="${iso}" aria-pressed="${iso === selectedISO}">${date.getDate()}</button>`;
    }).join("");
    const prevIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const nextIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const title = egpzMonthFormatter.format(current);
    root.querySelector("[data-egpz-date-popover]").innerHTML = `
      <span class="equipment-date-popover__head">
        <span class="equipment-date-popover__title typography-caption-small">${escape(title)}</span>
        <button class="equipment-date-popover__nav" type="button" data-egpz-date-nav="-1" aria-label="Предыдущий месяц">${prevIcon}</button>
        <button class="equipment-date-popover__nav" type="button" data-egpz-date-nav="1" aria-label="Следующий месяц">${nextIcon}</button>
      </span>
      <span class="equipment-date-popover__grid" aria-hidden="true">
        ${egpzDateWeekdays.map(day => `<span class="equipment-date-popover__weekday typography-caption-smallest">${day}</span>`).join("")}
      </span>
      <span class="equipment-date-popover__grid" role="grid" aria-label="${escape(title)}">${days}</span>
      <span class="equipment-date-popover__footer">
        <button class="equipment-date-popover__action button-smallest-ghost typography-button-smallest" type="button" data-egpz-date-clear>Удалить</button>
        <button class="equipment-date-popover__action button-smallest-ghost typography-button-smallest" type="button" data-egpz-date-today>Сегодня</button>
      </span>`;
  }

  function openEgpzDatePicker(root) {
    const selected = parseEgpzISODate(root.dataset.egpzDateValue);
    const fallback = parseEgpzISODate(root.dataset.egpzDateDefault) || new Date();
    root.dataset.egpzDateMonth = egpzMonthKey(selected || fallback);
    root.classList.add("is-open", "has-value");
    root.querySelector("[data-egpz-date-toggle]")?.setAttribute("aria-expanded", "true");
    const popover = root.querySelector("[data-egpz-date-popover]");
    if (popover) popover.hidden = false;
    renderEgpzDatePicker(root);
    requestAnimationFrame(() => positionEgpzDatePicker(root));
  }

  function handleEgpzDateClick(event) {
    const dateToggle = event.target.closest("[data-egpz-date-toggle]");
    if (dateToggle) {
      event.preventDefault();
      const root = dateToggle.closest("[data-egpz-date-root]");
      const open = !root.classList.contains("is-open");
      closeEgpzDepartmentsField();
      closeEgpzDatePickers(root);
      if (open) openEgpzDatePicker(root);
      else closeEgpzDatePickers();
      return true;
    }
    const dateNav = event.target.closest("[data-egpz-date-nav]");
    if (dateNav) {
      event.preventDefault();
      const root = dateNav.closest("[data-egpz-date-root]");
      const current = parseEgpzMonthKey(root.dataset.egpzDateMonth) || new Date();
      current.setMonth(current.getMonth() + Number(dateNav.dataset.egpzDateNav));
      root.dataset.egpzDateMonth = egpzMonthKey(current);
      renderEgpzDatePicker(root);
      requestAnimationFrame(() => positionEgpzDatePicker(root));
      return true;
    }
    const dateDay = event.target.closest("[data-egpz-date-day]");
    if (dateDay) {
      event.preventDefault();
      const root = dateDay.closest("[data-egpz-date-root]");
      syncEgpzDateField(root, dateDay.dataset.egpzDateDay);
      closeEgpzDatePickers();
      return true;
    }
    const dateClear = event.target.closest("[data-egpz-date-clear]");
    if (dateClear) {
      event.preventDefault();
      const root = dateClear.closest("[data-egpz-date-root]");
      syncEgpzDateField(root, "");
      closeEgpzDatePickers();
      return true;
    }
    const dateToday = event.target.closest("[data-egpz-date-today]");
    if (dateToday) {
      event.preventDefault();
      const root = dateToday.closest("[data-egpz-date-root]");
      syncEgpzDateField(root, toEgpzISODate(new Date()));
      closeEgpzDatePickers();
      return true;
    }
    return false;
  }

  function filtered() {
    const query = normalize(filters.search);
    const priority = priorityValue(filters.priority);
    return data.parts.filter(part => {
      const priorityMatch = priority === allPriority || part.priority === priority;
      const searchValue = filters.searchScope === "code" ? part.code : part.name;
      const searchMatch = !query || normalize(searchValue).includes(query);
      return priorityMatch && searchMatch;
    });
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
        values: [{value: search, label: `${scope[1]}: ${search}`}]
      });
    }
    if (filters.priority !== allPriority) {
      groups.push({
        key: "priority",
        label: filterSummaryLabels.priority,
        count: 1,
        values: [{value: filters.priority, label: filters.priority}]
      });
    }
    return groups;
  }

  function closeFilterSummaryMenus(except = null) {
    filterSummary?.querySelectorAll("[data-equipment-filter-summary-group]").forEach(group => {
      if (group === except) return;
      group.classList.remove("is-open");
      group.querySelector("[data-equipment-filter-summary-toggle]")?.setAttribute("aria-expanded", "false");
      const menu = group.querySelector("[data-equipment-filter-summary-menu]");
      if (menu) menu.hidden = true;
    });
  }

  function syncAppliedFilters() {
    draftFilters = cloneFilters(filters);
    if (filterModal && !filterModal.hidden) syncFilterModal();
    render();
  }

  function resetFilterGroup(key) {
    if (key === "search") {
      filters.search = "";
      filters.searchScope = "name";
    } else if (key === "priority") {
      filters.priority = allPriority;
    }
    syncAppliedFilters();
  }

  function clearActiveFilters() {
    filters = defaultFilters();
    syncAppliedFilters();
  }

  function filterSummaryValuePill(group, item) {
    return `<span class="filter-summary__pill pill pill--default pill--radius typography-body-smallest">
      <span class="pill__title">${escape(item.label)}</span>
      <button type="button" data-equipment-filter-remove-value="${escape(group.key)}" data-equipment-filter-remove-item="${escape(item.value)}" aria-label="Удалить ${escape(item.label)}">${filterSummaryIcons.close}</button>
    </span>`;
  }

  function filterSummaryMenu(group) {
    return `<span class="filter-summary__rollover form-input__tag-rollover" data-equipment-filter-summary-menu hidden>
      ${group.values.map(item => `<span class="filter-summary__rollover-item form-input__tag form-input__tag--rollover pill pill--default pill--radius typography-body-smallest">
        <span class="pill__title">${escape(item.label)}</span>
        <button class="form-input__tag-remove" type="button" data-equipment-filter-remove-value="${escape(group.key)}" data-equipment-filter-remove-item="${escape(item.value)}" aria-label="Удалить ${escape(item.label)}">${filterSummaryIcons.close}</button>
      </span>`).join("")}
    </span>`;
  }

  function filterSummaryGroup(group) {
    return `<span class="filter-summary__group form-input__tag-more" data-equipment-filter-summary-group="${escape(group.key)}">
      <button class="filter-summary__count pill pill--default pill--radius typography-body-smallest" type="button" data-equipment-filter-summary-toggle aria-expanded="false">
        <span class="filter-summary__count-title">${escape(group.label)} (${escape(group.count)})</span>
        <span class="filter-summary__count-chevron" aria-hidden="true">${filterSummaryIcons.chevron}</span>
      </button>
      ${filterSummaryMenu(group)}
    </span>`;
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
    filterSummaryList.innerHTML = groups.length === 1
      ? groups[0].values.map(item => filterSummaryValuePill(groups[0], item)).join("")
      : groups.map(filterSummaryGroup).join("");
    filterSummaryActions.innerHTML = `
      <button class="filter-summary__clear button-smallest-ghost button-smallest-ghost--error typography-button-smallest" type="button" data-equipment-filter-summary-clear aria-label="Сбросить выбранные фильтры">${filterSummaryIcons.trash}</button>
      <button class="filter-summary__template-action button-smallest-ghost button-smallest-ghost--2 typography-button-smallest" type="button" data-equipment-filter-template>${filterSummaryIcons.plus}<span>Создать шаблон</span></button>`;
  }

  function kpiArrow(label) {
    return `<a class="payment-summary-card__link" href="#procurement-stock-need" aria-label="Перейти к складской потребности: ${escape(label)}">
      <svg width="20" height="20" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#ArrowUpRight"></use></svg>
    </a>`;
  }

  function renderKpi({label, value, context, toneClass = "", ring = null}) {
    const valueClass = toneClass ? ` ${toneClass}` : "";
    const cardClass = ring ? " financial-kpi--with-ring financial-kpi--warning" : "";
    return `<article class="financial-kpi${cardClass}">
      <div class="financial-kpi__heading">
        <span class="financial-kpi__title">${escape(label)}</span>
        ${kpiArrow(label)}
      </div>
      <div class="financial-kpi__body">
        ${ring ? ui.progressRing({label, percent: ring.percent, ariaLabel: `${label}: ${ring.percent} процентов`}) : ""}
        <div class="financial-kpi__copy">
          <strong class="financial-kpi__value${valueClass}">${escape(value)}</strong>
          <span class="financial-kpi__trend-context">${escape(context)}</span>
        </div>
      </div>
    </article>`;
  }

  function evidenceRingTone(ring) {
    if (ring?.tone === "error") return " payment-summary-card--error";
    if (ring?.tone === "warning") return " payment-summary-card--warning";
    if (ring?.tone === "positive") return " payment-summary-card--positive";
    return " payment-summary-card--info";
  }

  function renderEvidenceKpi({label, value, context, ring = null}) {
    if (ring) {
      return `<article class="payment-summary-card${evidenceRingTone(ring)}">
        <header class="payment-summary-card__heading">
          <h3 class="payment-summary-card__title typography-body-smallest">${escape(label)}</h3>
          ${kpiArrow(label)}
        </header>
        <div class="payment-summary-card__content">
          ${ui.progressRing({label, percent: ring.percent, display: ring.display})}
          <div class="payment-summary-card__copy">
            <strong class="payment-summary-card__amount typography-label-base">${escape(value)}</strong>
            <span class="payment-summary-card__description typography-body-smallest">${escape(context)}</span>
          </div>
        </div>
      </article>`;
    }
    return `<article class="analytics-kpi">
      <div class="analytics-kpi__heading">
        <span class="analytics-kpi__label typography-body-smallest">${escape(label)}</span>
        ${kpiArrow(label)}
      </div>
      <div class="kpi-card__body">
        <strong class="analytics-kpi__value typography-label-base">${escape(value)}</strong>
        <p class="analytics-kpi__context typography-body-smallest">${escape(context)}</p>
      </div>
    </article>`;
  }

  function renderProcurementEvidence() {
    if (!evidenceRoot) return;
    evidenceRoot.innerHTML = procurementEvidenceCards.map(renderEvidenceKpi).join("");
  }

  function numberContent(value, label = "") {
    const caption = label ? `<small>${escape(label)}</small>` : "";
    return `<div class="table-number-content"><strong>${escape(value)}</strong>${caption}</div>`;
  }

  function textContent(value, label = "") {
    const caption = label ? `<small>${escape(label)}</small>` : "";
    return `<div class="table-cell-content"><strong>${escape(value)}</strong>${caption}</div>`;
  }

  function impactContent(value) {
    const amount = String(value ?? "").replace(/\s*риска\s*$/i, "");
    return numberContent(amount, "риска");
  }

  function progressContent(value, tone = "") {
    return `<div class="table-cell-content table-cell-content--numeric"><strong>${escape(value)}%</strong>${ui.progress(value, tone)}</div>`;
  }

  function orderAction(index) {
    return `<button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-order="${index}">Заказать</button>`;
  }

  const procurementCategoryLabels = ["Буровой инструмент", "Кабель и электро", "Насосы", "Гидравлика", "ГСМ"];
  const procurementDepartmentLabels = ["Цех энергетики", "Цех буровых работ", "Цех обогащения", "Цех ГСМ", "Бухгалтерия"];

  const egpzForecastSeries = [
    { label: "Октябрь", className: "series-orange" },
    { label: "Ноябрь", className: "series-turquoise" },
    { label: "Декабрь", className: "series-purple" }
  ];

  const egpzForecastValues = [
    [28, 8, 5],
    [9, 10, 9],
    [12, 11, 13],
    [7, 7, 6],
    [10, 9, 8]
  ];
  const egpzForecastRowsByMode = {
    category: procurementCategoryLabels.map((label, index) => ({ label, values: egpzForecastValues[index] })),
    department: procurementDepartmentLabels.map((label, index) => ({ label, values: egpzForecastValues[index] }))
  };
  const egpzForecastGroupLabels = {
    category: "категориям",
    department: "подразделениям"
  };
  let egpzForecastMode = "category";

  function syncEgpzForecastTabs() {
    const panel = document.querySelector("[data-egpz-forecast-panel]");
    document.querySelectorAll("[data-egpz-forecast-tab]").forEach(tab => {
      const active = tab.dataset.egpzForecastTab === egpzForecastMode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && panel && tab.id) panel.setAttribute("aria-labelledby", tab.id);
    });
  }

  function setEgpzForecastMode(mode) {
    if (!egpzForecastRowsByMode[mode]) return;
    egpzForecastMode = mode;
    renderEgpzForecastChart();
  }

  function renderEgpzForecastChart() {
    const chart = document.querySelector("[data-egpz-forecast-chart]");
    const legend = document.querySelector("[data-egpz-forecast-legend]");
    if (!chart || !legend) return;

    const rowsData = egpzForecastRowsByMode[egpzForecastMode] || egpzForecastRowsByMode.category;
    const groupLabel = egpzForecastGroupLabels[egpzForecastMode] || egpzForecastGroupLabels.category;
    const axisMax = 50;
    const axisStep = 10;
    const tickCount = Math.round(axisMax / axisStep) + 1;
    const ticks = Array.from({ length: tickCount }, (_, index) => {
      const value = index * axisStep;
      return `<span>${value === 0 ? "0" : `${value}M`}</span>`;
    }).join("");
    const grid = Array.from({ length: tickCount - 1 }, () => "<span></span>").join("");
    const rows = rowsData.map(row => {
      const label = escape(row.label);
      const tracks = row.values.map((value, index) => {
        const series = egpzForecastSeries[index];
        const width = value / axisMax * 100;
        const valueLabel = `${value}M`;
        return `<span class="payment-deviation-chart__track" style="--payment-deviation-value:${width}%"><i class="payment-deviation-chart__bar ${series.className}"></i><strong class="payment-deviation-chart__value">${escape(valueLabel)}</strong></span>`;
      }).join("");
      const aria = row.values.map((value, index) => `${egpzForecastSeries[index].label} ${value}M`).join(", ");
      return `<div class="payment-deviation-chart__row" role="img" aria-label="${label}: ${escape(aria)}">
        <span class="payment-deviation-chart__label" title="${label}">${label}</span>
        <span class="payment-deviation-chart__tracks" aria-hidden="true">${tracks}</span>
      </div>`;
    }).join("");

    chart.style.setProperty("--payment-deviation-divisions", String(tickCount - 1));
    chart.innerHTML = `<div class="payment-deviation-chart__axis" aria-hidden="true">${ticks}</div><div class="chart-viewport__plot chart-scrollbar"><div class="payment-deviation-chart__body"><div class="payment-deviation-chart__grid" aria-hidden="true">${grid}</div><div class="payment-deviation-chart__rows">${rows}</div></div></div>`;
    chart.setAttribute("aria-label", `Прогноз закупок по ${groupLabel}: ${egpzForecastSeries.map(item => item.label.toLocaleLowerCase("ru-RU")).join(", ")}`);
    legend.innerHTML = egpzForecastSeries.map(item => `<span><i class="chart-legend__dot ${item.className}" aria-hidden="true"></i>${escape(item.label)}</span>`).join("");
    syncEgpzForecastTabs();
  }

  const planFactSeries = [
    { label: "План", className: "series-crude" },
    { label: "Факт - экономия", className: "series-gas" },
    { label: "Факт - перерасход", className: "series-negative" }
  ];
  const planFactRowsByMode = {
    category: procurementCategoryLabels.map((label, index) => {
      const values = [
        [28, 26],
        [9, 10],
        [12, 11],
        [7, 8],
        [10, 9]
      ][index];
      return { label, plan: values[0], fact: values[1] };
    }),
    department: procurementDepartmentLabels.map((label, index) => {
      const values = [
        [30, 28],
        [20, 21],
        [25, 26],
        [15, 14],
        [10, 9.8]
      ][index];
      return { label, plan: values[0], fact: values[1] };
    })
  };
  const budgetDeviationRowsByMode = {
    category: procurementCategoryLabels.map((label, index) => {
      const values = [
        [-12, 12000000, 11000000],
        [-9, 10000000, 9100000],
        [8, 12000000, 13000000],
        [7, 7000000, 7500000],
        [-10, 10000000, 9000000]
      ][index];
      return { label, deviation: values[0], plan: values[1], fact: values[2] };
    }),
    department: procurementDepartmentLabels.map((label, index) => {
      const values = [
        [-18, 30000000, 24600000],
        [6, 20000000, 21200000],
        [5, 25000000, 26250000],
        [-4, 15000000, 14400000],
        [-1, 10000000, 9900000]
      ][index];
      return { label, deviation: values[0], plan: values[1], fact: values[2] };
    })
  };
  const annualForecastSeries = [
    { label: "Годовой (план + прогноз)", className: "procurement-annual-chart__dot--year" },
    { label: "Q1 (план)", className: "series-turquoise" },
    { label: "Q2 (план)", className: "series-soft-blue" },
    { label: "Q3 (план)", className: "series-purple" },
    { label: "Q4 (прогноз)", className: "series-orange" }
  ];
  const annualForecastPlotHeight = 212;
  const annualForecastColors = ["#2D9CED", "#2D9CED", "#82BAE7", "#705AC8", "#F38B40"];
  const annualForecastSvgNamespace = "http://www.w3.org/2000/svg";

  const annualForecastRowsByMode = {
    category: procurementCategoryLabels.map((label, index) => {
      const values = [
        [142, 34, 36, 33, 39],
        [100, 24, 25, 23, 28],
        [126, 30, 31, 29, 36],
        [70, 17, 18, 16, 19],
        [94, 22, 24, 23, 25]
      ][index];
      return { label, values };
    }),
    department: procurementDepartmentLabels.map((label, index) => {
      const values = [
        [132, 32, 34, 30, 36],
        [118, 28, 30, 27, 33],
        [146, 35, 37, 33, 41],
        [82, 19, 21, 18, 24],
        [74, 18, 17, 19, 20]
      ][index];
      return { label, values };
    })
  };
  const stockBalanceRowsByMode = {
    category: procurementCategoryLabels.map((label, index) => {
      const values = [24, 15, 18, 9, 12];
      return { label, segments: [{ label: "Остатки", value: values[index], className: "series-turquoise" }] };
    }),
    department: procurementDepartmentLabels.map((label, index) => {
      const values = [28, 21, 24, 14, 11];
      return { label, segments: [{ label: "Остатки", value: values[index], className: "series-turquoise" }] };
    })
  };
  const stockReserveRowsByMode = {
    category: procurementCategoryLabels.map((label, index) => {
      const values = [
        [17, 7],
        [11.5, 3.5],
        [12.5, 5.5],
        [7.5, 2],
        [9, 3.5]
      ][index];
      return {
        label,
        segments: [
          { label: "Свободно", value: values[0], className: "series-gas" },
          { label: "В резерве", value: values[1], className: "series-orange" }
        ]
      };
    }),
    department: procurementDepartmentLabels.map((label, index) => {
      const values = [
        [18, 6],
        [13, 5],
        [15, 5],
        [8, 3],
        [7, 2.5]
      ][index];
      return {
        label,
        segments: [
          { label: "Свободно", value: values[0], className: "series-gas" },
          { label: "В резерве", value: values[1], className: "series-orange" }
        ]
      };
    })
  };
  const stockOccupancyRows = [
    { label: "Рудник QazAltyn-1", segments: [
      { label: "Занято", value: 92, className: "series-negative" },
      { label: "Свободно", value: 0, className: "series-gas" },
      { label: "В резерве", value: 30, className: "series-orange" }
    ] },
    { label: "Фабрика QazOre-East", segments: [
      { label: "Занято", value: 70, className: "series-negative" },
      { label: "Свободно", value: 10, className: "series-gas" },
      { label: "В резерве", value: 20, className: "series-orange" }
    ] },
    { label: "База ГСМ", segments: [
      { label: "Занято", value: 55, className: "series-negative" },
      { label: "Свободно", value: 30, className: "series-gas" },
      { label: "В резерве", value: 15, className: "series-orange" }
    ] },
    { label: "Склад SpareParts-7", segments: [
      { label: "Занято", value: 65, className: "series-negative" },
      { label: "Свободно", value: 7, className: "series-gas" },
      { label: "В резерве", value: 28, className: "series-orange" }
    ] },
    { label: "Логист. хаб", segments: [
      { label: "Занято", value: 70, className: "series-negative" },
      { label: "Свободно", value: 0, className: "series-gas" },
      { label: "В резерве", value: 32, className: "series-orange" }
    ] },
    { label: "ЦС QazSupply", segments: [
      { label: "Занято", value: 78, className: "series-negative" },
      { label: "Свободно", value: 8, className: "series-gas" },
      { label: "В резерве", value: 16, className: "series-orange" }
    ] }
  ];
  const turnoverCategoryRows = [
    { label: "Буровой инструмент", days: 42 },
    { label: "Кабель и электрооборудование", days: 32 },
    { label: "Насосное оборудование", days: 55 },
    { label: "Гидравлика", days: 30 },
    { label: "ГСМ", days: 18 }
  ];
  const slowTurnoverLegend = [
    { label: "до 60 дней", className: "procurement-slow-turnover-chart__dot--green" },
    { label: "60-70 дней", className: "procurement-slow-turnover-chart__dot--orange" },
    { label: ">70 дней", className: "procurement-slow-turnover-chart__dot--red" }
  ];
  const slowTurnoverPoints = [
    { title: "Насос НК-200", code: "НК-200 №123456789", image: "/assets/procurement-pump-nk-200.png", days: 78, amount: 3400000, quantity: "1 шт.", x: 78, size: 112, tone: "red" },
    { title: "Гидроцилиндр ГЦ-80", code: "ГЦ-80 №884201", image: "/assets/procurement-hydraulic-cylinder-gc-80.png", days: 60, amount: 1800000, quantity: "2 шт.", x: 60, size: 60, tone: "orange" },
    { title: "Клапан предохранительный К-24", code: "К-24-150 №556102", image: "/assets/procurement-valve-k-24.png", days: 72, amount: 1050000, quantity: "1 шт.", x: 72, size: 28, tone: "red" },
    { title: "Подшипник 6312", code: "SKF-6312 №440219", image: "/assets/procurement-bearing-6312.png", days: 55, amount: 1400000, quantity: "8 шт.", x: 55, size: 42, tone: "green" },
    { title: "Уплотнение торцевое", code: "MTG-45 №771004", image: "/assets/procurement-seal-mtg-45.png", days: 57, amount: 730000, quantity: "4 шт.", x: 57, size: 16, tone: "green" }
  ];
  const analysisRecommendations = [
    { text: "Провести проверку корректности расчётов по группе «Энергетика»: перерасход 1 300 000 KZT (-0,6 %)", titleWords: 2, action: "Создать задачу" },
    { text: "Объединить поставки механических и автоматических узлов в единый тендер для снижения цены поставки на 1–2 %", titleWords: 2, action: "Создать задачу" },
    { text: "Пересмотреть график платежей по электрическим позициям, чтобы равномерно распределить нагрузку по бюджету", titleWords: 3, action: "Создать задачу" },
    { text: "Подготовить план закупок на Q1 2025 с учётом фактических цен и динамики по Q4 2024", titleWords: 3, action: "Создать проект плана" }
  ];
  const analysisDeviationChart = [
    { month: "Октябрь", plan: 221400000, fact: 225100000, deviation: 1.7 },
    { month: "Ноябрь", plan: 224800000, fact: 223900000, deviation: -0.4 },
    { month: "Декабрь", plan: 228700000, fact: 227400000, deviation: -0.6 }
  ];
  const analysisExpenseShare = [
    { label: "Механика", value: 116900000, percent: 52.82, className: "series-crude" },
    { label: "Электрика", value: 29000000, percent: 13.1, className: "series-secondary" },
    { label: "Автоматика", value: 19800000, percent: 8.95, className: "series-gas" },
    { label: "Энергетика", value: 55600000, percent: 25.12, className: "series-light" }
  ];
  const analysisTopDeviationRows = [
    { item: "Трансформатор ТМ-100", group: "Энергетика", deviation: -0.4, amount: -505000, plan: 117000000, fact: 117505000 },
    { item: "Электродвигатель 11 кВт", group: "Электрика", deviation: -0.9, amount: -300000, plan: 28000000, fact: 28300000 },
    { item: "Датчик АД-10", group: "Автоматика", deviation: -0.9, amount: -195000, plan: 20000000, fact: 20195000 },
    { item: "Подшипник 205-76", group: "Механика", deviation: -1.0, amount: -450000, plan: 45000000, fact: 45450000 },
    { item: "Прокладка Ø50", group: "Механика", deviation: -1.5, amount: -150000, plan: 10000000, fact: 10150000 }
  ];
  const planFactGroupLabels = {
    category: "категориям",
    department: "подразделениям"
  };
  let planFactMode = "department";
  let budgetDeviationMode = "category";
  let annualForecastMode = "category";
  let stockBalanceMode = "category";
  let stockReserveMode = "category";
  let purchasePart = null;

  function formatMetricM(value) {
    return Number.isInteger(value) ? `${value}M` : `${String(value).replace(".", ",")}M`;
  }

  function formatTooltipAmount(value) {
    return new Intl.NumberFormat("ru-RU").format(value);
  }

  function formatTooltipMoney(value) {
    return `${formatTooltipAmount(value)} ₸`;
  }

  function chartTooltipAttributes(title, label, value, detail = "") {
    const detailAttr = detail ? ` data-chart-tooltip-detail="${escape(detail)}"` : "";
    return `data-chart-tooltip data-chart-tooltip-title="${escape(title)}" data-chart-tooltip-label="${escape(label)}" data-chart-tooltip-value="${escape(value)}"${detailAttr}`;
  }

  function syncTabSet(selector, activeValue, panelSelector) {
    const panel = document.querySelector(panelSelector);
    document.querySelectorAll(selector).forEach(tab => {
      const value = tab.dataset.planFactTab || tab.dataset.budgetDeviationTab || tab.dataset.annualForecastTab || tab.dataset.stockBalanceTab || tab.dataset.stockReserveTab;
      const active = value === activeValue;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && panel && tab.id) panel.setAttribute("aria-labelledby", tab.id);
    });
  }

  function renderPlanFactChart() {
    const chart = document.querySelector("[data-plan-fact-chart]");
    const legend = document.querySelector("[data-plan-fact-legend]");
    if (!chart || !legend) return;

    const rowsData = planFactRowsByMode[planFactMode] || planFactRowsByMode.department;
    const axisMax = 40;
    const axisStep = 10;
    const tickCount = Math.round(axisMax / axisStep) + 1;
    const ticks = Array.from({ length: tickCount }, (_, index) => {
      const value = index * axisStep;
      return `<span>${value === 0 ? "0" : `${value}M`}</span>`;
    }).join("");
    const grid = Array.from({ length: tickCount - 1 }, () => "<span></span>").join("");
    const rows = rowsData.map(row => {
      const planWidth = Math.min(100, row.plan / axisMax * 100);
      const factWidth = Math.min(100, row.fact / axisMax * 100);
      const factClass = row.fact <= row.plan ? "series-gas" : "series-negative";
      const factLabel = row.fact <= row.plan ? "экономия" : "перерасход";
      return `<div class="procurement-plan-fact-chart__row" role="img" aria-label="${escape(row.label)}: план ${formatMetricM(row.plan)}, факт ${formatMetricM(row.fact)}, ${factLabel}">
        <span class="procurement-plan-fact-chart__label">${escape(row.label)}</span>
        <span class="procurement-plan-fact-chart__tracks" aria-hidden="true">
          <span class="procurement-plan-fact-chart__track" style="--procurement-chart-value:${planWidth}%"><i class="procurement-plan-fact-chart__bar series-crude"></i><strong class="procurement-plan-fact-chart__value">${formatMetricM(row.plan)}</strong></span>
          <span class="procurement-plan-fact-chart__track" style="--procurement-chart-value:${factWidth}%"><i class="procurement-plan-fact-chart__bar ${factClass}"></i><strong class="procurement-plan-fact-chart__value">${formatMetricM(row.fact)}</strong></span>
        </span>
      </div>`;
    }).join("");

    chart.style.setProperty("--procurement-chart-divisions", String(tickCount - 1));
    chart.innerHTML = `<div class="procurement-plan-fact-chart__axis" aria-hidden="true">${ticks}</div><div class="chart-viewport__plot chart-scrollbar"><div class="procurement-plan-fact-chart__body"><div class="procurement-plan-fact-chart__grid" aria-hidden="true">${grid}</div><div class="procurement-plan-fact-chart__rows">${rows}</div></div></div>`;
    chart.setAttribute("aria-label", `План vs Факт по ${planFactGroupLabels[planFactMode] || planFactGroupLabels.department}`);
    legend.innerHTML = planFactSeries.map(item => `<span><i class="chart-legend__dot ${item.className}" aria-hidden="true"></i>${escape(item.label)}</span>`).join("");
    syncTabSet("[data-plan-fact-tab]", planFactMode, "[data-plan-fact-panel]");
  }

  function renderBudgetDeviationChart() {
    const chart = document.querySelector("[data-budget-deviation-chart]");
    const legend = document.querySelector("[data-budget-deviation-legend]");
    if (!chart || !legend) return;

    const rowsData = budgetDeviationRowsByMode[budgetDeviationMode] || budgetDeviationRowsByMode.category;
    const axisMin = -20;
    const axisMax = 20;
    const axisStep = 10;
    const axisRange = axisMax - axisMin;
    const divisionCount = Math.round(axisRange / axisStep);
    const zeroGridIndex = Math.round((0 - axisMin) / axisStep);
    const ticks = Array.from({ length: divisionCount + 1 }, (_, index) => {
      const value = axisMin + index * axisStep;
      return `<span>${value === 0 ? "0%" : `${value}%`}</span>`;
    }).join("");
    const grid = Array.from({ length: divisionCount }, (_, index) => `<span class="${index === zeroGridIndex ? "is-zero" : ""}"></span>`).join("");
    const rows = rowsData.map(row => {
      const value = Math.max(axisMin, Math.min(axisMax, row.deviation));
      const width = Math.abs(value) / axisRange * 100;
      const left = value < 0 ? 50 - width : 50;
      const toneClass = value <= 0 ? "series-gas" : "series-negative";
      const tone = value <= 0 ? "green" : "red";
      const label = `${value > 0 ? "+" : ""}${value}%`;
      const ariaTone = value <= 0 ? "экономия" : "перерасход";
      return `<div class="procurement-budget-deviation-chart__row" role="img" aria-label="${escape(row.label)}: ${label}, ${ariaTone}">
        <span class="procurement-budget-deviation-chart__label">${escape(row.label)}</span>
        <span class="procurement-budget-deviation-chart__range" data-budget-deviation-bar data-label="${escape(row.label)}" data-plan="${row.plan}" data-fact="${row.fact}" data-deviation="${value}" data-tone="${tone}" tabindex="0" role="img" aria-label="${escape(row.label)}: ${label}, ${ariaTone}">
          <span class="procurement-budget-deviation-chart__bar ${toneClass}" style="--procurement-deviation-left:${left}%;--procurement-deviation-width:${width}%" aria-hidden="true"></span>
        </span>
      </div>`;
    }).join("");

    chart.style.setProperty("--procurement-budget-divisions", String(divisionCount));
    chart.innerHTML = `<div class="procurement-budget-deviation-chart__axis" aria-hidden="true">${ticks}</div><div class="chart-viewport__plot chart-scrollbar"><div class="procurement-budget-deviation-chart__body"><div class="procurement-budget-deviation-chart__grid" aria-hidden="true">${grid}</div><div class="procurement-budget-deviation-chart__rows">${rows}</div></div></div>`;
    chart.setAttribute("aria-label", `Отклонение по бюджету по ${planFactGroupLabels[budgetDeviationMode] || planFactGroupLabels.category}`);
    legend.innerHTML = [
      { label: "Экономия", className: "series-gas" },
      { label: "Перерасход", className: "series-negative" }
    ].map(item => `<span><i class="chart-legend__dot ${item.className}" aria-hidden="true"></i>${escape(item.label)}</span>`).join("");
    syncTabSet("[data-budget-deviation-tab]", budgetDeviationMode, "[data-budget-deviation-panel]");
  }

  function getAnnualBarHeight(value, axisMax) {
    return Math.max(2, Math.min(annualForecastPlotHeight, value / axisMax * annualForecastPlotHeight));
  }

  function renderAnnualBarSvg(height, color, striped, clipId) {
    const safeHeight = Math.max(2, Number(height) || 2);
    const svgHeight = Number(safeHeight.toFixed(2));
    const capHeight = Math.min(3, svgHeight);
    const bodyY = Math.min(0.430664, Math.max(0, svgHeight - capHeight));
    const bodyHeight = Math.max(0, svgHeight - bodyY);

    if (striped) {
      const lineHeight = Math.max(1, svgHeight - 1);
      const clipHeight = Math.max(1, svgHeight - 0.73);
      return `<svg xmlns="${annualForecastSvgNamespace}" width="24" height="${svgHeight}" viewBox="0 0 24 ${svgHeight}" fill="none" preserveAspectRatio="none"><g clip-path="url(#${clipId})"><line opacity="0.8" x1="100" x2="100" y2="${lineHeight}" stroke="${color}" stroke-width="200" stroke-dasharray="1 1"/><rect width="24" height="${capHeight}" fill="${color}"/></g><defs><clipPath id="${clipId}"><rect width="24" height="${clipHeight}" fill="white"/></clipPath></defs></svg>`;
    }

    return `<svg xmlns="${annualForecastSvgNamespace}" width="25" height="${svgHeight}" viewBox="0 0 25 ${svgHeight}" fill="none" preserveAspectRatio="none"><rect opacity="0.6" y="${bodyY}" width="24" height="${bodyHeight}" fill="${color}"/><rect y="${bodyY}" width="24" height="${capHeight}" fill="${color}"/></svg>`;
  }

  function renderAnnualBarSegment(value, axisMax, color, striped, clipId, tooltipAttrs = "") {
    const height = getAnnualBarHeight(value, axisMax);
    return `<span class="procurement-annual-chart__segment" style="height:${height.toFixed(2)}px" ${tooltipAttrs}>${renderAnnualBarSvg(height, color, striped, clipId)}</span>`;
  }

  function renderAnnualForecastChart() {
    const chart = document.querySelector("[data-annual-forecast-chart]");
    const legend = document.querySelector("[data-annual-forecast-legend]");
    if (!chart || !legend) return;

    const rowsData = annualForecastRowsByMode[annualForecastMode] || annualForecastRowsByMode.category;
    const groupLabel = planFactGroupLabels[annualForecastMode] || planFactGroupLabels.category;
    const axisMax = 200;
    const axisStep = 40;
    const tickCount = Math.round(axisMax / axisStep) + 1;
    const axisTicks = Array.from({ length: tickCount }, (_, index) => {
      const value = index * axisStep;
      const position = 100 - value / axisMax * 100;
      return `<span style="--procurement-annual-tick:${position}%">${value === 0 ? "0" : `${value}M`}</span>`;
    }).join("");
    const gridY = Array.from({ length: tickCount }, (_, index) => {
      const value = index * axisStep;
      const position = 100 - value / axisMax * 100;
      return `<span style="--procurement-annual-tick:${position}%"></span>`;
    }).join("");
    const gridX = Array.from({ length: rowsData.length }, () => "<span></span>").join("");
    const groups = rowsData.map((row, rowIndex) => {
      const bars = row.values.map((value, index) => {
        const series = annualForecastSeries[index];
        const color = annualForecastColors[index] || annualForecastColors[0];
        const clipId = `annual-forecast-stripes-${annualForecastMode}-${rowIndex}-${index}`;

        if (index === 0) {
          const planned = row.values.slice(1, 4).reduce((sum, item) => sum + item, 0);
          const forecast = row.values[4] || 0;
          const plannedSegment = renderAnnualBarSegment(planned, axisMax, color, false, `${clipId}-plan`, chartTooltipAttributes(row.label, "План Q1-Q3", formatMetricM(planned), `Годовой: ${formatMetricM(value)}`));
          const forecastSegment = renderAnnualBarSegment(forecast, axisMax, color, true, `${clipId}-forecast`, chartTooltipAttributes(row.label, "Прогноз Q4", formatMetricM(forecast), `Годовой: ${formatMetricM(value)}`));
          return `<span class="procurement-annual-chart__bar procurement-annual-chart__bar--year">${forecastSegment}${plannedSegment}</span>`;
        }

        const height = getAnnualBarHeight(value, axisMax);
        const striped = index === 4;
        return `<span class="procurement-annual-chart__bar ${series.className}" style="--procurement-annual-bar-height:${height.toFixed(2)}px" ${chartTooltipAttributes(row.label, series.label, formatMetricM(value))}>${renderAnnualBarSvg(height, color, striped, clipId)}</span>`;
      }).join("");
      const aria = row.values.map((value, index) => `${annualForecastSeries[index].label} ${value}M`).join(", ");
      return `<div class="procurement-annual-chart__group" role="img" aria-label="${escape(row.label)}: ${escape(aria)}">${bars}</div>`;
    }).join("");
    const labels = rowsData.map(row => `<span class="procurement-annual-chart__label">${escape(row.label)}</span>`).join("");

    chart.style.setProperty("--procurement-annual-groups", String(rowsData.length));
    chart.innerHTML = `<div class="procurement-annual-chart__axis-y" aria-hidden="true">${axisTicks}</div><div class="procurement-annual-chart__plot"><div class="procurement-annual-chart__grid-y" aria-hidden="true">${gridY}</div><div class="procurement-annual-chart__grid-x" aria-hidden="true">${gridX}</div><div class="procurement-annual-chart__groups">${groups}</div></div><span aria-hidden="true"></span><div class="procurement-annual-chart__labels">${labels}</div>`;
    chart.setAttribute("aria-label", `Годовой прогноз закупок по ${groupLabel}`);
    legend.innerHTML = annualForecastSeries.map(item => `<span><i class="chart-legend__dot ${item.className}" aria-hidden="true"></i>${escape(item.label)}</span>`).join("");
    syncTabSet("[data-annual-forecast-tab]", annualForecastMode, "[data-annual-forecast-panel]");
  }

  function setPlanFactMode(mode) {
    if (!planFactRowsByMode[mode]) return;
    planFactMode = mode;
    renderPlanFactChart();
  }

  function setBudgetDeviationMode(mode) {
    if (!budgetDeviationRowsByMode[mode]) return;
    budgetDeviationMode = mode;
    hideBudgetDeviationTooltip();
    renderBudgetDeviationChart();
  }

  function setAnnualForecastMode(mode) {
    if (!annualForecastRowsByMode[mode]) return;
    annualForecastMode = mode;
    hideChartTooltip(document.querySelector("[data-annual-forecast-panel]") || document);
    renderAnnualForecastChart();
  }

  function formatStockChartValue(value, unit = "money") {
    return unit === "percent" ? `${String(value).replace(".", ",")}%` : formatMetricM(value);
  }

  function renderStockChart({ chartSelector, legendSelector, rowsData, legendItems, axisMax, axisStep, unit = "money", ariaLabel, tabSelector, panelSelector, activeMode }) {
    const chart = document.querySelector(chartSelector);
    const legend = document.querySelector(legendSelector);
    if (!chart || !legend) return;

    const tickCount = Math.round(axisMax / axisStep) + 1;
    const ticks = Array.from({ length: tickCount }, (_, index) => {
      const value = index * axisStep;
      return `<span>${value === 0 ? "0" : unit === "percent" ? value : `${value}M`}</span>`;
    }).join("");
    const grid = Array.from({ length: tickCount - 1 }, () => "<span></span>").join("");
    const rows = rowsData.map(row => {
      const rowTitle = row.segments.map(segment => `${segment.label}: ${formatStockChartValue(segment.value, unit)}`).join("; ");
      const segments = row.segments.filter(segment => segment.value > 0).map(segment => {
        const width = Math.min(100, segment.value / axisMax * 100);
        const valueLabel = formatStockChartValue(segment.value, unit);
        const aria = `${row.label}: ${segment.label} ${valueLabel}`;
        return `<span class="procurement-stock-chart__segment ${segment.className}" style="--procurement-stock-segment:${width}%" ${chartTooltipAttributes(row.label, segment.label, valueLabel)} aria-label="${escape(aria)}"></span>`;
      }).join("");
      return `<div class="procurement-stock-chart__row" role="img" aria-label="${escape(row.label)}: ${escape(rowTitle)}">
        <span class="procurement-stock-chart__label">${escape(row.label)}</span>
        <span class="procurement-stock-chart__track">${segments}</span>
      </div>`;
    }).join("");
    chart.style.setProperty("--procurement-stock-divisions", String(tickCount - 1));
    chart.innerHTML = `<div class="procurement-stock-chart__axis" aria-hidden="true">${ticks}</div><div class="chart-viewport__plot chart-scrollbar"><div class="procurement-stock-chart__body"><div class="procurement-stock-chart__grid" aria-hidden="true">${grid}</div><div class="procurement-stock-chart__rows">${rows}</div></div></div>`;
    chart.setAttribute("aria-label", ariaLabel);
    legend.innerHTML = legendItems.map(item => `<span><i class="chart-legend__dot ${item.className}" aria-hidden="true"></i>${escape(item.label)}</span>`).join("");
    if (tabSelector && panelSelector) syncTabSet(tabSelector, activeMode, panelSelector);
  }

  function renderStockBalanceChart() {
    renderStockChart({
      chartSelector: "[data-stock-balance-chart]",
      legendSelector: "[data-stock-balance-legend]",
      rowsData: stockBalanceRowsByMode[stockBalanceMode] || stockBalanceRowsByMode.category,
      legendItems: [{ label: "Остатки", className: "series-turquoise" }],
      axisMax: 30,
      axisStep: 5,
      ariaLabel: `Остатки по ${planFactGroupLabels[stockBalanceMode] || planFactGroupLabels.category}`,
      tabSelector: "[data-stock-balance-tab]",
      panelSelector: "[data-stock-balance-panel]",
      activeMode: stockBalanceMode
    });
  }

  function renderStockReserveChart() {
    renderStockChart({
      chartSelector: "[data-stock-reserve-chart]",
      legendSelector: "[data-stock-reserve-legend]",
      rowsData: stockReserveRowsByMode[stockReserveMode] || stockReserveRowsByMode.category,
      legendItems: [
        { label: "Свободно", className: "series-gas" },
        { label: "В резерве", className: "series-orange" }
      ],
      axisMax: 25,
      axisStep: 5,
      ariaLabel: `Доля резерва по ${planFactGroupLabels[stockReserveMode] || planFactGroupLabels.category}`,
      tabSelector: "[data-stock-reserve-tab]",
      panelSelector: "[data-stock-reserve-panel]",
      activeMode: stockReserveMode
    });
  }

  function renderStockOccupancyChart() {
    renderStockChart({
      chartSelector: "[data-stock-occupancy-chart]",
      legendSelector: "[data-stock-occupancy-legend]",
      rowsData: stockOccupancyRows,
      legendItems: [
        { label: "Занято", className: "series-negative" },
        { label: "Свободно", className: "series-gas" },
        { label: "В резерве", className: "series-orange" }
      ],
      axisMax: 125,
      axisStep: 25,
      unit: "percent",
      ariaLabel: "Занятость складов"
    });
  }

  function renderTurnoverCategoryChart() {
    const chart = document.querySelector("[data-turnover-category-chart]");
    const legend = document.querySelector("[data-turnover-category-legend]");
    if (!chart || !legend) return;

    const axisMax = 80;
    const axisStep = 20;
    const tickCount = Math.round(axisMax / axisStep) + 1;
    const ticks = Array.from({ length: tickCount }, (_, index) => {
      const value = index * axisStep;
      return `<span>${value}</span>`;
    }).join("");
    const grid = Array.from({ length: tickCount - 1 }, () => "<span></span>").join("");
    const rows = turnoverCategoryRows.map(row => {
      const width = Math.min(100, row.days / axisMax * 100);
      return `<div class="procurement-turnover-bar-chart__row" role="img" aria-label="${escape(row.label)}: ${row.days} дней">
        <span class="procurement-turnover-bar-chart__label">${escape(row.label)}</span>
        <span class="procurement-turnover-bar-chart__track" style="--procurement-turnover-value:${width}%">
          <i class="procurement-turnover-bar-chart__bar series-turquoise" aria-hidden="true"></i>
          <strong class="procurement-turnover-bar-chart__value">${row.days}</strong>
        </span>
      </div>`;
    }).join("");
    chart.style.setProperty("--procurement-turnover-divisions", String(tickCount - 1));
    chart.innerHTML = `<div class="procurement-turnover-bar-chart__axis" aria-hidden="true">${ticks}</div><div class="chart-viewport__plot chart-scrollbar"><div class="procurement-turnover-bar-chart__body"><div class="procurement-turnover-bar-chart__grid" aria-hidden="true">${grid}</div><div class="procurement-turnover-bar-chart__rows">${rows}</div></div></div>`;
    legend.innerHTML = `<span><i class="chart-legend__dot series-turquoise" aria-hidden="true"></i>${escape("Дни оборачиваемости")}</span>`;
  }

  function renderSlowTurnoverChart() {
    const chart = document.querySelector("[data-slow-turnover-chart]");
    const legend = document.querySelector("[data-slow-turnover-legend]");
    if (!chart || !legend) return;

    const axisMaxY = 4000000;
    const yTicks = [4000000, 3200000, 2400000, 1600000, 800000, 0];
    const xTicks = [0, 20, 40, 60, 80, 100];
    const axisY = yTicks.map(value => {
      const top = 100 - value / axisMaxY * 100;
      return `<span style="--procurement-slow-y:${top}%">${formatTooltipAmount(value)}</span>`;
    }).join("");
    const axisX = xTicks.map(value => `<span>${value}</span>`).join("");
    const gridY = yTicks.map(value => {
      const top = 100 - value / axisMaxY * 100;
      return `<span style="--procurement-slow-y:${top}%"></span>`;
    }).join("");
    const gridX = xTicks.map(value => `<span style="--procurement-slow-x:${value}%"></span>`).join("");
    const bubbles = slowTurnoverPoints.map((point, index) => {
      const y = 100 - point.amount / axisMaxY * 100;
      const aria = `${point.title}: ${point.days} дней хранения, остаток ${formatTooltipMoney(point.amount)}, количество ${point.quantity}`;
      return `<button class="procurement-slow-turnover-chart__bubble procurement-slow-turnover-chart__bubble--${point.tone}" type="button" style="--procurement-slow-x:${point.x}%;--procurement-slow-y:${y}%;--procurement-slow-size:${point.size}px" data-slow-turnover-point="${index}" aria-label="${escape(aria)}"></button>`;
    }).join("");

    chart.innerHTML = `<div class="procurement-slow-turnover-chart__axis-y" aria-hidden="true">${axisY}</div>
      <div class="procurement-slow-turnover-chart__plot">
        <div class="procurement-slow-turnover-chart__grid-y" aria-hidden="true">${gridY}</div>
        <div class="procurement-slow-turnover-chart__grid-x" aria-hidden="true">${gridX}</div>
        <div class="procurement-slow-turnover-chart__bubbles">${bubbles}</div>
      </div>
      <span aria-hidden="true"></span>
      <div class="procurement-slow-turnover-chart__axis-x" aria-hidden="true">${axisX}</div>`;
    legend.innerHTML = slowTurnoverLegend.map(item => `<span><i class="chart-legend__dot ${item.className}" aria-hidden="true"></i>${escape(item.label)}</span>`).join("");
  }

  function splitAnalysisRecommendation(item) {
    const words = String(item.text || "").trim().split(/\s+/).filter(Boolean);
    const titleLength = Math.max(2, Math.min(3, Number(item.titleWords) || 3));
    return {
      title: words.slice(0, titleLength).join(" "),
      text: words.slice(titleLength).join(" ")
    };
  }

  function renderAnalysisRecommendations() {
    const list = document.querySelector("[data-procurement-analysis-actions]");
    if (!list) return;
    list.innerHTML = analysisRecommendations.map((item, index) => {
      const content = splitAnalysisRecommendation(item);
      return `<li class="payment-risk-item" style="--payment-risk-color: var(--icons-default); --payment-risk-marker-color: var(--text-tertiary)">
        <span class="payment-risk-item__marker typography-indicator-small" aria-hidden="true">${index + 1}</span>
        <div class="payment-risk-item__content table-cell-content table-cell-content--with-pill">
          <div class="payment-risk-item__header table-header-content">
            <h4 class="payment-risk-item__title typography-label-smallest">${escape(content.title)}</h4>
            <p class="payment-risk-item__note typography-body-smallest">${escape(content.text)}</p>
          </div>
          <a class="pill pill--default pill--round payment-risk-item__action typography-body-smallest" href="/projects" aria-label="${escape(item.action)}: ${escape(content.title)}">
            <span class="pill__title">${escape(item.action)}</span>
            <svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#ArrowUpRight"></use></svg>
          </a>
        </div>
      </li>`;
    }).join("");
  }

  function renderAnalysisDeviationChart() {
    const chart = document.querySelector("[data-procurement-analysis-chart]");
    const legend = document.querySelector("[data-procurement-analysis-legend]");
    if (!chart) return;

    const width = 720;
    const height = 260;
    const margin = { top: 14, right: 18, bottom: 42, left: 108 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const axisMax = 300000000;
    const ticks = [0, 75000000, 150000000, 225000000, 300000000];
    const groupWidth = plotWidth / Math.max(1, analysisDeviationChart.length);
    const barWidth = Math.min(38, groupWidth * 0.18);
    const barGap = 6;
    const yForAmount = value => margin.top + (1 - Math.max(0, Math.min(axisMax, value)) / axisMax) * plotHeight;
    const xCenterFor = index => margin.left + groupWidth * index + groupWidth / 2;
    const svg = [];

    ticks.forEach(value => {
      const y = yForAmount(value);
      svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${y.toFixed(1)}" x2="${width - margin.right}" y2="${y.toFixed(1)}"></line>`);
      svg.push(`<text class="chart-bars__tick" x="${margin.left - 12}" y="${(y + 5).toFixed(1)}" text-anchor="end">${escape(formatTooltipAmount(value))}</text>`);
    });

    analysisDeviationChart.forEach((item, index) => {
      const x = margin.left + groupWidth * index;
      svg.push(`<line class="chart-bars__vertical-line" x1="${x.toFixed(1)}" y1="${margin.top}" x2="${x.toFixed(1)}" y2="${height - margin.bottom}"></line>`);
    });
    svg.push(`<line class="chart-bars__vertical-line" x1="${(width - margin.right).toFixed(1)}" y1="${margin.top}" x2="${(width - margin.right).toFixed(1)}" y2="${height - margin.bottom}"></line>`);
    svg.push(`<line class="chart-bars__axis-line" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>`);

    analysisDeviationChart.forEach((item, index) => {
      const center = xCenterFor(index);
      const planHeight = height - margin.bottom - yForAmount(item.plan);
      const factHeight = height - margin.bottom - yForAmount(item.fact);
      const planX = center - barWidth - barGap / 2;
      const factX = center + barGap / 2;
      svg.push(`<rect class="chart-bars__segment payment-risk-chart__bar--plan" x="${planX.toFixed(1)}" y="${yForAmount(item.plan).toFixed(1)}" width="${barWidth}" height="${planHeight.toFixed(1)}" role="img" aria-label="${escape(item.month)}, план: ${escape(formatTooltipAmount(item.plan))} KZT"></rect>`);
      svg.push(`<rect class="chart-bars__segment payment-risk-chart__bar--fact" x="${factX.toFixed(1)}" y="${yForAmount(item.fact).toFixed(1)}" width="${barWidth}" height="${factHeight.toFixed(1)}" role="img" aria-label="${escape(item.month)}, факт: ${escape(formatTooltipAmount(item.fact))} KZT"></rect>`);
      svg.push(`<text class="chart-bars__category" x="${center.toFixed(1)}" y="${height - margin.bottom + 28}" text-anchor="middle">${escape(item.month)}</text>`);
    });

    const linePoints = analysisDeviationChart.map((item, index) => ({
      x: xCenterFor(index),
      y: yForAmount(Math.max(item.plan, item.fact)),
      value: item.deviation
    }));
    svg.push(`<path class="financial-chart__line financial-chart__line--warning" d="${ui.chartLinePath(linePoints)}"></path>`);
    linePoints.forEach(point => {
      const label = `${String(point.value).replace(".", ",")}%`;
      svg.push(`<circle class="financial-chart__point financial-chart__point--warning" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" tabindex="0" role="img" aria-label="Отклонение: ${escape(label)}"></circle>`);
      svg.push(`<text class="payment-risk-chart__value payment-risk-chart__value--tertiary" x="${point.x.toFixed(1)}" y="${(point.y - 16).toFixed(1)}" text-anchor="middle">${escape(label)}</text>`);
    });

    chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    chart.innerHTML = svg.join("");
    if (legend) {
      legend.innerHTML = [
        `<span><i class="financial-chart__legend-dot financial-chart__legend-dot--secondary" aria-hidden="true"></i>${escape("План, KZT")}</span>`,
        `<span><i class="financial-chart__legend-dot financial-chart__legend-dot--primary" aria-hidden="true"></i>${escape("Факт, KZT")}</span>`,
        `<span><i class="financial-chart__legend-dot financial-chart__legend-dot--warning" aria-hidden="true"></i>${escape("Отклонение, %")}</span>`
      ].join("");
    }
  }

  function formatAnalysisPercent(value, minimumFractionDigits = 1, maximumFractionDigits = 1) {
    const numeric = Number(value) || 0;
    const formatter = new Intl.NumberFormat("ru-RU", { minimumFractionDigits, maximumFractionDigits });
    return `${formatter.format(numeric)}%`;
  }

  function formatSignedKzt(value) {
    const numeric = Number(value) || 0;
    const sign = numeric > 0 ? "+" : numeric < 0 ? "-" : "";
    return `${sign}${formatTooltipAmount(Math.abs(numeric))} KZT`;
  }

  function renderAnalysisExpenseShareChart() {
    const chart = document.querySelector("[data-procurement-expense-share-chart]");
    const legend = document.querySelector("[data-procurement-expense-share-legend]");
    if (!chart || !legend || !window.BNTCharts?.renderDonut) return;

    const total = analysisExpenseShare.reduce((sum, item) => sum + item.value, 0);
    const chartData = analysisExpenseShare.map(item => ({
      ...item,
      percent: formatAnalysisPercent(item.percent, 2, 2),
      chartLabel: formatTooltipAmount(item.value),
      chartLabelKind: "amount",
      chartValueParts: [{ text: formatAnalysisPercent(item.percent, 2, 2), kind: "percent" }]
    }));

    window.BNTCharts.renderDonut({
      chart,
      legend,
      data: chartData,
      legendData: chartData,
      accessibleLabel: "Доля расходов по группам ТМЦ и услуг",
      centerValue: formatMetricM(total / 1000000),
      unit: "KZT",
      height: 300,
      centerY: 142,
      maxOuterRadius: 120,
      innerRatio: .5,
      startAngle: 0
    });
  }

  function renderAnalysisDeviationTable() {
    const rows = document.querySelector("[data-procurement-analysis-deviation-rows]");
    if (!rows) return;

    rows.innerHTML = analysisTopDeviationRows.map(row => {
      const tone = row.deviation < 0 ? "is-negative" : row.deviation > 0 ? "is-positive" : "is-warning";
      return `<tr>
        <td>${textContent(row.item)}</td>
        <td>${textContent(row.group)}</td>
        <td class="data-table__percent-cell">
          <div class="table-number-content">
            <strong class="data-table__risk-value ${tone}">${escape(formatAnalysisPercent(row.deviation))}</strong>
            <small>${escape(formatSignedKzt(row.amount))}</small>
          </div>
        </td>
        <td class="data-table__numeric-cell table-number-cell">${numberContent(formatTooltipAmount(row.plan), "KZT")}</td>
        <td class="data-table__numeric-cell table-number-cell">${numberContent(formatTooltipAmount(row.fact), "KZT")}</td>
      </tr>`;
    }).join("");
  }

  function renderAnalysisBlock() {
    renderAnalysisRecommendations();
    renderAnalysisDeviationChart();
    renderAnalysisExpenseShareChart();
    renderAnalysisDeviationTable();
    window.requestAnimationFrame(() => {
      ui.bindTableBlockScrollbars?.(document.querySelector("[data-procurement-analysis-insights]"));
    });
  }

  function renderTurnoverCharts() {
    renderTurnoverCategoryChart();
    renderSlowTurnoverChart();
  }

  function setStockBalanceMode(mode) {
    if (!stockBalanceRowsByMode[mode]) return;
    stockBalanceMode = mode;
    hideChartTooltip(document.querySelector("[data-stock-balance-panel]") || document);
    renderStockBalanceChart();
  }

  function setStockReserveMode(mode) {
    if (!stockReserveRowsByMode[mode]) return;
    stockReserveMode = mode;
    hideChartTooltip(document.querySelector("[data-stock-reserve-panel]") || document);
    renderStockReserveChart();
  }

  function renderStockCharts() {
    renderStockBalanceChart();
    renderStockReserveChart();
    renderStockOccupancyChart();
    renderTurnoverCharts();
  }

  function renderBudgetCharts() {
    renderPlanFactChart();
    renderBudgetDeviationChart();
    renderAnnualForecastChart();
    renderStockCharts();
  }

  function positionChartTooltip(tooltip, viewport, anchor) {
    const viewportRect = viewport.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const gap = 8;
    let left = anchorRect.right - viewportRect.left + viewport.scrollLeft + gap;
    let top = anchorRect.top - viewportRect.top + viewport.scrollTop - tooltip.offsetHeight / 2 + anchorRect.height / 2;
    const maxLeft = viewport.scrollLeft + viewport.clientWidth - tooltip.offsetWidth - 8;
    if (left > maxLeft) left = anchorRect.left - viewportRect.left + viewport.scrollLeft - tooltip.offsetWidth - gap;
    const maxTop = viewport.scrollTop + viewport.clientHeight - tooltip.offsetHeight - 8;
    tooltip.style.left = `${Math.max(viewport.scrollLeft + 8, left)}px`;
    tooltip.style.top = `${Math.max(viewport.scrollTop + 8, Math.min(maxTop, top))}px`;
  }

  function hideChartTooltip(root = document) {
    root.querySelectorAll("[data-chart-tooltip-surface]").forEach(tooltip => {
      tooltip.hidden = true;
    });
  }

  function tooltipDetailRow(detail) {
    if (!detail) return "";
    const [label, ...rest] = detail.split(":");
    const value = rest.join(":").trim();
    return `<div><span>${escape(label.trim())}</span><strong>${escape(value)}</strong></div>`;
  }

  function showChartTooltip(anchor) {
    const viewport = anchor.closest(".chart-viewport");
    const tooltip = viewport?.querySelector("[data-chart-tooltip-surface]");
    if (!viewport || !tooltip) return;
    const title = anchor.dataset.chartTooltipTitle || "";
    const label = anchor.dataset.chartTooltipLabel || "";
    const value = anchor.dataset.chartTooltipValue || "";
    const detail = anchor.dataset.chartTooltipDetail || "";
    tooltip.innerHTML = `<strong class="chart-tooltip__title">${escape(title)}</strong>
      <div><span>${escape(label)}</span><strong>${escape(value)}</strong></div>
      ${tooltipDetailRow(detail)}`;
    tooltip.hidden = false;
    positionChartTooltip(tooltip, viewport, anchor);
  }

  function hideBudgetDeviationTooltip() {
    const tooltip = document.querySelector("[data-budget-deviation-tooltip]");
    if (tooltip) tooltip.hidden = true;
  }

  function hideSlowTurnoverTooltip() {
    const tooltip = document.querySelector("[data-slow-turnover-tooltip]");
    if (tooltip) tooltip.hidden = true;
  }

  function positionSlowTurnoverTooltip(tooltip, viewport, anchor) {
    const viewportRect = viewport.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const gap = 12;
    let left = anchorRect.left - viewportRect.left + viewport.scrollLeft - tooltip.offsetWidth * .45;
    let top = anchorRect.top - viewportRect.top + viewport.scrollTop - tooltip.offsetHeight - gap;
    const minLeft = viewport.scrollLeft + 8;
    const maxLeft = viewport.scrollLeft + viewport.clientWidth - tooltip.offsetWidth - 8;
    const minTop = viewport.scrollTop + 8;
    const maxTop = viewport.scrollTop + viewport.clientHeight - tooltip.offsetHeight - 8;
    if (top < minTop) top = anchorRect.bottom - viewportRect.top + viewport.scrollTop + gap;
    tooltip.style.left = `${Math.max(minLeft, Math.min(maxLeft, left))}px`;
    tooltip.style.top = `${Math.max(minTop, Math.min(maxTop, top))}px`;
  }

  function showSlowTurnoverTooltip(anchor) {
    const index = Number(anchor.dataset.slowTurnoverPoint);
    const point = slowTurnoverPoints[index];
    const viewport = document.querySelector("[data-slow-turnover-panel]");
    const tooltip = document.querySelector("[data-slow-turnover-tooltip]");
    if (!point || !viewport || !tooltip) return;
    tooltip.innerHTML = `<div class="procurement-turnover-tooltip__layout">
      <span class="procurement-turnover-tooltip__content">
        <span class="procurement-turnover-tooltip__copy">
          <strong class="procurement-turnover-tooltip__title">${escape(point.title)}</strong>
          <span class="procurement-turnover-tooltip__caption">${escape(point.code)}</span>
        </span>
        <span class="procurement-budget-tooltip__metrics procurement-turnover-tooltip__metrics">
          <span class="procurement-budget-tooltip__metric"><span>ОСТАТОК (₸)</span><strong>${formatTooltipAmount(point.amount)}</strong></span>
          <span class="procurement-budget-tooltip__divider" aria-hidden="true"></span>
          <span class="procurement-budget-tooltip__metric"><span>КОЛ-ВО</span><strong>${escape(point.quantity)}</strong></span>
        </span>
        <span class="procurement-budget-tooltip__summary procurement-turnover-tooltip__summary">
          <span class="badge red procurement-turnover-tooltip__badge"><svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=2#TrendArrow"></use></svg>${escape(point.days)}</span>
          <span class="procurement-budget-tooltip__summary-text">дни хранения</span>
        </span>
      </span>
      <span class="procurement-turnover-tooltip__media" aria-hidden="true"><img src="${escape(point.image)}" alt=""></span>
    </div>`;
    tooltip.hidden = false;
    positionSlowTurnoverTooltip(tooltip, viewport, anchor);
  }

  function showBudgetDeviationTooltip(bar) {
    const tooltip = document.querySelector("[data-budget-deviation-tooltip]");
    const viewport = document.querySelector("[data-budget-deviation-panel]");
    if (!tooltip || !viewport || !bar) return;
    const deviation = Number(bar.dataset.deviation || 0);
    const tone = bar.dataset.tone === "red" ? "red" : "green";
    const badgeText = `${deviation > 0 ? "+" : "−"}${Math.abs(deviation)}%`;
    const groupText = budgetDeviationMode === "department" ? "подразделениям" : "категориям";
    tooltip.innerHTML = `<div class="procurement-budget-tooltip__metrics">
      <span class="procurement-budget-tooltip__metric"><span>ПЛАН</span><strong>${formatTooltipAmount(Number(bar.dataset.plan || 0))}</strong></span>
      <span class="procurement-budget-tooltip__divider" aria-hidden="true"></span>
      <span class="procurement-budget-tooltip__metric"><span>ФАКТ</span><strong>${formatTooltipAmount(Number(bar.dataset.fact || 0))}</strong></span>
    </div>
    <div class="procurement-budget-tooltip__summary">
      ${ui.badge(badgeText, tone)}
      <span class="procurement-budget-tooltip__summary-text">отклонение по ${groupText} закупок</span>
    </div>`;
    tooltip.hidden = false;
    const viewportRect = viewport.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    const gap = 12;
    let left = barRect.right - viewportRect.left + viewport.scrollLeft + gap;
    let top = barRect.top - viewportRect.top + viewport.scrollTop - tooltip.offsetHeight / 2 + barRect.height / 2;
    const maxLeft = viewport.scrollLeft + viewport.clientWidth - tooltip.offsetWidth - 8;
    if (left > maxLeft) left = barRect.left - viewportRect.left + viewport.scrollLeft - tooltip.offsetWidth - gap;
    const maxTop = viewport.scrollTop + viewport.clientHeight - tooltip.offsetHeight - 8;
    top = Math.max(viewport.scrollTop + 8, Math.min(maxTop, top));
    tooltip.style.left = `${Math.max(viewport.scrollLeft + 8, left)}px`;
    tooltip.style.top = `${top}px`;
  }

  function renderEgpzStatusChart() {
    window.BNTCharts?.renderPaymentStatuses?.(document.querySelector("[data-payment-analytics]"));
  }

  function renderEgpzCharts() {
    renderEgpzStatusChart();
    renderEgpzForecastChart();
    renderBudgetCharts();
  }

  function render() {
    renderProcurementEvidence();
    const below = data.parts.filter(part => part.stock < part.min);
    const coverage = Math.round(data.parts.reduce((sum, part) => sum + Math.min(1, part.stock / part.min), 0) / data.parts.length * 100);
    kpiRoot.innerHTML = [
      {label: "Критические позиции", value: "18 400 USD", context: "1 позиция требует срочной закупки", toneClass: "is-negative"},
      {label: "Ниже минимума", value: `${below.length} позиции`, context: `Из ${data.parts.length} контролируемых позиций`, toneClass: "is-negative"},
      {label: "Покрытие склада", value: "241 000 USD", context: "Из 482 000 USD страхового запаса", ring: {percent: coverage}},
      {label: "Открытые тендеры", value: "241 000 USD", context: `${data.tenders.length} тендера`}
    ].map(renderKpi).join("");

    rowsRoot.innerHTML = filtered().map(part => {
      const sourceIndex = data.parts.indexOf(part);
      const cover = Math.round(part.stock / part.min * 100);
      return `<tr>
        <td>${textContent(part.name, priorityLabel(part.priority))}</td>
        <td>${textContent(part.code)}</td>
        <td class="data-table__numeric-cell table-number-cell">${numberContent(part.stock, `${part.min} штук`)}</td>
        <td class="data-table__numeric-cell data-table__progress-cell">${progressContent(cover, cover < 40 ? "red" : cover >= 100 ? "green" : "")}</td>
        <td class="data-table__numeric-cell table-number-cell">${numberContent(part.lead, "дней")}</td>
        <td>${textContent(part.asset)}</td>
        <td class="data-table__numeric-cell table-number-cell">${impactContent(part.impact)}</td>
        <td>${ui.badge(part.status, statusTone(part.status))}</td>
        <td class="data-table__action-cell">${orderAction(sourceIndex)}</td>
      </tr>`;
    }).join("");
    renderFilterSummary();
    renderEgpzCharts();
  }

  function syncSearchScope() {
    const selected = searchScopes.find(([value]) => value === draftFilters.searchScope) || searchScopes[0];
    const label = filterModal.querySelector("[data-procurement-search-scope-label]");
    const trigger = filterModal.querySelector("[data-procurement-search-scope-trigger]");
    label.textContent = selected[1];
    trigger.dataset.value = selected[0];
    filterModal.querySelectorAll("[data-procurement-search-scope-option]").forEach(option => {
      const active = option.dataset.procurementSearchScopeOption === selected[0];
      option.classList.toggle("is-selected", active);
      option.classList.toggle("typography-caption-smallest", active);
      option.classList.toggle("typography-body-smallest", !active);
      option.setAttribute("aria-selected", String(active));
    });
  }

  function closeSearchScope() {
    const scope = filterModal.querySelector("[data-procurement-search-scope]");
    scope.classList.remove("is-open");
    scope.querySelector("[data-procurement-search-scope-trigger]")?.setAttribute("aria-expanded", "false");
    scope.querySelector("[data-procurement-search-scope-list]")?.setAttribute("hidden", "");
  }

  function priorityRoot() {
    return filterModal.querySelector("[data-procurement-priority-filter]");
  }

  function closePriorityFilter() {
    const root = priorityRoot();
    if (!root) return;
    root.classList.remove("is-open", "is-open-up");
    root.querySelector("[data-procurement-priority-trigger]")?.setAttribute("aria-expanded", "false");
    const menu = root.querySelector("[data-procurement-priority-menu]");
    if (menu) menu.hidden = true;
  }

  function syncPriorityFilter() {
    const root = priorityRoot();
    if (!root) return;
    const value = draftFilters.priority || allPriority;
    root.classList.toggle("has-selection", value !== allPriority);
    root.querySelector("[data-procurement-priority-value]").textContent = value;
    root.querySelector("[data-procurement-priority-trigger]")?.setAttribute("aria-label", `Приоритет: ${value}`);
    root.querySelectorAll("[data-procurement-priority-option]").forEach(option => {
      const active = option.dataset.procurementPriorityOption === value;
      option.classList.toggle("is-selected", active);
      option.setAttribute("aria-selected", String(active));
    });
  }

  function syncFilterModal() {
    filterModal.querySelector("[data-procurement-filter-search]").value = draftFilters.search;
    syncPriorityFilter();
    syncSearchScope();
  }

  function openFilter() {
    closePurchaseDrawer();
    closeEgpzFilter();
    closeFilterSummaryMenus();
    draftFilters = cloneFilters(filters);
    syncFilterModal();
    filterModal.hidden = false;
    filterToggle?.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => filterModal.querySelector("[data-procurement-filter-search]")?.focus());
  }

  function closeFilter() {
    closeSearchScope();
    closePriorityFilter();
    filterModal.hidden = true;
    filterToggle?.setAttribute("aria-expanded", "false");
  }

  function syncEgpzFilterTitle(trigger) {
    if (!egpzFilterModal) return;
    const titleNode = egpzFilterModal.querySelector("#egpz-filter-title");
    const drawer = egpzFilterModal.querySelector(".filter-modal__drawer");
    const explicitTitle = trigger?.dataset.egpzChartFilterTitle?.trim() || "";
    const chartTitle = explicitTitle || (trigger?.matches("[data-egpz-chart-filter]")
      ? trigger.closest(".chart-card")?.querySelector(".chart-card__title-row h3")?.textContent?.trim()
      : "");
    const title = chartTitle ? `Фильтр: ${chartTitle}` : egpzFilterDefaultTitle;
    if (titleNode) titleNode.textContent = title;
    drawer?.setAttribute("aria-label", title);
  }

  function openEgpzFilter(event) {
    if (!egpzFilterModal) return;
    syncEgpzFilterTitle(event?.currentTarget);
    closePurchaseDrawer();
    closeFilter();
    closeFilterSummaryMenus();
    syncEgpzDepartmentsField();
    egpzFilterModal.querySelectorAll("[data-egpz-date-root]").forEach(root => syncEgpzDateField(root, root.dataset.egpzDateValue || ""));
    egpzFilterModal.hidden = false;
    egpzFilterToggles.forEach(toggle => toggle.setAttribute("aria-expanded", "true"));
    requestAnimationFrame(syncEgpzDepartmentOverflow);
    requestAnimationFrame(() => egpzFilterModal.querySelector("[data-egpz-static-search]")?.focus());
  }

  function closeEgpzFilter() {
    if (!egpzFilterModal) return;
    closeEgpzDepartmentsField();
    closeEgpzDatePickers();
    egpzFilterModal.hidden = true;
    egpzFilterToggles.forEach(toggle => toggle.setAttribute("aria-expanded", "false"));
  }

  function resetEgpzFilter() {
    egpzDepartments = new Set([egpzAllDepartment]);
    const search = egpzFilterModal?.querySelector("[data-egpz-static-search]");
    if (search) search.value = "";
    const departmentSearch = egpzDepartmentsRoot()?.querySelector("[data-form-input-search]");
    if (departmentSearch) departmentSearch.value = "";
    egpzFilterModal?.querySelectorAll("[data-egpz-date-root]").forEach(root => syncEgpzDateField(root, ""));
    closeEgpzDepartmentsField();
    closeEgpzDatePickers();
    syncEgpzDepartmentsField();
  }

  function readDraftFilters() {
    draftFilters.search = filterModal.querySelector("[data-procurement-filter-search]").value;
  }

  function applyFilters() {
    readDraftFilters();
    filters = cloneFilters(draftFilters);
    closeFilter();
    render();
  }

  function resetFilters() {
    filters = defaultFilters();
    draftFilters = cloneFilters(filters);
    syncFilterModal();
    closeFilter();
    render();
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function downloadProcurementCsv() {
    const tenderRows = [["Тендер", "Предмет", "Поставщик", "Сумма", "Срок"], ...data.tenders];
    const actionRows = [["Задача", "Описание"], ...data.actions.map(action => [action.title, action.text])];
    const csv = [
      ...tenderRows.map(row => row.map(csvCell).join(";")),
      "",
      ...actionRows.map(row => row.map(csvCell).join(";"))
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], {type: "text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "procurement-tenders-actions-2026.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    ui.toast("Экспорт", "Тендеры и задачи скачаны в CSV");
  }

  function amountContent(value) {
    return numberContent(String(value ?? "").replace(/^\s*\$\s*/, ""), "USD");
  }

  function updateRiskScrollFades() {
    if (!riskScroller || !riskColumn) return;
    const maxScroll = Math.max(0, riskScroller.scrollHeight - riskScroller.clientHeight);
    riskColumn.classList.toggle("has-fade-top", riskScroller.scrollTop > 1);
    riskColumn.classList.toggle("has-fade-bottom", maxScroll - riskScroller.scrollTop > 1);
  }

  document.getElementById("tender-rows").innerHTML = data.tenders.map(tender => `<tr>
    <td>${textContent(tender[0])}</td>
    <td>${textContent(tender[1])}</td>
    <td>${textContent(tender[2])}</td>
    <td class="data-table__numeric-cell table-number-cell">${amountContent(tender[3])}</td>
    <td class="data-table__date-cell">${textContent(tender[4])}</td>
  </tr>`).join("");
  document.getElementById("purchase-actions").innerHTML = data.actions.map((action, index) => `<li class="payment-risk-item payment-risk-item--${riskTone(action.tone)}">
    <span class="payment-risk-item__marker typography-indicator-small" aria-hidden="true">${index + 1}</span>
    <div class="payment-risk-item__content table-cell-content table-cell-content--with-pill">
      <div class="payment-risk-item__header table-header-content">
        <h4 class="payment-risk-item__title typography-label-smallest">${escape(action.title)}</h4>
        <p class="payment-risk-item__description typography-body-smallest">${escape(action.text)}</p>
      </div>
      <a class="pill pill--default pill--round payment-risk-item__action typography-body-smallest" href="/projects" aria-label="Создать задачу: ${escape(action.title)}">
        <span class="pill__title">Создать задачу</span>
        <svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=3#ArrowUpRight"></use></svg>
      </a>
    </div>
  </li>`).join("");
  renderAnalysisBlock();
  window.requestAnimationFrame(updateRiskScrollFades);

  egpzFilterToggles.forEach(toggle => toggle.addEventListener("click", openEgpzFilter));
  filterToggle?.addEventListener("click", openFilter);
  exportButton?.addEventListener("click", downloadProcurementCsv);
  riskScroller?.addEventListener("scroll", updateRiskScrollFades, {passive: true});
  if (typeof ResizeObserver === "function" && riskScroller && riskColumn) {
    const riskObserver = new ResizeObserver(updateRiskScrollFades);
    riskObserver.observe(riskScroller);
    riskObserver.observe(riskColumn);
    riskObserver.observe(document.getElementById("purchase-actions"));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    renderEgpzStatusChart();
    renderAnalysisExpenseShareChart();
  });
  if (typeof ResizeObserver === "function") {
    let donutResizeFrame = 0;
    const donutObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(donutResizeFrame);
      donutResizeFrame = window.requestAnimationFrame(() => {
        renderEgpzStatusChart();
        renderAnalysisExpenseShareChart();
      });
    });
    document.querySelectorAll(".chart-donut__viewport").forEach(viewport => donutObserver.observe(viewport));
  }
  document.querySelector("[data-egpz-forecast-tabs]")?.addEventListener("click", event => {
    const tab = event.target.closest("[data-egpz-forecast-tab]");
    if (!tab) return;
    setEgpzForecastMode(tab.dataset.egpzForecastTab);
  });
  document.querySelector("[data-egpz-forecast-tabs]")?.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...event.currentTarget.querySelectorAll("[data-egpz-forecast-tab]")];
    const currentIndex = tabs.findIndex(tab => tab.dataset.egpzForecastTab === egpzForecastMode);
    const lastIndex = tabs.length - 1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? lastIndex : event.key === "ArrowLeft" ? Math.max(0, currentIndex - 1) : Math.min(lastIndex, currentIndex + 1);
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    event.preventDefault();
    nextTab.focus();
    setEgpzForecastMode(nextTab.dataset.egpzForecastTab);
  });
  document.querySelector("[data-plan-fact-tabs]")?.addEventListener("click", event => {
    const tab = event.target.closest("[data-plan-fact-tab]");
    if (!tab) return;
    setPlanFactMode(tab.dataset.planFactTab);
  });
  document.querySelector("[data-plan-fact-tabs]")?.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...event.currentTarget.querySelectorAll("[data-plan-fact-tab]")];
    const currentIndex = tabs.findIndex(tab => tab.dataset.planFactTab === planFactMode);
    const lastIndex = tabs.length - 1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? lastIndex : event.key === "ArrowLeft" ? Math.max(0, currentIndex - 1) : Math.min(lastIndex, currentIndex + 1);
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    event.preventDefault();
    nextTab.focus();
    setPlanFactMode(nextTab.dataset.planFactTab);
  });
  document.querySelector("[data-budget-deviation-tabs]")?.addEventListener("click", event => {
    const tab = event.target.closest("[data-budget-deviation-tab]");
    if (!tab) return;
    setBudgetDeviationMode(tab.dataset.budgetDeviationTab);
  });
  document.querySelector("[data-budget-deviation-tabs]")?.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...event.currentTarget.querySelectorAll("[data-budget-deviation-tab]")];
    const currentIndex = tabs.findIndex(tab => tab.dataset.budgetDeviationTab === budgetDeviationMode);
    const lastIndex = tabs.length - 1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? lastIndex : event.key === "ArrowLeft" ? Math.max(0, currentIndex - 1) : Math.min(lastIndex, currentIndex + 1);
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    event.preventDefault();
    nextTab.focus();
    setBudgetDeviationMode(nextTab.dataset.budgetDeviationTab);
  });
  document.querySelector("[data-annual-forecast-tabs]")?.addEventListener("click", event => {
    const tab = event.target.closest("[data-annual-forecast-tab]");
    if (!tab) return;
    setAnnualForecastMode(tab.dataset.annualForecastTab);
  });
  document.querySelector("[data-annual-forecast-tabs]")?.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...event.currentTarget.querySelectorAll("[data-annual-forecast-tab]")];
    const currentIndex = tabs.findIndex(tab => tab.dataset.annualForecastTab === annualForecastMode);
    const lastIndex = tabs.length - 1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? lastIndex : event.key === "ArrowLeft" ? Math.max(0, currentIndex - 1) : Math.min(lastIndex, currentIndex + 1);
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    event.preventDefault();
    nextTab.focus();
    setAnnualForecastMode(nextTab.dataset.annualForecastTab);
  });
  document.querySelector("[data-stock-balance-tabs]")?.addEventListener("click", event => {
    const tab = event.target.closest("[data-stock-balance-tab]");
    if (!tab) return;
    setStockBalanceMode(tab.dataset.stockBalanceTab);
  });
  document.querySelector("[data-stock-balance-tabs]")?.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...event.currentTarget.querySelectorAll("[data-stock-balance-tab]")];
    const currentIndex = tabs.findIndex(tab => tab.dataset.stockBalanceTab === stockBalanceMode);
    const lastIndex = tabs.length - 1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? lastIndex : event.key === "ArrowLeft" ? Math.max(0, currentIndex - 1) : Math.min(lastIndex, currentIndex + 1);
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    event.preventDefault();
    nextTab.focus();
    setStockBalanceMode(nextTab.dataset.stockBalanceTab);
  });
  document.querySelector("[data-stock-reserve-tabs]")?.addEventListener("click", event => {
    const tab = event.target.closest("[data-stock-reserve-tab]");
    if (!tab) return;
    setStockReserveMode(tab.dataset.stockReserveTab);
  });
  document.querySelector("[data-stock-reserve-tabs]")?.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...event.currentTarget.querySelectorAll("[data-stock-reserve-tab]")];
    const currentIndex = tabs.findIndex(tab => tab.dataset.stockReserveTab === stockReserveMode);
    const lastIndex = tabs.length - 1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? lastIndex : event.key === "ArrowLeft" ? Math.max(0, currentIndex - 1) : Math.min(lastIndex, currentIndex + 1);
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    event.preventDefault();
    nextTab.focus();
    setStockReserveMode(nextTab.dataset.stockReserveTab);
  });
  document.addEventListener("pointerover", event => {
    const point = event.target.closest("[data-chart-tooltip]");
    if (point) showChartTooltip(point);
  });
  document.addEventListener("pointerout", event => {
    const point = event.target.closest("[data-chart-tooltip]");
    if (!point || point.contains(event.relatedTarget)) return;
    hideChartTooltip(point.closest(".chart-viewport") || document);
  });
  document.addEventListener("focusin", event => {
    const point = event.target.closest("[data-chart-tooltip]");
    if (point) showChartTooltip(point);
  });
  document.addEventListener("focusout", event => {
    const point = event.target.closest("[data-chart-tooltip]");
    if (point) hideChartTooltip(point.closest(".chart-viewport") || document);
  });
  document.addEventListener("pointerover", event => {
    const bar = event.target.closest("[data-budget-deviation-bar]");
    if (bar) showBudgetDeviationTooltip(bar);
  });
  document.addEventListener("pointerout", event => {
    const bar = event.target.closest("[data-budget-deviation-bar]");
    if (!bar || bar.contains(event.relatedTarget)) return;
    hideBudgetDeviationTooltip();
  });
  document.addEventListener("focusin", event => {
    const bar = event.target.closest("[data-budget-deviation-bar]");
    if (bar) showBudgetDeviationTooltip(bar);
  });
  document.addEventListener("focusout", event => {
    if (event.target.closest("[data-budget-deviation-bar]")) hideBudgetDeviationTooltip();
  });
  document.addEventListener("pointerover", event => {
    const point = event.target.closest("[data-slow-turnover-point]");
    if (point) showSlowTurnoverTooltip(point);
  });
  document.addEventListener("pointerout", event => {
    const point = event.target.closest("[data-slow-turnover-point]");
    if (!point || point.contains(event.relatedTarget)) return;
    hideSlowTurnoverTooltip();
  });
  document.addEventListener("focusin", event => {
    const point = event.target.closest("[data-slow-turnover-point]");
    if (point) showSlowTurnoverTooltip(point);
  });
  document.addEventListener("focusout", event => {
    if (event.target.closest("[data-slow-turnover-point]")) hideSlowTurnoverTooltip();
  });
  document.querySelectorAll("[data-chart-tooltip-surface]").forEach(tooltip => {
    tooltip.closest(".chart-viewport")?.addEventListener("scroll", () => hideChartTooltip(tooltip.closest(".chart-viewport") || document), {passive: true});
  });
  document.querySelector("[data-budget-deviation-panel]")?.addEventListener("scroll", hideBudgetDeviationTooltip, {passive: true});
  document.querySelector("[data-slow-turnover-panel]")?.addEventListener("scroll", hideSlowTurnoverTooltip, {passive: true});
  filterModal.addEventListener("click", event => {
    if (event.target.closest("[data-procurement-filter-close]")) {
      closeFilter();
      return;
    }
    const scopeTrigger = event.target.closest("[data-procurement-search-scope-trigger]");
    if (scopeTrigger) {
      const expanded = scopeTrigger.getAttribute("aria-expanded") === "true";
      closePriorityFilter();
      scopeTrigger.closest("[data-procurement-search-scope]").classList.toggle("is-open", !expanded);
      scopeTrigger.setAttribute("aria-expanded", String(!expanded));
      scopeTrigger.closest("[data-procurement-search-scope]").querySelector("[data-procurement-search-scope-list]").hidden = expanded;
      return;
    }
    const scopeOption = event.target.closest("[data-procurement-search-scope-option]");
    if (scopeOption) {
      draftFilters.searchScope = scopeOption.dataset.procurementSearchScopeOption;
      syncSearchScope();
      closeSearchScope();
      filterModal.querySelector("[data-procurement-filter-search]")?.focus();
      return;
    }
    const priorityTrigger = event.target.closest("[data-procurement-priority-trigger]");
    if (priorityTrigger) {
      const root = priorityTrigger.closest("[data-procurement-priority-filter]");
      const menu = root.querySelector("[data-procurement-priority-menu]");
      const open = priorityTrigger.getAttribute("aria-expanded") !== "true";
      closeSearchScope();
      closePriorityFilter();
      root.classList.toggle("is-open", open);
      priorityTrigger.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      if (open) requestAnimationFrame(() => ui.positionFormInputMenu(root));
      return;
    }
    const priorityOption = event.target.closest("[data-procurement-priority-option]");
    if (priorityOption) {
      draftFilters.priority = priorityOption.dataset.procurementPriorityOption;
      syncPriorityFilter();
      closePriorityFilter();
      return;
    }
    if (!event.target.closest("[data-procurement-priority-filter]") && !event.target.closest("[data-procurement-search-scope]")) {
      closeSearchScope();
      closePriorityFilter();
    }
    if (event.target.closest("[data-procurement-filter-apply]")) applyFilters();
    if (event.target.closest("[data-procurement-filter-reset]")) resetFilters();
  });
  filterModal.addEventListener("input", event => {
    if (event.target.matches("[data-procurement-filter-search]")) draftFilters.search = event.target.value;
  });
  filterModal.addEventListener("submit", event => {
    if (!event.target.matches("[data-procurement-filter-search-form]")) return;
    event.preventDefault();
    applyFilters();
  });
  document.addEventListener("click", event => {
    const paymentClear = event.target.closest("[data-payment-filter-clear]");
    if (paymentClear) {
      event.preventDefault();
      const card = paymentClear.closest("[data-payment-chart-card]");
      paymentClear.closest(".pill")?.remove();
      return;
    }

    const paymentFilter = event.target.closest("[data-payment-filter]");
    if (paymentFilter) {
      const card = paymentFilter.closest("[data-payment-chart-card]");
      const count = card?.querySelectorAll(".chart-card__filters .pill").length ?? 0;
      ui.toast("Фильтр", `Выбрано параметров: ${count}`);
      return;
    }

    const paymentExport = event.target.closest("[data-payment-export]");
    if (paymentExport) {
      ui.toast("Экспорт", "Данные диаграммы подготовлены к скачиванию");
      return;
    }

    const summaryToggle = event.target.closest("[data-equipment-filter-summary-toggle]");
    if (summaryToggle) {
      event.preventDefault();
      const group = summaryToggle.closest("[data-equipment-filter-summary-group]");
      const menu = group?.querySelector("[data-equipment-filter-summary-menu]");
      const open = summaryToggle.getAttribute("aria-expanded") !== "true";
      closeFilterSummaryMenus(group);
      group?.classList.toggle("is-open", open);
      summaryToggle.setAttribute("aria-expanded", String(open));
      if (menu) menu.hidden = !open;
      return;
    }

    const summaryValueRemove = event.target.closest("[data-equipment-filter-remove-value]");
    if (summaryValueRemove) {
      event.preventDefault();
      event.stopPropagation();
      resetFilterGroup(summaryValueRemove.dataset.equipmentFilterRemoveValue);
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
  });
  egpzFilterModal?.addEventListener("click", event => {
    if (event.target.closest("[data-egpz-filter-close]")) {
      closeEgpzFilter();
      return;
    }
    if (event.target.closest("[data-egpz-filter-apply]")) {
      closeEgpzFilter();
      return;
    }
    if (event.target.closest("[data-egpz-filter-reset]")) {
      resetEgpzFilter();
      return;
    }
    const formSearchClear = event.target.closest("[data-form-input-search-clear]");
    if (formSearchClear) {
      const root = formSearchClear.closest(".form-input");
      const search = root.querySelector("[data-form-input-search]");
      search.value = "";
      filterEgpzDepartmentOptions(root);
      requestAnimationFrame(() => ui.positionFormInputMenu?.(root));
      search.focus();
      return;
    }
    const tagRemove = event.target.closest("[data-form-input-tag-remove]");
    if (tagRemove) {
      event.preventDefault();
      event.stopPropagation();
      egpzDepartments.delete(tagRemove.dataset.formInputTagRemove);
      syncEgpzDepartmentsField();
      filterEgpzDepartmentOptions(tagRemove.closest(".form-input"));
      return;
    }
    const hiddenToggle = event.target.closest("[data-form-input-hidden-toggle]");
    if (hiddenToggle) {
      event.preventDefault();
      event.stopPropagation();
      const more = hiddenToggle.closest("[data-form-input-tag-more]");
      const menu = more?.querySelector("[data-form-input-hidden-menu]");
      const open = !more?.classList.contains("is-open");
      closeEgpzDepartmentHiddenMenus(more);
      more?.classList.toggle("is-open", open);
      more?.closest(".form-input")?.classList.toggle("has-tag-rollover", open);
      hiddenToggle.setAttribute("aria-expanded", String(open));
      if (menu) menu.hidden = !open;
      return;
    }
    const departmentsTrigger = event.target.closest("[data-egpz-departments-filter] .form-input__control");
    if (departmentsTrigger) {
      const root = departmentsTrigger.closest("[data-egpz-departments-filter]");
      const menu = root.querySelector(".form-input__menu");
      const open = departmentsTrigger.getAttribute("aria-expanded") !== "true";
      closeEgpzDatePickers();
      root.classList.toggle("is-open", open);
      departmentsTrigger.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      if (open) requestAnimationFrame(() => ui.positionFormInputMenu?.(root));
      return;
    }
    const departmentOption = event.target.closest("[data-form-input-option]");
    if (departmentOption) {
      toggleEgpzDepartment(departmentOption.dataset.formInputOption);
      syncEgpzDepartmentsField();
      filterEgpzDepartmentOptions(departmentOption.closest(".form-input"));
      requestAnimationFrame(() => ui.positionFormInputMenu?.(departmentOption.closest(".form-input")));
      return;
    }
    if (handleEgpzDateClick(event)) return;
    if (!event.target.closest("[data-egpz-departments-filter]")) closeEgpzDepartmentsField();
    if (!event.target.closest("[data-egpz-date-root]")) closeEgpzDatePickers();
  });
  egpzFilterModal?.addEventListener("input", event => {
    if (!event.target.matches("[data-form-input-search]")) return;
    const root = event.target.closest(".form-input");
    filterEgpzDepartmentOptions(root);
    requestAnimationFrame(() => ui.positionFormInputMenu?.(root));
  });
  egpzFilterModal?.addEventListener("submit", event => {
    if (!event.target.matches("[data-egpz-static-search-form]")) return;
    event.preventDefault();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (purchaseDrawer && !purchaseDrawer.hidden) closePurchaseDrawer();
    if (egpzFilterModal && !egpzFilterModal.hidden) closeEgpzFilter();
    if (filterModal && !filterModal.hidden) closeFilter();
  });

  function purchaseField(name) {
    return purchaseForm?.elements?.[name] || null;
  }

  function setPurchaseField(name, value) {
    const field = purchaseField(name);
    if (field) field.value = value;
  }

  function openPurchaseDrawer(index) {
    if (!purchaseDrawer || !purchaseForm) return;
    const part = data.parts[index] || data.parts[0];
    purchasePart = part;
    closeFilter();
    closeEgpzFilter();
    closeFilterSummaryMenus();
    setPurchaseField("part", part.name);
    setPurchaseField("code", part.code);
    setPurchaseField("quantity", String(Math.max(1, part.min - part.stock)));
    syncEgpzDateField(purchaseDrawer.querySelector("[data-egpz-date-root='purchase-deadline']"), "");
    setPurchaseField("supplier", "ТехПромСнаб");
    setPurchaseField("reason", `Покрытие ${Math.round(part.stock / part.min * 100)}%, связан с ${part.asset}`);
    purchaseDrawer.hidden = false;
    urgentPurchaseButton?.setAttribute("aria-expanded", "true");
  }

  function closePurchaseDrawer() {
    if (!purchaseDrawer) return;
    closeEgpzDatePickers();
    purchaseDrawer.hidden = true;
    urgentPurchaseButton?.setAttribute("aria-expanded", "false");
  }

  function submitPurchaseDrawer() {
    const part = purchasePart || data.parts[0];
    const values = new FormData(purchaseForm);
    const title = String(values.get("part") || part.name);
    part.status = "Заявка";
    render();
    closePurchaseDrawer();
    ui.toast("Заявка создана", title);
  }

  rowsRoot.addEventListener("click", event => {
    const button = event.target.closest("[data-order]");
    if (button) openPurchaseDrawer(Number(button.dataset.order));
  });

  urgentPurchaseButton.addEventListener("click", () => openPurchaseDrawer(0));
  purchaseDrawer?.addEventListener("click", event => {
    if (event.target.closest("[data-procurement-purchase-close]")) {
      closePurchaseDrawer();
      return;
    }
    if (handleEgpzDateClick(event)) return;
    if (!event.target.closest("[data-egpz-date-root]")) closeEgpzDatePickers();
  });
  purchaseForm?.addEventListener("submit", event => {
    event.preventDefault();
    submitPurchaseDrawer();
  });
  infoButton?.addEventListener("click", event => ui.showInfoPopover(event.currentTarget, {
    title: "Критический ЗИП",
    message: "Покрытие склада, сроки поставки и влияние на надежность активов"
  }));
  stockInfoButton?.addEventListener("click", event => ui.showInfoPopover(event.currentTarget, {
    title: "Складская потребность",
    message: "Приоритет рассчитан по связанным активам и риску простоя"
  }));
  impactInfoButton?.addEventListener("click", event => ui.showInfoPopover(event.currentTarget, {
    title: "Влияние",
    message: "Уменьшение риска простоя при пополнении позиции"
  }));
  render();
})();
