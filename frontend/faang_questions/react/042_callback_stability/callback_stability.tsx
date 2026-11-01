import { memo, useMemo, useState } from 'react';

// TODO: fix the performance problem below
//
// Symptom: typing in the search box re-renders the (memoized!) category
// select and vice versa — the memo boundaries exist but every render hands
// them freshly created callbacks and arrays, so they never bail out. There
// is also one useMemo that HURTS: it caches a trivial string whose deps
// change on every meaningful render anyway. Remove it (and its
// `OVER-MEMOIZED` marker comment) — memoization is not free.
//
// Apply useCallback/useMemo ONLY where they let a memo boundary hold.
// Behavior must not change.

export type CatalogItem = {
  id: string;
  name: string;
  category: 'movies' | 'series';
};

export const CATALOG: CatalogItem[] = [
  { id: 'c1', name: 'Arcadia', category: 'movies' },
  { id: 'c2', name: 'Blackout', category: 'series' },
  { id: 'c3', name: 'Cascade', category: 'movies' },
  { id: 'c4', name: 'Daybreak', category: 'series' },
  { id: 'c5', name: 'Ember', category: 'movies' },
  { id: 'c6', name: 'Foxtrot', category: 'series' },
  { id: 'c7', name: 'Gravity', category: 'movies' },
  { id: 'c8', name: 'Horizon', category: 'series' },
];

type Probe = { onRender?: (id: string) => void };

const SearchBox = memo(function SearchBox({
  value,
  onChange,
  onRender,
}: Probe & { value: string; onChange: (value: string) => void }) {
  onRender?.('search-box');
  return (
    <label>
      Search
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
});

const CategorySelect = memo(function CategorySelect({
  value,
  onChange,
  onRender,
}: Probe & { value: string; onChange: (value: string) => void }) {
  onRender?.('category-select');
  return (
    <label>
      Category
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="all">all</option>
        <option value="movies">movies</option>
        <option value="series">series</option>
      </select>
    </label>
  );
});

const ResultList = memo(function ResultList({
  items,
  onRender,
}: Probe & { items: CatalogItem[] }) {
  onRender?.('result-list');
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name} ({item.category})
        </li>
      ))}
    </ul>
  );
});

export function FilterPanel({ onRender }: Probe) {
  onRender?.('panel');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  // A fresh array every render — the ResultList memo can never hold, and
  // the filter runs even when neither input changed.
  const items = CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (category === 'all' || item.category === category)
  );

  // OVER-MEMOIZED: this string is cheap to build and its deps change on
  // every meaningful render, so the cache never hits — pure overhead.
  // Remove this useMemo (and this comment); assign the string directly.
  const summary = useMemo(
    () => `"${query}" in ${category}: ${items.length} result(s)`,
    [query, category, items.length]
  );

  return (
    <section>
      <SearchBox
        value={query}
        onChange={(value) => setQuery(value)}
        onRender={onRender}
      />
      <CategorySelect
        value={category}
        onChange={(value) => setCategory(value)}
        onRender={onRender}
      />
      <p>{summary}</p>
      <ResultList items={items} onRender={onRender} />
    </section>
  );
}
