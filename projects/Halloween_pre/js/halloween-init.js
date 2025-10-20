// ハローウィン魔法のバブル初期化
console.log("🎃 Initializing Halloween Magic Bubbles...");

const halloweenBubbles = bubblyOptimized({
  colorStart: "rgba(255, 107, 53, 0.3)", // ハローウィンオレンジ
  colorStop: "rgba(106, 27, 154, 0.4)", // 魔法のパープル
  bubbles: 25, // バブル数調整
  animate: true,
  shadowColor: "#ffc107", // ゴールドの光
  blur: 6, // 強いぼかしでshadow強化
  compose: "lighter", // 明るく光る効果
});

console.log("✨ Halloween Magic Activated!", halloweenBubbles);


