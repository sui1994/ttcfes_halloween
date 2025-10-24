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

    // データ永続化設定
    this.persistenceEnabled = true;
    this.storageKeys = {
      logs: "halloween_control_logs",
      characterStatus: "halloween_character_status",
      uploadHistory: "halloween_upload_history",
      binaryUploadHistory: "halloween_binary_upload_history",
      sessionInfo: "halloween_session_info",
    };

    // ページ離脱時の確認
    this.setupBeforeUnloadHandler();

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

    // 保存されたデータを復元
    this.restorePersistedData();

    // WebSocket接続
    this.initWebSocket();

    // キャラクターUI生成
    this.generateCharacterControls();

    // 定期的な状況更新とデータ保存
    setInterval(() => {
      this.refreshStatus();
      this.saveCurrentState();
    }, 2000);

    // 初期状況表示
    setTimeout(() => this.refreshStatus(), 1000);

    this.addLog("コントロールパネル初期化完了", "success");

    // データ永続化機能の通知
    if (this.persistenceEnabled) {
      this.addLog("💾 データ永続化機能が有効です（ログ・状態が保存されます）", "info");
    }
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
    // Base64アップローダー初期化
    if (window.HalloweenImageUploader && this.socket) {
      this.imageUploader = new HalloweenImageUploader(this.socket);

      // グローバルインスタンスも設定（ボタンのonclickで使用）
      window.imageUploader = this.imageUploader;

      this.addLog("Base64画像アップロードシステムが初期化されました", "success");

      // 画像更新コールバックを設定
      console.log(`🔍 Base64画像更新コールバックを設定中...`);
      this.imageUploader.setImageUpdateCallback((filename, thumbnailData) => {
        console.log(`🔍 Base64コールバック受信: ${filename}`, thumbnailData ? "with thumbnail" : "no thumbnail");
        this.handleImageUpdate(filename, thumbnailData);
      });
      console.log(`✅ Base64画像更新コールバック設定完了`);
    }

    // バイナリアップローダー初期化
    if (window.HalloweenBinaryImageUploader && this.socket) {
      this.binaryImageUploader = new HalloweenBinaryImageUploader(this.socket);

      // グローバルインスタンスも設定
      window.binaryImageUploader = this.binaryImageUploader;

      this.addLog("⚡ バイナリ画像アップロードシステムが初期化されました", "success");

      // 画像更新コールバックを設定
      console.log(`🔍 バイナリ画像更新コールバックを設定中...`);
      this.binaryImageUploader.setImageUpdateCallback((filename, thumbnailData) => {
        console.log(`🔍 バイナリコールバック受信: ${filename}`, thumbnailData ? "with thumbnail" : "no thumbnail");
        this.handleImageUpdate(filename, thumbnailData);
      });
      console.log(`✅ バイナリ画像更新コールバック設定完了`);
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

    const timestamp = new Date().toLocaleTimeString();
    const fullTimestamp = new Date().toISOString();

    logEntry.textContent = `${timestamp} - ${message}`;

    // データ属性に完全なタイムスタンプを保存
    logEntry.dataset.timestamp = fullTimestamp;
    logEntry.dataset.message = message;
    logEntry.dataset.type = type;

    this.operationLog.appendChild(logEntry);
    this.operationLog.scrollTop = this.operationLog.scrollHeight;

    // ログ数制限（最新100件まで）
    const logEntries = this.operationLog.querySelectorAll(".log-entry");
    if (logEntries.length > 100) {
      logEntries[0].remove();
    }

    // ログをLocalStorageに保存
    this.saveLogsToStorage();

    console.log(`📋 Log: [${type}] ${message}`);
  }

  generateCharacterControls() {
    // 飛行キャラクター (20体)
    const flyingContainer = document.getElementById("flying-characters");
    console.log("🎮 飛行キャラクター生成開始 - コンテナ:", flyingContainer);

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
      console.log(`✅ 飛行キャラ${i}を生成しました - ID: flying-character-${i}`);

      // 初期状態を設定
      this.characterStatus.flying[i] = { active: false, lastAction: null, operator: null };
    }

    console.log(`🎮 飛行キャラクター生成完了 - 合計20体`);
    console.log("🎮 生成されたキャラクター数:", flyingContainer.children.length);

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

  controlFixedCharacter(characterId, action) {
    if (!this.isConnected) {
      this.addLog("サーバーに接続されていません", "error");
      return;
    }

    // 固定キャラクター専用メッセージで送信
    this.socket.emit("fixed-character-control", {
      characterId: `${characterId}-static`, // bat1-static, bat2-static
      action: action,
      timestamp: Date.now(),
    });

    // ステータス表示を更新
    const statusElement = document.getElementById(`status-${characterId}`);
    if (statusElement) {
      statusElement.textContent = this.getActionDisplayName(action);
      statusElement.className = `character-status active`;
    }

    // カードにアクティブ効果を追加
    const cardElement = document.getElementById(`${characterId}-control`);
    if (cardElement) {
      cardElement.classList.add("character-active");
      setTimeout(() => {
        cardElement.classList.remove("character-active");
      }, 2000);
    }

    this.addLog(`固定キャラクター制御: ${characterId} - ${this.getActionDisplayName(action)}`, "success");
  }

  getActionDisplayName(action) {
    const actionNames = {
      hover: "ホバー中",
      scale: "拡大中",
      shake: "震え中",
    };
    return actionNames[action] || action;
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
  handleImageUpdate(filename, imageData = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📸 [${timestamp}] 画像更新: ${filename}`);

    // ログに記録
    this.addLog(`📸 画像更新: ${filename}`, "image-update");

    // 操作パネルの画像を更新
    this.updateControlPanelImage(filename, imageData);
  }

  // 操作パネルの画像更新
  updateControlPanelImage(filename, imageData = null) {
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

            // 更新時刻を表示（アップロード画像データも渡す）
            this.addUpdateTimestamp(targetCard, filename, imageData);
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

              // 更新時刻を表示（アップロード画像データも渡す）
              this.addUpdateTimestamp(targetCard, filename, imageData);
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
  addUpdateTimestamp(cardElement, filename, imageData = null) {
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

    // 実際のアップロード画像データがある場合はそれを使用、なければファイルパスを使用
    if (imageData) {
      // Base64データまたはBlob URLの場合
      if (typeof imageData === "string" && imageData.startsWith("data:")) {
        previewImg.src = imageData;
        console.log(`🖼️ Base64画像データを使用: ${filename}`);
      } else if (imageData instanceof Blob) {
        previewImg.src = URL.createObjectURL(imageData);
        console.log(`🖼️ Blob画像データを使用: ${filename}`);
      } else {
        // フォールバック: ファイルパスを使用
        this.setPreviewImagePath(previewImg, filename);
      }
    } else {
      // アップロード画像データがない場合はファイルパスを使用
      this.setPreviewImagePath(previewImg, filename);
    }

    previewImg.alt = `アップロード画像: ${filename}`;
    previewImg.onerror = () => {
      console.log(`❌ プレビュー画像読み込み失敗: ${filename}`);
      // エラー時はファイルパスにフォールバック
      this.setPreviewImagePath(previewImg, filename);
    };

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

  // プレビュー画像のパスを設定
  setPreviewImagePath(previewImg, filename) {
    let imagePath = "";
    if (filename.startsWith("character")) {
      const num = filename.match(/character(\d+)/)[1];
      imagePath = `images/changeable/flying-characters/character${num}.png`;
    } else if (filename.startsWith("walking-")) {
      imagePath = `images/changeable/walking-characters/${filename}`;
    }
    previewImg.src = `${imagePath}?v=${Date.now()}`;
    console.log(`🖼️ ファイルパス画像を使用: ${imagePath}`);
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

// アップロード画像表示用CSS
const uploadImageStyles = document.createElement("style");
uploadImageStyles.textContent = `
  /* アップロード情報セクション */
  .upload-info {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin: 10px 0;
    position: relative;
  }

  .update-timestamp.permanent {
    font-size: 11px;
    color: #ffd700;
    margin-bottom: 8px;
    font-weight: bold;
  }

  /* アップロード画像プレビュー */
  .upload-preview {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .upload-preview-label {
    font-size: 12px;
    color: #ccc;
    min-width: 80px;
  }



  /* アクティブ状態インジケーター */
  .upload-active-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }

  .active-dot {
    width: 8px;
    height: 8px;
    background: #4caf50;
    border-radius: 50%;
    display: inline-block;
  }

  .active-text {
    color: #4caf50;
    font-weight: bold;
  }

  /* アクティブ状態のアニメーション */
  @keyframes activePulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.2);
    }
  }

  /* 画像更新エフェクト */
  .character-card.image-updated {
    animation: imageUpdateGlow 3s ease-in-out;
    border: 2px solid #ffd700;
  }

  @keyframes imageUpdateGlow {
    0%, 100% {
      box-shadow: 0 0 0 rgba(255, 215, 0, 0);
    }
    50% {
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
    }
  }

  /* ログエントリーの画像更新タイプ */
  .log-entry.image-update {
    background: rgba(255, 215, 0, 0.1);
    border-left: 3px solid #ffd700;
    color: #ffd700;
  }
