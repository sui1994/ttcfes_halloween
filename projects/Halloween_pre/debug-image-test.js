/**
 * 画像送信デバッグ用テストコード
 * 小さなテスト画像で接続を確認
 */

// デバッグ用の小さなテスト画像を送信
function sendTestImage() {
  if (!window.controlPanel || !window.controlPanel.socket) {
    console.error("❌ Socket not available");
    return;
  }

  // 1x1ピクセルの透明PNG（Base64）
  const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==";

  const testMessage = {
    type: "image_replace",
    filename: "character1.png",
    mimeType: "image/png",
    size: 95, // 小さなサイズ
    timestamp: Date.now(),
    data: testImageBase64,
  };

  console.log("🧪 Sending test image...");
  console.log("Test message:", testMessage);

  try {
    window.controlPanel.socket.emit("image-replace", testMessage);
    console.log("✅ Test image sent successfully");
  } catch (error) {
    console.error("❌ Failed to send test image:", error);
  }
}

// デバッグ用の接続状況確認
function checkConnection() {
  if (window.controlPanel && window.controlPanel.socket) {
    console.log("🔍 Socket status:", {
      connected: window.controlPanel.socket.connected,
      id: window.controlPanel.socket.id,
      transport: window.controlPanel.socket.io.engine.transport.name,
    });
  } else {
    console.log("❌ No socket available");
  }
}

// グローバルに公開（コンソールから実行可能）
window.sendTestImage = sendTestImage;
window.checkConnection = checkConnection;

console.log("🧪 Debug functions loaded:");
console.log("- sendTestImage() : 小さなテスト画像を送信");
console.log("- checkConnection() : 接続状況を確認");
