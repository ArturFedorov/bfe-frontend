import {
  Integration,
  Partner,
  StoreAction,
  StoreState,
  emptyStoreState,
  selectAllIntegrations,
  selectAllPartners,
  selectIntegrationsForPartner,
  storeReducer,
} from './normalized_store';

const acme: Partner = { id: 'p1', name: 'Acme CDN' };
const globex: Partner = { id: 'p2', name: 'Globex Media' };
const s3Drop: Integration = { id: 'i1', partnerId: 'p1', name: 'S3 drop', status: 'active' };
const aspera: Integration = { id: 'i2', partnerId: 'p1', name: 'Aspera', status: 'paused' };
const sftp: Integration = { id: 'i3', partnerId: 'p2', name: 'SFTP pull', status: 'active' };

function seed(): StoreState {
  const actions: StoreAction[] = [
    { type: 'addPartner', partner: acme },
    { type: 'addPartner', partner: globex },
    { type: 'addIntegration', integration: s3Drop },
    { type: 'addIntegration', integration: aspera },
    { type: 'addIntegration', integration: sftp },
  ];
  return actions.reduce(storeReducer, emptyStoreState);
}

describe('storeReducer', () => {
  describe('add', () => {
    it('adds entities and maintains allIds in insertion order', () => {
      const state = seed();
      expect(state.partners.allIds).toEqual(['p1', 'p2']);
      expect(state.integrations.allIds).toEqual(['i1', 'i2', 'i3']);
      expect(state.integrations.byId['i2']).toEqual(aspera);
    });

    it('re-adding an existing id overwrites byId without duplicating allIds', () => {
      let state = seed();
      state = storeReducer(state, {
        type: 'addPartner',
        partner: { id: 'p1', name: 'Acme CDN (renamed)' },
      });
      expect(state.partners.allIds).toEqual(['p1', 'p2']);
      expect(state.partners.byId['p1'].name).toBe('Acme CDN (renamed)');
    });

    it('does not mutate the previous state', () => {
      const before = seed();
      storeReducer(before, { type: 'addPartner', partner: { id: 'p3', name: 'Initech' } });
      expect(before.partners.allIds).toEqual(['p1', 'p2']);
      expect('p3' in before.partners.byId).toBe(false);
    });
  });

  describe('updateIntegrationStatus', () => {
    it('updates only the targeted entity', () => {
      const before = seed();
      const after = storeReducer(before, {
        type: 'updateIntegrationStatus',
        id: 'i1',
        status: 'paused',
      });
      expect(after.integrations.byId['i1'].status).toBe('paused');
      expect(after.integrations.byId['i1']).not.toBe(before.integrations.byId['i1']);
    });

    it('keeps references for everything it did not touch', () => {
      const before = seed();
      const after = storeReducer(before, {
        type: 'updateIntegrationStatus',
        id: 'i1',
        status: 'paused',
      });
      expect(after.partners).toBe(before.partners);
      expect(after.integrations.byId['i2']).toBe(before.integrations.byId['i2']);
      expect(after.integrations.byId['i3']).toBe(before.integrations.byId['i3']);
      expect(after.integrations.allIds).toEqual(before.integrations.allIds);
    });

    it('unknown id is a same-reference no-op', () => {
      const before = seed();
      expect(
        storeReducer(before, { type: 'updateIntegrationStatus', id: 'nope', status: 'paused' }),
      ).toBe(before);
    });

    it('setting the status it already has is a same-reference no-op', () => {
      const before = seed();
      expect(
        storeReducer(before, { type: 'updateIntegrationStatus', id: 'i1', status: 'active' }),
      ).toBe(before);
    });
  });

  describe('removeIntegration', () => {
    it('removes from byId and allIds', () => {
      const state = storeReducer(seed(), { type: 'removeIntegration', id: 'i2' });
      expect(state.integrations.allIds).toEqual(['i1', 'i3']);
      expect('i2' in state.integrations.byId).toBe(false);
    });

    it('leaves other entities and the partners table untouched', () => {
      const before = seed();
      const after = storeReducer(before, { type: 'removeIntegration', id: 'i2' });
      expect(after.partners).toBe(before.partners);
      expect(after.integrations.byId['i1']).toBe(before.integrations.byId['i1']);
    });

    it('unknown id is a same-reference no-op', () => {
      const before = seed();
      expect(storeReducer(before, { type: 'removeIntegration', id: 'nope' })).toBe(before);
    });
  });
});

describe('selectors', () => {
  it('selectAllPartners derives the list in allIds order', () => {
    expect(selectAllPartners(seed())).toEqual([acme, globex]);
  });

  it('selectAllIntegrations derives the list in allIds order', () => {
    expect(selectAllIntegrations(seed())).toEqual([s3Drop, aspera, sftp]);
  });

  it('selectIntegrationsForPartner filters by partner and keeps order', () => {
    const state = seed();
    expect(selectIntegrationsForPartner(state, 'p1')).toEqual([s3Drop, aspera]);
    expect(selectIntegrationsForPartner(state, 'p2')).toEqual([sftp]);
    expect(selectIntegrationsForPartner(state, 'p9')).toEqual([]);
  });

  it('selectors reflect updates without storing derived data', () => {
    let state = seed();
    state = storeReducer(state, { type: 'removeIntegration', id: 'i1' });
    expect(selectIntegrationsForPartner(state, 'p1')).toEqual([aspera]);
  });
});
