/**
 * Halloween Image Replacer
 * ArrayBuffer方式でPNG/GIF画像をリアルタイム置換
 */

class HalloweenImageReplacer {
  constructor() {
    this.pendingImageData = null;
    this.imageCache = new Map(); // メモリリーク防止用キャッシュ
    this.supportedTypes = ["image/png", "image/gif", "image/jpeg", "image/webp"];

    console.log("🖼️ Halloween Image Replacer initialized");
  }

  // 画像メッセージハンドラー（Base64対応）
  handleImageMessage(imageMessage) {
    try {
      console.log(`📥 Image replace request: ${imageMessage.filename} (${imageMessage.mimeType})`);
      console.log(`📊 Data type: ${typeof imageMessage.data}, Length: ${imageMessage.data ? imageMessage.data.length : "null"}`);

      // データURL形式かBase64文字列かを判定
      let base64Data = imageMessage.data;
      if (typeof base64Data === "string" && base64Data.startsWith("data:")) {
        // データURL形式の場合、Base64部分のみを抽出
        const base64Index = base64Data.indexOf("base64,");
        if (base64Index !== -1) {
          base64Data = base64Data.substring(base64Index + 7);
          console.log(`🔧 Extracted Base64 from data URL, length: ${base64Data.length}`);
        } else {
          console.error("❌ Invalid data URL format");
          return;
        }
      }

      // 空のデータチェック
      if (!base64Data || base64Data.length === 0) {
        console.error("❌ Empty image data received");
        return;
      }

      // Base64をArrayBufferに変換
      const arrayBuffer = this.base64ToArrayBuffer(base64Data);

      // 画像を処理
      this.processImageData(arrayBuffer, imageMessage);
    } catch (error) {
      console.error("❌ Failed to process image message:", error);
      console.log("Debug - imageMessage:", {
        filename: imageMessage.filename,
        mimeType: imageMessage.mimeType,
        dataType: typeof imageMessage.data,
        dataLength: imageMessage.data ? imageMessage.data.length : "null",
        dataSample: imageMessage.data ? imageMessage.data.substring(0, 100) + "..." : "null",
      });
    }
  }

  // Base64をArrayBufferに変換
  base64ToArrayBuffer(base64) {
    try {
      // 基本的なBase64文字列チェック（より緩い検証）
      if (!base64 || typeof base64 !== "string") {
        throw new Error("Invalid Base64 input");
      }

      // 不正文字を除去してから検証
      const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, "");

      // パディング調整
      let paddedBase64 = cleanBase64;
      const padding = paddedBase64.length % 4;
      if (padding === 2) {
        paddedBase64 += "==";
      } else if (padding === 3) {
        paddedBase64 += "=";
      } else if (padding === 1) {
        // 1文字余りは異常なので削除
        paddedBase64 = paddedBase64.slice(0, -1);
      }

      console.log(`🔧 Base64 padding adjusted: ${cleanBase64.length} -> ${paddedBase64.length}`);

      const binaryString = atob(paddedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error("❌ Base64 decode error:", error);
      console.log("Base64 length:", base64.length);
      console.log("Base64 sample:", base64.substring(0, 100) + "...");
      console.log("Base64 end:", "..." + base64.substring(base64.length - 100));

      // 不正文字の検出
      const invalidChars = base64.match(/[^A-Za-z0-9+/=]/g);
      if (invalidChars) {
        console.log("Invalid characters found:", invalidChars.slice(0, 10));
      }

      throw error;
    }
  }

