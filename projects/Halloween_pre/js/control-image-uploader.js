/**
 * Halloween Control Panel - Image Uploader
 * 操作用サイトでの画像アップロード機能
 */

class HalloweenImageUploader {
  constructor(socket) {
    this.socket = socket;
    this.supportedTypes = ["image/png", "image/gif", "image/jpeg", "image/webp"];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.imageUpdateCallback = null; // 画像更新コールバック

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
              <button class="upload-btn" id="file-select-btn">ファイルを選択</button>
            </div>
            <div class="upload-info">
              対応形式: PNG, GIF, JPEG, WebP (最大10MB)<br>
              <small>大きなファイルは自動的にチャンク分割されます</small>
            </div>
          </div>
          <input type="file" id="image-input" accept="image/*" multiple style="display: none;">
        </div>
        
        <div class="upload-status" id="upload-status"></div>
        
        <div class="target-grid" id="target-grid">
          <!-- 動的生成 -->
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

  // ファイル処理（チャンク分割アップロードを使用）
  async handleFiles(files) {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      await this.uploadWithChunking(file);
    }
  }

  // チャンク分割アップロード処理
  async uploadWithChunking(file) {
    try {
      // バリデーション
      if (!this.validateFile(file)) {
        return;
      }

      this.updateStatus(`📤 ${file.name} をアップロード中...`, "uploading");

      // WebSocketFileUploaderを初期化
      if (!this.fileUploader) {
        this.fileUploader = new WebSocketFileUploader(this.socket);

        // 進捗コールバック設定
        this.fileUploader.setProgressCallback((progress) => {
          this.updateStatus(`📦 アップロード中: ${file.name} (${progress}%)`, "uploading");
        });
      }

      // チャンク分割アップロード実行
      await this.fileUploader.uploadFile(file);

      // ステータス更新
      this.updateTargetStatus(file.name, "✅ 送信完了", "success");
      this.updateStatus(`✅ ${file.name} を送信しました`, "success");

      // 画像更新コールバックを呼び出し
      console.log(`🔍 画像更新コールバック呼び出し: ${file.name}`);
      console.log(`🔍 コールバック関数:`, this.imageUpdateCallback);
      if (this.imageUpdateCallback) {
        console.log(`✅ コールバック実行中...`);
        this.imageUpdateCallback(file.name);
      } else {
        console.log(`❌ コールバックが設定されていません`);
      }

      console.log(`📤 Image uploaded: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error("❌ File processing error:", error);
      this.updateStatus(`❌ ${file.name} の処理に失敗しました`, "error");
      this.updateTargetStatus(file.name, "❌ エラー", "error");
    }
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
