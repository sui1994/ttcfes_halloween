/**
 * WebSocket File Uploader with Chunking
 * Base64を使わないバイナリチャンク分割アップロード
 */

class WebSocketFileUploader {
  constructor(socket) {
    this.socket = socket;
    this.CHUNK_SIZE = 64 * 1024; // 64KB
    this.sessionId = Date.now().toString(36);
    this.supportedTypes = ["image/png", "image/gif", "image/jpeg", "image/webp"];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB

    this.setupEventListeners();
    console.log("📤 WebSocket File Uploader initialized");
  }

  setupEventListeners() {
    // サーバーからの応答処理
    this.socket.on("file-upload-ack", (response) => {
      this.handleAck(response);
    });

    this.socket.on("file-upload-complete", (response) => {
      console.log("✅ ファイルアップロード完了:", response.filename);
      this.onComplete && this.onComplete(response);
    });

    this.socket.on("file-upload-error", (response) => {
      console.error("❌ アップロードエラー:", response.message);
      this.onError && this.onError(response.message);
    });
  }

  async uploadFile(file) {
    return new Promise(async (resolve, reject) => {
      try {
        this.onComplete = resolve;
        this.onError = reject;

        // バリデーション
        if (!this.validateFile(file)) {
          reject(new Error("ファイルバリデーションエラー"));
          return;
        }

        console.log(`📤 アップロード開始: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

        // ArrayBufferに変換
        const arrayBuffer = await this.readFileAsArrayBuffer(file);
        const totalChunks = Math.ceil(arrayBuffer.byteLength / this.CHUNK_SIZE);

        // セッション初期化
        this.currentChunk = 0;
        this.totalChunks = totalChunks;
        this.arrayBuffer = arrayBuffer;
        this.pendingAck = false;
        this.filename = file.name;

        // メタデータ送信
        const metadata = {
          type: "file-upload-metadata",
          sessionId: this.sessionId,
          filename: file.name,
          filesize: arrayBuffer.byteLength,
          totalChunks: totalChunks,
          mimeType: file.type,
          timestamp: Date.now(),
        };

        console.log(`📋 メタデータ送信: ${totalChunks}チャンクに分割`);
        this.socket.emit("file-upload-metadata", metadata);

        // 最初のチャンク送信
        setTimeout(() => {
          this.sendNextChunk();
        }, 100);
      } catch (error) {
        console.error("❌ アップロード準備エラー:", error);
        reject(error);
      }
    });
  }

  sendNextChunk() {
    if (this.pendingAck || this.currentChunk >= this.totalChunks) {
      return;
    }

    const start = this.currentChunk * this.CHUNK_SIZE;
    const end = Math.min(start + this.CHUNK_SIZE, this.arrayBuffer.byteLength);
    const chunk = this.arrayBuffer.slice(start, end);

    // メタデータとチャンクデータを結合
    const metadataStr =
      JSON.stringify({
        sessionId: this.sessionId,
        chunkIndex: this.currentChunk,
        totalChunks: this.totalChunks,
        filename: this.filename,
      }) + "|||";

    const metadata = new TextEncoder().encode(metadataStr);
    const combined = new Uint8Array(metadata.length + chunk.byteLength);
    combined.set(metadata);
    combined.set(new Uint8Array(chunk), metadata.length);

    console.log(`📦 チャンク送信 ${this.currentChunk + 1}/${this.totalChunks}: ${chunk.byteLength}バイト`);

    // バイナリデータとして送信
    this.socket.emit("file-upload-chunk", combined.buffer);
    this.pendingAck = true;

    // 進捗表示
    const progress = (((this.currentChunk + 1) / this.totalChunks) * 100).toFixed(1);
    console.log(`📊 送信進捗: ${progress}%`);
    this.onProgress && this.onProgress(parseFloat(progress));
  }

  handleAck(response) {
    if (response.sessionId !== this.sessionId) {
      return;
    }

    console.log(`✅ ACK受信: チャンク ${response.chunkIndex + 1}`);
    this.pendingAck = false;

    // メタデータのACK（chunkIndex: -1）の場合は、currentChunkを増やさない
    if (response.chunkIndex >= 0) {
      this.currentChunk++;
    }

    if (this.currentChunk < this.totalChunks) {
      // 次のチャンクを送信（少し遅延を入れる）
      setTimeout(() => {
        this.sendNextChunk();
      }, 50);
    }
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

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // 進捗コールバック設定
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  // 完了コールバック設定
  setCompleteCallback(callback) {
    this.onComplete = callback;
  }

  // エラーコールバック設定
  setErrorCallback(callback) {
    this.onError = callback;
  }
}

// グローバルに公開
window.WebSocketFileUploader = WebSocketFileUploader;
