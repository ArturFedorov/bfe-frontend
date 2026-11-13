/**
 * Reference solution for 104 — keep star_rating.tsx as the stub for redo
 * practice; this file is for comparison after your own attempt.
 *
 * Design in one breath: two pieces of state — `internal` (ignored when the
 * `value` prop is given) and `preview` (the hovered rating, never committed).
 * Everything visual (`data-fill`, `data-preview`) reads `preview ?? rating`;
 * everything semantic (`aria-checked`, roving `tabIndex`) reads `rating` only.
 */
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';

export interface StarRatingProps {
  /** Accessible name of the radiogroup / read-only image. */
  label: string;
  /** Controlled rating. */
  value?: number;
  /** Uncontrolled start value. Default 0. */
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Number of stars. Default 5. */
  max?: number;
  /** Allow 0.5 steps (keyboard and pointer position). Default false. */
  allowHalf?: boolean;
  /** Clicking the already-selected star resets to 0. Default true. */
  allowClear?: boolean;
  /** Render a single labelled image with no interaction. Default false. */
  readOnly?: boolean;
}

export type StarFill = 'full' | 'half' | 'empty';

/**
 * Clamps to [0, max]; rounds to the nearest 0.5 when allowHalf, else to the
 * nearest integer; NaN -> 0.
 */
export function clampRating(v: number, max: number, allowHalf: boolean): number {
  if (!Number.isFinite(v)) return 0;
  const clamped = Math.min(max, Math.max(0, v));
  const rounded = allowHalf ? Math.round(clamped * 2) / 2 : Math.round(clamped);
  // Rounding cannot leave [0, max] for an integer max, but guard anyway.
  return Math.min(max, Math.max(0, rounded));
}

/** How star `n` (1-based) is drawn for a rating `shown`. */
function fillFor(n: number, shown: number): StarFill {
  if (shown >= n) return 'full';
  if (shown >= n - 0.5) return 'half';
  return 'empty';
}

const starName = (n: number): string => (n === 1 ? '1 star' : `${n} stars`);

export function StarRating({
  label,
  value: valueProp,
  defaultValue = 0,
  onChange,
  max = 5,
  allowHalf = false,
  allowClear = true,
  readOnly = false,
}: StarRatingProps): ReactElement {
  const controlled = valueProp !== undefined;
  const [internal, setInternal] = useState(() => clampRating(defaultValue, max, allowHalf));
  // Every incoming value goes through clampRating, so `value={2.5}` with
  // allowHalf off renders as 3 rather than a half star that cannot be keyed to.
  const rating = clampRating(controlled ? valueProp : internal, max, allowHalf);

  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? rating;

  const step = allowHalf ? 0.5 : 1;
  // The radio that carries aria-checked and the single tab stop.
  const checkedStar = rating === 0 ? null : Math.ceil(rating);
  const tabbableStar = checkedStar ?? 1;

  // Focus follows the *rendered* value, not the key press: in controlled mode
  // the parent may refuse the change, so we move focus in an effect keyed on
  // `rating` and only when a key handler asked for it.
  const focusPending = useRef(false);
  const starRefs = useRef(new Map<number, HTMLElement>());
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    starRefs.current.get(tabbableStar)?.focus();
  }, [rating, tabbableStar]);

  const commit = (next: number) => {
    const v = clampRating(next, max, allowHalf);
    if (v === rating) return;
    if (!controlled) setInternal(v);
    onChange?.(v);
  };

  /** Rating under the pointer: left half of star `n` => n - 0.5 when allowHalf. */
  const ratingAtPointer = (e: ReactMouseEvent<HTMLElement>, n: number): number => {
    if (!allowHalf) return n;
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2 ? n - 0.5 : n;
  };

  const handleClick = (e: ReactMouseEvent<HTMLElement>, n: number) => {
    const v = ratingAtPointer(e, n);
    if (v === rating) {
      if (allowClear) commit(0);
      return;
    }
    commit(v);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = rating + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = rating - step;
        break;
      case 'Home':
        next = step; // the lowest non-zero rating
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    const v = clampRating(next, max, allowHalf);
    if (v === rating) return; // clamped at an end: no onChange, focus stays
    focusPending.current = true;
    commit(v);
  };

  const stars = Array.from({ length: Math.max(0, Math.floor(max)) }, (_, i) => i + 1);

  if (readOnly) {
    return (
      <div role="img" aria-label={`Rated ${rating} of ${max}`} style={{ display: 'inline-flex' }}>
        {stars.map((n) => (
          <span key={n} aria-hidden="true" data-fill={fillFor(n, rating)}>
            {fillFor(n, rating) === 'empty' ? '☆' : '★'}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-preview={preview ?? undefined}
      onMouseLeave={() => setPreview(null)}
      style={{ display: 'inline-flex' }}
    >
      {stars.map((n) => {
        const fill = fillFor(n, shown);
        return (
          <span
            key={n}
            role="radio"
            aria-label={starName(n)}
            aria-checked={n === checkedStar}
            tabIndex={n === tabbableStar ? 0 : -1}
            data-fill={fill}
            ref={(el) => {
              if (el) starRefs.current.set(n, el);
              else starRefs.current.delete(n);
            }}
            onMouseEnter={(e) => setPreview(ratingAtPointer(e, n))}
            onMouseMove={(e) => setPreview(ratingAtPointer(e, n))}
            onClick={(e) => handleClick(e, n)}
            onKeyDown={handleKeyDown}
            style={{ cursor: 'pointer', fontSize: 24, lineHeight: 1 }}
          >
            {/* Decorative glyph: the accessible name comes from aria-label. */}
            <span aria-hidden="true">{fill === 'empty' ? '☆' : '★'}</span>
          </span>
        );
      })}
    </div>
  );
}
