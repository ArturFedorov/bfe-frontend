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

/**
 * Builds the linked fiber structure for `spec`: every node's `child` points
 * at its first child, children are chained through `sibling`, and every
 * node's `return` points at its parent (null for the root).
 */
export function createFiberTree(spec: ElementSpec): Fiber {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * React's work loop over a fiber tree using only child / sibling / return
 * pointers — no recursion, no stack array. `depth` is 0 for `root`.
 * Never climbs above `root`, so a subtree can be walked in place.
 */
export function walkFiber(root: Fiber | null, visitor: FiberVisitor): void {
  // TODO: implement
  throw new Error('Not implemented');
}

/** First fiber in beginWork order matching `predicate`, or null. Stops early. */
export function findFiber(
  root: Fiber | null,
  predicate: (fiber: Fiber) => boolean,
): Fiber | null {
  // TODO: implement
  throw new Error('Not implemented');
}
