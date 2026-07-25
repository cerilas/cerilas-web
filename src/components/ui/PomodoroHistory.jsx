import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { api } from '../../lib/api';

const isWeekend = (dateStr) => {
  const dow = new Date(dateStr).getUTCDay();
  return dow === 0 || dow === 6;
};

const MONTH_NAMES = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const formatDateLabel = (dateStr) => {
  const [, month, day] = dateStr.split('-').map(Number);
  return `${day} ${MONTH_NAMES[month - 1]}`;
};

const RANGE_OPTIONS = [
  { label: '3 Gün', value: 3 },
  { label: '1 Hafta', value: 7 },
  { label: '1 Ay', value: 30 },
  { label: '3 Ay', value: 90 },
];

const formatMinutes = (minutes) => {
  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (hours === 0) return `${remainingMinutes} dk`;
  if (remainingMinutes === 0) return `${hours} sa`;
  return `${hours} sa ${remainingMinutes} dk`;
};

// Modern minimal dot
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.totalMinutes === 0) return null;
  return (
    <circle
      cx={cx} cy={cy} r={2.5}
      fill={payload.isWeekend ? '#f59e0b' : '#22d3ee'}
      fillOpacity={0.9}
      stroke="none"
    />
  );
};

const CustomXAxisTick = ({ x, y, payload, dataMap }) => {
  if (!payload?.value) return null;
  const isW = dataMap?.[payload.value];
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={13} textAnchor="middle"
        fill={isW ? '#d97706' : '#6b7280'}
        fontSize={10.5} fontWeight={isW ? 500 : 400}>
        {payload.value}
      </text>
    </g>
  );
};

export default function PomodoroHistory() {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const fetchHistory = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.getPomodoroHistory(days);

        // Build a lookup map: date -> minutes
        const apiMap = {};
        res.forEach(item => { apiMap[item.date] = parseInt(item.totalMinutes, 10); });

        // Generate the full date range (today - days + 1 ... today) in local TRT time
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localToday = new Date(today.getTime() - offset * 60 * 1000);

        const formatted = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(localToday);
          d.setUTCDate(d.getUTCDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          formatted.push({
            label: formatDateLabel(dateStr),
            rawDate: dateStr,
            totalMinutes: apiMap[dateStr] ?? 0,
            isWeekend: isWeekend(dateStr),
          });
        }

        if (isCurrent) setData(formatted);
      } catch (err) {
        console.error('Geçmiş yüklenirken hata:', err);
        if (isCurrent) setError(true);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchHistory();
    return () => { isCurrent = false; };
  }, [days]);

  // Map: label -> isWeekend (for tick coloring)
  const weekendLabelMap = Object.fromEntries(
    data.filter(d => d.isWeekend).map(d => [d.label, true])
  );
  const dailyAverageMinutes = data.length
    ? data.reduce((total, day) => total + day.totalMinutes, 0) / data.length
    : 0;

  return (
    <div className="pomodoro-panel bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Odak Geçmişi</h3>
          <p className="text-sm text-gray-400 mt-1">Günlük toplam odaklanma süresi</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-px bg-cyan-500 inline-block rounded-full"></span>
              Hafta içi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-amber-500/40 inline-block"></span>
              Hafta sonu
            </span>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-1.5">
            {RANGE_OPTIONS.map(({ label, value }) => (
              <button key={value} onClick={() => setDays(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  days === value
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'border border-transparent bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin w-7 h-7 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full" />
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-red-400 text-sm border border-dashed border-red-500/20 rounded-xl">
            Odaklanma verileri yüklenemedi. Lütfen tekrar deneyin.
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl">
            Henüz veri bulunmuyor.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Weekend background bands */}
              {data.filter(d => d.isWeekend).map(d => (
                <ReferenceLine key={d.label} x={d.label}
                  stroke="#f59e0b" strokeOpacity={0.07} strokeWidth={30} />
              ))}

              <CartesianGrid strokeDasharray="3 12" stroke="#374151"
                strokeWidth={0.5} strokeOpacity={0.55} vertical={false} />

              <XAxis dataKey="label" axisLine={false} tickLine={false} dy={6}
                interval={days === 90 ? 8 : days === 30 ? 3 : 0}
                tick={(props) => <CustomXAxisTick {...props} dataMap={weekendLabelMap} />}
              />
              <YAxis stroke="#6b7280" fontSize={10.5} tickLine={false}
                axisLine={false} dx={-4} width={34} />

              <Tooltip
                cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 5' }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  padding: '8px 12px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}
                itemStyle={{ color: '#22d3ee', fontWeight: 500 }}
                labelStyle={{ color: '#64748b', marginBottom: '3px', fontSize: '11px' }}
                formatter={(value, _name, props) => [
                  `${value} dk`,
                  props.payload?.isWeekend ? 'Odak Süresi (Hafta sonu)' : 'Odak Süresi',
                ]}
                labelFormatter={(label) => label}
              />

              <Area type="monotone" dataKey="totalMinutes"
                stroke="#06b6d4" strokeWidth={1.5}
                fill="url(#focusGradient)"
                dot={<CustomDot />}
                activeDot={{ r: 4, fill: '#22d3ee', stroke: '#0e7490', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800/70 flex justify-center">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-3.5 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span className="text-xs text-gray-400">
            {RANGE_OPTIONS.find(option => option.value === days)?.label} için günlük ortalama
          </span>
          <span className="text-sm font-semibold text-cyan-300">
            {loading ? '—' : formatMinutes(dailyAverageMinutes)}
          </span>
        </div>
      </div>
    </div>
  );
}
