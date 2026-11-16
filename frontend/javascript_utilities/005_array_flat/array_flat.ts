export function myFlat(arr: any[], depth: number = 1): any[] {
  const result: any[] = [];

  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...myFlat(item, depth - 1));
    } else {
      result.push(item);
    }
  }

  return result;
}
