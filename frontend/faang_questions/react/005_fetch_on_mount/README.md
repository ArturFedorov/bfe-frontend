# 005. Fetch on Mount

**Difficulty:** Medium
**Topics:** useEffect, Fetch, Async States, Cleanup

---

## Scenario

The partner portal home page lists every partner organization the current ops
team supports. The list comes from an internal API and must be loaded once when
the page mounts. The previous version had all the classic gaps: no loading
indicator (the page just looked empty), HTTP errors rendered as a blank list,
an actually-empty list looked like an error, and navigating away mid-request
triggered a state update on an unmounted component. Build the list component
with all four states handled explicitly and a cleanup that ignores late
responses.

## Acceptance Criteria

- On mount, requests `endpoint` (default `/api/partners`) exactly once via
  `fetch`.
- While pending, shows `Loading partners…` in an element with `role="status"`.
- Non-OK HTTP responses and network rejections render an error message in an
  element with `role="alert"`.
- An empty (`[]`) response renders `No partners found.` — distinct from the
  error state.
- A non-empty response renders a `role="list"` named `Partners` with one
  `role="listitem"` per partner showing its name.
- If the component unmounts while the request is in flight, the late response
  is ignored — no state update after unmount, no console errors.

## Example

```ts
<PartnerList />
<PartnerList endpoint="/api/partners?region=emea" />

// Partner shape:
// { id: 'p1', name: 'Pixelworks Studio' }
```

## Target

All four request states (loading / error / empty / success) are explicit and mutually exclusive, and an unmounted component never touches state.

## Interviewer follow-up

Your cleanup uses an `ignore` flag. What does switching to `AbortController`
buy you beyond what the flag already does?
