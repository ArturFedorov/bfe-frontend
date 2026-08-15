# 003. Dynamic Array

**Difficulty:** Easy
**Topics:** Arrays, Amortized Analysis, Data Structure Design

---

## Description

Your team is porting a collections library and needs a growable array built on
fixed-size storage — the structure behind `ArrayList` and JavaScript's own
arrays. Implement `DynamicArray<T>` with a distinction between `length` (items
stored) and `capacity` (slots allocated). When a `push` finds the storage full,
double the capacity and copy the elements over. To make the growth policy
observable and gradeable, the class also exposes `resizeCount` — how many
doublings have happened so far.

## Examples

```ts
const arr = new DynamicArray<number>(); // default initial capacity 4
arr.push(1);
arr.push(2);
arr.length;      // 2
arr.capacity;    // 4
arr.resizeCount; // 0

arr.push(3);
arr.push(4);
arr.push(5);     // 5th item — storage was full, capacity doubles
arr.capacity;    // 8
arr.resizeCount; // 1
arr.toArray();   // [1, 2, 3, 4, 5]
```

## Constraints

- `initialCapacity` defaults to `4`; if provided it must be a positive integer, otherwise the constructor throws `RangeError`.
- Capacity only ever changes by doubling when a `push` finds `length === capacity`; it never shrinks.
- `get(i)` throws `RangeError` for any index outside `[0, length)`.
- `toArray()` returns a new array copy — mutating it must not affect the DynamicArray.
- Duplicate values are allowed.

## Target

Amortized O(1) `push` (copy only on resize); an implementation that copies all
elements on every push will fail the 100k-push large-input test.

## Interviewer follow-up

Why double the capacity instead of growing by a fixed 1000 slots each time?
Compare the total number of element copies over n pushes for both strategies.
