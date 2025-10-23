/**
 * LocalStorage容量監視システム
 */

class StorageMonitor {
  constructor() {
    this.maxSafeSize = 1 * 1024 * 1024; // 1MB安全制限（大容量WebSocket対応）
    this.warningSize = 512 * 1024; // 512KB警告
    this.criticalSize = 1.5 * 1024 * 1024; // 1.5MB緊急制限
    this.init();
  }

  init() {
    // 定期的な容量チェック
    setInterval(() => {
      this.checkStorageUsage();
    }, 30000); // 30秒ごと

    // 初回チェック
    this.checkStorageUsage();
  }

  // 現在の使用量を計算
  getCurrentUsage() {
    let totalSize = 0;
    const breakdown = {};

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length;
        totalSize += size;

        // キー別の使用量
        if (key.startsWith("halloween_")) {
          breakdown[key] = size;
        }
      }
    }

    return {
      total: totalSize,
      breakdown: breakdown,
      percentage: (totalSize / this.maxSafeSize) * 100,
    };
  }

  // 使用量をチェックして警告
  checkStorageUsage() {
    const usage = this.getCurrentUsage();

    console.log(`💾 LocalStorage使用量: ${(usage.total / 1024).toFixed(1)}KB (${usage.percentage.toFixed(1)}%)`);

    // 警告レベルの判定（大容量WebSocket対応）
    if (usage.total > this.criticalSize) {
      this.showStorageAlert("critical", usage);
    } else if (usage.total > this.maxSafeSize) {
      this.showStorageAlert("danger", usage);
    } else if (usage.total > this.warningSize) {
      this.showStorageAlert("warning", usage);
    }

    // UIに使用量を表示
    this.updateStorageDisplay(usage);
  }

  // 容量警告を表示
  showStorageAlert(level, usage) {
    let message = "";
    let logLevel = "warning";

    switch (level) {
      case "critical":
        message = `🚨 LocalStorage容量が危険レベルです！ (${(usage.total / 1024).toFixed(1)}KB) 強制クリーンアップを実行します`;
        logLevel = "error";
        break;
      case "danger":
        message = `⚠️ LocalStorage容量が限界です！ (${(usage.total / 1024).toFixed(1)}KB)`;
        logLevel = "error";
        break;
      case "warning":
        message = `📊 LocalStorage使用量が多くなっています (${(usage.total / 1024).toFixed(1)}KB)`;
        logLevel = "warning";
        break;
    }

    if (window.controlPanel) {
      window.controlPanel.addLog(message, logLevel);
    }

    // レベル別の対応
    if (level === "critical") {
      // 緊急レベル：自動で強制クリーンアップ
      this.forceCleanup();
    } else if (level === "danger") {
      // 危険レベル：確認後クリーンアップ
      if (confirm("LocalStorage容量が不足しています。古いデータを削除しますか？")) {
        this.autoCleanup();
      }
    }
  }

  // 自動クリーンアップ
  autoCleanup() {
    const usage = this.getCurrentUsage();
    let cleanedSize = 0;

    // 1. 古いログを削除（7日以上前）
    const logs = JSON.parse(localStorage.getItem("halloween_control_logs") || "[]");
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter((log) => new Date(log.timestamp).getTime() > weekAgo);

    if (recentLogs.length < logs.length) {
      localStorage.setItem("halloween_control_logs", JSON.stringify(recentLogs));
      cleanedSize += (logs.length - recentLogs.length) * 100; // 概算
    }

    // 2. 古いアップロード履歴を削除（最新10件のみ保持）
    this.cleanupUploadHistory("halloween_upload_history", 10);
    this.cleanupUploadHistory("halloween_binary_upload_history", 10);

    const newUsage = this.getCurrentUsage();
    const savedSize = usage.total - newUsage.total;

    if (window.controlPanel) {
      window.controlPanel.addLog(`🧹 自動クリーンアップ完了: ${(savedSize / 1024).toFixed(1)}KB削減`, "success");
    }
  }

  // アップロード履歴のクリーンアップ
  cleanupUploadHistory(key, keepCount) {
    try {
      const historyData = JSON.parse(localStorage.getItem(key) || "[]");
      if (historyData.length > keepCount) {
        // 最新のもののみ保持（タイムスタンプでソート）
        const sortedHistory = historyData.sort((a, b) => new Date(b[1].timestamp || 0).getTime() - new Date(a[1].timestamp || 0).getTime());
        const trimmedHistory = sortedHistory.slice(0, keepCount);
        localStorage.setItem(key, JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error(`❌ ${key}のクリーンアップエラー:`, error);
    }
  }

  // UI に使用量を表示
  updateStorageDisplay(usage) {
    // 既存の表示を更新または新規作成
    let storageDisplay = document.getElementById("storage-usage-display");

    if (!storageDisplay) {
      storageDisplay = document.createElement("div");
      storageDisplay.id = "storage-usage-display";
      storageDisplay.className = "storage-usage-display";

      // ログセクションの上に挿入
      const logSection = document.querySelector("#operation-log").closest(".control-section");
      if (logSection) {
        logSection.parentNode.insertBefore(storageDisplay, logSection);
      }
    }

    const usageKB = (usage.total / 1024).toFixed(1);
    const maxKB = (this.maxSafeSize / 1024).toFixed(0);
    const percentage = usage.percentage.toFixed(1);

    let statusClass = "safe";
    if (usage.total > this.maxSafeSize) {
      statusClass = "danger";
    } else if (usage.total > this.warningSize) {
      statusClass = "warning";
    }

    storageDisplay.innerHTML = `
      <div class="storage-header">
        <h3>💾 LocalStorage使用量</h3>
        <button class="cleanup-btn" onclick="window.storageMonitor.autoCleanup()">🧹 クリーンアップ</button>
      </div>
      <div class="storage-bar">
        <div class="storage-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
      </div>
      <div class="storage-info">
        <span>${usageKB}KB / ${maxKB}KB (${percentage}%)</span>
      </div>
      <div class="storage-breakdown">
        ${Object.entries(usage.breakdown)
          .map(
            ([key, size]) =>
              `<div class="breakdown-item">
            <span class="breakdown-key">${key.replace("halloween_", "")}</span>
            <span class="breakdown-size">${(size / 1024).toFixed(1)}KB</span>
          </div>`
          )
          .join("")}
      </div>
    `;
  }

  // 手動でストレージをクリア
  clearAllStorage() {
    if (confirm("すべてのLocalStorageデータを削除しますか？")) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("halloween_")) {
          localStorage.removeItem(key);
        }
      });

      if (window.controlPanel) {
        window.controlPanel.addLog("🗑️ すべてのLocalStorageデータを削除しました", "warning");
      }

      this.checkStorageUsage();
    }
  }
}

