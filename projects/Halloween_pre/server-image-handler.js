/**
 * Halloween WebSocket Server - Image Handler
 * ArrayBuffer方式での画像データ中継処理
 *
 * 注意: これはサンプルコードです。実際のサーバー実装に組み込んでください。
 */

// Socket.ioサーバーでの画像処理例
function setupImageHandling(io) {
  io.on("connection", (socket) => {
    let pendingImageMetadata = null;

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

    // クライアント登録処理
    socket.on("register", (clientType) => {
      if (clientType === "display") {
        socket.join("displays");
        console.log(`📺 Display client registered: ${socket.id}`);
      } else if (clientType === "controller") {
        socket.join("controllers");
        console.log(`🎮 Controller client registered: ${socket.id}`);
      }
    });

    // 切断処理
    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

// Express.jsでの使用例
/*
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 静的ファイル配信
app.use(express.static('Halloween_pre'));

// 画像処理セットアップ
setupImageHandling(io);

// サーバー起動
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎃 Halloween Server running on port ${PORT}`);
});
*/

module.exports = { setupImageHandling };
