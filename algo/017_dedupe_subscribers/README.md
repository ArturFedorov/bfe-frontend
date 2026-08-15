# 017. Dedupe Subscribers

**Difficulty:** Very Easy
**Topics:** Two Pointers, Arrays, In-Place Mutation

---

## Description

A newsletter export produced a lexicographically sorted list of subscriber emails, but repeated
sign-ups left consecutive duplicates in the file. Memory is tight on the batch worker, so you must
deduplicate the list **in place** — no second array. Overwrite the array so that its first `k` slots
hold each unique email exactly once, in their original sorted order, and return `k`. Whatever
remains in the array past index `k - 1` is irrelevant and will be ignored by the caller.

## Examples

```ts
const a = ['a@x.com', 'a@x.com', 'b@x.com', 'c@x.com', 'c@x.com', 'c@x.com'];
dedupeSubscribers(a); // 3 — a is now ['a@x.com', 'b@x.com', 'c@x.com', ...]

const b = ['solo@x.com'];
dedupeSubscribers(b); // 1

dedupeSubscribers([]); // 0
```

## Constraints

- `emails.length` is between `0` and `200_000`.
- The input array is sorted lexicographically, so all duplicates are adjacent.
- Mutate the given array — do not allocate a new one. The same array reference must hold the
  deduplicated prefix after the call.
- Elements past the returned length may hold anything.
- An empty array returns `0`.

## Target

O(n) time, O(1) extra space.

## Interviewer follow-up

The export grows to billions of rows and arrives as a stream that no longer fits in memory — how
does your read/write-pointer idea translate, and what single piece of state do you need to keep?
