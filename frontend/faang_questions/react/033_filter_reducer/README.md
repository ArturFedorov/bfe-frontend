# 033. Filter Reducer

Difficulty: Easy

Topics: useReducer, discriminated unions, controlled inputs

## Scenario

The Partner Operations dashboard lists hundreds of content-delivery partners. Ops
engineers filter the table by partner status, by region, and by a free-text search.
Today each filter lives in its own `useState`, and "Clear all" is four separate
setter calls that drift out of sync every time someone adds a filter. Consolidate
the filter bar into a single `useReducer` with a typed action union so there is
exactly one place where filter state can change.

## Acceptance Criteria

- `FilterState` holds `status`, `region`, `search`, and the `defaults` it was
  created with.
- `FilterAction` is a discriminated union: `setStatus`, `setRegion`, `setSearch`,
  `clearAll`.
- `filterReducer` is pure and covers every action; unknown combinations are
  impossible by type.
- `createInitialFilterState(defaults?)` builds the initial state; when no defaults
  are passed it uses `DEFAULT_FILTERS`.
- `clearAll` resets `status`, `region`, and `search` back to the defaults the state
  was created with — custom defaults are preserved, not overwritten with the
  built-ins.
- `FilterBar` wires the reducer to a status select, a region select, a search
  input, and a "Clear all" button. All inputs are labeled and controlled.

## Example

```tsx
const state = createInitialFilterState({ status: 'active', region: 'emea', search: '' });
const next = filterReducer(state, { type: 'setSearch', search: 'acme' });
// next.search === 'acme'
const cleared = filterReducer(next, { type: 'clearAll' });
// cleared.status === 'active', cleared.region === 'emea', cleared.search === ''
```

## Target

- Reducer: pure, exhaustive over the action union, no mutation.
- Component: one `useReducer`, zero `useState` for filter values.
- ~60 lines.

## Interviewer follow-up

- When do you reach for `useReducer` over multiple `useState` calls?
- How would you sync this filter state into the URL query string?
- What changes if the region options are loaded asynchronously?
