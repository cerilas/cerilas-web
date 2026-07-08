import { useEffect, useState } from 'react';
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
  const maxDaily = Math.max(1, ...(data?.daily || []).map((item) => item.views));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site İstatistikleri</h1>
          <p className="mt-1 text-sm text-gray-400">Çerez izni veren ziyaretçilerden gelen sayfa, oturum, süre ve tıklama verileri.</p>
        </div>
        <div className="flex rounded-xl border border-gray-800 bg-gray-900 p-1">
          {[7, 30, 90].map((value) => (
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
              <div className="space-y-2">
                {(data?.daily || []).length === 0 ? (
                  <Empty />
                ) : data.daily.map((item) => (
                  <div key={item.date} className="grid grid-cols-[92px_minmax(0,1fr)_56px] items-center gap-3 text-xs">
                    <span className="text-gray-500">{item.date}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${Math.max(4, (item.views / maxDaily) * 100)}%` }}
                      />
                    </div>
                    <span className="text-right text-gray-300">{item.views}</span>
                  </div>
                ))}
              </div>
            </Panel>

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
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
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
        <div key={`${item.path || item.country || item.label}-${index}`} className="flex items-center justify-between gap-4 py-2 text-sm">
          {render(item)}
        </div>
      ))}
    </div>
  );
}

function Empty({ text = 'Veri yok.' }) {
  return <div className="py-8 text-center text-sm text-gray-500">{text}</div>;
}
