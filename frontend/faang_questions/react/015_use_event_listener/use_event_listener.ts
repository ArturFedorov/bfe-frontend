export type EventTargetLike = Pick<
  EventTarget,
  'addEventListener' | 'removeEventListener'
>;

export function useEventListener<E extends Event = Event>(
  target: EventTargetLike | null,
  type: string,
  handler: (event: E) => void,
): void {
  // TODO: implement
  throw new Error('Not implemented');
}
