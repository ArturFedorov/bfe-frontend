import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export interface PartnerEvent {
  id: string;
  message: string;
}

export interface EventsPage {
  events: PartnerEvent[];
  hasMore: boolean;
}

export interface InfinitePartnerFeedProps {
  fetchEvents: (page: number) => Promise<EventsPage>;
}

/**
 * Infinite feed driven by an IntersectionObserver on a bottom sentinel.
 *
 * Senior details:
 * - `inFlightRef` (not state) guards against duplicate loads: state updates are
 *   batched/asynchronous, so two observer callbacks in the same tick would both
 *   read `loading === false`. A ref flips synchronously.
 * - `nextPageRef` tracks the page to request so the observer callback never
 *   captures a stale page number.
 * - The observer lifecycle is tied to `hasMore`: when the last page arrives the
 *   effect cleanup disconnects the observer and no new one is created.
 * - `fetchEventsRef` always points at the latest prop so a new function identity
 *   from the parent does not re-create the observer or re-fetch page 1.
 */
export function InfinitePartnerFeed({ fetchEvents }: InfinitePartnerFeedProps): ReactNode {
  const [events, setEvents] = useState<PartnerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const nextPageRef = useRef(1);
  const fetchEventsRef = useRef(fetchEvents);
  fetchEventsRef.current = fetchEvents;

  // Stable: reads everything through refs, so the identity never changes.
  const loadNextPage = useCallback(async () => {
    if (inFlightRef.current) return; // synchronous guard — see note above
    inFlightRef.current = true;
    setLoading(true);

    const page = nextPageRef.current;
    try {
      const result = await fetchEventsRef.current(page);
      nextPageRef.current = page + 1;
      setEvents((prev) => [...prev, ...result.events]); // append, never replace
      setHasMore(result.hasMore);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  // Initial page on mount. The in-flight guard also makes this StrictMode-safe
  // (the doubled effect sees inFlightRef === true and bails).
  useEffect(() => {
    void loadNextPage();
  }, [loadNextPage]);

  // Observer lifecycle: exists only while there may be more pages.
  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadNextPage();
      }
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, loadNextPage]);

  return (
    <div>
      <div role="feed" aria-busy={loading ? 'true' : 'false'}>
        {events.map((event) => (
          <article key={event.id}>{event.message}</article>
        ))}
      </div>

      {loading && <div role="status">Loading events…</div>}
      {!hasMore && <p>No more events</p>}

      {/* Sentinel stays mounted while more pages exist so the observer target is stable. */}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" />}
    </div>
  );
}
