/**
 * Magic Hand Control System - 文化祭展示用
 * マウスカーソルを非表示にして、手をかざしたような演出を作る
 */

"use strict";

class MagicHandController {
  constructor(options = {}) {
    this.options = {
      // 手の動きをシミュレートする間隔（ミリ秒）
      moveInterval: options.moveInterval || 2000,
      // ホバー効果の持続時間
      hoverDuration: options.hoverDuration || 1500,
      // 魔法エフェクトの設定
      magicEffects: options.magicEffects !== false,
      // 自動モードの有効/無効
      autoMode: options.autoMode !== false,
      // デバッグモード（開発時のみ）
      debug: options.debug || false,
      ...options,
    };

    this.isActive = false;
    this.currentTarget = null;
    this.magicInterval = null;
    this.hoverableElements = [];
    this.lastInteractionTime = Date.now();

    this.init();
  }

  init() {
    // マウスカーソルを完全に非表示
    this.hideCursor();

    // ホバー可能な要素を検索
    this.findHoverableElements();

    // 魔法エフェクトの初期化
    if (this.options.magicEffects) {
      this.initMagicEffects();
    }

    // 自動モードの開始（コメントアウト - 手動操作のみ）
    // if (this.options.autoMode) {
    //   this.startAutoMode();
    // }

    // イベントリスナーの設定
    this.setupEventListeners();

    console.log("🎃 Magic Hand Controller initialized");
  }

  hideCursor() {
    // CSSでカーソルを非表示
    const style = document.createElement("style");
    style.textContent = `
      * {
        cursor: none !important;
      }
      
      body, html {
        cursor: none !important;
      }
      
      /* 魔法の手のエフェクト用CSS */
      .magic-hand-effect {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, rgba(255, 165, 0, 0.4) 50%, transparent 100%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: magicGlow 2s ease-in-out infinite;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .magic-hand-effect.active {
        opacity: 1;
      }
      
      @keyframes magicGlow {
        0%, 100% { 
          transform: translate(-50%, -50%) scale(1);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
        }
        50% { 
          transform: translate(-50%, -50%) scale(1.2);
          box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
        }
      }
      
      /* ホバー効果の強化 */
      .magic-hover-target {
        transition: all 0.3s ease !important;
      }
      
      .magic-hover-target.magic-hovered {
        transform: scale(1.05) !important;
        filter: brightness(1.2) drop-shadow(0 0 20px rgba(255, 215, 0, 0.6)) !important;
        z-index: 1000 !important;
      }
      
      /* パーティクルエフェクト */
      .magic-particle {
        position: fixed;
        pointer-events: none;
        z-index: 9998;
        width: 4px;
        height: 4px;
        background: #ffd700;
        border-radius: 50%;
        animation: particleFloat 3s ease-out forwards;
      }
      
      @keyframes particleFloat {
        0% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(-100px) scale(0);
        }
      }
    `;
    document.head.appendChild(style);

    // 魔法の手エフェクト要素を作成
    if (this.options.magicEffects) {
      this.magicHand = document.createElement("div");
      this.magicHand.className = "magic-hand-effect";
      document.body.appendChild(this.magicHand);
    }
  }

