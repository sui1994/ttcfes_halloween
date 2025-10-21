/**
 * 🎃 Halloween Display - 表示画面専用JavaScript
 * 表示画面のWebSocket通信とイベント処理を管理
 */

class HalloweenDisplay {
  constructor() {
    this.webSocketClient = null;
    this.init();
  }

  init() {
    console.log("🎃 Halloween Display initializing...");

    // WebSocketクライアント初期化
    this.initWebSocket();

    console.log("🎃 Halloween Display initialized!");
  }

  initWebSocket() {
    // WebSocketクライアント初期化
    if (window.HalloweenWebSocketClient) {
      this.webSocketClient = new window.HalloweenWebSocketClient();
      console.log("🎃 Halloween WebSocket Client initialized!");
    } else {
      console.warn("⚠️ HalloweenWebSocketClient not found, retrying...");
      setTimeout(() => this.initWebSocket(), 1000);
    }
  }
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
  window.halloweenDisplay = new HalloweenDisplay();
});
