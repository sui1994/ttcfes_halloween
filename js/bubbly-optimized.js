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
    canvas.setAttribute("style", "position:fixed;z-index:-2;left:0;top:0;min-width:100vw;min-height:100vh;");
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");

  // Enhanced shadow and blur effects for aquarium atmosphere
  // ctx.shadowColor = config.shadowColor || "#4fc3f7";
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

  // Transparent background - let HTML background show through
  backgroundCtx.clearRect(0, 0, width, height); // Completely transparent

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

  // Anti-darkening: Force full redraw more frequently
  let frameCount = 0;
  const RESET_INTERVAL = 500; // Reset every 3 seconds (90 frames at 30fps)

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
    frameCount++;

    // 🚀 最適化6: No-darkening trail system
    if (needsFullRedraw || frameCount % RESET_INTERVAL === 0) {
      ctx.clearRect(0, 0, width, height);
      needsFullRedraw = false;
    } else {
      // Alternative: Use globalAlpha for fade instead of overlay
      ctx.save();
      ctx.globalAlpha = 0.92; // More fade for better shadow visibility
      ctx.globalCompositeOperation = "copy";
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
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
      // newGradient.addColorStop(0, config.colorStart || "#3333ff");
      // newGradient.addColorStop(1, config.colorStop || "#000066");
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

// DOMが読み込まれてから実行
document.addEventListener("DOMContentLoaded", function () {
  // BGM自動再生の設定
  const bgmAudio = document.getElementById("halloween-bgm");

  if (bgmAudio) {
    // 音量を調整（0.0-1.0）
    bgmAudio.volume = 0.3;

    // 自動再生を試行
    const playBGM = () => {
      bgmAudio.play().catch((error) => {
        console.log("BGM自動再生がブロックされました:", error);
        // ユーザーの最初のクリックで再生開始
        document.addEventListener(
          "click",
          function startBGM() {
            bgmAudio.play();
            document.removeEventListener("click", startBGM);
          },
          { once: true }
        );
      });
    };

    // ページ読み込み後すぐに再生試行
    playBGM();
  }
  // アニメーション有りのbat1
  const bat1 = document.querySelector(".bat1");
  // アニメーション無しのbat1-static
  const bat1Static = document.querySelector(".bat1-static");

  // アニメーション有りのbat1のクリックイベント
  if (bat1) {
    bat1.addEventListener("click", function () {
      // 視覚エフェクト
      this.classList.add("clicked");
      setTimeout(() => {
        this.classList.remove("clicked");
      }, 3000);

      // 音楽再生
      try {
        const audio = new Audio("preset_music/happyhalloween.mp3");
        audio.play().catch((error) => {
          console.log("音楽再生エラー:", error);
        });
      } catch (error) {
        console.log("音楽ファイル読み込みエラー:", error);
      }
    });
  } else {
    console.log(".bat1要素が見つかりません");
  }

  // アニメーション無しのbat1-staticのクリックイベント
  if (bat1Static) {
    bat1Static.addEventListener("click", function () {
      // 視覚エフェクト
      this.classList.add("clicked");
      setTimeout(() => {
        this.classList.remove("clicked");
      }, 3000);

      // 音楽再生
      try {
        const audio = new Audio("preset_music/happyhalloween.mp3");
        audio.play().catch((error) => {
          console.log("音楽再生エラー:", error);
        });
      } catch (error) {
        console.log("音楽ファイル読み込みエラー:", error);
      }
    });
  } else {
    console.log(".bat1-static要素が見つかりません");
  }

  // スパイダーのランダム出現制御
  const spider = document.querySelector(".spider");

  if (spider) {
    // ランダムな間隔でスパイダーの位置を変更
    setInterval(() => {
      const randomTop = 5 + Math.random() * 20; // 5%-25%の範囲
      const randomRight = 8 + Math.random() * 17; // 8%-25%の範囲
      const randomRotation = -15 + Math.random() * 30; // -15deg ~ 15deg
      const randomScale = 0.8 + Math.random() * 0.6; // 0.8 ~ 1.4倍

      spider.style.setProperty("--random-top", randomTop + "%");
      spider.style.setProperty("--random-right", randomRight + "%");
      spider.style.setProperty("--random-rotation", randomRotation + "deg");
      spider.style.setProperty("--random-scale", randomScale);
    }, 3000 + Math.random() * 4000); // 3-7秒間隔でランダム変更

    // スパイダークリック時のエフェクト
    spider.addEventListener("click", function () {
      this.style.animation = "none";
      this.style.transform = "scale(2) rotate(720deg)";
      this.style.filter = "brightness(2) drop-shadow(0 0 20px #ff6b35)";

      setTimeout(() => {
        this.style.animation = "spiderRandomAppear 12s infinite";
        this.style.transform = "";
        this.style.filter = "";
      }, 1000);

      // スパイダー専用音効果（オプション）
      try {
        const spiderSound = new Audio("preset_music/happyhalloween.mp3");
        spiderSound.volume = 0.2;
        spiderSound.play().catch((error) => console.log("スパイダー音エラー:", error));
      } catch (error) {
        console.log("スパイダー音ファイルエラー:", error);
      }
    });
  }
});