`;

document.head.appendChild(uploadImageStyles);

// 初期化
document.addEventListener("DOMContentLoaded", () => {
  window.controlPanel = new HalloweenControlPanel();

  // 容量監視システムを初期化
  window.storageMonitor = new StorageMonitor();
});

// ===== データ永続化機能拡張 =====

// HalloweenControlPanelクラスにデータ永続化メソッドを追加
HalloweenControlPanel.prototype.setupBeforeUnloadHandler = function () {
  window.addEventListener("beforeunload", (e) => {
    // 現在の状態を保存
    this.saveCurrentState();

    // 重要なデータがある場合は確認ダイアログを表示
    if (this.hasImportantData()) {
      e.preventDefault();
      e.returnValue = "アップロードした画像やログが失われる可能性があります。本当にページを離れますか？";
      return e.returnValue;
    }
  });

  // ページ表示時にデータ復元
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      // ブラウザキャッシュから復元された場合
      this.restorePersistedData();
    }
  });
};

// 重要なデータがあるかチェック
HalloweenControlPanel.prototype.hasImportantData = function () {
  const logs = this.operationLog.querySelectorAll(".log-entry");
  const hasLogs = logs.length > 1; // 初期化ログ以外があるか

  const hasUploadHistory = (window.imageUploader && window.imageUploader.uploadHistory.size > 0) || (window.binaryImageUploader && window.binaryImageUploader.uploadHistory.size > 0);

  return hasLogs || hasUploadHistory;
};

// 現在の状態を保存
HalloweenControlPanel.prototype.saveCurrentState = function () {
  if (!this.persistenceEnabled) return;

  try {
    // セッション情報を保存
    const sessionInfo = {
      timestamp: new Date().toISOString(),
      isConnected: this.isConnected,
      displayCount: this.displayCount?.textContent || "0",
      controllerCount: this.controllerCount?.textContent || "0",
    };
    localStorage.setItem(this.storageKeys.sessionInfo, JSON.stringify(sessionInfo));

    // キャラクター状態を保存
    localStorage.setItem(this.storageKeys.characterStatus, JSON.stringify(this.characterStatus));

    // アップロード履歴を保存
    if (window.imageUploader && window.imageUploader.uploadHistory) {
      const uploadHistoryData = Array.from(window.imageUploader.uploadHistory.entries());
      localStorage.setItem(this.storageKeys.uploadHistory, JSON.stringify(uploadHistoryData));
    }

    if (window.binaryImageUploader && window.binaryImageUploader.uploadHistory) {
      const binaryUploadHistoryData = Array.from(window.binaryImageUploader.uploadHistory.entries());
      localStorage.setItem(this.storageKeys.binaryUploadHistory, JSON.stringify(binaryUploadHistoryData));
    }

    console.log("💾 状態を保存しました");
  } catch (error) {
    console.error("❌ 状態保存エラー:", error);
  }
};

// ログをLocalStorageに保存
HalloweenControlPanel.prototype.saveLogsToStorage = function () {
  if (!this.persistenceEnabled) return;

  try {
    const logEntries = Array.from(this.operationLog.querySelectorAll(".log-entry")).map((entry) => ({
      timestamp: entry.dataset.timestamp,
      message: entry.dataset.message,
      type: entry.dataset.type,
      displayTime: entry.textContent,
    }));

    localStorage.setItem(this.storageKeys.logs, JSON.stringify(logEntries));
  } catch (error) {
    console.error("❌ ログ保存エラー:", error);
  }
};

// 保存されたデータを復元
HalloweenControlPanel.prototype.restorePersistedData = function () {
  if (!this.persistenceEnabled) return;

  try {
    // ログを復元
    this.restoreLogs();

    // セッション情報を復元
    this.restoreSessionInfo();

    // キャラクター状態を復元
    this.restoreCharacterStatus();

    // アップロード履歴は各アップローダーの初期化後に復元
    setTimeout(() => {
      this.restoreUploadHistory();
    }, 1000);

    console.log("🔄 保存されたデータを復元しました");
  } catch (error) {
    console.error("❌ データ復元エラー:", error);
  }
};

// ログを復元
HalloweenControlPanel.prototype.restoreLogs = function () {
  try {
    const savedLogs = localStorage.getItem(this.storageKeys.logs);
    if (!savedLogs) return;

    const logEntries = JSON.parse(savedLogs);

    // 既存のログをクリア（初期化メッセージ以外）
    this.operationLog.innerHTML = "";

    // 保存されたログを復元（古い順に追加）
    logEntries.forEach((logData) => {
      const logEntry = document.createElement("div");
      logEntry.className = `log-entry ${logData.type}`;
      logEntry.textContent = logData.displayTime;
      logEntry.dataset.timestamp = logData.timestamp;
      logEntry.dataset.message = logData.message;
      logEntry.dataset.type = logData.type;

      this.operationLog.appendChild(logEntry);
    });

    this.operationLog.scrollTop = this.operationLog.scrollHeight;

    // 復元完了のログを追加
    this.addLog("🔄 前回のログを復元しました", "info");
  } catch (error) {
    console.error("❌ ログ復元エラー:", error);
  }
};

// セッション情報を復元
HalloweenControlPanel.prototype.restoreSessionInfo = function () {
  try {
    const savedSession = localStorage.getItem(this.storageKeys.sessionInfo);
    if (!savedSession) return;

    const sessionInfo = JSON.parse(savedSession);

    // 前回のセッション時刻を表示
    const lastSession = new Date(sessionInfo.timestamp);
    const timeDiff = Math.round((Date.now() - lastSession.getTime()) / 1000);

    let timeText = "";
    if (timeDiff < 60) {
      timeText = `${timeDiff}秒前`;
    } else if (timeDiff < 3600) {
      timeText = `${Math.round(timeDiff / 60)}分前`;
    } else {
      timeText = `${Math.round(timeDiff / 3600)}時間前`;
    }

    this.addLog(`📅 前回のセッション: ${timeText} (${lastSession.toLocaleString()})`, "info");
  } catch (error) {
    console.error("❌ セッション情報復元エラー:", error);
  }
};

// キャラクター状態を復元
HalloweenControlPanel.prototype.restoreCharacterStatus = function () {
  try {
    const savedStatus = localStorage.getItem(this.storageKeys.characterStatus);
    if (!savedStatus) return;

    this.characterStatus = JSON.parse(savedStatus);
    console.log("🎮 キャラクター状態を復元しました");
  } catch (error) {
    console.error("❌ キャラクター状態復元エラー:", error);
  }
};

// アップロード履歴を復元
HalloweenControlPanel.prototype.restoreUploadHistory = function () {
  try {
    // 通常のアップロード履歴を復元
    const savedUploadHistory = localStorage.getItem(this.storageKeys.uploadHistory);
    if (savedUploadHistory && window.imageUploader) {
      const uploadHistoryData = JSON.parse(savedUploadHistory);
      window.imageUploader.uploadHistory = new Map(uploadHistoryData);

      // UI を再構築
      this.rebuildUploadHistoryUI(window.imageUploader, "upload-history");
      this.addLog(`📸 通常アップロード履歴を復元: ${uploadHistoryData.length}件`, "info");
    }

    // バイナリアップロード履歴を復元
    const savedBinaryHistory = localStorage.getItem(this.storageKeys.binaryUploadHistory);
    if (savedBinaryHistory && window.binaryImageUploader) {
      const binaryHistoryData = JSON.parse(savedBinaryHistory);
      window.binaryImageUploader.uploadHistory = new Map(binaryHistoryData);

      // UI を再構築
      this.rebuildUploadHistoryUI(window.binaryImageUploader, "binary-upload-history");
      this.addLog(`⚡ バイナリアップロード履歴を復元: ${binaryHistoryData.length}件`, "info");
    }
  } catch (error) {
    console.error("❌ アップロード履歴復元エラー:", error);
  }
};

// アップロード履歴UIを再構築
HalloweenControlPanel.prototype.rebuildUploadHistoryUI = function (uploader, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !uploader.uploadHistory.size) return;

  // 既存の履歴をクリア
  container.innerHTML = "";

  // 履歴を再構築
  uploader.uploadHistory.forEach((historyData, filename) => {
    uploader.addToUploadHistory(filename, historyData.imageDataUrl, historyData.fileSize, historyData.method);
  });
};

// データ永続化設定の切り替え
HalloweenControlPanel.prototype.togglePersistence = function () {
  this.persistenceEnabled = !this.persistenceEnabled;

  if (this.persistenceEnabled) {
    this.addLog("💾 データ永続化機能を有効にしました", "success");
    this.saveCurrentState();
  } else {
    this.addLog("🚫 データ永続化機能を無効にしました", "warning");
  }

  return this.persistenceEnabled;
};

// 保存されたデータをクリア（完全リセット版）
HalloweenControlPanel.prototype.clearPersistedData = function () {
  if (
    confirm(
      "保存されたすべてのデータ（ログ、履歴、状態）を削除し、画面をリセットしますか？\n\n削除対象:\n• 操作ログ\n• アップロード履歴\n• バイナリアップロード履歴\n• キャラクター状態\n• セッション情報\n\n⚠️ 注意: リセット後、WebSocket接続復旧のため自動でページがリロードされます。"
    )
  ) {
    console.log("🗑️ 完全データリセットを開始...");

    // 1. LocalStorageからすべての保存データを削除
    Object.values(this.storageKeys).forEach((key) => {
      localStorage.removeItem(key);
      console.log(`🗑️ LocalStorage削除: ${key}`);
    });

    // 2. 操作ログをクリア
    this.clearOperationLogs();

    // 3. アップロード履歴をクリア
    this.clearAllUploadHistory();

    // 4. キャラクター状態をリセット
    this.resetCharacterStatus();

    // 5. 接続状況をリセット
    this.resetConnectionStatus();

    // 6. 容量監視をリセット
    if (window.storageMonitor) {
      window.storageMonitor.resetStorageDisplay();
    }

    // 完了メッセージと自動リロード
    setTimeout(() => {
      this.addLog("🗑️ すべてのデータを削除し、システムをリセットしました", "warning");
      this.addLog("🔄 WebSocket接続を復旧するため、3秒後に自動リロードします", "info");

      // カウントダウン表示
      this.showReloadCountdown(3);
    }, 100);

    console.log("✅ 完全データリセット完了");
  }
};

// グローバル関数として公開
window.togglePersistence = function () {
  if (window.controlPanel) {
    return window.controlPanel.togglePersistence();
  }
};

// 操作ログをクリア
HalloweenControlPanel.prototype.clearOperationLogs = function () {
  if (this.operationLog) {
    this.operationLog.innerHTML = "";
    console.log("🗑️ 操作ログをクリア");
  }
};

// すべてのアップロード履歴をクリア
HalloweenControlPanel.prototype.clearAllUploadHistory = function () {
  // 通常のアップロード履歴をクリア
  if (window.imageUploader) {
    window.imageUploader.uploadHistory.clear();
    const historyContainer = document.getElementById("upload-history");
    if (historyContainer) {
      historyContainer.innerHTML = '<div class="no-history-message">まだアップロードされた画像がありません</div>';
    }
    console.log("🗑️ 通常アップロード履歴をクリア");
  }

  // バイナリアップロード履歴をクリア
  if (window.binaryImageUploader) {
    window.binaryImageUploader.uploadHistory.clear();
    const binaryHistoryContainer = document.getElementById("binary-upload-history");
    if (binaryHistoryContainer) {
      binaryHistoryContainer.innerHTML = '<div class="no-history-message">まだアップロードされた画像がありません</div>';
    }
    console.log("🗑️ バイナリアップロード履歴をクリア");
  }
};

// キャラクター状態をリセット
HalloweenControlPanel.prototype.resetCharacterStatus = function () {
  this.characterStatus = {
    flying: {},
    walking: {},
  };

  // キャラクターカードの更新情報をクリア
  const characterCards = document.querySelectorAll(".character-card");
  characterCards.forEach((card) => {
    // 更新タイムスタンプを削除
    const timestamp = card.querySelector(".update-timestamp");
    if (timestamp) {
      timestamp.remove();
    }

    // アップロード情報を削除
    const uploadInfo = card.querySelector(".upload-info");
    if (uploadInfo) {
      uploadInfo.remove();
    }

    // 画像更新エフェクトを削除
    card.classList.remove("image-updated");
  });

  console.log("🗑️ キャラクター状態をリセット");
};

// 接続状況をリセット
HalloweenControlPanel.prototype.resetConnectionStatus = function () {
  if (this.displayCount) {
    this.displayCount.textContent = "0";
  }
  if (this.controllerCount) {
    this.controllerCount.textContent = "0";
  }
  console.log("🗑️ 接続状況をリセット");
};

// リロードカウントダウン表示
HalloweenControlPanel.prototype.showReloadCountdown = function (seconds) {
  // カウントダウン表示用の要素を作成
  const countdownOverlay = document.createElement("div");
  countdownOverlay.id = "reload-countdown-overlay";
  countdownOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    color: white;
    font-family: Arial, sans-serif;
  `;

  const countdownContent = document.createElement("div");
  countdownContent.style.cssText = `
    text-align: center;
    background: rgba(244, 67, 54, 0.9);
    padding: 40px;
    border-radius: 15px;
    border: 3px solid #ff5722;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  `;

  const title = document.createElement("h2");
  title.textContent = "🔄 システムリセット完了";
  title.style.cssText = `
    margin: 0 0 20px 0;
    font-size: 24px;
    color: #fff;
  `;

  const message = document.createElement("p");
  message.textContent = "WebSocket接続を復旧するため、ページを自動リロードします";
  message.style.cssText = `
    margin: 0 0 30px 0;
    font-size: 16px;
    color: #ffcdd2;
  `;

  const countdownDisplay = document.createElement("div");
  countdownDisplay.id = "countdown-number";
  countdownDisplay.style.cssText = `
    font-size: 48px;
    font-weight: bold;
    color: #fff;
    margin: 20px 0;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  `;

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "❌ キャンセル";
  cancelButton.style.cssText = `
    background: #666;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 20px;
    transition: all 0.3s ease;
  `;

  cancelButton.addEventListener("click", () => {
    this.cancelAutoReload();
  });

  cancelButton.addEventListener("mouseenter", () => {
    cancelButton.style.background = "#888";
  });

  cancelButton.addEventListener("mouseleave", () => {
    cancelButton.style.background = "#666";
  });

  countdownContent.appendChild(title);
  countdownContent.appendChild(message);
  countdownContent.appendChild(countdownDisplay);
  countdownContent.appendChild(cancelButton);
  countdownOverlay.appendChild(countdownContent);
  document.body.appendChild(countdownOverlay);

  // カウントダウン開始
  this.startCountdown(seconds);
};

