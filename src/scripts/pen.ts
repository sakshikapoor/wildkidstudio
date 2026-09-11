/**
 * Ballpoint plates.
 *
 * Redraws a photograph as a pen engraving: parallel strokes laid at one angle,
 * each one swelling where the picture is dark and thinning to nothing where it
 * is light, so the picture survives only as the weight of the ink. It is the
 * same construction as a banknote engraving, adapted from the hatching on
 * isitslop.jatinsh.workers.dev — with two changes that make it read as a
 * ballpoint rather than a burin:
 *
 *  - Every stroke carries a faint, slow wobble, as a hand-held line does.
 *  - The plate is *drawn*: when it scrolls into view the strokes are laid down
 *    one after another, alternating direction the way a hand hatches, rather
 *    than appearing all at once.
 *
 * Markup contract (see PenPlate.astro): a `[data-plate]` box containing an
 * `<img>` (the source, and the no-script fallback) and a `<canvas>`. The ink
 * colour is the canvas's CSS `color`, the paper its `background-color`, so
 * the plate is themed from the stylesheet like anything else.
 */

interface Config {
  /** Stroke direction, degrees clockwise from horizontal. */
  angle: number;
  /** Roughly how many strokes cross the plate, held steady across sizes. */
  lineCount: number;
  /** The pixel gap derived from lineCount is kept inside these bounds, so
   *  a wide plate gets more strokes rather than fatter ones and every plate
   *  on the page reads as the same pen. */
  minSpacing: number;
  maxSpacing: number;
  /** Thickest a stroke gets, as a fraction of the gap. */
  maxWeight: number;
  /** Strokes thinner than this (px) are lifted — the pen leaves the paper. */
  liftBelow: number;
  /** Above 1 holds the light tones back, so the paper stays open. */
  gamma: number;
  /** Fraction of pixels allowed to clip at each end of the tone range. */
  clip: number;
  /** Softens the source before sampling, as a fraction of the gap. Needed
   *  for pictures that are already screened (halftones), which otherwise
   *  beat against the strokes. */
  soften: number;
  /** Wobble amplitude, as a fraction of the gap. */
  wobble: number;
  /** Total time to draw the plate, and the time one stroke takes. */
  drawMs: number;
  strokeMs: number;
}

const DEFAULTS: Config = {
  angle: -34,
  lineCount: 120,
  minSpacing: 2.8,
  maxSpacing: 4.4,
  maxWeight: 0.84,
  liftBelow: 0.14,
  gamma: 2.2,
  clip: 0.02,
  soften: 0.35,
  wobble: 0.14,
  drawMs: 2200,
  strokeMs: 520,
};

/** One stroke: its outline as parallel edges, sampled along its length. */
interface Stroke {
  /** Upper and lower edge, interleaved x,y per sample. */
  upper: Float32Array;
  lower: Float32Array;
  /** Half-width per sample, to skip lifted stretches cheaply. */
  half: Float32Array;
  count: number;
  /** When this stroke starts and how long it takes, in ms from draw start. */
  start: number;
  duration: number;
}

interface Plate {
  root: HTMLElement;
  image: HTMLImageElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  config: Config;
  width: number;
  height: number;
  strokes: Stroke[];
  /** How far each stroke has been drawn, in samples. */
  drawn: Int32Array;
  state: 'idle' | 'drawing' | 'done';
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Geometry ----------------------------------------------------------------

/**
 * Reads the image into a grid of darkness values (0 paper → 1 full ink), at a
 * resolution tied to the stroke gap rather than the screen: the strokes cannot
 * show detail finer than their own spacing, and the coarser grid is both
 * cheaper and the softening a pre-screened image needs.
 */
function sampleTones(plate: Plate, spacing: number) {
  const { image, width, height, config } = plate;
  const cell = Math.max(1, spacing * 0.5);
  const cols = Math.max(2, Math.round(width / cell));
  const rows = Math.max(2, Math.round(height / cell));

  const scratch = document.createElement('canvas');
  scratch.width = cols;
  scratch.height = rows;
  const context = scratch.getContext('2d', { willReadFrequently: true })!;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  if ('filter' in context && config.soften > 0) {
    context.filter = `blur(${((spacing * config.soften) / cell).toFixed(2)}px)`;
  }

  // Match object-fit: cover, centred — the crop the colour image shows.
  const scale = Math.max(cols / image.naturalWidth, rows / image.naturalHeight);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, cols, rows);
  context.drawImage(image, (cols - drawW) / 2, (rows - drawH) / 2, drawW, drawH);

