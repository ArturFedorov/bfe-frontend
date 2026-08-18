# 010. useDebouncedValue

**Difficulty:** Easy
**Topics:** Custom Hooks, useEffect Cleanup, Timers, Debouncing

---

## Scenario

The partner search box in the integrations dashboard fires a backend query on
every keystroke — ops typed "warner bros discovery" and produced 21 requests.
The fetching layer is someone else's task; yours is the input half:
`useDebouncedValue(value, ms)` returns a trailing-edge debounced copy of any
value, so the fetch effect can simply depend on the debounced string.

## Acceptance Criteria

- `useDebouncedValue<T>(value, ms)` returns the debounced value; on first
  render it returns `value` immediately (no initial delay).
- When `value` changes, the returned value updates only after `ms`
  milliseconds have elapsed with no further changes (trailing edge).
- Every change of `value` before the timer fires **cancels and restarts** the
  timer — rapid changes produce exactly one update, with the latest value.
- Strictly before `ms` has elapsed the hook still returns the previous value
  (at `ms - 1` nothing has changed yet).
- Unmounting clears any pending timer — no timer leaks, no state updates
  after unmount.
- The hook is generic: works for strings, numbers, objects — anything.

## Example

```ts
function PartnerSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    // fires once per pause in typing, not once per keystroke
    searchPartners(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search partners" />;
}
```

## Target

One `useState` + one `useEffect` whose cleanup is the entire debounce logic —
if you reach for a ref, you are overcomplicating it.

## Interviewer follow-up

Product now wants the first keystroke to search immediately and only
subsequent ones debounced (leading + trailing). What changes, and why does
that variant suddenly need a ref?
