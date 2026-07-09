import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const getLevel = (minutes) => {
  if (minutes === 0) return 'bg-gray-800';
  if (minutes < 30) return 'bg-cyan-900/50';
  if (minutes < 60) return 'bg-cyan-700/60';
  if (minutes < 120) return 'bg-cyan-500/80';
  return 'bg-cyan-400';
};

export default function PomodoroHeatmap() {
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(365); // Default to 1 Yıl

  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true);
      try {
        const res = await api.getPomodoroHistory(range);
        const map = {};
        res.forEach(item => {
          map[item.date] = item.totalMinutes;
        });
        setDataMap(map);
      } catch (err) {
        console.error('Failed to fetch heatmap data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, [range]);

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
      minutes: dataMap[dateStr] || 0
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
          {days.map((day, i) => (
            <div 
              key={i}
              className={`w-3.5 h-3.5 rounded-sm ${getLevel(day.minutes)} transition-colors duration-200 hover:ring-2 hover:ring-white relative group`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 w-max pointer-events-none">
                <div className="pomodoro-hover-tooltip bg-gray-800 text-white text-[10px] py-1 px-2 rounded border border-gray-700 shadow-xl whitespace-nowrap">
                  <span className="font-semibold text-cyan-400">{day.minutes} dk</span> odaklanma
                  <div className="text-gray-400 mt-0.5">{day.displayDate}</div>
                </div>
                <div className="pomodoro-hover-tooltip-arrow w-2 h-2 bg-gray-800 border-b border-r border-gray-700 rotate-45 -mt-1.5"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 justify-end">
          <span>Daha az</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-gray-800"></div>
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-900/50"></div>
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-700/60"></div>
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/80"></div>
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400"></div>
          <span>Daha fazla</span>
        </div>
      </div>
    </div>
  );
}
