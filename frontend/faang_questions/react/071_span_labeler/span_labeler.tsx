import React, {ReactElement, ReactNode, useRef, useState} from 'react';

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

interface Pending {
  anchor: number;
  focus: number;
}

export function SpanLabeler({ tokens, labels, value, onChange}: SpanLabelerProps): ReactElement {
  const [pending, setPending] = useState<Pending | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<number | null>(null);
  const [overlap, setOverlap] = useState(false);
  const tokenRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const spanAt: Array<number | undefined> = tokens.map(() => undefined);
  value.forEach((span, spanIndex) => {
    for(let i = span.start; i <= span.end; i++) spanAt[i] = spanIndex
  });

  const range = pending
    ? { lo: Math.min(pending.anchor, pending.focus), hi: Math.max(pending.anchor, pending.focus) }
    : null;

  const textOf = (span: Span) => tokens.slice(span.start, span.end + 1).join(' ');

  const startSelection = (index: number) => {
    setPending({ anchor: index, focus: index });
    setSelectedSpan(null);
    setOverlap(false);
  }

  const extendSelection = (target: number) => {
    if(!pending || target < 0 || target >= tokens.length) return;
    const lo = Math.min(pending.anchor, target);
    const hi = Math.max(pending.anchor, target);

    for(let i = lo; i <= hi; i++) {
        if(spanAt[i] !== undefined) {
          setOverlap(true)
          return;
        }
    }
    setPending({ anchor: pending.anchor, focus: target });
    setOverlap(false);
   }

   const handleTokenClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
      if(event.shiftKey && pending) {
        extendSelection(index);
        return;
      }

      const spanIndex = spanAt[index];
      if(spanIndex !== undefined) {
        setSelectedSpan(spanIndex);
        setPending(null);
        setOverlap(false);
        return;
      }

      startSelection(index);
   }

   const pickLabel = (label: string) => {
      if(!range) return;
      onChange([...value, { start: range.lo, end: range.hi, label }]);
      setPending(null);
      setOverlap(false);
   }

   const handKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const focused = Number(target.dataset.index);
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowLeft':
          event.preventDefault();
          const step = event.key === 'ArrowRight' ? 1 : -1;
          if(event.shiftKey) {
            if(pending) extendSelection(pending.focus + step);
            return;
          }

          if(Number.isNaN(focused)) return;
          const next = Math.max(0, Math.min(tokens.length - 1, focused + step));
          tokenRefs.current[next]?.focus();
          return;

        case 'Delete':
        case 'Backspace':
          if(selectedSpan === null) return;
          event.preventDefault();
          onChange(value.filter(((_, i) => i !== selectedSpan)))
          setSelectedSpan(null);
          return;
      }
   }

   const renderToken = (index: number, isSpan: boolean) => (
     <button
      key={index}
      type="button"
      data-index={index}
      ref={(el) => {
        tokenRefs.current[index] = el;
      }}
      aria-pressed={isSpan ? undefined : range !== null && index >= range.lo && index <= range.hi}
      onClick={(event) => handleTokenClick(index, event)}
     >
       {tokens[index]}
     </button>
   )

  const rendered: ReactNode[] = [];

  for(let i = 0; i < tokens.length;) {
    const spanIndex = spanAt[i];
    if(spanIndex === undefined) {
      rendered.push(renderToken(i, false));
      i++;
      continue;
    }
    const span = value[spanIndex];
    const children: ReactNode[] = [];
    for(let j = span.start; j <= span.end; j++) children.push(renderToken(j, true));
    rendered.push(
      <mark
        key={`span-${spanIndex}`}
        aria-label={`${span.label}: ${textOf(span)}`}
        aria-selected={selectedSpan === spanIndex}
      >
        {children}
      </mark>
    )

    i = span.end + 1;
  }

  return (
    <div>
      <div role="group" aria-label="Tokens" onKeyDown={handKeyDown}>
        { rendered }
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
        {value.map((span, i) => (
          <li key={`${span.start}-${span.end}`}>
            {span.label}: {textOf(span)}
          </li>
          ))}
      </ul>
    </div>
  )
}
