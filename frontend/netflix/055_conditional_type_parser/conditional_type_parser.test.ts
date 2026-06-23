import type { ParseRoute } from './conditional_type_parser';

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

describe('ParseRoute', () => {
  it('extracts named params from a route', () => {
    type Params = ParseRoute<'/users/:id/posts/:postId'>;
    type _ = Expect<Equal<Params, { id: string; postId: string }>>;
    const params: Params = { id: '1', postId: '2' };
    expect(params).toEqual({ id: '1', postId: '2' });
  });

  it('resolves to an empty object when there are no params', () => {
    type Params = ParseRoute<'/health'>;
    type _ = Expect<Equal<Params, {}>>;
    expect(true).toBe(true);
  });
});
