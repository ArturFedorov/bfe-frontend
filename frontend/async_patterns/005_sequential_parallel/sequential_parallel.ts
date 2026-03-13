export function sequential<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  return new Promise(() => {});
}

export function parallel<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  return new Promise(() => {});
}
