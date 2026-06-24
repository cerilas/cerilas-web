import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../lib/api';

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
        return {
          ...item,
          displayDate: dateStr
        };
      });
      
      setData(formattedData);
    } catch (err) {
      console.error('Geçmiş yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Odak Geçmişi</h3>
          <p className="text-sm text-gray-400 mt-1">Günlük toplam odaklanma süreleriniz (dakika)</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setDays(7)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${days === 7 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            Son 7 Gün
          </button>
          <button 
            onClick={() => setDays(30)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${days === 30 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            Son 30 Gün
          </button>
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
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                formatter={(value) => [`${value} dk`, 'Odak Süresi']}
              />
              <Area 
                type="monotone" 
                dataKey="totalMinutes" 
                stroke="#06b6d4" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMinutes)" 
                activeDot={{ r: 6, fill: '#06b6d4', stroke: '#1f2937', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
