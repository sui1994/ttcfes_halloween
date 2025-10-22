# WebSocket チャンク分割アップロード実装

## 概要

Base64 を使わないバイナリチャンク分割による WebSocket ファイルアップロード機能を実装しました。10MB までの大きな PNG 画像に対応し、進捗トラッキング、エラーハンドリング、ACK（確認応答）機能を含む実用的なシステムです。

## 主な特徴

- **バイナリ転送**: Base64 エンコードを使わず、直接バイナリデータを送信
- **チャンク分割**: 64KB ずつ分割して送信（メモリ効率とネットワーク安定性）
- **進捗トラッキング**: リアルタイムでアップロード進捗を表示
- **ACK 機能**: サーバーからの確認後に次のチャンクを送信
- **エラーハンドリング**: 欠損チャンクや不正フォーマットを検出
- **セッション管理**: 複数のアップロードを同時に処理可能

## ファイル構成

### 新規追加ファイル

1. **`js/websocket-file-uploader.js`** - クライアント側チャンク分割アップローダー
2. **`test-chunked-upload.html`** - テスト用ページ

### 更新ファイル

1. **`server.js`** - サーバー側チャンク受信処理を追加
2. **`js/control-image-uploader.js`** - チャンク分割送信ボタンを追加
3. **`control.html`** - 新しいスクリプトを読み込み

## 使用方法

### 1. サーバー起動

```bash
cd Halloween_pre
npm start
```

### 2. テストページでの動作確認

ブラウザで `http://localhost:3000/test-chunked` にアクセス

- ファイルをドラッグ&ドロップまたはクリックで選択
- 進捗バーでアップロード状況を確認
- ログでチャンク送信の詳細を確認

### 3. 操作パネルでの使用

ブラウザで `http://localhost:3000/control` にアクセス

- 画像置換システムセクションの「チャンク分割送信」ボタンを使用
- 10MB までの大きな PNG 画像をアップロード可能

## 技術仕様

### チャンク分割方式

```javascript
// メタデータとバイナリデータの結合
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
```

### サーバー側処理フロー

1. **メタデータ受信** - ファイル情報とセッション作成
2. **チャンク受信** - バイナリデータの分離と保存
3. **ACK 送信** - 各チャンクの受信確認
4. **ファイル結合** - 全チャンク受信後にファイルを復元
5. **Base64 変換** - 既存システムとの互換性のため
6. **画像配信** - 表示画面に画像を送信

### エラーハンドリング

- **ファイルサイズ制限**: 10MB 超過時のエラー
- **フォーマット検証**: サポート外形式の検出
- **チャンク欠損**: 受信チャンクの整合性確認
- **セッション管理**: 不正なセッション ID の処理

## パフォーマンス

### Base64 との比較

| 方式             | 10MB PNG | メモリ使用量 | 転送効率 |
| ---------------- | -------- | ------------ | -------- |
| Base64           | 13.3MB   | 高           | 75%      |
| バイナリチャンク | 10MB     | 低           | 100%     |

### チャンクサイズの最適化

- **64KB**: バランスの取れたサイズ
- **メモリ効率**: 小さなメモリフットプリント
- **ネットワーク**: 適度な分割でオーバーヘッド最小化

## 互換性

- **既存システム**: 既存の Base64 画像置換システムと完全互換
- **ブラウザ**: モダンブラウザ（WebSocket、ArrayBuffer 対応）
- **Node.js**: v14 以上推奨

## トラブルシューティング

### よくある問題

1. **接続エラー**

   - WebSocket サーバーが起動しているか確認
   - ポート 3000 が使用可能か確認

2. **アップロード失敗**

   - ファイルサイズが 10MB 以下か確認
   - サポートされている画像形式か確認

3. **進捗が止まる**
   - ネットワーク接続を確認
   - ブラウザのコンソールでエラーログを確認

### デバッグ方法

```javascript
// ブラウザコンソールでデバッグ情報を確認
console.log("WebSocket状態:", socket.connected);
console.log("アップローダー:", fileUploader);
```

## 今後の拡張予定

- **圧縮機能**: 画像の自動圧縮
- **リジューム機能**: 中断されたアップロードの再開
- **並列アップロード**: 複数ファイルの同時処理
- **プレビュー機能**: アップロード前の画像プレビュー

## 参考資料

- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [ArrayBuffer MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
- [Socket.io Documentation](https://socket.io/docs/)
