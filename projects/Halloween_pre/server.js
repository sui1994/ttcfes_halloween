/**
 * Halloween Aquarium WebSocket Server
 * 文化祭用リモート操作サーバー
 */

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // 画像アップロード対応の設定
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB (Base64膨張を考慮)
  pingTimeout: 60000, // 60秒
  pingInterval: 25000, // 25秒
  upgradeTimeout: 30000, // 30秒
  allowEIO3: true, // 互換性向上
});

// 静的ファイル配信（現在のディレクトリから）
app.use(express.static(__dirname));

// ルート設定
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "halloween.html"));
});

app.get("/control", (req, res) => {
  res.sendFile(path.join(__dirname, "control.html"));
});

app.get("/test-chunked", (req, res) => {
  res.sendFile(path.join(__dirname, "test-chunked-upload.html"));
});

// 接続中のクライアント管理
let connectedClients = {
  displays: new Set(),
  controllers: new Set(),
};

// WebSocket接続処理
io.on("connection", (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`);

  // クライアントタイプの登録
  socket.on("register", (type) => {
    if (type === "display") {
      connectedClients.displays.add(socket.id);
      console.log(`📺 Display registered: ${socket.id}`);
    } else if (type === "controller") {
      connectedClients.controllers.add(socket.id);
      console.log(`🎮 Controller registered: ${socket.id}`);
    }

    // 接続状況を送信
    io.emit("client-count", {
      displays: connectedClients.displays.size,
      controllers: connectedClients.controllers.size,
    });
  });

  // キャラクターホバー操作
  socket.on("character-hover", (data) => {
    console.log(`🖱️ Hover: ${data.character} at (${data.x}, ${data.y})`);
    // 表示画面にのみ送信
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("character-hover", data);
    });
  });

  // キャラクタークリック操作
  socket.on("character-click", (data) => {
    console.log(`👆 Click: ${data.character} at (${data.x}, ${data.y})`);
    // 表示画面にのみ送信
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("character-click", data);
    });
  });

  // キャラクター拡大操作
  socket.on("character-scale", (data) => {
    console.log(`🔍 Scale: ${data.character} at (${data.x}, ${data.y})`);
    // 表示画面にのみ送信
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("character-scale", data);
    });
  });

  // キャラクター震え操作
  socket.on("character-shake", (data) => {
    console.log(`🌀 Shake: ${data.character} at (${data.x}, ${data.y})`);
    // 表示画面にのみ送信
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("character-shake", data);
    });
  });

  // 特殊エフェクト
  socket.on("special-effect", (data) => {
    console.log(`✨ Special Effect: ${data.type}`);
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("special-effect", data);
    });
  });

  // 音楽制御
  socket.on("music-control", (data) => {
    console.log(`🎵 Music Control: ${data.action}`);
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("music-control", data);
    });
  });

  // 画像置換メッセージ受信（Base64対応）
  socket.on("image-replace", (imageMessage) => {
    try {
      console.log(`📥 Image replace received: ${imageMessage.filename} (${imageMessage.mimeType})`);
      console.log(`📤 Broadcasting to displays: ${(imageMessage.data.length / 1024).toFixed(1)}KB`);

      // データサイズチェック
      const dataSizeKB = imageMessage.data.length / 1024;
      if (dataSizeKB > 10 * 1024) {
        // 10MB制限
        console.warn(`⚠️ Large image data: ${dataSizeKB.toFixed(1)}KB`);
      }

      // 表示画面に画像メッセージを転送
      connectedClients.displays.forEach((displayId) => {
        io.to(displayId).emit("image-replace", imageMessage);
      });
    } catch (error) {
      console.error("❌ Image replace error:", error);
      socket.emit("image-error", { message: "Image processing failed" });
    }
  });

  // 分割画像送信対応
  socket.on("image-start", (metadata) => {
    console.log(`📦 Large image start: ${metadata.filename} (${metadata.totalChunks} chunks)`);
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("image-start", metadata);
    });
  });

  socket.on("image-chunk", (chunkData) => {
    console.log(`📥 Chunk ${chunkData.chunkIndex + 1}/${chunkData.totalChunks}: ${chunkData.filename} (${chunkData.data.length} chars)`);
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("image-chunk", chunkData);
    });
  });

  socket.on("image-complete", (completeData) => {
    console.log(`✅ Large image complete: ${completeData.filename}`);
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("image-complete", completeData);
    });
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

  // デバッグ用：すべてのイベントをログ出力
  socket.onAny((eventName, ...args) => {
    if (!["ping", "pong"].includes(eventName)) {
      console.log(`📡 Event received: ${eventName}`, args.length > 0 ? args[0] : "");
    }
  });

  // シンプル画像受信
  socket.on("image-simple", (message) => {
    console.log(`📥 Simple image received: ${message.filename} (${(message.size / 1024).toFixed(1)}KB)`);

    // 表示画面に転送
    connectedClients.displays.forEach((displayId) => {
      io.to(displayId).emit("image-simple", message);
    });
  });

  // バイナリチャンクアップロード対応
  socket.on("file-upload-metadata", (metadata) => {
    console.log(`📋 File upload metadata: ${metadata.filename} (${metadata.totalChunks} chunks)`);

    // セッション管理
    if (!socket.uploadSessions) {
      socket.uploadSessions = new Map();
    }

    socket.uploadSessions.set(metadata.sessionId, {
      filename: metadata.filename,
      filesize: metadata.filesize,
      totalChunks: metadata.totalChunks,
      mimeType: metadata.mimeType,
      chunks: new Array(metadata.totalChunks),
      receivedChunks: 0,
      timestamp: Date.now(),
    });

    // メタデータ受信確認
    socket.emit("file-upload-ack", {
      sessionId: metadata.sessionId,
      chunkIndex: -1,
    });
  });

  socket.on("file-upload-chunk", (data) => {
    try {
      const uint8Array = new Uint8Array(data);

      // メタデータ区切り文字を探す
      const delimiter = new TextEncoder().encode("|||");
      let delimiterIndex = -1;

      for (let i = 0; i < uint8Array.length - 2; i++) {
        if (uint8Array[i] === delimiter[0] && uint8Array[i + 1] === delimiter[1] && uint8Array[i + 2] === delimiter[2]) {
          delimiterIndex = i;
          break;
        }
      }

      if (delimiterIndex === -1) {
        socket.emit("file-upload-error", {
          message: "Invalid chunk format",
        });
        return;
      }

      // メタデータとチャンクデータを分離
      const metadataBytes = uint8Array.slice(0, delimiterIndex);
      const chunkData = uint8Array.slice(delimiterIndex + 3);

      const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));

      if (!socket.uploadSessions) {
        socket.uploadSessions = new Map();
      }

      const session = socket.uploadSessions.get(metadata.sessionId);

      if (!session) {
        socket.emit("file-upload-error", {
          message: "Session not found",
        });
        return;
      }

      // チャンクを保存
      session.chunks[metadata.chunkIndex] = chunkData;
      session.receivedChunks++;

      console.log(`📦 Chunk received: ${metadata.chunkIndex + 1}/${metadata.totalChunks} for ${metadata.filename}`);

      // ACK送信
      socket.emit("file-upload-ack", {
        sessionId: metadata.sessionId,
        chunkIndex: metadata.chunkIndex,
      });

      // すべてのチャンクが揃ったか確認
      console.log(`📊 Progress: ${session.receivedChunks}/${session.totalChunks} chunks received`);
      if (session.receivedChunks === session.totalChunks) {
        console.log(`🎯 All chunks received! Calling handleCompleteFileUpload for ${metadata.filename}`);
        handleCompleteFileUpload(socket, metadata.sessionId, session);
      }
    } catch (error) {
      console.error("❌ Chunk processing error:", error);
      socket.emit("file-upload-error", {
        message: "Chunk processing failed",
      });
    }
  });

  // 切断処理
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    connectedClients.displays.delete(socket.id);
    connectedClients.controllers.delete(socket.id);

    // 接続状況を更新
    io.emit("client-count", {
      displays: connectedClients.displays.size,
      controllers: connectedClients.controllers.size,
    });
  });
});

// ファイルアップロード完了処理
function handleCompleteFileUpload(socket, sessionId, session) {
  console.log(`✅ File upload complete: ${session.filename}`);

  // すべてのチャンクが揃っているか確認
  const missingChunks = [];
  for (let i = 0; i < session.chunks.length; i++) {
    if (!session.chunks[i]) {
      missingChunks.push(i);
    }
  }

  if (missingChunks.length > 0) {
    console.log(`❌ Missing chunks: ${missingChunks.join(", ")}`);
    socket.emit("file-upload-error", {
      message: `Missing chunks: ${missingChunks.join(", ")}`,
    });
    return;
  }

  console.log(`✅ All ${session.chunks.length} chunks are present`);

  // チャンクを結合
  const totalLength = session.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const completeFile = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of session.chunks) {
    completeFile.set(chunk, offset);
    offset += chunk.length;
  }

  // 高速バイナリ配信: ArrayBufferを直接送信（さらなる最適化）
  const binaryMessage = {
    type: "image_replace_binary",
    filename: session.filename,
    mimeType: session.mimeType,
    size: session.filesize,
    timestamp: Date.now(),
    uploadMethod: "binary-chunked",
  };

  console.log(`📤 Broadcasting binary image to displays: ${session.filename} (${(session.filesize / 1024).toFixed(1)}KB)`);

  // 表示画面にバイナリデータを直接送信（最高効率）
  connectedClients.displays.forEach((displayId) => {
    io.to(displayId).emit("image-replace-binary-metadata", binaryMessage);
    io.to(displayId).emit("image-replace-binary-data", completeFile.buffer);
  });

  // 互換性のため、Base64版も送信（既存システム用）
  const base64Data = arrayBufferToBase64(completeFile.buffer);
  const imageMessage = {
    type: "image_replace",
    filename: session.filename,
    mimeType: session.mimeType,
    size: session.filesize,
    data: base64Data,
    timestamp: Date.now(),
    uploadMethod: "binary-chunked",
  };

  // Base64版も送信（フォールバック）
  connectedClients.displays.forEach((displayId) => {
    io.to(displayId).emit("image-replace", imageMessage);
  });

  // 完了通知
  socket.emit("file-upload-complete", {
    sessionId: sessionId,
    filename: session.filename,
    filesize: session.filesize,
  });

  // セッション削除
  socket.uploadSessions.delete(sessionId);
}

// ArrayBufferをBase64に変換
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost"; // 'localhost' or '0.0.0.0'

server.listen(PORT, HOST, () => {
  console.log("🎃 Halloween Aquarium Server Started!");
  console.log(`📺 Display URL: http://localhost:${PORT}/`);
  console.log(`🎮 Control URL: http://localhost:${PORT}/control`);
  console.log(`🚀 Server running on ${HOST}:${PORT}`);

  if (HOST === "0.0.0.0") {
    console.log(`🌐 Network access available - use your IP address to connect from other devices`);
  } else {
    console.log(`🏠 Local access only - set HOST=0.0.0.0 to allow network access`);
  }
});
