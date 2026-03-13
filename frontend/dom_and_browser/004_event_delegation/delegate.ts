export function delegate(
  parent: any,
  selector: string,
  eventType: string,
  handler: (e: any) => void
): { remove: () => void } {
  return { remove() {} };
}
