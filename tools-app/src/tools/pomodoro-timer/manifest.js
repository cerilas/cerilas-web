export const pomodoroManifest = {
  slug: 'pomodoro-timer',
  title: 'Pomodoro Timer',
  short_description: 'Minimalist in-browser Pomodoro timer with fluid wave animation, acoustic alert sounds, and customizable focus & break intervals.',
  shortDescription: 'Minimalist in-browser Pomodoro timer with fluid wave animation, acoustic alert sounds, and customizable focus & break intervals.',
  category: 'Productivity',
  icon: 'Clock',
  icon_name: 'Clock',
  version: '1.0.0',
  author: 'Cerilas High Tech',
  features: [
    'Zero Account Required (100% Client-Side Privacy)',
    'Dynamic Fluid Liquid Wave Animation Progress',
    'Acoustic Web Audio Alerts (Chime, Bell, Beep, Chirp)',
    'Focus, Short Break & Long Break Interval Presets',
    'Custom Time Duration & Quick-Start Buttons',
    'Document Title & Tab Countdown Sync',
    'Local Session & Streak Tracking (Zero DB Tracking)'
  ],
  seo: {
    title: "Free Online Pomodoro Focus Timer with Sound | Cerilas Tools",
    description: "Boost productivity with a free online Pomodoro timer. Enjoy fluid wave physics, custom work/break intervals, and acoustic chimes. 100% free and in-browser.",
    keywords: "pomodoro timer, online pomodoro timer, focus timer, study timer, productivity timer, aesthetic pomodoro, pomodoro technique app, deep work timer",
    ogImage: 'https://tools.cerilas.com/tool-icons/pomodoro-timer.webp',
    ogImageAlt: "Free Online Pomodoro Focus Timer with Sound | Cerilas Tools",
    breadcrumbsName: "Pomodoro Timer",
    faq: [
        {
            "q": "What is the Pomodoro Technique and how does it enhance productivity?",
            "a": "The Pomodoro Technique breaks work into focused 25-minute intervals separated by short 5-minute breaks, training the brain to resist distractions and preventing mental fatigue."
        },
        {
            "q": "Does the timer keep counting accurately if I switch browser tabs?",
            "a": "Yes. The timer utilizes Web Workers and timestamp differentials so countdowns never drift or pause when the browser tab is minimized."
        },
        {
            "q": "Can I customize the work and break interval lengths?",
            "a": "Yes. You can customize focus duration (e.g. 50 minutes for deep work), short breaks (e.g. 10 minutes), and long break cycles."
        },
        {
            "q": "What audio notifications are available when a session finishes?",
            "a": "Choose between serene Tibetan singing bowl chimes, classic digital beeps, or silent visual notification pulses."
        }
    ]
  }
};
