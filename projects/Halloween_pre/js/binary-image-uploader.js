/**
 * Halloween Control Panel - Binary Image Uploader
 * バイナリデータ直接送信による高効率画像アップロード
 */

class HalloweenBinaryImageUploader {
  constructor(socket) {
    this.socket = socket;
    this.supportedTypes = ["image/png", "image/gif", "image/jpeg", "image/webp"];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.chunkSize = 64 * 1024; // 64KB chunks
    this.imageUpdateCallback = null;
    this.uploadHistory = new Map();
    this.activeUploads = new Map(); // アクティブなアップロードセッション

    this.init();
    console.log("📤 Halloween Binary Image Uploader initialized");
  }

  init() {
    this.createUploadInterface();
    this.setupEventListeners();
    this.setupSocketListeners();
  }

  // Socket.ioイベントリスナー設定
  setupSocketListeners() {
    // アップロード確認応答
    this.socket.on("file-upload-ack", (data) => {
      const session = this.activeUploads.get(data.sessionId);
      if (session) {
        if (data.chunkIndex === -1) {
          console.log(`✅ Metadata acknowledged for ${session.filename}`);
        } else {
          console.log(`✅ Chunk ${data.chunkIndex + 1} acknowledged`);
          session.acknowledgedChunks.add(data.chunkIndex);
        }
      }
    });

    // アップロード完了通知
    this.socket.on("file-upload-complete", (data) => {
      console.log(`🎉 Upload complete: ${data.filename}`);
      this.activeUploads.delete(data.sessionId);
      this.updateStatus(`✅ ${data.filename} のアップロードが完了しました`, "success");
    });

    // アップロードエラー
    this.socket.on("file-upload-error", (error) => {
      console.error("❌ Upload error:", error);
      this.updateStatus(`❌ アップロードエラー: ${error.message}`, "error");
    });
  }

  // アップロードインターフェース作成
  createUploadInterface() {
    const uploadSection = document.createElement("div");
    uploadSection.className = "control-section";
    uploadSection.innerHTML = `
      <h2 class="section-title">🖼️ 高速バイナリ画像アップロード</h2>
      <div class="binary-upload-container">
        <div class="upload-area" id="binary-upload-area">
          <div class="upload-content">
            <div class="upload-icon">⚡</div>
            <div class="upload-text">
              <strong>バイナリ直接送信モード</strong><br>
              画像をドラッグ&ドロップ または<br>
              <button class="upload-btn" id="binary-file-select-btn">ファイルを選択</button>
            </div>
            <div class="upload-info">
              対応形式: PNG, GIF, JPEG, WebP (最大50MB)<br>
              <small>Base64エンコードなしで高速転送</small>
            </div>
          </div>
          <input type="file" id="binary-image-input" accept="image/*" multiple style="display: none;">
        </div>
        
        <div class="upload-progress" id="binary-upload-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" id="binary-progress-fill"></div>
          </div>
          <div class="progress-text" id="binary-progress-text">0%</div>
        </div>
        
        <div class="upload-status" id="binary-upload-status"></div>
        
        <!-- アップロード履歴セクション -->
        <div class="upload-history-section">
          <div class="history-header">
            <h3 class="history-title">📸 バイナリアップロード履歴</h3>
            <button class="clear-history-btn" onclick="window.binaryImageUploader.clearAllHistory()">
              🗑️ 履歴をクリア
            </button>
          </div>
          <div class="upload-history" id="binary-upload-history">
            <div class="no-history-message">まだアップロードされた画像がありません</div>
          </div>
        </div>
      </div>
    `;

    // 既存の画像アップロードセクションの後に挿入
    const existingUpload = document.querySelector(".image-upload-container");
    if (existingUpload) {
      const parentSection = existingUpload.closest(".control-section");
      parentSection.parentNode.insertBefore(uploadSection, parentSection.nextSibling);
    } else {
      // フォールバック: 特殊操作セクションの後に挿入
      const specialSection = document.querySelector(".special-controls").closest(".control-section");
      if (specialSection) {
        specialSection.parentNode.insertBefore(uploadSection, specialSection.nextSibling);
      }
    }
  }

