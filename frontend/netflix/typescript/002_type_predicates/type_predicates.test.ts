// Type assertions in this file fail to compile until the types are implemented —
// a compile error here IS a failing test.

import {
  Account,
  Partner,
  isPartner,
  isPresent,
  selectPartners,
} from './type_predicates';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

const accounts: Account[] = [
  { kind: 'partner', id: 'p-1', name: 'Dolby', tier: 'strategic' },
  { kind: 'internal', id: 't-9', teamName: 'Encoding' },
  { kind: 'partner', id: 'p-2', name: 'Roku', tier: 'standard' },
];

// --- Compile-time: filter with a predicate narrows the array type ---------

const partners = accounts.filter(isPartner);
type _partners = Expect<Equal<typeof partners, Partner[]>>;

const rawNames: (string | null | undefined)[] = ['Ana', null, 'Bo', undefined];
const names = rawNames.filter(isPresent);
type _names = Expect<Equal<typeof names, string[]>>;

// Boolean is typed (value?: unknown) => boolean — no predicate, no narrowing.
const viaBoolean = rawNames.filter(Boolean);
type _viaBoolean = Expect<Equal<typeof viaBoolean, (string | null | undefined)[]>>;

// --- Compile-time: narrowing works in an if-statement too -----------------

function tierOf(account: Account): string {
  if (isPartner(account)) {
    type _narrowed = Expect<Equal<typeof account, Partner>>;
    return account.tier;
  }
  return 'n/a';
}
void tierOf;

// --- Runtime behavior ------------------------------------------------------

describe('isPartner', () => {
  it('accepts partner accounts', () => {
    expect(isPartner({ kind: 'partner', id: 'p-1', name: 'Dolby', tier: 'strategic' })).toBe(true);
  });

  it('rejects internal teams', () => {
    expect(isPartner({ kind: 'internal', id: 't-9', teamName: 'Encoding' })).toBe(false);
  });
});

describe('isPresent', () => {
  it('rejects null and undefined', () => {
    expect(isPresent(null)).toBe(false);
    expect(isPresent(undefined)).toBe(false);
  });

  it('keeps other falsy values', () => {
    expect(isPresent('')).toBe(true);
    expect(isPresent(0)).toBe(true);
    expect(isPresent(false)).toBe(true);
  });
});

describe('selectPartners', () => {
  it('returns only partners', () => {
    expect(selectPartners(accounts)).toEqual([
      { kind: 'partner', id: 'p-1', name: 'Dolby', tier: 'strategic' },
      { kind: 'partner', id: 'p-2', name: 'Roku', tier: 'standard' },
    ]);
  });

  it('returns an empty array when there are no partners', () => {
    expect(selectPartners([{ kind: 'internal', id: 't-1', teamName: 'Delivery' }])).toEqual([]);
  });
});

describe('filtering', () => {
  it('filter(isPresent) drops exactly null and undefined', () => {
    expect(names).toEqual(['Ana', 'Bo']);
  });

  it('filter(isPartner) keeps partner objects intact', () => {
    expect(partners.map((p) => p.name)).toEqual(['Dolby', 'Roku']);
  });
});
