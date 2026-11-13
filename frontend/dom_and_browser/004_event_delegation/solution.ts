/**
 * Reference solution for 004 — event delegation.
 *
 * One listener on `parent` handles events for any number of matching
 * descendants — including ones added later — instead of a listener per child.
 *
 * On each event we start at `event.target` (the innermost element) and walk
 * up through `parentNode` until we reach `parent`. The first element on that
 * path matching `selector` is the delegated target; if none matches, the event
 * is simply ignored. Stopping at `parent` matters: an ancestor OUTSIDE the
 * delegated subtree must not trigger the handler.
 */
export function delegate(
  parent: any,
  selector: string,
  eventType: string,
  handler: (e: any) => void,
): { remove: () => void } {
  const listener = (event: any): void => {
    let el = event.target;

    // Walk up the target → parent chain; `parent` itself is not a candidate.
    while (el && el !== parent) {
      if (typeof el.matches === 'function' && el.matches(selector)) {
        // `this` inside the handler is the matched element, like jQuery's .on().
        handler.call(el, event);
        return;
      }
      el = el.parentNode;
    }
  };

  parent.addEventListener(eventType, listener);

  return {
    // removeEventListener needs the SAME function reference we registered.
    remove: () => parent.removeEventListener(eventType, listener),
  };
}
