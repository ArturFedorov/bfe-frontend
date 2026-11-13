import React, { ReactElement, ReactNode, useRef, useState } from 'react';

export interface Span {
  start: number; // inclusive token index
  end: number; // inclusive token index
  label: string;
}

export interface SpanLabelerProps {
  tokens: string[];
  labels: string[];
  value: Span[];
  onChange: (next: Span[]) => void;
}

/** The only selection state: anchor (where it started) and focus (where it reaches). */
interface Pending {
  anchor: number;
  focus: number;
}

/**
 * Token-based NER span labeler.
 *
 * Design notes:
 * - Fully controlled: marks and the summary are derived from `value` on every
 *   render; the component never mirrors spans into state.
 * - Internal state is limited to the pending selection (anchor/focus), the
 *   index of the selected existing span, and whether the last extension was
 *   rejected for overlap.
 * - `spanAt[i]` maps a token index to the span covering it. It drives both
 *   the render loop (bare button vs. `<mark>` run) and the single overlap
 *   check shared by the click and keyboard paths.
 * - Space on a focused `<button>` is a native click, so "Space anchors" comes
 *   for free from the click handler.
 */
export function SpanLabeler({ tokens, labels, value, onChange }: SpanLabelerProps): ReactElement {
  const [pending, setPending] = useState<Pending | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<number | null>(null);
  const [overlap, setOverlap] = useState(false);
  const tokenRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // token index -> index into `value` of the span covering it (if any)
  const spanAt: Array<number | undefined> = tokens.map(() => undefined);
  value.forEach((span, spanIndex) => {
    for (let i = span.start; i <= span.end; i++) spanAt[i] = spanIndex;
  });

  // Normalised pending range, derived (never stored) so start <= end always holds.
  const range = pending
    ? { lo: Math.min(pending.anchor, pending.focus), hi: Math.max(pending.anchor, pending.focus) }
    : null;

  const textOf = (span: Span) => tokens.slice(span.start, span.end + 1).join(' ');

  const startSelection = (index: number) => {
    setPending({ anchor: index, focus: index });
    setSelectedSpan(null);
    setOverlap(false);
  };

  /** Extend the pending selection to `target`; reject if the range crosses a span. */
  const extendSelection = (target: number) => {
    if (!pending || target < 0 || target >= tokens.length) return;
    const lo = Math.min(pending.anchor, target);
    const hi = Math.max(pending.anchor, target);

    for (let i = lo; i <= hi; i++) {
      if (spanAt[i] !== undefined) {
        setOverlap(true);
        return;
      }
    }
    setPending({ anchor: pending.anchor, focus: target });
    setOverlap(false);
  };

  const handleTokenClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.shiftKey && pending) {
      extendSelection(index);
      return;
    }

    const spanIndex = spanAt[index];
    if (spanIndex !== undefined) {
      // Tokens inside a span select the span rather than starting a selection.
      setSelectedSpan(spanIndex);
      setPending(null);
      setOverlap(false);
      return;
    }

    startSelection(index);
  };

  const pickLabel = (label: string) => {
    if (!range) return;
    onChange([...value, { start: range.lo, end: range.hi, label }]);
    setPending(null);
    setOverlap(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowLeft': {
        event.preventDefault();
        const step = event.key === 'ArrowRight' ? 1 : -1;

        if (event.shiftKey) {
          if (pending) extendSelection(pending.focus + step);
          return;
        }

        const focused = Number((event.target as HTMLElement).dataset.index);
        if (Number.isNaN(focused)) return;
        const next = Math.max(0, Math.min(tokens.length - 1, focused + step));
        tokenRefs.current[next]?.focus();
        return;
      }

      case 'Delete':
      case 'Backspace': {
        if (selectedSpan === null) return;
        event.preventDefault();
        onChange(value.filter((_, i) => i !== selectedSpan));
        setSelectedSpan(null);
        return;
      }
    }
  };

  const renderToken = (index: number, insideSpan: boolean) => (
    <button
      key={index}
      type="button"
      data-index={index}
      ref={(el) => {
        tokenRefs.current[index] = el;
      }}
      // Only free tokens can be "pressed" (part of the pending selection).
      aria-pressed={insideSpan ? undefined : range !== null && index >= range.lo && index <= range.hi}
      onClick={(event) => handleTokenClick(index, event)}
    >
      {tokens[index]}
    </button>
  );

  // Render loop: either a bare button or a <mark> wrapping a run of buttons.
  const rendered: ReactNode[] = [];
  for (let i = 0; i < tokens.length; ) {
    const spanIndex = spanAt[i];
    if (spanIndex === undefined) {
      rendered.push(renderToken(i, false));
      i++;
      continue;
    }

    const span = value[spanIndex];
    const children: ReactNode[] = [];
    for (let j = span.start; j <= span.end; j++) children.push(renderToken(j, true));
    rendered.push(
      <mark
        key={`span-${spanIndex}`}
        aria-label={`${span.label}: ${textOf(span)}`}
        aria-selected={selectedSpan === spanIndex}
      >
        {children}
      </mark>
    );
    i = span.end + 1;
  }

  return (
    <div>
      <div role="group" aria-label="Tokens" onKeyDown={handleKeyDown}>
        {rendered}
      </div>

      {overlap && <div role="alert">Spans cannot overlap</div>}

      {pending && (
        <div>
          {labels.map((label) => (
            <button key={label} type="button" onClick={() => pickLabel(label)}>
              {label}
            </button>
          ))}
        </div>
      )}

      <ul aria-label="Spans">
        {value.map((span) => (
          <li key={`${span.start}-${span.end}`}>
            {span.label}: {textOf(span)}
          </li>
        ))}
      </ul>
    </div>
  );
}
