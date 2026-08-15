# 013. Error Variety Window

**Difficulty:** Medium
**Topics:** Sliding Window, Count Map, Variable Window

---

## Description

An incident-triage tool scans an error log — an array of error codes in time order — looking for
the longest stretch where the system was failing in a *focused* way: a contiguous window
containing at most `k` distinct error codes. A long window with few distinct codes points to one
or two root causes; short windows with high variety point to systemic chaos. Given the array of
error codes and the budget `k`, return the length of the longest contiguous window with at most
`k` distinct codes. Track per-code counts as the window grows and shrinks — recounting distinct
codes per candidate window is too slow for real logs.

## Examples

```ts
errorVarietyWindow(['a', 'a', 'b', 'c', 'c', 'c', 'b'], 2); // 5  ('b','c','c','c','b')
errorVarietyWindow(['a', 'b', 'b', 'b', 'a'], 1);           // 3  ('b','b','b')
errorVarietyWindow(['a', 'b', 'c'], 3);                     // 3  (the whole log)
```

## Constraints

- `codes.length` is between `0` and `100_000`; codes are non-empty strings, case-sensitive.
- `k` is a non-negative integer. `k = 0` returns `0` (no window may contain any code).
- An empty log returns `0`.
- When `k` is at least the number of distinct codes overall, the answer is `codes.length`.
- All-identical codes with `k >= 1` return `codes.length`.

## Target

O(n) time, O(k) space — each index enters and leaves the window once, with a count map tracking
distinct codes; recounting distinct codes for every candidate window (O(n²)) will fail the
large-input test.

## Interviewer follow-up

Triage now wants the answer for the *last hour only*, updated as new errors stream in and old ones
age out of the hour — which parts of your window state survive that change, and which break?
