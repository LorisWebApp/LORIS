import { Star } from 'lucide-react';

/** Community rating on a 1–5 scale with the number of people who rated. */
export function RatingStars({ average, count }: { average: number | null; count: number }) {
  if (average === null) {
    return (
      <div>
        <p className="text-[14px] text-muted">Not rated yet</p>
        <p className="text-[12px] text-muted">0 people rated</p>
      </div>
    );
  }
  const filled = Math.round(average);
  const people = `${count} ${count === 1 ? 'person' : 'people'} rated`;
  return (
    <div role="img" aria-label={`Rated ${average.toFixed(1)} out of 5 by ${people.replace(' rated', '')}`}>
      <p className="flex items-center gap-1.5">
        <span className="flex gap-px" aria-hidden>
          {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className={i <= filled ? 'text-[#d9961a]' : 'text-line'} fill={i <= filled ? 'currentColor' : 'none'} />)}
        </span>
        <span className="text-[14px] font-semibold text-deep">{average.toFixed(1)} / 5</span>
      </p>
      <p className="text-[12px] text-muted">{people}</p>
    </div>
  );
}
