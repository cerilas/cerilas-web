import React, { useImperativeHandle, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { GROWTH_DEMO_VIDEO } from '../../seo/growthControlSeo';

export default function GrowthDemoVideo({ ref }) {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    setStarted(true);
    setEnded(false);
    if (video.ended) video.currentTime = 0;
    video.play().catch(() => {});
  };

  useImperativeHandle(ref, () => ({ play }));

  return (
    <figure className="cl-demo-video">
      <div className={`cl-demo-frame ${started ? 'is-started' : ''}`}>
        <video
          ref={videoRef}
          src={GROWTH_DEMO_VIDEO.src}
          poster={GROWTH_DEMO_VIDEO.poster}
          width={GROWTH_DEMO_VIDEO.width}
          height={GROWTH_DEMO_VIDEO.height}
          preload="none"
          playsInline
          controls={started && !ended}
          onEnded={() => setEnded(true)}
          aria-label={GROWTH_DEMO_VIDEO.title}
        />
        {(!started || ended) && (
          <button type="button" className="cl-demo-play" onClick={play} aria-label={ended ? 'Replay the GrowthControl demo' : 'Play the GrowthControl demo video'}>
            <span className="cl-demo-play-icon" aria-hidden="true">
              {ended ? <RotateCcw size={26} /> : <Play size={28} fill="currentColor" />}
            </span>
            <span className="cl-demo-play-label">
              {ended ? 'Watch again' : 'Watch the demo'}
              <span className="cl-demo-duration">{GROWTH_DEMO_VIDEO.durationLabel}</span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="cl-demo-caption">{GROWTH_DEMO_VIDEO.description}</figcaption>
    </figure>
  );
}
