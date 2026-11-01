import { useReducer } from 'react';
import {
  emptyStoreState,
  selectAllIntegrations,
  selectAllPartners,
  selectIntegrationsForPartner,
  storeReducer,
  type Integration,
  type Partner,
} from './normalized_store';

/**
 * Demo harness for the normalized store — auto-discovered by the playground
 * (playground/App.tsx). The reducer and selectors are the task; this harness
 * dispatches sample actions and dumps the selectors' output.
 */

const SAMPLE_PARTNERS: readonly Partner[] = [
  { id: 'p1', name: 'Acme CDN' },
  { id: 'p2', name: 'Globex Media' },
];

const SAMPLE_INTEGRATIONS: readonly Integration[] = [
  { id: 'i1', partnerId: 'p1', name: 'S3 drop', status: 'active' },
  { id: 'i2', partnerId: 'p1', name: 'Aspera feed', status: 'paused' },
  { id: 'i3', partnerId: 'p2', name: 'SFTP sync', status: 'active' },
];

export default function Demo() {
  const [state, dispatch] = useReducer(storeReducer, emptyStoreState);

  const i1 = state.integrations.byId['i1'];
  const selected = {
    selectAllPartners: selectAllPartners(state),
    selectAllIntegrations: selectAllIntegrations(state),
    "selectIntegrationsForPartner(state, 'p1')": selectIntegrationsForPartner(state, 'p1'),
  };

  return (
    <div className="demo">
      <h2>Normalized Store</h2>
      <p className="demo-note">
        Implement <code>storeReducer</code> and the selectors in{' '}
        <code>normalized_store.ts</code>. Upsert the sample data, toggle a status, remove an
        integration — the <code>&lt;pre&gt;</code> below always shows the selectors&apos; derived
        views. Re-upserting must never duplicate ids in <code>allIds</code>; unknown-id updates
        are no-ops.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button
            onClick={() => {
              for (const partner of SAMPLE_PARTNERS) {
                dispatch({ type: 'addPartner', partner });
              }
            }}
          >
            Upsert sample partners
          </button>
          <button
            onClick={() => {
              for (const integration of SAMPLE_INTEGRATIONS) {
                dispatch({ type: 'addIntegration', integration });
              }
            }}
          >
            Upsert sample integrations
          </button>
        </div>
        <div className="demo-controls">
          <button
            disabled={!i1}
            onClick={() =>
              dispatch({
                type: 'updateIntegrationStatus',
                id: 'i1',
                status: i1 && i1.status === 'active' ? 'paused' : 'active',
              })
            }
          >
            Toggle i1 status {i1 ? `(now ${i1.status})` : '(add integrations first)'}
          </button>
          <button onClick={() => dispatch({ type: 'removeIntegration', id: 'i2' })}>
            Remove i2
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'updateIntegrationStatus', id: 'nope', status: 'paused' })
            }
          >
            Update unknown id (no-op)
          </button>
        </div>
        <pre style={{ fontSize: '0.8rem', overflowX: 'auto' }}>
          {JSON.stringify(selected, null, 2)}
        </pre>
      </div>
    </div>
  );
}
