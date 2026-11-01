export interface Query<T, S extends keyof T> {
  fields: S[];
  filters: Array<{ field: S; value: T[S] }>;
}

// TODO: design the builder types so that the type state accumulates:
//  - createQuery<T>() exposes ONLY select() — where()/build() before any select
//    must not compile;
//  - select(...fields) narrows the builder to the selected-field union, and
//    repeat calls accumulate into it;
//  - where(field, value) accepts only selected fields, with value: T[field];
//  - build() returns Query<T, Selected>.
// The `any` below is the task. Then implement the runtime builder.
export function createQuery<T>(): any {
  throw new Error('Not implemented');
}
