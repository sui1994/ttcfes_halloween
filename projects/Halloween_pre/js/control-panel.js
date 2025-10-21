/**
 * 🎮 Halloween Control Panel - 専用JavaScript
 * コントロールパネルの機能とWebSocket通信を管理
 */

class HalloweenControlPanel {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.characterStatus = {
      flying: {},
      walking: {},
    };

    this.init();
  }

  init() {
    console.log("🎮 Halloween Control Panel initializing...");

    // DOM要素の取得
    this.connectionIndicator = document.getElementById("connection-indicator");
    this.connectionText = document.getElementById("connection-text");
    this.displayCount = document.getElementById("display-count");
    this.controllerCount = document.getElementById("controller-count");
    this.operationLog = document.getElementById("operation-log");

    // WebSocket接続
    this.initWebSocket();

    // キャラクターUI生成
    this.generateCharacterControls();

    // 定期的な状況更新
    setInterval(() => this.refreshStatus(), 2000);

    // 初期状況表示
    setTimeout(() => this.refreshStatus(), 1000);

    this.addLog("コントロールパネル初期化完了", "success");
  }

  initWebSocket() {
    // Socket.io接続
    this.socket = io();

    this.socket.on("connect", () => {
      this.updateConnectionStatus(true);
      this.addLog("コントロールパネルがサーバーに接続しました", "success");

      // コントローラーとして登録
      this.socket.emit("register", "controller");
    });

    this.socket.on("disconnect", () => {
      this.updateConnectionStatus(false);
      this.addLog("サーバーとの接続が切断されました", "error");
    });

    this.socket.on("client-count", (data) => {
      this.displayCount.textContent = data.displays;
      this.controllerCount.textContent = data.controllers;
    });
  }

  updateConnectionStatus(connected) {
    this.isConnected = connected;
    if (connected) {
      this.connectionIndicator.className = "status-indicator status-connected";
      this.connectionText.textContent = "✅ サーバーに接続済み";
    } else {
      this.connectionIndicator.className = "status-indicator status-disconnected";
      this.connectionText.textContent = "❌ サーバーとの接続が切断されました";
    }
  }

  addLog(message, type = "info") {
    const logEntry = document.createElement("div");
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    this.operationLog.appendChild(logEntry);
    this.operationLog.scrollTop = this.operationLog.scrollHeight;
  }

  generateCharacterControls() {
    // 飛行キャラクター (20体)
    const flyingContainer = document.getElementById("flying-characters");
    for (let i = 1; i <= 20; i++) {
      const card = document.createElement("div");
      card.className = "character-card";
      card.id = `flying-character-${i}`;
      card.innerHTML = `
        <div class="character-status" id="status-flying-${i}"></div>
        <img class="character-image" src="images/changeable/flying-characters/character${i}.png" 
             alt="キャラ${i}" onerror="this.src='images/changeable/flying-characters/character1.png'">
        <div class="character-name">飛行キャラ${i}</div>
        <div class="character-buttons">
          <button class="control-btn hover-btn" onclick="controlPanel.controlCharacter('character${i}', 'hover', 'flying', ${i})">
            ホバー
          </button>
          <button class="control-btn click-btn" onclick="controlPanel.controlCharacter('character${i}', 'click', 'flying', ${i})">
            クリック
          </button>
        </div>
      `;
      flyingContainer.appendChild(card);

      // 初期状態を設定
      this.characterStatus.flying[i] = { active: false, lastAction: null, operator: null };
    }

    // 歩行キャラクター (10体)
    const walkingContainer = document.getElementById("walking-characters");
    const walkingData = [
      { name: "左歩行1", file: "walking-left-1.png" },
      { name: "右歩行1", file: "walking-right-1.png" },
      { name: "左歩行2", file: "walking-left-2.png" },
      { name: "右歩行2", file: "walking-right-2.png" },
      { name: "左歩行3", file: "walking-left-3.png" },
      { name: "右歩行3", file: "walking-right-3.png" },
      { name: "左歩行4", file: "walking-left-4.png" },
      { name: "右歩行4", file: "walking-right-4.png" },
      { name: "左歩行5", file: "walking-left-5.png" },
      { name: "右歩行5", file: "walking-right-5.png" },
    ];

    walkingData.forEach((data, index) => {
      const card = document.createElement("div");
      card.className = "character-card";
      card.id = `walking-character-${index + 1}`;
      card.innerHTML = `
        <div class="character-status" id="status-walking-${index + 1}"></div>
        <img class="character-image" src="images/changeable/walking-characters/${data.file}" 
             alt="${data.name}" onerror="this.src='images/changeable/walking-characters/walking-left-1.png'">
        <div class="character-name">${data.name}</div>
        <div class="character-buttons">
          <button class="control-btn hover-btn" onclick="controlPanel.controlCharacter('walking-${index + 1}', 'hover', 'walking', ${index + 1})">
            ホバー
          </button>
          <button class="control-btn click-btn" onclick="controlPanel.controlCharacter('walking-${index + 1}', 'click', 'walking', ${index + 1})">
            クリック
          </button>
        </div>
      `;
      walkingContainer.appendChild(card);

      // 初期状態を設定
      this.characterStatus.walking[index + 1] = { active: false, lastAction: null, operator: null };
    });
  }

  updateCharacterStatus(type, id, isActive, action, operator = null) {
    const statusElement = document.getElementById(`status-${type}-${id}`);
    const cardElement = document.getElementById(`${type}-character-${id}`);

    if (statusElement && cardElement) {
      if (isActive) {
        statusElement.classList.add("active");
        cardElement.classList.add("active");
      } else {
        statusElement.classList.remove("active");
        cardElement.classList.remove("active");
      }

      // 状態を保存
      this.characterStatus[type][id] = {
        active: isActive,
        lastAction: action,
        operator: operator,
        timestamp: Date.now(),
      };
    }
  }

  controlCharacter(characterId, action, type, id) {
    if (!this.isConnected) {
      this.addLog("サーバーに接続されていません", "error");
      return;
    }

    const data = {
      character: characterId,
      action: action,
      type: type,
      id: id,
      timestamp: Date.now(),
      x: Math.random() * 100, // ランダム位置
      y: Math.random() * 100,
      operator: `コントローラー${Math.floor(Math.random() * 100)}`, // 仮の操作者ID
    };

    // キャラクター状態を更新（アクティブ状態にする）
    this.updateCharacterStatus(type, id, true, action, data.operator);

    if (action === "hover") {
      this.socket.emit("character-hover", data);
      this.addLog(`${characterId} をホバー (操作者: ${data.operator})`, "success");
    } else if (action === "click") {
      this.socket.emit("character-click", data);
      this.addLog(`${characterId} をクリック (操作者: ${data.operator})`, "success");
    }

    // 3秒後にアクティブ状態を解除
    setTimeout(() => {
      this.updateCharacterStatus(type, id, false, null, null);
    }, 3000);
  }

  triggerSpecialEffect(effectType) {
    if (!this.isConnected) {
      this.addLog("サーバーに接続されていません", "error");
      return;
    }

    this.socket.emit("special-effect", {
      type: effectType,
      timestamp: Date.now(),
    });
    this.addLog(`特殊エフェクト: ${effectType}`, "success");
  }

  controlMusic(action) {
    if (!this.isConnected) {
      this.addLog("サーバーに接続されていません", "error");
      return;
    }

    this.socket.emit("music-control", {
      action: action,
      timestamp: Date.now(),
    });
    this.addLog(`音楽制御: ${action}`, "success");
  }

  refreshStatus() {
    const activeCharactersContainer = document.getElementById("active-characters");
    const activeCountElement = document.getElementById("active-count");

    activeCharactersContainer.innerHTML = "";
    let activeCount = 0;

    // 飛行キャラクターをチェック
    Object.keys(this.characterStatus.flying).forEach((id) => {
      const status = this.characterStatus.flying[id];
      if (status.active) {
        activeCount++;
        const item = document.createElement("div");
        item.className = "active-character-item";
        item.innerHTML = `
          <img class="active-character-image" src="images/changeable/flying-characters/character${id}.png" alt="キャラ${id}">
          <div class="active-character-info">
            <div class="active-character-name">飛行キャラ${id}</div>
            <div class="active-character-details">
              最後の操作: ${status.lastAction} | 操作者: ${status.operator || "不明"}
            </div>
          </div>
        `;
        activeCharactersContainer.appendChild(item);
      }
    });

    // 歩行キャラクターをチェック
    Object.keys(this.characterStatus.walking).forEach((id) => {
      const status = this.characterStatus.walking[id];
      if (status.active) {
        activeCount++;
        const walkingNames = ["左歩行1", "右歩行1", "左歩行2", "右歩行2", "左歩行3", "右歩行3", "左歩行4", "右歩行4", "左歩行5", "右歩行5"];
        const walkingFiles = [
          "walking-left-1.png",
          "walking-right-1.png",
          "walking-left-2.png",
          "walking-right-2.png",
          "walking-left-3.png",
          "walking-right-3.png",
          "walking-left-4.png",
          "walking-right-4.png",
          "walking-left-5.png",
          "walking-right-5.png",
        ];

        const item = document.createElement("div");
        item.className = "active-character-item";
        item.innerHTML = `
          <img class="active-character-image" src="images/changeable/walking-characters/${walkingFiles[id - 1]}" alt="${walkingNames[id - 1]}">
          <div class="active-character-info">
            <div class="active-character-name">${walkingNames[id - 1]}</div>
            <div class="active-character-details">
              最後の操作: ${status.lastAction} | 操作者: ${status.operator || "不明"}
            </div>
          </div>
        `;
        activeCharactersContainer.appendChild(item);
      }
    });

    activeCountElement.textContent = activeCount;

    if (activeCount === 0) {
      activeCharactersContainer.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">現在操作中のキャラクターはありません</div>';
    }
  }
}

// グローバル関数（HTMLから呼び出し用）
function triggerSpecialEffect(effectType) {
  if (window.controlPanel) {
    window.controlPanel.triggerSpecialEffect(effectType);
  }
}

function controlMusic(action) {
  if (window.controlPanel) {
    window.controlPanel.controlMusic(action);
  }
}

function refreshStatus() {
  if (window.controlPanel) {
    window.controlPanel.refreshStatus();
  }
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
  window.controlPanel = new HalloweenControlPanel();
});
