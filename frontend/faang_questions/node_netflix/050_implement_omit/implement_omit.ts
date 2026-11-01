/**
 * Reconstruct the built-in `Omit<T, K>`. Build it from `Pick` + `Exclude`:
 * keep every key of `T` that is not present in `K`.
 */
// TODO: replace `unknown` with a real implementation.
export type MyOmit<T, K> = {
  [S in keyof T as S extends K ? never : S]: T[S];
};
