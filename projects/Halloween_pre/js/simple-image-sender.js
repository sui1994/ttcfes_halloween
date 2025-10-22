/**
 * シンプルな画像送信システム
 * Base64分割送信の代替案
 */

class SimpleImageSender {
  constructor(socket) {
    this.socket = socket;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    console.log("📤 Simple Image Sender initialized");
  }

  // ファイル処理（シンプル版）
  async processFile(file) {
    try {
      console.log(`📤 Processing: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

      // ファイルサイズチェック
      if (file.size > this.maxFileSize) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      }

      // 方法1: Data URL方式（シンプル）
      if (file.size < 2 * 1024 * 1024) {
        // 2MB以下のみ直接送信
        await this.sendAsDataURL(file);
      } else {
        // 方法2: 圧縮してから送信
        await this.sendCompressed(file);
      }
    } catch (error) {
      console.error("❌ Processing failed:", error);
      throw error;
    }
  }

  // Data URL方式（5MB以下）
  async sendAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const dataURL = reader.result;

        const message = {
          type: "image_simple",
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          dataURL: dataURL,
          timestamp: Date.now(),
        };

        console.log(`📤 Sending as Data URL: ${file.name} (${dataURL.length} chars)`);
        this.socket.emit("image-simple", message);
        resolve();
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // 圧縮送信方式（5MB以上）
  async sendCompressed(file) {
    try {
      // Canvas で画像を圧縮
      const compressedFile = await this.compressImage(file);
      console.log(`🗜️ Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);

      // 圧縮後のファイルをData URL方式で送信
      await this.sendAsDataURL(compressedFile);
    } catch (error) {
      console.warn("⚠️ Compression failed, sending original file");
      await this.sendAsDataURL(file);
    }
  }

  // 画像圧縮
  async compressImage(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // 最大サイズを設定（より小さく圧縮）
        const maxWidth = 1024;
        const maxHeight = 1024;

        let { width, height } = img;

        // アスペクト比を保持してリサイズ
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG形式で出力（より高圧縮、品質0.6）
        canvas.toBlob(
          (blob) => {
            // Fileオブジェクトとして返す
            const compressedFile = new File([blob], file.name.replace(/\.(png|gif)$/i, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.6
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// 受信側のシンプル処理
class SimpleImageReceiver {
  constructor() {
    console.log("📥 Simple Image Receiver initialized");
  }

  // シンプル画像受信
  handleSimpleImage(message) {
    try {
      console.log(`📥 Received simple image: ${message.filename} (${(message.size / 1024).toFixed(1)}KB)`);

      // Data URLから直接画像を置換
      this.replaceImage(message.filename, message.dataURL);

      console.log(`✅ Image replaced: ${message.filename}`);
    } catch (error) {
      console.error("❌ Failed to process simple image:", error);
    }
  }

  // 画像置換（既存のロジックを流用）
  replaceImage(filename, dataURL) {
    const targetElements = this.findTargetElements(filename);

    targetElements.forEach((element) => {
      const img = element.querySelector("img");
      if (img) {
        // スムーズな切り替え
        img.style.transition = "opacity 0.3s ease";
        img.style.opacity = "0";

        setTimeout(() => {
          img.src = dataURL;
          img.style.opacity = "1";

          // 置換エフェクト
          this.addReplacementEffect(element);
        }, 300);
      }
    });
  }

  // 対象要素検索（既存のロジックを流用）
  findTargetElements(filename) {
    const elements = [];

    // 飛行キャラクター
    const flyingMatch = filename.match(/character(\d+)\.(png|gif|jpg|jpeg|webp)$/i);
    if (flyingMatch) {
      const num = flyingMatch[1];
      const element = document.querySelector(`.character${num}`);
      if (element) elements.push(element);
    }

    // 歩行キャラクター
    const walkingMatch = filename.match(/walking-(left|right)-(\d+)\.(png|gif|jpg|jpeg|webp)$/i);
    if (walkingMatch) {
      const direction = walkingMatch[1];
      const num = walkingMatch[2];
      const className = num === "1" ? `.walking-${direction}` : `.walking-${direction}-${num}`;
      const element = document.querySelector(className);
      if (element) elements.push(element);
    }

    return elements;
  }

  // 置換エフェクト（簡略版）
  addReplacementEffect(element) {
    element.style.filter = "drop-shadow(0 0 15px #00ff88) brightness(1.2)";
    element.style.transform = "scale(1.05)";
    element.style.transition = "all 0.5s ease";

    setTimeout(() => {
      element.style.filter = "";
      element.style.transform = "";
    }, 2000);
  }
}

// グローバルに公開
window.SimpleImageSender = SimpleImageSender;
window.SimpleImageReceiver = SimpleImageReceiver;
