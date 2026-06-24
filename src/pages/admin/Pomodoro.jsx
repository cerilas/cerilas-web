import React from 'react';
import PomodoroTracker from '../../components/ui/PomodoroTracker';
import PomodoroHistory from '../../components/ui/PomodoroHistory';
import PomodoroStats from '../../components/ui/PomodoroStats';
import PomodoroHeatmap from '../../components/ui/PomodoroHeatmap';
import PomodoroDailyLog from '../../components/ui/PomodoroDailyLog';

export default function Pomodoro() {
  return (
    <div className="max-w-6xl mx-auto mt-6 pb-20">
      <h1 className="text-2xl font-bold text-white mb-2">Odaklanma & Pomodoro</h1>
      <p className="text-gray-400 text-sm mb-8">
        Çalışma sürelerinizi takip edin ve gün sonu odak puanınızı yükseltin. Pomodoro tekniği ile daha verimli çalışabilirsiniz.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Sol Sütun: Sayaç ve İstatistikler */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <PomodoroTracker />
          <PomodoroStats />
        </div>
        
        {/* Sağ Sütun: Geçmiş Grafikleri */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <PomodoroHistory />
          <PomodoroHeatmap />
        </div>
      </div>

      {/* Tam Genişlik: Günlük Kayıt Defteri */}
      <div>
        <PomodoroDailyLog />
      </div>
    </div>
  );
}
