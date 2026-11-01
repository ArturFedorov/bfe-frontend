import type { MyPick } from './implement_pick';

// Compile-time assertion helpers (same pattern as the other TypeScript tasks).
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

interface User {
  id: number;
  name: string;
  admin: boolean;
  age?: number;
  readonly createdAt: Date;
}

describe('MyPick', () => {
  it('picks a single key', () => {
    type Picked = MyPick<User, 'id'>;
    type _ = Expect<Equal<Picked, { id: number }>>;
    const value: Picked = { id: 1 };
    expect(value).toEqual({ id: 1 });
  });

  it('picks multiple keys', () => {
    type Picked = MyPick<User, 'id' | 'name'>;
    type _ = Expect<Equal<Picked, { id: number; name: string }>>;
    const value: Picked = { id: 1, name: 'a' };
    expect(value).toEqual({ id: 1, name: 'a' });
  });

  it('preserves optional modifiers', () => {
    type Picked = MyPick<User, 'age'>;
    type _ = Expect<Equal<Picked, { age?: number }>>;
    const empty: Picked = {};
    const filled: Picked = { age: 30 };
    expect(empty).toEqual({});
    expect(filled).toEqual({ age: 30 });
  });

  it('preserves readonly modifiers', () => {
    type Picked = MyPick<User, 'createdAt'>;
    type _ = Expect<Equal<Picked, { readonly createdAt: Date }>>;
    const date = new Date(0);
    const value: Picked = { createdAt: date };
    expect(value.createdAt).toBe(date);
  });

  it('behaves identically to the built-in Pick', () => {
    type _ = Expect<
      Equal<MyPick<User, 'id' | 'admin'>, Pick<User, 'id' | 'admin'>>
    >;
    expect(true).toBe(true);
  });

  it('reproduces the source type when every key is picked', () => {
    type _ = Expect<Equal<MyPick<User, keyof User>, User>>;
    expect(true).toBe(true);
  });

  it('rejects keys that do not exist on the source type', () => {
    // @ts-expect-error 'nope' is not assignable to keyof User
    type _ = MyPick<User, 'nope'>;
    expect(true).toBe(true);
  });

  it('preserves complex value types (literal unions, functions)', () => {
    interface Api {
      status: 'idle' | 'loading' | 'error';
      load: (url: string) => Promise<void>;
    }
    type Picked = MyPick<Api, 'status' | 'load'>;
    type _ = Expect<
      Equal<
        Picked,
        {
          status: 'idle' | 'loading' | 'error';
          load: (url: string) => Promise<void>;
        }
      >
    >;
    const value: Picked = {
      status: 'idle',
      load: async () => {},
    };
    expect(value.status).toBe('idle');
  });
});
