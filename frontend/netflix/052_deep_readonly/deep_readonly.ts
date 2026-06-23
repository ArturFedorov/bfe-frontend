/**
 * Recursively make every property of `T` (and nested objects) `readonly`.
 */
// TODO: replace the identity with a recursive mapped type.
export type DeepReadonly<T> = T;
