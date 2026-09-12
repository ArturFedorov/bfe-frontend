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

  const inRange = (from: Router, to: Router): boolean => {
    const dx = from.x - to.x;
    const dy = from.y - to.y;

    return dx * dx + dy * dy <= from.range * from.range;
  };

  const visited = new Set<string>([sourceId]);
  const queue: Router[] = [source];

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
