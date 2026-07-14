import { useEffect, useRef } from 'react';

const SURFACE_POINT_COUNT = 72;
const MAX_BUBBLES = 12;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getPalette = () => {
  const isLight = document.documentElement.dataset.adminTheme === 'light';

  if (isLight) {
    return {
      top: 'rgba(96, 165, 250, 0.13)',
      middle: 'rgba(59, 130, 246, 0.17)',
      bottom: 'rgba(37, 99, 235, 0.23)',
      surfaceGlow: 'rgba(147, 197, 253, 0.42)',
      surfaceCore: 'rgba(37, 99, 235, 0.50)',
      caustic: 'rgba(219, 234, 254, 0.085)',
      bubble: 'rgba(219, 234, 254, 0.32)',
      bubbleGlint: 'rgba(255, 255, 255, 0.55)',
    };
  }

  return {
    top: 'rgba(34, 211, 238, 0.19)',
    middle: 'rgba(6, 182, 212, 0.25)',
    bottom: 'rgba(8, 145, 178, 0.34)',
    surfaceGlow: 'rgba(165, 243, 252, 0.50)',
    surfaceCore: 'rgba(34, 211, 238, 0.62)',
    caustic: 'rgba(207, 250, 254, 0.075)',
    bubble: 'rgba(165, 243, 252, 0.25)',
    bubbleGlint: 'rgba(236, 254, 255, 0.58)',
  };
};

const traceSurface = (path, points, width, surfaceY) => {
  const step = width / (points.length - 1);
  path.moveTo(0, surfaceY + points[0]);

  for (let index = 1; index < points.length; index += 1) {
    const previousX = (index - 1) * step;
    const previousY = surfaceY + points[index - 1];
    const currentX = index * step;
    const currentY = surfaceY + points[index];
    path.quadraticCurveTo(
      previousX,
      previousY,
      (previousX + currentX) / 2,
      (previousY + currentY) / 2,
    );
  }

  path.quadraticCurveTo(
    width,
    surfaceY + points[points.length - 1],
    width,
    surfaceY + points[points.length - 1],
  );
};

const getSurfaceAtX = (points, width, surfaceY, x) => {
  if (width <= 0) return surfaceY;
  const position = clamp(x / width, 0, 1) * (points.length - 1);
  const leftIndex = Math.floor(position);
  const rightIndex = Math.min(points.length - 1, leftIndex + 1);
  const mix = position - leftIndex;
  return surfaceY + points[leftIndex] * (1 - mix) + points[rightIndex] * mix;
};

const createBubble = (width, height) => {
  const radius = 1.8 + Math.random() * 3.8;
  return {
    x: width * (0.08 + Math.random() * 0.84),
    y: height + radius + Math.random() * 18,
    radius,
    speed: 15 + Math.random() * 19,
    drift: 4 + Math.random() * 9,
    phase: Math.random() * Math.PI * 2,
    age: 0,
  };
};

