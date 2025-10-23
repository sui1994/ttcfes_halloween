/**
 * Halloween Control Panel - Image Uploader
 * 操作用サイトでの画像アップロード機能とサムネイル表示
 */

class HalloweenImageUploader {
  constructor(socket) {
    this.socket = socket;
    this.supportedTypes = ["image/png", "image/gif", "image/jpeg", "image/webp"];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.imageUpdateCallback = null; // 画像更新コールバック
    this.uploadHistory = new Map(); // アップロード履歴を管理

    this.init();
    console.log("📤 Halloween Image Uploader initialized with thumbnail support");
  }

  init() {
    this.createUploadInterface();
    this.setupEventListeners();
  }

  // アップロードインターフェース作成
  createUploadInterface() {
    const uploadSection = document.createElement("div");
    uploadSection.className = "control-section";
    uploadSection.innerHTML = `
      <h2 class="section-title">🖼️ 画像置換システム</h2>
      <div class="image-upload-container">
        <div class="upload-area" id="upload-area">
          <div class="upload-content">
            <div class="upload-icon">📁</div>
            <div class="upload-text">
              <strong>画像をドラッグ&ドロップ</strong><br>
              または<br>
              <button class="upload-btn" id="file-select-btn">ファイルを選択</button>
            </div>
            <div class="upload-info">
              対応形式: PNG, GIF, JPEG, WebP (最大10MB)<br>
              <small>アップロードした画像のサムネイルが下に表示されます</small>
            </div>
          </div>
          <input type="file" id="image-input" accept="image/*" multiple style="display: none;">
        </div>
        
        <div class="upload-status" id="upload-status"></div>
        
        <!-- アップロード履歴セクション -->
        <div class="upload-history-section">
          <div class="history-header">
            <h3 class="history-title">📸 アップロード履歴</h3>
            <button class="clear-history-btn" onclick="window.imageUploader.clearAllHistory()">
              🗑️ 履歴をクリア
            </button>
          </div>
          <div class="upload-history" id="upload-history">
            <div class="no-history-message">まだアップロードされた画像がありません</div>
          </div>
        </div>
      </div>
    `;

    // 特殊操作セクションの後に挿入
    const specialSection = document.querySelector(".special-controls").closest(".control-section");
    if (specialSection) {
      specialSection.parentNode.insertBefore(uploadSection, specialSection.nextSibling);
    } else {
      // フォールバック: ログセクションの前に挿入
      const logSection = document.querySelector("#operation-log").closest(".control-section");
      if (logSection) {
        logSection.parentNode.insertBefore(uploadSection, logSection);
      }
    }
  }

