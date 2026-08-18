// Hybrid suite: runtime jest tests + inline type assertions.
// Compile errors here ARE failing tests — ts-jest type-checks this file.
import { pick } from './typed_pick';

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

interface Partner {
  id: string;
  name: string;
  tier: 'standard' | 'preferred';
  active: boolean;
}

const partner: Partner = {
  id: 'p-1',
  name: 'Acme Streaming',
  tier: 'preferred',
  active: true,
};

describe('009 typed_pick — runtime', () => {
  it('picks only the requested keys', () => {
    expect(pick(partner, ['id', 'name'])).toEqual({
      id: 'p-1',
      name: 'Acme Streaming',
    });
  });

  it('does not leak unpicked keys onto the result', () => {
    const result = pick(partner, ['tier']);
    expect(result).toEqual({ tier: 'preferred' });
    expect('id' in result).toBe(false);
    expect('active' in result).toBe(false);
  });

  it('returns an empty object for an empty key list', () => {
    expect(pick(partner, [])).toEqual({});
  });

  it('does not mutate the source object', () => {
    pick(partner, ['id', 'active']);
    expect(partner).toEqual({
      id: 'p-1',
      name: 'Acme Streaming',
      tier: 'preferred',
      active: true,
    });
  });
});

// --- inference contracts (compile-time only; never executed) ---
const _contracts = () => {
  const picked = pick(partner, ['id', 'tier']);
  type _ReturnsExactPick = Expect<
    Equal<typeof picked, Pick<Partner, 'id' | 'tier'>>
  >;

  const single = pick(partner, ['active']);
  type _SingleKey = Expect<Equal<typeof single, Pick<Partner, 'active'>>>;
  type _ValueTypeSurvives = Expect<Equal<(typeof single)['active'], boolean>>;

  // @ts-expect-error — keys not on Partner are rejected at compile time
  pick(partner, ['id', 'nope']);

  // @ts-expect-error — primitives are not valid sources
  pick('not-an-object', []);
};
void _contracts;
