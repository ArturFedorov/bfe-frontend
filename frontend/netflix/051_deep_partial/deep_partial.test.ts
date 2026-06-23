import type { DeepPartial } from './deep_partial';

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
});
