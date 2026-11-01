// Hybrid suite: runtime jest tests + inline type assertions.
// Compile errors here ARE failing tests — ts-jest type-checks this file.
import { createQuery, Query } from './fluent_builder';

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

interface PartnerRow {
  id: string;
  name: string;
  tier: 'standard' | 'preferred';
  active: boolean;
}

describe('016 fluent_builder — runtime', () => {
  it('build returns the selected fields in call order', () => {
    const query = createQuery<PartnerRow>().select('name', 'tier').build();
    expect(query.fields).toEqual(['name', 'tier']);
    expect(query.filters).toEqual([]);
  });

  it('accumulates fields across repeated select calls, without duplicates', () => {
    const query = createQuery<PartnerRow>()
      .select('id')
      .select('name', 'id')
      .build();
    expect(query.fields).toEqual(['id', 'name']);
  });

  it('records where clauses as filters', () => {
    const query = createQuery<PartnerRow>()
      .select('name', 'tier')
      .where('tier', 'preferred')
      .where('name', 'Acme')
      .build();

    expect(query.filters).toEqual([
      { field: 'tier', value: 'preferred' },
      { field: 'name', value: 'Acme' },
    ]);
  });

  it('each createQuery call is independent', () => {
    const first = createQuery<PartnerRow>().select('id');
    const second = createQuery<PartnerRow>().select('name');
    expect(first.build().fields).toEqual(['id']);
    expect(second.build().fields).toEqual(['name']);
  });
});

// --- inference contracts (compile-time only; never executed) ---
const _contracts = () => {
  const query = createQuery<PartnerRow>()
    .select('name', 'tier')
    .where('tier', 'preferred')
    .build();
  type _AccumulatedQuery = Expect<
    Equal<typeof query, Query<PartnerRow, 'name' | 'tier'>>
  >;
  type _FieldsNarrowed = Expect<
    Equal<(typeof query)['fields'], ('name' | 'tier')[]>
  >;

  const grown = createQuery<PartnerRow>().select('id').select('active').build();
  type _SelectAccumulates = Expect<
    Equal<typeof grown, Query<PartnerRow, 'id' | 'active'>>
  >;

  // where accepts a field selected by a *later* select in the chain state
  createQuery<PartnerRow>().select('id').select('active').where('active', true);

  // @ts-expect-error — where only accepts fields that were selected
  createQuery<PartnerRow>().select('name').where('active', true);

  // @ts-expect-error — build is not available before select
  createQuery<PartnerRow>().build();

  // @ts-expect-error — where is not available before select
  createQuery<PartnerRow>().where('name', 'Acme');

  // @ts-expect-error — value must match the selected field's type
  createQuery<PartnerRow>().select('active').where('active', 'yes');

  // @ts-expect-error — select only accepts keys of the row type
  createQuery<PartnerRow>().select('nope');
};
void _contracts;
