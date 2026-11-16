import { useMemo } from 'react';

const SPINES = ['#c8202a', '#1b9a96', '#f4b731', '#3f7aa3', '#7a4b1e', '#e5382f'];
const W = 1200;
const ROW = 150;
const ROWS = 5;

interface Book { x: number; y: number; w: number; h: number; fill: string; stripe: boolean }

/** Deterministic bookshelf pattern (no image asset needed). Decorative only. */
function buildShelves(): Book[] {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const books: Book[] = [];
  for (let row = 0; row < ROWS; row++) {
    const base = row * ROW + ROW - 14;
    let x = 0;
    while (x < W) {
      const w = 16 + rnd() * 22;
      const h = 70 + rnd() * 55;
      books.push({ x, y: base - h, w, h, fill: SPINES[Math.floor(rnd() * SPINES.length)], stripe: rnd() > 0.45 });
      x += w + (rnd() > 0.85 ? 12 : 1);
    }
  }
  return books;
}

export function BookshelfBackground() {
  const books = useMemo(buildShelves, []);
  return (
    <svg aria-hidden focusable="false" className="absolute inset-0 size-full" viewBox={`0 0 ${W} ${ROW * ROWS}`} preserveAspectRatio="xMidYMid slice">
      <rect width={W} height={ROW * ROWS} fill="#3a2d28" />
      {books.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={1.5} fill={b.fill} />
          {b.stripe && <rect x={b.x} y={b.y + 12} width={b.w} height={5} fill="#f4b731" opacity={0.85} />}
        </g>
      ))}
      {Array.from({ length: ROWS }, (_, row) => (
        <rect key={row} x={0} y={row * ROW + ROW - 14} width={W} height={14} fill="#5a4338" />
      ))}
    </svg>
  );
}