  // ArrayBufferから画像を処理
  processImageData(arrayBuffer, metadata) {
    try {
      // MIMEタイプ検証
      if (!this.supportedTypes.includes(metadata.mimeType)) {
        console.warn(`⚠️ Unsupported image type: ${metadata.mimeType}`);
        return;
      }

      // Blobを作成
      const blob = new Blob([arrayBuffer], { type: metadata.mimeType });
      const imageUrl = URL.createObjectURL(blob);

      // 画像を置換
      this.replaceImage(metadata.filename, imageUrl, metadata.mimeType);

      // 古いURLをクリーンアップ
      this.cleanupOldImage(metadata.filename);

      // 新しいURLをキャッシュ
      this.imageCache.set(metadata.filename, imageUrl);

      console.log(`✅ Image replaced: ${metadata.filename} (${(arrayBuffer.byteLength / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error("❌ Failed to process image data:", error);
    }
  }

  // ArrayBufferを直接処理（最高効率版）
  processImageDataDirect(arrayBuffer, metadata) {
    try {
      console.log(`⚡ Processing binary image directly: ${metadata.filename} (${(arrayBuffer.byteLength / 1024).toFixed(1)}KB)`);

      // MIMEタイプ検証
      if (!this.supportedTypes.includes(metadata.mimeType)) {
        console.warn(`⚠️ Unsupported image type: ${metadata.mimeType}`);
        return;
      }

      // Blobを作成（Base64変換なし）
      const blob = new Blob([arrayBuffer], { type: metadata.mimeType });
      const imageUrl = URL.createObjectURL(blob);

      // 画像を置換
      this.replaceImage(metadata.filename, imageUrl, metadata.mimeType);

      // 古いURLをクリーンアップ
      this.cleanupOldImage(metadata.filename);

      // 新しいURLをキャッシュ
      this.imageCache.set(metadata.filename, imageUrl);

      console.log(`⚡ Binary image replaced directly: ${metadata.filename} (${(arrayBuffer.byteLength / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error("❌ Failed to process binary image data:", error);
    }
  }

  // 画像を実際に置換
  replaceImage(filename, imageUrl, mimeType) {
    // ファイル名から対象要素を特定
    const targetElements = this.findTargetElements(filename);

    if (targetElements.length === 0) {
      console.warn(`⚠️ No target elements found for: ${filename}`);
      return;
    }

    targetElements.forEach((element) => {
      const img = element.querySelector("img");
      if (img) {
        // スムーズな切り替えエフェクト
        img.style.transition = "opacity 0.3s ease";
        img.style.opacity = "0";

        setTimeout(() => {
          img.src = imageUrl;
          img.style.opacity = "1";

          // GIFの場合は特別な処理
          if (mimeType === "image/gif") {
            this.handleGifReplacement(img);
          }

          // 置換エフェクト
          this.addReplacementEffect(element);
        }, 300);
      }
    });
  }

  // ファイル名から対象要素を検索
  findTargetElements(filename) {
    const elements = [];

    // 飛行キャラクター (character1.png → .character1)
    const flyingMatch = filename.match(/character(\d+)\.(png|gif|jpg|jpeg|webp)$/i);
    if (flyingMatch) {
      const num = flyingMatch[1];
      const element = document.querySelector(`.character${num}`);
      if (element) elements.push(element);
    }

    // 歩行キャラクター (walking-left-1.png → .walking-left)
    const walkingMatch = filename.match(/walking-(left|right)-(\d+)\.(png|gif|jpg|jpeg|webp)$/i);
    if (walkingMatch) {
      const direction = walkingMatch[1];
      const num = walkingMatch[2];
      const className = num === "1" ? `.walking-${direction}` : `.walking-${direction}-${num}`;
      const element = document.querySelector(className);
      if (element) elements.push(element);
    }

    // 汎用的な検索（data-image-name属性）
    const genericElements = document.querySelectorAll(`[data-image-name="${filename}"]`);
    elements.push(...genericElements);

    return elements;
  }

  // GIF特有の処理
  handleGifReplacement(imgElement) {
    // GIFアニメーションを確実に開始
    const src = imgElement.src;
    imgElement.src = "";
    setTimeout(() => {
      imgElement.src = src;
    }, 10);

    // GIF置換の視覚的フィードバック
    imgElement.style.filter = "drop-shadow(0 0 10px #ffd700)";
    setTimeout(() => {
      imgElement.style.filter = "";
    }, 2000);
  }

  // 置換エフェクト
  addReplacementEffect(element) {
    // 光るエフェクト
    element.style.filter = "drop-shadow(0 0 15px #00ff88) brightness(1.2)";
    element.style.transform = "scale(1.05)";
    element.style.transition = "all 0.5s ease";

    // パーティクルエフェクト
    this.createReplacementParticles(element);

    // エフェクト削除
    setTimeout(() => {
      element.style.filter = "";
      element.style.transform = "";
    }, 2000);
  }

  // 置換パーティクル
  createReplacementParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 6; i++) {
      const particle = document.createElement("div");
      particle.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: #00ff88;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${centerX}px;
        top: ${centerY}px;
        box-shadow: 0 0 10px #00ff88;
      `;

      document.body.appendChild(particle);

      const angle = (i / 6) * Math.PI * 2;
      const distance = 30 + Math.random() * 30;
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;

      particle.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0)`, opacity: 0 },
        ],
        {
          duration: 1000,
          easing: "ease-out",
        }
      ).onfinish = () => {
        particle.remove();
      };
    }
  }

  // 古い画像URLをクリーンアップ
  cleanupOldImage(filename) {
    const oldUrl = this.imageCache.get(filename);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      console.log(`🗑️ Cleaned up old image URL for: ${filename}`);
    }
  }

  // 全てのキャッシュをクリーンアップ
  cleanup() {
    this.imageCache.forEach((url, filename) => {
      URL.revokeObjectURL(url);
    });
    this.imageCache.clear();
    console.log("🧹 All image cache cleaned up");
  }

  // 大きな画像の分割受信開始
  startLargeImageReceive(metadata) {
    this.largeImageData = {
      metadata: metadata,
      chunks: new Array(metadata.totalChunks),
      receivedChunks: 0,
    };
    console.log(`📦 Starting large image receive: ${metadata.filename} (${metadata.totalChunks} chunks)`);
  }

  // 分割チャンク受信
  receiveLargeImageChunk(chunkData) {
    if (!this.largeImageData) {
      console.error("❌ Received chunk without start signal");
      return;
    }

    // チャンクデータの検証
    if (typeof chunkData.data !== "string") {
      console.error(`❌ Invalid chunk data type: ${typeof chunkData.data}`);
      return;
    }

    // 重複チェック
    if (this.largeImageData.chunks[chunkData.chunkIndex]) {
      console.warn(`⚠️ Duplicate chunk received: ${chunkData.chunkIndex}`);
      return;
    }

    this.largeImageData.chunks[chunkData.chunkIndex] = chunkData.data;
    this.largeImageData.receivedChunks++;

    const progress = Math.round((this.largeImageData.receivedChunks / chunkData.totalChunks) * 100);
    console.log(`📥 Received chunk ${chunkData.chunkIndex + 1}/${chunkData.totalChunks} (${progress}%) - Length: ${chunkData.data.length}`);

    // 各チャンクの先頭をサンプル表示（重複チェック用）
    const sample = chunkData.data.substring(0, 20);
    console.log(`🔍 Chunk ${chunkData.chunkIndex} sample: ${sample}...`);

    // 前のチャンクと同じかチェック
    if (chunkData.chunkIndex > 0 && this.largeImageData.chunks[chunkData.chunkIndex - 1]) {
      const prevSample = this.largeImageData.chunks[chunkData.chunkIndex - 1].substring(0, 20);
      if (sample === prevSample) {
        console.warn(`⚠️ Chunk ${chunkData.chunkIndex} appears to be duplicate of previous chunk!`);
      }
    }
  }

  // 大きな画像の受信完了
  completeLargeImageReceive(completeData) {
    if (!this.largeImageData) {
      console.error("❌ Received complete signal without data");
      return;
    }

    try {
      // 全チャンクを結合
      const combinedBase64 = this.largeImageData.chunks.join("");
      console.log(`🔗 Combined Base64 length: ${combinedBase64.length}`);

      // Base64文字列の検証とクリーンアップ
      const cleanBase64 = combinedBase64.replace(/[^A-Za-z0-9+/=]/g, "");
      console.log(`🧹 Cleaned Base64 length: ${cleanBase64.length}`);

      // 直接デコードを試行
      const arrayBuffer = this.base64ToArrayBuffer(cleanBase64);

      // 画像を処理
      this.processImageData(arrayBuffer, this.largeImageData.metadata);

      // クリーンアップ
      this.largeImageData = null;
      console.log(`✅ Large image processing complete: ${completeData.filename}`);
    } catch (error) {
      console.error("❌ Failed to process large image:", error);
      console.log("Debug info:", {
        totalChunks: this.largeImageData.chunks.length,
        receivedChunks: this.largeImageData.receivedChunks,
        chunks: this.largeImageData.chunks.map((chunk, i) => ({
          index: i,
          length: chunk ? chunk.length : "null",
          sample: chunk ? chunk.substring(0, 20) + "..." : "null",
        })),
      });
      this.largeImageData = null;
    }
  }

  // Base64パディング修正
  fixBase64Padding(base64String) {
    // パディング文字を削除
    let cleaned = base64String.replace(/=+$/, "");

    // 正しいパディングを追加
    const padding = cleaned.length % 4;
    if (padding === 2) {
      cleaned += "==";
    } else if (padding === 3) {
      cleaned += "=";
    }

    return cleaned;
  }

  // デバッグ用：利用可能な画像要素を表示
  listAvailableTargets() {
    const targets = [];

    // 飛行キャラクター
    for (let i = 1; i <= 20; i++) {
      const element = document.querySelector(`.character${i}`);
      if (element) {
        targets.push(`character${i}.png → .character${i}`);
      }
    }

    // 歩行キャラクター
    const walkingSelectors = [
      "walking-left",
      "walking-right",
      "walking-left-2",
      "walking-right-2",
      "walking-left-3",
      "walking-right-3",
      "walking-left-4",
      "walking-right-4",
      "walking-left-5",
      "walking-right-5",
    ];

    walkingSelectors.forEach((selector) => {
      const element = document.querySelector(`.${selector}`);
      if (element) {
        targets.push(`${selector}-1.png → .${selector}`);
      }
    });

    console.log("🎯 Available image targets:", targets);
    return targets;
  }
}

// グローバルに公開
window.HalloweenImageReplacer = HalloweenImageReplacer;
