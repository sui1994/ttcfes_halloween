/**
 * 🎃 Halloween Bubble Fix - Anti-Whitening Version
 * Prevents the gradual whitening effect in Halloween aquarium
 */

"use strict";

window.halloweenBubblesFix = function (options) {
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

  // Halloween-specific settings to prevent whitening
  ctx.shadowColor = config.shadowColor || "#ffc107";
  ctx.shadowBlur = config.blur || 8;

  // Dark background to prevent white accumulation
  const darkBackground = "rgba(26, 26, 26, 0.95)";

  // Enhanced bubble system with anti-whitening
  const bubbleCount = config.bubbles || 25;
  const bubbles = [];

  // Create Halloween bubbles
  for (let i = 0; i < bubbleCount; i++) {
    const size = Math.random();
    let radius, velocity, opacity, color;

    if (size < 0.3) {
      radius = 3 + Math.random() * 6;
      velocity = 0.4 + Math.random() * 0.8;
      opacity = 0.2 + Math.random() * 0.3;
      color = `rgba(255, 107, 53, ${opacity})`; // Orange
    } else if (size < 0.7) {
      radius = 8 + Math.random() * 12;
      velocity = 0.2 + Math.random() * 0.6;
      opacity = 0.15 + Math.random() * 0.25;
      color = `rgba(106, 27, 154, ${opacity})`; // Purple
    } else {
      radius = 15 + Math.random() * 20;
      velocity = 0.1 + Math.random() * 0.4;
      opacity = 0.1 + Math.random() * 0.2;
      color = `rgba(255, 193, 7, ${opacity})`; // Gold
    }

    bubbles.push({
      x: Math.random() * width,
      y: height + radius + Math.random() * 100,
      radius: radius,
      angle: Math.PI * 1.3 + Math.random() * 0.4,
      velocity: velocity,
      opacity: opacity,
      color: color,
      active: true,
      wobble: Math.random() * 0.02,
      wobbleOffset: Math.random() * Math.PI * 2,
    });
  }

  // Anti-whitening animation system
  let lastFrameTime = 0;
  const targetFPS = 30;
  const frameInterval = 1000 / targetFPS;
  let frameCount = 0;
  const FULL_CLEAR_INTERVAL = 180; // Clear every 6 seconds

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
    frameCount++;

    // Anti-whitening: Full clear periodically
    if (frameCount % FULL_CLEAR_INTERVAL === 0) {
      ctx.clearRect(0, 0, width, height);
      // Dark background to reset any white accumulation
      ctx.fillStyle = darkBackground;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Minimal dark fade instead of blue fade
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(26, 26, 26, 0.03)"; // Very dark fade
      ctx.fillRect(0, 0, width, height);
    }

    // Render bubbles with controlled blending
    ctx.globalCompositeOperation = "screen"; // Controlled blending

    bubbles.forEach((bubble) => {
      if (!bubble.active) return;

      // Enhanced movement
      bubble.wobbleOffset += bubble.wobble;
      const wobbleX = Math.sin(bubble.wobbleOffset) * 2;

      bubble.x += Math.cos(bubble.angle) * bubble.velocity + wobbleX;
      bubble.y += Math.sin(bubble.angle) * bubble.velocity;

      // Reset when reaching top
      if (bubble.y + bubble.radius < -50) {
        bubble.x = Math.random() * width;
        bubble.y = height + bubble.radius + Math.random() * 100;
        bubble.wobbleOffset = Math.random() * Math.PI * 2;
      }

      // Side wrapping
      if (bubble.x - bubble.radius > width) bubble.x = -bubble.radius;
      if (bubble.x + bubble.radius < 0) bubble.x = width + bubble.radius;

      // Render bubble with controlled glow
      ctx.shadowBlur = bubble.radius * 0.5; // Controlled glow
      ctx.shadowColor = bubble.color;

      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = bubble.color;
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
      frameCount = 0; // Reset frame count on resize
    }, 250);
  }

  window.addEventListener("resize", handleResize);

  // Start animation
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