  findHoverableElements() {
    // ホバー可能な要素を自動検出
    const selectors = [
      "a",
      "button",
      ".version-card",
      ".version-link",
      "[onclick]",
      "[onmouseover]",
      ".clickable",
      ".fish1_1",
      ".fish1_2",
      ".fish2_1",
      ".fish2_2",
      ".fish3_1",
      ".fish3_2",
      ".fish4_1",
      ".fish4_2",
      ".fish5_1",
      ".fish5_2",
      ".fish6_1",
      ".fish6_2",
      ".halloween_1",
      ".bat1-static",
      ".nemo1",
      ".nemo2",
      ".nemo3",
      ".dory",
      ".chouchou",
      ".angelfish1",
      ".angelfish2",
      ".angelfish3",
      ".angelfish4",
      ".angelfish5",
      ".angelfish6",
      ".angelfish7",
      ".crab",
      ".shell",
      ".maguro1",
      ".maguro2",
      ".jellyfish1",
      ".jellyfish2",
    ];

    this.hoverableElements = [];
    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        if (!this.hoverableElements.includes(el)) {
          this.hoverableElements.push(el);
          el.classList.add("magic-hover-target");
        }
      });
    });

    console.log(`Found ${this.hoverableElements.length} hoverable elements`);
  }

  initMagicEffects() {
    // 魔法エフェクトの初期化
    this.particleContainer = document.createElement("div");
    this.particleContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9997;
    `;
    document.body.appendChild(this.particleContainer);
  }

  startAutoMode() {
    // 自動モードをコメントアウト - 手動操作のみ
    /*
    if (this.magicInterval) {
      clearInterval(this.magicInterval);
    }

    this.magicInterval = setInterval(() => {
      this.performMagicInteraction();
    }, this.options.moveInterval);

    this.isActive = true;
    */
    console.log("🚫 Auto mode disabled - manual interaction only");
  }

  stopAutoMode() {
    if (this.magicInterval) {
      clearInterval(this.magicInterval);
      this.magicInterval = null;
    }
    this.isActive = false;
  }

  performMagicInteraction() {
    if (this.hoverableElements.length === 0) return;

    // ランダムな要素を選択
    const randomElement = this.hoverableElements[Math.floor(Math.random() * this.hoverableElements.length)];

    this.simulateHandHover(randomElement);
  }

  simulateHandHover(element) {
    if (!element || !element.getBoundingClientRect) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 魔法の手エフェクトを表示
    if (this.magicHand) {
      this.magicHand.style.left = centerX + "px";
      this.magicHand.style.top = centerY + "px";
      this.magicHand.classList.add("active");
    }

    // ホバー効果を適用
    this.applyHoverEffect(element);

    // パーティクルエフェクト
    if (this.options.magicEffects) {
      this.createParticles(centerX, centerY);
    }

    // 音効果（既存の音楽システムを利用）- コメントアウト
    // this.playMagicSound();

    // 一定時間後にエフェクトを解除
    setTimeout(() => {
      this.removeHoverEffect(element);
      if (this.magicHand) {
        this.magicHand.classList.remove("active");
      }
    }, this.options.hoverDuration);
  }

  applyHoverEffect(element) {
    // 現在のホバー効果を解除
    if (this.currentTarget) {
      this.removeHoverEffect(this.currentTarget);
    }

    // 新しいホバー効果を適用
    element.classList.add("magic-hovered");
    this.currentTarget = element;

    // 既存のホバーイベントをトリガー
    const hoverEvent = new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(hoverEvent);

    // クリックイベントも時々トリガー（25%の確率）
    if (Math.random() < 0.25) {
      setTimeout(() => {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        element.dispatchEvent(clickEvent);
      }, 500);
    }
  }

  removeHoverEffect(element) {
    if (element) {
      element.classList.remove("magic-hovered");

      // マウスアウトイベントをトリガー
      const mouseOutEvent = new MouseEvent("mouseout", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      element.dispatchEvent(mouseOutEvent);
    }
    this.currentTarget = null;
  }

  createParticles(x, y) {
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "magic-particle";

      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;

      particle.style.left = particleX + "px";
      particle.style.top = particleY + "px";

      this.particleContainer.appendChild(particle);

      // パーティクルを自動削除
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 3000);
    }
  }

  playMagicSound() {
    // 音響効果をコメントアウト
    /*
    // 既存の音楽システムを利用
    if (typeof playClickSound === "function") {
      playClickSound();
    }
    */
    console.log("🔇 Sound effects disabled");
  }

  setupEventListeners() {
    // 緊急時のカーソル復帰（Escキー）
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.toggleCursor();
      }

      // スペースキーで自動モードのオン/オフ
      if (e.key === " ") {
        e.preventDefault();
        this.toggleAutoMode();
      }
    });

    // ウィンドウのフォーカス管理
    window.addEventListener("blur", () => {
      this.stopAutoMode();
    });

    window.addEventListener("focus", () => {
      if (this.options.autoMode) {
        setTimeout(() => {
          this.startAutoMode();
        }, 1000);
      }
    });
  }

  toggleCursor() {
    const style = document.querySelector("style");
    if (style && style.textContent.includes("cursor: none")) {
      // カーソルを表示
      style.textContent = style.textContent.replace(/cursor: none !important;/g, "");
      console.log("🖱️ Cursor restored");
    } else {
      // カーソルを非表示
      this.hideCursor();
      console.log("👻 Cursor hidden");
    }
  }

  toggleAutoMode() {
    if (this.isActive) {
      this.stopAutoMode();
      console.log("🛑 Auto mode stopped");
    } else {
      this.startAutoMode();
      console.log("▶️ Auto mode started");
    }
  }

  // 公開メソッド
  destroy() {
    this.stopAutoMode();

    if (this.magicHand) {
      this.magicHand.remove();
    }

    if (this.particleContainer) {
      this.particleContainer.remove();
    }

    // カーソルを復帰
    this.toggleCursor();
  }
}

// グローバルに公開
window.MagicHandController = MagicHandController;

// 自動初期化（コメントアウト - 手動初期化のみ）
/*
document.addEventListener("DOMContentLoaded", function () {
  // 文化祭モードの設定
  const magicController = new MagicHandController({
    moveInterval: 3000, // 3秒間隔で魔法発動
    hoverDuration: 2000, // 2秒間ホバー効果
    magicEffects: true, // 魔法エフェクト有効
    autoMode: false, // 自動モード無効（手動操作のみ）
    debug: false, // デバッグモード無効
  });

  // グローバルに保存（必要に応じて制御可能）
  window.magicController = magicController;

  console.log("🎃✨ Magic Hand Controller ready for 文化祭!");
  console.log("💡 Controls: ESC = toggle cursor, SPACE = toggle auto mode");
});
*/

console.log("🎃 Magic Hand Controller loaded (manual initialization required)");
