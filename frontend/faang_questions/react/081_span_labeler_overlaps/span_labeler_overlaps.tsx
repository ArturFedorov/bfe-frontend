import {ReactElement, useId, useRef, useState, KeyboardEvent} from 'react';

export interface Span {
  id: string;
  /** Inclusive start, in UTF-16 code units (JS string index). Never inside a surrogate pair. */
  start: number;
  /** Exclusive end, in UTF-16 code units. Never inside a surrogate pair. */
  end: number;
  label: string;
}

export interface SpanLabelerProps {
  text: string;
  labels: string[];
  value: Span[];
  onChange: (next: Span[]) => void;
  /** Generates the id for a newly created span. Defaults to `crypto.randomUUID()`. */
  newId?: () => string;
}

const isHigh = (code: number) => code >= 0xd800 && code <= 0xdbff;
const isLow = (code: number) => code >= 0xdc00 && code <= 0xdfff;

function splitsPair(text:string, i : number): boolean {
  return i > 0 && i < text.length && isHigh(text.charCodeAt(i - 1)) && isLow(text.charCodeAt(i));
}

export const snapStart = (text: string, i: number): number => (splitsPair(text, i) ? i - 1 : i);
export const snapEnd = (text: string, i: number): number => (splitsPair(text, i) ? i + 1 : i);

export function nextCodePoint(text: string, i: number): number {
  if(i >= text.length) return text.length;
  const pair = isHigh(text.charCodeAt(i)) && isLow(text.charCodeAt(i + 1));
  return i + (pair ? 2 : 1);
}

export function prevCodePoint(text: string, i: number): number {
  if(i <= 0) return 0;
  const pair = i >= 2 && isLow(text.charCodeAt(i - 1)) && isHigh(text.charCodeAt(i - 2));
  return i - (pair ? 2 : 1);
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  spans: Span[];
}

export function computeSegments(text: string, spans: Span[]): Segment[] {
  const cuts = new Set<number>([0, text.length]);
  for(const s of spans) {
    cuts.add(s.start);
    cuts.add(s.end);
  }

  const points = [...cuts].sort((a, b) => a - b);
  const out: Segment[] = [];
  for(let i = 0; i < points.length -1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if(end <= start) continue;
    out.push({ start, end, text: text.slice(start, end), spans: spans.filter((s) => s.start <= start && end <= s.end)});
  }

  return out;
}

interface Pending {
  start: number;
  end: number;
}

export function SpanLabeler({
  text,
  labels,
  value,
  onChange,
  newId = () => crypto.randomUUID(),
}: SpanLabelerProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = useId();

  const [pending, setPending] = useState<Pending | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const segments = computeSegments(text, value);
  const selectedSpan = selectedId === null ? null : (value.find((s) => s.id === selectedId) ?? null);

  const offsetOf = (node: Node | null, offset: number): number | null => {
    const container = containerRef.current;
    if(!node || !container || !container.contains(node)) return null;

    const el = node instanceof Element ? node : node.parentElement;
    const segment = el?.closest<HTMLElement>('[data-segment]');

    if(!segment) return null;
    return Number(segment.dataset.start) + offset;
  }

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if(!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const a = offsetOf(sel.anchorNode, sel.anchorOffset);
    const f = offsetOf(sel.focusNode, sel.focusOffset);
    if(a === null || f === null) return;
    const start = snapStart(text, Math.min(a, f));
    const end = snapEnd(text, Math.max(a, f));

    if(end <= start) return;
    setPending({ start, end });
    setSelectedId(null);
  }

  const handleSegmentClick = (segment: Segment) => {
    setSelectedId(segment.spans.length === 1 ? segment.spans[0].id : null);
    if(segment.spans.length === 1) setPending(null);
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if(event.key === 'Escape') {
      setPending(null);
      setSelectedId(null);
      return;
    }

    if(event.key === 'Delete' || event.key === 'Backspace') {
      if(!selectedSpan) return;
      event.preventDefault();
      onChange(value.filter((s) => s.id !== selectedSpan.id));
      setSelectedId(null);
      return;
    }
    if(pending && event.shiftKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault();
      const end = event.key === 'ArrowRight' ? nextCodePoint(text, pending.end) : prevCodePoint(text, pending.end);
      if(end > pending.start) setPending({ start: pending.start, end });
    }
  }

  const addSpan = (label: string) => {
    if(!pending) return;
    onChange([...value, { id: newId(), start: pending.start, end: pending.end, label }]);
    setPending(null);
  }

  const relabel = (label: string) => {
    if(!selectedSpan) return;
    onChange(value.map((s) => (s.id === selectedSpan.id ? { ...s, label} : s)));
  }

  const labelOptions = selectedSpan && !labels.includes(selectedSpan.label) ? [selectedSpan.label, ...labels] : labels;

  return (
    <div>
      <div ref={containerRef} role="group" aria-label="Text" onMouseUp={handleMouseUp} onKeyDown={handleKeyDown}>
        {segments.map((segment) => {
          const names = segment.spans.map((s) => s.label).join(',');
          const selected = selectedSpan !== null && segment.spans.some((s) => s.id === selectedSpan.id);

          return(
            <span
              key={segment.start}
              data-segment=""
              data-start={segment.start}
              data-end={segment.end}
              data-labels={names}
              aria-label={names ? `${names}: ${segment.text}` : undefined}
              aria-selected={selected || undefined}
              tabIndex={0}
              onClick={() => handleSegmentClick(segment)}
            >
              {segment.text}
            </span>
          )
        })}
      </div>

      {pending && (
        <div role="group" aria-label="Labels">
          {labels.map((label) => (
            <button key={label} type="button" onClick={() => addSpan(label)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {selectedSpan && (
        <div>
          <label htmlFor={selectId}>Label</label>
          <select id={selectId} value={selectedSpan.label} onChange={(e) => relabel(e.target.value)}>
            {labelOptions.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <ul aria-label="Spans">
        {value.map((s) => (
          <li key={s.id}>
            {s.label}: {text.slice(s.start, s.end)}
          </li>
        ))}
      </ul>
    </div>
  )
}
