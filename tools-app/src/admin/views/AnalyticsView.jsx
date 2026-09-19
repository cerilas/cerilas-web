import React from 'react';
import { TrendingUp, BarChart2, PieChart, Activity, Download, Copy, Eye, Play } from 'lucide-react';

export default function AnalyticsView({ statsOverview = null, tools = [] }) {
  const totals = statsOverview?.totals || {};
  const eventBreakdown = statsOverview?.eventBreakdown || [
    { event_type: 'view', count: totals.total_views || 1240 },
    { event_type: 'download', count: totals.total_downloads || 450 },
    { event_type: 'copy', count: totals.total_copies || 210 },
    { event_type: 'use', count: totals.total_uses || 180 }
  ];

  const totalEvents = eventBreakdown.reduce((acc, curr) => acc + (parseInt(curr.count, 10) || 0), 0) || 1;

  // Category counts
  const categoryMap = {};
  tools.forEach(t => {
    const cat = t.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  return (
    <div className="admin-body">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Event Volume Distribution */}
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
          borderRadius: 18,
          padding: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Telemetry Event Distribution</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'block' }}>
            Action breakdown across all tools
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {eventBreakdown.map(ev => {
              const count = parseInt(ev.count, 10) || 0;
              const percent = Math.round((count / totalEvents) * 100);
              return (
                <div key={ev.event_type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {ev.event_type} Actions
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {count.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'rgba(150, 150, 150, 0.1)', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percent}%`, 
                        borderRadius: 999, 
                        background: ev.event_type === 'view' ? '#3b82f6' : (ev.event_type === 'download' ? '#10b981' : '#a855f7') 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Representation */}
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
          borderRadius: 18,
          padding: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Category Inventory</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'block' }}>
            Distribution of tools across domains
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(categoryMap).map(([category, count]) => {
              const percent = Math.round((count / tools.length) * 100);
              return (
                <div key={category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'rgba(150, 150, 150, 0.04)', borderRadius: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{percent}%</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 999, background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                      {count} tools
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
