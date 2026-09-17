import React, { useEffect, useRef } from 'react';

const SURFACE_POINT_COUNT = 64;
const MAX_BUBBLES = 14;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getPalette = (mode = 'focus') => {
  const isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

  if (mode === 'shortBreak') {
    // Emerald / Mint Relaxing Break
    if (isLight) {
      return {
        top: 'rgba(52, 211, 153, 0.28)',
        middle: 'rgba(16, 185, 129, 0.38)',
        bottom: 'rgba(5, 150, 105, 0.48)',
        surfaceGlow: 'rgba(16, 185, 129, 0.75)',
        surfaceCore: 'rgba(5, 150, 105, 0.85)',
        caustic: 'rgba(167, 243, 208, 0.22)',
        bubble: 'rgba(16, 185, 129, 0.45)',
        bubbleGlint: 'rgba(255, 255, 255, 0.95)',
      };
    }
    return {
      top: 'rgba(52, 211, 153, 0.30)',
      middle: 'rgba(16, 185, 129, 0.40)',
      bottom: 'rgba(4, 120, 87, 0.52)',
      surfaceGlow: 'rgba(110, 231, 183, 0.80)',
      surfaceCore: 'rgba(52, 211, 153, 0.90)',
      caustic: 'rgba(167, 243, 208, 0.16)',
      bubble: 'rgba(110, 231, 183, 0.45)',
      bubbleGlint: 'rgba(236, 253, 245, 0.90)',
    };
  }

  if (mode === 'longBreak') {
    // Purple / Indigo Sunset Recharge
    if (isLight) {
      return {
        top: 'rgba(192, 132, 252, 0.28)',
        middle: 'rgba(168, 85, 247, 0.38)',
        bottom: 'rgba(126, 34, 206, 0.48)',
        surfaceGlow: 'rgba(168, 85, 247, 0.75)',
        surfaceCore: 'rgba(126, 34, 206, 0.85)',
        caustic: 'rgba(243, 232, 255, 0.22)',
        bubble: 'rgba(168, 85, 247, 0.45)',
        bubbleGlint: 'rgba(255, 255, 255, 0.95)',
      };
    }
    return {
      top: 'rgba(192, 132, 252, 0.30)',
      middle: 'rgba(147, 51, 234, 0.40)',
      bottom: 'rgba(107, 33, 168, 0.52)',
      surfaceGlow: 'rgba(216, 180, 254, 0.80)',
      surfaceCore: 'rgba(192, 132, 252, 0.90)',
      caustic: 'rgba(243, 232, 255, 0.16)',
      bubble: 'rgba(216, 180, 254, 0.45)',
      bubbleGlint: 'rgba(250, 245, 255, 0.90)',
    };
  }

  // Default: Deep Focus Cyan / Blue
  if (isLight) {
    return {
      top: 'rgba(14, 165, 233, 0.28)',
      middle: 'rgba(59, 130, 246, 0.38)',
      bottom: 'rgba(37, 99, 235, 0.48)',
      surfaceGlow: 'rgba(2, 132, 199, 0.80)',
      surfaceCore: 'rgba(37, 99, 235, 0.90)',
      caustic: 'rgba(224, 242, 254, 0.25)',
      bubble: 'rgba(2, 132, 199, 0.45)',
      bubbleGlint: 'rgba(255, 255, 255, 0.95)',
    };
  }

  return {
    top: 'rgba(34, 211, 238, 0.32)',
    middle: 'rgba(6, 182, 212, 0.42)',
    bottom: 'rgba(8, 145, 178, 0.55)',
    surfaceGlow: 'rgba(165, 243, 252, 0.80)',
    surfaceCore: 'rgba(34, 211, 238, 0.90)',
    caustic: 'rgba(207, 250, 254, 0.16)',
    bubble: 'rgba(165, 243, 252, 0.45)',
    bubbleGlint: 'rgba(236, 254, 255, 0.90)',
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
  const radius = 2.0 + Math.random() * 3.8;
  return {
    x: width * (0.08 + Math.random() * 0.84),
    y: height + radius + Math.random() * 16,
    radius,
    speed: 18 + Math.random() * 24,
    drift: 5 + Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
    age: 0,
  };
};

export default function PomodoroLiquid({ progress, isRunning, mode = 'focus' }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(clamp(progress, 0, 100));
  const runningRef = useRef(isRunning);
  const modeRef = useRef(mode);
  const impulseRef = useRef(0);

  useEffect(() => {
    progressRef.current = clamp(progress, 0, 100);
  }, [progress]);

  useEffect(() => {
    if (runningRef.current !== isRunning) {
      impulseRef.current += isRunning ? 20 : 10;
    }
    runningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    modeRef.current = mode;
    impulseRef.current += 16;
  }, [mode]);

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

    // Baseline waterline: minimum 26% of card height is always filled with active water
    // As progress grows (0 -> 100), water level smoothly rises to 92% of card height
    const targetSurfaceY = () => {
      const clamped = clamp(progressRef.current, 0, 100);
      const effectiveProgress = 26 + (clamped * 0.66);
      return height - (height * effectiveProgress) / 100;
    };

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

      for (let offset = -6; offset <= 6; offset += 1) {
        const index = center + offset;
        if (index < 0 || index >= SURFACE_POINT_COUNT) continue;
        const falloff = Math.exp(-(offset * offset) / 14);
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

      const levelAcceleration = (target - surfaceY) * 65 - surfaceVelocity * 14;
      surfaceVelocity += levelAcceleration * delta;
      surfaceY += surfaceVelocity * delta;

      const pendingImpulse = impulseRef.current;
      if (pendingImpulse > 0) {
        disturbSurface(pendingImpulse);
        impulseRef.current = 0;
      }

      // Gentle continuous ambient breathing ripples
      if (elapsed >= nextRippleAt) {
        const strength = runningRef.current ? (5 + Math.random() * 5) : (2.5 + Math.random() * 3);
        disturbSurface(strength);
        nextRippleAt = elapsed + (runningRef.current ? 1.8 : 2.8) + Math.random() * 2.0;
      }

      const nextDisplacements = new Array(SURFACE_POINT_COUNT);
      const tension = 16;
      const propagation = 750;
      const damping = runningRef.current ? 3.4 : 4.8;

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

      for (let index = 0; index < SURFACE_POINT_COUNT; index += 1) {
        displacements[index] = nextDisplacements[index];
      }

      // Bubbles spawning
      if (bubbles.length < MAX_BUBBLES && elapsed >= nextBubbleAt && height > 0) {
        bubbles.push(createBubble(width, height));
        nextBubbleAt = elapsed + (runningRef.current ? 0.35 : 0.75) + Math.random() * 0.9;
      }

      const survivingBubbles = [];
      for (let i = 0; i < bubbles.length; i += 1) {
        const bubble = bubbles[i];
        bubble.age += delta;
        bubble.y -= bubble.speed * delta;
        bubble.x += Math.sin(bubble.phase + bubble.age * 2.8) * bubble.drift * delta;

        const surfaceLimit = getSurfaceAtX(displacements, width, surfaceY, bubble.x);
        if (bubble.y > surfaceLimit + bubble.radius) {
          survivingBubbles.push(bubble);
        } else {
          disturbSurface(1.8);
        }
      }
      bubbles = survivingBubbles;
    };

    const drawCaustics = (fillPath, elapsed, palette) => {
      context.save();
      context.clip(fillPath);
      context.fillStyle = palette.caustic;

      for (let index = 0; index < 3; index += 1) {
        const waveOffset = elapsed * (0.8 + index * 0.3);
        const yOffset = surfaceY + 28 + index * 45;
        if (yOffset > height) continue;

        context.beginPath();
        context.moveTo(0, yOffset);
        for (let x = 0; x <= width; x += 18) {
          const y = yOffset + Math.sin(x * 0.02 + waveOffset) * 6;
          context.lineTo(x, y);
        }
        context.lineTo(width, height);
        context.lineTo(0, height);
        context.closePath();
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
        context.fillStyle = palette.bubble;
        context.fill();
        context.strokeStyle = palette.surfaceGlow;
        context.lineWidth = 0.8;
        context.stroke();

        context.beginPath();
        context.arc(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.34,
          Math.max(0.5, bubble.radius * 0.18),
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
      if (!width || !height) return;

      const palette = getPalette(modeRef.current);
      const surfacePath = new Path2D();
      traceSurface(surfacePath, displacements, width, surfaceY);

      const fillPath = new Path2D(surfacePath);
      fillPath.lineTo(width, height + 2);
      fillPath.lineTo(0, height + 2);
      fillPath.closePath();

      const fill = context.createLinearGradient(0, surfaceY - 8, 0, height);
      fill.addColorStop(0, palette.top);
      fill.addColorStop(0.25, palette.middle);
      fill.addColorStop(1, palette.bottom);
      context.fillStyle = fill;
      context.fill(fillPath);

      drawCaustics(fillPath, elapsed, palette);
      drawBubbles(fillPath, palette);

      // Specular surface ridge & glow
      context.save();
      context.strokeStyle = palette.surfaceGlow;
      context.lineWidth = 4.5;
      context.globalAlpha = 0.45;
      context.shadowBlur = 10;
      context.shadowColor = palette.surfaceGlow;
      context.stroke(surfacePath);
      context.restore();

      const highlight = context.createLinearGradient(0, 0, width, 0);
      highlight.addColorStop(0, 'rgba(255,255,255,0)');
      highlight.addColorStop(0.2, palette.surfaceCore);
      highlight.addColorStop(0.45, 'rgba(255,255,255,0.18)');
      highlight.addColorStop(0.7, palette.surfaceCore);
      highlight.addColorStop(1, 'rgba(255,255,255,0)');
      context.strokeStyle = highlight;
      context.lineWidth = 1.4;
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

  return <canvas ref={canvasRef} className="pomodoro-liquid-canvas pom-liquid-canvas" aria-hidden="true" />;
}
