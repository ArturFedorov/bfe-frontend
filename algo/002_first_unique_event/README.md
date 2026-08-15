# 002. First Unique Event

**Difficulty:** Easy
**Topics:** Hash Maps, Arrays, Frequency Counting

---

## Description

An observability pipeline receives log batches as arrays of event ids. For
alert de-duplication you need the first event id in the batch that occurs
exactly once — the earliest event nobody else repeated. Implement
`firstUniqueEvent(events)`: given the batch in arrival order, return the id of
the first event whose total count in the batch is exactly 1, or `null` when
every id repeats (or the batch is empty).

## Examples

```ts
firstUniqueEvent(['login', 'click', 'login', 'scroll']); // 'click'
firstUniqueEvent(['a', 'b', 'a', 'b']);                  // null
firstUniqueEvent([]);                                    // null
```

## Constraints

- `events.length` can be up to `100_000`.
- Event ids are case-sensitive strings (`'Login'` and `'login'` are different events).
- An id occurring three or more times is still not unique.
- Return `null` for an empty batch or when no id occurs exactly once.
- "First" means earliest position in the input array.

## Target

O(n) time (at most two passes) with a count map; an O(n²) `indexOf`/nested-scan
solution will fail the large-input test.

## Interviewer follow-up

Events now arrive as an endless stream and you must report the
first-unique-so-far after every single event — how do you avoid re-scanning
history each time, and what does memory look like?
