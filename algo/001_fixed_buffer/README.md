# 001. Fixed-Capacity Metrics Buffer

**Difficulty:** Very Easy
**Topics:** Arrays, Data Structure Design, API Contracts

---

## Description

A metrics agent collects samples into a pre-allocated, fixed-capacity buffer
before flushing them to the backend. Implement `FixedBuffer<T>`: it is created
with a fixed capacity, accepts new items via `push`, exposes random access via
`get`, and reports how many items it currently holds via `size`. The buffer
never grows — once it is full, further pushes are an error the caller must
handle (the flush loop is responsible for draining it).

## Examples

```ts
const buf = new FixedBuffer<number>(3);
buf.push(10);
buf.push(20);
buf.size();   // 2
buf.get(0);   // 10
buf.get(1);   // 20
buf.push(30);
buf.push(40); // throws Error — buffer is full
```

## Constraints

- `capacity` must be a positive integer; the constructor throws `RangeError` otherwise.
- `push` throws `Error` when the buffer already holds `capacity` items.
- `get(i)` throws `RangeError` for any index outside `[0, size())`.
- Duplicate values are allowed and stored independently.
- Items can be of any type `T` (numbers, strings, objects).

## Target

O(1) per operation (`push`, `get`, `size`); no re-allocation after construction.

## Interviewer follow-up

The agent must now keep only the most recent `capacity` samples instead of
rejecting new ones when full — what changes in your design, and what does each
operation cost afterwards?
