/**
 * 🎃 Halloween Magic Bubbles - Enhanced for Spooky Atmosphere
 * Based on bubbly-optimized.js with Halloween-specific enhancements
 */

"use strict";

window.halloweenBubbles = function (options) {
  const config = options || {};
  const canvas = config.canvas || document.createElement("canvas");
  let width = canvas.width;
  let height = canvas.height;

  // Canvas setup
  if (canvas.parentNode === null) {
    canvas.setAttribute("style", "position:fixed;z-index:-1;left:0;top:0;min-width:100vw;min-height:100vh;");
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");

  // Halloween-specific shadow and glow effects
  ctx.shadowColor = config.shadowColor || "#ffc107";
  ctx.shadowBlur = config.blur || 15;

  // OffscreenCanvas for Halloween background
  let backgroundCanvas;
  let backgroundCtx;

  if (typeof OffscreenCanvas !== "undefined") {
    backgroundCanvas = new OffscreenCanvas(width, height);
    backgroundCtx = backgroundCanvas.getContext("2d");
  } else {
    backgroundCanvas = document.createElement("canvas");
    backgroundCanvas.width = width;
    backgroundCanvas.height = height;
    backgroundCtx = backgroundCanvas.getContext("2d");
  }

  // Halloween gradient background
  const gradient = backgroundCtx.createRadialGradient(width * 0.3, height * 0.7, 0, width * 0.3, height * 0.7, Math.max(width, height));
  gradient.addColorStop(0, config.colorStart || "rgba(255, 107, 53, 0.1)");
  gradient.addColorStop(0.3, config.colorStop || "rgba(106, 27, 154, 0.2)");
  gradient.addColorStop(0.7, "rgba(255, 193, 7, 0.05)");
  gradient.addColorStop(1, "rgba(26, 26, 26, 0.3)");

  backgroundCtx.fillStyle = gradient;
  backgroundCtx.fillRect(0, 0, width, height);

  // Enhanced Halloween bubble system
  const bubbleCount = config.bubbles || Math.min(50, Math.floor(0.02 * (width + height)));
  const bubbles = [];

  // Create Halloween-themed bubbles with magical properties
  for (let i = 0; i < bubbleCount; i++) {
    const magicType = Math.random();
    let radius, velocity, opacity, color, glowIntensity;

    if (magicType < 0.2) {
      // Magic orbs - large, slow, very glowy
      radius = 15 + Math.random() * 25;
      velocity = 0.1 + Math.random() * 0.3;
      opacity = 0.4 + Math.random() * 0.3;
      color = `rgba(255, 193, 7, ${opacity})`; // Gold
      glowIntensity = 20 + Math.random() * 15;
    } else if (magicType < 0.5) {
      // Witch bubbles - medium, moderate speed, purple
      radius = 8 + Math.random() * 12;
      velocity = 0.3 + Math.random() * 0.6;
      opacity = 0.3 + Math.random() * 0.4;
      color = `rgba(106, 27, 154, ${opacity})`; // Purple
      glowIntensity = 10 + Math.random() * 10;
    } else {
      // Pumpkin bubbles - small to medium, orange
      radius = 4 + Math.random() * 10;
      velocity = 0.4 + Math.random() * 0.8;
      opacity = 0.2 + Math.random() * 0.5;
      color = `rgba(255, 107, 53, ${opacity})`; // Orange
      glowIntensity = 5 + Math.random() * 10;
    }

    bubbles.push({
      x: Math.random() * width,
      y: height + radius + Math.random() * 200,
      radius: radius,
      angle: Math.PI * 1.2 + Math.random() * 0.6, // Mostly upward
      velocity: velocity,
      opacity: opacity,
      color: color,
      glowIntensity: glowIntensity,
      active: true,
      wobble: Math.random() * 0.03,
      wobbleOffset: Math.random() * Math.PI * 2,
      magicPulse: Math.random() * 0.02,
      pulseOffset: Math.random() * Math.PI * 2,
    });
  }

  // Halloween animation with magical effects
  let lastFrameTime = 0;
  const targetFPS = 30;
  const frameInterval = 1000 / targetFPS;
  let needsFullRedraw = true;

  function render(currentTime) {
    if (canvas.parentNode === null) {
      return;
    }

    if (currentTime - lastFrameTime < frameInterval) {
      if (config.animate !== false) {
        requestAnimationFrame(render);
      }
      return;
    }
    lastFrameTime = currentTime;

    // Clear and redraw background
    if (needsFullRedraw) {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(backgroundCanvas, 0, 0);
      needsFullRedraw = false;
    } else {
      // Subtle fade effect for magical trails
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(26, 26, 26, 0.03)";
      ctx.fillRect(0, 0, width, height);
    }

    // Render Halloween bubbles with magical effects
    ctx.globalCompositeOperation = config.compose || "screen";

    bubbles.forEach((bubble) => {
      if (!bubble.active) return;

      // Enhanced magical movement
      bubble.wobbleOffset += bubble.wobble;
      bubble.pulseOffset += bubble.magicPulse;

      const wobbleX = Math.sin(bubble.wobbleOffset) * 3;
      const magicPulse = Math.sin(bubble.pulseOffset) * 0.3;

      bubble.x += Math.cos(bubble.angle) * bubble.velocity + wobbleX;
      bubble.y += Math.sin(bubble.angle) * bubble.velocity;

      // Reset bubble when it reaches the top
      if (bubble.y + bubble.radius < -100) {
        bubble.x = Math.random() * width;
        bubble.y = height + bubble.radius + Math.random() * 200;
        bubble.wobbleOffset = Math.random() * Math.PI * 2;
        bubble.pulseOffset = Math.random() * Math.PI * 2;
      }

      // Side boundary wrapping
      if (bubble.x - bubble.radius > width) bubble.x = -bubble.radius;
      if (bubble.x + bubble.radius < 0) bubble.x = width + bubble.radius;

      // Enhanced magical rendering
      const currentRadius = bubble.radius * (1 + magicPulse);
      const currentGlow = bubble.glowIntensity * (1 + magicPulse * 0.5);

      // Outer glow
      ctx.shadowBlur = currentGlow;
      ctx.shadowColor = bubble.color;

      // Main bubble
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = bubble.color;
      ctx.fill();

      // Inner highlight for magical effect
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(bubble.x - currentRadius * 0.3, bubble.y - currentRadius * 0.3, currentRadius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.6})`;
      ctx.fill();
    });

    // Continue animation
    if (config.animate !== false) {
      requestAnimationFrame(render);
    }
  }

  // Resize handler
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Update background
      backgroundCanvas.width = width;
      backgroundCanvas.height = height;
      const newGradient = backgroundCtx.createRadialGradient(width * 0.3, height * 0.7, 0, width * 0.3, height * 0.7, Math.max(width, height));
      newGradient.addColorStop(0, config.colorStart || "rgba(255, 107, 53, 0.1)");
      newGradient.addColorStop(0.3, config.colorStop || "rgba(106, 27, 154, 0.2)");
      newGradient.addColorStop(0.7, "rgba(255, 193, 7, 0.05)");
      newGradient.addColorStop(1, "rgba(26, 26, 26, 0.3)");

      backgroundCtx.fillStyle = newGradient;
      backgroundCtx.fillRect(0, 0, width, height);

      needsFullRedraw = true;
    }, 250);
  }

  window.addEventListener("resize", handleResize);

  // Start the magic
  requestAnimationFrame(render);

  return {
    canvas: canvas,
    stop: function () {
      config.animate = false;
      window.removeEventListener("resize", handleResize);
    },
    start: function () {
      config.animate = true;
      requestAnimationFrame(render);
    },
  };
};
