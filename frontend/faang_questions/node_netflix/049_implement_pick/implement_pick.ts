/**
 * Reconstruct the built-in `Pick<T, K>`.
 * Construct a type by selecting the set of properties `K` (a union of keys of
 * `T`) from `T`, using a mapped type.
 */
// TODO: replace `never` with a real mapped-type implementation.
export type MyPick<T, P extends keyof T> = {
  [K in P]: T[K];
};