  // イベントリスナー設定
  setupEventListeners() {
    const uploadArea = document.getElementById("upload-area");
    const fileInput = document.getElementById("image-input");
    const fileSelectBtn = document.getElementById("file-select-btn");

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
      await this.uploadFile(file);
    }
  }

  // ファイルアップロード処理
  async uploadFile(file) {
    try {
      // バリデーション
      if (!this.validateFile(file)) {
        return;
      }

      this.updateStatus(`📤 ${file.name} をアップロード中...`, "uploading");

      // 大容量画像対応：サムネイルのみ生成・送信
      const thumbnailDataUrl = await this.createThumbnail(file, 150, 150);
      const fullImageDataUrl = await this.readFileAsDataURL(file);

      // サムネイル情報をSocketで送信
      const thumbnailData = {
        filename: file.name,
        thumbnailBase64: thumbnailDataUrl, // 小さなサムネイル
        timestamp: Date.now(),
      };

      this.socket.emit("image-thumbnail", thumbnailData);
      console.log(`📸 サムネイル情報送信: ${file.name}`);

      // フルサイズ画像の送信処理
      const base64Data = fullImageDataUrl.split(",")[1];
      const base64SizeKB = (base64Data.length * 3) / 4 / 1024;

      if (base64SizeKB > 1024) {
        // 1MB以上はチャンク送信
        console.log(`📦 Large file detected (${base64SizeKB.toFixed(1)}KB), using chunked upload`);
        await this.uploadFileChunked(file, fullImageDataUrl);
      } else {
        // 小さなファイルは従来通り一括送信
        console.log(`📤 Small file (${base64SizeKB.toFixed(1)}KB), using direct upload`);
        const fileData = {
          filename: file.name,
          data: fullImageDataUrl,
          mimeType: file.type,
          size: file.size,
        };

        this.socket.emit("image-replace", fileData);
      }

      // ステータス更新
      this.updateStatus(`✅ ${file.name} を送信しました`, "success");

      // アップロード履歴にサムネイル追加（小さなサムネイルのみ保存）
      this.addToUploadHistory(file.name, thumbnailDataUrl, file.size);

      // 画像更新コールバックを呼び出し
      if (this.imageUpdateCallback) {
        this.imageUpdateCallback(file.name, thumbnailDataUrl);
      }

      console.log(`📤 Image uploaded: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error("❌ File processing error:", error);
      this.updateStatus(`❌ ${file.name} の処理に失敗しました`, "error");
    }
  }

  // チャンク送信でファイルアップロード
  async uploadFileChunked(file, imageDataUrl) {
    const base64Data = imageDataUrl.split(",")[1];
    const chunkSize = 64 * 1024; // 64KB chunks
    const totalChunks = Math.ceil(base64Data.length / chunkSize);

    console.log(`📦 Starting chunked upload: ${totalChunks} chunks of ${chunkSize} bytes`);

    // メタデータ送信
    const metadata = {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      totalChunks: totalChunks,
      timestamp: Date.now(),
    };

    this.socket.emit("image-start", metadata);

    // チャンクを順次送信
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, base64Data.length);
      const chunk = base64Data.slice(start, end);

      const chunkData = {
        filename: file.name,
        chunkIndex: i,
        totalChunks: totalChunks,
        data: chunk,
      };

      this.socket.emit("image-chunk", chunkData);

      // 進捗更新
      const progress = (((i + 1) / totalChunks) * 100).toFixed(1);
      this.updateStatus(`📤 ${file.name} 送信中... ${progress}%`, "uploading");

      // 少し待機してサーバーの負荷を軽減
      if (i < totalChunks - 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // 完了通知
    const completeData = {
      filename: file.name,
      timestamp: Date.now(),
    };

    this.socket.emit("image-complete", completeData);
    console.log(`✅ Chunked upload complete: ${file.name}`);
  }

  // ファイルをData URLとして読み込み
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
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
      this.updateStatus(`❌ ${file.name}: ファイルサイズが大きすぎます (最大10MB)`, "error");
      return false;
    }

    return true;
  }

  // ステータス更新
  updateStatus(message, type = "info") {
    const statusDiv = document.getElementById("upload-status");
    if (statusDiv) {
      statusDiv.className = `upload-status ${type}`;
      statusDiv.textContent = message;

      // 5秒後に自動クリア（エラー以外）
      if (type !== "error") {
        setTimeout(() => {
          statusDiv.textContent = "";
          statusDiv.className = "upload-status";
        }, 5000);
      }
    }
  }

  // アップロード履歴にサムネイル追加
  addToUploadHistory(filename, imageDataUrl, fileSize = 0) {
    const historyContainer = document.getElementById("upload-history");

    // 「まだアップロードされた画像がありません」メッセージを削除
    const noHistoryMessage = historyContainer.querySelector(".no-history-message");
    if (noHistoryMessage) {
      noHistoryMessage.remove();
    }

    // 既存の同じファイル名のエントリを削除
    const existingEntry = document.getElementById(`history-${filename}`);
    if (existingEntry) {
      existingEntry.remove();
    }

    // 新しい履歴エントリを作成
    const historyEntry = document.createElement("div");
    historyEntry.className = "history-entry";
    historyEntry.id = `history-${filename}`;

    const timestamp = new Date().toLocaleTimeString();
    const fileSizeText = fileSize > 0 ? ` (${(fileSize / 1024).toFixed(1)}KB)` : "";

    // 履歴データを保存
    this.uploadHistory.set(filename, {
      imageDataUrl,
      timestamp,
      fileSize,
    });

    historyEntry.innerHTML = `
      <div class="history-thumbnail" onclick="window.imageUploader.viewFullImage('${filename}')">
        <img src="${imageDataUrl}" alt="${filename}" class="thumbnail-image">
        <div class="thumbnail-overlay">🔍</div>
      </div>
      <div class="history-info">
        <div class="history-filename">${filename}${fileSizeText}</div>
        <div class="history-timestamp">アップロード: ${timestamp}</div>
        <div class="history-status">✅ 送信完了</div>
      </div>
      <div class="history-actions">
        <button class="history-btn view-btn" onclick="window.imageUploader.viewFullImage('${filename}')">
          👁️ 表示
        </button>
        <button class="history-btn delete-btn" onclick="window.imageUploader.removeFromHistory('${filename}')">
          🗑️ 削除
        </button>
      </div>
    `;

    // 最新のものを上に追加
    historyContainer.insertBefore(historyEntry, historyContainer.firstChild);

    console.log(`📸 履歴に追加: ${filename}`);
  }

  // 履歴から削除
  removeFromHistory(filename) {
    const historyEntry = document.getElementById(`history-${filename}`);
    if (historyEntry) {
      historyEntry.remove();
      this.uploadHistory.delete(filename);
      console.log(`🗑️ 履歴から削除: ${filename}`);

      // 履歴が空になった場合はメッセージを表示
      const historyContainer = document.getElementById("upload-history");
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
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn secondary-btn" onclick="window.imageUploader.downloadImage('${filename}')">
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
      const historyContainer = document.getElementById("upload-history");
      historyContainer.innerHTML = '<div class="no-history-message">まだアップロードされた画像がありません</div>';

      this.uploadHistory.clear();

      console.log(`🗑️ 全履歴をクリア: ${count}件`);
      this.updateStatus(`✅ ${count}件の履歴を削除しました`, "success");
    }
  }

  // 大容量画像対応：小さなサムネイルを生成
  createThumbnail(file, maxWidth = 150, maxHeight = 150, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // アスペクト比を保持してリサイズ
        const { width, height } = this.calculateThumbnailSize(img.width, img.height, maxWidth, maxHeight);

        canvas.width = width;
        canvas.height = height;

        // 高品質リサイズ
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // 小さなJPEGとして出力（容量削減）
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", quality);

        const originalSize = file.size;
        const thumbnailSize = thumbnailDataUrl.length * 0.75;
        const compressionRatio = (((originalSize - thumbnailSize) / originalSize) * 100).toFixed(1);

        console.log(`🖼️ サムネイル生成: ${file.name}`);
        console.log(`📊 元サイズ: ${(originalSize / 1024).toFixed(1)}KB → サムネイル: ${(thumbnailSize / 1024).toFixed(1)}KB (${compressionRatio}%削減)`);

        resolve(thumbnailDataUrl);
      };

      img.onerror = () => {
        console.warn(`⚠️ サムネイル生成失敗: ${file.name}, フルサイズを使用`);
        this.readFileAsDataURL(file).then(resolve).catch(reject);
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // サムネイルサイズを計算（アスペクト比保持）
  calculateThumbnailSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  // 画像更新コールバック設定
  setImageUpdateCallback(callback) {
    this.imageUpdateCallback = callback;
  }
}

// CSS追加
const uploadStyles = document.createElement("style");
uploadStyles.textContent = `
  .image-upload-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 20px;
    margin-top: 10px;
  }

  .upload-area {
    border: 2px dashed #ff6b35;
    border-radius: 10px;
    padding: 40px 20px;
    text-align: center;
    background: rgba(255, 107, 53, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .upload-area:hover, .upload-area.drag-over {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
    transform: scale(1.02);
  }

  .upload-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }

  .upload-text {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .upload-btn {
    background: #ff6b35;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    margin: 10px 0;
  }

  .upload-btn:hover {
    background: #e55a2b;
  }

  .upload-info {
    font-size: 12px;
    color: #ccc;
  }

  .upload-status {
    margin: 15px 0;
    padding: 10px;
    border-radius: 5px;
    text-align: center;
    font-weight: bold;
  }

  .upload-status.success {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }

  .upload-status.error {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }

  .upload-status.warning {
    background: rgba(255, 193, 7, 0.2);
    color: #ffc107;
  }

  .upload-status.uploading {
    background: rgba(33, 150, 243, 0.2);
    color: #2196f3;
  }

  /* アップロード履歴スタイル */
  .upload-history-section {
    margin-top: 20px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .history-title {
    font-size: 16px;
    font-weight: bold;
    color: #ffd700;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }

  .clear-history-btn {
    background: #f44336;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;
  }

  .clear-history-btn:hover {
    background: #d32f2f;
    transform: scale(1.05);
  }

  .upload-history {
    max-height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .no-history-message {
    text-align: center;
    color: #888;
    font-style: italic;
    padding: 20px;
  }

  .history-entry {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .history-entry:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  .history-thumbnail {
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
  }

  .thumbnail-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }

  .thumbnail-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .history-thumbnail:hover .thumbnail-image {
    border-color: #ffd700;
    transform: scale(1.05);
    filter: brightness(0.8);
  }

  .history-thumbnail:hover .thumbnail-overlay {
    opacity: 1;
  }

  .history-info {
    flex-grow: 1;
    min-width: 0;
  }

  .history-filename {
    font-weight: bold;
    font-size: 14px;
    color: #fff;
    margin-bottom: 4px;
    word-break: break-all;
  }

  .history-timestamp {
    font-size: 12px;
    color: #ccc;
    margin-bottom: 4px;
  }

  .history-status {
    font-size: 11px;
    color: #4caf50;
    font-weight: bold;
  }

  .history-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .history-btn {
    padding: 6px 10px;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;
  }

  .view-btn {
    background: #2196f3;
    color: white;
  }

  .view-btn:hover {
    background: #1976d2;
    transform: scale(1.05);
  }

  .delete-btn {
    background: #f44336;
    color: white;
  }

  .delete-btn:hover {
    background: #d32f2f;
    transform: scale(1.05);
  }

  /* モーダルスタイル */
  .image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    cursor: pointer;
  }

  .modal-content {
    position: relative;
    background: #2a2a2a;
    border-radius: 12px;
    max-width: 95vw;
    max-height: 95vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    animation: modalFadeIn 0.3s ease-out;
  }

  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: #333;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-header h3 {
    margin: 0;
    color: #ffd700;
    font-size: 16px;
  }

  .modal-close {
    background: none;
    border: none;
    color: #ccc;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .modal-body {
    padding: 20px;
    text-align: center;
  }

  .modal-image {
    max-width: 100%;
    max-height: 65vh;
    object-fit: contain;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .modal-image:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  }

  .modal-info {
    margin-top: 15px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    font-size: 12px;
    color: #ccc;
  }

  .modal-info p {
    margin: 5px 0;
  }

  .modal-footer {
    padding: 15px 20px;
    background: #333;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .modal-btn {
    background: #ff6b35;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    flex: 1;
    max-width: 150px;
  }

  .modal-btn:hover {
    background: #e55a2b;
    transform: scale(1.05);
  }

  .modal-btn.secondary-btn {
    background: #2196f3;
  }

  .modal-btn.secondary-btn:hover {
    background: #1976d2;
  }

  /* スクロールバーのスタイル */
  .upload-history::-webkit-scrollbar {
    width: 6px;
  }

  .upload-history::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .upload-history::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  .upload-history::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

document.head.appendChild(uploadStyles);

// グローバルに公開
window.HalloweenImageUploader = HalloweenImageUploader;
window.imageUploader = null;