  // イベントリスナー設定
  setupEventListeners() {
    const uploadArea = document.getElementById("binary-upload-area");
    const fileInput = document.getElementById("binary-image-input");
    const fileSelectBtn = document.getElementById("binary-file-select-btn");

    // ファイル選択ボタン
    fileSelectBtn.addEventListener("click", () => {
      fileInput.click();
    });

    // ファイル選択
    fileInput.addEventListener("change", (e) => {
      this.handleFiles(e.target.files);
    });

    // ドラッグ&ドロップ
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("drag-over");
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("drag-over");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("drag-over");
      this.handleFiles(e.dataTransfer.files);
    });
  }

  // ファイル処理
  async handleFiles(files) {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      await this.uploadFileBinary(file);
    }
  }

  // バイナリファイルアップロード処理
  async uploadFileBinary(file) {
    try {
      // バリデーション
      if (!this.validateFile(file)) {
        return;
      }

      const sessionId = this.generateSessionId();
      console.log(`🚀 Starting binary upload: ${file.name} (Session: ${sessionId})`);

      this.updateStatus(`📤 ${file.name} をバイナリ送信中...`, "uploading");
      this.showProgress(0);

      // セッション情報を保存
      const session = {
        sessionId,
        filename: file.name,
        filesize: file.size,
        mimeType: file.type,
        totalChunks: Math.ceil(file.size / this.chunkSize),
        acknowledgedChunks: new Set(),
        startTime: Date.now(),
      };

      this.activeUploads.set(sessionId, session);

      // メタデータ送信
      const metadata = {
        sessionId,
        filename: file.name,
        filesize: file.size,
        mimeType: file.type,
        totalChunks: session.totalChunks,
        chunkSize: this.chunkSize,
        timestamp: Date.now(),
      };

      this.socket.emit("file-upload-metadata", metadata);
      console.log(`📋 Metadata sent: ${session.totalChunks} chunks of ${this.chunkSize} bytes`);

      // ファイルをArrayBufferとして読み込み
      const arrayBuffer = await this.readFileAsArrayBuffer(file);

      // チャンクを順次送信
      for (let i = 0; i < session.totalChunks; i++) {
        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, arrayBuffer.byteLength);
        const chunkData = arrayBuffer.slice(start, end);

        // メタデータとチャンクデータを結合
        const chunkMetadata = {
          sessionId,
          filename: file.name,
          chunkIndex: i,
          totalChunks: session.totalChunks,
        };

        const metadataString = JSON.stringify(chunkMetadata);
        const metadataBytes = new TextEncoder().encode(metadataString);
        const delimiter = new TextEncoder().encode("|||");

        // メタデータ + 区切り文字 + チャンクデータ
        const combinedData = new Uint8Array(metadataBytes.length + delimiter.length + chunkData.byteLength);
        combinedData.set(metadataBytes, 0);
        combinedData.set(delimiter, metadataBytes.length);
        combinedData.set(new Uint8Array(chunkData), metadataBytes.length + delimiter.length);

        // バイナリデータとして送信
        this.socket.emit("file-upload-chunk", combinedData.buffer);

        // 進捗更新
        const progress = ((i + 1) / session.totalChunks) * 100;
        this.showProgress(progress);
        this.updateStatus(`📤 ${file.name} 送信中... ${progress.toFixed(1)}%`, "uploading");

        console.log(`📦 Chunk ${i + 1}/${session.totalChunks} sent (${chunkData.byteLength} bytes)`);

        // サーバー負荷軽減のため少し待機
        if (i < session.totalChunks - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }

      // サムネイル用にBase64データも生成（表示用のみ）
      const thumbnailDataUrl = await this.readFileAsDataURL(file);

      // アップロード履歴に追加
      this.addToUploadHistory(file.name, thumbnailDataUrl, file.size, "binary");

      const uploadTime = ((Date.now() - session.startTime) / 1000).toFixed(1);
      console.log(`✅ Binary upload completed: ${file.name} in ${uploadTime}s`);
    } catch (error) {
      console.error("❌ Binary upload error:", error);
      this.updateStatus(`❌ ${file.name} のバイナリ送信に失敗しました`, "error");
      this.hideProgress();
    }
  }

  // ファイルをArrayBufferとして読み込み
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  // ファイルをData URLとして読み込み（サムネイル用）
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // セッションID生成
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ファイルバリデーション
  validateFile(file) {
    // ファイルタイプチェック
    if (!this.supportedTypes.includes(file.type)) {
      this.updateStatus(`❌ ${file.name}: サポートされていない形式です`, "error");
      return false;
    }

    // ファイルサイズチェック
    if (file.size > this.maxFileSize) {
      this.updateStatus(`❌ ${file.name}: ファイルサイズが大きすぎます (最大50MB)`, "error");
      return false;
    }

    return true;
  }

  // 進捗表示
  showProgress(percentage) {
    const progressContainer = document.getElementById("binary-upload-progress");
    const progressFill = document.getElementById("binary-progress-fill");
    const progressText = document.getElementById("binary-progress-text");

    progressContainer.style.display = "block";
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage.toFixed(1)}%`;
  }

  // 進捗非表示
  hideProgress() {
    const progressContainer = document.getElementById("binary-upload-progress");
    progressContainer.style.display = "none";
  }

  // ステータス更新
  updateStatus(message, type = "info") {
    const statusDiv = document.getElementById("binary-upload-status");
    if (statusDiv) {
      statusDiv.className = `upload-status ${type}`;
      statusDiv.textContent = message;

      // 5秒後に自動クリア（エラー以外）
      if (type !== "error") {
        setTimeout(() => {
          statusDiv.textContent = "";
          statusDiv.className = "upload-status";
          if (type === "success") {
            this.hideProgress();
          }
        }, 5000);
      }
    }
  }

  // アップロード履歴にサムネイル追加
  addToUploadHistory(filename, imageDataUrl, fileSize = 0, method = "binary") {
    const historyContainer = document.getElementById("binary-upload-history");

    // 「まだアップロードされた画像がありません」メッセージを削除
    const noHistoryMessage = historyContainer.querySelector(".no-history-message");
    if (noHistoryMessage) {
      noHistoryMessage.remove();
    }

    // 既存の同じファイル名のエントリを削除
    const existingEntry = document.getElementById(`binary-history-${filename}`);
    if (existingEntry) {
      existingEntry.remove();
    }

    // 新しい履歴エントリを作成
    const historyEntry = document.createElement("div");
    historyEntry.className = "history-entry";
    historyEntry.id = `binary-history-${filename}`;

    const timestamp = new Date().toLocaleTimeString();
    const fileSizeText = fileSize > 0 ? ` (${(fileSize / 1024).toFixed(1)}KB)` : "";
    const methodBadge = method === "binary" ? "⚡ バイナリ" : "📝 Base64";

    // 履歴データを保存
    this.uploadHistory.set(filename, {
      imageDataUrl,
      timestamp,
      fileSize,
      method,
    });

    historyEntry.innerHTML = `
      <div class="history-thumbnail" onclick="window.binaryImageUploader.viewFullImage('${filename}')">
        <img src="${imageDataUrl}" alt="${filename}" class="thumbnail-image">
        <div class="thumbnail-overlay">🔍</div>
      </div>
      <div class="history-info">
        <div class="history-filename">${filename}${fileSizeText}</div>
        <div class="history-timestamp">アップロード: ${timestamp}</div>
        <div class="history-status">✅ ${methodBadge} 送信完了</div>
      </div>
      <div class="history-actions">
        <button class="history-btn view-btn" onclick="window.binaryImageUploader.viewFullImage('${filename}')">
          👁️ 表示
        </button>
        <button class="history-btn delete-btn" onclick="window.binaryImageUploader.removeFromHistory('${filename}')">
          🗑️ 削除
        </button>
      </div>
    `;

    // 最新のものを上に追加
    historyContainer.insertBefore(historyEntry, historyContainer.firstChild);

    console.log(`📸 履歴に追加: ${filename} (${method})`);
  }

  // 履歴から削除
  removeFromHistory(filename) {
    const historyEntry = document.getElementById(`binary-history-${filename}`);
    if (historyEntry) {
      historyEntry.remove();
      this.uploadHistory.delete(filename);
      console.log(`🗑️ 履歴から削除: ${filename}`);

      // 履歴が空になった場合はメッセージを表示
      const historyContainer = document.getElementById("binary-upload-history");
      if (historyContainer.children.length === 0) {
        historyContainer.innerHTML = '<div class="no-history-message">まだアップロードされた画像がありません</div>';
      }
    }
  }

  // フル画像表示
  viewFullImage(filename) {
    const historyData = this.uploadHistory.get(filename);
    if (!historyData) {
      console.warn(`⚠️ 履歴データが見つかりません: ${filename}`);
      return;
    }

    const imageDataUrl = historyData.imageDataUrl;
    const fileSizeText = historyData.fileSize > 0 ? ` (${(historyData.fileSize / 1024).toFixed(1)}KB)` : "";
    const methodBadge = historyData.method === "binary" ? "⚡ バイナリ送信" : "📝 Base64送信";

    // 既存のモーダルがあれば削除
    const existingModal = document.querySelector(".image-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // モーダルウィンドウを作成
    const modal = document.createElement("div");
    modal.className = "image-modal";
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>📸 ${filename}${fileSizeText}</h3>
          <button class="modal-close" onclick="this.closest('.image-modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <img src="${imageDataUrl}" alt="${filename}" class="modal-image">
          <div class="modal-info">
            <p>アップロード時刻: ${historyData.timestamp}</p>
            <p>ファイルサイズ: ${historyData.fileSize > 0 ? (historyData.fileSize / 1024).toFixed(1) + "KB" : "不明"}</p>
            <p>送信方式: ${methodBadge}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn secondary-btn" onclick="window.binaryImageUploader.downloadImage('${filename}')">
            💾 ダウンロード
          </button>
          <button class="modal-btn" onclick="this.closest('.image-modal').remove()">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ESCキーで閉じる
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);

    console.log(`🖼️ フル画像表示: ${filename}`);
  }

  // 画像ダウンロード
  downloadImage(filename) {
    const historyData = this.uploadHistory.get(filename);
    if (!historyData) {
      console.warn(`⚠️ ダウンロード用データが見つかりません: ${filename}`);
      return;
    }

    const imageDataUrl = historyData.imageDataUrl;
    const link = document.createElement("a");
    link.href = imageDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`💾 画像ダウンロード: ${filename}`);
  }

  // 全履歴をクリア
  clearAllHistory() {
    if (this.uploadHistory.size === 0) {
      console.log(`ℹ️ クリアする履歴がありません`);
      return;
    }

    const count = this.uploadHistory.size;

    if (confirm(`${count}件のアップロード履歴をすべて削除しますか？`)) {
      const historyContainer = document.getElementById("binary-upload-history");
      historyContainer.innerHTML = '<div class="no-history-message">まだアップロードされた画像がありません</div>';

      this.uploadHistory.clear();

      console.log(`🗑️ 全履歴をクリア: ${count}件`);
      this.updateStatus(`✅ ${count}件の履歴を削除しました`, "success");
    }
  }

  // 画像更新コールバック設定
  setImageUpdateCallback(callback) {
    this.imageUpdateCallback = callback;
  }
}

// CSS追加
const binaryUploadStyles = document.createElement("style");
binaryUploadStyles.textContent = `
  .binary-upload-container {
    background: rgba(0, 255, 136, 0.05);
    border-radius: 10px;
    padding: 20px;
    margin-top: 10px;
    border: 1px solid rgba(0, 255, 136, 0.2);
  }

  .binary-upload-container .upload-area {
    border: 2px dashed #00ff88;
    border-radius: 10px;
    padding: 40px 20px;
    text-align: center;
    background: rgba(0, 255, 136, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .binary-upload-container .upload-area:hover,
  .binary-upload-container .upload-area.drag-over {
    border-color: #00ff88;
    background: rgba(0, 255, 136, 0.15);
    transform: scale(1.02);
  }

  .binary-upload-container .upload-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }

  .binary-upload-container .upload-btn {
    background: #00ff88;
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    margin: 10px 0;
    font-weight: bold;
  }

  .binary-upload-container .upload-btn:hover {
    background: #00e577;
  }

  .upload-progress {
    margin: 15px 0;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00ff88, #00e577);
    border-radius: 10px;
    transition: width 0.3s ease;
    width: 0%;
  }

  .progress-text {
    text-align: center;
    font-weight: bold;
    color: #00ff88;
  }

  .binary-upload-container .history-title {
    color: #00ff88;
  }

  .binary-upload-container .history-status {
    color: #00ff88;
  }
`;

document.head.appendChild(binaryUploadStyles);

// グローバルに公開
window.HalloweenBinaryImageUploader = HalloweenBinaryImageUploader;
window.binaryImageUploader = null;
