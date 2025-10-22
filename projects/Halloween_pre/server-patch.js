/**
 * 既存サーバーに追加するパッチコード
 * 既存のSocket.ioサーバーのconnectionハンドラー内に追加してください
 */

// 既存のio.on('connection', (socket) => { の中に以下を追加

// 画像置換メッセージ受信（Base64対応）
socket.on("image-replace", (imageMessage) => {
  console.log(`📥 Image replace received: ${imageMessage.filename} (${imageMessage.mimeType})`);
  console.log(`📤 Broadcasting to displays: ${(imageMessage.data.length / 1024).toFixed(1)}KB`);

  // 表示画面に画像メッセージを転送
  socket.broadcast.to("displays").emit("image-replace", imageMessage);
});

// 分割画像送信対応
socket.on("image-start", (metadata) => {
  console.log(`📦 Large image start: ${metadata.filename} (${metadata.totalChunks} chunks)`);
  socket.broadcast.to("displays").emit("image-start", metadata);
});

socket.on("image-chunk", (chunkData) => {
  console.log(`📥 Chunk ${chunkData.chunkIndex + 1}/${chunkData.totalChunks}: ${chunkData.filename}`);
  socket.broadcast.to("displays").emit("image-chunk", chunkData);
});

socket.on("image-complete", (completeData) => {
  console.log(`✅ Large image complete: ${completeData.filename}`);
  socket.broadcast.to("displays").emit("image-complete", completeData);
});

// テスト用イベント
socket.on("ping", (data, callback) => {
  console.log("🏓 Ping received:", data);
  if (callback) callback("pong");
  socket.emit("pong", data);
});

socket.on("test-event", (data) => {
  console.log("🧪 Test event received:", data);
  socket.emit("test-response", { received: true, timestamp: Date.now() });
});

// クライアント登録処理（既存のものがなければ追加）
socket.on("register", (clientType) => {
  if (clientType === "display") {
    socket.join("displays");
    console.log(`📺 Display client registered: ${socket.id}`);
  } else if (clientType === "controller") {
    socket.join("controllers");
    console.log(`🎮 Controller client registered: ${socket.id}`);
  }
});
