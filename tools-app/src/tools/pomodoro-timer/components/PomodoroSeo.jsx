import React, { useEffect } from 'react';
import { 
  Zap, 
  Clock, 
  Coffee, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  Sliders, 
  Lock,
  Flame,
  Brain,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Code2,
  GraduationCap,
  Waves,
  RefreshCw,
  Award,
  Layers,
  Check,
  XCircle
} from 'lucide-react';
import './PomodoroSeo.css';

export default function PomodoroSeo({ onSelectMode }) {

  return (
    <section className="pom-seo-root" aria-label="Comprehensive Pomodoro Technique Guide & Knowledge Base">
      {/* 1. Header Value Proposition */}
      <div className="pom-seo-header">
        <div className="pom-seo-badge">
          <ShieldCheck size={14} />
          <span>100% In-Browser Privacy • Zero Accounts • Tab-Persistent • Ad-Free Flow</span>
        </div>
        <h2 className="pom-seo-main-title">
          The Ultimate Free Online Pomodoro Timer &amp; Deep Work Productivity System
        </h2>
        <p className="pom-seo-main-desc">
          Engineered for software engineers, researchers, students, writers, and ADHD professionals who require 
          uncompromising focus. Featuring hypnotic fluid wave physics, warm acoustic alerts, and persistent 
          in-browser state that never resets when you close your tab.
        </p>
      </div>

      {/* 2. Direct Answer / AI Knowledge Capsule (GEO & Featured Snippet Trigger) */}
      <div className="pom-ai-capsule">
        <div className="pom-capsule-header">
          <Award size={18} className="pom-capsule-icon" />
          <h3 className="pom-capsule-title">Quick Overview: Why Cerilas is the Modern Pomodoro Standard</h3>
        </div>
        <div className="pom-capsule-body">
          <p>
            <strong>What is the Pomodoro Technique?</strong> A scientifically verified interval timeboxing methodology created by Francesco Cirillo in the late 1980s. 
            Work is partitioned into <strong>25-minute deep focus sprints</strong> followed by <strong>5-minute restorative breaks</strong>, culminating in an extended 
            <strong> 15-30 minute recharge</strong> every 4 completed cycles.
          </p>
          <div className="pom-capsule-highlights">
            <div className="pom-capsule-item">
              <Check size={15} className="capsule-check" />
              <span><strong>Tab-Resistant Persistence:</strong> Timer continues ticking down accurately even if your tab is closed or your computer restarts.</span>
            </div>
            <div className="pom-capsule-item">
              <Check size={15} className="capsule-check" />
              <span><strong>Organic Fluid Wave Physics:</strong> Peripheral visual perception of time passage that eliminates ticking digital clock anxiety.</span>
            </div>
            <div className="pom-capsule-item">
              <Check size={15} className="capsule-check" />
              <span><strong>100% Client-Side Privacy:</strong> Zero cloud tracking, zero personal databases, zero tracking cookies, and zero banner ads.</span>
            </div>
            <div className="pom-capsule-item">
              <Check size={15} className="capsule-check" />
              <span><strong>Web Audio Synthesized Chimes:</strong> Harmonic triple-chords and Tibetan meditation gongs generated in real time without audio latency.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Quick-Start Interval Presets */}
      <div className="pom-seo-section-block">
        <div className="pom-section-title-wrap">
          <div className="pom-seo-mini-badge">
            <Clock size={14} /> Quick-Start Workflows
          </div>
          <h3 className="pom-section-h3">Choose Your Optimal Productivity Rhythm</h3>
          <p className="pom-section-p">
            Select an established cognitive pacing interval below to load it directly into the active timer above.
          </p>
        </div>

        <div className="pom-seo-modes-grid">
          <div 
            className="pom-mode-card"
            onClick={() => onSelectMode && onSelectMode('focus', 25)}
            role="button"
            tabIndex={0}
            aria-label="Activate 25-minute Deep Focus session"
          >
            <div className="pom-mode-icon focus-icon">
              <Clock size={20} />
            </div>
            <span className="pom-mode-tag tag-cyan">25 Minutes • Golden Standard</span>
            <h4>Deep Work Sprint</h4>
            <p>
              The classic Pomodoro interval. Perfect for high-friction tasks, creative problem solving, and building uninterrupted momentum.
            </p>
            <button className="pom-mode-btn btn-cyan">
              <span>Launch 25m Focus</span>
              <Zap size={14} />
            </button>
          </div>

          <div 
            className="pom-mode-card"
            onClick={() => onSelectMode && onSelectMode('shortBreak', 5)}
            role="button"
            tabIndex={0}
            aria-label="Activate 5-minute Short Break"
          >
            <div className="pom-mode-icon break-icon">
              <Coffee size={20} />
            </div>
            <span className="pom-mode-tag tag-emerald">5 Minutes • Dopamine Reset</span>
            <h4>Restorative Pause</h4>
            <p>
              Step away from your monitor, hydrate, and stretch. Resets prefrontal cortex glycogen levels before your next sprint.
            </p>
            <button className="pom-mode-btn btn-emerald">
              <span>Launch 5m Break</span>
              <Zap size={14} />
            </button>
          </div>

          <div 
            className="pom-mode-card"
            onClick={() => onSelectMode && onSelectMode('longBreak', 15)}
            role="button"
            tabIndex={0}
            aria-label="Activate 15-minute Long Break"
          >
            <div className="pom-mode-icon long-icon">
              <Sparkles size={20} />
            </div>
            <span className="pom-mode-tag tag-purple">15 Minutes • Ultradian Recharge</span>
            <h4>Macro Recovery</h4>
            <p>
              Awarded after completing 4 consecutive focus cycles (100 mins total). Ideal for a brisk outdoor walk or healthy nourishment.
            </p>
            <button className="pom-mode-btn btn-purple">
              <span>Launch 15m Recharge</span>
              <Zap size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. The 5-Step Deep Work Protocol */}
      <div className="pom-seo-section-block">
        <div className="pom-section-title-wrap">
          <div className="pom-seo-mini-badge">
            <Layers size={14} /> Step-by-Step System
          </div>
          <h3 className="pom-section-h3">The 5-Step Pomodoro Protocol for Maximum Daily Output</h3>
          <p className="pom-section-p">
            Follow the systematic operating procedure used by top software engineers, researchers, and authors.
          </p>
        </div>

        <div className="pom-steps-grid">
          <div className="pom-step-card">
            <div className="pom-step-badge">Step 1</div>
            <h4>Define One Atomic Goal</h4>
            <p>
              Choose a single, unambiguous outcome (e.g. "Implement user authentication middleware" or "Draft thesis introduction"). 
              Type it into the task field above. Multitasking fractures mental clarity and costs up to 40% of productive capacity in context-switching penalties.
            </p>
          </div>
          <div className="pom-step-card">
            <div className="pom-step-badge">Step 2</div>
            <h4>Ignite the 25-Minute Sprint</h4>
            <p>
              Press Start or press Spacebar. Enter total mental immersion. If stray thoughts, urgent emails, or new ideas pop up, quickly note them on a side pad and return instantly to your primary task without breaking flow.
            </p>
          </div>
          <div className="pom-step-card">
            <div className="pom-step-badge">Step 3</div>
            <h4>Protect the Indivisible Unit</h4>
            <p>
              A Pomodoro is an atomic unit of focus that cannot be sliced in half. If someone interrupts you, use the "Inform, Negotiate, Schedule" method: let them know you are mid-sprint and agree to sync in 10 minutes during your break.
            </p>
          </div>
          <div className="pom-step-card">
            <div className="pom-step-badge">Step 4</div>
            <h4>Take an Absolute Screen-Free Rest</h4>
            <p>
              When the harmonic chime alerts you, stop working immediately. Step away from your desk, stretch your neck, drink water, and let your eyes focus on distant objects. Do not browse social media or check email during this vital 5-minute pause.
            </p>
          </div>
          <div className="pom-step-card">
            <div className="pom-step-badge">Step 5</div>
            <h4>Complete 4 Cycles &amp; Enjoy Macro Break</h4>
            <p>
              After four successful sprints (100 minutes of pure deep work), your prefrontal cortex enters natural cognitive fatigue. Take a relaxing 15 to 30-minute macro break to replenish neurotransmitter reserves before the next series.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Competitive Benchmark Table */}
      <div className="pom-seo-section-block">
        <div className="pom-section-title-wrap">
          <div className="pom-seo-mini-badge">
            <Award size={14} /> Competitive Benchmark
          </div>
          <h3 className="pom-section-h3">Cerilas Pomodoro vs. Legacy Web Timers &amp; Desktop Apps</h3>
          <p className="pom-section-p">
            See how Cerilas delivers a superior, distraction-free experience compared to traditional productivity tools.
          </p>
        </div>

        <div className="pom-matrix-card">
          <div className="pom-table-wrap">
            <table className="pom-comparison-table">
              <thead>
                <tr>
                  <th>Capability &amp; Architecture</th>
                  <th className="highlight-col">Cerilas Pomodoro</th>
                  <th>Legacy Web Timers (Pomofocus / Marinara)</th>
                  <th>Desktop Applications</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Tab-Resistant Persistence</strong><br /><span className="table-subtext">Continues counting when tab is closed</span></td>
                  <td className="highlight-col"><span className="pom-table-badge green"><Check size={13} /> Full (Timestamp Delta)</span></td>
                  <td><span className="pom-table-badge red"><XCircle size={13} /> Pauses / Resets on Close</span></td>
                  <td><span className="pom-table-badge green"><Check size={13} /> Supported</span></td>
                </tr>
                <tr>
                  <td><strong>Privacy &amp; Data Security</strong><br /><span className="table-subtext">No tracking, no remote database records</span></td>
                  <td className="highlight-col"><span className="pom-table-badge green"><Check size={13} /> 100% In-Browser LocalStorage</span></td>
                  <td><span className="pom-table-badge yellow">Third-Party Tracking Cookies</span></td>
                  <td><span className="pom-table-badge yellow">Telemetry &amp; Crash Analytics</span></td>
                </tr>
                <tr>
                  <td><strong>Distraction-Free Environment</strong><br /><span className="table-subtext">Zero banner ads or pop-up promotions</span></td>
                  <td className="highlight-col"><span className="pom-table-badge green"><Check size={13} /> 100% Ad-Free Clean UI</span></td>
                  <td><span className="pom-table-badge red"><XCircle size={13} /> Heavy Banner &amp; Video Ads</span></td>
                  <td><span className="pom-table-badge yellow">Upgrade / Freemium Prompts</span></td>
                </tr>
                <tr>
                  <td><strong>Visual Flow Dynamics</strong><br /><span className="table-subtext">Subconscious time passage indicators</span></td>
                  <td className="highlight-col"><span className="pom-table-badge green"><Check size={13} /> Hypnotic Fluid Wave Physics</span></td>
                  <td><span className="pom-table-badge gray">Flat Static Numbers</span></td>
                  <td><span className="pom-table-badge gray">Basic Circular Progress Bar</span></td>
                </tr>
                <tr>
                  <td><strong>Audio Notification Engine</strong><br /><span className="table-subtext">Gentle, non-startling alerts</span></td>
                  <td className="highlight-col"><span className="pom-table-badge green"><Check size={13} /> Synthesized Web Audio Chimes</span></td>
                  <td><span className="pom-table-badge gray">Compressed MP3 / Harsh Buzzers</span></td>
                  <td><span className="pom-table-badge gray">Standard OS System Beeps</span></td>
                </tr>
                <tr>
                  <td><strong>Installation &amp; Sign-Up</strong><br /><span className="table-subtext">Instant access on any device</span></td>
                  <td className="highlight-col"><span className="pom-table-badge green"><Check size={13} /> Instant (No Login Needed)</span></td>
                  <td><span className="pom-table-badge green"><Check size={13} /> Instant Web App</span></td>
                  <td><span className="pom-table-badge red"><XCircle size={13} /> Requires Install &amp; Permissions</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. The Neurobiology of Interval Focus (E-E-A-T Authority) */}
      <div className="pom-seo-section-block">
        <div className="pom-section-title-wrap">
          <div className="pom-seo-mini-badge">
            <Brain size={14} /> Cognitive Neuroscience
          </div>
          <h3 className="pom-section-h3">The Neurobiology of Interval Timeboxing: Why It Works</h3>
          <p className="pom-section-p">
            Understanding the psychological and biological mechanisms that make 25-minute sprints profoundly effective.
          </p>
        </div>

        <div className="pom-science-grid">
          <div className="pom-science-card">
            <div className="pom-science-icon-wrap">
              <Flame size={20} className="science-icon flame" />
            </div>
            <h4>Overcoming the Zeigarnik Effect &amp; Initiation Resistance</h4>
            <p>
              Procrastination is rarely a flaw in willpower; it is an emotional aversion to the perceived magnitude of a task. 
              By committing to <em>"just 25 minutes"</em>, you lower the brain's cognitive activation energy. 
              Once started, the <strong>Zeigarnik Effect</strong> triggers a natural psychological desire to bring the uncompleted task to closure.
            </p>
          </div>

          <div className="pom-science-card">
            <div className="pom-science-icon-wrap">
              <Clock size={20} className="science-icon clock" />
            </div>
            <h4>Defeating Parkinson's Law with Bounded Scopes</h4>
            <p>
              <strong>Parkinson's Law</strong> states that <em>"work expands to fill the time available for its completion."</em> 
              When you give yourself an entire afternoon to write a proposal, it inevitably takes the entire afternoon. 
              Restricting tasks to tight 25-minute or 50-minute timeboxes introduces healthy urgency that eliminates perfectionist overthinking.
            </p>
          </div>

          <div className="pom-science-card">
            <div className="pom-science-icon-wrap">
              <RefreshCw size={20} className="science-icon refresh" />
            </div>
            <h4>Synchronizing with Human Ultradian Rhythms</h4>
            <p>
              Pioneering sleep researcher Nathaniel Kleitman demonstrated that human bodies operate on 90 to 120-minute <strong>Ultradian biological cycles</strong> throughout the day. 
              Our alertness peaks and dips in these waves. Four standard Pomodoros (100 minutes of focus + 15 minutes of rest) mirror this biological cycle, preventing chronic prefrontal cortex exhaustion.
            </p>
          </div>

          <div className="pom-science-card">
            <div className="pom-science-icon-wrap">
              <Sparkles size={20} className="science-icon sparkles" />
            </div>
            <h4>Dopamine Resensitization &amp; Attention Restoration</h4>
            <p>
              Prolonged uninterrupted screen immersion steadily depletes brain glycogen and desensitizes dopamine D2 receptors, resulting in brain fog. 
              Taking a true 5-minute screen-free pause triggers the <strong>Attention Restoration Theory (ART)</strong> mechanism, allowing neurochemical baselines to rebound before the next sprint.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Specialized Use-Case Playbooks */}
      <div className="pom-seo-section-block">
        <div className="pom-section-title-wrap">
          <div className="pom-seo-mini-badge">
            <BookOpen size={14} /> Workflow Playbooks
          </div>
          <h3 className="pom-section-h3">How Top Performers Adapt Pomodoro Across Professions</h3>
          <p className="pom-section-p">
            Tailor your interval configuration to your exact domain and intellectual challenges.
          </p>
        </div>

        <div className="pom-playbooks-grid">
          <div className="pom-playbook-card">
            <div className="playbook-header">
              <Code2 size={20} className="playbook-icon blue" />
              <h4>Software Engineers &amp; Developers</h4>
            </div>
            <div className="playbook-tag">Recommended: 50/10 or 25/5 Rhythm</div>
            <p>
              Writing complex algorithms and tracing asynchronous race conditions requires deep cognitive scaffolding. 
              Use <strong>50-minute sprints</strong> for core feature development to minimize context-switching penalties. 
              Switch to <strong>25-minute sprints</strong> for pull request reviews, documentation writing, and ticket triage.
            </p>
          </div>

          <div className="pom-playbook-card">
            <div className="playbook-header">
              <GraduationCap size={20} className="playbook-icon emerald" />
              <h4>Students, Researchers &amp; Academics</h4>
            </div>
            <div className="playbook-tag">Recommended: 25/5 Active Recall</div>
            <p>
              Passive reading creates an illusion of competence. Pair your 25-minute Pomodoro with <strong>Active Recall and Spaced Repetition</strong>: 
              spend 20 minutes testing yourself on concepts without looking at notes, and 5 minutes reviewing gaps. Use the 5-minute break for water and fresh air.
            </p>
          </div>

          <div className="pom-playbook-card">
            <div className="playbook-header">
              <Waves size={20} className="playbook-icon purple" />
              <h4>ADHD &amp; Neurodivergent Thinkers</h4>
            </div>
            <div className="playbook-tag">Recommended: Fluid Wave + Non-Startling Chimes</div>
            <p>
              Traditional ticking clocks and flashing numbers induce fight-or-flight anxiety in neurodivergent brains. 
              Cerilas Pomodoro's <strong>fluid wave physics</strong> provides a calming, peripheral visual sense of time without sensory overload. 
              Gentle acoustic chimes ensure transitions are peaceful rather than jarring.
            </p>
          </div>
        </div>
      </div>

      {/* 8. Frequently Asked Questions (Expanded 10 FAQ Accordion) */}
      <div className="pom-seo-section-block">
        <div className="pom-section-title-wrap">
          <div className="pom-seo-mini-badge">
            <HelpCircle size={14} /> Knowledge Base &amp; FAQ
          </div>
          <h3 className="pom-section-h3">Frequently Asked Questions</h3>
          <p className="pom-section-p">
            Everything you need to know about interval time management, technical capabilities, and privacy.
          </p>
        </div>

        <div className="pom-faq-group">
          <details className="pom-faq-item" open>
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">What is the Pomodoro Technique and who invented it?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                The Pomodoro Technique is an internationally recognized productivity method created in the late 1980s by Italian university student <strong>Francesco Cirillo</strong>. 
                Named after the tomato-shaped kitchen timer (<em>pomodoro</em> in Italian) Cirillo used during his university studies, the methodology breaks complex work into 
                <strong> 25-minute concentrated sprints</strong> followed by <strong>5-minute restorative pauses</strong>, with a longer <strong>15-30 minute break</strong> every 4 sessions. 
                It leverages Parkinson's Law and psychological pacing to eliminate procrastination, sustain executive function, and prevent cognitive exhaustion.
              </p>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">Why is the standard Pomodoro interval set to 25 minutes?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                Twenty-five minutes represents the scientifically verified sweet spot for human deep focus. 
                Cognitive neuroscience demonstrates that the prefrontal cortex can sustain peak executive function and intense mental concentration for approximately 20 to 30 minutes 
                before attention fragmentation naturally begins. Twenty-five minutes is long enough to produce tangible, high-value creative output yet short enough to overcome 
                task-initiation resistance (the psychological hurdle of starting).
              </p>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">Does Cerilas Pomodoro Timer keep running if I close the tab or restart my computer?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                <strong>Yes, absolutely.</strong> Cerilas Pomodoro is built with an advanced <em>timestamp delta persistence architecture</em>. 
                When you initiate a timer, the exact future target timestamp is saved to your browser's private local storage. 
                If you accidentally close the browser tab, restart your laptop, or reboot your machine, opening the timer again instantly recalculates 
                the exact remaining time down to the second. If the timer elapsed while you were away, the tool automatically credits your daily focus stats 
                and smoothly switches to your restorative break.
              </p>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">Does Cerilas store my personal tasks, sessions, or habits in a cloud database?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                <strong>Never.</strong> Just like all utilities on the Cerilas platform, this timer operates on a 100% client-side privacy model. 
                There are zero user accounts, zero remote database logs, zero session tracking, and zero marketing telemetry. 
                Your task notes, completed focus tallies, and customized interval preferences are stored exclusively inside your own browser's private <code>localStorage</code>. 
                Your personal work habits remain 100% private to you.
              </p>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">What should I do during the 5-minute and 15-minute breaks?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                To achieve true neurological recovery, breaks must be strictly <strong>screen-free</strong>:
              </p>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li><strong>Hydrate:</strong> Drink a full glass of cold water to restore cellular hydration.</li>
                <li><strong>Optical Rest:</strong> Look out a window at a distant horizon (20+ feet away) for 20 seconds to relax ciliary eye muscles.</li>
                <li><strong>Physical Motion:</strong> Stand up, stretch your neck, chest, and hip flexors, or do 10 gentle squats.</li>
                <li><strong>Avoid Digital Feeds:</strong> Do not check social media, news, or work chats; digital consumption causes "attention residue" that destroys focus.</li>
              </ul>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">Can I customize the timer for the 50/10 Rule or a 90-minute ultradian rhythm?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                Yes! While 25 minutes is the traditional baseline, many professionals prefer the <strong>50/10 rule</strong> (50 minutes focus, 10 minutes break) 
                or <strong>90-minute ultradian immersion blocks</strong>. You can click any of our instant quick presets (15m, 25m, 45m, 60m) or open the Settings drawer 
                to type any custom minute duration from 1 to 180 minutes for focus, short break, and long break intervals.
              </p>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">How does Cerilas Pomodoro help individuals with ADHD and executive dysfunction?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                Neurodivergent and ADHD brains frequently struggle with <em>time blindness</em> and dopamine regulation. 
                Traditional timers with red flashing numbers create cognitive anxiety. Cerilas Pomodoro solves this with:
                1) <strong>Organic fluid wave physics</strong> that visually communicates time passing in your peripheral vision without harsh numbers, 
                2) <strong>Low activation barriers</strong> ("just 25 minutes") that bypass task-initiation paralysis, and 
                3) <strong>Soothing acoustic alert frequencies</strong> that prevent sensory overstimulation.
              </p>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">Will the alarm sound play if I switch to another browser tab or full-screen app?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                Yes! The timer utilizes the browser's native Web Audio API and runs a high-precision background ticker with document title synchronization 
                (e.g. <code>(21:40) Deep Focus • Cerilas Pomodoro</code>). When time runs out, your chosen acoustic chime or bell plays automatically, 
                even if the tab is hidden, minimized, or you are working in another full-screen program.
              </p>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">What acoustic sound alerts are available in Cerilas Pomodoro?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                Cerilas includes 5 hand-crafted acoustic sounds synthesized directly via Web Audio oscillators:
              </p>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li><strong>Harmonic Chime:</strong> An uplifting major-triad acoustic chime with a warm bell decay.</li>
                <li><strong>Zen Meditation Bell:</strong> A deep, resonant singing bowl gong inspired by Tibetan mindfulness meditation.</li>
                <li><strong>Digital Beep:</strong> A crisp, modern dual-frequency notification tone.</li>
                <li><strong>Forest Chirp:</strong> An organic, double-chirp tone inspired by dawn songbirds.</li>
                <li><strong>Soft Droplet:</strong> An ultra-minimal ambient water droplet ping designed for shared office spaces.</li>
              </ul>
            </div>
          </details>

          <details className="pom-faq-item">
            <summary className="pom-faq-summary">
              <span className="pom-faq-question">How do I handle unexpected urgent interruptions during an active sprint?</span>
              <ChevronDown className="pom-faq-chevron" size={18} />
            </summary>
            <div className="pom-faq-answer">
              <p>
                Francesco Cirillo formulated the <strong>"Inform, Negotiate, Schedule, and Call Back"</strong> rule:
                1) <em>Inform</em> the colleague politely that you are in the middle of a timeboxed focus block, 
                2) <em>Negotiate</em> a time to talk (e.g. "Can I connect with you in 12 minutes during my break?"), 
                3) <em>Schedule</em> the follow-up, and 4) <em>Call them back</em> promptly during your 5-minute break. 
                If an emergency cannot wait, cancel the Pomodoro entirely—in true Pomodoro discipline, a sprint is an atomic unit and cannot be paused halfway.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* 9. Long-Tail Keyword Cloud for High Semantic Search Density */}
      <div className="pom-tag-cloud" aria-label="Related Search Topics">
        <span className="pom-keyword-pill">#PomodoroTimer</span>
        <span className="pom-keyword-pill">#OnlinePomodoroTimer</span>
        <span className="pom-keyword-pill">#FreePomodoroTimer</span>
        <span className="pom-keyword-pill">#AestheticPomodoroTimer</span>
        <span className="pom-keyword-pill">#StudyTimerWithSound</span>
        <span className="pom-keyword-pill">#DeepWorkTimer</span>
        <span className="pom-keyword-pill">#TimeBoxingClock</span>
        <span className="pom-keyword-pill">#5010RuleTimer</span>
        <span className="pom-keyword-pill">#ADHDProductivityTimer</span>
        <span className="pom-keyword-pill">#NoSignUpPomodoro</span>
        <span className="pom-keyword-pill">#ClientSidePrivacy</span>
        <span className="pom-keyword-pill">#TabPersistentTimer</span>
        <span className="pom-keyword-pill">#AcousticChimeAlert</span>
        <span className="pom-keyword-pill">#FluidWavePhysics</span>
        <span className="pom-keyword-pill">#FocusTimerOnline</span>
        <span className="pom-keyword-pill">#BestPomodoroApp2026</span>
      </div>
    </section>
  );
}
