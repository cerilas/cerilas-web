import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function PomodoroDailyLog() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Format Date for Input and API
  const getYYYYMMDD = (d) => {
    // Correct for local timezone
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  const fetchSessions = async (date) => {
    setLoading(true);
    try {
      const dateStr = getYYYYMMDD(date);
      const res = await api.getPomodoroDailySessions(dateStr);
      setSessions(res || []);
    } catch (err) {
      console.error('Failed to fetch daily sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(selectedDate);
  }, [selectedDate]);

  const changeDate = (daysToAdd) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + daysToAdd);
    setSelectedDate(newDate);
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDateChange = (e) => {
    if (e.target.value) {
      setSelectedDate(new Date(e.target.value));
    }
  };

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Günlük Kayıt Defteri</h3>
          <p className="text-sm text-gray-400 mt-1">Oturum notlarınızı ve detaylarınızı inceleyin</p>
        </div>

        {/* Hybrid Date Picker */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button 
            onClick={() => changeDate(-1)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Önceki Gün"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative">
            <input 
              type="date"
              value={getYYYYMMDD(selectedDate)}
              onChange={handleDateChange}
              max={getYYYYMMDD(new Date())}
              className="bg-transparent text-white font-medium text-sm focus:outline-none cursor-pointer py-1 px-2 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          <button 
            onClick={() => changeDate(1)}
            disabled={getYYYYMMDD(selectedDate) === getYYYYMMDD(new Date())}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Sonraki Gün"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-cyan-400 font-medium">
        Toplam: {totalMinutes} dk odaklanma
      </div>

      <div className="min-h-[300px] relative">
        <div 
          key={getYYYYMMDD(selectedDate)} 
          className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
        >
          {loading ? (
            <div className="animate-pulse space-y-3 absolute inset-0">
              <div className="h-20 bg-gray-800/50 rounded-lg w-full"></div>
              <div className="h-20 bg-gray-800/50 rounded-lg w-full"></div>
              <div className="h-20 bg-gray-800/50 rounded-lg w-full"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-800/30 rounded-lg border border-gray-800 border-dashed absolute inset-0 flex items-center justify-center">
              Bu tarihte herhangi bir odaklanma kaydı bulunmuyor.
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:border-gray-500 hover:bg-gray-800">
                <div className="flex flex-col items-start min-w-[100px]">
                  <span className="text-white font-bold text-lg">{formatTime(session.created_at)}</span>
                  <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full mt-1 border border-cyan-500/20">
                    {session.duration_minutes} dk
                  </span>
                </div>
                <div className="w-px h-10 bg-gray-700 hidden sm:block"></div>
                <div className="flex-1">
                  <p className="text-gray-300 text-sm">
                    {session.task_label || <span className="text-gray-500 italic">Etiket belirtilmedi</span>}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
