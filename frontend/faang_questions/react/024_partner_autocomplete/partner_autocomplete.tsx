import {ReactNode, KeyboardEvent, useEffect, useId, useRef, useState} from 'react';

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

type Popup =
  | { kind: 'closed'}
  | { kind: 'empty'}
  | { kind: 'open', results: Partner[], activeIndex: number};

const CLOSED: Popup = { kind: 'closed' };

function highlight(name: string, query: string): ReactNode {
  const start = name.toLowerCase().indexOf(query.toLowerCase());
  if(query === '' || start === -1) return name;
  const end = start + query.length;
  return (
    <>
      {name.slice(0, start)}
      <mark>{name.slice(start, end)}</mark>
      {name.slice(end)}
    </>
  )
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
  const optionsId = (index: number) => `${baseId}-option-${index}`;

  const [query, setQuery] = useState('');
  const [popup, setPopup] = useState<Popup>(CLOSED);

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const cancelPending = () => {
    clearTimeout(timerRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
  }

  useEffect(() => cancelPending, []);

  const search = async (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const results = await fetchPartners(q, { signal: controller.signal });
      if(controller.signal.aborted) return;
      setPopup(results.length > 0 ? { kind: 'open', results, activeIndex: -1} : { kind: 'empty' });
    } catch {
      if(controller.signal.aborted) return;
      setPopup(CLOSED);
    }
  }

  const handleChange = (value: string) => {
    setQuery(value);
    cancelPending();

    if(value.trim() === '') {
      setPopup(CLOSED);
      return;
    }

    timerRef.current = setTimeout(() => void search(value), debounceMs);
  }

  const select = (partner: Partner) => {
    cancelPending();
    setQuery(partner.name);
    setPopup(CLOSED);
    onSelect(partner);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>)=> {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if(popup.kind !== 'open') return;
        e.preventDefault();
        const n = popup.results.length;
        const i = popup.activeIndex;

        const next = e.key === 'ArrowDown' ? (i + 1) % n : i <= 0 ? n - 1 : i - 1;
        setPopup({ ...popup, activeIndex: next });
        return;
      }
      case 'Enter': {
        if(popup.kind !== 'open' || popup.activeIndex < 0) return;
        e.preventDefault();
        select(popup.results[popup.activeIndex]);
        return;
      }
      case 'Escape': {
        setPopup(CLOSED);
        return;
      }
    }
  }

  const isOpen = popup.kind === 'open';
  const activeId = isOpen && popup.activeIndex >= 0 ? optionsId(popup.activeIndex) : undefined;

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
                      id={optionsId(index)}
                      role="option"
                      aria-selected={index === popup.activeIndex}
                      aria-label={partner.name}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => select(partner)}
                  >{highlight(partner.name, query)}
                  </li>))}
            </ul>
        )}

        {popup.kind === 'empty' && <p role="status">No partners found</p>}
      </div>
  )
}
