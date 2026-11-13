/**
 * 082. Fiber Tree Walk — reference solution
 *
 * createFiberTree(spec)
 *   Builds the linked structure iteratively with an explicit work stack of
 *   (spec, fiber) pairs — the suite has a 100k-deep chain, which would blow
 *   the call stack if we recursed. For each spec we allocate its children
 *   left to right, pointing the parent's `child` at the first one and
 *   chaining the rest through `sibling`; every child's `return` is the parent.
 *
 * walkFiber(root, visitor)
 *   React's work loop, using only the three pointers (the `return` pointer IS
 *   the stack):
 *     - beginWork on the current node; `false` aborts the whole walk.
 *     - if it has a child, descend (depth + 1).
 *     - otherwise it is a leaf: complete it, then climb. While climbing, a
 *       node is completed exactly when we have run out of siblings below it,
 *       i.e. when we arrive at it via `return`. The `node === root` check comes
 *       before the sibling check so a subtree walk never leaks into the
 *       root's own siblings or ancestors.
 *   `depth` is maintained incrementally: +1 on child, -1 on return, unchanged
 *   on sibling.
 *
 * findFiber(root, predicate)
 *   A `walkFiber` whose beginWork records the first match and returns `false`
 *   to stop immediately.
 *
 * Time: O(n) for build and walk. Space: O(n) for the built tree; O(1) extra
 * for the walk (the build's work stack is O(width·depth) in the worst case,
 * but that is the construction, not the traversal).
 */

/** A React-style fiber: first child, next sibling, and parent pointers. */
export interface Fiber {
  type: string;
  key: string | null;
  child: Fiber | null;
  sibling: Fiber | null;
  return: Fiber | null;
}

/** Nested element description used to build a fiber tree. */
export interface ElementSpec {
  type: string;
  key?: string;
  children?: ElementSpec[];
}

/** The two phases of React's work loop. */
export interface FiberVisitor {
  /** Called on the way DOWN, parent before children. Return `false` to stop the walk. */
  beginWork?: (fiber: Fiber, depth: number) => boolean | void;
  /** Called on the way UP, when the walk leaves a fiber for the last time (after all its descendants). */
  completeWork?: (fiber: Fiber, depth: number) => void;
}

function makeFiber(spec: ElementSpec, parent: Fiber | null): Fiber {
  return {
    type: spec.type,
    key: spec.key ?? null,
    child: null,
    sibling: null,
    return: parent,
  };
}

/**
 * Builds the linked fiber structure for `spec`: every node's `child` points
 * at its first child, children are chained through `sibling`, and every
 * node's `return` points at its parent (null for the root).
 */
export function createFiberTree(spec: ElementSpec): Fiber {
  const root = makeFiber(spec, null);
  // Explicit stack instead of recursion: chains can be 100k deep.
  const work: Array<[ElementSpec, Fiber]> = [[spec, root]];

  while (work.length > 0) {
    const [current, fiber] = work.pop()!;
    let previous: Fiber | null = null;

    for (const childSpec of current.children ?? []) {
      const childFiber = makeFiber(childSpec, fiber);
      if (previous === null) fiber.child = childFiber;
      else previous.sibling = childFiber;
      previous = childFiber;
      work.push([childSpec, childFiber]);
    }
  }

  return root;
}

/**
 * React's work loop over a fiber tree using only child / sibling / return
 * pointers — no recursion, no stack array. `depth` is 0 for `root`.
 * Never climbs above `root`, so a subtree can be walked in place.
 */
export function walkFiber(root: Fiber | null, visitor: FiberVisitor): void {
  if (root === null) return;
  const { beginWork, completeWork } = visitor;

  let node: Fiber = root;
  let depth = 0;

  for (;;) {
    // Down phase.
    if (beginWork?.(node, depth) === false) return;

    if (node.child !== null) {
      node = node.child;
      depth += 1;
      continue;
    }

    // Leaf reached: complete it, then climb until we find a sibling to
    // continue with. Each node we climb *through* is complete, because we
    // only reach it via `return` after exhausting its last child.
    for (;;) {
      completeWork?.(node, depth);
      if (node === root) return; // must precede the sibling check

      if (node.sibling !== null) {
        node = node.sibling; // sideways: same depth
        break;
      }

      if (node.return === null) return; // malformed tree guard
      node = node.return;
      depth -= 1;
    }
  }
}

/** First fiber in beginWork order matching `predicate`, or null. Stops early. */
export function findFiber(
  root: Fiber | null,
  predicate: (fiber: Fiber) => boolean,
): Fiber | null {
  let found: Fiber | null = null;
  walkFiber(root, {
    beginWork: (fiber) => {
      if (predicate(fiber)) {
        found = fiber;
        return false; // stop the walk right here
      }
    },
  });
  return found;
}
