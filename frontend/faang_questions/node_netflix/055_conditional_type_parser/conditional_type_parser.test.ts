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

  it('resolves the root path to an empty object', () => {
    type Params = ParseRoute<'/'>;
    type _ = Expect<Equal<Params, {}>>;
  });

  it('resolves a deeper static-only path to an empty object', () => {
    type Params = ParseRoute<'/api/v1/health'>;
    type _ = Expect<Equal<Params, {}>>;
  });

  it('extracts a single param at the root', () => {
    type Params = ParseRoute<'/:id'>;
    type _ = Expect<Equal<Params, { id: string }>>;
    const params: Params = { id: '1' };
    expect(params).toEqual({ id: '1' });
  });

  it('extracts a single trailing param', () => {
    type Params = ParseRoute<'/users/:id'>;
    type _ = Expect<Equal<Params, { id: string }>>;
    const params: Params = { id: '1' };
    expect(params).toEqual({ id: '1' });
  });

  it('extracts a param followed by more static segments', () => {
    type Params = ParseRoute<'/users/:id/edit'>;
    type _ = Expect<Equal<Params, { id: string }>>;
  });

  it('extracts several consecutive params', () => {
    type Params = ParseRoute<'/:a/:b/:c'>;
    type _ = Expect<Equal<Params, { a: string; b: string; c: string }>>;
    const params: Params = { a: '1', b: '2', c: '3' };
    expect(params).toEqual({ a: '1', b: '2', c: '3' });
  });

  it('extracts three params interleaved with static segments', () => {
    type Params = ParseRoute<'/orgs/:orgId/teams/:teamId/members/:memberId'>;
    type _ = Expect<
      Equal<Params, { orgId: string; teamId: string; memberId: string }>
    >;
  });
});
