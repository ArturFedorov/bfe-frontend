import React, { ReactElement, useId, useRef, useState } from 'react';

export interface Suggestion {
  id: string;
  label: string;
  /** The span of text the label applies to. */
  text: string;
  /** 0..1 */
  confidence: number;
  /** Version of the source text these offsets were computed against. */
  textVersion: number;
}

export interface SuggestionsPanelProps {
  suggestions: readonly Suggestion[];
  /** Current version of the source text; suggestions for other versions are stale. */
  textVersion: number;
  /** One call per user decision; accept-all passes every visible id in one call. */
  onAccept: (ids: string[]) => void;
  onReject: (id: string) => void;
}

export const DEFAULT_THRESHOLD = 0.5;

/**
 * Pure filter: keeps order, keeps only suggestions whose `textVersion` matches
 * and whose `confidence >= threshold`.
 */
export function filterSuggestions(
  suggestions: readonly Suggestion[],
  textVersion: number,
  threshold: number,
): Suggestion[] {
  return suggestions.filter((s) => s.textVersion === textVersion && s.confidence >= threshold);
}

const toPercent = (confidence: number) => `${Math.round(confidence * 100)}%`;

/**
 * Model-suggestion triage panel.
 *
 * Fully controlled: the parent owns `suggestions` and `textVersion`; the panel
 * never copies them into state. Internal UI state is only `threshold` and
 * `activeId`. Everything else — the visible list, the discarded count, the
 * active index — is derived on each render, so the cursor can never point at
 * an item that no longer exists (it falls back to the first visible one).
 */
export function SuggestionsPanel({
  suggestions,
  textVersion,
  onAccept,
  onReject,
}: SuggestionsPanelProps): ReactElement {
  const baseId = useId();
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [activeId, setActiveId] = useState<string | null>(null);
  const optionRefs = useRef(new Map<string, HTMLLIElement>());

  const visible = filterSuggestions(suggestions, textVersion, threshold);
  const discarded = suggestions.filter((s) => s.textVersion !== textVersion).length;

  // Derived cursor: the stored id if still visible, otherwise the first item.
  const activeIndex = Math.max(
    0,
    visible.findIndex((s) => s.id === activeId),
  );
  const active = visible[activeIndex] ?? null;
  const optionDomId = (id: string) => `${baseId}-opt-${id}`;

  const moveTo = (index: number) => {
    const clamped = Math.max(0, Math.min(visible.length - 1, index));
    const target = visible[clamped];
    if (!target) return;
    setActiveId(target.id);
    optionRefs.current.get(target.id)?.focus();
  };

  // One handler on the listbox (no window listeners). Keys that originate from
  // the inner Accept/Reject buttons are left alone so Enter on a button does
  // not fire twice (native click + listbox Enter).
  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    if (!active) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveTo(activeIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveTo(activeIndex - 1);
        break;
      case 'Enter':
        event.preventDefault();
        onAccept([active.id]);
        break;
      case 'Delete':
        event.preventDefault();
        onReject(active.id);
        break;
    }
  };

  const acceptAll = () => {
    if (visible.length === 0) return;
    // ONE call = ONE undoable command for the parent.
    onAccept(visible.map((s) => s.id));
  };

  return (
    <div>
      <label>
        Confidence threshold {toPercent(threshold)}
        <input
          type="range"
          aria-label="Confidence threshold"
          min={0}
          max={1}
          step={0.05}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
      </label>

      <button type="button" onClick={acceptAll} disabled={visible.length === 0}>
        Accept all above threshold
      </button>

      {/* Announced when the text changed under previously computed suggestions. */}
      <div role="status" aria-live="polite">
        {discarded > 0 ? `${discarded} suggestions discarded (text changed)` : null}
      </div>

      {visible.length === 0 && <p>No suggestions above threshold</p>}

      <ul
        role="listbox"
        aria-label="Suggestions"
        aria-activedescendant={active ? optionDomId(active.id) : undefined}
        onKeyDown={handleKeyDown}
      >
        {visible.map((s, index) => {
          const isActive = index === activeIndex;
          return (
            <li
              key={s.id}
              id={optionDomId(s.id)}
              ref={(el) => {
                if (el) optionRefs.current.set(s.id, el);
                else optionRefs.current.delete(s.id);
              }}
              role="option"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(s.id)}
            >
              <strong>{s.label}</strong> <span>{s.text}</span> <span>{toPercent(s.confidence)}</span>
              <button type="button" tabIndex={-1} onClick={() => onAccept([s.id])}>
                Accept
              </button>
              <button type="button" tabIndex={-1} onClick={() => onReject(s.id)}>
                Reject
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
