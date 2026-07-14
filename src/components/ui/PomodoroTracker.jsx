import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import PomodoroLiquid from './PomodoroLiquid';

let globalAudioCtx = null;

const loadSavedState = () => {
  try {
    const saved = localStorage.getItem('pomodoroState');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
};

export default function PomodoroTracker() {
  const savedState = loadSavedState();

  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedState) {
      if (savedState.isRunning) {
        const elapsed = Math.floor((Date.now() - savedState.lastTick) / 1000);
        return Math.max(0, savedState.timeLeft - elapsed);
      }
      return savedState.timeLeft;
    }
    return 20 * 60;
  });

  const [isRunning, setIsRunning] = useState(savedState ? savedState.isRunning : false);
  const [duration, setDuration] = useState(savedState ? savedState.duration : 20);
  const [taskLabel, setTaskLabel] = useState(savedState ? (savedState.taskLabel || '') : '');
  const [dailyTotal, setDailyTotal] = useState(0);
  const [selectedSound, setSelectedSound] = useState('beep1');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const intervalRef = useRef(null);

  const SOUND_OPTIONS = [
    { id: 'beep1', label: 'Klasik Bip' },
    { id: 'chime', label: 'Başarı Çanı' },
    { id: 'bell', label: 'Derin Zil' },
    { id: 'chirp', label: 'Çift Kuş' },
    { id: 'soft_ping', label: 'Yumuşak' }
  ];

  const playSound = (type) => {
    try {
      if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume();
      }
      const audioCtx = globalAudioCtx;
      
      const playTone = (freq, waveType, startTime, duration, vol=0.1) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;

      switch(type) {
        case 'chime':
          playTone(523.25, 'sine', now, 0.3);       // C5
          playTone(659.25, 'sine', now + 0.15, 0.3); // E5
          playTone(783.99, 'sine', now + 0.3, 0.6);  // G5
          break;
        case 'bell':
          playTone(300, 'sine', now, 1.5, 0.3);
          break;
        case 'chirp':
          playTone(1200, 'sine', now, 0.1, 0.1);
          playTone(1500, 'sine', now + 0.15, 0.15, 0.1);
          break;
        case 'soft_ping':
          playTone(600, 'triangle', now, 0.8, 0.15);
          break;
        case 'beep1':
        default:
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const res = await api.getPomodoroToday();
      setDailyTotal(res.totalMinutes || 0);
    } catch (error) {
      console.error('Failed to fetch pomodoro stats:', error);
    }
  };

  useEffect(() => {
    fetchTodayStats();
    
    // Fetch settings
    api.getSettings().then(res => {
      if (res && res.pomodoro_sound) {
        setSelectedSound(res.pomodoro_sound);
      }
    }).catch(err => {
      console.error('Ayarlar alınamadı:', err);
    });
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      timeLeft,
      isRunning,
      duration,
      taskLabel,
      lastTick: Date.now()
    };
    localStorage.setItem('pomodoroState', JSON.stringify(stateToSave));
  }, [timeLeft, isRunning, duration, taskLabel]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      // Update browser tab title
      document.title = `(${formatTime(timeLeft)}) Odaklanma - Cerilas`;
    } else if (timeLeft === 0 && isRunning) {
      // Timer finished
      clearInterval(intervalRef.current);
      setIsRunning(false);
      document.title = "Süre Bitti! - Cerilas";
      playSound(selectedSound);
      saveSession(duration);
    } else if (!isRunning) {
      // Reset title when paused/stopped
      document.title = "Cerilas";
    }
    
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, duration]);

  const getLocalYYYYMMDD = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  const saveSession = async (mins) => {
    try {
      await api.savePomodoroSession({ 
        duration_minutes: mins, 
        task_label: taskLabel,
        date_string: getLocalYYYYMMDD()
      });
      toast.success(`${mins} dakikalık odaklanma tamamlandı!`);
      fetchTodayStats();
      setTimeLeft(duration * 60); // Reset for next run
      setTaskLabel(''); // Clear label for next session
    } catch (error) {
      toast.error('Oturum kaydedilemedi.');
    }
  };

  const toggleTimer = () => {
    if (!globalAudioCtx) {
      globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const handleQuickStart = (mins) => {
    setDuration(mins);
    setTimeLeft(mins * 60);
    if (!globalAudioCtx) {
      globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    setIsRunning(true);
  };

  const handleSoundChange = async (soundId) => {
    setSelectedSound(soundId);
    playSound(soundId);
    setSettingsLoading(true);
    try {
      await api.updateSettings({ pomodoro_sound: soundId });
      toast.success('Bitiş melodisi kaydedildi');
    } catch (err) {
      toast.error('Melodi kaydedilemedi');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDurationChange = (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      setDuration(val);
      if (!isRunning) {
        setTimeLeft(val * 60);
      }
    } else if (e.target.value === '') {
      setDuration('');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Prevent divide by zero if duration is somehow empty
  const maxTime = (duration || 1) * 60;
  const progress = Math.min(100, Math.max(0, 100 - (timeLeft / maxTime) * 100));

  return (
    <div className="pomodoro-panel pomodoro-liquid-card bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
      <PomodoroLiquid progress={progress} isRunning={isRunning} />

      <div className="relative z-10 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Odak Sayacı
        </h3>
        
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1 border border-gray-700">
          <input 
            type="number" 
            value={duration} 
            onChange={handleDurationChange}
            disabled={isRunning}
            className="w-10 bg-transparent text-white text-xs text-center focus:outline-none focus:text-cyan-400 disabled:opacity-50"
            min="1"
            max="120"
          />
          <span className="text-xs text-gray-500 mr-2">dk</span>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded transition-all ${showSettings ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
            title="Ayarlar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-xs text-gray-400 mb-2 font-medium">Bitiş Melodisi</div>
          <div className="space-y-1">
            {SOUND_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSoundChange(opt.id)}
                disabled={settingsLoading}
                className={`w-full text-left px-3 py-2 text-xs rounded transition-all flex justify-between items-center ${selectedSound === opt.id ? 'bg-cyan-500/20 text-cyan-400 font-medium border border-cyan-500/30' : 'text-gray-300 hover:bg-gray-700 border border-transparent'}`}
              >
                <span>{opt.label}</span>
                {selectedSound === opt.id && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div className="text-3xl font-semibold text-white tracking-wider tabular-nums">
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTimer}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isRunning ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30'}`}
          >
            {isRunning ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <button 
            onClick={resetTimer}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
            title="Sıfırla"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Task Label Input */}
      <div className="mt-1">
        <input
          type="text"
          value={taskLabel}
          onChange={(e) => setTaskLabel(e.target.value)}
          disabled={isRunning}
          placeholder="Bu oturumda ne yapacaksınız?"
          className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
        />
      </div>

      {/* Quick Starts */}
      {!isRunning && (
        <div className="flex gap-2 mt-1">
          {[12, 19, 30, 45].map(mins => (
            <button
              key={mins}
              onClick={() => handleQuickStart(mins)}
              className="flex-1 bg-gray-800 hover:bg-cyan-900/40 text-gray-300 text-xs py-1.5 rounded border border-gray-700 transition-colors font-medium"
            >
              {mins} dk
            </button>
          ))}
        </div>
      )}
      
      
      <div className="pt-2 mt-1 border-t border-gray-800 flex justify-between items-center text-xs">
        <span className="text-gray-500">Bugünkü Odak Puanı:</span>
        <span className="text-cyan-400 font-bold">{dailyTotal} dk</span>
      </div>
      </div>
    </div>
  );
}
