# 088. Journey Cycle Check

**Difficulty:** Medium
**Topics:** Graphs, Topological Sort (Kahn), DFS Cycle Detection, BFS Reachability

---

## Description

A **customer journey** in a marketing-automation platform is a directed graph
of steps: "send welcome email" → "wait 2 days" → "if opened, send offer" and
so on. Marketers build journeys in a drag-and-drop editor, which makes it
easy to create an infinite loop, a step nobody can ever reach, or an arrow
pointing at a step that was deleted. Before a journey is published the
backend validates it.

The graph is `{ nodes: string[]; edges: Array<[from, to]> }`. Node ids are
unique; `nodes` order is the author's order and must be respected wherever a
tie exists so that results are deterministic and diffable.

Implement:

1. `topoOrder(g)` — Kahn's algorithm. Returns a topological order of all nodes,
   or `null` when the graph contains a cycle. **Tie-break rule:** whenever
   more than one node has in-degree zero, take the one that appears first in
   `nodes` (not FIFO order of discovery).
2. `findCycle(g)` — iterative-or-recursive DFS with three colours
   (white / grey / black). Visit nodes in `nodes` order and out-edges in
   `edges` order. Return one cycle as a path that **starts and ends with the
   same id** — the node where the back edge lands — e.g. `['b', 'c', 'b']`.
   A self-loop `a → a` is `['a', 'a']`. Return `null` when acyclic. If the
   graph has several cycles, report only the first one found.
3. `unreachable(g, start)` — BFS from `start`; return the ids that were never
   reached, in `nodes` order. Throw `RangeError` when `start` is not a node.
4. `validate(g, start)` — returns
   `{ cycle, unreachable, danglingEdges }`, where `danglingEdges` are the edges
   (in input order) whose `from` or `to` is not in `nodes`. Cycle and
   reachability are computed **on the graph with dangling edges removed**.

`topoOrder`, `findCycle` and `unreachable` silently skip dangling edges; only
`validate` reports them.

## Examples

```ts
const journey = {
  nodes: ['welcome', 'wait', 'offer', 'thanks'],
  edges: [
    ['welcome', 'wait'],
    ['wait', 'offer'],
    ['offer', 'thanks'],
  ],
};

topoOrder(journey);   // ['welcome', 'wait', 'offer', 'thanks']
findCycle(journey);   // null
unreachable(journey, 'welcome'); // []

const looping = {
  nodes: ['a', 'b', 'c', 'd'],
  edges: [['a', 'b'], ['b', 'c'], ['c', 'b'], ['d', 'ghost']],
};

topoOrder(looping);   // null
findCycle(looping);   // ['b', 'c', 'b']
unreachable(looping, 'a'); // ['d']
validate(looping, 'a');
// { cycle: ['b', 'c', 'b'], unreachable: ['d'], danglingEdges: [['d', 'ghost']] }

// Ties go to input order, not discovery order:
topoOrder({ nodes: ['a', 'b', 'c', 'd'], edges: [['b', 'a']] });
// ['b', 'a', 'c', 'd']  — after b is removed, a (index 0) is ready and wins over c and d
```

## Constraints

- `1 <= nodes.length <= 100_000`, `0 <= edges.length <= 300_000`; ids are
  unique non-empty strings.
- Duplicate edges are allowed and must not break any function.
- `topoOrder` must be O((V + E) log V) or better — a min-heap keyed by node
  index, or O(V + E) if you can argue a simpler structure preserves the
  tie-break rule.
- `findCycle` must not blow the stack on a 100k-long chain: use an explicit
  stack or guarantee the recursion depth is safe.
- `unreachable` and `validate` throw `RangeError` when `start` is unknown.
- Do not mutate the input graph.

## Target

O(V + E) for `findCycle`, `unreachable` and `validate`; O((V + E) log V) for
`topoOrder` with a heap.

Senior signal: building the adjacency list and index map once per call;
recovering the cycle from the grey path (the DFS stack) by slicing from the
first occurrence of the back-edge target rather than walking parent pointers
backwards; knowing that Kahn with a plain FIFO queue gives *a* valid order but
not a stable one, and why the product needs stable output.

## Interviewer follow-up

The editor also supports a "wait until event" step that may legitimately loop
back to an earlier step a bounded number of times (max 3 retries). How would
you model that so the cycle checker stops flagging intentional loops but still
catches unbounded ones? And if the journey has 100k steps and the validator
runs on every keystroke, what would you cache between runs?
