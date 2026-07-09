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

  it('prevents reassigning a top-level property', () => {
    type RO = DeepReadonly<Config>;
    const value: RO = { server: { host: 'a', port: 1 }, name: 'x' };
    // @ts-expect-error top-level properties are readonly
    value.name = 'y';
  });

  it('prevents reassigning a nested property', () => {
    type RO = DeepReadonly<Config>;
    const value: RO = { server: { host: 'a', port: 1 }, name: 'x' };
    // @ts-expect-error nested properties are readonly too
    value.server.host = 'b';
  });

  it('recurses through three levels of nesting', () => {
    type Deep = { a: { b: { c: number } } };
    type RO = DeepReadonly<Deep>;
    type Expected = {
      readonly a: { readonly b: { readonly c: number } };
    };
    type _ = Expect<Equal<RO, Expected>>;
  });

  it('handles multiple sibling nested objects independently', () => {
    type Siblings = { left: { x: number }; right: { y: string } };
    type RO = DeepReadonly<Siblings>;
    type Expected = {
      readonly left: { readonly x: number };
      readonly right: { readonly y: string };
    };
    type _ = Expect<Equal<RO, Expected>>;
  });

  it('preserves optional modifiers while adding readonly', () => {
    type WithOptional = { name: string; nested?: { value: number } };
    type RO = DeepReadonly<WithOptional>;
    type Expected = {
      readonly name: string;
      readonly nested?: { readonly value: number };
    };
    type _ = Expect<Equal<RO, Expected>>;
  });

  it('leaves an empty object type unchanged', () => {
    type Empty = {};
    type RO = DeepReadonly<Empty>;
    type _ = Expect<Equal<RO, {}>>;
  });

  it('leaves a bare primitive type unchanged', () => {
    type _s = Expect<Equal<DeepReadonly<string>, string>>;
    type _n = Expect<Equal<DeepReadonly<number>, number>>;
    type _b = Expect<Equal<DeepReadonly<boolean>, boolean>>;
  });
});