  const pixels = context.getImageData(0, 0, cols, rows).data;
  const tones = new Float32Array(cols * rows);
  for (let i = 0; i < tones.length; i += 1) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    tones[i] = 1 - (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  stretch(tones, config);
  return { tones, cols, rows, cell };
}

/**
 * Rescales darkness so the darkest and lightest few percent land at the ends
 * of the range. Without this a low-contrast photo hatches flat and grey.
 */
function stretch(tones: Float32Array, config: Config) {
  const histogram = new Uint32Array(256);
  for (const value of tones) histogram[Math.min(255, Math.round(value * 255))] += 1;

  const percentile = (fraction: number) => {
    const target = tones.length * fraction;
    let seen = 0;
    for (let bin = 0; bin < 256; bin += 1) {
      seen += histogram[bin];
      if (seen >= target) return bin / 255;
    }
    return 1;
  };

  const low = percentile(config.clip);
  const high = percentile(1 - config.clip);
  const span = Math.max(high - low, 1 / 255);
  for (let i = 0; i < tones.length; i += 1) {
    const t = Math.min(1, Math.max(0, (tones[i] - low) / span));
    tones[i] = Math.pow(t, config.gamma);
  }
}

/** Seeded so a plate hatches identically on every visit and every resize. */
function random(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function buildStrokes(plate: Plate) {
  const { width, height, config } = plate;
  const spacing = Math.min(
    Math.max(width / config.lineCount, config.minSpacing),
    config.maxSpacing,
  );
  const step = spacing / 2.3;
  const { tones, cols, rows, cell } = sampleTones(plate, spacing);

  // Bilinear lookup, so stroke weight changes smoothly between grid cells.
  const toneAt = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    const gx = Math.min(cols - 1.001, Math.max(0, x / cell - 0.5));
    const gy = Math.min(rows - 1.001, Math.max(0, y / cell - 0.5));
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const i = y0 * cols + x0;
    const top = tones[i] * (1 - fx) + tones[i + 1] * fx;
    const bottom = tones[i + cols] * (1 - fx) + tones[i + cols + 1] * fx;
    return top * (1 - fy) + bottom * fy;
  };

  const radians = (config.angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const cx = width / 2;
  const cy = height / 2;
  const reach = Math.hypot(width, height) / 2;
  const maxHalf = (spacing * config.maxWeight) / 2;
  const wobble = spacing * config.wobble;
  const rand = random(Math.round(width * 7 + height * 13) || 1);

  const offsets: number[] = [];
  for (let offset = -reach; offset <= reach; offset += spacing) offsets.push(offset);

  const strokes: Stroke[] = [];
  const span = Math.max(1, config.drawMs - config.strokeMs);

  offsets.forEach((offset, index) => {
    // Clip the stroke to the part of its line that crosses the plate, so no
    // time is spent drawing off the edge.
    const samples: number[] = [];
    for (let along = -reach; along <= reach; along += step) samples.push(along);

    // Alternate direction line by line, as a hand hatching back and forth.
    if (index % 2 === 1) samples.reverse();

    // A slow wobble, different for each stroke: two sines at unrelated
    // frequencies never line up, so the drift never reads as a pattern.
    const phaseA = rand() * Math.PI * 2;
    const phaseB = rand() * Math.PI * 2;
    const freqA = 0.012 + rand() * 0.01;
    const freqB = 0.041 + rand() * 0.02;

    const upper: number[] = [];
    const lower: number[] = [];
    const halfs: number[] = [];
    let first = -1;
    let last = -1;

    samples.forEach((along) => {
      const drift =
        wobble * (0.7 * Math.sin(along * freqA + phaseA) + 0.3 * Math.sin(along * freqB + phaseB));
      const o = offset + drift;
      const x = cx + along * cos - o * sin;
      const y = cy + along * sin + o * cos;
      const inside = x >= -spacing && y >= -spacing && x <= width + spacing && y <= height + spacing;
      let half = maxHalf * toneAt(x, y);
      if (half < config.liftBelow) half = 0;
      if (inside) {
        if (first < 0) first = halfs.length;
        last = halfs.length;
      }
      upper.push(x + half * sin, y - half * cos);
      lower.push(x - half * sin, y + half * cos);
      halfs.push(half);
    });

    if (first < 0) return;

    const count = last - first + 1;
    // Stroke speed varies a little, so the rake of strokes has a ragged
    // leading edge rather than a ruled one.
    const duration = config.strokeMs * (0.8 + rand() * 0.4);
    const start = (index / Math.max(1, offsets.length - 1)) * span + rand() * 60;

    strokes.push({
      upper: Float32Array.from(upper.slice(first * 2, (last + 1) * 2)),
      lower: Float32Array.from(lower.slice(first * 2, (last + 1) * 2)),
      half: Float32Array.from(halfs.slice(first, last + 1)),
      count,
      start,
      duration,
    });
  });

  plate.strokes = strokes;
  plate.drawn = new Int32Array(strokes.length);
}

// --- Painting ----------------------------------------------------------------

function prepareCanvas(plate: Plate) {
  const { canvas, context, width, height } = plate;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const style = getComputedStyle(canvas);
  context.fillStyle = style.backgroundColor;
  context.fillRect(0, 0, width, height);
  addGrain(plate, style.color);
  context.fillStyle = style.color;
}

/** A faint speckle of ink so the stock does not read as flat digital white. */
function addGrain(plate: Plate, ink: string) {
  const { context, width, height } = plate;
  const rand = random(97);
  context.save();
  context.fillStyle = ink;
  context.globalAlpha = 0.07;
  const specks = Math.round((width * height) / 90);
  for (let i = 0; i < specks; i += 1) {
    context.fillRect(rand() * width, rand() * height, 0.8, 0.8);
  }
  context.restore();
}

/**
 * Fills one stretch of a stroke, samples [from, to]. Stretches where the pen
 * is lifted are skipped, so a stroke breaks into separate marks across light
 * areas exactly as a real hatch does.
 */
function fillSpan(context: CanvasRenderingContext2D, stroke: Stroke, from: number, to: number) {
  let runStart = -1;
  for (let i = from; i <= to + 1; i += 1) {
    const inked = i <= to && stroke.half[i] > 0;
    if (inked && runStart < 0) runStart = Math.max(from, i - 1);
    if (!inked && runStart >= 0) {
      const runEnd = Math.min(to, i);
      context.beginPath();
      for (let k = runStart; k <= runEnd; k += 1) {
        context.lineTo(stroke.upper[k * 2], stroke.upper[k * 2 + 1]);
      }
      for (let k = runEnd; k >= runStart; k -= 1) {
        context.lineTo(stroke.lower[k * 2], stroke.lower[k * 2 + 1]);
      }
      context.closePath();
      context.fill();
      runStart = -1;
    }
  }
}

function paintAll(plate: Plate) {
  prepareCanvas(plate);
  plate.strokes.forEach((stroke, i) => {
    fillSpan(plate.context, stroke, 0, stroke.count - 1);
    plate.drawn[i] = stroke.count;
  });
  finish(plate);
}

function animate(plate: Plate) {
  plate.state = 'drawing';
  prepareCanvas(plate);
  // The clock starts on the first frame actually painted, not when the plate
  // was seen — a page opened in a background tab gets no frames until it is
  // brought forward, and would otherwise dump the whole drawing at once.
  let began = -1;

  const frame = (now: number) => {
    if (plate.state !== 'drawing') return;
    if (began < 0) began = now;
    const elapsed = now - began;
    let pending = false;

    plate.strokes.forEach((stroke, i) => {
      const done = plate.drawn[i];
      if (done >= stroke.count) return;
      const t = (elapsed - stroke.start) / stroke.duration;
      if (t <= 0) {
        pending = true;
        return;
      }
      // Eased so each stroke sets off quickly and slows into its end, the
      // way a hand decelerates before lifting.
      const eased = 1 - Math.pow(1 - Math.min(1, t), 2.2);
      const target = Math.min(stroke.count, Math.ceil(eased * stroke.count));
      if (target > done) {
        // Overlap the previous span by a sample so the joins never show.
        fillSpan(plate.context, stroke, Math.max(0, done - 1), target - 1);
        plate.drawn[i] = target;
      }
      if (target < stroke.count) pending = true;
    });

    if (pending) requestAnimationFrame(frame);
    else finish(plate);
  };

  requestAnimationFrame(frame);
}

function finish(plate: Plate) {
  plate.state = 'done';
  plate.root.setAttribute('data-inked', '');
}

// --- Lifecycle ---------------------------------------------------------------

function measure(plate: Plate) {
  plate.width = Math.round(plate.root.clientWidth);
  plate.height = Math.round(plate.root.clientHeight);
  return plate.width > 0 && plate.height > 0;
}

async function setUp(root: HTMLElement) {
  const image = root.querySelector<HTMLImageElement>('img');
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const context = canvas?.getContext('2d');
  if (!image || !canvas || !context) return;

  // A broken or blocked image leaves the plate showing its <img> fallback.
  try {
    await image.decode();
  } catch {
    if (!image.complete || image.naturalWidth === 0) return;
  }

  const options = JSON.parse(root.dataset.plate || '{}') as Partial<Config>;
  const plate: Plate = {
    root,
    image,
    canvas,
    context,
    config: { ...DEFAULTS, ...options },
    width: 0,
    height: 0,
    strokes: [],
    drawn: new Int32Array(0),
    state: 'idle',
  };

  if (!measure(plate)) return;
  buildStrokes(plate);
  root.setAttribute('data-pen', '');

  // Redraw at the new size, instantly — the drawing-in is an entrance, and
  // replaying it on every resize would be noise.
  let lastWidth = plate.width;
  let timer = 0;
  new ResizeObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!measure(plate) || plate.width === lastWidth) return;
      lastWidth = plate.width;
      buildStrokes(plate);
      if (plate.state !== 'idle') {
        plate.state = 'done';
        paintAll(plate);
      }
    }, 160);
  }).observe(root);

  if (reduced) {
    paintAll(plate);
    return;
  }

  // Blank stock until the plate is properly on screen, then draw.
  prepareCanvas(plate);
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      animate(plate);
    },
    { threshold: 0.3 },
  );
  observer.observe(root);
}

