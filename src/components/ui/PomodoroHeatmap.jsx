import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const getLevel = (minutes, isWeekend, isRecovered) => {
  if (isRecovered) return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] border border-orange-400';
  if (isWeekend && minutes === 0) return 'bg-gray-800/40'; // lighter empty for weekends
  if (minutes === 0) return 'bg-gray-800';
  if (minutes < 30) return 'bg-cyan-900/50';
  if (minutes < 60) return 'bg-cyan-700/60';
  if (minutes < 120) return 'bg-cyan-500/80';
  return 'bg-cyan-400';
};

const isDayWeekend = (dateStr) => {
  const dow = new Date(dateStr).getUTCDay();
  return dow === 0 || dow === 6;
};

export default function PomodoroHeatmap() {
  const [dataMap, setDataMap] = useState({});
  const [recoveredMap, setRecoveredMap] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(365); // Default to 1 Yıl
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, day: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, statsRes] = await Promise.all([
        api.getPomodoroHistory(range),
        api.getPomodoroStats()
      ]);
      const map = {};
      const recMap = {};
      histRes.forEach(item => {
        map[item.date] = item.totalMinutes;
        recMap[item.date] = item.isRecovered;
      });
      setDataMap(map);
      setRecoveredMap(recMap);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to fetch heatmap data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const handleDayClick = async (day) => {
    const canRecover = day.minutes === 0 && !day.isWeekend && !day.isRecovered;
    if (canRecover && stats?.availableRecoveries > 0) {
      setConfirmModal({ isOpen: true, day });
    } else if (canRecover && stats?.availableRecoveries === 0) {
      toast.error('Zincir kurtarma hakkınız bulunmuyor. Her 14 günlük eksiksiz seri için 1 hak kazanırsınız!');
    }
  };

  const confirmRecovery = async () => {
    const { day } = confirmModal;
    if (!day) return;
    try {
      await api.recoverPomodoroDay(day.dateStr);
      toast.success('Gün başarıyla kurtarıldı! Seri onarıldı.');
      fetchData();
      window.dispatchEvent(new CustomEvent('pomodoro-recovered'));
    } catch (err) {
      toast.error(err.message || 'Kurtarma işlemi başarısız oldu');
    } finally {
      setConfirmModal({ isOpen: false, day: null });
    }
  };

  if (loading) {
    return (
      <div className="pomodoro-panel bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg animate-pulse h-[200px]" />
    );
  }

  // Generate last N days
  const today = new Date();
  const days = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Adjust to local timezone for correct date string
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    const dateStr = local.toISOString().split('T')[0];
    
    days.push({
      dateStr,
      displayDate: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
      minutes: dataMap[dateStr] || 0,
      isRecovered: recoveredMap[dateStr] || false,
      isWeekend: isDayWeekend(dateStr)
    });
  }

  return (
    <div className="pomodoro-panel bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg overflow-x-auto relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Odaklanma Haritası</h3>
          <p className="text-sm text-gray-400 mt-1">Sürekli üretken kalmaya çalışın</p>
        </div>
        
        <div className="pomodoro-range-switcher flex bg-gray-800/60 p-1 rounded-xl border border-gray-700/50 backdrop-blur-sm">
          {[
            { value: 30, label: '1 Ay' },
            { value: 90, label: '3 Ay' },
            { value: 182, label: '6 Ay' },
            { value: 365, label: '1 Yıl' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRange(item.value)}
              className={`pomodoro-range-option relative px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 ease-out ${
                range === item.value 
                  ? 'pomodoro-range-option-active text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {range === item.value && (
                <div className="pomodoro-range-active-bg absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.4)] animate-in zoom-in-95 duration-200 pointer-events-none" />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-max">
        {/* Heatmap Grid */}
        <div 
          key={range}
          className="grid grid-rows-7 grid-flow-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out" 
          style={{ display: 'inline-grid' }}
        >
          {days.map((day, i) => {
            const canRecover = day.minutes === 0 && !day.isWeekend && !day.isRecovered;
            const isClickable = canRecover;
            return (
              <div 
                key={i}
                onClick={() => handleDayClick(day)}
                className={`w-3.5 h-3.5 rounded-sm ${getLevel(day.minutes, day.isWeekend, day.isRecovered)} transition-colors duration-200 ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-orange-400' : 'hover:ring-2 hover:ring-white'} relative group ${
                  day.isWeekend && day.minutes === 0 && !day.isRecovered ? 'opacity-50' : ''
                }`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 w-max pointer-events-none">
                  <div className="pomodoro-hover-tooltip bg-gray-800 text-white text-[10px] py-1 px-2 rounded border border-gray-700 shadow-xl whitespace-nowrap">
                    {day.isRecovered ? (
                      <span className="font-semibold text-orange-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15 8H9L12 2Z M12 22L9 16H15L12 22Z M2 12L8 9V15L2 12Z M22 12L16 15V9L22 12Z M6.5 6.5L10 10V5L6.5 6.5Z M17.5 6.5L14 10V5L17.5 6.5Z M6.5 17.5L10 14V19L6.5 17.5Z M17.5 17.5L14 14V19L17.5 17.5Z"/></svg>
                        Kurtarılmış Gün
                      </span>
                    ) : (
                      <><span className={`font-semibold ${day.isWeekend ? 'text-orange-400' : 'text-cyan-400'}`}>{day.minutes} dk</span> odaklanma</>
                    )}
                    <div className="text-gray-400 mt-0.5">
                      {day.displayDate}
                      {day.isWeekend && !day.isRecovered && <span className="text-orange-500/80 ml-1">(Hafta sonu)</span>}
                    </div>
                    {canRecover && stats?.availableRecoveries > 0 && (
                      <div className="mt-1 text-orange-400 border-t border-gray-700 pt-1">
                        Tıklayarak zinciri kurtarın
                      </div>
                    )}
                    {canRecover && stats?.availableRecoveries === 0 && (
                      <div className="mt-1 text-gray-500 border-t border-gray-700 pt-1">
                        Kurtarma hakkı yok
                      </div>
                    )}
                  </div>
                  <div className="pomodoro-hover-tooltip-arrow w-2 h-2 bg-gray-800 border-b border-r border-gray-700 rotate-45 -mt-1.5"></div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 flex-wrap">
          <span>Daha az</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-gray-800"></div>
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-900/50"></div>
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-700/60"></div>
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/80"></div>
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400"></div>
          <span>Daha fazla</span>
          <span className="mx-2 text-gray-700">|</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-gray-800/40 opacity-50"></div>
          <span>Hafta sonu (isteğe bağlı)</span>
          <span className="mx-2 text-gray-700">|</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] border border-orange-400"></div>
          <span className="text-orange-400 font-medium">Kurtarıldı</span>
        </div>
      </div>

      {confirmModal.isOpen && confirmModal.day && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 rounded-full p-3 border border-gray-800 shadow-[0_4px_20px_rgba(249,115,22,0.3)]">
              <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15 8H9L12 2Z M12 22L9 16H15L12 22Z M2 12L8 9V15L2 12Z M22 12L16 15V9L22 12Z M6.5 6.5L10 10V5L6.5 6.5Z M17.5 6.5L14 10V5L17.5 6.5Z M6.5 17.5L10 14V19L6.5 17.5Z M17.5 17.5L14 14V19L17.5 17.5Z"/>
              </svg>
            </div>
            
            <div className="mt-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Seriyi Kurtar</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                <strong className="text-white">{confirmModal.day.displayDate}</strong> günündeki kırık zinciri onarmak istiyor musunuz? 
                Bu işlem <span className="text-orange-500 font-semibold">1 kurtarma hakkınıza</span> mal olacak.
              </p>
              
              <div className="bg-gray-800/50 rounded-xl p-3 mb-6 flex justify-between items-center border border-gray-700/50">
                <span className="text-sm text-gray-400 font-medium">Kalan Hakkınız</span>
                <span className="font-bold text-orange-500 text-lg">{stats?.availableRecoveries}</span>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal({ isOpen: false, day: null })}
                  className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors duration-200 border border-gray-700"
                >
                  İptal
                </button>
                <button 
                  onClick={confirmRecovery}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-[#ffffff] text-sm font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
