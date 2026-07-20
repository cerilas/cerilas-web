import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { api } from '../../lib/api';

const isWeekend = (dateStr) => {
  const dow = new Date(dateStr).getUTCDay();
  return dow === 0 || dow === 6;
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.totalMinutes === 0) return null;
  const weekend = payload.isWeekend;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={weekend ? '#f59e0b' : '#06b6d4'}
      stroke={weekend ? '#78350f' : '#164e63'}
      strokeWidth={1.5}
    />
  );
};

const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload) return null;
  const parts = (payload.value || '').split('|');
  const label = parts[0];
  const dateKey = parts[1] || '';
  const weekend = dateKey && isWeekend(dateKey);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle"
        fill={weekend ? '#f59e0b' : '#6b7280'}
        fontSize={11} fontWeight={weekend ? 600 : 400}>
        {label}
      </text>
    </g>
  );
};

export default function PomodoroHistory() {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [days]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getPomodoroHistory(days);
      
      const formattedData = res.map(item => {
        const d = new Date(item.date);
        const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        const weekend = isWeekend(item.date);
        return {
          ...item,
          displayDate: `${dateStr}|${item.date}`,
          isWeekend: weekend
        };
      });
      
      setData(formattedData);
    } catch (err) {
      console.error('Geçmiş yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const weekendItems = data.filter(d => d.isWeekend);

  return (
    <div className="pomodoro-panel bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Odak Geçmişi</h3>
          <p className="text-sm text-gray-400 mt-1">Günlük toplam odaklanma süresi</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
              Hafta içi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500/70"></span>
              Hafta sonu
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${days === 7 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'border border-transparent bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              7 Gün
            </button>
            <button 
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${days === 30 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'border border-transparent bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              30 Gün
            </button>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full" />
          </div>
        ) : data.length === 0 ? (
           <div className="w-full h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-xl">
             Henüz veri bulunmuyor.
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.16}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 8"
                stroke="var(--admin-chart-grid, #374151)"
                strokeWidth={0.6}
                strokeOpacity={0.75}
                vertical={false}
              />
              {/* Highlight weekend columns */}
              {weekendItems.map((d) => (
                <ReferenceLine
                  key={d.displayDate}
                  x={d.displayDate}
                  stroke="#f59e0b"
                  strokeOpacity={0.13}
                  strokeWidth={28}
                />
              ))}
              <XAxis 
                dataKey="displayDate" 
                stroke="#6b7280"
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                dy={10}
                tick={<CustomXAxisTick />}
              />
              <YAxis 
                stroke="var(--admin-chart-axis, #6b7280)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 4' }}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '10px',
                  color: '#ffffff',
                  boxShadow: '0 18px 45px rgb(0 0 0 / 0.28)',
                  fontSize: '12px',
                  padding: '8px 10px'
                }}
                itemStyle={{ color: '#22d3ee', fontWeight: 500 }}
                labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '11px' }}
                formatter={(value, name, props) => {
                  const isW = props.payload?.isWeekend;
                  return [`${value} dk${isW ? ' (H.Sonu)' : ''}`, 'Odak Süresi'];
                }}
                labelFormatter={(label) => {
                  const parts = label.split('|');
                  const displayLabel = parts[0];
                  const dateKey = parts[1] || '';
                  const isW = dateKey && isWeekend(dateKey);
                  return `${displayLabel}${isW ? ' — Hafta sonu' : ''}`;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalMinutes" 
                stroke="var(--admin-chart-accent, #06b6d4)"
                strokeWidth={1.6}
                fillOpacity={1} 
                fill="url(#colorMinutes)" 
                dot={<CustomDot />}
                activeDot={{
                  r: 4,
                  fill: 'var(--admin-chart-accent, #06b6d4)',
                  stroke: 'var(--admin-chart-active-dot-stroke, #1f2937)',
                  strokeWidth: 1.5
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
