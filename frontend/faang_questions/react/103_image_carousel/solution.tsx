/**
 * Reference solution for 103 — keep carousel.tsx as the stub for redo
 * practice; this file is for comparison after your own attempt.
 *
 * Design in one breath: `index` is internal unless the `index` prop is given;
 * every change funnels through `go(next)` which updates internal state (when
 * uncontrolled) and reports `onChange`. Autoplay is one `setTimeout` per
 * tick, re-armed by an effect keyed on `[autoPlayMs, paused, loop, index]`,
 * so pausing/resuming always restarts a full interval and unmount clears it.
 */
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react';

export interface Slide {
  id: string;
  src: string;
  alt: string;
}

export interface CarouselProps {
  slides: Slide[];
  /** Milliseconds between automatic advances. 0 (default) disables autoplay. */
  autoPlayMs?: number;
  /** Wrap at both ends. Default true. When false, the end buttons are disabled. */
  loop?: boolean;
  /** Controlled active index. */
  index?: number;
  /** Uncontrolled start index. Default 0. */
  defaultIndex?: number;
  onChange?: (index: number) => void;
  /** Accessible name of the region. Default 'Gallery'. */
  label?: string;
}

/** Minimum horizontal pointer travel that counts as a swipe. */
const SWIPE_PX = 40;

const clampIndex = (i: number, count: number): number =>
  count === 0 ? 0 : Math.min(count - 1, Math.max(0, Math.trunc(i) || 0));

export function Carousel({
  slides,
  autoPlayMs = 0,
  loop = true,
  index: indexProp,
  defaultIndex = 0,
  onChange,
  label = 'Gallery',
}: CarouselProps): ReactElement {
  const count = slides.length;
  const controlled = indexProp !== undefined;

  const [internal, setInternal] = useState(() => clampIndex(defaultIndex, count));
  const index = clampIndex(controlled ? indexProp : internal, count);

  // Engagement flags: autoplay never runs while either is set (WCAG 2.2.2).
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const paused = hovered || focusWithin;

  // --- navigation -----------------------------------------------------------

  /** Index one step away, or null when `loop` is off and we are at the edge. */
  const neighbour = (from: number, delta: 1 | -1): number | null => {
    if (count === 0) return null;
    const raw = from + delta;
    if (raw >= 0 && raw < count) return raw;
    return loop ? (raw + count) % count : null;
  };

  const go = (next: number | null) => {
    if (next === null || next === index) return;
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  // Latest `go` for the timer callback: the timeout closes over a stale
  // `index`/`onChange` otherwise (controlled parents swap `onChange` often).
  const goRef = useRef(go);
  goRef.current = go;

  const canPrev = neighbour(index, -1) !== null;
  const canNext = neighbour(index, 1) !== null;

  // --- autoplay -------------------------------------------------------------

  useEffect(() => {
    if (autoPlayMs <= 0 || paused || count < 2) return;
    const next = neighbour(index, 1);
    if (next === null) return; // loop off, parked on the last slide
    const timer = setTimeout(() => goRef.current(next), autoPlayMs);
    return () => clearTimeout(timer);
    // `index` in the deps is deliberate: each change (manual or automatic)
    // re-arms a fresh full interval; cleanup on unmount clears the pending tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayMs, paused, loop, index, count]);

  // --- keyboard -------------------------------------------------------------

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') go(neighbour(index, 1));
    else if (e.key === 'ArrowLeft') go(neighbour(index, -1));
    else return;
    e.preventDefault();
  };

  // --- focus-within tracking ------------------------------------------------

  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    // relatedTarget is where focus is going; inside the region => still engaged.
    const to = e.relatedTarget as Node | null;
    if (!to || !e.currentTarget.contains(to)) setFocusWithin(false);
  };

  // --- swipe ----------------------------------------------------------------

  const swipe = useRef<{ startX: number; lastX: number } | null>(null);

  const handlePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    swipe.current = { startX: e.clientX, lastX: e.clientX };
  };
  const handlePointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (swipe.current) swipe.current.lastX = e.clientX;
  };
  const handlePointerUp = () => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = s.lastX - s.startX;
    if (Math.abs(dx) < SWIPE_PX) return;
    go(neighbour(index, dx < 0 ? 1 : -1)); // moved left => next slide
  };

  // --- lazy slide window ----------------------------------------------------

  // Active slide plus its two neighbours (wrapping only with `loop`), in
  // ascending index order, deduplicated for tiny galleries.
  const rendered = new Set<number>();
  if (count > 0) {
    rendered.add(index);
    const prev = neighbour(index, -1);
    const next = neighbour(index, 1);
    if (prev !== null) rendered.add(prev);
    if (next !== null) rendered.add(next);
  }
  const renderedIndices = [...rendered].sort((a, b) => a - b);

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={handleBlur}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (swipe.current = null)}
      style={{ touchAction: 'pan-y', userSelect: 'none' }}
    >
      <div>
        {renderedIndices.map((i) => {
          const slide = slides[i];
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              hidden={i !== index}
            >
              <img src={slide.src} alt={slide.alt} draggable={false} />
            </div>
          );
        })}
      </div>

      <div>
        <button type="button" aria-label="Previous" disabled={!canPrev} onClick={() => go(neighbour(index, -1))}>
          ‹
        </button>
        <button type="button" aria-label="Next" disabled={!canNext} onClick={() => go(neighbour(index, 1))}>
          ›
        </button>
      </div>

      <div>
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => go(i)}
          >
            ●
          </button>
        ))}
      </div>

      <p role="status">
        Slide {count === 0 ? 0 : index + 1} of {count}
      </p>
    </section>
  );
}
