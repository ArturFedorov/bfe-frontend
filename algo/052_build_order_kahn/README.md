# 052. Build Order (Kahn's Algorithm)

**Difficulty:** Easy
**Topics:** Topological Sort, Kahn's Algorithm, Graphs

---

## Description

You are writing the scheduler for a build tool. The build manifest maps each target
to the targets it depends on; a target may only be built after every one of its
dependencies has been built. Produce a build order containing every target exactly
once. Implement **Kahn's algorithm**: compute in-degrees, seed a queue with all
dependency-free targets, and repeatedly pop a target and decrement its dependents.
If the manifest contains a dependency cycle, no valid order exists — throw an error.

## Examples

```ts
const manifest = {
  app: ['lib', 'assets'],
  lib: ['utils'],
  assets: [],
  utils: [],
};

buildOrder(manifest);
// ['utils', 'assets', 'lib', 'app']  (one valid order — any order where
// every dependency precedes its dependents is accepted)

buildOrder({ a: ['b'], b: ['a'] }); // throws (cycle)
```

## Constraints

- Input is `Record<string, string[]>`: each key depends on every id in its array; every id that appears in an array is also a key.
- Cycles are possible — **throw an `Error`** when one exists (the queue drains before all targets are emitted).
- The result must contain every key exactly once, with every dependency appearing before each of its dependents.
- Multiple valid orders usually exist; any valid one is accepted, but the function must be deterministic for a given input.
- Do not mutate the input graph.

## Target

O(V + E) time, O(V + E) space.

## Interviewer follow-up

In Kahn's algorithm, how do you know a cycle exists without ever finding the cycle itself — and where do disconnected, dependency-free targets naturally end up?