// CSS スタイル
const storageStyles = document.createElement("style");
storageStyles.textContent = `
  .storage-usage-display {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 15px;
    margin: 10px 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .storage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .storage-header h3 {
    margin: 0;
    color: #ffd700;
    font-size: 16px;
  }

  .cleanup-btn {
    background: #ff9800;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .cleanup-btn:hover {
    background: #f57c00;
    transform: scale(1.05);
  }

  .storage-bar {
    width: 100%;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .storage-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 10px;
  }

  .storage-fill.safe {
    background: linear-gradient(90deg, #4caf50, #66bb6a);
  }

  .storage-fill.warning {
    background: linear-gradient(90deg, #ff9800, #ffb74d);
  }

  .storage-fill.danger {
    background: linear-gradient(90deg, #f44336, #ef5350);
  }

  .storage-info {
    text-align: center;
    font-size: 14px;
    color: #ccc;
    margin-bottom: 10px;
  }

  .storage-breakdown {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
  }

  .breakdown-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    font-size: 12px;
  }

  .breakdown-key {
    color: #ccc;
  }

  .breakdown-size {
    color: #ffd700;
    font-weight: bold;
  }
`;

document.head.appendChild(storageStyles);

// グローバルに公開
window.StorageMonitor = StorageMonitor;

// StorageMonitorクラスにメソッドを追加
StorageMonitor.prototype.forceCleanup = function () {
  const usage = this.getCurrentUsage();

  console.log("🚨 強制クリーンアップを実行中...");

  // 1. アップロード履歴を最新3件のみ保持
  this.cleanupUploadHistory("halloween_upload_history", 3);
  this.cleanupUploadHistory("halloween_binary_upload_history", 3);

  // 2. ログを最新20件のみ保持
  const logs = JSON.parse(localStorage.getItem("halloween_control_logs") || "[]");
  if (logs.length > 20) {
    const recentLogs = logs.slice(-20); // 最新20件
    localStorage.setItem("halloween_control_logs", JSON.stringify(recentLogs));
  }

  // 3. 古いセッション情報を削除
  localStorage.removeItem("halloween_session_info");

  const newUsage = this.getCurrentUsage();
  const savedSize = usage.total - newUsage.total;

  if (window.controlPanel) {
    window.controlPanel.addLog(`🚨 強制クリーンアップ完了: ${(savedSize / 1024).toFixed(1)}KB削減`, "success");
    window.controlPanel.addLog(`💾 現在の使用量: ${(newUsage.total / 1024).toFixed(1)}KB`, "info");
  }

  console.log(`🚨 強制クリーンアップ完了: ${(savedSize / 1024).toFixed(1)}KB削減`);
};

// 容量表示をリセット
StorageMonitor.prototype.resetStorageDisplay = function () {
  const storageDisplay = document.getElementById("storage-usage-display");
  if (storageDisplay) {
    storageDisplay.remove();
  }

  // 使用量を再チェック
  setTimeout(() => {
    this.checkStorageUsage();
  }, 100);

  console.log("🔄 容量表示をリセット");
};
