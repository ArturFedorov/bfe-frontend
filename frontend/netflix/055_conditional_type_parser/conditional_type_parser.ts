/**
 * Implement `ParseRoute<S>` that extracts path params from a route string.
 * `ParseRoute<'/users/:id/posts/:postId'>` -> { id: string; postId: string }.
 * A segment beginning with ':' is a param; others are ignored.
 */
// TODO: replace `{}` with a recursive template-literal + `infer` implementation.
type Prettify<T> = { [K in keyof T]: T[K] } & {};

type ParseRouteRaw<S extends string> =
  S extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ParseRouteRaw<`/${Rest}`>
    : S extends `${infer _Start}:${infer Param}`
      ? { [K in Param]: string }
      : {};

export type ParseRoute<S extends string> = Prettify<ParseRouteRaw<S>>;
