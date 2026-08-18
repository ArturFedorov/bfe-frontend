# 037. Normalized Store

Difficulty: Hard

Topics: normalized state, byId/allIds, selectors, referential integrity

## Scenario

The integrations dashboard shows partners and their delivery integrations. The
first version stored partners as a nested tree — each partner object embedded its
integrations array — and every status update rebuilt the whole tree, re-rendering
all 400 rows. Model the data the way a client-side cache would: a normalized
store with `byId` maps and `allIds` arrays per entity type, a pure reducer, and
selectors that derive the nested views. An update to one integration must produce
new references *only* along the path it touched.

## Acceptance Criteria

- `StoreState` holds two entity tables: `partners` and `integrations`, each
  `{ byId: Record<string, T>; allIds: string[] }`.
- Actions: `addPartner`, `addIntegration`, `updateIntegrationStatus`,
  `removeIntegration` (discriminated union).
- `add*` inserts the entity and appends its id to `allIds`; re-adding an existing
  id overwrites `byId` but never duplicates the id in `allIds`.
- `updateIntegrationStatus`:
  - unknown id → same-reference no-op;
  - same status → same-reference no-op;
  - otherwise only the touched entity gets a new object — the `partners` table
    keeps its reference and every *other* integration object keeps its reference.
- `removeIntegration` deletes from `byId` and filters `allIds`; unknown id is a
  same-reference no-op.
- Selectors derive views (no duplication of derived data in state):
  `selectAllPartners`, `selectAllIntegrations`,
  `selectIntegrationsForPartner(state, partnerId)` in `allIds` order.
- The reducer never mutates: `byId` maps and `allIds` arrays are replaced, not
  edited in place.

## Example

```ts
let s = storeReducer(emptyStoreState, { type: 'addPartner', partner: { id: 'p1', name: 'Acme' } });
s = storeReducer(s, { type: 'addIntegration', integration: { id: 'i1', partnerId: 'p1', name: 'S3 drop', status: 'active' } });
const next = storeReducer(s, { type: 'updateIntegrationStatus', id: 'i1', status: 'paused' });
// next.partners === s.partners (untouched table, same reference)
```

## Target

- Pure reducer + pure selectors; nothing imports React.
- No entity data duplicated anywhere in state.
- ~70 lines.

## Interviewer follow-up

- Why does referential stability of untouched entities matter for React.memo rows?
- Where would you add memoized selectors (reselect-style), and what is the cache key?
- How would you handle `removePartner` — orphan the integrations or cascade the delete?
