// Hybrid suite: runtime jest tests + inline type assertions.
// Compile errors here ARE failing tests — ts-jest type-checks this file.
import { mapPaginated, paginate, Paginated } from './paginated_wrapper';

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

interface Partner {
  id: string;
  name: string;
}

const partners: Partner[] = [
  { id: 'p-1', name: 'Acme' },
  { id: 'p-2', name: 'Globex' },
  { id: 'p-3', name: 'Initech' },
  { id: 'p-4', name: 'Umbrella' },
  { id: 'p-5', name: 'Hooli' },
];

describe('014 paginated_wrapper — paginate runtime', () => {
  it('slices the requested page', () => {
    const page = paginate(partners, 2, 2);
    expect(page.items.map((p) => p.id)).toEqual(['p-3', 'p-4']);
    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(2);
  });

  it('reports the total of the full list, not the slice', () => {
    expect(paginate(partners, 1, 2).total).toBe(5);
  });

  it('returns a short final page', () => {
    const page = paginate(partners, 3, 2);
    expect(page.items.map((p) => p.id)).toEqual(['p-5']);
  });

  it('returns empty items past the end', () => {
    expect(paginate(partners, 9, 2).items).toEqual([]);
  });
});

describe('014 paginated_wrapper — mapPaginated runtime', () => {
  it('maps items and keeps envelope fields', () => {
    const page = paginate(partners, 1, 3);
    const names = mapPaginated(page, (p) => p.name);
    expect(names.items).toEqual(['Acme', 'Globex', 'Initech']);
    expect(names.page).toBe(1);
    expect(names.pageSize).toBe(3);
    expect(names.total).toBe(5);
  });

  it('passes the index to the mapper', () => {
    const page = paginate(partners, 1, 2);
    const indexed = mapPaginated(page, (p, i) => `${i}:${p.id}`);
    expect(indexed.items).toEqual(['0:p-1', '1:p-2']);
  });

  it('does not mutate the source page', () => {
    const page = paginate(partners, 1, 2);
    mapPaginated(page, (p) => p.name);
    expect(page.items.map((p) => p.id)).toEqual(['p-1', 'p-2']);
  });
});

// --- inference contracts (compile-time only; never executed) ---
const _contracts = () => {
  const page = paginate(partners, 1, 2);
  type _DefaultMeta = Expect<Equal<typeof page, Paginated<Partner>>>;
  type _MetaIsUndefined = Expect<Equal<(typeof page)['meta'], undefined>>;

  const names = mapPaginated(page, (p) => p.name);
  type _ItemTypeMapped = Expect<Equal<typeof names, Paginated<string>>>;

  const withCursor: Paginated<Partner, { cursor: string }> = {
    items: partners,
    page: 1,
    pageSize: 5,
    total: 5,
    meta: { cursor: 'abc' },
  };
  const mappedCursor = mapPaginated(withCursor, (p) => p.id.length);
  type _MetaPreserved = Expect<
    Equal<typeof mappedCursor, Paginated<number, { cursor: string }>>
  >;

  // @ts-expect-error — mapper parameter must match the item type
  mapPaginated(page, (n: number) => n + 1);

  // @ts-expect-error — meta is part of the envelope type
  const bad: Paginated<Partner> = {
    items: partners,
    page: 1,
    pageSize: 5,
    total: 5,
  };
  void bad;
};
void _contracts;
