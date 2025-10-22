# 🖼️ Halloween Image Replacement System

ArrayBuffer 方式で PNG/GIF 画像をリアルタイム置換するシステムです。

## 🚀 機能概要

- **リアルタイム画像置換**: WebSocket で PNG/GIF 画像を即座に置換
- **ArrayBuffer 通信**: 効率的なバイナリデータ転送
- **ドラッグ&ドロップ**: 直感的な画像アップロード
- **自動ファイル名マッチング**: character1.png → .character1 要素に自動適用
- **視覚エフェクト**: 置換時の光るエフェクトとパーティクル

## 📁 ファイル構成

```
Halloween_pre/
├── js/
│   ├── image-replacer.js          # 表示側: 画像置換処理
│   ├── control-image-uploader.js  # 操作側: アップロード機能
│   ├── websocket-client.js        # 拡張済み: 画像受信対応
│   └── control-panel.js           # 拡張済み: アップローダー統合
├── server-image-handler.js        # サーバー側サンプルコード
└── README-ImageReplacement.md     # このファイル
```

## 🎯 対応画像

### 飛行キャラクター (20 体)

- `character1.png` → `.character1` 要素
- `character2.png` → `.character2` 要素
- ... (character20 まで)

### 歩行キャラクター (10 体)

- `walking-left-1.png` → `.walking-left` 要素
- `walking-right-1.png` → `.walking-right` 要素
- `walking-left-2.png` → `.walking-left-2` 要素
- ... (walking-right-5 まで)

## 🔧 使用方法

### 1. 操作側 (control.html)

1. 「画像置換システム」セクションにアクセス
2. 画像をドラッグ&ドロップまたはファイル選択
3. 自動的に WebSocket 経由で送信

### 2. 表示側 (halloween.html)

- 自動的に画像を受信・置換
- 置換時に光るエフェクトが発生

## 📋 対応形式

- **PNG**: 透明度対応、推奨形式
- **GIF**: アニメーション対応
- **JPEG**: 写真系画像
- **WebP**: 高圧縮形式

**最大ファイルサイズ**: 10MB

## ⚡ 技術仕様

### ArrayBuffer 通信フロー

1. 操作側: ファイル → ArrayBuffer 変換
2. WebSocket: メタデータ送信 → バイナリデータ送信
3. 表示側: ArrayBuffer → Blob → Object URL → 画像置換

### メモリ管理

- 古い Object URL の自動クリーンアップ
- 画像キャッシュによるメモリリーク防止

## 🛠️ サーバー設定

`server-image-handler.js` を参考に、Socket.io サーバーに以下を追加:

```javascript
// 画像メタデータ中継
socket.on("image-metadata", (metadata) => {
  socket.broadcast.to("displays").emit("image-metadata", metadata);
});

// 画像バイナリデータ中継
socket.on("image-data", (arrayBuffer) => {
  socket.broadcast.to("displays").emit("image-data", arrayBuffer);
});
```

## 🎨 カスタマイズ

### 新しい画像要素を追加

`image-replacer.js` の `findTargetElements()` メソッドを編集:

```javascript
// カスタム要素の追加例
if (filename === "custom-image.png") {
  const element = document.querySelector(".custom-element");
  if (element) elements.push(element);
}
```

### エフェクトのカスタマイズ

`addReplacementEffect()` メソッドで置換時のエフェクトを変更可能。

## 🐛 トラブルシューティング

### 画像が置換されない

1. ファイル名が正確か確認 (`character1.png` など)
2. 対象要素が存在するか確認
3. WebSocket 接続状況を確認

### メモリ使用量が多い

- ブラウザのリロードでキャッシュクリア
- 大きすぎる画像ファイルを避ける

### GIF アニメーションが動かない

- ファイル形式が GIF か確認
- ブラウザの GIF サポート状況を確認

## 🎃 Halloween 特化機能

- **ハロウィンテーマ**: オレンジ・ゴールドのエフェクト
- **魔法エフェクト**: 置換時のパーティクル演出
- **文化祭対応**: 複数端末での同期表示

---

**作成者**: Kiro AI Assistant  
**バージョン**: 1.0.0  
**対応ブラウザ**: Chrome, Firefox, Safari, Edge (WebSocket + ArrayBuffer 対応)
