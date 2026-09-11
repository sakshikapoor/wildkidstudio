/**
 * Dot field.
 *
 * A grid of small ink dots behind a section. The field breathes — a slow wave
 * of opacity rolls across it so it is never quite still — and the dots near
 * the pointer swell to full ink and lean away from it, as if the pointer were
 * pressing into the sheet. The pointer is followed with a lag, so the dent
 * glides rather than snaps.
 *
 * Markup contract (see DotField.astro): a `[data-dots]` canvas inside the
 * section it covers. The pointer is tracked over that section. The ink is the
 * canvas's CSS `color` and the accent at the heart of the dent its `--dot`,
 * so the field is themed from the stylesheet.
 */

/** How close to the pointer, as a fraction of the reach, a dot turns accent. */
const ACCENT_CORE = 0.78;

interface Field {
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  ink: string;
  /** The few dots right under the pointer take the accent. */
  accent: string;
  width: number;
  height: number;
  gap: number;
  radius: number;
  cols: number;
  rows: number;
  /** Where the grid starts, so it sits centred in the section. */
  originX: number;
  originY: number;
  /** Pointer target and the lagged position actually drawn. */
  tx: number;
  ty: number;
  px: number;
  py: number;
  /** How much the pointer is felt, eased 0 → 1 on enter and back on leave,
   *  so the dent fades out in place instead of sliding off. */
  pull: number;
  pullTarget: number;
  visible: boolean;
  frame: number;
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How far the lagged pointer and pull close on their targets each frame. */
const FOLLOW = 0.12;

function layout(field: Field) {
  const { canvas, context, host } = field;
  field.width = host.clientWidth;
  field.height = host.clientHeight;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(field.width * ratio);
  canvas.height = Math.round(field.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const small = field.width < 600;
  field.gap = small ? 22 : 30;
  field.radius = small ? 110 : 170;
  field.cols = Math.floor(field.width / field.gap) + 1;
  field.rows = Math.floor(field.height / field.gap) + 1;
  field.originX = (field.width - (field.cols - 1) * field.gap) / 2;
  field.originY = (field.height - (field.rows - 1) * field.gap) / 2;
  const style = getComputedStyle(canvas);
  field.ink = style.color;
  field.accent = style.getPropertyValue('--dot').trim() || field.ink;
}

function draw(field: Field, seconds: number) {
  const { context, gap, radius, cols, rows, originX, originY, px, py, pull } = field;
  context.clearRect(0, 0, field.width, field.height);

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      let x = originX + i * gap;
      let y = originY + j * gap;
      let r = 1.6;
      // A faint breathing wave, so the field is not perfectly still.
      let alpha = reduced ? 0.33 : 0.28 + 0.1 * Math.sin(seconds * 0.6 + i * 0.35 + j * 0.5);
      let colour = field.ink;

      const dx = x - px;
      const dy = y - py;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (pull > 0.001 && d < radius && d > 0) {
        const f = (1 - d / radius) * pull;
        const push = f * f * 26;
        x += (dx / d) * push;
        y += (dy / d) * push;
        r += f * 3.2;
        alpha += f * (1 - alpha);
        if (f > ACCENT_CORE) colour = field.accent;
      }

      context.fillStyle = colour;
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;
}

function step(field: Field) {
  field.px += (field.tx - field.px) * FOLLOW;
  field.py += (field.ty - field.py) * FOLLOW;
  field.pull += (field.pullTarget - field.pull) * FOLLOW;
}

function loop(field: Field) {
  const frame = (now: number) => {
    field.frame = 0;
    if (!field.visible || document.hidden) return;
    step(field);
    draw(field, now / 1000);
    field.frame = requestAnimationFrame(frame);
  };
  if (!field.frame) field.frame = requestAnimationFrame(frame);
}

function setUp(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement;
  const context = canvas.getContext('2d');
  if (!host || !context) return;

  const field: Field = {
    host,
    canvas,
    context,
    ink: '',
    accent: '',
    width: 0,
    height: 0,
    gap: 30,
    radius: 170,
    cols: 0,
    rows: 0,
    originX: 0,
    originY: 0,
    tx: 0,
    ty: 0,
    px: 0,
    py: 0,
    pull: 0,
    pullTarget: 0,
    visible: false,
    frame: 0,
  };

  // With reduced motion there is no ambient wave and no lag: the field is
  // drawn once, and redrawn only when the pointer moves over it.
  const render = () => (reduced ? draw(field, 0) : loop(field));

  layout(field);
  if (reduced) draw(field, 0);

  new ResizeObserver(() => {
    layout(field);
    if (reduced) draw(field, 0);
  }).observe(host);

  host.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      const box = host.getBoundingClientRect();
      field.tx = event.clientX - box.left;
      field.ty = event.clientY - box.top;
      // Arriving, start the dent where the pointer is rather than gliding in
      // from wherever it was last.
      if (field.pull < 0.01) {
        field.px = field.tx;
        field.py = field.ty;
      }
      field.pullTarget = 1;
      if (reduced) {
        field.px = field.tx;
        field.py = field.ty;
        field.pull = 1;
        draw(field, 0);
      }
    },
    { passive: true },
  );

  host.addEventListener('pointerleave', () => {
    field.pullTarget = 0;
    if (reduced) {
      field.pull = 0;
      draw(field, 0);
    }
  });

  // Only animate while the section is on screen.
  new IntersectionObserver((entries) => {
    field.visible = entries.some((entry) => entry.isIntersecting);
    if (field.visible) render();
  }).observe(host);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && field.visible) render();
  });
}

document.querySelectorAll<HTMLCanvasElement>('canvas[data-dots]').forEach(setUp);
