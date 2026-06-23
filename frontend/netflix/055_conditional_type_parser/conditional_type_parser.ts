/**
 * Implement `ParseRoute<S>` that extracts path params from a route string.
 * `ParseRoute<'/users/:id/posts/:postId'>` -> { id: string; postId: string }.
 * A segment beginning with ':' is a param; others are ignored.
 */
// TODO: replace `{}` with a recursive template-literal + `infer` implementation.
export type ParseRoute<S extends string> = {};
