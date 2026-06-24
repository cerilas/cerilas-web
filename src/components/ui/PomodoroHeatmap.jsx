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

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await api.getPomodoroHistory(182); // ~6 months
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
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg animate-pulse h-[200px]" />
    );
  }

  // Generate last 182 days
  const today = new Date();
  const days = [];
  // Go back 181 days to today = 182 days total (26 weeks)
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      displayDate: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
      minutes: dataMap[dateStr] || 0
    });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Son 6 Aylık Odaklanma Haritası</h3>
          <p className="text-sm text-gray-400 mt-1">Sürekli üretken kalmaya çalışın</p>
        </div>
      </div>

      <div className="min-w-max">
        {/* Heatmap Grid */}
        <div className="grid grid-rows-7 grid-flow-col gap-1.5" style={{ display: 'inline-grid' }}>
          {days.map((day, i) => (
            <div 
              key={i}
              className={`w-3.5 h-3.5 rounded-sm ${getLevel(day.minutes)} transition-colors duration-200 hover:ring-2 hover:ring-white relative group`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 w-max pointer-events-none">
                <div className="bg-gray-800 text-white text-[10px] py-1 px-2 rounded border border-gray-700 shadow-xl whitespace-nowrap">
                  <span className="font-bold text-cyan-400">{day.minutes} dk</span> odaklanma
                  <div className="text-gray-400 mt-0.5">{day.displayDate}</div>
                </div>
                <div className="w-2 h-2 bg-gray-800 border-b border-r border-gray-700 rotate-45 -mt-1.5"></div>
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
