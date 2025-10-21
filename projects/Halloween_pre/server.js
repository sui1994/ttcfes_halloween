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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("🎃 Halloween Aquarium Server Started!");
  console.log(`📺 Display URL: http://localhost:${PORT}/`);
  console.log(`🎮 Control URL: http://localhost:${PORT}/control`);
  console.log(`🚀 Server running on port ${PORT}`);
});
