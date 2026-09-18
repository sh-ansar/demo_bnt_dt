(function registerDonutChart() {
  const numberFormatter = new Intl.NumberFormat('ru-RU');

  function escapeXml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  function polarPoint(cx, cy, radius, angle) {
    const radians = (angle - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
  }

  function donutPath(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
    const startOuter = polarPoint(cx, cy, outerRadius, endAngle);
    const endOuter = polarPoint(cx, cy, outerRadius, startAngle);
    const startInner = polarPoint(cx, cy, innerRadius, startAngle);
    const endInner = polarPoint(cx, cy, innerRadius, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${startOuter.x} ${startOuter.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y} L ${startInner.x} ${startInner.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${endInner.x} ${endInner.y} Z`;
  }

  function defaultLabel(item) {
    return item.chartLabel == null ? item.label : item.chartLabel;
  }

  function defaultValue(item, formatValue, unit) {
    if (item.chartValue != null) return item.chartValue;
    return `${item.percent} · ${formatValue(item.value)}${unit ? ` ${unit}` : ''}`;
  }

  function valueParts(item, formatValue, unit) {
    if (Array.isArray(item.chartValueParts)) return item.chartValueParts;
    if (item.chartValue != null) return [{ text: item.chartValue, kind: item.chartValueKind || 'text' }];
    return [
      { text: item.percent, kind: 'percent' },
      { text: ' · ', kind: 'separator' },
      { text: `${formatValue(item.value)}${unit ? ` ${unit}` : ''}`, kind: 'amount' }
    ];
  }

  function textPartMarkup(part, attributes) {
    const kind = part.kind === 'amount' || part.kind === 'percent' || part.kind === 'separator'
      ? ` chart-donut__${part.kind}`
      : '';
    return `<tspan class="chart-donut__text${kind}"${attributes || ''}>${escapeXml(part.text)}</tspan>`;
  }

  function textPartsMarkup(parts) {
    return parts.map(function (part) { return textPartMarkup(part); }).join('');
  }

  function valueMarkup(parts, labelX, shouldWrap) {
    if (!shouldWrap) return textPartsMarkup(parts);

    const separatorIndex = parts.findIndex(function (part) { return part.kind === 'separator'; });
    return parts.map(function (part, index) {
      if (index === 0) return textPartMarkup(part, ` x="${labelX}" dy="0"`);
      if (index === separatorIndex) return textPartMarkup(part, ` x="${labelX}" dy="21"`);
      return textPartMarkup(part);
    }).join('');
  }

  function createTextMeasurer(chart) {
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    probe.setAttribute('x', '0');
    probe.setAttribute('y', '0');
    probe.setAttribute('visibility', 'hidden');
    chart.appendChild(probe);

    function measuredWidth(fallback) {
      try {
        const width = probe.getComputedTextLength();
        return Number.isFinite(width) && width > 0 ? width : fallback;
      } catch (_error) {
        return fallback;
      }
    }

    return {
      label: function (text) {
        const value = String(text);
        probe.setAttribute('class', 'chart-donut__label');
        probe.textContent = value;
        return measuredWidth(value.length * 8);
      },
      value: function (parts) {
        const value = parts.map(function (part) { return String(part.text); }).join('');
        probe.setAttribute('class', 'chart-donut__value');
        probe.innerHTML = textPartsMarkup(parts);
        return measuredWidth(value.length * 7.2);
      },
      destroy: function () { probe.remove(); }
    };
  }

  function wrapLabel(label, availableWidth, measureText) {
    const text = String(label);
    if (measureText(text) <= availableWidth) return [text];

    const lines = [];
    let currentLine = '';
    text.split(/\s+/).forEach(function (word) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (measureText(candidate) <= availableWidth) {
        currentLine = candidate;
        return;
      }

      if (currentLine) lines.push(currentLine);
      currentLine = '';
      if (measureText(word) <= availableWidth) {
        currentLine = word;
        return;
      }

      Array.from(word).forEach(function (character) {
        const chunk = `${currentLine}${character}`;
        if (currentLine && measureText(chunk) > availableWidth) {
          lines.push(currentLine);
          currentLine = character;
        } else {
          currentLine = chunk;
        }
      });
    });
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [text];
  }

  function labelMarkup(lines, labelX, kind) {
    if (lines.length === 1) {
      return kind === 'amount'
        ? textPartMarkup({ text: lines[0], kind: 'amount' })
        : escapeXml(lines[0]);
    }

    return lines.map(function (line, index) {
      const attributes = ` x="${labelX}" dy="${index === 0 ? 0 : 21}"`;
      return kind === 'amount'
        ? textPartMarkup({ text: line, kind: 'amount' }, attributes)
        : `<tspan${attributes}>${escapeXml(line)}</tspan>`;
    }).join('');
  }

  function verticalLabelGap(previous, current) {
    return 48
      + (previous.wrapValue ? 21 : 0)
      + Math.max(0, current.labelLines.length - 1) * 21;
  }

  function safeAttachmentAngle(cx, cy, radius, startAngle, endAngle, targetX, targetY) {
    const targetRadius = Math.hypot(targetX - cx, targetY - cy);
    if (targetRadius <= radius) return null;

    const targetAngle = (Math.atan2(targetY - cy, targetX - cx) * 180 / Math.PI + 90 + 360) % 360;
    const visibleHalfAngle = Math.max(0, Math.acos(radius / targetRadius) * 180 / Math.PI - 1);
    const sectorInset = Math.min(1.5, (endAngle - startAngle) * .15);
    const sectorStart = startAngle + sectorInset;
    const sectorEnd = endAngle - sectorInset;
    const preferredAngle = (startAngle + endAngle) / 2;
    let best = null;

    for (let turn = -2; turn <= 2; turn += 1) {
      const visibleCenter = targetAngle + turn * 360;
      const lowerBound = Math.max(sectorStart, visibleCenter - visibleHalfAngle);
      const upperBound = Math.min(sectorEnd, visibleCenter + visibleHalfAngle);
      if (lowerBound > upperBound) continue;

      const angle = Math.max(lowerBound, Math.min(upperBound, preferredAngle));
      const score = Math.abs(angle - preferredAngle);
      if (!best || score < best.score) best = { angle, score };
    }

    return best ? best.angle : null;
  }

  function findDiagonalPlacement(position, minimumY, maximumY, cx, cy, outer) {
    const minimumDiagonalRise = 14;

    for (let labelY = Math.ceil(minimumY); labelY <= maximumY; labelY += 1) {
      const directAngle = safeAttachmentAngle(
        cx,
        cy,
        outer + 1,
        position.startAngle,
        position.endAngle,
        position.railX,
        labelY
      );
      if (directAngle == null) continue;

      const touchPoint = polarPoint(cx, cy, outer + 1, directAngle);
      if (Math.abs(labelY - touchPoint.y) < minimumDiagonalRise) continue;
      return { labelY, directAngle };
    }

    return null;
  }

  function enforceDiagonalLabelPositions(positions, cx, cy, outer, height) {
    [-1, 1].forEach(function (side) {
      const sideLabels = positions.filter(function (position) { return position.side === side; })
        .sort(function (first, second) { return first.labelY - second.labelY; });
      let previous = null;

      sideLabels.forEach(function (position) {
        const minimumGap = previous ? verticalLabelGap(previous, position) : 0;
        const minimumY = Math.max(position.labelY, previous ? previous.labelY + minimumGap : -Infinity);
        const maximumY = height - (position.wrapValue ? 43 : 22);
        const placement = findDiagonalPlacement(position, minimumY, maximumY, cx, cy, outer);

        if (placement) {
          position.labelY = placement.labelY;
          position.directAngle = placement.directAngle;
        } else {
          position.labelY = minimumY;
          position.directAngle = null;
        }
        previous = position;
      });
    });
  }

  function connectorPath(position, lineEndX) {
    if (position.route === 'direct') {
      return [
        `M ${position.touchPoint.x} ${position.touchPoint.y}`,
        `L ${position.railX} ${position.labelY}`,
        `H ${lineEndX}`
      ].join(' ');
    }

    return [
      `M ${position.touchPoint.x} ${position.touchPoint.y}`,
      `L ${position.exitPoint.x} ${position.exitPoint.y}`,
      `H ${position.railX}`,
      `V ${position.labelY}`,
      `H ${lineEndX}`
    ].join(' ');
  }

  function measuredTextWidth(element, fallback) {
    if (!element) return fallback;
    try {
      const width = element.getComputedTextLength();
      return Number.isFinite(width) && width > 0 ? width : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function fitConnectorRules(chart, positions, width) {
    if (typeof chart.querySelector !== 'function') return;

    positions.forEach(function (position, index) {
      const connector = chart.querySelector(`[data-chart-donut-connector="${index}"]`);
      const label = chart.querySelector(`[data-chart-donut-label="${index}"]`);
      const value = chart.querySelector(`[data-chart-donut-value="${index}"]`);
      if (!connector) return;

      const valueWidth = position.wrapValue
        ? position.fallbackValueWidth
        : measuredTextWidth(value, position.fallbackValueWidth);
      const labelWidth = position.labelLines.length > 1
        ? position.fallbackLabelWidth
        : measuredTextWidth(label, position.fallbackLabelWidth);
      const ruleWidth = Math.max(labelWidth, valueWidth);
      const unclampedEndX = position.labelX + position.side * Math.ceil(ruleWidth);
      const lineEndX = Math.max(8, Math.min(width - 8, unclampedEndX));
      connector.setAttribute('d', connectorPath(position, lineEndX));
    });
  }

  function render(options) {
    const chart = options && options.chart;
    const legend = options && options.legend;
    const data = options && options.data;
    if (!chart || !legend || !Array.isArray(data) || !data.length) return;

    const formatValue = options.formatValue || function (value) { return numberFormatter.format(value); };
    const unit = options.unit == null ? 'МТ' : options.unit;
    const width = Math.max(options.minWidth || 520, Math.round(chart.getBoundingClientRect().width || 640));
    const height = options.height || 390;
    const cx = width / 2;
    const cy = options.centerY || 205;
    const outer = Math.min(options.maxOuterRadius || 132, width * .22);
    const inner = outer * (options.innerRatio || .48);
    const totalWeight = data.reduce(function (sum, item) { return sum + Number(item.weight == null ? item.value : item.weight); }, 0);
    const totalValue = data.reduce(function (sum, item) { return sum + Number(item.value); }, 0);
    const textMeasurer = createTextMeasurer(chart);
    const svg = [];
    const initialAngle = Number(options.startAngle) || 0;
    let angle = initialAngle;

    data.forEach(function (item) {
      const weight = Number(item.weight == null ? item.value : item.weight);
      const span = weight / totalWeight * 360;
      const detail = defaultValue(item, formatValue, unit);
      svg.push(`<path class="chart-donut__slice ${item.className}" d="${donutPath(cx, cy, outer, inner, angle, angle + span)}"><title>${escapeXml(`${item.label}: ${detail}`)}</title></path>`);
      angle += span;
    });

    angle = initialAngle;
    const labelPositions = data.map(function (item) {
      const weight = Number(item.weight == null ? item.value : item.weight);
      const span = weight / totalWeight * 360;
      const startAngle = angle;
      const endAngle = angle + span;
      const middle = angle + span / 2;
      const radians = (middle - 90) * Math.PI / 180;
      const side = Math.cos(radians) >= 0 ? 1 : -1;
      const railX = cx + side * (outer + 28);
      const desiredY = cy + (outer + 22) * Math.sin(radians);
      const labelX = railX + side * 10;
      const availableWidth = side > 0 ? width - 8 - labelX : labelX - 8;
      const labelLines = wrapLabel(defaultLabel(item), availableWidth, textMeasurer.label);
      const fallbackLabelWidth = Math.max.apply(null, labelLines.map(textMeasurer.label));
      const parts = valueParts(item, formatValue, unit);
      const separatorIndex = parts.findIndex(function (part) { return part.kind === 'separator'; });
      const firstLineParts = parts.slice(0, separatorIndex);
      const secondLineParts = parts.slice(separatorIndex);
      const fullValueWidth = textMeasurer.value(parts);
      const wrapValue = separatorIndex > 0 && fullValueWidth > availableWidth;
      const fallbackValueWidth = wrapValue
        ? Math.max(textMeasurer.value(firstLineParts), textMeasurer.value(secondLineParts))
        : fullValueWidth;
      angle += span;
      return {
        item,
        side,
        startAngle,
        endAngle,
        middle,
        railX,
        labelX,
        labelLines,
        desiredY,
        labelY: desiredY,
        fallbackLabelWidth,
        valueParts: parts,
        wrapValue,
        fallbackValueWidth
      };
    });

    [-1, 1].forEach(function (side) {
      const sideLabels = labelPositions.filter(function (position) { return position.side === side; })
        .sort(function (first, second) { return first.desiredY - second.desiredY; });
      sideLabels.forEach(function (position, index) {
        const previous = sideLabels[index - 1];
        // Keep the radial position when there is already enough room. The gap
        // is a minimum, not a fixed step: packing every following label at
        // exactly 48px can pull a lower label upward and force a bad route.
        position.labelY = Math.max(
          34 + Math.max(0, position.labelLines.length - 1) * 21,
          position.desiredY,
          previous ? previous.labelY + verticalLabelGap(previous, position) : -Infinity
        );
      });
    });

    enforceDiagonalLabelPositions(labelPositions, cx, cy, outer, height);

    labelPositions.forEach(function (position, index) {
      const labelX = position.labelX;
      const anchor = position.side > 0 ? 'start' : 'end';
      const lineWidth = Math.max(position.fallbackLabelWidth, position.fallbackValueWidth);
      const lineEndX = Math.max(8, Math.min(width - 8, labelX + position.side * lineWidth));
      // Prefer one diagonal from the sector to the label rule. The attachment
      // is constrained to the part of this sector visible from the elbow, so
      // the diagonal cannot re-enter the donut or cross another sector.
      const directAngle = position.directAngle;
      const route = directAngle == null ? 'outside' : 'direct';
      const touchPoint = polarPoint(cx, cy, outer + 1, directAngle == null ? position.middle : directAngle);
      const exitPoint = directAngle == null ? polarPoint(cx, cy, outer + 18, position.middle) : null;
      const titleMarkup = labelMarkup(position.labelLines, labelX, position.item.chartLabelKind);
      const detailMarkup = valueMarkup(position.valueParts, labelX, position.wrapValue);
      Object.assign(position, { route, touchPoint, exitPoint });
      svg.push(`<path class="chart-donut__connector ${position.item.className}" data-chart-donut-connector="${index}" d="${connectorPath(position, lineEndX)}"/>`);
      svg.push(`<text class="chart-donut__label" data-chart-donut-label="${index}" x="${labelX}" y="${position.labelY - 5 - Math.max(0, position.labelLines.length - 1) * 21}" text-anchor="${anchor}">${titleMarkup}</text>`);
      svg.push(`<text class="chart-donut__value" data-chart-donut-value="${index}" x="${labelX}" y="${position.labelY + 16}" text-anchor="${anchor}">${detailMarkup}</text>`);
    });

    const centerValue = options.centerValue == null ? formatValue(totalValue) : options.centerValue;
    svg.push(`<text class="chart-donut__total" x="${cx}" y="${cy + 7}" text-anchor="middle">${escapeXml(centerValue)}</text>`);
    textMeasurer.destroy();
    chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chart.innerHTML = svg.join('');
    chart.setAttribute('aria-label', options.accessibleLabel || 'Кольцевая диаграмма');
    fitConnectorRules(chart, labelPositions, width);

    const legendData = options.legendData || data;
    legend.innerHTML = legendData.map(function (item) {
      return `<span><i class="chart-legend__dot ${item.className}"></i>${escapeXml(item.label)}</span>`;
    }).join('');
  }

  window.BNTCharts = Object.assign(window.BNTCharts || {}, {
    renderDonut: render
  });
}());
