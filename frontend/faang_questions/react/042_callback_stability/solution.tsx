import { memo, useCallback, useMemo, useState } from 'react';

// FIXED — stabilize exactly what the memo boundaries consume; drop the
// memoization that could never pay for itself.
//
// Fixes (and why each matters):
// 1. `handleQueryChange` / `handleCategoryChange` are `useCallback(..., [])`.
//    The inline arrows `(value) => setQuery(value)` were new identities on
//    every render, so the memoized SearchBox/CategorySelect failed their
//    shallow compare every time and re-rendered on each other's changes. State
//    setters are already stable, so the callbacks need no dependencies.
// 2. `items` is `useMemo`'d on `[query, category]`. `CATALOG.filter(...)`
//    returned a brand-new array on every render, which both re-ran the filter
//    needlessly and defeated ResultList's memo. Now the array identity only
//    changes when an input to the filter changes.
// 3. The `useMemo` around the summary string was deleted (marker comment and
//    all) and replaced with a plain template literal. Its deps
//    (`query`, `category`, `items.length`) change on every meaningful render,
//    so the cache never hit; React still had to store the deps array and the
//    memoized value, compare 3 deps per render, and retain the closure. For a
//    ~40-char string built in nanoseconds that is strictly more work than just
//    building it. Rule: memoize only when a memo boundary / effect dep consumes
//    the identity, or the computation is provably expensive.

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

  // Fix 1: stable handlers. `setQuery`/`setCategory` never change identity,
  // so an empty deps array is correct and these are created exactly once.
  const handleQueryChange = useCallback((value: string) => setQuery(value), []);
  const handleCategoryChange = useCallback((value: string) => setCategory(value), []);

  // Fix 2: derive once per (query, category) change; same array reference
  // otherwise, so ResultList's memo can hold.
  const items = useMemo(
    () =>
      CATALOG.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) &&
          (category === 'all' || item.category === category),
      ),
    [query, category],
  );

  // Fix 3: a cheap string whose inputs change on every meaningful render —
  // just build it. Nothing downstream depends on its identity.
  const summary = `"${query}" in ${category}: ${items.length} result(s)`;

  return (
    <section>
      <SearchBox value={query} onChange={handleQueryChange} onRender={onRender} />
      <CategorySelect
        value={category}
        onChange={handleCategoryChange}
        onRender={onRender}
      />
      <p>{summary}</p>
      <ResultList items={items} onRender={onRender} />
    </section>
  );
}
