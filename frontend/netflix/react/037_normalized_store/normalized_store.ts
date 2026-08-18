export interface Partner {
  id: string;
  name: string;
}

export type IntegrationStatus = 'active' | 'paused';

export interface Integration {
  id: string;
  partnerId: string;
  name: string;
  status: IntegrationStatus;
}

export interface EntityTable<T> {
  byId: Record<string, T>;
  allIds: string[];
}

export interface StoreState {
  partners: EntityTable<Partner>;
  integrations: EntityTable<Integration>;
}

export type StoreAction =
  | { type: 'addPartner'; partner: Partner }
  | { type: 'addIntegration'; integration: Integration }
  | { type: 'updateIntegrationStatus'; id: string; status: IntegrationStatus }
  | { type: 'removeIntegration'; id: string };

export const emptyStoreState: StoreState = {
  partners: { byId: {}, allIds: [] },
  integrations: { byId: {}, allIds: [] },
};

export function storeReducer(state: StoreState, action: StoreAction): StoreState {
  // TODO: implement — untouched tables and entities must keep their references;
  // unknown-id updates/removes and same-status updates are same-reference no-ops.
  throw new Error('Not implemented');
}

export function selectAllPartners(state: StoreState): Partner[] {
  // TODO: implement
  throw new Error('Not implemented');
}

export function selectAllIntegrations(state: StoreState): Integration[] {
  // TODO: implement
  throw new Error('Not implemented');
}

export function selectIntegrationsForPartner(
  state: StoreState,
  partnerId: string,
): Integration[] {
  // TODO: implement
  throw new Error('Not implemented');
}
