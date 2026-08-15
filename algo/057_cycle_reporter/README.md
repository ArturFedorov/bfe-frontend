# 057. Cycle Reporter

**Difficulty:** Hard
**Topics:** Cycle Detection, DFS, Path Reconstruction

---

## Description

Your build tool currently fails with a bare `"cycle detected"` — useless to whoever
has to fix the manifest. Upgrade the error: given the dependency map, return **one
actual cycle** as a path of node ids, so the message can read
`"cycle: a -> b -> c -> a"`. The path starts and ends with the same id, every
consecutive pair follows a dependency edge (`path[i]` depends on `path[i + 1]`), and
no other id repeats. If the graph has several cycles, returning any one of them is
correct. If the graph is acyclic, return `null`.

## Examples

```ts
findCycle({ a: ['b'], b: ['c'], c: ['a'] });
// ['a', 'b', 'c', 'a']  (or ['b', 'c', 'a', 'b'], etc. — any real cycle)

findCycle({ a: ['a'] });
// ['a', 'a']  (self-dependency is a length-1 cycle)

findCycle({ a: ['b'], b: [] });
// null
```

## Constraints

- Input is `Record<string, string[]>`: each key depends on every id in its array; every id that appears in an array is also a key.
- Cycles are possible — that is the whole point. Never throw; return `null` when the graph is acyclic.
- The returned path must satisfy: `path[0] === path[path.length - 1]`, at least one edge (`length >= 2`), every consecutive pair `(path[i], path[i + 1])` is an edge (`graph[path[i]]` contains `path[i + 1]`), and interior ids are all distinct (a simple cycle).
- Any valid cycle is accepted — tests verify the returned path against the graph rather than comparing to a hardcoded answer — but the function must be deterministic for a given input.
- Do not mutate the input graph.

## Target

O(V + E) — one DFS pass, reconstructing the path from the gray stack.

## Interviewer follow-up

The moment your DFS steps onto a gray node, how exactly do you recover the cycle path — and why must you slice the current DFS stack rather than use the visited set?
