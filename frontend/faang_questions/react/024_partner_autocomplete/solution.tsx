import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface Partner {
  id: string;
  name: string;
}

export interface PartnerAutocompleteProps {
  fetchPartners: (
    query: string,
    opts?: { signal?: AbortSignal }
  ) => Promise<Partner[]>;
  onSelect: (partner: Partner) => void;
  debounceMs?: number;
  label?: string;
}

/**
 * Popup state as a discriminated union: an open popup always has results and
 * an active index, so "expanded with nothing to show" is unrepresentable.
 * `activeIndex === -1` means no option is active yet (before the first
 * ArrowDown).
 */
type Popup =
  | { kind: 'closed' }
  | { kind: 'empty' }
  | { kind: 'open'; results: Partner[]; activeIndex: number };

const CLOSED: Popup = { kind: 'closed' };

/** Wrap the case-insensitive match of `query` inside `name` in <mark>. */
function highlight(name: string, query: string): ReactNode {
  const start = name.toLowerCase().indexOf(query.toLowerCase());
  if (query === '' || start === -1) return name;
  const end = start + query.length;
  return (
    <>
      {name.slice(0, start)}
      <mark>{name.slice(start, end)}</mark>
      {name.slice(end)}
    </>
  );
}

export function PartnerAutocomplete({
  fetchPartners,
  onSelect,
  debounceMs = 300,
  label = 'Partner',
}: PartnerAutocompleteProps): ReactNode {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const [query, setQuery] = useState('');
  const [popup, setPopup] = useState<Popup>(CLOSED);

  // Debounce timer + the controller of the request currently in flight.
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  /** Cancel anything pending: the not-yet-fired debounce and the in-flight request. */
  const cancelPending = () => {
    clearTimeout(timerRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
  };

  // Unmount: nothing may fire or settle into state afterwards.
  useEffect(() => cancelPending, []);

  const search = async (q: string) => {
    // Each request gets its own controller; starting a new one aborts the
    // previous. The controller's `signal.aborted` is then the single
    // staleness guard: every path that makes this response obsolete (newer
    // query, clear, select, unmount) goes through abort(), so a separate
    // run-id would be redundant here.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const results = await fetchPartners(q, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setPopup(results.length > 0 ? { kind: 'open', results, activeIndex: -1 } : { kind: 'empty' });
    } catch {
      // Aborted → expected, nothing to do. Any other failure: show nothing
      // rather than stale options for a query the user has moved past.
      if (controller.signal.aborted) return;
      setPopup(CLOSED);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    cancelPending();

    if (value.trim() === '') {
      // Clearing closes the popup; the abort above makes any late response a no-op.
      setPopup(CLOSED);
      return;
    }

    // Debounce: only the keystroke that survives `debounceMs` of silence fetches.
    timerRef.current = setTimeout(() => void search(value), debounceMs);
  };

  const select = (partner: Partner) => {
    cancelPending(); // selection must not trigger (or be overwritten by) a fetch
    setQuery(partner.name);
    setPopup(CLOSED);
    onSelect(partner);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (popup.kind !== 'open') return;
        e.preventDefault(); // keep the caret where it is
        const n = popup.results.length;
        const i = popup.activeIndex;
        // Wrap at both ends; -1 (nothing active) goes to first / last.
        const next = e.key === 'ArrowDown' ? (i + 1) % n : i <= 0 ? n - 1 : i - 1;
        setPopup({ ...popup, activeIndex: next });
        return;
      }
      case 'Enter': {
        if (popup.kind !== 'open' || popup.activeIndex < 0) return; // nothing to select
        e.preventDefault();
        select(popup.results[popup.activeIndex]);
        return;
      }
      case 'Escape': {
        setPopup(CLOSED); // close, keep the typed text
        return;
      }
    }
  };

  const isOpen = popup.kind === 'open';
  const activeId = isOpen && popup.activeIndex >= 0 ? optionId(popup.activeIndex) : undefined;

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={activeId}
        autoComplete="off"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <ul id={listboxId} role="listbox">
          {popup.results.map((partner, index) => (
            <li
              key={partner.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === popup.activeIndex}
              // The <mark> fragments the computed name; give AT the full name.
              aria-label={partner.name}
              // Prevent the input from losing focus before the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(partner)}
            >
              {highlight(partner.name, query)}
            </li>
          ))}
        </ul>
      )}

      {popup.kind === 'empty' && <p role="status">No partners found</p>}
    </div>
  );
}
