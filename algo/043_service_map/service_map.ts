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
  // TODO: implement
  throw new Error('Not implemented');
}
