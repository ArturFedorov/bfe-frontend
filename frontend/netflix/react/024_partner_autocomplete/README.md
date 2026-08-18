# 024. Partner Autocomplete

**Difficulty:** Hard
**Topics:** Debounce, AbortController, Combobox A11y, Keyboard Navigation

---

## Scenario

The capstone. Every internal tool at the studio has a partner picker: type a
few characters, get matching partners from the search API, pick one with the
keyboard. It must not spam the API on every keystroke, must never show results
for a query the user has already typed past (the classic fast-typer race), and
must be a real WAI-ARIA combobox — ops navigate it by keyboard all day.

## Acceptance Criteria

- Input is a labelled `role="combobox"` with `aria-autocomplete="list"`,
  `aria-controls` pointing at the listbox id, and `aria-expanded` reflecting
  whether the popup is open.
- Typing is debounced by `debounceMs` (default 300): no fetch until the user
  pauses; rapid keystrokes collapse into ONE `fetchPartners(query, { signal })`
  call with the final query.
- Each new request aborts the previous one via its `AbortSignal`, and a stale
  response that settles late must never overwrite newer results.
- Clearing the input closes the popup, aborts any in-flight request, and a
  late resolution renders nothing.
- Results render in a `role="listbox"` of `role="option"` items; the matched
  substring of each partner name is wrapped in `<mark>` (case-insensitive).
  Each option's accessible name must be the full partner name — highlight
  markup fragments the computed name, so set an explicit `aria-label`.
- Empty results show `'No partners found'` with `role="status"`; the popup
  stays closed (`aria-expanded="false"`).
- Keyboard: ArrowDown/ArrowUp move the active option (wrapping at the ends),
  reflected by `aria-activedescendant` on the input and `aria-selected` on the
  option — no active option until the first ArrowDown. Enter selects the
  active option: calls `onSelect(partner)`, puts the name in the input, and
  closes the popup. Escape closes the popup and keeps the text. Enter with no
  popup or no active option does nothing.
- Clicking an option selects it like Enter does.

## Example

```tsx
<PartnerAutocomplete
  fetchPartners={(query, opts) => api.searchPartners(query, opts)}
  onSelect={(partner) => setPartnerId(partner.id)}
  debounceMs={300}
/>
// "net" → (300ms) → one fetch → ArrowDown ArrowDown Enter → onSelect(Nordic…)
```

## Target

45–60 minutes. Senior signals: debounce timer + AbortController + request-id
guard working together, wrap-around index arithmetic without special cases,
and the full combobox contract (expanded/activedescendant/selected) kept
consistent through every path — type, select, escape, clear.

## Interviewer follow-up

Where would `useDeferredValue` or a debounced-value hook (your 010) change
this design, and why does debouncing the fetch — not the input value — matter
for `aria-activedescendant` correctness while results are stale?
