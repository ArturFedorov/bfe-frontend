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
  // TODO: implement
  throw new Error('Not implemented');
}
