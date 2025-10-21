# Copilot Instructions - Halloween Project

## 言語設定

- **コメントとドキュメント**: 日本語を使用してください
- **変数名と関数名**: 英語を使用してください
- **コミットメッセージ**: 日本語を使用してください
- **CSS クラス名**: ハローウィンテーマに関連した英語を使用してください

## コーディング規約

- **HTML**: セマンティックな HTML5 を使用する
- **CSS**: モジュール化された CSS ファイルを使用する
- **JavaScript**: ES6+の記法を使用する
- **アニメーション**: CSS Animations を優先的に使用する

## コメント規約

```css
/* 良い例：日本語コメント */
.halloween-character {
  /* ハローウィンキャラクターの基本スタイル */
  position: absolute;
  animation: float 3s ease-in-out infinite;
}

/* 良い例：JavaScript日本語コメント */
function initHalloweenEffects() {
  // ハローウィンエフェクトを初期化する
  const characters = document.querySelectorAll('.character');
  characters.forEach(character => {
    // キャラクターにクリックイベントを追加
    character.addEventListener('click', playHalloweenSound);
  });
}
```

## ファイル構成

```
projects/Halloween_pre/
├── halloween.html          # メインHTMLファイル
├── index.html             # エントリーポイント
├── css/                   # CSSファイル
│   ├── halloween-main.css        # メインスタイル
│   ├── halloween-backgrounds.css # 背景関連
│   ├── halloween-characters.css  # キャラクターアニメーション
│   ├── halloween-effects.css     # エフェクト
│   └── halloween-spotlights.css  # スポットライト効果
├── js/                    # JavaScriptファイル
│   ├── bubbly-optimized.js       # バブルエフェクト
│   └── halloween-init.js         # 初期化スクリプト
├── img/                   # プロジェクト画像
│   ├── moon.png
│   ├── spotlight_1.png
│   ├── spotlight_2.png
│   └── town_001.gif
├── preset_img/            # キャラクター画像
│   ├── test_1.png ~ test_6.png   # テストキャラクター
│   ├── bat_1.gif, bat_2.gif      # コウモリ
│   ├── ghost.gif, obake.png      # ゴースト・おばけ
│   └── spider.gif, spider-wire.png # スパイダー
├── preset_css/            # プリセットCSS
│   └── preset_halloween.css      # ハローウィン基本スタイル
└── preset_music/          # 音楽ファイル
    └── halloween_bgm.mp3
```

## CSS 命名規約

- **ハローウィンテーマ**: `halloween-` プレフィックスを使用
- **キャラクター**: `character`, `walking-character` など
- **エフェクト**: `confetti`, `spotlight`, `moon` など
- **アニメーション**: `float`, `bounce`, `slideFromLeft` など

```css
/* 良い例 */
.halloween-background {
}
.walking-character {
}
.character1 {
}
.halloween-filter {
}

/* 避ける例 */
.sea-overlay {
} /* ハローウィンテーマに関係ない */
.bg_sea {
} /* アンダースコア記法 */
```

## JavaScript 規約

- **関数名**: キャメルケースを使用
- **イベントハンドラ**: 明確な命名を使用
- **DOM 操作**: querySelector/querySelectorAll を優先

```javascript
// 良い例
function initHalloweenBubbles() {
  // バブルエフェクトを初期化
}

function playHalloweenSound(event) {
  // ハローウィン効果音を再生
}

// DOM要素の取得
const halloweenBgm = document.getElementById("halloween-bgm");
const characters = document.querySelectorAll(".character");
```

## アニメーション規約

- **キーフレーム名**: 動作を表す英語を使用
- **持続時間**: 自然な動きになるよう調整
- **イージング**: `ease-in-out` を基本とする

```css
/* キーフレーム例 */
@keyframes walkFromLeft {
}
@keyframes slideFromRight {
}
@keyframes halloweenMagic {
}
@keyframes walkBounce {
}
```

## コミットメッセージ規約

```
feat: 新機能を追加（歩行キャラクター、エフェクトなど）
fix: バグを修正（アニメーション、レイアウトなど）
style: スタイルを調整（CSS、アニメーション）
refactor: コードリファクタリング
perf: パフォーマンス改善
docs: ドキュメント更新
chore: その他の変更（ファイル削除、整理など）
```

## 推奨事項

- **パフォーマンス**: アニメーションは `transform` と `opacity` を優先
- **アクセシビリティ**: `alt` 属性を適切に設定
- **レスポンシブ**: デスクトップ専用として最適化
- **ブラウザ対応**: モダンブラウザ対応
- **ファイルサイズ**: 画像とオーディオファイルを適切に最適化
