/**
 * サーバー接続テスト用スクリプト
 * コンソールから実行してサーバーとの通信を確認
 */

// サーバー接続テスト
function testServerConnection() {
  if (!window.controlPanel || !window.controlPanel.socket) {
    console.error("❌ Socket not available");
    return;
  }

  const socket = window.controlPanel.socket;

  console.log("🧪 Testing server connection...");

  // 1. 基本的なpingテスト
  socket.emit("ping", "test-message", (response) => {
    console.log("📨 Ping response:", response);
  });

  // 2. カスタムテストイベント
  socket.emit("test-event", {
    message: "Hello from client",
    timestamp: Date.now(),
  });

  // 3. 画像置換テスト（空データ）
  socket.emit("image-replace", {
    type: "image_replace",
    filename: "test.png",
    mimeType: "image/png",
    size: 100,
    timestamp: Date.now(),
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==",
  });

  console.log("✅ Test messages sent");
}

// サーバーからのレスポンス監視
function monitorServerResponses() {
  if (!window.controlPanel || !window.controlPanel.socket) {
    console.error("❌ Socket not available");
    return;
  }

  const socket = window.controlPanel.socket;

  // テストイベントのレスポンス監視
  socket.on("test-response", (data) => {
    console.log("📥 Test response received:", data);
  });

  socket.on("pong", (data) => {
    console.log("🏓 Pong received:", data);
  });

  console.log("👂 Monitoring server responses...");
}

// グローバルに公開
window.testServerConnection = testServerConnection;
window.monitorServerResponses = monitorServerResponses;

console.log("🧪 Server test functions loaded:");
console.log("- testServerConnection() : サーバー接続をテスト");
console.log("- monitorServerResponses() : サーバーレスポンスを監視");
