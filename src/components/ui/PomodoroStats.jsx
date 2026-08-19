import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const RANKS = [
  { minHours: 0, title: 'Başlangıç', color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' },
  { minHours: 10, title: 'Odaklanmış', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { minHours: 30, title: 'İstikrarlı', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { minHours: 75, title: 'Derin Çalışan', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { minHours: 150, title: 'Verimlilik Uzmanı', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { minHours: 300, title: 'Akış Ustası', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { minHours: 500, title: 'Zamanın Efendisi', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
];

const getRank = (hours) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (hours >= RANKS[i].minHours) return RANKS[i];
  }
  return RANKS[0];
};

export default function PomodoroStats() {
  const [stats, setStats] = useState({ totalMinutes: 0, currentStreak: 0, streakBreakDate: null, availableRecoveries: 0, totalEarned: 0, totalUsed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getPomodoroStats();
        setStats(res);
      } catch (err) {
        console.error('Failed to fetch pomodoro stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    window.addEventListener('pomodoro-recovered', fetchStats);
    return () => window.removeEventListener('pomodoro-recovered', fetchStats);
  }, []);

  if (loading) {
    return (
      <div className="pomodoro-panel bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg flex animate-pulse h-24">
      </div>
    );
  }

  const hours = Math.floor(stats.totalMinutes / 60);
  const rank = getRank(hours);

  return (
    <div className="flex flex-col gap-4">
      {/* Kombine Seri ve Kurtarma Hakkı Kartı */}
      <div className="pomodoro-panel bg-gray-900 border border-gray-800 rounded-xl shadow-lg flex flex-col relative">
        <div className="p-4 relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <svg className="w-12 h-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.5 10c0-1.5-1-3-2.5-4C13.5 4.5 14.5 2 12 2S9.5 6.5 10 8c-1.5 1-2.5 2.5-2.5 4 0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5zM12 15c-1.5 0-2.5-1-2.5-2.5 0-1 .5-2 1.5-2.5-1 1-.5 2 .5 2.5 1.5.5 2.5-.5 2.5-1.5-.5 0-1-1-1-2 1 .5 1.5 1.5 1.5 2.5 0 1.5-1 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="text-sm text-gray-400 font-medium mb-1">Mevcut Seri</div>
          <div className="text-3xl font-semibold text-white flex items-center gap-2">
            {stats.currentStreak} <span className="text-lg text-gray-500 font-normal">Gün</span>
            {stats.currentStreak > 0 && (
              <svg className="w-5 h-5 text-orange-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.5 10c0-1.5-1-3-2.5-4C13.5 4.5 14.5 2 12 2S9.5 6.5 10 8c-1.5 1-2.5 2.5-2.5 4 0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5z" />
              </svg>
            )}
          </div>
          {stats.streakBreakDate && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Son kırılma:{' '}
                <span className="text-gray-400">
                  {new Date(stats.streakBreakDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Kurtarma Hakkı Footer */}
        <div className="bg-orange-500/10 border-t border-orange-500/20 px-4 py-3 flex justify-between items-center transition-colors hover:bg-orange-500/15 rounded-b-xl">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500/20 p-1.5 rounded-lg shadow-sm">
              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 2L15 8H9L12 2Z M12 22L9 16H15L12 22Z M2 12L8 9V15L2 12Z M22 12L16 15V9L22 12Z M6.5 6.5L10 10V5L6.5 6.5Z M17.5 6.5L14 10V5L17.5 6.5Z M6.5 17.5L10 14V19L6.5 17.5Z M17.5 17.5L14 14V19L17.5 17.5Z"/>
              </svg>
            </div>
            <div className="flex items-center gap-1.5 relative group">
              <span className="text-sm text-orange-500 font-semibold tracking-wide">Kurtarma Hakkı</span>
              <svg className="w-4 h-4 text-orange-500/60 hover:text-orange-500 cursor-help transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              {/* Info Tooltip */}
              <div className="pomodoro-hover-tooltip absolute bottom-full left-0 mb-3 hidden group-hover:block z-[60] w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 cursor-default">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-3 border-b border-gray-700 pb-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Nasıl Çalışır?
                </div>
                <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
                  <p>
                    <strong className="text-orange-400">Kazanım:</strong> Geçmişte yaptığınız her <strong>14 günlük</strong> kesintisiz odaklanma serisi size otomatik olarak 1 adet kurtarma hakkı kazandırır.
                  </p>
                  <p>
                    <strong className="text-orange-400">Kullanım:</strong> Odaklanma Haritası üzerindeki kırık (boş) bir güne tıklayarak o günü "kurtarıldı" olarak işaretleyebilirsiniz.
                  </p>
                  <p>
                    <strong className="text-orange-400">Sonuç:</strong> Kurtarılan gün serinizdeki boşluğu doldurur ve mevcut serinizin kırılmasını önleyerek kaldığı yerden devam etmesini sağlar.
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-700 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Toplam Kazanılan:</span>
                    <span className="font-bold text-orange-500">{stats.totalEarned || 0} Adet</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-900/50 -mx-2 px-2 py-1.5 rounded-lg border border-gray-700/50">
                    <span className="text-cyan-400/80 font-medium">Sonraki hakka kalan:</span>
                    <span className="font-bold text-cyan-400">{14 - (stats.currentStreak % 14)} Gün</span>
                  </div>
                </div>
                
                <div className="pomodoro-hover-tooltip-arrow w-3 h-3 bg-gray-800 border-b border-r border-gray-700 rotate-45 absolute -bottom-1.5 left-6"></div>
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-orange-500">{stats.availableRecoveries || 0}</span>
            <span className="text-xs font-bold text-orange-500/80 uppercase tracking-wider">Adet</span>
          </div>
        </div>
      </div>

      {/* Toplam Odak Kartı */}
      <div className="pomodoro-panel bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
        <div className="text-sm text-gray-400 font-medium mb-1 flex justify-between items-center relative group">
          Toplam Odak
          <div className="flex items-center gap-1.5 cursor-help">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${rank.bg} ${rank.border} ${rank.color} font-bold`}>
              {rank.title}
            </span>
            <svg className="w-4 h-4 text-gray-500 hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            
            {/* Ranks Tooltip */}
            <div className="pomodoro-hover-tooltip absolute top-full right-0 mt-2 hidden group-hover:block z-50 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
              <div className="text-xs font-semibold text-white mb-2 border-b border-gray-700 pb-2">Rütbeler & Hedefler</div>
              <div className="space-y-1.5">
                {RANKS.map((r, i) => {
                  const isCurrent = r.title === rank.title;
                  return (
                    <div key={i} className={`flex justify-between items-center text-xs p-1 rounded ${isCurrent ? 'bg-gray-700' : ''}`}>
                      <span className={`${r.color} font-medium`}>{r.title}</span>
                      <span className="text-gray-400">{r.minHours}+ Saat</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="text-3xl font-semibold text-white">
          {hours} <span className="text-lg text-gray-500 font-normal">Saat</span>
        </div>
      </div>
    </div>
  );
}
