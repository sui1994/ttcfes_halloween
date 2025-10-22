/**
 * Halloween Control Panel - Image Uploader
 * 操作用サイトでの画像アップロード機能
 */

class HalloweenImageUploader {
  constructor(socket) {
    this.socket = socket;
    this.supportedTypes = ["image/png", "image/gif", "image/jpeg", "image/webp"];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB

    this.init();
    console.log("📤 Halloween Image Uploader initialized");
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
              <button class="upload-btn" id="file-select-btn">ファイルを選択</button><br>
              <button class="upload-btn simple-btn" id="simple-send-btn" style="background: #4caf50; margin-top: 10px;">シンプル送信</button><br>
              <button class="upload-btn chunked-btn" id="chunked-send-btn" style="background: #2196f3; margin-top: 10px;">チャンク分割送信</button>
            </div>
            <div class="upload-info">
              対応形式: PNG, GIF, JPEG, WebP (最大10MB)
            </div>
          </div>
          <input type="file" id="image-input" accept="image/*" multiple style="display: none;">
        </div>
        
        <div class="upload-status" id="upload-status"></div>
        
        <div class="image-targets">
          <h3>📍 置換可能な画像</h3>
          <div class="target-grid" id="target-grid">
            <!-- 動的生成 -->
          </div>
        </div>
      </div>
    `;

    // 特殊操作セクションの後に挿入
    const specialSection = document.querySelector(".special-controls").closest(".control-section");
    specialSection.parentNode.insertBefore(uploadSection, specialSection.nextSibling);

    this.generateTargetGrid();
  }

  // 対象画像グリッド生成
  generateTargetGrid() {
    const targetGrid = document.getElementById("target-grid");
    const targets = [];

    // 飛行キャラクター
    for (let i = 1; i <= 20; i++) {
      targets.push({
        filename: `character${i}.png`,
        displayName: `飛行キャラ${i}`,
        category: "flying",
      });
    }

    // 歩行キャラクター
    const walkingChars = [
      { filename: "walking-left-1.png", displayName: "歩行左1" },
      { filename: "walking-right-1.png", displayName: "歩行右1" },
      { filename: "walking-left-2.png", displayName: "歩行左2" },
      { filename: "walking-right-2.png", displayName: "歩行右2" },
      { filename: "walking-left-3.png", displayName: "歩行左3" },
      { filename: "walking-right-3.png", displayName: "歩行右3" },
      { filename: "walking-left-4.png", displayName: "歩行左4" },
      { filename: "walking-right-4.png", displayName: "歩行右4" },
      { filename: "walking-left-5.png", displayName: "歩行左5" },
      { filename: "walking-right-5.png", displayName: "歩行右5" },
    ];

    targets.push(...walkingChars.map((char) => ({ ...char, category: "walking" })));

    // グリッド生成
    targets.forEach((target) => {
      const targetItem = document.createElement("div");
      targetItem.className = `target-item ${target.category}`;
      targetItem.innerHTML = `
        <div class="target-name">${target.displayName}</div>
        <div class="target-filename">${target.filename}</div>
        <div class="target-status" id="status-${target.filename}">待機中</div>
      `;
      targetGrid.appendChild(targetItem);
    });
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

    // シンプル送信ボタン
    const simpleSendBtn = document.getElementById("simple-send-btn");
    if (simpleSendBtn) {
      simpleSendBtn.addEventListener("click", () => {
        this.openSimpleSend();
      });
    }

    // チャンク分割送信ボタン
    const chunkedSendBtn = document.getElementById("chunked-send-btn");
    if (chunkedSendBtn) {
      chunkedSendBtn.addEventListener("click", () => {
        this.openChunkedUpload();
      });
    }

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
      await this.processFile(file);
    }
  }

  // 個別ファイル処理
  async processFile(file) {
    try {
      // バリデーション
      if (!this.validateFile(file)) {
        return;
      }

      this.updateStatus(`📤 ${file.name} をアップロード中...`, "uploading");

      // ファイルサイズチェック（Base64膨張を考慮）
      const estimatedBase64Size = (file.size * 4) / 3;
      if (estimatedBase64Size > 14 * 1024 * 1024) {
        // 14MB制限（10MB PNG対応）
        this.updateStatus(`❌ ${file.name}: ファイルが大きすぎます (最大: 10MB)`, "error");
        return;
      }

      // ArrayBufferに変換
      const arrayBuffer = await file.arrayBuffer();

      // メタデータ準備
      const metadata = {
        type: "image_replace",
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        timestamp: Date.now(),
      };

      // 分割送信かどうか判定
      if (file.size > 1 * 1024 * 1024) {
        // 1MB以上は分割（10MB対応）
        await this.sendLargeFile(arrayBuffer, metadata);
      } else {
        await this.sendSmallFile(arrayBuffer, metadata);
      }

      // ステータス更新
      this.updateTargetStatus(file.name, "✅ 送信完了", "success");
      this.updateStatus(`✅ ${file.name} を送信しました`, "success");

      console.log(`📤 Image uploaded: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error("❌ File processing error:", error);
      this.updateStatus(`❌ ${file.name} の処理に失敗しました`, "error");
      this.updateTargetStatus(file.name, "❌ エラー", "error");
    }
  }

  // 小さなファイルの送信
  async sendSmallFile(arrayBuffer, metadata) {
    const base64Data = this.arrayBufferToBase64(arrayBuffer);

    const imageMessage = {
      ...metadata,
      data: base64Data,
    };

    console.log("📤 Sending small image:", {
      filename: metadata.filename,
      size: metadata.size,
      base64Length: base64Data.length,
    });

    this.socket.emit("image-replace", imageMessage);
    console.log("📨 Image message sent to server");
  }

  // 大きなファイルの分割送信
  async sendLargeFile(arrayBuffer, metadata) {
    const chunkSize = 512 * 1024; // 512KBずつ分割（10MB対応）
    const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

    console.log(`📦 Sending large file in ${totalChunks} chunks:`, metadata.filename);

    // 分割送信開始通知
    this.socket.emit("image-start", {
      ...metadata,
      totalChunks: totalChunks,
      chunkSize: chunkSize,
    });

    // チャンクごとに送信
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(start, end);
      const base64Chunk = this.arrayBufferToBase64(chunk);

      console.log(`📦 Sending chunk ${i + 1}/${totalChunks}: ${start}-${end} (${chunk.byteLength} bytes) -> ${base64Chunk.length} chars`);

      this.socket.emit("image-chunk", {
        filename: metadata.filename,
        chunkIndex: i,
        totalChunks: totalChunks,
        data: base64Chunk,
      });

      // 進捗更新
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      this.updateStatus(`📤 ${metadata.filename} 送信中... ${progress}%`, "uploading");

      // 少し待機（サーバー負荷軽減）
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 送信完了通知
    this.socket.emit("image-complete", {
      filename: metadata.filename,
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

    // ファイル名チェック（対象画像かどうか）
    if (!this.isValidTargetFilename(file.name)) {
      this.updateStatus(`⚠️ ${file.name}: 対象画像名と一致しません`, "warning");
      // 警告だけで処理は続行
    }

    return true;
  }

  // 対象ファイル名チェック
  isValidTargetFilename(filename) {
    // 飛行キャラクター
    if (/^character\d+\.(png|gif|jpg|jpeg|webp)$/i.test(filename)) {
      return true;
    }

    // 歩行キャラクター
    if (/^walking-(left|right)-\d+\.(png|gif|jpg|jpeg|webp)$/i.test(filename)) {
      return true;
    }

    return false;
  }

  // ステータス更新
  updateStatus(message, type = "info") {
    const statusDiv = document.getElementById("upload-status");
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

  // ArrayBufferをBase64に変換
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // シンプル送信を開く
  openSimpleSend() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          this.updateStatus(`📤 シンプル送信中: ${file.name}`, "uploading");

          // シンプル送信システムを使用
          if (window.controlPanel && window.controlPanel.simpleImageSender) {
            await window.controlPanel.simpleImageSender.processFile(file);
            this.updateStatus(`✅ シンプル送信完了: ${file.name}`, "success");
          } else {
            throw new Error("Simple image sender not available");
          }
        } catch (error) {
          console.error("❌ Simple send failed:", error);
          this.updateStatus(`❌ シンプル送信失敗: ${file.name}`, "error");
        }
      }
    };

    input.click();
  }

  // チャンク分割アップロード（新機能）
  async openChunkedUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          this.updateStatus(`📦 チャンク分割アップロード開始: ${file.name}`, "uploading");

          // WebSocketFileUploaderを使用
          if (!this.fileUploader) {
            this.fileUploader = new WebSocketFileUploader(this.socket);

            // 進捗コールバック設定
            this.fileUploader.setProgressCallback((progress) => {
              this.updateStatus(`📦 アップロード中: ${file.name} (${progress}%)`, "uploading");
            });
          }

          await this.fileUploader.uploadFile(file);
          this.updateStatus(`✅ チャンク分割アップロード完了: ${file.name}`, "success");
          this.updateTargetStatus(file.name, "✅ 送信完了", "success");
        } catch (error) {
          console.error("❌ Chunked upload failed:", error);
          this.updateStatus(`❌ チャンク分割アップロード失敗: ${file.name}`, "error");
          this.updateTargetStatus(file.name, "❌ エラー", "error");
        }
      }
    };

    input.click();
  }

  // 対象ステータス更新
  updateTargetStatus(filename, status, type = "info") {
    const statusElement = document.getElementById(`status-${filename}`);
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `target-status ${type}`;

      // 3秒後に待機中に戻す（成功時）
      if (type === "success") {
        setTimeout(() => {
          statusElement.textContent = "待機中";
          statusElement.className = "target-status";
        }, 3000);
      }
    }
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

  .image-targets h3 {
    margin: 20px 0 10px 0;
    color: #ffd700;
  }

  .target-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    margin-top: 15px;
  }

  .target-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
    border-left: 4px solid #ff6b35;
  }

  .target-item.flying {
    border-left-color: #2196f3;
  }

  .target-item.walking {
    border-left-color: #4caf50;
  }

  .target-name {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 5px;
  }

  .target-filename {
    font-size: 12px;
    color: #ccc;
    margin-bottom: 8px;
    font-family: monospace;
  }

  .target-status {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
  }

  .target-status.success {
    background: rgba(76, 175, 80, 0.3);
    color: #4caf50;
  }

  .target-status.error {
    background: rgba(244, 67, 54, 0.3);
    color: #f44336;
  }
`;

document.head.appendChild(uploadStyles);

// グローバルに公開
window.HalloweenImageUploader = HalloweenImageUploader;
