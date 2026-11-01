import type { DeepPartial } from './deep_partial';

// Compile-time assertion helpers (same pattern as the other TypeScript tasks).
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type Config = { server: { host: string; port: number }; debug: boolean };

describe('DeepPartial', () => {
  it('makes nested properties optional', () => {
    type Partialed = DeepPartial<Config>;
    type Expected = {
      server?: { host?: string; port?: number };
      debug?: boolean;
    };
    type _ = Expect<Equal<Partialed, Expected>>;
    const empty: Partialed = {};
    const partial: Partialed = { server: {} };
    expect(empty).toEqual({});
    expect(partial).toEqual({ server: {} });
  });

  it('recurses through several levels of nesting', () => {
    type Deep = { level1: { level2: { level3: { value: number } } } };
    type Result = DeepPartial<Deep>;
    type Expected = {
      level1?: { level2?: { level3?: { value?: number } } };
    };
    type _ = Expect<Equal<Result, Expected>>;

    const a: Result = {};
    const b: Result = { level1: {} };
    const c: Result = { level1: { level2: { level3: {} } } };
    const d: Result = { level1: { level2: { level3: { value: 1 } } } };
    expect([a, b, c, d]).toHaveLength(4);
  });

  it('handles multiple sibling nested objects', () => {
    type T = { a: { x: number }; b: { y: string }; flag: boolean };
    type Result = DeepPartial<T>;
    type Expected = { a?: { x?: number }; b?: { y?: string }; flag?: boolean };
    type _ = Expect<Equal<Result, Expected>>;

    const value: Result = { a: {}, flag: true };
    expect(value).toEqual({ a: {}, flag: true });
  });

  it('leaves primitive leaf types unchanged', () => {
    type T = { s: string; n: number; b: boolean; lit: 'a' | 'b' };
    type Result = DeepPartial<T>;
    type Expected = { s?: string; n?: number; b?: boolean; lit?: 'a' | 'b' };
    type _ = Expect<Equal<Result, Expected>>;

    const value: Result = { lit: 'a' };
    expect(value).toEqual({ lit: 'a' });
  });

  it('passes top-level primitives through unchanged', () => {
    type _num = Expect<Equal<DeepPartial<number>, number>>;
    type _str = Expect<Equal<DeepPartial<string>, string>>;
    type _bool = Expect<Equal<DeepPartial<boolean>, boolean>>;
    expect(true).toBe(true);
  });

  it('keeps already-optional properties optional', () => {
    type T = { required: { a: number }; optional?: { b: string } };
    type Result = DeepPartial<T>;
    type Expected = { required?: { a?: number }; optional?: { b?: string } };
    type _ = Expect<Equal<Result, Expected>>;

    const empty: Result = {};
    const filled: Result = { required: {}, optional: { b: 'x' } };
    expect(empty).toEqual({});
    expect(filled).toEqual({ required: {}, optional: { b: 'x' } });
  });

  it('supports incremental construction of a config object', () => {
    type FullConfig = {
      server: { host: string; port: number };
      logging: { level: 'info' | 'debug'; file: string };
    };

    const draft: DeepPartial<FullConfig> = {};
    draft.server = { host: 'localhost' }; // port omitted
    draft.logging = { level: 'debug' }; // file omitted

    expect(draft).toEqual({
      server: { host: 'localhost' },
      logging: { level: 'debug' },
    });
  });
});
