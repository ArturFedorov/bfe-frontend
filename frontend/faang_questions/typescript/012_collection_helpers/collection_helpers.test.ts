// Hybrid suite: runtime jest tests + inline type assertions.
// Compile errors here ARE failing tests — ts-jest type-checks this file.
import { groupBy, indexBy } from './collection_helpers';

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

interface Integration {
  id: string;
  region: 'emea' | 'apac' | 'amer';
  state: 'healthy' | 'down';
}

const integrations: Integration[] = [
  { id: 'i-1', region: 'emea', state: 'healthy' },
  { id: 'i-2', region: 'apac', state: 'down' },
  { id: 'i-3', region: 'emea', state: 'down' },
  { id: 'i-4', region: 'amer', state: 'healthy' },
];

describe('012 collection_helpers — groupBy runtime', () => {
  it('groups items under their computed key', () => {
    const byRegion = groupBy(integrations, (i) => i.region);
    expect(byRegion.emea.map((i) => i.id)).toEqual(['i-1', 'i-3']);
    expect(byRegion.apac.map((i) => i.id)).toEqual(['i-2']);
    expect(byRegion.amer.map((i) => i.id)).toEqual(['i-4']);
  });

  it('preserves item order within each group', () => {
    const byState = groupBy(integrations, (i) => i.state);
    expect(byState.down.map((i) => i.id)).toEqual(['i-2', 'i-3']);
  });

  it('returns an empty record for empty input', () => {
    expect(groupBy([] as Integration[], (i) => i.region)).toEqual({});
  });
});

describe('012 collection_helpers — indexBy runtime', () => {
  it('indexes items by their computed key', () => {
    const byId = indexBy(integrations, (i) => i.id);
    expect(byId['i-3']).toEqual({ id: 'i-3', region: 'emea', state: 'down' });
  });

  it('is last-write-wins on duplicate keys', () => {
    const byRegion = indexBy(integrations, (i) => i.region);
    expect(byRegion.emea.id).toBe('i-3');
  });

  it('returns an empty record for empty input', () => {
    expect(indexBy([] as Integration[], (i) => i.id)).toEqual({});
  });
});

// --- inference contracts (compile-time only; never executed) ---
const _contracts = () => {
  const byRegion = groupBy(integrations, (i) => i.region);
  type _KeyUnionInferred = Expect<
    Equal<typeof byRegion, Record<'emea' | 'apac' | 'amer', Integration[]>>
  >;

  const byState = groupBy(integrations, (i) => i.state);
  type _AnotherUnion = Expect<
    Equal<typeof byState, Record<'healthy' | 'down', Integration[]>>
  >;

  const byId = indexBy(integrations, (i) => i.id);
  type _StringKey = Expect<Equal<typeof byId, Record<string, Integration>>>;

  const byRegionOne = indexBy(integrations, (i) => i.region);
  type _IndexValueIsSingle = Expect<
    Equal<(typeof byRegionOne)['emea'], Integration>
  >;

  // @ts-expect-error — key callback must return a valid object key
  groupBy(integrations, (i) => ({ bad: i.id }));

  // @ts-expect-error — same constraint for indexBy
  indexBy(integrations, (i) => [i.id]);
};
void _contracts;
