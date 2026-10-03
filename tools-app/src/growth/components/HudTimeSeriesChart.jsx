import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

const LIGHT_COLOR_MAP = {
  '#38bdf8': '#0284c7', // sky-600
  '#818cf8': '#4f46e5', // indigo-600
  '#f59e0b': '#d97706', // amber-600
  '#fbbf24': '#d97706', // amber-600
  '#10b981': '#059669', // emerald-600
  '#a855f7': '#9333ea', // purple-600
  '#00f0ff': '#0284c7', // sky-600
  '#f472b6': '#db2777', // pink-600
  '#4285f4': '#2563eb', // blue-600
  '#10a37f': '#059669'  // emerald-600
};

/**
 * generateSmoothCurve
 * Computes cubic bezier curve string across points array without distortion
 */
function generateSmoothCurve(pts, minY, maxY) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    let cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;
    let cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    if (minY !== undefined && maxY !== undefined) {
      cp1y = Math.max(minY, Math.min(maxY, cp1y));
      cp2y = Math.max(minY, Math.min(maxY, cp2y));
    }

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function formatAxisNum(val) {
  if (typeof val !== 'number' || isNaN(val)) return '0';
  if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'K';
  return Math.round(val).toString();
}

export default function HudTimeSeriesChart({
  data = [],
  series = [],
  height = 200,
  loading = false,
  invertY = false,
  yMin: customYMin,
  yMax: customYMax,
  valuePrefix = '',
  valueSuffix = '',
  formatValue = (v) => (typeof v === 'number' ? v.toLocaleString('en-US') : v),
  showGrid = true,
  showArea = true,
  chartId = 'hudChart'
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  let isDark = true;
  try {
    const themeCtx = useTheme();
    isDark = themeCtx.isDark;
  } catch (e) {
    if (typeof document !== 'undefined') {
      isDark = document.documentElement.getAttribute('data-theme') !== 'light' && !document.documentElement.classList.contains('light');
    }
  }

  // Measure actual width dynamically for true 1:1 pixel rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    updateWidth();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.round(entry.contentRect.width));
        }
      }
    });
    ro.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const padding = { top: 20, right: 24, bottom: 28, left: 44 };
  const width = Math.max(300, containerWidth);

  const plotWidth = Math.max(100, width - padding.left - padding.right);
  const plotHeight = Math.max(60, height - padding.top - padding.bottom);

  // Compute Min and Max Y
  const { minY, maxY } = useMemo(() => {
    if (!data || data.length === 0 || !series || series.length === 0) {
      return { minY: 0, maxY: 100 };
    }

    let min = Infinity;
    let max = -Infinity;

    series.forEach((s) => {
      data.forEach((d) => {
        const val = d[s.key];
        if (typeof val === 'number' && !isNaN(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;

    if (customYMin !== undefined) min = customYMin;
    if (customYMax !== undefined) max = customYMax;

    const diff = max - min;
    const pad = diff === 0 ? 1 : diff * 0.15;

    const computedMin = customYMin !== undefined ? customYMin : (invertY ? Math.max(1, min - pad) : Math.max(0, min - pad));
    const computedMax = customYMax !== undefined ? customYMax : max + pad;

    return { minY: computedMin, maxY: computedMax };
  }, [data, series, customYMin, customYMax, invertY]);

  // Compute SVG Points for each series
  const seriesPaths = useMemo(() => {
    if (!data || data.length === 0) return [];

    const n = data.length;
    const yRange = maxY - minY || 1;

    return series.map((s, sIdx) => {
      const color = !isDark && LIGHT_COLOR_MAP[s.color] ? LIGHT_COLOR_MAP[s.color] : s.color;

      const pts = data.map((d, i) => {
        const x = padding.left + (i / (n - 1 || 1)) * plotWidth;
        const rawVal = d[s.key];
        const val = typeof rawVal === 'number' ? rawVal : 0;

        let normalizedY;
        if (invertY) {
          normalizedY = (val - minY) / yRange;
        } else {
          normalizedY = (maxY - val) / yRange;
        }

        const y = padding.top + Math.max(0, Math.min(plotHeight, normalizedY * plotHeight));
        return { x, y, val, date: d.date, label: d.label };
      });

      const linePath = generateSmoothCurve(pts, padding.top, padding.top + plotHeight);

      let areaPath = '';
      if (showArea && pts.length > 1 && s.fill !== false) {
        const baselineY = invertY ? padding.top : padding.top + plotHeight;
        areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${baselineY.toFixed(1)} L ${pts[0].x.toFixed(1)} ${baselineY.toFixed(1)} Z`;
      }

      return {
        ...s,
        color,
        pts,
        linePath,
        areaPath,
        gradId: `${chartId}_grad_${sIdx}`
      };
    });
  }, [data, series, minY, maxY, invertY, plotWidth, plotHeight, showArea, chartId, padding.left, padding.top, isDark]);

  // Handle Mouse Hover
  const handleMouseMove = (e) => {
    if (!containerRef.current || !data || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const clampedX = Math.max(padding.left, Math.min(padding.left + plotWidth, clientX));
    const ratio = (clampedX - padding.left) / (plotWidth || 1);
    const closestIdx = Math.round(ratio * (data.length - 1));

    setHoverIndex(Math.max(0, Math.min(data.length - 1, closestIdx)));
    setMousePos({ x: clientX, y: clientY });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Y-axis grid lines (3 clean levels)
  const gridLines = useMemo(() => {
    const lines = [];
    const count = 3;
    for (let i = 0; i <= count; i++) {
      const ratio = i / count;
      const y = padding.top + ratio * plotHeight;
      const val = invertY ? minY + ratio * (maxY - minY) : maxY - ratio * (maxY - minY);
      lines.push({ y, val });
    }
    return lines;
  }, [minY, maxY, plotHeight, invertY, padding.top]);

  // X-axis date labels
  const xLabels = useMemo(() => {
    if (!data || data.length === 0) return [];
    const step = Math.max(1, Math.floor(data.length / (width > 600 ? 6 : 4)));
    const labels = [];
    for (let i = 0; i < data.length; i += step) {
      const x = padding.left + (i / (data.length - 1 || 1)) * plotWidth;
      labels.push({ x, text: data[i].label || data[i].date });
    }
    const lastX = padding.left + plotWidth;
    if (labels.length > 0 && Math.abs(labels[labels.length - 1].x - lastX) > 50) {
      labels.push({ x: lastX, text: data[data.length - 1].label || data[data.length - 1].date });
    }
    return labels;
  }, [data, plotWidth, width, padding.left]);

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  // Render Futuristic Skeleton View during Loading / Time Range Transition
  if (loading) {
    const skeletonGridLines = [0.25, 0.55, 0.85];
    const skelGradId = `${chartId}_skel_grad`;
    const themeColor = isDark ? '#38bdf8' : '#0284c7';

    const wavePoints = [
      { x: padding.left, y: padding.top + plotHeight * 0.72 },
      { x: padding.left + plotWidth * 0.18, y: padding.top + plotHeight * 0.38 },
      { x: padding.left + plotWidth * 0.36, y: padding.top + plotHeight * 0.58 },
      { x: padding.left + plotWidth * 0.58, y: padding.top + plotHeight * 0.22 },
      { x: padding.left + plotWidth * 0.78, y: padding.top + plotHeight * 0.48 },
      { x: padding.left + plotWidth, y: padding.top + plotHeight * 0.30 }
    ];
    const skelLinePath = generateSmoothCurve(wavePoints, padding.top, padding.top + plotHeight);
    const skelAreaPath = `${skelLinePath} L ${padding.left + plotWidth} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z`;

    return (
      <div
        ref={containerRef}
        className="hud-chart-container hud-chart-skeleton-container"
        style={{ position: 'relative', width: '100%', height, userSelect: 'none', overflow: 'hidden' }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            <linearGradient id={skelGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={themeColor} stopOpacity={isDark ? 0.16 : 0.12} />
              <stop offset="70%" stopColor={themeColor} stopOpacity={isDark ? 0.03 : 0.02} />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`${chartId}_skel_shimmer`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0" />
              <stop offset="35%" stopColor={themeColor} stopOpacity="0" />
              <stop offset="50%" stopColor={themeColor} stopOpacity={isDark ? 0.18 : 0.14} />
              <stop offset="65%" stopColor={themeColor} stopOpacity="0" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines & ghost tick labels */}
          {skeletonGridLines.map((ratio, i) => {
            const y = padding.top + ratio * plotHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <rect
                  x={padding.left - 28}
                  y={y - 4}
                  width="20"
                  height="8"
                  rx="3"
                  className="hud-skeleton-rect"
                />
              </g>
            );
          })}

          {/* Skeleton ghost area & spline line */}
          <path
            d={skelAreaPath}
            fill={`url(#${skelGradId})`}
            className="hud-skeleton-area-pulse"
          />
          <path
            d={skelLinePath}
            fill="none"
            stroke={themeColor}
            strokeWidth="2"
            strokeDasharray="5 4"
            strokeLinecap="round"
            className="hud-skeleton-line-dash"
            opacity={isDark ? 0.6 : 0.75}
          />

          {/* Ghost X-axis date tags */}
          {[0.12, 0.38, 0.65, 0.90].map((ratio, i) => (
            <rect
              key={i}
              x={padding.left + ratio * plotWidth - 18}
              y={height - 14}
              width="36"
              height="8"
              rx="3"
              className="hud-skeleton-rect"
            />
          ))}

          {/* Laser scanning beam */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill={`url(#${chartId}_skel_shimmer)`}
            className="hud-skeleton-scanner-beam"
          />
        </svg>

        {/* Central HUD Loading Badge */}
        <div className="hud-chart-skeleton-overlay">
          <div className="hud-skeleton-status-pill">
            <span className="hud-skeleton-spinner-ring" />
            <div className="hud-skeleton-text-group">
              <span className="hud-skeleton-headline">LOADING TIME SERIES</span>
              <span className="hud-skeleton-subline">CALCULATING TELEMETRY...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="hud-chart-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', width: '100%', height, userSelect: 'none' }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {seriesPaths.map((s) => (
            <linearGradient key={s.gradId} id={s.gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={isDark ? (s.fillOpacity || 0.22) : (s.fillOpacity || 0.16)} />
              <stop offset="60%" stopColor={s.color} stopOpacity={isDark ? 0.06 : 0.03} />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal gridlines and Y-axis text */}
        {showGrid &&
          gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={gl.y}
                x2={padding.left + plotWidth}
                y2={gl.y}
                stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.07)"}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={gl.y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill={isDark ? "rgba(161, 161, 170, 0.55)" : "#64748b"}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="500"
              >
                {formatAxisNum(gl.val)}
              </text>
            </g>
          ))}

        {/* Area Fills */}
        {seriesPaths.map(
          (s) =>
            s.areaPath && (
              <path
                key={`area_${s.gradId}`}
                d={s.areaPath}
                fill={`url(#${s.gradId})`}
                style={{ pointerEvents: 'none' }}
              />
            )
        )}

        {/* Series Lines (Clean, crisp 2px stroke, no muddy blur) */}
        {seriesPaths.map((s) => (
          <path
            key={`line_${s.key}`}
            d={s.linePath}
            fill="none"
            stroke={s.color}
            strokeWidth={s.strokeWidth || 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        ))}

        {/* X-axis date labels */}
        {xLabels.map((xl, i) => (
          <text
            key={i}
            x={xl.x}
            y={height - 7}
            textAnchor="middle"
            fontSize="10"
            fill={isDark ? "rgba(161, 161, 170, 0.65)" : "#475569"}
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            {xl.text}
          </text>
        ))}

        {/* Laser crosshair guideline on hover */}
        {hoverIndex !== null && seriesPaths.length > 0 && (
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1={seriesPaths[0].pts[hoverIndex]?.x || 0}
              y1={padding.top}
              x2={seriesPaths[0].pts[hoverIndex]?.x || 0}
              y2={padding.top + plotHeight}
              stroke={isDark ? "rgba(56, 189, 248, 0.45)" : "rgba(2, 132, 199, 0.55)"}
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
            {seriesPaths.map((s) => {
              const pt = s.pts[hoverIndex];
              if (!pt) return null;
              return (
                <g key={`dot_${s.key}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill={s.color}
                    stroke={isDark ? "#0b0f19" : "#ffffff"}
                    strokeWidth="2.5"
                  />
                  <circle cx={pt.x} cy={pt.y} r="1.5" fill={isDark ? "#ffffff" : "#0f172a"} />
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating HUD Tooltip */}
      {hoverIndex !== null && activePoint && (
        <div
          className="hud-chart-tooltip animate-fade"
          style={{
            position: 'absolute',
            left: `${Math.min(
              width - 150,
              Math.max(12, mousePos.x - 70)
            )}px`,
            top: `${Math.max(4, mousePos.y - 80)}px`,
            pointerEvents: 'none',
            zIndex: 20
          }}
        >
          <div className="hud-tooltip-header">
            <span className="hud-tooltip-pulse" />
            <span className="hud-tooltip-date">{activePoint.label || activePoint.date}</span>
          </div>
          <div className="hud-tooltip-body">
            {series.map((s) => {
              const val = activePoint[s.key];
              const displayColor = !isDark && LIGHT_COLOR_MAP[s.color] ? LIGHT_COLOR_MAP[s.color] : s.color;
              return (
                <div key={s.key} className="hud-tooltip-row">
                  <span className="hud-tooltip-dot" style={{ background: displayColor }} />
                  <span className="hud-tooltip-label">{s.label}:</span>
                  <span className="hud-tooltip-val" style={{ color: displayColor }}>
                    {s.valuePrefix || valuePrefix}
                    {formatValue(val)}
                    {s.valueSuffix || valueSuffix}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

