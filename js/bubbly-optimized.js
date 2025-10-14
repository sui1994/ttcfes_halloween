/**
 * Optimized Bubbly Background - Canvas Performance Improvements
 * Original: bubbly-bg.js
 * Optimizations: Reduced redraws, object pooling, efficient rendering
 */

"use strict";

window.bubblyOptimized = function (options) {
  const config = options || {};
  const canvas = config.canvas || document.createElement("canvas");
  let width = canvas.width;
  let height = canvas.height;

  // Canvas setup (only if not already in DOM)
  if (canvas.parentNode === null) {
    canvas.setAttribute("style", "position:fixed;z-index:-1;left:0;top:0;min-width:100vw;min-height:100vh;");
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");

  // Enhanced shadow and blur effects for aquarium atmosphere
  ctx.shadowColor = config.shadowColor || "#4fc3f7";
  ctx.shadowBlur = config.blur || 6;

  // 🚀 最適化1: OffscreenCanvas for background gradient (if supported)
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

  // Pre-render background gradient
  const gradient = backgroundCtx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, config.colorStart || "#3333ff");
  gradient.addColorStop(1, config.colorStop || "#000066");
  backgroundCtx.fillStyle = gradient;
  backgroundCtx.fillRect(0, 0, width, height);

  // 🚀 最適化2: Enhanced bubble count and properties for aquarium effect
  const bubbleCount = config.bubbles || Math.min(30, Math.floor(0.015 * (width + height)));
  const bubbles = [];

  // 🚀 最適化3: Object pooling - pre-create bubble objects with variety
  for (let i = 0; i < bubbleCount; i++) {
    const size = Math.random();
    let radius, velocity, opacity;

    // Create different bubble types for more realistic effect
    if (size < 0.3) {
      // Small bubbles - fast and numerous
      radius = 2 + Math.random() * 4;
      velocity = 0.5 + Math.random() * 1.2;
      opacity = 0.3 + Math.random() * 0.4;
    } else if (size < 0.7) {
      // Medium bubbles - moderate speed
      radius = 6 + Math.random() * 8;
      velocity = 0.3 + Math.random() * 0.8;
      opacity = 0.2 + Math.random() * 0.3;
    } else {
      // Large bubbles - slow and prominent
      radius = 12 + Math.random() * 15;
      velocity = 0.1 + Math.random() * 0.4;
      opacity = 0.1 + Math.random() * 0.2;
    }

    bubbles.push({
      x: Math.random() * width,
      y: height + radius, // Start below screen
      radius: radius,
      angle: Math.PI * 1.3 + Math.random() * 0.4, // Mostly upward with slight variation
      velocity: velocity,
      opacity: opacity,
      active: true,
      wobble: Math.random() * 0.02, // Add wobble effect
      wobbleOffset: Math.random() * Math.PI * 2,
    });
  }

  // 🚀 最適化4: Batch rendering with reduced frequency
  let lastFrameTime = 0;
  const targetFPS = 30; // Reduced from 60fps
  const frameInterval = 1000 / targetFPS;

  // 🚀 最適化5: Dirty rectangle tracking
  let needsFullRedraw = true;

  function render(currentTime) {
    if (canvas.parentNode === null) {
      return; // Stop if canvas removed
    }

    // Frame rate limiting
    if (currentTime - lastFrameTime < frameInterval) {
      if (config.animate !== false) {
        requestAnimationFrame(render);
      }
      return;
    }
    lastFrameTime = currentTime;

    // 🚀 最適化6: Clear only when necessary
    if (needsFullRedraw) {
      ctx.clearRect(0, 0, width, height);
      // Draw pre-rendered background
      ctx.drawImage(backgroundCanvas, 0, 0);
      needsFullRedraw = false;
    } else {
      // Partial clear with fade effect
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(51, 51, 255, 0.02)"; // Very subtle fade
      ctx.fillRect(0, 0, width, height);
    }

    // 🚀 最適化7: Batch bubble rendering
    ctx.globalCompositeOperation = config.compose || "lighter";

    // Group bubbles by opacity for batch rendering
    const opacityGroups = {};

    bubbles.forEach((bubble) => {
      if (!bubble.active) return;

      // Enhanced bubble movement with wobble effect
      bubble.wobbleOffset += bubble.wobble;
      const wobbleX = Math.sin(bubble.wobbleOffset) * 2;

      bubble.x += Math.cos(bubble.angle) * bubble.velocity + wobbleX;
      bubble.y += Math.sin(bubble.angle) * bubble.velocity;

      // Realistic bubble behavior - rise to surface and reset
      if (bubble.y + bubble.radius < -50) {
        // Reset bubble at bottom with random position
        bubble.x = Math.random() * width;
        bubble.y = height + bubble.radius + Math.random() * 100;
        bubble.wobbleOffset = Math.random() * Math.PI * 2;
      }

      // Side boundary wrapping
      if (bubble.x - bubble.radius > width) bubble.x = -bubble.radius;
      if (bubble.x + bubble.radius < 0) bubble.x = width + bubble.radius;

      // Group by opacity for batch rendering
      const opacityKey = Math.round(bubble.opacity * 100);
      if (!opacityGroups[opacityKey]) {
        opacityGroups[opacityKey] = [];
      }
      opacityGroups[opacityKey].push(bubble);
    });

    // 🚀 最適化8: Render bubbles in batches by opacity
    Object.keys(opacityGroups).forEach((opacityKey) => {
      const opacity = opacityKey / 100;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

      opacityGroups[opacityKey].forEach((bubble) => {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Continue animation
    if (config.animate !== false) {
      requestAnimationFrame(render);
    }
  }

  // 🚀 最適化9: Resize handler with debouncing
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Update background canvas
      backgroundCanvas.width = width;
      backgroundCanvas.height = height;
      const newGradient = backgroundCtx.createLinearGradient(0, 0, width, height);
      newGradient.addColorStop(0, config.colorStart || "#3333ff");
      newGradient.addColorStop(1, config.colorStop || "#000066");
      backgroundCtx.fillStyle = newGradient;
      backgroundCtx.fillRect(0, 0, width, height);

      needsFullRedraw = true;
    }, 250);
  }

  window.addEventListener("resize", handleResize);

  // Start animation
  requestAnimationFrame(render);

  // Return control object
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
