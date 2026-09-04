/**
 * The surfaces in the tree artwork the little guy can stand on — branches,
 * rocks, the roof of the birdhouse.
 *
 * A surface is a horizontal line segment, not a box: he lands on its top edge
 * and nothing below it is ever consulted, so one number for the height and two
 * for the span is the whole of it.
 *
 * Every value is a percentage of the 1280 x 6400 artwork canvas — the same
 * coordinate space Man.astro is positioned in — so surfaces stay pinned to the
 * artwork at any viewport width.
 *
 * These are authored in the browser rather than by hand: run the dev server,
 * open the "Little guy" panel, switch on Surfaces, draw them over the tree,
 * and paste what "Copy surfaces" gives you back over the array below — or
 * just press Save, which writes this file for you.
 */
export interface Surface {
  /** Left end of the segment, as a % of canvas width. */
  left: number;
  /** Right end of the segment, as a % of canvas width. */
  right: number;
  /** The standing height, as a % of canvas height. */
  top: number;
  /** Optional caption, shown over the character's head while he stands here. */
  text?: string;
}

export const surfaces: Surface[] = [
  { left: 74.386, right: 88.785, top: 20.36 },
  { left: 51.602, right: 71.602, top: 20.926 },
  { left: 32.091, right: 44.927, top: 21.973, text: "🗝️ New idea unlocked!" },
  { left: 54.862, right: 74.939, top: 24.028 },
  { left: 13.509, right: 23.09, top: 25.173, text: "🔮 Future interface!" },
  { left: 57.8, right: 73.555, top: 26.275 },
  { left: 32.604, right: 50.107, top: 27.5 },
  { left: 53.99, right: 75.919, top: 29.812, text: "💡 Lightbulb moment!" },
  { left: 29.123, right: 51.498, top: 32.684 },
  { left: 55.558, right: 82.081, top: 35.732 },
  { left: 23.361, right: 48.4, top: 38.49 },
  { left: 54.442, right: 81.065, top: 40.641 },
  { left: 18.488, right: 37.189, top: 41.936 },
  { left: 21.386, right: 47.74, top: 44.704 },
  { left: 52.896, right: 81.665, top: 46.097 },
  { left: 25.054, right: 42.197, top: 49.933, text: "🔎 Pixel Detective" },
  { left: 39.272, right: 61.249, top: 51.978 },
  { left: 58.273, right: 75.996, top: 52.429 },
  { left: 43.618, right: 61.438, top: 55.089 },
  { left: 20.18, right: 32.682, top: 55.624 },
  { left: 59.519, right: 78.462, top: 55.635, text: "🧠 Overthinking this" },
  { left: 25.067, right: 41.805, top: 59.272 },
  { left: 67.449, right: 87.049, top: 59.48 },
  { left: 27.399, right: 47.544, top: 61.922 },
  { left: 17.813, right: 28.314, top: 63.837, text: "🪜 Going Somewhere" },
  { left: 53.43, right: 71.132, top: 64.875, text: "✨ Something amazing" },
  { left: 54.48, right: 62.768, top: 67.817 },
  { left: 30.762, right: 44.891, top: 69.807, text: "🌸 Make it Pretty" },
  { left: 53.218, right: 63.165, top: 72.76 },
  { left: 21.315, right: 34.709, top: 74.108 },
  { left: 54.88, right: 66.544, top: 74.911, text: "😎 Almost there" },
  { left: 19.305, right: 30.029, top: 77.224 },
  { left: 0.274, right: 99.354, top: 80.22, text: "🎉 We Made it!" },
];
