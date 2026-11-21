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

const addId = (allIds: string[], id: string) => {
  return allIds.includes(id) ? allIds : [...allIds, id];
};

function upsert<T extends { id: string }>(
  table: EntityTable<T>,
  entity: T,
): EntityTable<T> {
  return {
    byId: { ...table.byId, [entity.id]: entity },
    allIds: addId(table.allIds, entity.id),
  };
}

export function storeReducer(
  state: StoreState,
  action: StoreAction,
): StoreState {
  switch (action.type) {
    case 'addPartner':
      return {
        ...state,
        partners: upsert(state.partners, action.partner),
      };

    case 'addIntegration':
      return {
        ...state,
        integrations: upsert(state.integrations, action.integration),
      };

    case 'updateIntegrationStatus':
      const current = state.integrations.byId[action.id];
      if (!current || current.status === action.status) return state;
      return {
        ...state,
        integrations: {
          ...state.integrations,
          byId: {
            ...state.integrations.byId,
            [action.id]: { ...current, status: action.status },
          },
        },
      };

    case 'removeIntegration':
      if (!(action.id in state.integrations.byId)) return state;

      const { [action.id]: _removed, ...rest } = state.integrations.byId;
      return {
        ...state,
        integrations: {
          byId: rest,
          allIds: state.integrations.allIds.filter((id) => id !== action.id),
        },
      };
  }
}

export function selectAllPartners(state: StoreState): Partner[] {
  return Object.values(state.partners.byId);
}

export function selectAllIntegrations(state: StoreState): Integration[] {
  return Object.values(state.integrations.byId);
}

export function selectIntegrationsForPartner(
  state: StoreState,
  partnerId: string,
): Integration[] {
  return selectAllIntegrations(state).filter(
    (integration) => integration.partnerId === partnerId,
  );
}
