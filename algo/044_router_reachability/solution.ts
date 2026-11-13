/**
 * Router Reachability — reference solution.
 *
 * Directed implicit graph: A → B exists iff dist(A, B) <= A.range. Rather
 * than materializing the whole O(n²) adjacency list up front, the BFS
 * discovers each router's out-edges lazily by scanning all routers when it
 * is dequeued. Every router is dequeued at most once, so the total work is
 * the same O(n²) as explicit construction, but we stop early on a hit and
 * never build edges for unreachable routers. Distances are compared squared
 * to avoid `Math.sqrt` (and the `<=` keeps the boundary hop valid). The
 * visited set guarantees termination on cycles.
 *
 * Time:  O(n²) worst case (each dequeued router scans n candidates).
 * Space: O(n) for the id index, visited set and queue.
 */

export interface Router {
  id: string;
  x: number;
  y: number;
  range: number;
}

export function canReach(
  routers: Router[],
  sourceId: string,
  targetId: string,
): boolean {
  const byId = new Map<string, Router>();
  for (const router of routers) byId.set(router.id, router);
  const source = byId.get(sourceId);
  if (!source || !byId.has(targetId)) return false;
  if (sourceId === targetId) return true;

  /** Directed check: uses only the sender's range. */
  const inRange = (from: Router, to: Router): boolean => {
    const dx = from.x - to.x;
    const dy = from.y - to.y;

    return dx * dx + dy * dy <= from.range * from.range;
  };

  const visited = new Set<string>([sourceId]);
  const queue: Router[] = [source];

  // Index-based queue: O(1) dequeue without Array#shift.
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const candidate of routers) {
      if (visited.has(candidate.id)) continue;
      if (!inRange(current, candidate)) continue;
      if (candidate.id === targetId) return true;
      visited.add(candidate.id);
      queue.push(candidate);
    }
  }

  return false;
}