export default function PomodoroLiquid({ progress, isRunning }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(clamp(progress, 0, 100));
  const runningRef = useRef(isRunning);
  const impulseRef = useRef(0);

  useEffect(() => {
    progressRef.current = clamp(progress, 0, 100);
  }, [progress]);

  useEffect(() => {
    if (runningRef.current !== isRunning) {
      impulseRef.current += isRunning ? 18 : 8;
    }
    runningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    let width = 0;
    let height = 0;
    let surfaceY = 0;
    let surfaceVelocity = 0;
    let displacements = new Array(SURFACE_POINT_COUNT).fill(0);
    let velocities = new Array(SURFACE_POINT_COUNT).fill(0);
    let bubbles = [];
    let nextRippleAt = 0;
    let nextBubbleAt = 0;
    let animationFrame = 0;
    let lastFrameAt = performance.now();

    const targetSurfaceY = () => (
      height - (height * progressRef.current) / 100
    );

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, bounds.width);
      const nextHeight = Math.max(1, bounds.height);
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const previousHeight = height;

      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      if (previousHeight > 0) {
        surfaceY = (surfaceY / previousHeight) * height;
      } else {
        surfaceY = targetSurfaceY();
      }
    };

    const disturbSurface = (strength) => {
      const center = Math.floor(
        SURFACE_POINT_COUNT * (0.16 + Math.random() * 0.68),
      );
      const direction = Math.random() > 0.5 ? 1 : -1;

      for (let offset = -7; offset <= 7; offset += 1) {
        const index = center + offset;
        if (index < 0 || index >= SURFACE_POINT_COUNT) continue;
        const falloff = Math.exp(-(offset * offset) / 16);
        velocities[index] += direction * strength * falloff;
      }
    };

    const updatePhysics = (delta, elapsed) => {
      const target = targetSurfaceY();

      if (reducedMotion) {
        surfaceY = target;
        surfaceVelocity = 0;
        displacements.fill(0);
        velocities.fill(0);
        bubbles = [];
        return;
      }

      // Critically damped vertical spring: it follows progress continuously,
      // while large jumps (reset/quick start) retain a little believable inertia.
      const levelAcceleration = (target - surfaceY) * 88 - surfaceVelocity * 17;
      surfaceVelocity += levelAcceleration * delta;
      surfaceY += surfaceVelocity * delta;

      const pendingImpulse = impulseRef.current;
      if (pendingImpulse > 0) {
        disturbSurface(pendingImpulse);
        impulseRef.current = 0;
      }

      if (runningRef.current && elapsed >= nextRippleAt) {
        disturbSurface(5 + Math.random() * 4);
        nextRippleAt = elapsed + 2.1 + Math.random() * 2.7;
      }

      const nextDisplacements = new Array(SURFACE_POINT_COUNT);
      const tension = 15;
      const propagation = 720;
      const damping = runningRef.current ? 3.7 : 5.8;

      for (let index = 0; index < SURFACE_POINT_COUNT; index += 1) {
        const left = displacements[index === 0 ? 1 : index - 1];
        const right = displacements[index === SURFACE_POINT_COUNT - 1 ? index - 1 : index + 1];
        const laplacian = left + right - 2 * displacements[index];
        const acceleration = (
          -tension * displacements[index]
          + propagation * laplacian
          - damping * velocities[index]
        );

        velocities[index] += acceleration * delta;
        nextDisplacements[index] = displacements[index] + velocities[index] * delta;
      }

      displacements = nextDisplacements;

      const liquidDepth = height - surfaceY;
      if (
        runningRef.current
        && liquidDepth > 34
        && bubbles.length < MAX_BUBBLES
        && elapsed >= nextBubbleAt
      ) {
        bubbles.push(createBubble(width, height));
        nextBubbleAt = elapsed + 0.45 + Math.random() * 0.9;
      }

      bubbles = bubbles.filter((bubble) => {
        bubble.age += delta;
        bubble.y -= bubble.speed * delta;
        bubble.x += Math.sin(bubble.age * 1.8 + bubble.phase) * bubble.drift * delta;
        const waveY = getSurfaceAtX(displacements, width, surfaceY, bubble.x);
        return bubble.y - bubble.radius > waveY && bubble.x > -15 && bubble.x < width + 15;
      });
    };

    const drawCaustics = (fillPath, elapsed, palette) => {
      const liquidDepth = height - surfaceY;
      if (liquidDepth < 24) return;

      context.save();
      context.clip(fillPath);
      context.globalCompositeOperation = 'screen';

      for (let index = 0; index < 5; index += 1) {
        const travelWidth = width + 220;
        const x = (
          (elapsed * (8 + index * 1.7) + index * 173) % travelWidth
        ) - 110;
        const depthRatio = (index + 1) / 6;
        const y = surfaceY
          + liquidDepth * depthRatio
          + Math.sin(elapsed * 0.7 + index * 1.9) * 7;
        const radiusX = 48 + index * 11;
        const radiusY = 4 + (index % 3) * 1.8;

        context.beginPath();
        context.ellipse(
          x,
          y,
          radiusX,
          radiusY,
          Math.sin(elapsed * 0.3 + index) * 0.18,
          0,
          Math.PI * 2,
        );
        context.fillStyle = palette.caustic;
        context.fill();
      }

      context.restore();
    };

    const drawBubbles = (fillPath, palette) => {
      if (bubbles.length === 0) return;

      context.save();
      context.clip(fillPath);

      bubbles.forEach((bubble) => {
        context.beginPath();
        context.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        context.strokeStyle = palette.bubble;
        context.lineWidth = 0.8;
        context.stroke();

        context.beginPath();
        context.arc(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.34,
          Math.max(0.55, bubble.radius * 0.18),
          0,
          Math.PI * 2,
        );
        context.fillStyle = palette.bubbleGlint;
        context.fill();
      });

      context.restore();
    };

    const draw = (elapsed) => {
      context.clearRect(0, 0, width, height);

      if (progressRef.current <= 0.001 || surfaceY >= height + 1) return;

      const palette = getPalette();
      const surfacePath = new Path2D();
      traceSurface(surfacePath, displacements, width, surfaceY);

      const fillPath = new Path2D(surfacePath);
      fillPath.lineTo(width, height + 2);
      fillPath.lineTo(0, height + 2);
      fillPath.closePath();

      const fill = context.createLinearGradient(0, surfaceY - 8, 0, height);
      fill.addColorStop(0, palette.top);
      fill.addColorStop(0.24, palette.middle);
      fill.addColorStop(1, palette.bottom);
      context.fillStyle = fill;
      context.fill(fillPath);

      drawCaustics(fillPath, elapsed, palette);
      drawBubbles(fillPath, palette);

      // A broad refraction halo and a thin specular ridge make the surface
      // read as one continuous volume instead of stacked decorative waves.
      context.save();
      context.strokeStyle = palette.surfaceGlow;
      context.lineWidth = 5.5;
      context.globalAlpha = 0.18;
      context.shadowBlur = 9;
      context.shadowColor = palette.surfaceGlow;
      context.stroke(surfacePath);
      context.restore();

      const highlight = context.createLinearGradient(0, 0, width, 0);
      highlight.addColorStop(0, 'rgba(255,255,255,0)');
      highlight.addColorStop(0.18, palette.surfaceCore);
      highlight.addColorStop(0.43, 'rgba(255,255,255,0.08)');
      highlight.addColorStop(0.68, palette.surfaceCore);
      highlight.addColorStop(1, 'rgba(255,255,255,0)');
      context.strokeStyle = highlight;
      context.lineWidth = 1.15;
      context.stroke(surfacePath);
    };

    const animate = (now) => {
      const delta = Math.min((now - lastFrameAt) / 1000, 1 / 30);
      const elapsed = now / 1000;
      lastFrameAt = now;

      updatePhysics(delta, elapsed);
      draw(elapsed);
      animationFrame = window.requestAnimationFrame(animate);
    };

    const handleMotionPreference = (event) => {
      reducedMotion = event.matches;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    motionQuery.addEventListener('change', handleMotionPreference);
    resize();
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionPreference);
    };
  }, []);

  return <canvas ref={canvasRef} className="pomodoro-liquid-canvas" aria-hidden="true" />;
}
