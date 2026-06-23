import type { MyOmit } from './implement_omit';

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type User = { id: number; name: string; admin: boolean };

describe('MyOmit', () => {
  it('omits the requested keys', () => {
    type Omitted = MyOmit<User, 'admin'>;
    type _ = Expect<Equal<Omitted, { id: number; name: string }>>;
    const value: Omitted = { id: 1, name: 'a' };
    expect(value).toEqual({ id: 1, name: 'a' });
  });
});
