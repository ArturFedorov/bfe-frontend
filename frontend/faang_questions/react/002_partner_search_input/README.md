# 002. Partner Search Input

**Difficulty:** Easy
**Topics:** Controlled Components, Events, Labels, a11y

---

## Scenario

The partner portal's directory page has a search box that filters a table of
partner organizations. The table, the URL sync, and an upcoming "recent
searches" feature all need to read the query, so the input must be fully
controlled — the parent owns the value, the input only reports changes. Ops
folks paste long partner IDs, so the box shows a live character counter against
a maximum length, plus a one-click clear button. Build the reusable controlled
input; the parent wiring is out of scope.

## Acceptance Criteria

- Fully controlled: renders exactly `value`, calls `onChange(nextValue)` for
  every edit, and never keeps internal value state — if the parent ignores the
  change, the displayed value must not drift.
- Rendered as a search input with a programmatically associated `<label>`
  (default label text `Search partners`), queryable as `role="searchbox"`.
- Shows a character counter in the form `<length> / <maxLength>`
  (default `maxLength` 50) that updates as the value changes.
- The input enforces `maxLength` via the native attribute.
- A clear button labeled `Clear search` appears only when the value is
  non-empty; clicking it calls `onChange('')`.

## Example

```ts
const [query, setQuery] = useState('');
<PartnerSearchInput value={query} onChange={setQuery} />
<PartnerSearchInput value={query} onChange={setQuery} label="Filter deliveries" maxLength={20} />
```

## Target

The component is a pure function of its props — every displayed character came in through `value`, every edit goes out through `onChange`.

## Interviewer follow-up

What breaks if the component keeps a `useState` copy of `value` "for
performance" and only syncs it up to the parent on blur?
