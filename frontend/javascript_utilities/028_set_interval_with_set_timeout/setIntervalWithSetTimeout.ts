export function mySetInterval(
  callback: (...args: any[]) => void,
  delay: number,
  ...args: any[]
): { clear: () => void } {
  return { clear() {} };
}
