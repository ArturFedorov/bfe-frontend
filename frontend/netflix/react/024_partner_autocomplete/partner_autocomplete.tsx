import React, {ReactNode, useEffect, useId, useRef, useState} from 'react';

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

export function PartnerAutocomplete({
  fetchPartners,
  onSelect,
  debounceMs = 300,
  label = 'Partner',
}: PartnerAutocompleteProps): ReactNode {
  const id = useId();
  const inputId = `${id}-input`;
  const listBoxId = `${id}-listbox`;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Partner[]>([]);
  const [open, setOpen] = useState(false);
  const [noResults, setNoResults] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map<string, Partner[]>());

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      abortRef.current?.abort();
    }
  }, []);

  const show = (partners: Partner[]) => {
    setResults(partners);
    setActiveIndex(-1);
    setOpen(partners.length > 0);
    setNoResults(partners.length === 0);
  }

  const runSearch = async (query: string) => {
    abortRef.current?.abort();
    const cached = cacheRef.current.get(query);
    if(cached) {
      requestIdRef.current += 1;
      show(cached);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    try {
      const partners = await fetchPartners(query, { signal: controller.signal });
      if(requestId !== requestIdRef.current) return;
      cacheRef.current.set(query, partners);
      show(partners);
    } catch {

    }
  }

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    if(value === '') {
      abortRef.current?.abort();
      requestIdRef.current += 1;
      setResults([]);
      setOpen(false);
      setNoResults(false);
      setActiveIndex(-1);
      return;
    }
    timerRef.current = setTimeout(() => runSearch(value), debounceMs);
  }

  const select = (partner: Partner) => {
    clearTimeout(timerRef.current);
    abortRef.current?.abort();
    requestIdRef.current += 1;
    onSelect(partner);
    setQuery(partner.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>)=> {
    if(e.key === 'ArrowDown' && open && results.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if(e.key === 'ArrowUp' && open && results.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i -1));
    } else if(e.key === 'Enter') {
      if(open && activeIndex >= 0) {
        e.preventDefault();
        select(results[activeIndex]);
      }
    } else if(e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const highlight = (name: string): ReactNode => {
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if(query === '' || idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark>{name.slice(idx, idx + query.length)}</mark>
        {name.slice(idx + query.length)}
      </>
    )
  }

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listBoxId}
        aria-expanded={open}
        aria-activedescendant={
          activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul role="listbox" id={listBoxId}>
          {results.map((partner, index) =>
            <li
              key={partner.id}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              aria-label={partner.name}
              onClick={() => select(partner)}
            >
              {highlight(partner.name)}
          </li>)}
        </ul>
      )}
      {noResults && <div role="status">No partners found</div>}
    </div>
  )
}
