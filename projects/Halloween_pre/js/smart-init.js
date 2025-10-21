/**
 * スマート初期化システム
 * DOMContentLoadedと手動制御のハイブリッド
 */

// 初期化状態の管理
let isInitialized = false;
let initMode = "auto"; // 'auto', 'manual', 'disabled'

// URL パラメータで動作モードを制御
function getInitMode() {
  const params = new URLSearchParams(window.location.search);

  // ?mode=manual → 手動初期化のみ
  if (params.get("mode") === "manual") return "manual";

  // ?mode=disabled → 初期化無効
  if (params.get("mode") === "disabled") return "disabled";

  // ?debug=true → デバッグモード
  if (params.get("debug") === "true") return "manual";

  // デフォルト：自動初期化
  return "auto";
}

// 安全な初期化関数
function safeInit() {
  if (isInitialized) {
    console.log("🎃 Already initialized, skipping...");
    return false;
  }

  try {
    if (typeof initFestivalMode === "function") {
      initFestivalMode();
      isInitialized = true;
      console.log("✅ Festival mode initialized successfully");
      return true;
    } else {
      console.error("❌ initFestivalMode function not found");
      return false;
    }
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    return false;
  }
}

// 手動初期化用のグローバル関数
window.startFestival = function () {
  console.log("🎪 Manual festival start requested");
  return safeInit();
};

window.stopFestival = function () {
  if (window.festivalController) {
    window.festivalController.destroy();
    isInitialized = false;
    console.log("🛑 Festival stopped");
  }
};

// 初期化モードの設定
initMode = getInitMode();
console.log(`🎯 Init mode: ${initMode}`);

// DOMContentLoaded での条件付き初期化
document.addEventListener("DOMContentLoaded", () => {
  switch (initMode) {
    case "auto":
      console.log("🚀 Auto-initializing festival mode...");
      setTimeout(() => {
        safeInit();
      }, 1000);
      break;

    case "manual":
      console.log("👋 Manual mode: Use startFestival() to begin");
      // 手動開始ボタンを表示
      showManualStartButton();
      break;

    case "disabled":
      console.log("🚫 Festival mode disabled");
      break;
  }
});

// 手動開始ボタンの表示
function showManualStartButton() {
  const button = document.createElement("button");
  button.innerHTML = "🎃 Start Festival Mode";
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 15px 25px;
    background: linear-gradient(45deg, #ff6b35, #ffc107);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;

  button.addEventListener("click", () => {
    if (safeInit()) {
      button.style.display = "none";
    }
  });

  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.05)";
    button.style.boxShadow = "0 6px 20px rgba(255,107,53,0.4)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
    button.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
  });

  document.body.appendChild(button);
}

// エラー監視
window.addEventListener("error", (event) => {
  if (event.message.includes("festival") || event.message.includes("magic")) {
    console.error("🚨 Festival system error detected:", event.error);
  }
});

// パフォーマンス監視
if (performance.mark) {
  performance.mark("festival-init-start");

  window.addEventListener("load", () => {
    performance.mark("festival-init-end");
    if (performance.measure) {
      performance.measure("festival-init-duration", "festival-init-start", "festival-init-end");
      const measure = performance.getEntriesByName("festival-init-duration")[0];
      console.log(`⏱️ Festival initialization took ${measure.duration.toFixed(2)}ms`);
    }
  });
}

console.log("🎪 Smart initialization system loaded");
console.log("💡 URL options: ?mode=manual, ?mode=disabled, ?debug=true");
