let globalAudioCtx = null;

export const SOUND_OPTIONS = [
  { id: 'chime', label: 'Harmonic Chime', description: 'Uplifting triple-chord celebration' },
  { id: 'bell', label: 'Zen Meditation Bell', description: 'Deep calming acoustic gong' },
  { id: 'beep1', label: 'Digital Beep', description: 'Clean modern focus notification' },
  { id: 'chirp', label: 'Forest Chirp', description: 'Gentle nature-inspired double chirp' },
  { id: 'soft_ping', label: 'Soft Droplet', description: 'Subtle ambient ping' },
];

/**
 * Play synthesized sound using Web Audio API (Zero external assets, instant zero-latency playback)
 */
export const playPomodoroSound = (type = 'chime', volume = 0.3) => {
  try {
    if (!globalAudioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    const audioCtx = globalAudioCtx;
    const now = audioCtx.currentTime;

    const playTone = (freq, waveType, startTime, duration, vol = 0.15) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol * volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    switch (type) {
      case 'chime':
        playTone(523.25, 'sine', now, 0.4, 0.2);        // C5
        playTone(659.25, 'sine', now + 0.12, 0.4, 0.2); // E5
        playTone(783.99, 'sine', now + 0.24, 0.5, 0.2); // G5
        playTone(1046.50, 'sine', now + 0.36, 0.8, 0.25); // C6
        break;

      case 'bell':
        // Rich Tibetan Bell with fundamental and warm overtone
        playTone(293.66, 'sine', now, 2.2, 0.35); // D4 fundamental
        playTone(587.33, 'sine', now + 0.02, 1.8, 0.15); // D5 harmonic
        playTone(880.00, 'triangle', now + 0.04, 1.2, 0.08); // A5 sparkle
        break;

      case 'chirp':
        playTone(1200, 'sine', now, 0.12, 0.18);
        playTone(1600, 'sine', now + 0.14, 0.18, 0.18);
        break;

      case 'soft_ping':
        playTone(640, 'triangle', now, 0.7, 0.25);
        break;

      case 'beep1':
      default: {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.18 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
    }
  } catch (err) {
    console.warn('[Pomodoro Sound] Audio playback suppressed:', err);
  }
};
