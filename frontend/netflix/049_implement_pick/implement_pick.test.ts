import type { MyPick } from './implement_pick';

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type User = { id: number; name: string; admin: boolean };

describe('MyPick', () => {
  it('picks the requested keys', () => {
    type Picked = MyPick<User, 'id' | 'name'>;
    type _ = Expect<Equal<Picked, { id: number; name: string }>>;
    const value: Picked = { id: 1, name: 'a' };
    expect(value).toEqual({ id: 1, name: 'a' });
  });
});
