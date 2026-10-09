(function initStackedBars() {
  const numberFormat = new Intl.NumberFormat('ru-RU');
  const axisNumberFormat = new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 20});
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function splitCategory(category, labels, weights) {
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
    const allocated = category.values.map(() => 0);
    return labels.map((label, index) => ({
      label,
      period: `${category.period || category.label} · ${label}`,
      values: category.values.map((value, seriesIndex) => {
        const part = index === labels.length - 1
          ? value - allocated[seriesIndex]
          : Math.round(value * weights[index] / weightTotal);
        allocated[seriesIndex] += part;
        return part;
      })
    }));
  }

  function renderStackedBars(options) {
    const { id, title, series } = options;
    const tabs = options.tabs || [{key: 'default', label: title}];
    const showHeader = options.showHeader !== false;
    const showTabs = options.showTabs !== false;
    const horizontal = options.orientation === 'horizontal';
    const unit = options.unit || 'МТ';
    const categoryLabel = options.categoryLabel || 'Период';
    return `
      <article class="chart-card chart-card--wide" data-stacked-card="${escape(id)}" ${showHeader ? `aria-labelledby="${escape(id)}-title"` : `aria-label="${escape(title)}"`}>
        ${showHeader ? `<header class="chart-card__header">
          <div class="chart-card__heading">
            <div class="chart-card__title-row"><h3 id="${escape(id)}-title" class="typography-caption-small">${escape(title)}</h3></div>
            <div class="chart-card__filters">
              ${[options.periodLabel, `Ед. изм. ${unit}`].map(label => `<span class="filter-summary__count filter-summary__count_static pill pill--default pill--radius typography-body-smallest"><span class="filter-summary__count-title">${escape(label)}</span><button class="filter-summary__count-chevron" type="button" aria-label="Убрать: ${escape(label)}"><svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Cross"></use></svg></button></span>`).join('')}
            </div>
          </div>
          <div class="chart-actions">
            <button class="button-smallest-secondary-radius button-smallest-secondary-radius--icon typography-button-smallest" type="button" data-stacked-export aria-label="Скачать: ${escape(title)}" title="Скачать CSV"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Download"></use></svg></button>
            <button class="button-smallest-secondary-radius typography-button-smallest" type="button" data-chart-filter data-chart-filter-variant="static-date" aria-expanded="false" aria-controls="chart-filter-modal"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#Filter"></use></svg><span>Фильтр</span></button>
          </div>
        </header>` : ''}
        ${showTabs ? `<div class="chart-tabs chart-tabs--four" role="tablist" aria-label="${escape(title)}">
          ${tabs.map((tab, index) => `<button id="${escape(id)}-tab-${index}" class="typography-label-small${index === 0 ? ' is-active' : ''}" type="button" role="tab" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" aria-controls="${escape(id)}-panel" data-stacked-tab="${escape(tab.key)}">${escape(tab.label)}</button>`).join('')}
        </div>` : ''}
        <div id="${escape(id)}-panel" class="chart-viewport" ${showTabs ? `role="tabpanel" aria-labelledby="${escape(id)}-tab-0"` : `role="group" aria-label="${escape(title)}"`}>
          ${horizontal ? '<svg class="chart-viewport__axis" data-stacked-axis aria-hidden="true"></svg>' : ''}
          <div class="chart-viewport__plot chart-scrollbar" tabindex="0" role="region" aria-label="${escape(title)}">
          <svg class="chart-bars chart-bars--stacked" role="group" aria-label="${escape(title)}"></svg>
          <div class="chart-tooltip typography-body-smallest" role="tooltip" hidden>
            <strong class="chart-tooltip__title typography-caption-small" data-tooltip-title></strong>
            <div><span>${escape(categoryLabel)}</span><strong data-tooltip-period></strong></div>
            <div><span>Кол-во, ${escape(unit)}</span><strong data-tooltip-value></strong></div>
          </div>
          </div>
        </div>
        <div class="chart-legend chart-legend--wrap typography-body-smallest" aria-label="Легенда диаграммы">
          ${series.map((item, index) => `<span class="chart-legend__item" data-stacked-series="${index}" role="button" tabindex="0" aria-pressed="false"><i class="chart-legend__dot ${escape(item.className)}" aria-hidden="true"></i>${escape(item.label)}</span>`).join('')}
        </div>
      </article>
    `;
  }

  function mountStackedBars(options) {
    const { host, id, title, datasets } = options;
    const tabs = options.tabs || [{key: 'default', label: title}];
    let series = options.series;
    const horizontal = options.orientation === 'horizontal';
    const axisTop = horizontal || options.axisPosition === 'top';
    const layout = options.layout || 'stacked';
    const showValues = options.showValues === true;
    const formatValue = options.formatValue || (value => numberFormat.format(value));
    const unit = options.unit || 'МТ';
    const categoryLabel = options.categoryLabel || 'Период';
    if (!options.card) host.insertAdjacentHTML(options.position || 'beforeend', renderStackedBars(options));
    const card = options.card || host.querySelector(`[data-stacked-card="${id}"]`);
    const chart = card.querySelector('.chart-bars');
    const panel = card.querySelector('.chart-viewport');
    const viewport = card.querySelector('.chart-viewport__plot');
    const axis = card.querySelector('[data-stacked-axis]');
    const tooltip = card.querySelector('.chart-tooltip');
    const legend = card.querySelector('.chart-legend');
    const tabButtons = Array.from(card.querySelectorAll('[data-stacked-tab]'));
    let activeTab = tabs[0].key;
    let selectedSeries = null;
    let resizeFrame = 0;
    let visibleRows = [];
    let destroyed = false;
    let resizeObserver = null;

    function getView() {
      return datasets[activeTab];
    }

    function render(focusKey) {
      if (destroyed) return;
      visibleRows = getView() || [];
      const valueLabels = showValues ? visibleRows.map(row => {
        if (layout === 'waterfall') return [{value: Number(row.values[row.seriesIndex]) || 0, start: row.start, end: row.end, seriesIndex: row.seriesIndex}];
        if (layout === 'grouped') return row.values.map((value, seriesIndex) => ({value: Number(value) || 0, start: 0, end: Number(value) || 0, seriesIndex}));
        const positive = row.values.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
        const negative = row.values.reduce((sum, value) => sum + Math.min(0, Number(value) || 0), 0);
        return [positive > 0 || negative === 0 ? {value: positive, start: 0, end: positive} : null, negative < 0 ? {value: negative, start: 0, end: negative} : null].filter(Boolean);
      }) : [];
      let width = horizontal
        ? Math.round(viewport.clientWidth || 1440)
        : Math.max(options.minWidth ?? 960, visibleRows.length * 56 + 94, Math.round(viewport.clientWidth || 1440));
      const verticalHeight = 420;
      const margin = { top: horizontal ? 0 : 1, right: 2, bottom: 1, left: horizontal ? 64 : 76 };
      let minimumWidth = options.minWidth ?? (horizontal ? 1 : 960);
      const endpoints = visibleRows.flatMap(row => layout === 'waterfall'
        ? [row.start, row.end]
        : layout === 'grouped' ? row.values
          : [row.values.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0), row.values.reduce((sum, value) => sum + Math.min(0, Number(value) || 0), 0)]);
      const rawMin = Math.min(Number(options.axisMin) || 0, ...endpoints);
      const upper = Math.max(Number(options.axisMax) || 0, ...endpoints);
      const rawMax = upper === rawMin ? rawMin + 1 : upper;
      const scale = window.BNTUI.chartScale(rawMin, rawMax, {step: options.tickStep});
      const {step, min, max} = scale;
      const range = max - min || 1;
      const tickCount = Math.round(range / step);
      const tickValues = Array.from({length: tickCount + 1}, (_, tick) => Number((min + tick * step).toPrecision(12)));
      const tickLabels = tickValues.map(value => options.formatTick ? options.formatTick(value) : axisNumberFormat.format(value));
      let tickWidths = [];
      let horizontalBarSize = 0;
      let rowHeight = 0;
      let tickOffset = 0;
      let axisHeight = 0;
      let labelHeight = 0;
      let tickWidth = 0;
      let categoryGap = 0;
      let categoryX = 0;
      let categoryOffset = 0;
      let wrappedCategories = [];
      let valueGap = 0;
      let valueHeight = 0;
      let valueWidth = 0;
      if (showValues) {
        valueGap = parseFloat(window.getComputedStyle(chart).getPropertyValue('--space-2'));
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'chart-bars__label');
        chart.appendChild(label);
        valueHeight = parseFloat(window.getComputedStyle(label).lineHeight) || label.getBBox().height;
        valueLabels.flat().forEach(item => {
          item.text = formatValue(item.value);
          label.textContent = item.text;
          item.width = label.getComputedTextLength();
          valueWidth = Math.max(valueWidth, item.width);
        });
        label.remove();
      }
      if (horizontal) {
        const styles = window.getComputedStyle(chart);
        horizontalBarSize = parseFloat(styles.getPropertyValue('--chart-bars-bar-size'));
        const rowPadding = parseFloat(styles.getPropertyValue('--space-3'));
        tickOffset = parseFloat(styles.getPropertyValue('--space-2'));
        categoryGap = parseFloat(styles.getPropertyValue('--space-4'));
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'chart-bars__category');
        label.textContent = visibleRows[0]?.label || '0';
        chart.appendChild(label);
        labelHeight = parseFloat(window.getComputedStyle(label).lineHeight) || label.getBBox().height;
        const categoryWidth = Math.max(0, ...visibleRows.map(row => {
          label.textContent = row.label;
          return label.getComputedTextLength();
        }));
        margin.left = Math.max(margin.left, Math.ceil(categoryWidth) + categoryGap + tickOffset);
        categoryX = margin.left - categoryGap;
        tickWidths = tickLabels.map(text => {
          label.textContent = text;
          return label.getComputedTextLength();
        });
        tickWidth = Math.max(...tickWidths);
        margin.left = Math.max(margin.left, tickWidths[0] + tickOffset);
        label.remove();
        rowHeight = Math.max(horizontalBarSize, labelHeight) + rowPadding * 2;
        if (showValues && layout === 'grouped') rowHeight = Math.max(rowHeight, (valueHeight + valueGap) * series.length + rowPadding * 2);
        axisHeight = labelHeight + tickOffset;
        const minimumPlotWidth = options.tickStep
          ? tickWidths[0] + tickWidth + tickOffset * 2
          : tickCount * Math.max(tickWidth + tickOffset, tickWidths[0] + tickWidths[1] + tickOffset * 2);
        const baseLeft = margin.left, baseRight = margin.right;
        const minPlot = Math.max(64, minimumPlotWidth);
        const gutters = plotWidth => {
          let left = baseLeft, right = baseRight;
          valueLabels.flat().forEach(item => {
            const negative = item.value < 0;
            const endpoint = negative ? Math.min(item.start, item.end) : Math.max(item.start, item.end);
            const fraction = (endpoint - min) / range;
            const overflow = Math.max(0, item.width + valueGap - (negative ? fraction : 1 - fraction) * plotWidth);
            if (negative) left = Math.max(left, baseLeft + overflow);
            else right = Math.max(right, baseRight + overflow);
          });
          return {left, right};
        };
        const fitWidth = availableWidth => {
          const minimumGutters = gutters(minPlot);
          const fittedWidth = Math.max(availableWidth, Math.ceil(minPlot + minimumGutters.left + minimumGutters.right));
          let low = minPlot, high = fittedWidth - baseLeft - baseRight;
          // Solve for the largest plot that fits its measured end labels once.
          for (let pass = 0; pass < 40; pass++) {
            const plotWidth = (low + high) / 2;
            const {left, right} = gutters(plotWidth);
            if (plotWidth + left + right <= fittedWidth) low = plotWidth;
            else high = plotWidth;
          }
          const {left, right} = gutters(low);
          return {width: fittedWidth, left, right};
        };
        minimumWidth = Math.max(minimumWidth, fitWidth(0).width);
        window.BNTUI?.fitChartTableLayout?.(chart, minimumWidth);
        const fitted = fitWidth(Math.round(viewport.clientWidth || width));
        width = fitted.width;
        margin.left = fitted.left;
        margin.right = fitted.right;
      } else {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'chart-bars__tick');
        chart.appendChild(label);
        const tickWidth = Math.max(...tickLabels.map(text => {
          label.textContent = text;
          return label.getComputedTextLength();
        }));
        tickOffset = parseFloat(window.getComputedStyle(chart).getPropertyValue('--space-2'));
        margin.left = Math.max(margin.left, Math.ceil(tickWidth) + tickOffset * 2);
        label.setAttribute('class', 'chart-bars__category');
        labelHeight = parseFloat(window.getComputedStyle(label).lineHeight) || 20;
        label.remove();
        const minimumSlot = showValues
          ? Math.max(56, layout === 'grouped' ? (valueWidth + valueGap) * series.length / .58 : valueWidth + valueGap * 2)
          : 56;
        minimumWidth = Math.max(minimumWidth, margin.left + margin.right + Math.max(64, visibleRows.length * minimumSlot));
        window.BNTUI?.fitChartTableLayout?.(chart, minimumWidth);
        width = Math.max(Math.round(viewport.clientWidth || width), minimumWidth);
        const slot = (width - margin.left - margin.right) / Math.max(1, visibleRows.length);
        wrappedCategories = visibleRows.map(row => options.wrapCategories && window.BNTUI?.splitChartLabel
          ? window.BNTUI.splitChartLabel(row.label, 3, Math.max(24, slot - tickOffset * 2), chart) : [row.label]);
        const categoriesHeight = labelHeight * Math.max(1, ...wrappedCategories.map(lines => lines.length));
        categoryOffset = tickOffset;
        margin.bottom = categoryOffset + categoriesHeight + 1;
        // Reserve space only for labels that cross the rounded plot boundary.
        for (let pass = 0; pass < 8 && showValues; pass++) {
          const previousTop = margin.top, previousBottom = margin.bottom;
          valueLabels.flat().filter(item => item.value >= 0).forEach(item => {
            const fraction = (Math.max(item.start, item.end) - min) / range;
            if (fraction > 0) margin.top = Math.max(margin.top, Math.ceil((valueHeight + valueGap - (1 - fraction) * (verticalHeight - margin.bottom)) / fraction));
          });
          const plotHeight = verticalHeight - margin.top - margin.bottom;
          const lowerOverflow = Math.max(0, ...valueLabels.flat().filter(item => item.value < 0).map(item =>
            valueHeight + valueGap - (Math.min(item.start, item.end) - min) / range * plotHeight));
          categoryOffset = tickOffset + Math.ceil(lowerOverflow);
          margin.bottom = categoryOffset + categoriesHeight + 1;
          if (margin.top === previousTop && margin.bottom === previousBottom) break;
        }
      }
      const height = horizontal ? Math.max(1, visibleRows.length * rowHeight + margin.top + margin.bottom) : verticalHeight;
      chart.style.setProperty('--chart-bars-height', `${height}px`);
      chart.style.width = `${width}px`;
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const bottom = height - margin.bottom;
      const tickSpacing = plotWidth / tickCount;
      const labelStride = Math.max(1, Math.ceil((tickWidth + tickOffset) / tickSpacing));
      const order = series.map((_, index) => index);
      if (selectedSeries !== null && layout === 'stacked') order.unshift(...order.splice(order.indexOf(selectedSeries), 1));
      const xFor = value => margin.left + plotWidth * (value - min) / range;
      const yFor = value => bottom - plotHeight * (value - min) / range;
      const svg = [];
      const axisLabels = [];
      let previousLabelRight = -Infinity;
      for (let tick = 0; tick <= tickCount; tick += 1) {
        const value = tickValues[tick];
        const x = xFor(value);
        const y = yFor(value);
        const label = escape(tickLabels[tick]);
        if (horizontal) {
          svg.push(`<line class="chart-bars__vertical-line" x1="${x}" y1="${margin.top}" x2="${x}" y2="${bottom}"/>`);
          const labelRight = x - tickOffset;
          const labelLeft = labelRight - tickWidths[tick];
          const visible = value === 0 || tick === 0 || tick === tickCount || (tick % labelStride === 0 && labelLeft >= previousLabelRight + tickOffset && (tickCount - tick) * tickSpacing >= tickWidths[tickCount] + tickOffset);
          if (visible) previousLabelRight = labelRight;
          axisLabels.push(`<text class="chart-bars__tick" x="${x - tickOffset}" y="${labelHeight}" text-anchor="end" data-tick-value="${value}"${visible ? '' : ' visibility="hidden"'}>${label}</text>`);
        } else {
          svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"${tick === 0 ? ' data-chart-closing-axis' : ''}/><text class="chart-bars__tick" x="${margin.left - tickOffset}" y="${y + tickOffset}" dominant-baseline="hanging" text-anchor="end" data-tick-value="${value}">${label}</text>`);
        }
      }
      if (horizontal && visibleRows.length) {
        for (let boundary = 0; boundary <= visibleRows.length; boundary += 1) {
          const y = margin.top + plotHeight * boundary / visibleRows.length;
          svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"${boundary === visibleRows.length ? ' data-chart-closing-axis' : ''}/>`);
        }
      }
      let offset = 0;
      visibleRows.forEach((row, rowIndex) => {
        const slot = (horizontal ? plotHeight : plotWidth) / visibleRows.length;
        const center = (horizontal ? margin.top : margin.left) + offset + slot / 2;
        const groupSize = layout === 'grouped' ? Math.max(1, series.length) : 1;
        const thickness = horizontal ? Math.min(horizontalBarSize, slot) / groupSize : Math.min(92, slot * .58) / groupSize;
        const groupPitch = showValues && layout === 'grouped' ? Math.max(thickness, (horizontal ? valueHeight : valueWidth) + valueGap) : thickness;
        let positive = 0, negative = 0;
        order.forEach(seriesIndex => {
          if (layout === 'waterfall' && seriesIndex !== row.seriesIndex) return;
          const value = Number(row.values[seriesIndex]) || 0;
          const start = layout === 'waterfall' ? row.start : layout === 'grouped' ? 0 : value >= 0 ? positive : negative;
          const end = layout === 'waterfall' ? row.end : start + value;
          if (start === end) return;
          if (layout === 'stacked') { if (value >= 0) positive = end; else negative = end; }
          const length = (horizontal ? plotWidth : plotHeight) * Math.abs(end - start) / range;
          const segmentCenter = layout === 'grouped' ? center + (seriesIndex - (groupSize - 1) / 2) * groupPitch : center;
          const geometry = horizontal
            ? `x="${xFor(Math.min(start, end))}" y="${segmentCenter - thickness / 2}" width="${length}" height="${thickness}"`
            : `x="${segmentCenter - thickness / 2}" y="${yFor(Math.max(start, end))}" width="${thickness}" height="${length}"`;
          const label = `${row.period || row.label}, ${series[seriesIndex].label}, ${formatValue(value)} ${unit}`;
          svg.push(`<rect class="chart-bars__segment ${escape(series[seriesIndex].className)}" ${geometry} data-chart-motion-axis="${horizontal ? 'x' : 'y'}" role="button" tabindex="0" aria-pressed="${selectedSeries === seriesIndex}" aria-label="${escape(label)}" data-chart-segment data-row-index="${rowIndex}" data-row-id="${rowIndex}" data-series-index="${seriesIndex}" data-series-label="${escape(series[seriesIndex].label)}" data-period="${escape(row.period || row.label)}" data-value="${value}"/>`);
        });
        if (layout === 'waterfall') {
          if (row.start === row.end) {
            const geometry = horizontal
              ? `x1="${xFor(row.end)}" y1="${center - thickness / 2}" x2="${xFor(row.end)}" y2="${center + thickness / 2}"`
              : `x1="${center - thickness / 2}" y1="${yFor(row.end)}" x2="${center + thickness / 2}" y2="${yFor(row.end)}"`;
            svg.push(`<line class="chart-bars__axis-line ${escape(series[row.seriesIndex].className)}" ${geometry} data-waterfall-zero="${rowIndex}" aria-hidden="true"/>`);
          }
          const next = visibleRows[rowIndex + 1];
          const nextLevel = rowIndex === visibleRows.length - 2 ? next?.end : next?.start;
          if (next && Math.abs(row.end - nextLevel) <= Math.max(1, Math.abs(row.end)) * Number.EPSILON * 16) {
            const geometry = horizontal
              ? `x1="${xFor(row.end)}" y1="${center + thickness / 2}" x2="${xFor(row.end)}" y2="${center + slot - thickness / 2}"`
              : `x1="${center + thickness / 2}" y1="${yFor(row.end)}" x2="${center + slot - thickness / 2}" y2="${yFor(row.end)}"`;
            svg.push(`<line class="chart-bars__axis-line" ${geometry} data-waterfall-connector="${rowIndex}" aria-hidden="true"/>`);
          }
        }
        valueLabels[rowIndex]?.forEach(item => {
          const negative = item.value < 0;
          const labelCenter = layout === 'grouped' ? center + (item.seriesIndex - (groupSize - 1) / 2) * groupPitch : center;
          const endpoint = negative ? Math.min(item.start, item.end) : Math.max(item.start, item.end);
          const x = horizontal ? xFor(endpoint) + (negative ? -valueGap : valueGap) : labelCenter;
          const y = horizontal ? labelCenter : yFor(endpoint) + (negative ? valueGap : -valueGap);
          const anchor = horizontal ? (negative ? 'end' : 'start') : 'middle';
          const baseline = horizontal ? 'middle' : negative ? 'hanging' : 'auto';
          svg.push(`<text class="chart-bars__label" x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="${baseline}" data-chart-value="${rowIndex}" data-value="${item.value}" pointer-events="none">${escape(item.text)}</text>`);
        });
        const categoryLines = wrappedCategories[rowIndex] || [row.label];
        svg.push(horizontal
          ? `<text class="chart-bars__category" x="${categoryX}" y="${center}" dominant-baseline="middle" text-anchor="end">${escape(row.label)}</text>`
          : `<line class="chart-bars__vertical-line" x1="${margin.left + offset}" y1="${margin.top}" x2="${margin.left + offset}" y2="${bottom}"/><text class="chart-bars__category" x="${center}" y="${bottom + categoryOffset}" dominant-baseline="hanging" text-anchor="middle">${categoryLines.length === 1 ? escape(categoryLines[0]) : categoryLines.map((line, index) => `<tspan x="${center}" dy="${index === 0 ? 0 : labelHeight}">${escape(line)}</tspan>`).join('')}</text>`);
        offset += slot;
      });
      if (horizontal) {
        svg.push(`<line class="chart-bars__axis-line" x1="${xFor(0)}" y1="${margin.top}" x2="${xFor(0)}" y2="${bottom}"/>`);
      } else {
        const axisY = axisTop ? margin.top : yFor(0);
        if (axisY !== bottom) svg.push(`<line class="chart-bars__axis-line" x1="${margin.left}" y1="${axisY}" x2="${width - margin.right}" y2="${axisY}"/>`);
        svg.push(`<line class="chart-bars__vertical-line" x1="${width - margin.right}" y1="${margin.top}" x2="${width - margin.right}" y2="${bottom}"/>`);
      }
      if (horizontal && !visibleRows.length) svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${bottom}" x2="${width - margin.right}" y2="${bottom}" data-chart-closing-axis aria-hidden="true"/>`);
      chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
      if (axis) {
        axis.setAttribute('viewBox', `0 0 ${width} ${axisHeight}`);
        axis.style.width = `${width}px`;
        axis.style.setProperty('--chart-axis-height', `${axisHeight}px`);
        axis.innerHTML = axisLabels.join('');
        syncAxisScroll();
      }
      chart.setAttribute('aria-label', options.showTabs === false ? title : `${title}: ${tabs.find(tab => tab.key === activeTab).label}`);
      chart.innerHTML = svg.join('');
      legend.querySelectorAll('[data-stacked-series]').forEach(item => {
        const selected = Number(item.dataset.stackedSeries) === selectedSeries;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      if (focusKey) chart.querySelector(`[data-row-id="${focusKey.rowId}"][data-series-index="${focusKey.seriesIndex}"]`)?.focus({ preventScroll: true });
    }

    function syncAxisScroll() {
      if (axis) axis.style.transform = `translateX(${-viewport.scrollLeft}px)`;
    }
    function hideTooltip() { tooltip.hidden = true; }
    function positionTooltip(clientX, clientY) {
      const bounds = viewport.getBoundingClientRect();
      const styles = window.getComputedStyle(chart);
      const inset = parseFloat(styles.getPropertyValue('--space-2'));
      const gap = parseFloat(styles.getPropertyValue('--space-3'));
      const x = clientX - bounds.left + viewport.scrollLeft;
      const y = clientY - bounds.top + viewport.scrollTop;
      const left = x + tooltip.offsetWidth + gap > viewport.scrollLeft + viewport.clientWidth - inset ? x - tooltip.offsetWidth - gap : x + gap;
      const top = y + tooltip.offsetHeight + gap > viewport.scrollTop + viewport.clientHeight - inset ? y - tooltip.offsetHeight - gap : y + gap;
      const maxLeft = Math.max(viewport.scrollLeft + inset, viewport.scrollLeft + viewport.clientWidth - tooltip.offsetWidth - inset);
      const maxTop = Math.max(viewport.scrollTop + inset, viewport.scrollTop + viewport.clientHeight - tooltip.offsetHeight - inset);
      tooltip.style.left = `${Math.min(maxLeft, Math.max(viewport.scrollLeft + inset, left))}px`;
      tooltip.style.top = `${Math.min(maxTop, Math.max(viewport.scrollTop + inset, top))}px`;
    }
    function showTooltip(segment, clientX, clientY) {
      tooltip.querySelector('[data-tooltip-title]').textContent = segment.dataset.seriesLabel;
      tooltip.querySelector('[data-tooltip-period]').textContent = segment.dataset.period;
      tooltip.querySelector('[data-tooltip-value]').textContent = formatValue(Number(segment.dataset.value));
      tooltip.hidden = false;
      positionTooltip(clientX, clientY);
    }
    function selectSeries(index, focusKey) {
      if (!Number.isInteger(index) || index < 0 || index >= series.length) return;
      selectedSeries = index;
      hideTooltip();
      render(focusKey);
    }
    function setTab(key) {
      if (!datasets[key]) return;
      activeTab = key;
      series = tabs.find(tab => tab.key === key).series || options.series;
      legend.innerHTML = series.map((item, index) => `<span class="chart-legend__item" data-stacked-series="${index}" role="button" tabindex="0" aria-pressed="false"><i class="chart-legend__dot ${escape(item.className)}" aria-hidden="true"></i>${escape(item.label)}</span>`).join('');
      selectedSeries = null;
      hideTooltip();
      tabButtons.forEach(button => {
        const active = button.dataset.stackedTab === key;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        if (active) panel.setAttribute('aria-labelledby', button.id);
      });
      render();
    }
    chart.addEventListener('pointerover', event => {
      const segment = event.target.closest('[data-chart-segment]');
      if (segment) showTooltip(segment, event.clientX, event.clientY);
    });
    chart.addEventListener('pointermove', event => {
      if (!tooltip.hidden) positionTooltip(event.clientX, event.clientY);
    });
    chart.addEventListener('pointerout', hideTooltip);
    chart.addEventListener('focusin', event => {
      const segment = event.target.closest('[data-chart-segment]');
      if (!segment) return;
      const bounds = segment.getBoundingClientRect();
      showTooltip(segment, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    });
    chart.addEventListener('focusout', hideTooltip);
    function activateSegment(event) {
      const segment = event.target.closest('[data-chart-segment]');
      if (!segment) return;
      selectSeries(Number(segment.dataset.seriesIndex), { rowId: segment.dataset.rowId, seriesIndex: segment.dataset.seriesIndex });
    }
    chart.addEventListener('click', activateSegment);
    chart.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      activateSegment(event);
    });
    legend.addEventListener('click', event => {
      const item = event.target.closest('[data-stacked-series]');
      if (item) selectSeries(Number(item.dataset.stackedSeries));
    });
    legend.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const item = event.target.closest('[data-stacked-series]');
      if (item) selectSeries(Number(item.dataset.stackedSeries));
    });
    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => setTab(button.dataset.stackedTab));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabButtons.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabButtons.length) % tabButtons.length;
        tabButtons[nextIndex].focus();
        tabButtons[nextIndex].click();
      });
    });
    card.addEventListener('click', event => {
      const closePill = event.target.closest('.filter-summary__count-chevron');
      if (closePill) closePill.closest('.pill').remove();
      if (!event.target.closest('[data-stacked-export]')) return;
      const rows = [[categoryLabel, ...series.map(item => `${item.label}, ${unit}`)],
        ...visibleRows.map(row => [row.period || row.label, ...row.values])];
      const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n');
      const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${id}-${activeTab}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    viewport.addEventListener('scroll', () => { syncAxisScroll(); hideTooltip(); });
    render();
    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(() => {
        if (destroyed) return;
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => { hideTooltip(); render(); });
      });
      resizeObserver.observe(viewport);
    }
    document.fonts?.ready?.then(() => { if (!destroyed) render(); });
    return { card, setTab, selectSeries, getView, destroy() {
      destroyed = true;
      resizeObserver?.disconnect();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      hideTooltip();
    } };
  }

  window.BNTCharts = Object.assign(window.BNTCharts || {}, { mountStackedBars, renderStackedBars, splitCategory });
}());
