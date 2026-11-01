# 082. Fiber Tree Walk

**Difficulty:** Easy
**Topics:** Trees, Linked Structures, Iterative Traversal, React Internals

---

## Description

React does not store a component tree as nested `children` arrays. Each unit
of work is a **fiber** with three pointers: `child` (first child), `sibling`
(next sibling), and `return` (parent). A parent only knows its first child;
the rest of the children hang off that child's `sibling` chain. This shape
lets React walk the whole tree with a loop and no call stack, which is what
makes rendering interruptible: the traversal can pause after any node and
resume from the `return` pointer later.

Two parts:

1. `createFiberTree(spec)` builds that linked structure from a nested element
   spec, wiring `child`, `sibling`, and `return` correctly. Leaves have
   `child: null`; the last sibling has `sibling: null`; the root has
   `return: null`. `key` defaults to `null` when the spec omits it.
2. `walkFiber(root, { beginWork, completeWork })` is React's work loop:
   - `beginWork(fiber, depth)` runs on the way **down** — parent before
     children, siblings left to right. Returning `false` stops the whole walk
     immediately (no further begins or completes).
   - `completeWork(fiber, depth)` runs on the way **up** — when the walk
     leaves a fiber for the last time, i.e. after every descendant has
     completed. A leaf completes right after it begins.

   Use only the three pointers: **no recursion and no explicit stack array**
   — the `return` pointer *is* the stack. Never climb above `root`, so a
   subtree can be walked in place. The suite includes a 100k-deep chain and
   a 100k-wide sibling row. Both callbacks are optional.

`findFiber(root, predicate)` is a thin helper on top: the first fiber in
beginWork order for which `predicate` returns `true`, or `null`. It must stop
walking as soon as it finds a match.

## Examples

```ts
const root = createFiberTree({
  type: 'App',
  children: [
    { type: 'header', children: [{ type: 'h1' }] },
    { type: 'main', children: [{ type: 'p', key: 'intro' }, { type: 'p' }] },
  ],
});

root.child?.type;                       // 'header'
root.child?.sibling?.type;              // 'main'
root.child?.sibling?.return === root;   // true
root.child?.sibling?.child?.key;        // 'intro'

const log: string[] = [];
walkFiber(root, {
  beginWork: (f) => { log.push(`↓${f.type}`); },
  completeWork: (f) => { log.push(`↑${f.type}`); },
});
// ['↓App', '↓header', '↓h1', '↑h1', '↑header', '↓main', '↓p', '↑p', '↓p', '↑p', '↑main', '↑App']

findFiber(root, (f) => f.key === 'intro')?.type; // 'p'
findFiber(root, (f) => f.type === 'footer');     // null
```

## Constraints

- `1 <= number of fibers <= 200_000`; chains may be 100_000 deep; one node
  may have 100_000 siblings.
- `walkFiber` uses only `child`, `sibling`, and `return` — no recursion, no
  stack array, no visited set.
- `type` is a non-empty string; `key` is a string or `null`.
- `walkFiber(null, visit)` and `findFiber(null, pred)` are no-ops returning
  `undefined` and `null` respectively.

## Target

O(n) time, **O(1) extra space** for the walk. The shape to reach for:

```
node = root
while node:
  beginWork(node)
  if node.child: node = node.child; continue       # go down
  while node:                                       # leaf reached
    completeWork(node)                              # finish this node
    if node is root: return                         # never climb above root
    if node.sibling: node = node.sibling; break     # go sideways
    node = node.return                              # go up — and complete the parent next
```

Senior signal: explaining why completion of an ancestor happens inside the
climb loop (you only know a parent is finished when you have run out of
siblings below it), and why the `node is root` check must come before the
sibling check.

## Interviewer follow-up

Why does this linked-list shape make rendering interruptible in a way a
recursive `children.forEach` cannot? Where would React stash "the next unit
of work" so it can yield to the browser after any single fiber and resume
later? And in which phase would layout effects be collected versus run?
