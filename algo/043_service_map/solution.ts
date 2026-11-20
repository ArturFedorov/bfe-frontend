export interface ServiceCall {
  from: string;
  to: string;
}

export interface ServiceMap {
  adjacency: Record<string, string[]>;
  inDegree: Record<string, number>;
  outDegree: Record<string, number>;
}

export function buildServiceMap(calls: ServiceCall[]): ServiceMap {
  const adjacency: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const outDegree: Record<string, number> = {};
  const seen = new Set<string>();

  const ensure = (id: string): void => {
    if (Object.hasOwn(adjacency, id)) return;
    adjacency[id] = [];
    inDegree[id] = 0;
    outDegree[id] = 0;
  };

  for (const { from, to } of calls) {
    ensure(from);
    ensure(to);

    const key = JSON.stringify([from, to]);
    if (seen.has(key)) continue;
    seen.add(key);

    adjacency[from].push(to);
    outDegree[from]++;
    inDegree[to]++;
  }

  return { adjacency, inDegree, outDegree };
}
