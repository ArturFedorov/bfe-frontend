import type { DeepReadonly } from './deep_readonly';

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type Config = { server: { host: string; port: number }; name: string };

describe('DeepReadonly', () => {
  it('makes nested properties readonly', () => {
    type RO = DeepReadonly<Config>;
    type Expected = {
      readonly server: { readonly host: string; readonly port: number };
      readonly name: string;
    };
    type _ = Expect<Equal<RO, Expected>>;
    const value: RO = { server: { host: 'a', port: 1 }, name: 'x' };
    expect(value.server.host).toBe('a');
  });
});
