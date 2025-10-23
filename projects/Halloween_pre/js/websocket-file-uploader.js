/**
 * WebSocket File Uploader
 * シンプルなBase64ファイルアップロード機能
 */

class WebSocketFileUploader {
  constructor(socket) {
    this.socket = socket;
    this.supportedTypes = ["image/png", "image/gif", "image/jpeg", "image/webp"];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB

    console.log("📤 WebSocket File Uploader initialized");
  }

  async uploadFile(file) {
    return new Promise(async (resolve, reject) => {
      try {
        // バリデーション
        if (!this.validateFile(file)) {
          reject(new Error("ファイルバリデーションエラー"));
          return;
        }

        console.log(`📤 アップロード開始: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

        // Base64に変換
        const base64Data = await this.readFileAsBase64(file);

        // ファイルデータを送信
        const fileData = {
          filename: file.name,
          data: base64Data,
          mimeType: file.type,
          size: file.size,
          timestamp: Date.now(),
        };

        this.socket.emit("image-replace", fileData);

        console.log(`✅ ファイル送信完了: ${file.name}`);
        resolve(fileData);
      } catch (error) {
        console.error("❌ アップロードエラー:", error);
        reject(error);
      }
    });
  }

  validateFile(file) {
    // ファイルタイプチェック
    if (!this.supportedTypes.includes(file.type)) {
      console.error(`❌ サポートされていない形式: ${file.type}`);
      return false;
    }

    // ファイルサイズチェック
    if (file.size > this.maxFileSize) {
      console.error(`❌ ファイルサイズが大きすぎます: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return false;
    }

    return true;
  }

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 進捗コールバック設定（互換性のため）
  setProgressCallback(callback) {
    this.onProgress = callback;
  }
}

// グローバルに公開
window.WebSocketFileUploader = WebSocketFileUploader;
