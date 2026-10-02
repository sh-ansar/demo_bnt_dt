(function initStackedBars() {
  const numberFormat = new Intl.NumberFormat('ru-RU');
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

  function mountStackedBars(options) {
    const { host, id, title, tabs, datasets } = options;
    let series = options.series;
    const horizontal = options.orientation === 'horizontal';
    const axisTop = horizontal || options.axisPosition === 'top';
    const unit = options.unit || 'МТ';
    const categoryLabel = options.categoryLabel || 'Период';
    host.insertAdjacentHTML(options.position || 'beforeend', `
      <article class="chart-card chart-card--wide" data-stacked-card="${escape(id)}" aria-labelledby="${escape(id)}-title">
        <header class="chart-card__header">
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
        </header>
        <div class="chart-tabs chart-tabs--four" role="tablist" aria-label="${escape(title)}">
          ${tabs.map((tab, index) => `<button id="${escape(id)}-tab-${index}" class="typography-label-small${index === 0 ? ' is-active' : ''}" type="button" role="tab" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" aria-controls="${escape(id)}-panel" data-stacked-tab="${escape(tab.key)}">${escape(tab.label)}</button>`).join('')}
        </div>
        <div id="${escape(id)}-panel" class="chart-viewport" role="tabpanel" aria-labelledby="${escape(id)}-tab-0">
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
    `);
    const card = host.querySelector(`[data-stacked-card="${id}"]`);
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

    function getView() {
      return datasets[activeTab];
    }

    function render(focusKey) {
      visibleRows = getView();
      const width = horizontal
        ? Math.round(viewport.clientWidth || 1440)
        : Math.max(960, visibleRows.length * 56 + 94, Math.round(viewport.clientWidth || 1440));
      const margin = { top: horizontal ? 0 : axisTop ? 44 : 16, right: 4, bottom: horizontal ? 0 : axisTop ? 16 : 44, left: horizontal ? 64 : 76 };
      let horizontalBarSize = 0;
      let rowHeight = 0;
      let tickOffset = 0;
      let axisHeight = 0;
      let labelHeight = 0;
      let tickWidth = 0;
      let categoryGap = 0;
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
        const categoryWidth = Math.max(...visibleRows.map(row => {
          label.textContent = row.label;
          return label.getComputedTextLength();
        }));
        margin.left = Math.max(margin.left, Math.ceil(categoryWidth) + categoryGap + tickOffset);
        label.textContent = numberFormat.format(options.axisMax);
        tickWidth = label.getComputedTextLength();
        label.remove();
        rowHeight = Math.max(horizontalBarSize, labelHeight) + rowPadding * 2;
        axisHeight = labelHeight + tickOffset;
      }
      const height = horizontal ? visibleRows.length * rowHeight + margin.top + margin.bottom : 420;
      chart.style.setProperty('--chart-bars-height', `${height}px`);
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const bottom = height - margin.bottom;
      const largest = Math.max(...visibleRows.map(row => row.values.reduce((sum, value) => sum + value, 0)));
      const rawMax = Math.max(options.axisMax, largest);
      const step = options.tickStep || rawMax / 6;
      const max = options.tickStep ? Math.ceil(rawMax / step) * step : rawMax;
      const tickCount = Math.round(max / step);
      const tickSpacing = plotWidth / tickCount;
      const labelStride = Math.max(1, Math.ceil((tickWidth + tickOffset) / tickSpacing));
      const order = series.map((_, index) => index);
      if (selectedSeries !== null) order.unshift(...order.splice(order.indexOf(selectedSeries), 1));
      const svg = [];
      const axisLabels = [];
      for (let tick = 0; tick * step <= max; tick += 1) {
        const value = tick * step;
        const x = margin.left + plotWidth * value / max;
        const y = bottom - plotHeight * value / max;
        const label = escape(options.formatTick ? options.formatTick(value) : numberFormat.format(value));
        if (horizontal) {
          svg.push(`<line class="chart-bars__vertical-line" x1="${x}" y1="${margin.top}" x2="${x}" y2="${bottom}"/>`);
          const visible = tick === 0 || tick === tickCount || (tick % labelStride === 0 && (tickCount - tick) * tickSpacing >= tickWidth + tickOffset);
          axisLabels.push(`<text class="chart-bars__tick" x="${tick === 0 ? x : x - tickOffset}" y="${labelHeight}" text-anchor="${tick === 0 ? 'start' : 'end'}" data-tick-value="${value}"${visible ? '' : ' visibility="hidden"'}>${label}</text>`);
        } else {
          svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/><text class="chart-bars__tick" x="${margin.left - 10}" y="${y + 5}" text-anchor="end">${label}</text>`);
        }
      }
      if (horizontal) {
        for (let boundary = 0; boundary <= visibleRows.length; boundary += 1) {
          const y = margin.top + plotHeight * boundary / visibleRows.length;
          svg.push(`<line class="chart-bars__grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/>`);
        }
      }
      let offset = 0;
      visibleRows.forEach((row, rowIndex) => {
        const slot = (horizontal ? plotHeight : plotWidth) / visibleRows.length;
        const center = (horizontal ? margin.top : margin.left) + offset + slot / 2;
        const thickness = horizontal ? Math.min(horizontalBarSize, slot) : Math.min(92, slot * .58);
        let stack = 0;
        order.forEach(seriesIndex => {
          const value = row.values[seriesIndex];
          if (value <= 0) return;
          const length = (horizontal ? plotWidth : plotHeight) * value / max;
          const geometry = horizontal
            ? `x="${margin.left + stack}" y="${center - thickness / 2}" width="${length}" height="${thickness}"`
            : `x="${center - thickness / 2}" y="${bottom - stack - length}" width="${thickness}" height="${length}"`;
          const label = `${row.period || row.label}, ${series[seriesIndex].label}, ${numberFormat.format(value)} ${unit}`;
          svg.push(`<rect class="chart-bars__segment ${escape(series[seriesIndex].className)}" ${geometry} role="button" tabindex="0" aria-pressed="${selectedSeries === seriesIndex}" aria-label="${escape(label)}" data-chart-segment data-row-index="${rowIndex}" data-row-id="${rowIndex}" data-series-index="${seriesIndex}" data-series-label="${escape(series[seriesIndex].label)}" data-period="${escape(row.period || row.label)}" data-value="${value}"/>`);
          stack += length;
        });
        svg.push(horizontal
          ? `<text class="chart-bars__category" x="${margin.left - categoryGap}" y="${center}" dominant-baseline="middle" text-anchor="end">${escape(row.label)}</text>`
          : `<line class="chart-bars__vertical-line" x1="${margin.left + offset}" y1="${margin.top}" x2="${margin.left + offset}" y2="${bottom}"/><text class="chart-bars__category" x="${center}" y="${bottom + 26}" text-anchor="middle">${escape(row.label)}</text>`);
        offset += slot;
      });
      if (horizontal) {
        svg.push(`<line class="chart-bars__axis-line" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${bottom}"/>`);
      } else {
        const axisY = axisTop ? margin.top : bottom;
        svg.push(`<line class="chart-bars__axis-line" x1="${margin.left}" y1="${axisY}" x2="${width - margin.right}" y2="${axisY}"/>`);
      }
      chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
      if (axis) {
        axis.setAttribute('viewBox', `0 0 ${width} ${axisHeight}`);
        axis.style.width = `${width}px`;
        axis.style.setProperty('--chart-axis-height', `${axisHeight}px`);
        axis.innerHTML = axisLabels.join('');
      }
      chart.setAttribute('aria-label', `${title}: ${tabs.find(tab => tab.key === activeTab).label}`);
      chart.innerHTML = svg.join('');
      legend.querySelectorAll('[data-stacked-series]').forEach(item => {
        const selected = Number(item.dataset.stackedSeries) === selectedSeries;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      if (focusKey) chart.querySelector(`[data-row-id="${focusKey.rowId}"][data-series-index="${focusKey.seriesIndex}"]`)?.focus({ preventScroll: true });
    }

    function hideTooltip() { tooltip.hidden = true; }
    function positionTooltip(clientX, clientY) {
      const bounds = viewport.getBoundingClientRect();
      const x = clientX - bounds.left + viewport.scrollLeft;
      const y = clientY - bounds.top + viewport.scrollTop;
      const left = x + tooltip.offsetWidth + 12 > viewport.scrollLeft + viewport.clientWidth ? x - tooltip.offsetWidth - 12 : x + 12;
      const top = y + tooltip.offsetHeight + 12 > viewport.scrollTop + viewport.clientHeight ? y - tooltip.offsetHeight - 12 : y + 12;
      tooltip.style.left = `${Math.max(viewport.scrollLeft + 8, left)}px`;
      tooltip.style.top = `${Math.max(viewport.scrollTop + 8, top)}px`;
    }
    function showTooltip(segment, clientX, clientY) {
      tooltip.querySelector('[data-tooltip-title]').textContent = segment.dataset.seriesLabel;
      tooltip.querySelector('[data-tooltip-period]').textContent = segment.dataset.period;
      tooltip.querySelector('[data-tooltip-value]').textContent = numberFormat.format(Number(segment.dataset.value));
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
    viewport.addEventListener('scroll', hideTooltip);
    render();
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(() => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => { hideTooltip(); render(); });
      }).observe(viewport);
    }
    return { card, setTab, selectSeries, getView };
  }

  window.BNTCharts = Object.assign(window.BNTCharts || {}, { mountStackedBars, splitCategory });
}());
