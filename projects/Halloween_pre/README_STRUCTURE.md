# 🎃 Halloween Project - ファイル構造ガイド

## 📁 プロジェクト構造

```
Halloween_pre/
├── 📄 halloween.html          # メイン表示画面（展示用）
├── 📄 control.html           # コントロールパネル（操作用）
├── 📄 main.html              # 旧バージョン（参考用）
│
├── 📁 css/                   # スタイルシート
│   ├── 🎨 control-panel.css      # コントロールパネル専用CSS
│   ├── 🎨 halloween-main.css     # ハローウィン表示画面のメインCSS
│   ├── 🎨 halloween-backgrounds.css  # 背景関連CSS
│   ├── 🎨 halloween-spotlights.css   # スポットライト効果CSS
│   ├── 🎨 halloween-effects.css      # エフェクト関連CSS
│   └── 📁 halloween-characters/   # キャラクター専用CSS
│       ├── 🎨 shared-base.css        # 共通ベースCSS
│       ├── 🎨 fixed-characters.css   # 固定キャラクターCSS
│       ├── 🎨 flying-animations.css  # 飛行キャラクター（20体）
│       └── 🎨 walking-animations.css # 歩行キャラクター（10体）
│
├── 📁 js/                    # JavaScript
│   ├── 🎮 control-panel.js       # コントロールパネル専用JS
│   ├── 🎃 halloween-display.js   # 表示画面専用JS
│   ├── 🎃 halloween-init.js      # ハローウィン初期化JS
│   ├── 🔮 magic-hand-control.js  # 魔法の手制御JS
│   ├── 🌐 websocket-client.js    # WebSocket通信JS
│   ├── 🎪 festival-config.js     # 文化祭設定JS
│   └── 💫 bubbly-optimized.js    # バブル効果JS
│
└── 📁 images/                # 画像ファイル
    ├── 🔄 changeable/            # 入れ替え可能な画像
    │   ├── 📁 flying-characters/     # 飛行キャラクター（20体）
    │   └── 📁 walking-characters/    # 歩行キャラクター（10体）
    └── 🔒 fixed/                 # 固定画像（変更禁止）
        ├── 📁 backgrounds/           # 背景画像
        ├── 📁 decorations/           # 装飾画像
        └── 📁 effects/               # エフェクト画像
```

## 🎯 ファイルの役割

### 📄 HTML ファイル

- **halloween.html**: メイン表示画面（文化祭で来場者が見る画面）
- **control.html**: コントロールパネル（スタッフが操作する画面）

### 🎨 CSS ファイル

- **control-panel.css**: コントロールパネル専用のスタイル
- **halloween-\*.css**: 表示画面用のスタイル（機能別に分割）

### 🎮 JavaScript ファイル

- **control-panel.js**: コントロールパネルの機能と WebSocket 通信
- **halloween-display.js**: 表示画面の WebSocket 受信とイベント処理
- **websocket-client.js**: WebSocket 通信の共通機能

## 🔧 開発時の注意点

### ファイル分離のメリット

1. **保守性**: 機能ごとにファイルが分かれているため、修正が容易
2. **可読性**: コードが整理されて読みやすい
3. **再利用性**: 共通機能を複数のページで利用可能
4. **デバッグ**: 問題の特定が容易

### 混同を避けるために

- **control-panel.\***：コントロールパネル専用
- **halloween-\***：表示画面専用
- **共通ファイル**：websocket-client.js、festival-config.js など

### 編集時のルール

1. HTML ファイルにはスタイルやスクリプトを直接書かない
2. 機能追加時は対応する外部ファイルを編集
3. 新機能は適切なファイルに分割して追加

## 🚀 実行方法

1. **表示画面**: `halloween.html` をブラウザで開く
2. **コントロールパネル**: `control.html` をブラウザで開く
3. **WebSocket サーバー**: 別途起動が必要

## 📝 更新履歴

- キャラクター数拡張：飛行 20 体、歩行 10 体
- CSS/JS 分離：保守性向上
- ファイル構造整理：機能別分割
