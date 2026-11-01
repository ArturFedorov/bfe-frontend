// Hybrid suite: runtime jest tests + inline type assertions.
// Compile errors here ARE failing tests — ts-jest type-checks this file.
import { getField } from './constrained_getters';

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

interface Integration {
  id: string;
  partner: string;
  state: 'healthy' | 'degraded' | 'down';
  retries: number;
}

const integrations: Integration[] = [
  { id: 'i-1', partner: 'Acme', state: 'healthy', retries: 0 },
  { id: 'i-2', partner: 'Globex', state: 'down', retries: 3 },
  { id: 'i-3', partner: 'Initech', state: 'degraded', retries: 1 },
];

describe('010 constrained_getters — runtime', () => {
  it('extracts the requested field from every item', () => {
    expect(getField(integrations, 'partner')).toEqual([
      'Acme',
      'Globex',
      'Initech',
    ]);
    expect(getField(integrations, 'retries')).toEqual([0, 3, 1]);
  });

  it('preserves item order', () => {
    expect(getField(integrations, 'id')).toEqual(['i-1', 'i-2', 'i-3']);
  });

  it('returns an empty array for empty input', () => {
    expect(getField([] as Integration[], 'state')).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const before = [...integrations];
    getField(integrations, 'state');
    expect(integrations).toEqual(before);
  });
});

// --- inference contracts (compile-time only; never executed) ---
const _contracts = () => {
  const names = getField(integrations, 'partner');
  type _StringField = Expect<Equal<typeof names, string[]>>;

  const states = getField(integrations, 'state');
  type _LiteralUnionSurvives = Expect<
    Equal<typeof states, ('healthy' | 'degraded' | 'down')[]>
  >;

  const retries = getField(integrations, 'retries');
  type _NumberField = Expect<Equal<typeof retries, number[]>>;

  // @ts-expect-error — key must be keyof Integration
  getField(integrations, 'nope');

  // @ts-expect-error — a key from a different shape is still invalid
  getField(integrations, 'rows');
};
void _contracts;
