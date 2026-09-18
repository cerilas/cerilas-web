import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Lock,
  Eye,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Sliders,
  Brain,
  Coffee,
  Sparkles,
  Flame,
  Check,
  Target,
  Bell,
  Waves,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useToolAnalytics } from '../../hooks/useToolAnalytics';
import { pomodoroManifest } from './manifest';
import { SOUND_OPTIONS, playPomodoroSound } from './sounds';
import PomodoroLiquid from './components/PomodoroLiquid';
import PomodoroSeo from './components/PomodoroSeo';
import AdSlot from '../../components/ui/AdSlot';
import ToolHeader from '../../components/ui/ToolHeader';
import ToolSeoDivider from '../../components/ui/ToolSeoDivider';
import Badge from '../../components/ui/Badge';
import './pomodoro.css';

const DEFAULT_DURATIONS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

const MODE_CONFIG = {
  focus: {
    label: 'Deep Focus',
    badge: 'Deep Focus',
    icon: Brain,
    quickPresets: [15, 25, 45, 60],
  },
  shortBreak: {
    label: 'Short Break',
    badge: 'Short Break',
    icon: Coffee,
    quickPresets: [3, 5, 10, 15],
  },
  longBreak: {
    label: 'Long Break',
    badge: 'Long Break',
    icon: Sparkles,
    quickPresets: [15, 20, 30, 45],
  },
};

const formatTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Safe localStorage active session retrieval
const loadPersistedSession = () => {
  try {
    const raw = localStorage.getItem('cerilas_pomodoro_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export default function PomodoroTimerTool({ onBack, toolMeta }) {
  const { visitorCount, conversionCount, getConversionLabel, trackAction } = useToolAnalytics(
    pomodoroManifest.slug,
    toolMeta
  );

  // Restored previous session from localStorage if user closed the tab or refreshed
  const savedSession = useRef(loadPersistedSession()).current;

  // Mode & Durations State
  const [mode, setMode] = useState(() => savedSession?.mode || 'focus');
  const [durations, setDurations] = useState(() => {
    try {
      const saved = localStorage.getItem('cerilas_pomodoro_durations');
      return saved ? { ...DEFAULT_DURATIONS, ...JSON.parse(saved) } : DEFAULT_DURATIONS;
    } catch {
      return DEFAULT_DURATIONS;
    }
  });

  // Calculate restored timer state across tab closes / page reloads
  const initialTimer = useRef((() => {
    const activeMode = savedSession?.mode || 'focus';
    let activeDurations = DEFAULT_DURATIONS;
    try {
      const saved = localStorage.getItem('cerilas_pomodoro_durations');
      if (saved) activeDurations = { ...DEFAULT_DURATIONS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }

    const modeDuration = savedSession?.duration || ((activeDurations[activeMode] || DEFAULT_DURATIONS[activeMode] || 25) * 60);

    // If timer was running when the tab closed
    if (savedSession?.isRunning && savedSession?.targetEndTime) {
      const now = Date.now();
      const remainingSeconds = Math.round((savedSession.targetEndTime - now) / 1000);
      if (remainingSeconds > 0) {
        return {
          duration: modeDuration,
          timeLeft: remainingSeconds,
          isRunning: true,
          targetEndTime: savedSession.targetEndTime,
          completedWhileAway: false,
        };
      } else {
        return {
          duration: modeDuration,
          timeLeft: 0,
          isRunning: false,
          targetEndTime: null,
          completedWhileAway: true,
        };
      }
    }

    // If timer was paused or not started
    const pausedTime = typeof savedSession?.timeLeft === 'number' ? savedSession.timeLeft : modeDuration;
    return {
      duration: modeDuration,
      timeLeft: Math.max(0, pausedTime),
      isRunning: false,
      targetEndTime: null,
      completedWhileAway: false,
    };
  })()).current;

  const [duration, setDuration] = useState(() => initialTimer.duration);
  const [timeLeft, setTimeLeft] = useState(() => initialTimer.timeLeft);
  const [isRunning, setIsRunning] = useState(() => initialTimer.isRunning);
  const [taskNote, setTaskNote] = useState(() => savedSession?.taskNote || '');

  // Audio settings
  const [selectedSound, setSelectedSound] = useState(() => {
    return localStorage.getItem('cerilas_pomodoro_sound') || 'chime';
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('cerilas_pomodoro_volume');
    return saved !== null ? parseFloat(saved) : 0.35;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Fluid wave animation state (auto-turns off whenever settings are opened)
  const [waveAnimationEnabled, setWaveAnimationEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('cerilas_pomodoro_wave');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleWave = () => {
    setWaveAnimationEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cerilas_pomodoro_wave', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Wave animation is active only when settings drawer is closed and wave is enabled
  const isWaveActive = !showSettings && waveAnimationEnabled;

  // Daily client-side streak statistics (100% in-browser localStorage)
  const [dailyStats, setDailyStats] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const saved = localStorage.getItem('cerilas_pomodoro_daily');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) return parsed;
      }
    } catch {
      // ignore
    }
    return { date: today, sessions: 0, minutes: 0 };
  });

  // Transient feedback toast (strictly zero emojis, modern Lucide icons)
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, icon = 'sparkles') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, icon });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4200);
  }, []);

  // Accurate target timestamp reference to prevent background tab drift
  const targetEndRef = useRef(initialTimer.targetEndTime);
  const timerIntervalRef = useRef(null);

  // Helper to persist active session into localStorage
  const persistSession = useCallback((overrides = {}) => {
    try {
      const payload = {
        mode,
        duration,
        timeLeft,
        isRunning,
        targetEndTime: targetEndRef.current,
        taskNote,
        lastSavedAt: Date.now(),
        ...overrides,
      };
      localStorage.setItem('cerilas_pomodoro_session', JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [mode, duration, timeLeft, isRunning, taskNote]);

  // Handle task note input changes and save state
  const handleTaskNoteChange = (e) => {
    const val = e.target.value;
    setTaskNote(val);
    persistSession({ taskNote: val });
  };

  // Check if session completed while tab was closed
  useEffect(() => {
    if (initialTimer.completedWhileAway && savedSession) {
      const completedMode = savedSession.mode || 'focus';
      const addedMinutes = Math.max(1, Math.round((savedSession.duration || 1500) / 60));

      if (completedMode === 'focus') {
        const today = new Date().toISOString().slice(0, 10);
        setDailyStats((prev) => {
          const isSameDay = prev.date === today;
          const newStats = {
            date: today,
            sessions: (isSameDay ? prev.sessions : 0) + 1,
            minutes: (isSameDay ? prev.minutes : 0) + addedMinutes,
          };
          try {
            localStorage.setItem('cerilas_pomodoro_daily', JSON.stringify(newStats));
          } catch {
            // ignore
          }
          return newStats;
        });

        setLocalCompletedDelta((prev) => prev + 1);
        trackAction('session_complete', { mode: 'focus', durationMinutes: addedMinutes });
        const nextMode = (dailyStats.sessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
        switchMode(nextMode);
        showToast(`Focus session completed while away (+${addedMinutes}m). Ready for ${MODE_CONFIG[nextMode].label}.`, 'check');
      } else {
        switchMode('focus');
        showToast('Break finished while away. Ready to jump into deep focus.', 'brain');
      }
    } else if (initialTimer.isRunning) {
      const modeLabel = MODE_CONFIG[mode]?.label || 'Focus';
      showToast(`Resumed active ${modeLabel} session (${formatTime(initialTimer.timeLeft)} remaining).`, 'sparkles');
    }
  }, []);

  // Multi-tab synchronization and page unload persistence
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cerilas_pomodoro_session' && e.newValue) {
        try {
          const sync = JSON.parse(e.newValue);
          if (sync.mode && sync.mode !== mode) setMode(sync.mode);
          if (typeof sync.duration === 'number') setDuration(sync.duration);
          if (typeof sync.taskNote === 'string') setTaskNote(sync.taskNote);

          if (sync.isRunning && sync.targetEndTime) {
            const remaining = Math.max(0, Math.round((sync.targetEndTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            targetEndRef.current = sync.targetEndTime;
            setIsRunning(true);
          } else {
            setIsRunning(false);
            targetEndRef.current = null;
            if (typeof sync.timeLeft === 'number') setTimeLeft(sync.timeLeft);
          }
        } catch {
          // ignore
        }
      }
    };

    const handleBeforeUnload = () => {
      persistSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mode, persistSession]);

  // Update sound preference in localStorage
  const handleSelectSound = (soundId) => {
    setSelectedSound(soundId);
    try {
      localStorage.setItem('cerilas_pomodoro_sound', soundId);
    } catch {
      // ignore
    }
    playPomodoroSound(soundId, isMuted ? 0 : volume);
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    try {
      localStorage.setItem('cerilas_pomodoro_volume', String(newVol));
    } catch {
      // ignore
    }
  };

  // Change active mode
  const switchMode = useCallback((newMode, customMinutes = null) => {
    setIsRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    targetEndRef.current = null;

    setMode(newMode);
    const mins = customMinutes ?? (durations[newMode] || DEFAULT_DURATIONS[newMode]);
    const totalSecs = mins * 60;
    setDuration(totalSecs);
    setTimeLeft(totalSecs);
    try {
      localStorage.setItem('cerilas_pomodoro_session', JSON.stringify({
        mode: newMode,
        duration: totalSecs,
        timeLeft: totalSecs,
        isRunning: false,
        targetEndTime: null,
        taskNote,
        lastSavedAt: Date.now(),
      }));
    } catch {
      // ignore
    }
  }, [durations, taskNote]);

  // Set duration via quick preset pill
  const handleSelectPresetMinutes = (minutes) => {
    setIsRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    targetEndRef.current = null;

    const totalSecs = minutes * 60;
    setDuration(totalSecs);
    setTimeLeft(totalSecs);

    const updated = { ...durations, [mode]: minutes };
    setDurations(updated);
    try {
      localStorage.setItem('cerilas_pomodoro_durations', JSON.stringify(updated));
    } catch {
      // ignore
    }

    persistSession({ duration: totalSecs, timeLeft: totalSecs, isRunning: false, targetEndTime: null });
  };

  // Custom minute input change from settings
  const handleCustomDurationChange = (targetMode, minsVal) => {
    const parsed = parseInt(minsVal, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 180) return;

    const updated = { ...durations, [targetMode]: parsed };
    setDurations(updated);
    try {
      localStorage.setItem('cerilas_pomodoro_durations', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (mode === targetMode && !isRunning) {
      const totalSecs = parsed * 60;
      setDuration(totalSecs);
      setTimeLeft(totalSecs);
      persistSession({ duration: totalSecs, timeLeft: totalSecs, isRunning: false, targetEndTime: null });
    }
  };

  // Start / Pause timer toggle
  const toggleTimer = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      targetEndRef.current = null;
      persistSession({ isRunning: false, targetEndTime: null, timeLeft });
    } else {
      // Start
      const timeToRun = timeLeft <= 0 ? duration : timeLeft;
      const targetEnd = Date.now() + timeToRun * 1000;
      if (timeLeft <= 0) {
        setTimeLeft(duration);
      }
      targetEndRef.current = targetEnd;
      setIsRunning(true);
      persistSession({ isRunning: true, targetEndTime: targetEnd, timeLeft: timeToRun });
      trackAction('start_timer', { mode, durationMinutes: Math.round(duration / 60) });
    }
  };

  // Reset timer to current duration
  const resetTimer = () => {
    setIsRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    targetEndRef.current = null;
    setTimeLeft(duration);
    persistSession({ isRunning: false, targetEndTime: null, timeLeft: duration });
  };

  // Skip to next stage
  const skipTimer = () => {
    setIsRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    targetEndRef.current = null;

    if (mode === 'focus') {
      // Go to short break or long break based on today's session count
      const nextMode = (dailyStats.sessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      switchMode(nextMode);
      showToast(
        nextMode === 'longBreak'
          ? 'Deep focus session completed. Starting 15-minute restorative long break.'
          : 'Focus session completed. Starting 5-minute short break.',
        'coffee'
      );
    } else {
      switchMode('focus');
      showToast('Break completed. Ready for your next deep focus session.', 'brain');
    }
  };

  // When timer reaches 00:00 (Timer Completion Handler)
  const handleTimerCompleted = useCallback(() => {
    setIsRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    targetEndRef.current = null;

    // 1. Play synthesized acoustic sound
    if (!isMuted) {
      playPomodoroSound(selectedSound, volume);
    }

    // 2. Browser native notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = mode === 'focus' ? 'Focus Session Completed' : 'Break Time Finished';
        const body = mode === 'focus'
          ? 'Great work! Take a breath, stretch, and relax for a few minutes.'
          : 'Break completed. Ready to step back into deep focus.';
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch {
        // ignore notification errors
      }
    }

    // 3. Increment statistics
    if (mode === 'focus') {
      const addedMinutes = Math.max(1, Math.round(duration / 60));
      const today = new Date().toISOString().slice(0, 10);

      setDailyStats((prev) => {
        const isSameDay = prev.date === today;
        const newStats = {
          date: today,
          sessions: (isSameDay ? prev.sessions : 0) + 1,
          minutes: (isSameDay ? prev.minutes : 0) + addedMinutes,
        };
        try {
          localStorage.setItem('cerilas_pomodoro_daily', JSON.stringify(newStats));
        } catch {
          // ignore
        }
        return newStats;
      });

      // Optimistic increment on platform completed counter
      setLocalCompletedDelta((prev) => prev + 1);

      // Track platform conversion event (counted in download_count / use_count)
      trackAction('session_complete', {
        mode: 'focus',
        durationMinutes: addedMinutes,
      });

      const nextMode = (dailyStats.sessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      showToast(`Focus goal accomplished (+${addedMinutes}m). Switching to ${MODE_CONFIG[nextMode].label}.`, 'sparkles');
      switchMode(nextMode);
    } else {
      trackAction('session_complete', { mode, durationMinutes: Math.round(duration / 60) });
      showToast('Break finished. Ready to jump back into deep focus.', 'brain');
      switchMode('focus');
    }
  }, [mode, duration, isMuted, selectedSound, volume, dailyStats.sessions, trackAction, showToast, switchMode]);

  // Main high-precision interval ticker with background delta sync
  useEffect(() => {
    if (!isRunning) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      if (!targetEndRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.round((targetEndRef.current - now) / 1000));

      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleTimerCompleted();
      }
    }, 250);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    };
  }, [isRunning, handleTimerCompleted]);

  // Sync document title with active timer
  useEffect(() => {
    const defaultTitle = 'Free Online Pomodoro Timer with Fluid Wave & Chime | Cerilas Tools';
    if (isRunning) {
      const formatted = formatTime(timeLeft);
      const modeName = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
      document.title = `(${formatted}) ${modeName} • Cerilas Pomodoro`;
    } else if (timeLeft < duration) {
      const formatted = formatTime(timeLeft);
      document.title = `(${formatted}) [Paused] • Cerilas Pomodoro`;
    } else {
      document.title = defaultTitle;
    }

    return () => {
      document.title = defaultTitle;
    };
  }, [isRunning, timeLeft, duration, mode]);

  // Request browser desktop notification permission gently
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        showToast('Desktop browser notifications enabled.', 'bell');
      } else {
        showToast('Desktop notifications permission was not granted.', 'bell');
      }
    }
  };

  // Progress percentage (0% to 100% as time drains or fills)
  // Filling up liquid wave as session completes:
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, ((duration - timeLeft) / duration) * 100)) : 0;

  const currentModeDetails = MODE_CONFIG[mode] || MODE_CONFIG.focus;
  const ModeIcon = currentModeDetails.icon;

  // Full Screen Focus Mode State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef(null);

  const handleUserActivity = useCallback(() => {
    setIsIdle(false);
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 3500);
  }, []);

  const enterFullScreenFocus = useCallback(async () => {
    setIsFullScreen(true);
    setIsIdle(false);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const exitFullScreenFocus = useCallback(async () => {
    setIsFullScreen(false);
    setIsIdle(false);
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFullScreenFocus = useCallback(() => {
    if (isFullScreen) {
      exitFullScreenFocus();
    } else {
      enterFullScreenFocus();
    }
  }, [isFullScreen, enterFullScreenFocus, exitFullScreenFocus]);

  // Sync with browser native fullscreen exit & handle keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullScreenFocus();
      } else if (e.key === 'Escape' && isFullScreen) {
        e.preventDefault();
        exitFullScreenFocus();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen, toggleFullScreenFocus, exitFullScreenFocus]);

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      handleUserActivity();
    } else {
      document.body.style.overflow = '';
      setIsIdle(false);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen, handleUserActivity]);

  return (
    <div className="c-tool-page-container pom-tool-container">
      {/* Standardized Tool Header */}
      <ToolHeader
        title="Pomodoro Focus Timer"
        subtitle="Supercharge your deep work with organic fluid wave physics, acoustic notifications, and customizable intervals."
        onBack={onBack}
        backLabel="All Tools"
        actions={
          <button
            className="pom-fullscreen-btn"
            onClick={toggleFullScreenFocus}
            title="Full Screen Focus Mode (F)"
            aria-label="Full Screen Focus Mode"
          >
            <Maximize2 size={14} />
            <span>Focus Mode</span>
          </button>
        }
        badges={
          <>
            <Badge variant="success" icon={<Lock size={12} strokeWidth={2} />}>
              100% In-Browser Privacy
            </Badge>
            {visitorCount > 0 && (
              <Badge variant="neutral" icon={<Eye size={12} strokeWidth={2} />}>
                {visitorCount.toLocaleString()} visitors
              </Badge>
            )}
            {conversionCount > 0 && (
              <Badge variant="neutral" icon={<CheckCircle2 size={12} strokeWidth={2} />}>
                {conversionCount.toLocaleString()} {getConversionLabel('en')}
              </Badge>
            )}
          </>
        }
      />

      {/* Toast Notification Banner (Modern Lucide Vector Icons, Strictly Zero Emojis) */}
      {toast && (
        <div role="status" aria-live="polite" className="pom-toast-banner">
          {toast.icon === 'coffee' && <Coffee size={16} className="pom-toast-icon icon-emerald" />}
          {toast.icon === 'brain' && <Brain size={16} className="pom-toast-icon icon-blue" />}
          {toast.icon === 'bell' && <Bell size={16} className="pom-toast-icon icon-amber" />}
          {toast.icon === 'check' && <CheckCircle2 size={16} className="pom-toast-icon icon-emerald" />}
          {(!toast.icon || toast.icon === 'sparkles') && <Sparkles size={16} className="pom-toast-icon icon-blue" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Liquid Pomodoro Card */}
      <div className={`pom-timer-card pom-mode-${mode} ${isRunning ? 'is-running' : ''} ${showSettings ? 'settings-open' : ''}`}>
        {/* Dynamic Interactive Liquid Wave Physics Canvas (Automatically turned off when settings opened) */}
        {isWaveActive && (
          <PomodoroLiquid progress={progressPercent} isRunning={isRunning} mode={mode} />
        )}

        {/* Foreground Content */}
        <div className="pom-foreground-content">
          {/* Mode Switcher Tabs */}
          <div className="pom-mode-switcher" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'focus'}
              className={`pom-tab-btn ${mode === 'focus' ? 'active active-focus' : ''}`}
              onClick={() => switchMode('focus')}
            >
              <Brain size={15} /> Focus ({durations.focus}m)
            </button>
            <button
              role="tab"
              aria-selected={mode === 'shortBreak'}
              className={`pom-tab-btn ${mode === 'shortBreak' ? 'active active-shortBreak' : ''}`}
              onClick={() => switchMode('shortBreak')}
            >
              <Coffee size={15} /> Short Break ({durations.shortBreak}m)
            </button>
            <button
              role="tab"
              aria-selected={mode === 'longBreak'}
              className={`pom-tab-btn ${mode === 'longBreak' ? 'active active-longBreak' : ''}`}
              onClick={() => switchMode('longBreak')}
            >
              <Sparkles size={15} /> Long Break ({durations.longBreak}m)
            </button>
          </div>

          {/* Tabular Digital Clock Display */}
          <div className="pom-clock-display">
            <div className="pom-time-digits" aria-label={`Time remaining: ${formatTime(timeLeft)}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="pom-time-progress-text">
              {isRunning ? (
                <span>
                  In Progress • {Math.round(progressPercent)}% elapsed
                </span>
              ) : timeLeft === duration ? (
                <span>Ready to begin • {Math.round(duration / 60)} min session</span>
              ) : (
                <span>Paused • {formatTime(timeLeft)} remaining</span>
              )}
            </div>
          </div>

          {/* Current Task Goal Input */}
          <div className="pom-task-input-wrap">
            <Target size={15} className="pom-task-input-icon" />
            <input
              type="text"
              className="pom-task-input"
              placeholder="What are you working on? (Optional goal note...)"
              value={taskNote}
              onChange={handleTaskNoteChange}
              maxLength={100}
            />
          </div>

          {/* Quick Minute Preset Options for Current Mode */}
          <div className="pom-quick-presets" aria-label="Duration Presets">
            {currentModeDetails.quickPresets.map((mins) => {
              const isActive = Math.round(duration / 60) === mins;
              return (
                <button
                  key={mins}
                  className={`pom-quick-btn ${isActive ? `active active-${mode}` : ''}`}
                  onClick={() => handleSelectPresetMinutes(mins)}
                  title={`Set duration to ${mins} minutes`}
                >
                  {mins} min
                </button>
              );
            })}
          </div>

          {/* Primary Timer Controls */}
          <div className="pom-controls-row">
            {/* Reset Button */}
            <button
              className="pom-icon-btn"
              onClick={resetTimer}
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            {/* Giant Play / Pause Button */}
            <button
              className={`pom-play-btn btn-${mode} ${isRunning ? 'running' : ''}`}
              onClick={toggleTimer}
              title={isRunning ? 'Pause Timer (Space)' : 'Start Timer (Space)'}
              aria-label={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning ? <Pause size={30} /> : <Play size={30} style={{ marginLeft: '4px' }} />}
            </button>

            {/* Skip Button */}
            <button
              className="pom-icon-btn"
              onClick={skipTimer}
              title="Skip to next session"
              aria-label="Skip to next session"
            >
              <SkipForward size={18} />
            </button>

            {/* Settings Drawer Toggle */}
            <button
              className={`pom-icon-btn ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings((prev) => !prev)}
              title="Sound & Duration Settings"
              aria-label="Settings"
            >
              <Sliders size={18} />
            </button>

            {/* Full Screen Focus Toggle */}
            <button
              className="pom-icon-btn"
              onClick={toggleFullScreenFocus}
              title="Full Screen Focus Mode (F)"
              aria-label="Full Screen Focus Mode"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Collapsible Settings Drawer */}
          {showSettings && (
            <div className="pom-settings-panel">
              <div className="pom-settings-header">
                <span>Sound Alerts & Custom Intervals</span>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isMuted ? '#ef4444' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                  }}
                  onClick={() => setIsMuted((prev) => !prev)}
                  title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{isMuted ? 'Muted' : 'Sound On'}</span>
                </button>
              </div>

              {/* Acoustic Sound Options List */}
              <div className="pom-sound-list">
                {SOUND_OPTIONS.map((snd) => {
                  const isCurrent = selectedSound === snd.id;
                  return (
                    <div
                      key={snd.id}
                      className={`pom-sound-item ${isCurrent ? 'active' : ''}`}
                      onClick={() => handleSelectSound(snd.id)}
                    >
                      <div className="pom-sound-item-left">
                        <div className="pom-sound-title">
                          {snd.label} {isCurrent && <Check size={12} style={{ display: 'inline', color: '#3b82f6' }} />}
                        </div>
                        <div className="pom-sound-desc">{snd.description}</div>
                      </div>
                      <button
                        className="pom-sound-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPomodoroSound(snd.id, volume);
                        }}
                        title={`Preview ${snd.label}`}
                        aria-label={`Preview ${snd.label}`}
                      >
                        <Play size={12} style={{ marginLeft: '2px' }} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Volume Slider */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Alert Volume</span>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  disabled={isMuted}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  style={{ width: '140px', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', minWidth: '32px', textAlign: 'right' }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Custom Durations Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Custom Durations (Minutes)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Focus (min)
                    <input
                      type="number"
                      min="1"
                      max="180"
                      className="pom-custom-duration-input"
                      value={durations.focus}
                      onChange={(e) => handleCustomDurationChange('focus', e.target.value)}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Short (min)
                    <input
                      type="number"
                      min="1"
                      max="60"
                      className="pom-custom-duration-input"
                      value={durations.shortBreak}
                      onChange={(e) => handleCustomDurationChange('shortBreak', e.target.value)}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Long (min)
                    <input
                      type="number"
                      min="1"
                      max="90"
                      className="pom-custom-duration-input"
                      value={durations.longBreak}
                      onChange={(e) => handleCustomDurationChange('longBreak', e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {/* Fluid Wave Animation Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <Waves size={15} style={{ color: '#0284c7', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-main)' }}>Fluid Wave Animation</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auto-pauses whenever settings are opened</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleWave}
                  className={`pom-toggle-switch ${waveAnimationEnabled ? 'on' : 'off'}`}
                  aria-label="Toggle fluid wave animation"
                >
                  <span className="pom-toggle-thumb" />
                </button>
              </div>

              {/* Notification Permission Request */}
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <button
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    marginTop: '0.2rem',
                  }}
                  onClick={requestNotificationPermission}
                >
                  Enable Desktop Browser Notifications
                </button>
              )}
            </div>
          )}

          {/* Daily Focus Streak Footer (100% Client-Side Local Storage) */}
          <div className="pom-daily-stats">
            <div className="pom-stat-item">
              <Flame size={15} style={{ color: '#f59e0b' }} />
              <span>Today's Sessions: <strong>{dailyStats.sessions}</strong></span>
            </div>
            <div className="pom-stat-item">
              <ModeIcon size={15} style={{ color: '#3b82f6' }} />
              <span>Focus Time: <strong>{dailyStats.minutes} mins</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Mid Leaderboard AdSlot */}
      <AdSlot format="leaderboard" slotId="ad-pomodoro-mid-leaderboard" />

      {/* Comprehensive 100% English SEO, HowTo, FAQs & Schema.org JSON-LD (Partitioned below the fold) */}
      <ToolSeoDivider label="Pomodoro Technique, Scientific Studies & FAQs" />
      <PomodoroSeo onSelectMode={(selectedMode, mins) => switchMode(selectedMode, mins)} />

      {/* Bottom Billboard AdSlot */}
      <AdSlot format="billboard" slotId="ad-pomodoro-bottom-billboard" />

      {/* Full Screen Focus Mode Overlay (Completely removes all disruptive site elements) */}
      {isFullScreen && (
        <div
          className={`pom-fullscreen-overlay pom-mode-${mode} ${isIdle ? 'is-idle' : ''} ${isRunning ? 'is-running' : ''}`}
          onMouseMove={handleUserActivity}
          onClick={handleUserActivity}
        >
          {/* Background Liquid Wave Physics Canvas (Full Viewport) */}
          {waveAnimationEnabled && (
            <div className="pom-fs-liquid-layer">
              <PomodoroLiquid progress={progressPercent} isRunning={isRunning} mode={mode} />
            </div>
          )}

          {/* Top Glass Control Bar */}
          <div className="pom-fs-top-bar">
            <div className="pom-fs-top-left">
              <div className={`pom-fs-mode-pill mode-${mode}`}>
                <ModeIcon size={14} />
                <span>{currentModeDetails.label}</span>
              </div>
              {taskNote && (
                <div className="pom-fs-task-pill" title={taskNote}>
                  <Target size={13} />
                  <span>{taskNote}</span>
                </div>
              )}
            </div>

            <div className="pom-fs-top-right">
              <button
                className="pom-fs-icon-btn"
                onClick={() => setIsMuted((prev) => !prev)}
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={17} color="#ef4444" /> : <Volume2 size={17} />}
              </button>
              <button
                className="pom-fs-exit-btn"
                onClick={exitFullScreenFocus}
                title="Exit Full Screen Focus Mode (Esc)"
                aria-label="Exit Full Screen Focus Mode"
              >
                <Minimize2 size={15} />
                <span>Exit Focus</span>
              </button>
            </div>
          </div>

          {/* Center Digital Clock & Subtext */}
          <div className="pom-fs-center">
            <div className="pom-fs-time-digits" aria-label={`Time remaining: ${formatTime(timeLeft)}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="pom-fs-subtext">
              {isRunning ? (
                <span>In Progress • {Math.round(progressPercent)}% elapsed</span>
              ) : timeLeft === duration ? (
                <span>Ready to begin • {Math.round(duration / 60)} min session</span>
              ) : (
                <span>Paused • {formatTime(timeLeft)} remaining</span>
              )}
            </div>
          </div>

          {/* Bottom Glass Dock */}
          <div className="pom-fs-bottom-dock">
            <div className="pom-fs-mode-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={mode === 'focus'}
                className={`pom-fs-tab ${mode === 'focus' ? 'active active-focus' : ''}`}
                onClick={() => switchMode('focus')}
              >
                <Brain size={14} /> Focus ({durations.focus}m)
              </button>
              <button
                role="tab"
                aria-selected={mode === 'shortBreak'}
                className={`pom-fs-tab ${mode === 'shortBreak' ? 'active active-shortBreak' : ''}`}
                onClick={() => switchMode('shortBreak')}
              >
                <Coffee size={14} /> Short Break ({durations.shortBreak}m)
              </button>
              <button
                role="tab"
                aria-selected={mode === 'longBreak'}
                className={`pom-fs-tab ${mode === 'longBreak' ? 'active active-longBreak' : ''}`}
                onClick={() => switchMode('longBreak')}
              >
                <Sparkles size={14} /> Long Break ({durations.longBreak}m)
              </button>
            </div>

            <div className="pom-fs-controls-group">
              <button
                className="pom-fs-control-btn"
                onClick={resetTimer}
                title="Reset Timer"
                aria-label="Reset Timer"
              >
                <RotateCcw size={20} />
              </button>

              <button
                className={`pom-fs-play-btn btn-${mode} ${isRunning ? 'running' : ''}`}
                onClick={toggleTimer}
                title={isRunning ? 'Pause Timer (Space)' : 'Start Timer (Space)'}
                aria-label={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? <Pause size={34} /> : <Play size={34} style={{ marginLeft: '4px' }} />}
              </button>

              <button
                className="pom-fs-control-btn"
                onClick={skipTimer}
                title="Skip to next session"
                aria-label="Skip to next session"
              >
                <SkipForward size={20} />
              </button>
            </div>

            <div className="pom-fs-hints">
              <span>[Space] {isRunning ? 'Pause' : 'Start'}</span>
              <span className="dot">•</span>
              <span>[F] Fullscreen</span>
              <span className="dot">•</span>
              <span>[Esc] Exit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
