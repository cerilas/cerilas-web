import { useEffect, useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';

const formatDuration = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} sn`;
  return `${mins} dk ${secs} sn`;
};

const countryLabel = (country) => {
  if (!country || country === 'XX') return 'Bilinmiyor';
  return country;
};

const toLocalDateKey = (date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
};

const formatChartLabel = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

export default function AnalyticsAdmin() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getAnalyticsSummary(days)
      .then(setData)
      .catch((err) => setError(err.message || 'İstatistikler yüklenemedi'))
      .finally(() => setLoading(false));
  }, [days]);

  const overview = data?.overview || {};
  const dailyChartData = useMemo(() => {
    const rows = data?.daily || [];
    const byDate = new Map(rows.map((item) => [item.date, item]));
    const today = new Date();

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - index));
      const dateKey = toLocalDateKey(date);
      const item = byDate.get(dateKey);

      return {
        date: dateKey,
        label: formatChartLabel(dateKey),
        views: item?.views || 0,
        sessions: item?.sessions || 0,
      };
    });
  }, [data?.daily, days]);
  const hasDailyData = dailyChartData.some((item) => item.views > 0 || item.sessions > 0);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site İstatistikleri</h1>
          <p className="mt-1 text-sm text-gray-400">Çerez izni veren ziyaretçilerden gelen sayfa, oturum, süre ve tıklama verileri.</p>
        </div>
        <div className="flex rounded-xl border border-gray-800 bg-gray-900 p-1">
          {[1, 3, 7, 30, 90].map((value) => (
            <button
              key={value}
              onClick={() => setDays(value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                days === value ? 'bg-cyan-400 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              {value} gün
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Giriş / Sayfa Görüntüleme" value={overview.page_views || 0} />
            <StatCard title="Benzersiz Ziyaretçi" value={overview.unique_visitors || 0} />
            <StatCard title="Benzersiz Oturum" value={overview.unique_sessions || 0} />
            <StatCard title="Ortalama Session" value={formatDuration(overview.avg_session_seconds || 0)} />
            <StatCard title="Tıklama" value={overview.clicks || 0} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel title="Günlük Trafik" className="xl:col-span-2">
              {hasDailyData ? (
                <div className="mb-5 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailyChartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="analyticsViewsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--admin-chart-accent, #06b6d4)" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="var(--admin-chart-accent, #06b6d4)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="var(--admin-chart-grid, #374151)"
                        strokeDasharray="2 8"
                        strokeOpacity={0.72}
                        strokeWidth={0.6}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke="var(--admin-chart-axis, #6b7280)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={days > 30 ? 8 : days > 7 ? 4 : 0}
                        dy={10}
                      />
                      <YAxis
                        stroke="var(--admin-chart-axis, #6b7280)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        dx={-8}
                      />
                      <Tooltip
                        cursor={{ stroke: 'var(--admin-chart-cursor, #475569)', strokeWidth: 1, strokeDasharray: '3 4' }}
                        content={<AnalyticsTooltip />}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        name="Sayfa Görüntüleme"
                        stroke="var(--admin-chart-accent, #06b6d4)"
                        strokeWidth={1.7}
                        fill="url(#analyticsViewsGradient)"
                        activeDot={{
                          r: 4,
                          fill: 'var(--admin-chart-accent, #06b6d4)',
                          stroke: 'var(--admin-chart-active-dot-stroke, #1f2937)',
                          strokeWidth: 1.5,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        name="Oturum"
                        stroke="var(--admin-chart-secondary, #22c55e)"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{
                          r: 3.5,
                          fill: 'var(--admin-chart-secondary, #22c55e)',
                          stroke: 'var(--admin-chart-active-dot-stroke, #1f2937)',
                          strokeWidth: 1.5,
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty />
              )}
            </Panel>

            <Panel title="Trafik Kaynakları">
              <List
                items={data?.trafficSources || []}
                empty="Kaynak verisi yok."
                render={(item) => (
                  <>
                    <span className="truncate text-gray-300">{item.source}</span>
                    <span className="text-gray-500">{item.sessions} oturum</span>
                  </>
                )}
              />
            </Panel>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel title="Ülkeye Göre">
              <List
                items={data?.byCountry || []}
                empty="Ülke verisi yok."
                render={(item) => (
                  <>
                    <span className="truncate text-gray-300">{countryLabel(item.country)}</span>
                    <span className="text-gray-500">{item.views} görüntüleme</span>
                  </>
                )}
              />
            </Panel>

            <Panel title="Sayfaya Göre Ziyaret">
              <List
                items={data?.byPage || []}
                empty="Sayfa görüntüleme verisi yok."
                render={(item) => (
                  <>
                    <span className="truncate text-gray-300">{item.path || '/'}</span>
                    <span className="text-gray-500">{item.views} görüntüleme</span>
                  </>
                )}
              />
            </Panel>

            <Panel title="En Çok Tıklananlar">
              <List
                items={data?.clicks || []}
                empty="Tıklama verisi yok."
                render={(item) => (
                  <>
                    <span className="truncate text-gray-300">{item.label}</span>
                    <span className="text-gray-500">{item.clicks} tık</span>
                  </>
                )}
              />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const views = payload.find((item) => item.dataKey === 'views')?.value || 0;
  const sessions = payload.find((item) => item.dataKey === 'sessions')?.value || 0;

  return (
    <div
      className="rounded-[10px] px-3 py-2 text-xs"
      style={{
        backgroundColor: 'var(--admin-chart-tooltip-bg, #1f2937)',
        border: '1px solid var(--admin-chart-tooltip-border, #374151)',
        boxShadow: 'var(--admin-chart-tooltip-shadow, 0 18px 45px rgb(0 0 0 / 0.28))',
        color: 'var(--admin-chart-tooltip-text, #ffffff)',
      }}
    >
      <div className="mb-1 text-[11px]" style={{ color: 'var(--admin-chart-tooltip-muted, #9ca3af)' }}>{label}</div>
      <div className="flex items-center justify-between gap-6">
        <span>Görüntüleme</span>
        <span className="font-semibold" style={{ color: 'var(--admin-chart-accent, #22d3ee)' }}>{views}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-6">
        <span>Oturum</span>
        <span className="font-semibold" style={{ color: 'var(--admin-chart-secondary, #22c55e)' }}>{sessions}</span>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="text-xs uppercase tracking-wider text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Panel({ title, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-gray-800 bg-gray-900 p-4 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function List({ items, empty, render }) {
  if (!items.length) return <Empty text={empty} />;
  return (
    <div className="divide-y divide-gray-800">
      {items.map((item, index) => (
        <div key={`${item.path || item.country || item.label || item.source}-${index}`} className="flex items-center justify-between gap-4 py-2 text-sm">
          {render(item)}
        </div>
      ))}
    </div>
  );
}

function Empty({ text = 'Veri yok.' }) {
  return <div className="py-8 text-center text-sm text-gray-500">{text}</div>;
}
