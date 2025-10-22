/**
 * Halloween Aquarium WebSocket Client
 * 表示画面用WebSocket受信機能
 */

class HalloweenWebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;

    this.init();
  }

  init() {
    console.log("🎃 Halloween WebSocket Client initializing...");
    this.connect();
  }

  connect() {
    try {
      // Socket.io クライアント接続
      this.socket = io();

      // 接続イベント
      this.socket.on("connect", () => {
        console.log("✅ WebSocket connected to server");
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // 表示画面として登録
        this.socket.emit("register", "display");

        // 接続状況を画面に表示
        this.showConnectionStatus(true);
      });

      // 切断イベント
      this.socket.on("disconnect", () => {
        console.log("❌ WebSocket disconnected from server");
        this.isConnected = false;
        this.showConnectionStatus(false);
        this.attemptReconnect();
      });

      // キャラクターホバー受信
      this.socket.on("character-hover", (data) => {
        console.log("🖱️ Received hover:", data);
        this.handleCharacterHover(data);
      });

      // キャラクタークリック受信
      this.socket.on("character-click", (data) => {
        console.log("👆 Received click:", data);
        this.handleCharacterClick(data);
      });

      // 特殊エフェクト受信
      this.socket.on("special-effect", (data) => {
        console.log("✨ Received special effect:", data);
        this.handleSpecialEffect(data);
      });

      // 音楽制御受信
      this.socket.on("music-control", (data) => {
        console.log("🎵 Received music control:", data);
        this.handleMusicControl(data);
      });

      // クライアント数更新
      this.socket.on("client-count", (data) => {
        console.log("📊 Client count updated:", data);
        this.updateClientCount(data);
      });
    } catch (error) {
      console.error("❌ WebSocket connection error:", error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error("❌ Max reconnection attempts reached");
      this.showConnectionStatus(false, "Max reconnection attempts reached");
    }
  }

  // キャラクターホバー処理
  handleCharacterHover(data) {
    const characterElement = this.findCharacterElement(data.character);
    if (characterElement) {
      // ホバーエフェクトを追加
      characterElement.classList.add("remote-hover");

      // 光るエフェクト
      this.addGlowEffect(characterElement);

      // 1.5秒後にエフェクト削除
      setTimeout(() => {
        characterElement.classList.remove("remote-hover");
        this.removeGlowEffect(characterElement);
      }, 1500);
    }
  }

  // キャラクタークリック処理
  handleCharacterClick(data) {
    const characterElement = this.findCharacterElement(data.character);
    if (characterElement) {
      // クリックエフェクトを追加
      characterElement.classList.add("remote-click");

      // 拡大・回転エフェクト
      this.addClickEffect(characterElement);

      // 効果音再生
      this.playClickSound();

      // パーティクルエフェクト
      this.createClickParticles(characterElement);

      // 3秒後にエフェクト削除
      setTimeout(() => {
        characterElement.classList.remove("remote-click");
        this.removeClickEffect(characterElement);
      }, 3000);
    }
  }

  // 特殊エフェクト処理
  handleSpecialEffect(data) {
    switch (data.type) {
      case "confetti":
        this.triggerConfettiEffect();
        break;
      case "lightning":
        this.triggerLightningEffect();
        break;
      case "magic":
        this.triggerMagicEffect();
        break;
      default:
        console.log("Unknown special effect:", data.type);
    }
  }

  // 音楽制御処理
  handleMusicControl(data) {
    const bgmAudio = document.getElementById("halloween-bgm");
    if (!bgmAudio) return;

    switch (data.action) {
      case "play":
        bgmAudio.play().catch((error) => {
          console.error("BGM play error:", error);
        });
        break;
      case "pause":
        bgmAudio.pause();
        break;
      case "volume-up":
        bgmAudio.volume = Math.min(1.0, bgmAudio.volume + 0.1);
        break;
      case "volume-down":
        bgmAudio.volume = Math.max(0.0, bgmAudio.volume - 0.1);
        break;
    }
  }

  // キャラクター要素を検索
  findCharacterElement(characterId) {
    // 飛行キャラクター
    if (characterId.startsWith("character")) {
      const num = characterId.replace("character", "");
      return document.querySelector(`.character${num}`);
    }

    // 歩行キャラクター
    if (characterId.startsWith("walking-")) {
      const walkingSelectors = [".walking-left", ".walking-right", ".walking-left-2", ".walking-right-2", ".walking-left-3"];
      const index = parseInt(characterId.replace("walking-", "")) - 1;
      return document.querySelector(walkingSelectors[index]);
    }

    return null;
  }

  // 光るエフェクト追加
  addGlowEffect(element) {
    element.style.filter = "drop-shadow(0 0 20px #ffd700) brightness(1.3)";
    element.style.transform = "scale(1.1)";
    element.style.transition = "all 0.3s ease";
  }

  // 光るエフェクト削除
  removeGlowEffect(element) {
    element.style.filter = "";
    element.style.transform = "";
  }

  // クリックエフェクト追加
  addClickEffect(element) {
    element.style.filter = "drop-shadow(0 0 30px #ff6b35) brightness(1.5)";
    // transformは使わずCSSクラスで制御
    element.style.transition = "all 0.5s ease";

    // 振動エフェクト
    element.style.animation = "shake 0.5s ease-in-out";
  }

  // クリックエフェクト削除
  removeClickEffect(element) {
    element.style.filter = "";
    element.style.animation = "";
    element.style.transition = "";
  }

  // クリック音再生（専用効果音ファイル使用）
  playClickSound() {
    // 専用効果音ファイルを再生
    const audio = new Audio("preset_music/happyhalloween.mp3");
    audio.volume = 0.3; // 効果音用音量
    audio.currentTime = 0;

    audio.play().catch((error) => {
      console.log("Click sound error:", error);
    });
  }

  // クリックパーティクル生成
  createClickParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("div");
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: #ffd700;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${centerX}px;
        top: ${centerY}px;
      `;

      document.body.appendChild(particle);

      // ランダムな方向に飛ばす
      const angle = (i / 8) * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;

      particle.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0)`, opacity: 0 },
        ],
        {
          duration: 800,
          easing: "ease-out",
        }
      ).onfinish = () => {
        particle.remove();
      };
    }
  }

  // 紙吹雪エフェクト
  triggerConfettiEffect() {
    const colors = ["#ff6b35", "#ffc107", "#4caf50", "#2196f3", "#9c27b0"];

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          top: -10px;
          left: ${Math.random() * 100}vw;
          z-index: 9999;
          pointer-events: none;
        `;

        document.body.appendChild(confetti);

        confetti.animate(
          [
            { transform: "translateY(0) rotate(0deg)", opacity: 1 },
            { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 },
          ],
          {
            duration: 3000 + Math.random() * 2000,
            easing: "ease-in",
          }
        ).onfinish = () => {
          confetti.remove();
        };
      }, i * 100);
    }
  }

  // 雷エフェクト
  triggerLightningEffect() {
    const flash = document.createElement("div");
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 9998;
      pointer-events: none;
      opacity: 0;
    `;

    document.body.appendChild(flash);

    // フラッシュアニメーション
    flash.animate([{ opacity: 0 }, { opacity: 0.8 }, { opacity: 0 }, { opacity: 0.6 }, { opacity: 0 }], {
      duration: 500,
      easing: "ease-in-out",
    }).onfinish = () => {
      flash.remove();
    };
  }

  // 魔法エフェクト
  triggerMagicEffect() {
    const sparkles = [];

    for (let i = 0; i < 20; i++) {
      const sparkle = document.createElement("div");
      sparkle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #ffd700;
        border-radius: 50%;
        top: ${Math.random() * 100}vh;
        left: ${Math.random() * 100}vw;
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 0 10px #ffd700;
      `;

      document.body.appendChild(sparkle);
      sparkles.push(sparkle);

      sparkle.animate(
        [
          { opacity: 0, transform: "scale(0)" },
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0)" },
        ],
        {
          duration: 1000 + Math.random() * 1000,
          delay: Math.random() * 500,
        }
      ).onfinish = () => {
        sparkle.remove();
      };
    }
  }

  // 接続状況表示
  showConnectionStatus(connected, message = "") {
    // 既存の状況表示要素があれば削除
    const existingStatus = document.getElementById("websocket-status");
    if (existingStatus) {
      existingStatus.remove();
    }

    const statusDiv = document.createElement("div");
    statusDiv.id = "websocket-status";
    statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      padding: 10px 15px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 9999;
      transition: all 0.3s ease;
      ${connected ? "background: rgba(76, 175, 80, 0.9); color: white;" : "background: rgba(244, 67, 54, 0.9); color: white;"}
    `;

    statusDiv.textContent = connected ? "🔗 リモート操作: 接続中" : `❌ リモート操作: 切断 ${message}`;

    document.body.appendChild(statusDiv);

    // 5秒後に自動で薄くする
    if (connected) {
      setTimeout(() => {
        if (statusDiv.parentElement) {
          statusDiv.style.opacity = "0.3";
        }
      }, 5000);
    }
  }

  // クライアント数更新
  updateClientCount(data) {
    const statusDiv = document.getElementById("websocket-status");
    if (statusDiv && this.isConnected) {
      statusDiv.textContent = `🔗 リモート操作: 接続中 (操作者: ${data.controllers}人)`;
    }
  }
}

// CSS アニメーション追加
const style = document.createElement("style");
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  .remote-hover {
    animation: pulse 1.5s ease-in-out;
  }
  
  .remote-click {
    animation: bounce 0.5s ease-in-out;
    transform: scale(1.2) rotate(10deg) !important;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.1) rotate(-5deg); }
    50% { transform: scale(1.2) rotate(5deg); }
    75% { transform: scale(1.1) rotate(-2deg); }
  }
`;
document.head.appendChild(style);

// グローバルに公開
window.HalloweenWebSocketClient = HalloweenWebSocketClient;
