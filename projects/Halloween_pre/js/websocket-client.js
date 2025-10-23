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

    // 画像置換システム初期化
    this.imageReplacer = new HalloweenImageReplacer();

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
      this.socket.on("disconnect", (reason) => {
        console.log("❌ WebSocket disconnected from server. Reason:", reason);
        this.isConnected = false;
        this.showConnectionStatus(false, reason);

        // 自動再接続が必要な場合のみ手動で再接続
        if (reason === "io server disconnect" || reason === "transport close") {
          this.attemptReconnect();
        }
      });

      // 接続エラーイベント
      this.socket.on("connect_error", (error) => {
        console.error("❌ WebSocket connection error:", error);
        this.showConnectionStatus(false, "Connection error");
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

      // キャラクター拡大受信
      this.socket.on("character-scale", (data) => {
        console.log("🔍 Received scale:", data);
        console.log("🎯 Target character:", data.character);
        this.handleCharacterScale(data);
      });

      // キャラクター震え受信
      this.socket.on("character-shake", (data) => {
        console.log("🌀 Received shake:", data);
        console.log("🎯 Target character:", data.character);
        this.handleCharacterShake(data);
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

      // 高速バイナリ画像受信（最適化版）
      let pendingBinaryImage = null;

      this.socket.on("image-replace-binary-metadata", (metadata) => {
        console.log("⚡ Received binary image metadata:", metadata.filename);
        pendingBinaryImage = metadata;
      });

      this.socket.on("image-replace-binary-data", (arrayBuffer) => {
        if (pendingBinaryImage) {
          console.log("⚡ Received binary image data:", pendingBinaryImage.filename, `(${(arrayBuffer.byteLength / 1024).toFixed(1)}KB)`);

          // ArrayBufferを直接処理（Base64変換なし）
          this.imageReplacer.processImageDataDirect(arrayBuffer, pendingBinaryImage);
          pendingBinaryImage = null;
        }
      });

      // 画像置換受信（Base64対応・フォールバック）
      this.socket.on("image-replace", (imageMessage) => {
        console.log("🖼️ Received image replace:", imageMessage.filename);
        console.log("📊 Image data size:", imageMessage.data ? imageMessage.data.length : "No data");
        console.log("📊 Upload method:", imageMessage.uploadMethod || "standard");
        console.log("📊 Data type:", typeof imageMessage.data);

        // データの先頭をサンプル表示
        if (imageMessage.data && typeof imageMessage.data === "string") {
          const sample = imageMessage.data.substring(0, 50);
          console.log("📊 Data sample:", sample + "...");
        }

        this.imageReplacer.handleImageMessage(imageMessage);
      });

      // シンプル画像受信
      this.socket.on("image-simple", (message) => {
        console.log("📥 Received simple image:", message.filename);
        if (window.SimpleImageReceiver) {
          if (!this.simpleReceiver) {
            this.simpleReceiver = new SimpleImageReceiver();
          }
          this.simpleReceiver.handleSimpleImage(message);
        }
      });

      // 分割画像受信対応
      this.socket.on("image-start", (metadata) => {
        console.log("📦 Receiving large image:", metadata.filename);
        this.imageReplacer.startLargeImageReceive(metadata);
      });

      this.socket.on("image-chunk", (chunkData) => {
        this.imageReplacer.receiveLargeImageChunk(chunkData);
      });

      this.socket.on("image-complete", (completeData) => {
        console.log("✅ Large image complete:", completeData.filename);
        this.imageReplacer.completeLargeImageReceive(completeData);
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

  // キャラクターホバー処理（軽量版）
  handleCharacterHover(data) {
    console.log(`✨ Handling hover for: ${data.character}`);
    const characterElement = this.findCharacterElement(data.character);

    if (characterElement) {
      console.log(`✅ Character element found for hover`);

      // 軽量ホバーエフェクト（アニメーションを停止しない）
      this.addLightGlowEffect(characterElement);

      // 1秒後にエフェクト削除
      setTimeout(() => {
        this.removeLightGlowEffect(characterElement);
      }, 1000);
    } else {
      console.error(`❌ Character element NOT found for hover: ${data.character}`);
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

  // キャラクター拡大処理
  handleCharacterScale(data) {
    console.log(`🔍 Handling scale for: ${data.character}`);
    const characterElement = this.findCharacterElement(data.character);

    if (characterElement) {
      console.log(`✅ Character element found:`, characterElement);

      // 拡大エフェクトを追加
      characterElement.classList.add("remote-scale");

      // 拡大エフェクト
      this.addScaleEffect(characterElement);

      // 効果音再生
      this.playScaleSound();

      // 3秒後にエフェクト削除
      setTimeout(() => {
        characterElement.classList.remove("remote-scale");
        this.removeScaleEffect(characterElement);
      }, 3000);
    } else {
      console.error(`❌ Character element NOT found for: ${data.character}`);
      // 利用可能な要素をデバッグ出力
      this.debugAvailableCharacters();
    }
  }

  // キャラクター震え処理
  handleCharacterShake(data) {
    console.log(`🌀 Handling shake for: ${data.character}`);
    const characterElement = this.findCharacterElement(data.character);

    if (characterElement) {
      console.log(`✅ Character element found:`, characterElement);

      // 震えエフェクトを追加
      characterElement.classList.add("remote-shake");

      // 震えエフェクト
      this.addShakeEffect(characterElement);

      // 効果音再生
      this.playShakeSound();

      // 3秒後にエフェクト削除
      setTimeout(() => {
        characterElement.classList.remove("remote-shake");
        this.removeShakeEffect(characterElement);
      }, 3000);
    } else {
      console.error(`❌ Character element NOT found for: ${data.character}`);
      // 利用可能な要素をデバッグ出力
      this.debugAvailableCharacters();
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
      const walkingSelectors = [
        ".walking-left",
        ".walking-right",
        ".walking-left-2",
        ".walking-right-2",
        ".walking-left-3",
        ".walking-right-3",
        ".walking-left-4",
        ".walking-right-4",
        ".walking-left-5",
        ".walking-right-5",
      ];
      const index = parseInt(characterId.replace("walking-", "")) - 1;
      if (index >= 0 && index < walkingSelectors.length) {
        return document.querySelector(walkingSelectors[index]);
      }
    }

    console.warn(`Character element not found: ${characterId}`);
    return null;
  }

  // デバッグ用：利用可能なキャラクター要素を表示
  debugAvailableCharacters() {
    console.log("🔍 Available character elements:");

    // 飛行キャラクター
    for (let i = 1; i <= 20; i++) {
      const element = document.querySelector(`.character${i}`);
      if (element) {
        console.log(`✅ .character${i} found`);
      } else {
        console.log(`❌ .character${i} NOT found`);
      }
    }

    // 歩行キャラクター
    const walkingSelectors = [
      ".walking-left",
      ".walking-right",
      ".walking-left-2",
      ".walking-right-2",
      ".walking-left-3",
      ".walking-right-3",
      ".walking-left-4",
      ".walking-right-4",
      ".walking-left-5",
      ".walking-right-5",
    ];

    walkingSelectors.forEach((selector, index) => {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ ${selector} found (walking-${index + 1})`);
      } else {
        console.log(`❌ ${selector} NOT found (walking-${index + 1})`);
      }
    });
  }

  // 光るエフェクト追加（7ステップ流れ）
  addGlowEffect(element, pauseAnimation = true) {
    console.log(`✨ Starting glow effect (pause: ${pauseAnimation})`);

    if (pauseAnimation) {
      // Step 1-2: アニメーション一時停止して現在位置を保存
      this.freezeCharacterPosition(element);
    }

    // Step 3: エフェクト適用（1.5秒間）
    element.style.filter = "drop-shadow(0 0 20px #ffd700) brightness(1.3)";

    if (pauseAnimation) {
      element.style.transform = `${element.style.transform} scale(1.1)`.trim();
    }

    element.style.transition = "all 0.3s ease";
    element.style.zIndex = "1000";

    console.log(`✨ Glow effect applied (pause: ${pauseAnimation})`);
  }

  // 軽量光るエフェクト（アニメーションを停止しない）
  addLightGlowEffect(element) {
    console.log(`✨ Adding light glow effect (no animation pause)`);

    // アニメーションを停止せずに、視覚効果のみ追加
    element.style.filter = "drop-shadow(0 0 15px #ffd700) brightness(1.2)";
    element.style.transition = "filter 0.2s ease";
    element.style.zIndex = "999";

    // CSSクラスでも制御
    element.classList.add("light-hover-effect");

    console.log(`✨ Light glow effect applied`);
  }

  // 軽量光るエフェクト削除
  removeLightGlowEffect(element) {
    console.log(`🔄 Removing light glow effect`);

    // エフェクトを削除
    element.style.filter = "";
    element.style.transition = "";
    element.style.zIndex = "";

    // CSSクラスを削除
    element.classList.remove("light-hover-effect");

    console.log(`✅ Light glow effect removed`);
  }

  // 光るエフェクト削除（7ステップ流れ）
  removeGlowEffect(element, wasAnimationPaused = true) {
    console.log(`🔄 Ending glow effect (was paused: ${wasAnimationPaused})`);

    // Step 4: エフェクト終了準備
    element.style.filter = "";
    element.style.transition = "";
    element.style.zIndex = "";

    if (wasAnimationPaused) {
      // Step 5-7: アニメーション復元（現在位置から新しいサイクル開始）
      this.restoreCharacterAnimationSmooth(element);
    }
  }

  // クリックエフェクト追加
  addClickEffect(element) {
    // 現在の位置を取得して固定
    this.freezeCharacterPosition(element);

    element.style.filter = "drop-shadow(0 0 30px #ff6b35) brightness(1.5)";
    element.style.transition = "all 0.5s ease";
    element.style.zIndex = "1000";

    // クリックエフェクト用クラスを追加
    element.classList.add("click-effect-active");
  }

  // クリックエフェクト削除
  removeClickEffect(element) {
    element.style.filter = "";
    element.style.transition = "";
    element.style.zIndex = "";

    // クリックエフェクト用クラスを削除
    element.classList.remove("click-effect-active");

    // 元のアニメーションを復元（現在位置から）
    this.restoreCharacterAnimationSmooth(element);
  }

  // 拡大エフェクト追加（デバッグ強化版）
  addScaleEffect(element) {
    console.log(`🎯 Starting scale effect - 3 seconds pause`);
    console.log(`🔍 Element before effect:`, element);
    console.log(`🔍 Current transform before:`, element.style.transform);

    // アニメーション一時停止して現在位置を保存
    this.freezeCharacterPosition(element);

    // キャラクターを大きくする（枠なし）
    element.style.filter = "drop-shadow(0 0 25px #00ff88) brightness(1.4)";

    // 既存のtransformをクリアしてから新しく設定
    element.style.removeProperty("transform");

    // 少し遅延してから確実に適用
    setTimeout(() => {
      element.style.setProperty("transform", "scale(1.8)", "important");
      console.log(`🔍 Transform set with delay:`, element.style.transform);
    }, 10);

    element.style.transition = "all 0.3s ease";
    element.style.zIndex = "1000";

    console.log(`🔍 Transform after setting:`, element.style.transform);
    console.log(`🔍 Computed style:`, window.getComputedStyle(element).transform);
    console.log(`✨ Scale effect applied - size: 1.8x, duration: 3 seconds, no border`);
  }

  // 拡大エフェクト削除（3秒後に動き再開）
  removeScaleEffect(element) {
    console.log(`🔄 Ending scale effect - resuming movement`);

    // エフェクト終了準備
    element.style.removeProperty("filter");
    element.style.removeProperty("transition");
    element.style.removeProperty("z-index");
    element.style.removeProperty("transform");

    // アニメーション復元（現在位置から動き再開）
    this.restoreCharacterAnimationSmooth(element);

    console.log(`✅ Scale effect ended - movement resumed`);
  }

  // 震えエフェクト追加（修正版）
  addShakeEffect(element) {
    console.log(`🌀 Starting shake effect - 3 seconds pause`);
    console.log(`🔍 Element:`, element.className);

    // アニメーション一時停止して現在位置を保存
    this.freezeCharacterPosition(element);

    // 震えエフェクト適用
    element.style.filter = "drop-shadow(0 0 20px #ff4444) brightness(1.3)";
    element.style.zIndex = "1000";

    // JavaScript で震えアニメーションを実行
    this.startShakeAnimation(element);

    console.log(`🌀 Shake effect applied for 3 seconds`);
  }

  // 震えエフェクト削除（修正版）
  removeShakeEffect(element) {
    console.log(`🔄 Ending shake effect - resuming movement`);

    // 震えアニメーションを停止
    this.stopShakeAnimation(element);

    // エフェクト終了準備
    element.style.removeProperty("filter");
    element.style.removeProperty("z-index");

    // アニメーション復元（現在位置から動き再開）
    this.restoreCharacterAnimationSmooth(element);

    console.log(`✅ Shake effect ended - movement resumed`);
  }

  // キャラクターの現在位置を固定（シンプル版）
  freezeCharacterPosition(element) {
    // 1. 現在のアニメーション状態を保存
    element.dataset.originalAnimationPlayState = element.style.animationPlayState || "running";
    element.dataset.originalTransform = element.style.transform || "";

    // 2. アニメーションを一時停止（現在位置を保持）
    element.style.animationPlayState = "paused";

    console.log(`⏸️ Animation paused - original transform: "${element.dataset.originalTransform}"`);
  }

  // JavaScript による震えアニメーション開始
  startShakeAnimation(element) {
    console.log(`🌀 Starting JavaScript shake animation`);

    // 震えアニメーション用のデータを保存
    element.dataset.shakeInterval = null;
    element.dataset.shakeStartTime = Date.now();

    // 震えアニメーションを実行
    const shakeInterval = setInterval(() => {
      const elapsed = Date.now() - parseInt(element.dataset.shakeStartTime);

      // 3秒経過したら停止
      if (elapsed >= 3000) {
        this.stopShakeAnimation(element);
        return;
      }

      // ランダムな震え（より強く）
      const shakeX = (Math.random() - 0.5) * 12; // -6px to 6px
      const shakeY = (Math.random() - 0.5) * 12; // -6px to 6px

      element.style.setProperty("transform", `translate(${shakeX}px, ${shakeY}px)`, "important");
    }, 40); // 40ms間隔で震え（より細かく）

    element.dataset.shakeInterval = shakeInterval;
    console.log(`🌀 Shake animation started - interval ID: ${shakeInterval}`);
  }

  // JavaScript による震えアニメーション停止
  stopShakeAnimation(element) {
    const intervalId = element.dataset.shakeInterval;

    if (intervalId) {
      clearInterval(parseInt(intervalId));
      delete element.dataset.shakeInterval;
      delete element.dataset.shakeStartTime;
      console.log(`🛑 Shake animation stopped - interval ID: ${intervalId}`);
    }

    // transformをクリア
    element.style.removeProperty("transform");
  }

  // キャラクターのアニメーションを復元
  restoreCharacterAnimation(element) {
    // 保存された情報を復元
    const originalAnimation = element.dataset.originalAnimation;
    const originalLeft = element.dataset.originalLeft;
    const originalTop = element.dataset.originalTop;
    const originalTransform = element.dataset.originalTransform;

    // 現在位置を保持したままアニメーションを再開
    const currentLeft = element.style.left;
    const currentTop = element.style.top;

    // アニメーションの進行度を計算して適切な遅延を設定
    const animationDelay = this.calculateAnimationDelay(element, currentLeft);

    // 元のアニメーションを復元（位置は現在位置から）
    if (originalAnimation && originalAnimation !== "none") {
      // 一時的にアニメーションを無効にして位置を調整
      element.style.animation = "none";

      // 少し遅延してからアニメーションを再開
      setTimeout(() => {
        element.style.animation = originalAnimation;
        // 現在位置から継続するためのアニメーション遅延を設定
        if (animationDelay !== null) {
          element.style.animationDelay = `${animationDelay}s`;
        }
        console.log(`🔄 Animation resumed from current position with delay: ${animationDelay}s`);
      }, 100);
    }

    // 元のスタイルは復元しない（現在位置を維持）
    // element.style.left = originalLeft || "";
    // element.style.top = originalTop || "";
    element.style.transform = originalTransform || "";

    // データ属性をクリア
    delete element.dataset.originalAnimation;
    delete element.dataset.originalLeft;
    delete element.dataset.originalTop;
    delete element.dataset.originalTransform;

    console.log(`🔓 Animation restored from current position: left=${currentLeft}, top=${currentTop}`);
  }

  // シンプルなアニメーション復元（修正版）
  restoreCharacterAnimationSmooth(element) {
    const originalAnimationPlayState = element.dataset.originalAnimationPlayState;
    const originalTransform = element.dataset.originalTransform;

    console.log(`🔄 Restoring animation - original transform: "${originalTransform}"`);
    console.log(`🔄 Original play state: "${originalAnimationPlayState}"`);

    // transformを元に戻す（!importantを削除）
    element.style.removeProperty("transform");
    if (originalTransform) {
      element.style.transform = originalTransform;
    }

    // transitionを削除
    element.style.removeProperty("transition");

    // リフロートリガー
    element.offsetWidth;

    // アニメーションを再開
    setTimeout(() => {
      element.style.animationPlayState = originalAnimationPlayState || "running";
      console.log(`▶️ Animation resumed - play state: ${element.style.animationPlayState}`);
    }, 100);

    // データ属性をクリア
    delete element.dataset.originalAnimationPlayState;
    delete element.dataset.originalTransform;
  }

  // アニメーションの進行度に基づいて適切な遅延を計算
  calculateAnimationDelay(element, currentLeft) {
    try {
      // 現在の左位置から進行度を推定
      const leftValue = parseFloat(currentLeft);
      const viewportWidth = window.innerWidth;

      // 画面幅に対する進行度を計算（0-1の範囲）
      let progress = 0;

      if (leftValue < 0) {
        // まだ画面に入っていない
        progress = 0;
      } else if (leftValue > viewportWidth) {
        // 画面を通り過ぎた
        progress = 1;
      } else {
        // 画面内にいる場合の進行度
        progress = leftValue / viewportWidth;
      }

      // アニメーション時間を取得（デフォルト15秒と仮定）
      const animationDuration = this.getAnimationDuration(element) || 15;

      // 進行度に基づいて負の遅延（既に進んでいる分）を計算
      const delay = -(progress * animationDuration);

      console.log(`📊 Animation progress: ${(progress * 100).toFixed(1)}%, delay: ${delay.toFixed(2)}s`);

      return delay;
    } catch (error) {
      console.warn("Failed to calculate animation delay:", error);
      return 0;
    }
  }

  // 要素のアニメーション時間を取得
  getAnimationDuration(element) {
    try {
      const computedStyle = window.getComputedStyle(element);
      const animationDuration = computedStyle.animationDuration;

      if (animationDuration && animationDuration !== "0s") {
        // "15s" -> 15 に変換
        return parseFloat(animationDuration);
      }

      // クラス名から推定
      const className = element.className;
      if (className.includes("character")) {
        return 15; // デフォルトの飛行キャラクター時間
      } else if (className.includes("walking")) {
        return 20; // デフォルトの歩行キャラクター時間
      }

      return 15; // フォールバック
    } catch (error) {
      console.warn("Failed to get animation duration:", error);
      return 15;
    }
  }

  // 拡大音再生
  playScaleSound() {
    const audio = new Audio("preset_music/happyhalloween.mp3");
    audio.volume = 0.2;
    audio.playbackRate = 0.8; // 少し低めの音
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.log("Scale sound error:", error);
    });
  }

  // 震え音再生
  playShakeSound() {
    const audio = new Audio("preset_music/happyhalloween.mp3");
    audio.volume = 0.25;
    audio.playbackRate = 1.2; // 少し高めの音
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.log("Shake sound error:", error);
    });
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
  
  .remote-scale {
    z-index: 1000;
  }
  
  .remote-shake {
    z-index: 1000;
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
  
  @keyframes scaleGlow {
    0%, 100% { 
      transform: scale(1.5);
      filter: drop-shadow(0 0 25px #00ff88) brightness(1.4);
    }
    50% { 
      transform: scale(1.7);
      filter: drop-shadow(0 0 35px #00ff88) brightness(1.6);
    }
  }
  
  @keyframes continuousShake {
    0%, 100% { transform: translateX(0); }
    2% { transform: translateX(-3px) translateY(1px); }
    4% { transform: translateX(3px) translateY(-1px); }
    6% { transform: translateX(-2px) translateY(2px); }
    8% { transform: translateX(2px) translateY(-2px); }
    10% { transform: translateX(-1px) translateY(1px); }
    12% { transform: translateX(1px) translateY(-1px); }
    14% { transform: translateX(-2px) translateY(0px); }
    16% { transform: translateX(2px) translateY(1px); }
    18% { transform: translateX(-1px) translateY(-1px); }
    20% { transform: translateX(1px) translateY(2px); }
    22% { transform: translateX(-3px) translateY(-1px); }
    24% { transform: translateX(3px) translateY(1px); }
    26% { transform: translateX(-2px) translateY(-2px); }
    28% { transform: translateX(2px) translateY(2px); }
    30% { transform: translateX(-1px) translateY(-1px); }
    32% { transform: translateX(1px) translateY(1px); }
    34% { transform: translateX(-2px) translateY(0px); }
    36% { transform: translateX(2px) translateY(-1px); }
    38% { transform: translateX(-1px) translateY(1px); }
    40% { transform: translateX(1px) translateY(-2px); }
    42% { transform: translateX(-3px) translateY(1px); }
    44% { transform: translateX(3px) translateY(-1px); }
    46% { transform: translateX(-2px) translateY(2px); }
    48% { transform: translateX(2px) translateY(-2px); }
    50% { transform: translateX(-1px) translateY(1px); }
    52% { transform: translateX(1px) translateY(-1px); }
    54% { transform: translateX(-2px) translateY(0px); }
    56% { transform: translateX(2px) translateY(1px); }
    58% { transform: translateX(-1px) translateY(-1px); }
    60% { transform: translateX(1px) translateY(2px); }
    62% { transform: translateX(-3px) translateY(-1px); }
    64% { transform: translateX(3px) translateY(1px); }
    66% { transform: translateX(-2px) translateY(-2px); }
    68% { transform: translateX(2px) translateY(2px); }
    70% { transform: translateX(-1px) translateY(-1px); }
    72% { transform: translateX(1px) translateY(1px); }
    74% { transform: translateX(-2px) translateY(0px); }
    76% { transform: translateX(2px) translateY(-1px); }
    78% { transform: translateX(-1px) translateY(1px); }
    80% { transform: translateX(1px) translateY(-2px); }
    82% { transform: translateX(-2px) translateY(1px); }
    84% { transform: translateX(2px) translateY(-1px); }
    86% { transform: translateX(-1px) translateY(2px); }
    88% { transform: translateX(1px) translateY(-2px); }
    90% { transform: translateX(-1px) translateY(1px); }
    92% { transform: translateX(1px) translateY(-1px); }
    94% { transform: translateX(-1px) translateY(0px); }
    96% { transform: translateX(1px) translateY(1px); }
    98% { transform: translateX(-1px) translateY(-1px); }
  }
  
  /* エフェクト適用時の位置固定用クラス */
  .character-effect-active {
    animation-play-state: paused !important;
  }
  
  .walking-character.character-effect-active {
    animation-play-state: paused !important;
  }
  
  /* 震えエフェクト用クラス */
  .shake-effect-active {
    animation: continuousShake 3s ease-in-out !important;
  }
  
  /* クリックエフェクト用クラス */
  .click-effect-active {
    animation: shake 0.5s ease-in-out !important;
  }
  
  /* 軽量ホバーエフェクト用クラス */
  .light-hover-effect {
    filter: drop-shadow(0 0 15px #ffd700) brightness(1.2) !important;
    transition: filter 0.2s ease !important;
  }
`;
document.head.appendChild(style);

// グローバルに公開
window.HalloweenWebSocketClient = HalloweenWebSocketClient;