// カウントダウン実行
HalloweenControlPanel.prototype.startCountdown = function (seconds) {
  const countdownDisplay = document.getElementById("countdown-number");
  let remaining = seconds;

  const updateCountdown = () => {
    if (countdownDisplay) {
      countdownDisplay.textContent = remaining;

      // カウントダウンアニメーション
      countdownDisplay.style.transform = "scale(1.2)";
      setTimeout(() => {
        if (countdownDisplay) {
          countdownDisplay.style.transform = "scale(1)";
        }
      }, 200);
    }

    if (remaining <= 0) {
      this.executeAutoReload();
      return;
    }

    remaining--;
    this.countdownTimer = setTimeout(updateCountdown, 1000);
  };

  // 即座に最初の表示を更新
  updateCountdown();
};

// 自動リロード実行
HalloweenControlPanel.prototype.executeAutoReload = function () {
  console.log("🔄 自動リロードを実行中...");

  // WebSocket接続を明示的に切断
  if (this.socket && this.socket.connected) {
    this.socket.disconnect();
  }

  // リロード実行
  window.location.reload();
};

// 自動リロードキャンセル
HalloweenControlPanel.prototype.cancelAutoReload = function () {
  console.log("❌ 自動リロードをキャンセル");

  // カウントダウンタイマーを停止
  if (this.countdownTimer) {
    clearTimeout(this.countdownTimer);
    this.countdownTimer = null;
  }

  // オーバーレイを削除
  const overlay = document.getElementById("reload-countdown-overlay");
  if (overlay) {
    overlay.remove();
  }

  // キャンセルログを追加
  this.addLog("❌ 自動リロードをキャンセルしました", "warning");
  this.addLog("⚠️ WebSocket接続に問題がある場合は手動でリロードしてください", "warning");
};

window.clearPersistedData = function () {
  if (window.controlPanel) {
    window.controlPanel.clearPersistedData();
  }
};