// --- Colour on touch -----------------------------------------------------------
//
// On a pointer device the colour photograph is revealed on hover (CSS). A
// touch screen has no hover, so there the colour comes through while the
// plate sits in the middle band of the viewport, and goes back to ink as it
// leaves. The class only marks the band; the stylesheet waits for
// [data-inked] as well, so the colour never pre-empts the drawing.
function lightOnScroll(plates: HTMLElement[]) {
  if (!window.matchMedia('(hover: none)').matches) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-centred', entry.isIntersecting);
      }
    },
    { rootMargin: '-38% 0px -38% 0px' },
  );
  plates.filter((el) => el.hasAttribute('data-colour')).forEach((el) => observer.observe(el));
}

/** Tracks the pointer inside a plate so the colour opens from where it is. */
function trackPointer(plates: HTMLElement[]) {
  for (const el of plates) {
    if (!el.hasAttribute('data-colour')) continue;
    const target = el.closest('a') ?? el;
    const move = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      el.style.setProperty('--x', `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--y', `${(((event.clientY - box.top) / box.height) * 100).toFixed(1)}%`);
    };
    target.addEventListener('pointerenter', move as EventListener);
    target.addEventListener('pointermove', move as EventListener, { passive: true });
  }
}

const plates = Array.from(document.querySelectorAll<HTMLElement>('[data-plate]'));
plates.forEach((root) => void setUp(root));
trackPointer(plates);
lightOnScroll(plates);
