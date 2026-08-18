export interface RouteConfig {
  path: `/${string}`;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requiresAuth: boolean;
}

// TODO: this annotation widens every literal — rebuild the table so it is
// constraint-checked against RouteConfig AND keeps literal inference.
export const routes: Record<string, RouteConfig> = {
  partnerList: { path: '/partners', method: 'GET', requiresAuth: true },
  partnerDetail: { path: '/partners/:id', method: 'GET', requiresAuth: true },
  createDelivery: { path: '/deliveries', method: 'POST', requiresAuth: true },
  healthCheck: { path: '/health', method: 'GET', requiresAuth: false },
};

export type RouteName = keyof typeof routes; // stays `string` until routes is rebuilt

export function getRoute<N extends RouteName>(name: N): (typeof routes)[N] {
  // TODO: implement
  throw new Error('Not implemented');
}
