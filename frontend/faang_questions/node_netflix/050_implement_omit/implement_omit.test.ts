import type { MyOmit } from './implement_omit';

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

describe('MyOmit', () => {
  it('omits a single key', () => {
    type Omitted = MyOmit<User, 'admin'>;
    type _ = Expect<
      Equal<
        Omitted,
        { id: number; name: string; age?: number; readonly createdAt: Date }
      >
    >;
    const value: Omitted = { id: 1, name: 'a', createdAt: new Date(0) };
    expect(value.id).toBe(1);
  });

  it('omits multiple keys', () => {
    type Omitted = MyOmit<User, 'admin' | 'age' | 'createdAt'>;
    type _ = Expect<Equal<Omitted, { id: number; name: string }>>;
    const value: Omitted = { id: 1, name: 'a' };
    expect(value).toEqual({ id: 1, name: 'a' });
  });

  it('preserves optional modifiers on remaining keys', () => {
    type Omitted = MyOmit<User, 'id' | 'name' | 'admin' | 'createdAt'>;
    type _ = Expect<Equal<Omitted, { age?: number }>>;
    const empty: Omitted = {};
    const filled: Omitted = { age: 30 };
    expect(empty).toEqual({});
    expect(filled).toEqual({ age: 30 });
  });

  it('preserves readonly modifiers on remaining keys', () => {
    type Omitted = MyOmit<User, 'id' | 'name' | 'admin' | 'age'>;
    type _ = Expect<Equal<Omitted, { readonly createdAt: Date }>>;
    const date = new Date(0);
    const value: Omitted = { createdAt: date };
    expect(value.createdAt).toBe(date);
  });

  it('behaves identically to the built-in Omit', () => {
    type _ = Expect<
      Equal<MyOmit<User, 'admin' | 'age'>, Omit<User, 'admin' | 'age'>>
    >;
    expect(true).toBe(true);
  });

  it('returns the full type when omitting nothing (never)', () => {
    type _ = Expect<Equal<MyOmit<User, never>, User>>;
    expect(true).toBe(true);
  });

  it('returns an empty object when omitting every key', () => {
    type _ = Expect<Equal<MyOmit<User, keyof User>, {}>>;
    expect(true).toBe(true);
  });

  it('tolerates keys that do not exist on the source type', () => {
    // Unlike Pick, Omit accepts `K extends keyof any`, so omitting an unknown
    // key is a no-op rather than a compile error.
    type Omitted = MyOmit<User, 'does-not-exist'>;
    type _ = Expect<Equal<Omitted, User>>;
    expect(true).toBe(true);
  });

  it('preserves complex value types (literal unions, functions)', () => {
    interface Api {
      status: 'idle' | 'loading' | 'error';
      load: (url: string) => Promise<void>;
      retries: number;
    }
    type Omitted = MyOmit<Api, 'retries'>;
    type _ = Expect<
      Equal<
        Omitted,
        {
          status: 'idle' | 'loading' | 'error';
          load: (url: string) => Promise<void>;
        }
      >
    >;
    const value: Omitted = {
      status: 'idle',
      load: async () => {},
    };
    expect(value.status).toBe('idle');
  });
});
