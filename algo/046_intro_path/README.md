# 046. Intro Path

**Difficulty:** Medium
**Topics:** BFS, Shortest Path, Path Reconstruction

---

## Description

Your company's internal networking tool knows who has worked with whom: an undirected list of
connections between people. When someone wants to meet a person they don't know, the tool suggests
an introduction chain — "ask Ana to introduce you to Bo, who can introduce you to Kim". Given the
connection list and two person ids, return the **shortest** such chain as an array of ids starting
with `from` and ending with `to`, where every adjacent pair in the array is directly connected.
Return `null` when no chain exists. Returning the count is not enough — the product needs the
actual people, so reconstruct the path (BFS plus a parent map is the intended shape).

## Examples

```ts
const connections: Array<[string, string]> = [
  ['ana', 'bo'],
  ['bo', 'kim'],
  ['ana', 'raj'],
  ['raj', 'kim'],
];
introPath(connections, 'ana', 'kim'); // ['ana', 'bo', 'kim'] or ['ana', 'raj', 'kim'] (length 3)
introPath(connections, 'ana', 'bo');  // ['ana', 'bo']
introPath(connections, 'ana', 'zoe'); // null
```

## Constraints

- Up to 50,000 connections; ids are non-empty strings.
- The graph is **undirected**: `['a', 'b']` means each can introduce the other.
- Disconnected components and cycles are allowed; duplicate connection pairs may appear.
- `from === to` returns `[from]` (a chain of one), even if that person has no connections.
- If `from` or `to` never appears in any connection (and `from !== to`), return `null`.
- Any one of the equally shortest chains is accepted — but its length must be minimal.

## Target

O(V + E) — a single BFS with parent pointers; no per-node path copying.

## Interviewer follow-up

Why does storing the full path inside each queue entry (instead of a parent map) push the worst case toward O(V²) memory, and when would that actually bite?
