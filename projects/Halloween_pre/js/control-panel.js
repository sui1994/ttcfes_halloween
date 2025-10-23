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

      // 画像アップローダー初期化
      this.initImageUploader();
    });

    this.socket.on("disconnect", (reason) => {
      this.updateConnectionStatus(false);
      this.addLog(`サーバーとの接続が切断されました: ${reason}`, "error");
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      this.addLog(`接続エラー: ${error.message}`, "error");
      console.error("❌ Connection error:", error);
    });

    this.socket.on("client-count", (data) => {
      this.displayCount.textContent = data.displays;
      this.controllerCount.textContent = data.controllers;
    });
  }

  initImageUploader() {
    if (window.HalloweenImageUploader && this.socket) {
      this.imageUploader = new HalloweenImageUploader(this.socket);
      this.addLog("画像アップロードシステムが初期化されました", "success");

      // 画像更新コールバックを設定
      console.log(`🔍 画像更新コールバックを設定中...`);
      this.imageUploader.setImageUpdateCallback((filename) => {
        console.log(`🔍 コールバック受信: ${filename}`);
        this.handleImageUpdate(filename);
      });
      console.log(`✅ 画像更新コールバック設定完了`);
    }

    // シンプル画像送信システムも初期化
    if (window.SimpleImageSender && this.socket) {
      this.simpleImageSender = new SimpleImageSender(this.socket);
      this.addLog("シンプル画像送信システムが初期化されました", "success");
    }
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
          <button class="control-btn glow-btn" onclick="controlPanel.controlCharacter('character${i}', 'scale', 'flying', ${i})">
            大きく
          </button>
          <button class="control-btn shake-btn" onclick="controlPanel.controlCharacter('character${i}', 'shake', 'flying', ${i})">
            震える
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
          <button class="control-btn glow-btn" onclick="controlPanel.controlCharacter('walking-${index + 1}', 'scale', 'walking', ${index + 1})">
            大きく
          </button>
          <button class="control-btn shake-btn" onclick="controlPanel.controlCharacter('walking-${index + 1}', 'shake', 'walking', ${index + 1})">
            震える
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
      console.log("📤 Sent character-hover:", data);
    } else if (action === "scale") {
      this.socket.emit("character-scale", data);
      this.addLog(`${characterId} を大きく (操作者: ${data.operator})`, "success");
      console.log("📤 Sent character-scale:", data);
    } else if (action === "shake") {
      this.socket.emit("character-shake", data);
      this.addLog(`${characterId} を震える (操作者: ${data.operator})`, "success");
      console.log("📤 Sent character-shake:", data);
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

  // Socket通信テスト機能（強化版）
  testSocketConnection() {
    if (!this.isConnected) {
      this.addLog("サーバーに接続されていません", "error");
      return;
    }

    // 複数のテストを実行
    this.runSocketTests();
  }

  // 複数のSocket通信テストを実行
  runSocketTests() {
    const tests = [
      {
        name: "飛行キャラクター1 - 拡大",
        data: {
          character: "character1",
          action: "scale",
          type: "flying",
          id: 1,
          timestamp: Date.now(),
          x: 50,
          y: 50,
          operator: "テスト操作者",
        },
        event: "character-scale",
      },
      {
        name: "歩行キャラクター1 - 震え",
        data: {
          character: "walking-1",
          action: "shake",
          type: "walking",
          id: 1,
          timestamp: Date.now(),
          x: 30,
          y: 80,
          operator: "テスト操作者",
        },
        event: "character-shake",
      },
    ];

    tests.forEach((test, index) => {
      setTimeout(() => {
        this.socket.emit(test.event, test.data);
        this.addLog(`🧪 テスト${index + 1}: ${test.name}`, "success");
        console.log(`🧪 Test ${index + 1} sent:`, test.data);
      }, index * 1000);
    });
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

  // 画像更新処理
  handleImageUpdate(filename) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📸 [${timestamp}] 画像更新: ${filename}`);

    // ログに記録
    this.addLog(`📸 画像更新: ${filename}`, "image-update");

    // 操作パネルの画像を更新
    this.updateControlPanelImage(filename);
  }

  // 操作パネルの画像更新
  updateControlPanelImage(filename) {
    console.log(`🔍 updateControlPanelImage開始: ${filename}`);
    try {
      let targetCard = null;
      let imageElement = null;

      // 飛行キャラクターの場合
      const flyingMatch = filename.match(/^character(\d+)\.(png|gif|jpg|jpeg|webp)$/i);
      console.log(`🔍 飛行キャラクターマッチ結果:`, flyingMatch);
      if (flyingMatch) {
        const characterNum = flyingMatch[1];
        console.log(`🔍 飛行キャラクター番号: ${characterNum}`);
        targetCard = document.getElementById(`flying-character-${characterNum}`);
        console.log(`🔍 対象カード要素:`, targetCard);
        if (targetCard) {
          imageElement = targetCard.querySelector(".character-image");
          console.log(`🔍 画像要素:`, imageElement);
          if (imageElement) {
            // 現在のsrcを記録
            console.log(`🔍 現在のsrc: ${imageElement.src}`);
            // キャッシュバスターを使用して強制リロード
            const cacheBuster = Date.now();
            const newSrc = `images/changeable/flying-characters/character${characterNum}.png?v=${cacheBuster}`;

            // 画像読み込み成功/失敗のイベントリスナーを追加
            imageElement.onload = () => {
              console.log(`✅ 画像読み込み成功: ${newSrc}`);
              // 成功時に追加のログ出力
              this.addLog(`✅ 画像表示更新完了: ${filename}`, "success");
            };
            imageElement.onerror = () => {
              console.log(`❌ 画像読み込み失敗: ${newSrc}`);
            };

            imageElement.src = newSrc;
            console.log(`🔄 飛行キャラ${characterNum}の画像を更新: ${newSrc}`);

            // 更新時刻を表示
            this.addUpdateTimestamp(targetCard, filename);
          } else {
            console.log(`❌ 画像要素が見つかりません`);
          }
        } else {
          console.log(`❌ カード要素が見つかりません: flying-character-${characterNum}`);
        }
      }

      // 歩行キャラクターの場合
      const walkingMatch = filename.match(/^walking-(left|right)-(\d+)\.(png|gif|jpg|jpeg|webp)$/i);
      console.log(`🔍 歩行キャラクターマッチ結果:`, walkingMatch);
      if (walkingMatch) {
        const direction = walkingMatch[1];
        const characterNum = walkingMatch[2];
        console.log(`🔍 歩行キャラクター: ${direction}${characterNum}`);

        // 歩行キャラクターのインデックスを計算
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

        const fileIndex = walkingFiles.indexOf(filename.toLowerCase());
        console.log(`🔍 ファイルインデックス: ${fileIndex} (${filename.toLowerCase()})`);
        if (fileIndex !== -1) {
          const cardIndex = fileIndex + 1;
          console.log(`🔍 カードインデックス: ${cardIndex}`);
          targetCard = document.getElementById(`walking-character-${cardIndex}`);
          console.log(`🔍 対象カード要素:`, targetCard);
          if (targetCard) {
            imageElement = targetCard.querySelector(".character-image");
            console.log(`🔍 画像要素:`, imageElement);
            if (imageElement) {
              // 現在のsrcを記録
              console.log(`🔍 現在のsrc: ${imageElement.src}`);
              // キャッシュバスターを使用して強制リロード
              const cacheBuster = Date.now();
              const newSrc = `images/changeable/walking-characters/${filename}?v=${cacheBuster}`;

              // 画像読み込み成功/失敗のイベントリスナーを追加
              imageElement.onload = () => {
                console.log(`✅ 画像読み込み成功: ${newSrc}`);
                // 成功時に追加のログ出力
                this.addLog(`✅ 画像表示更新完了: ${filename}`, "success");
              };
              imageElement.onerror = () => {
                console.log(`❌ 画像読み込み失敗: ${newSrc}`);
              };

              imageElement.src = newSrc;
              console.log(`🔄 歩行キャラ${direction}${characterNum}の画像を更新: ${newSrc}`);

              // 更新時刻を表示
              this.addUpdateTimestamp(targetCard, filename);
            } else {
              console.log(`❌ 画像要素が見つかりません`);
            }
          } else {
            console.log(`❌ カード要素が見つかりません: walking-character-${cardIndex}`);
          }
        } else {
          console.log(`❌ ファイルがリストに見つかりません: ${filename.toLowerCase()}`);
        }
      }

      // 視覚的フィードバック
      if (targetCard) {
        this.addImageUpdateEffect(targetCard);
      }
    } catch (error) {
      console.error("❌ 画像更新エラー:", error);
      this.addLog(`❌ 画像更新エラー: ${filename}`, "error");
    }
  }

  // 画像更新の視覚的エフェクト
  addImageUpdateEffect(cardElement) {
    // 既存のエフェクトをクリア
    cardElement.classList.remove("image-updated");

    // 少し遅延してからエフェクトを追加（CSSアニメーションのリセット）
    setTimeout(() => {
      cardElement.classList.add("image-updated");

      // 3秒後にエフェクトを削除
      setTimeout(() => {
        cardElement.classList.remove("image-updated");
      }, 3000);
    }, 50);
  }

  // 更新タイムスタンプを追加
  addUpdateTimestamp(cardElement, filename) {
    // 既存のタイムスタンプを削除
    const existingTimestamp = cardElement.querySelector(".update-timestamp");
    if (existingTimestamp) {
      existingTimestamp.remove();
    }

    // 既存のアップロード情報セクションを削除
    const existingUploadInfo = cardElement.querySelector(".upload-info");
    if (existingUploadInfo) {
      existingUploadInfo.remove();
    }

    // アップロード情報セクションを作成
    const uploadInfo = document.createElement("div");
    uploadInfo.className = "upload-info";

    // タイムスタンプ
    const timestamp = document.createElement("div");
    timestamp.className = "update-timestamp permanent";
    timestamp.textContent = `更新: ${new Date().toLocaleTimeString()}`;

    // アップロード画像プレビュー
    const uploadPreview = document.createElement("div");
    uploadPreview.className = "upload-preview";

    const previewImg = document.createElement("img");
    previewImg.className = "upload-preview-image";

    // 画像パスを決定
    let imagePath = "";
    if (filename.startsWith("character")) {
      const num = filename.match(/character(\d+)/)[1];
      imagePath = `images/changeable/flying-characters/character${num}.png`;
    } else if (filename.startsWith("walking-")) {
      imagePath = `images/changeable/walking-characters/${filename}`;
    }

    previewImg.src = `${imagePath}?v=${Date.now()}`;
    previewImg.alt = `アップロード画像: ${filename}`;

    const previewLabel = document.createElement("div");
    previewLabel.className = "upload-preview-label";
    previewLabel.textContent = "アップロード画像";

    uploadPreview.appendChild(previewLabel);
    uploadPreview.appendChild(previewImg);

    // アクティブ状態インジケーター
    const activeIndicator = document.createElement("div");
    activeIndicator.className = "upload-active-indicator";
    activeIndicator.innerHTML = `
      <span class="active-dot"></span>
      <span class="active-text">アクティブ</span>
    `;

    // アップロード情報をまとめる
    uploadInfo.appendChild(timestamp);
    uploadInfo.appendChild(uploadPreview);
    uploadInfo.appendChild(activeIndicator);

    // キャラクターボタンの上に挿入
    const characterButtons = cardElement.querySelector(".character-buttons");
    if (characterButtons) {
      characterButtons.parentNode.insertBefore(uploadInfo, characterButtons);
    }

    // アクティブ状態のアニメーション
    this.startActiveAnimation(activeIndicator);
  }

  // アクティブ状態のアニメーション開始
  startActiveAnimation(indicator) {
    const dot = indicator.querySelector(".active-dot");
    if (dot) {
      dot.style.animation = "activePulse 2s ease-in-out infinite";
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
