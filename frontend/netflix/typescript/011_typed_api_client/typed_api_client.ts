export interface Partner {
  id: string;
  name: string;
  tier: 'standard' | 'preferred';
}

export interface IntegrationStatus {
  integrationId: string;
  state: 'healthy' | 'degraded' | 'down';
  checkedAt: number;
}

export interface DeliveryReport {
  reportId: string;
  rows: number;
  generatedAt: number;
}

// Single source of truth: route → response type. Do not change this map.
export interface RouteResponseMap {
  '/partners': Partner[];
  '/partners/:id': Partner;
  '/integrations/:id/status': IntegrationStatus;
  '/reports/:id': DeliveryReport;
}

// TODO: design the client type. `get` must be ONE generic method whose route
// argument is constrained to the map and whose Promise result type is looked up
// from RouteResponseMap for that exact route. The `any`s below are the task.
export function createApiClient(
  fetcher: (route: string) => Promise<unknown>,
): any {
  return {
    get(route: any): any {
      throw new Error('Not implemented');
    },
  };
}
