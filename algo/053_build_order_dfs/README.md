# 053. Build Order (DFS Three-Color)

**Difficulty:** Medium
**Topics:** Topological Sort, DFS, Cycle Detection

---

## Description

Same build-scheduler problem as task 052: a manifest maps each target to the targets
it depends on, and you must produce an order in which every dependency builds before
its dependents — but this time the **method is the point**. Implement it as a
**DFS post-order** walk with **three-color cycle detection**: every node is *white*
(unvisited), *gray* (on the current DFS path), or *black* (fully processed). Visiting
a gray node means you have walked back onto your own path — that is a dependency
cycle, and you must throw. A node is appended to the output only after all of its
dependencies are done (post-order), so the finished list is already a valid build
order. **Kahn's algorithm (in-degrees + queue) is explicitly forbidden here.**

Note: the tests can only check observable behavior — a valid topological order and
throwing on cycles — so the DFS-with-colors requirement is on your honor. It is the
approach the interviewer actually wanted, so practice it as specified.

## Examples

```ts
const manifest = {
  app: ['lib', 'assets'],
  lib: ['utils'],
  assets: [],
  utils: [],
};

buildOrder(manifest);
// ['utils', 'lib', 'assets', 'app']  (one valid order — any order where
// every dependency precedes its dependents is accepted)

buildOrder({ a: ['b'], b: ['c'], c: ['a'] }); // throws (gray node revisited)
```

## Constraints

- Input is `Record<string, string[]>`: each key depends on every id in its array; every id that appears in an array is also a key.
- Cycles are possible — **throw an `Error`** the moment the DFS reaches a gray (in-progress) node. A plain visited set is not enough: black nodes are safe to re-reach, gray nodes are not.
- The result must contain every key exactly once, with every dependency appearing before each of its dependents.
- Multiple valid orders usually exist; any valid one is accepted, but the function must be deterministic for a given input.
- Method constraint (on your honor): DFS post-order with white/gray/black states — no in-degree counting, no queue.
- Do not mutate the input graph.

## Target

O(V + E) time, O(V) space.

## Interviewer follow-up

Why does reaching a gray node prove a cycle while reaching a black node does not — and what breaks if you use a single boolean visited set instead of three colors?
