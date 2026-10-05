import React, { useState, useMemo } from 'react';
import * as topojson from 'topojson-client';
import * as d3Geo from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';
import { useTheme } from '../../context/ThemeContext';

const COUNTRY_COORDS = {
  'Turkey': [35.0, 39.0],
  'Türkiye': [35.0, 39.0],
  'Germany': [10.4, 51.1],
  'Almanya': [10.4, 51.1],
  'United States': [-95.7, 37.0],
  'Amerika Birleşik Devletleri': [-95.7, 37.0],
  'United Kingdom': [-2.2, 54.0],
  'Birleşik Krallık': [-2.2, 54.0],
  'Netherlands': [5.3, 52.1],
  'Hollanda': [5.3, 52.1],
  'Azerbaijan': [47.5, 40.1],
  'Azerbaycan': [47.5, 40.1],
  'France': [2.2, 46.2],
  'Fransa': [2.2, 46.2],
  'Russia': [37.6, 55.7],
  'Rusya': [37.6, 55.7]
};

export default function HudRadarWorldMap({
  countries = [],
  selectedCountry,
  onSelectCountry
}) {
  const [hoveredNode, setHoveredNode] = useState(null);

  let isDark = true;
  try {
    const themeCtx = useTheme();
    isDark = themeCtx.isDark;
  } catch (e) {
    if (typeof document !== 'undefined') {
      isDark = document.documentElement.getAttribute('data-theme') !== 'light' && !document.documentElement.classList.contains('light');
    }
  }

  const { landPath, projectedNodes } = useMemo(() => {
    const featureColl = topojson.feature(worldData, worldData.objects.countries);
    const proj = d3Geo.geoEquirectangular().scale(76).translate([240, 120]);
    const pathGen = d3Geo.geoPath().projection(proj);
    const pathStr = pathGen(featureColl) || '';

    const nodes = (countries || []).map((c) => {
      const name = c.country || c.nameTr || '';
      const coord = COUNTRY_COORDS[name] || COUNTRY_COORDS[c.nameTr] || [35.0, 39.0];
      const [x, y] = proj(coord);
      return {
        ...c,
        x,
        y
      };
    });

    return { landPath: pathStr, projectedNodes: nodes };
  }, [countries]);

  const primaryBlipColor = isDark ? '#10b981' : '#059669';
  const defaultBlipColor = isDark ? '#38bdf8' : '#0284c7';

  return (
    <div className="hud-radar-map-widget">
      {/* Radar Map SVG Screen */}
      <div className="radar-map-screen">
        <svg
          viewBox="0 0 480 240"
          className="radar-map-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="radarGridGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={defaultBlipColor} stopOpacity={isDark ? "0.08" : "0.06"} />
              <stop offset="100%" stopColor={defaultBlipColor} stopOpacity="0.0" />
            </radialGradient>
            <filter id="blipGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grid */}
          <rect width="480" height="240" fill={isDark ? "#080d1a" : "#f8fafc"} rx="10" />
          <circle cx="240" cy="120" r="110" fill="url(#radarGridGlow)" />
          <circle cx="240" cy="120" r="70" fill="none" stroke={isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(2, 132, 199, 0.1)"} strokeDasharray="3 3" />
          <circle cx="240" cy="120" r="115" fill="none" stroke={isDark ? "rgba(56, 189, 248, 0.06)" : "rgba(2, 132, 199, 0.08)"} />

          {/* Latitude & Longitude axes */}
          <line x1="20" y1="120" x2="460" y2="120" stroke={isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.05)"} strokeDasharray="2 4" />
          <line x1="240" y1="15" x2="240" y2="225" stroke={isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.05)"} strokeDasharray="2 4" />

          {/* Continents Outline */}
          <path
            d={landPath}
            fill={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)"}
            stroke={isDark ? "rgba(56, 189, 248, 0.28)" : "rgba(2, 132, 199, 0.32)"}
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Radar Blip Nodes */}
          {projectedNodes.map((node, idx) => {
            const isSelected = selectedCountry === node.country;
            const isHovered = hoveredNode?.country === node.country;
            const isPrimary = node.code === 'TR' || node.country === 'Turkey';
            const blipColor = isPrimary ? primaryBlipColor : defaultBlipColor;

            return (
              <g
                key={idx}
                className="radar-blip-group"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectCountry && onSelectCountry(isSelected ? null : node.country)}
              >
                {/* Outer pulse wave */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isPrimary ? 10 : 7}
                  fill="none"
                  stroke={blipColor}
                  strokeWidth="1"
                  opacity={isSelected || isHovered ? 1 : 0.6}
                  className="radar-ping-ring"
                />

                {/* Main pin core */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isPrimary ? 4.5 : 3.5}
                  fill={blipColor}
                  stroke={isDark ? "#080d1a" : "#ffffff"}
                  strokeWidth="1.5"
                  filter="url(#blipGlow)"
                />

                {/* Callout Tag */}
                {(isPrimary || isSelected || isHovered) && (
                  <g transform={`translate(${node.x + 8}, ${node.y - 8})`}>
                    <rect
                      x="0"
                      y="-12"
                      width="58"
                      height="16"
                      rx="3"
                      fill={isDark ? "rgba(10, 16, 28, 0.92)" : "rgba(255, 255, 255, 0.96)"}
                      stroke={blipColor}
                      strokeWidth="0.8"
                    />
                    <text
                      x="5"
                      y="-1"
                      fill={isDark ? "#fff" : "#0f172a"}
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="'Dosis', -apple-system, sans-serif"
                    >
                      {node.code || node.country?.slice(0, 2)} {node.percentage}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover readout badge */}
        {hoveredNode && (
          <div className="radar-node-badge animate-fade">
            <span className="rnb-flag">{hoveredNode.flag}</span>
            <span className="rnb-name">{hoveredNode.country}</span>
            <span className="rnb-stats">
              <strong>{hoveredNode.sessions?.toLocaleString()}</strong> sessions ({hoveredNode.percentage}%)
            </span>
          </div>
        )}
      </div>

      {/* Country Ranking Strip */}
      <div className="hud-country-table">
        {countries.slice(0, 6).map((c, i) => {
          const isSelected = selectedCountry === c.country;
          return (
            <div
              key={i}
              className={`hud-country-row ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectCountry && onSelectCountry(isSelected ? null : c.country)}
            >
              <div className="hcr-meta">
                <span className="hcr-flag">{c.flag}</span>
                <span className="hcr-name">{c.country}</span>
              </div>
              <div className="hcr-bar-wrap">
                <div
                  className="hcr-bar-fill"
                  style={{ width: `${Math.min(100, c.percentage * 1.35)}%` }}
                />
              </div>
              <div className="hcr-nums">
                <span className="hcr-sessions">{c.sessions?.toLocaleString()}</span>
                <span className="hcr-pct">{c.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
