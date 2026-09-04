/**
 * The halftone screen laid over the tree artwork.
 *
 * The effect is one pass over the whole of `.tree__ink` — the tree itself and
 * every image painted onto it (the splash, the lanterns, the cloud, the house,
 * the little guy) — so they are dotted together as one picture rather than
 * each acquiring its own grid.
 *
 * How it works, since the numbers below only make sense against it:
 *
 *   1. The art is desaturated and exposed  (`desaturate`, `brightness`).
 *   2. A dot screen is blended over it in `hard-light` (`cell`, `dot`,
 *      `angle`, `strength`). The screen is two crossed ramps multiplied
 *      together, which gives a lattice of soft peaks — the classic halftone
 *      screen, and rotatable without rotating (and overscanning) a layer.
 *   3. `contrast` collapses the result toward black and white. This is the
 *      step that turns the soft peaks into dots, and it is why the knobs are
 *      not independent: with no contrast there is no halftone, only a grid of
 *      smudges.
 *
 * `cell` is in design px — see styles/_util.scss — so the screen scales with
 * the artwork and the dot count stays put at every viewport width.
 *
 * These are authored in the browser rather than by hand: run the dev server,
 * open the "Little guy" panel, and work the Halftone sliders against the real
 * artwork. Save writes this file for you.
 */
export interface Halftone {
  /** Whether the screen is laid over the artwork at all. */
  on: boolean;
  /** Grid pitch — the distance between dot centres, in design px. */
  cell: number;
  /** How far the dot spreads into its cell, 0–1. Higher is fatter. */
  dot: number;
  /** Grid rotation in degrees. 45 is the traditional screen angle. */
  angle: number;
  /** The threshold. 1 leaves the art alone; the dots appear well above it. */
  contrast: number;
  /** Exposure before thresholding. Under 1 darkens, over 1 lightens. */
  brightness: number;
  /** How much colour is taken out, 0–1. At 1 the artwork is ink only. */
  desaturate: number;
  /** How hard the screen bites, 0–1. At 0 there are no dots. */
  strength: number;
}

export const halftone: Halftone = {
  on: true,
  cell: 3.5,
  dot: 0.5,
  angle: 45,
  contrast: 1.3,
  brightness: 1.05,
  desaturate: 0,
  strength: 0.54,
};
