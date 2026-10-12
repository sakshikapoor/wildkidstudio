// Placement on the page grid. Every page is ruled into squares, and every
// picture, panel and block sits on them, spanning a whole number of squares.
// The styles that go with these helpers are in src/styles/_grid.scss.
//
// Each item gets a desktop area on the 24-column grid and, optionally, a
// handset area on the 8-column one, each as [column, row, width, height]
// counted in squares from 1. Rows restart in each section. An item with no
// handset area is dropped on handsets.

export type Area = [col: number, row: number, w: number, h: number];

export type Colour = 'ink' | 'orange' | 'blue' | 'yellow' | 'pink';

export interface Block {
  d: Area;
  m?: Area;
  /** Every block is one square: solid colour, or stripes in two colours. */
  kind: 'fill' | 'stripes';
  c?: Colour;
  /** A pattern's second colour. Patterns are always two colours, never ink on white. */
  c2?: Colour;
}

const area = ([c, r, w, h]: Area) => `${r} / ${c} / span ${h} / span ${w}`;

/** Inline style placing an item: its desktop area, and its handset one. */
export const place = (d: Area, m?: Area) => `--d: ${area(d)}; --m: ${m ? area(m) : 'auto'}`;

/**
 * Section heights in squares, desktop then handset. Every section is a whole
 * number of squares tall, so the grid runs on unbroken from one to the next.
 */
export const rows = (d: number, m: number) => `--rows: ${d}; --mrows: ${m}`;

export const blockClass = (b: Pick<Block, 'kind' | 'm'>, onHandset = Boolean(b.m)) => [
  'g__block',
  `g__block--${b.kind}`,
  !onHandset && 'g--desk',
];

export const blockStyle = (b: Block, i = 0) =>
  `${place(b.d, b.m)}; --c: var(--g-${b.c ?? 'ink'}); --c2: var(--g-${b.c2 ?? 'yellow'}); --i: ${i}`;

/** Two digits, the way section labels count. */
export const pad = (n: number) => String(n).padStart(2, '0');
