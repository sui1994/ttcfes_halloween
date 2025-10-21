/**
 * 文化祭展示用設定ファイル
 * Magic Hand Controller の詳細設定
 */

// 文化祭用の設定
const FESTIVAL_CONFIG = {
  // 基本設定
  magic: {
    // 手の動きをシミュレートする間隔（ミリ秒）
    moveInterval: 2500, // 2.5秒間隔
    hoverDuration: 1800, // 1.8秒間ホバー
    magicEffects: true, // 魔法エフェクト有効
    autoMode: false, // 自動モード無効（手動操作のみ）
    debug: false, // 本番用：デバッグ無効
  },

  // エフェクト設定
  effects: {
    // パーティクル数
    particleCount: 12,
    // 魔法の光の色
    magicColor: "#ffd700", // ゴールド
    // ホバー時の拡大率
    hoverScale: 1.08,
    // 光の強度
    glowIntensity: 0.8,
  },

  // 音響設定
  audio: {
    // BGM音量
    bgmVolume: 0.3,
    // 効果音音量
    effectVolume: 0.5,
    // 音楽の自動再生試行
    autoPlay: true,
  },

  // インタラクション設定
  interaction: {
    // クリックイベント発生確率（0-1）
    clickProbability: 0.3,
    // 特別なエフェクト発生確率
    specialEffectProbability: 0.15,
    // 連続インタラクション防止時間（ミリ秒）
    cooldownTime: 1000,
  },

  // 展示用特別設定
  exhibition: {
    // 無操作時の自動リセット時間（分）
    autoResetMinutes: 10,
    // 省電力モード（長時間展示用）
    powerSaveMode: true,
    // 夜間モード（暗い環境用）
    nightMode: false,
  },
};

// 時間帯による自動調整
// 時間帯による自動調整（コメントアウト）
/*
function getTimeBasedConfig() {
  const hour = new Date().getHours();
  const config = { ...FESTIVAL_CONFIG };

  // 夜間（18時以降）は少し控えめに
  if (hour >= 18 || hour <= 6) {
    config.magic.moveInterval *= 1.5; // 間隔を長く
    config.effects.glowIntensity *= 0.8; // 光を控えめに
    config.audio.bgmVolume *= 0.7; // 音量を下げる
  }

  // 昼間（10-16時）は活発に
  if (hour >= 10 && hour <= 16) {
    config.magic.moveInterval *= 0.8; // 間隔を短く
    config.interaction.clickProbability *= 1.2; // クリック頻度up
  }

  return config;
}
*/

// 時間帯調整なしの設定取得
function getTimeBasedConfig() {
  return { ...FESTIVAL_CONFIG };
}

// 文化祭用初期化関数
function initFestivalMode() {
  const config = getTimeBasedConfig();

  console.log("🎪 Festival Mode Initializing...");
  console.log("⚙️ Config:", config);

  // Magic Hand Controller を文化祭設定で初期化
  if (window.MagicHandController) {
    window.festivalController = new window.MagicHandController(config.magic);

    // 追加の文化祭用機能
    setupFestivalFeatures(config);

    console.log("🎃✨ Festival Mode Ready!");
    return window.festivalController;
  } else {
    console.error("❌ MagicHandController not found");
    return null;
  }
}

// 文化祭用追加機能
function setupFestivalFeatures(config) {
  // 1. 自動リセット機能
  let lastInteractionTime = Date.now();
  let autoResetTimer;

  function resetAutoResetTimer() {
    lastInteractionTime = Date.now();
    if (autoResetTimer) {
      clearTimeout(autoResetTimer);
    }

    autoResetTimer = setTimeout(() => {
      console.log("🔄 Auto reset triggered");
      location.reload();
    }, config.exhibition.autoResetMinutes * 60 * 1000);
  }

  // インタラクション検知
  document.addEventListener("click", resetAutoResetTimer);
  document.addEventListener("mousemove", resetAutoResetTimer);
  document.addEventListener("keydown", resetAutoResetTimer);

  // 初期タイマー設定
  resetAutoResetTimer();

  // 2. 省電力モード
  if (config.exhibition.powerSaveMode) {
    let isVisible = true;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && isVisible) {
        // ページが非表示になったら省電力モード
        if (window.festivalController) {
          window.festivalController.stopAutoMode();
        }
        isVisible = false;
        console.log("💤 Power save mode activated");
      } else if (!document.hidden && !isVisible) {
        // ページが表示されたら復帰
        setTimeout(() => {
          if (window.festivalController) {
            window.festivalController.startAutoMode();
          }
        }, 1000);
        isVisible = true;
        console.log("⚡ Power save mode deactivated");
      }
    });
  }

  // 3. 緊急制御（隠しコマンド）
  let keySequence = [];
  const emergencyCode = ["f", "e", "s", "t", "i", "v", "a", "l"];

  document.addEventListener("keydown", (e) => {
    keySequence.push(e.key.toLowerCase());
    if (keySequence.length > emergencyCode.length) {
      keySequence.shift();
    }

    if (keySequence.join("") === emergencyCode.join("")) {
      showEmergencyPanel();
      keySequence = [];
    }
  });

  // 4. パフォーマンス監視
  let performanceWarnings = 0;
  setInterval(() => {
    const memory = performance.memory;
    if (memory && memory.usedJSHeapSize > 50 * 1024 * 1024) {
      // 50MB
      performanceWarnings++;
      if (performanceWarnings > 3) {
        console.warn("⚠️ High memory usage detected, consider refresh");
      }
    }
  }, 30000); // 30秒ごとにチェック
}

// 緊急制御パネル
function showEmergencyPanel() {
  const panel = document.createElement("div");
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 10000;
    font-family: monospace;
    border: 2px solid #ff6b35;
  `;

  panel.innerHTML = `
    <h3>🚨 Festival Emergency Panel</h3>
    <button onclick="location.reload()">🔄 Reload Page</button><br><br>
    <button onclick="window.festivalController?.toggleAutoMode()">⏯️ Toggle Auto Mode</button><br><br>
    <button onclick="window.festivalController?.toggleCursor()">🖱️ Toggle Cursor</button><br><br>
    <button onclick="this.parentElement.remove()">❌ Close Panel</button>
  `;

  document.body.appendChild(panel);

  // 10秒後に自動で閉じる
  setTimeout(() => {
    if (panel.parentElement) {
      panel.remove();
    }
  }, 10000);
}

// エクスポート
window.FESTIVAL_CONFIG = FESTIVAL_CONFIG;
window.initFestivalMode = initFestivalMode;

// 自動初期化（他のスクリプトの後に実行）
document.addEventListener("DOMContentLoaded", () => {
  // 少し遅延させて他のスクリプトが読み込まれるのを待つ
  setTimeout(() => {
    initFestivalMode();
  }, 1000);
});
