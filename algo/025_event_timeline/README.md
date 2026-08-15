# 025. Event Timeline

**Difficulty:** Easy
**Topics:** Sorting, Comparators, Tie-breaks

---

## Description

A dashboard renders a mixed feed of events — deploys, alerts, releases — and
the product spec is precise about ordering: events appear by **date ascending**
(oldest first); events on the same date are ordered by **priority descending**
(most important first); events that also tie on priority are ordered by
**name ascending** (plain lexicographic `<` on the string, no locale rules).
Events identical on all three keys must keep their original relative order.
Write `sortTimeline`, which returns a **new** sorted array and leaves the input
untouched. The bug being screened for here is the classic comparator mistake:
getting one key's direction wrong, or letting a later key override an earlier
one.

## Examples

```ts
sortTimeline([
  { name: 'deploy', date: 200, priority: 1 },
  { name: 'alert', date: 100, priority: 5 },
]);
// [ { name: 'alert', ... date: 100 }, { name: 'deploy', ... date: 200 } ]

sortTimeline([
  { name: 'release', date: 100, priority: 1 },
  { name: 'outage', date: 100, priority: 9 },
]);
// same date -> priority DESC: [ 'outage' (9), 'release' (1) ]

sortTimeline([
  { name: 'beta', date: 100, priority: 3 },
  { name: 'alpha', date: 100, priority: 3 },
]);
// same date and priority -> name ASC: [ 'alpha', 'beta' ]
```

## Constraints

- `0 <= events.length <= 100_000`
- `date` and `priority` are integers; `name` is a non-empty string
- Tie-break order is exactly: date **asc**, then priority **desc**, then name **asc**
- Events equal on all three keys keep their original relative order (stable)
- Return a new array; do not mutate the input
- `Array.prototype.sort` with your own comparator is fine here

## Target

O(n log n) time, O(n) space for the returned array.

## Interviewer follow-up

What can go wrong at runtime if a comparator is inconsistent (e.g. not
transitive, or returns different signs for the same pair on different calls)?
