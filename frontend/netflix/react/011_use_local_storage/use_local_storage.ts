export type LocalStorageInitial<T> = T | (() => T);
export type SetLocalStorageValue<T> = (value: T | ((prev: T) => T)) => void;

export function useLocalStorage<T>(
  key: string,
  initial: LocalStorageInitial<T>,
): [T, SetLocalStorageValue<T>] {
  // TODO: implement
  throw new Error('Not implemented');
}
