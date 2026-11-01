import { InfinitePartnerFeed, EventsPage, PartnerEvent } from './infinite_partner_feed';

/**
 * Demo harness for InfinitePartnerFeed — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is infinite_partner_feed.test.tsx.
 */

const MESSAGES = [
  'Asset received from Acme Studios',
  'Validation failed: missing audio stem (Nordic Films)',
  'Delivery confirmed for Sakura Animation',
  'Manifest updated by Meridian Pictures',
  'Re-encode queued for Baltic Crime Bundle',
  'Subtitle pack accepted (Andes Nature Special)',
];

const PAGE_SIZE = 6;
const TOTAL_PAGES = 5;

// Mock feed: 5 pages of events with latency, then hasMore: false.
function fetchEvents(page: number): Promise<EventsPage> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const events: PartnerEvent[] = Array.from({ length: PAGE_SIZE }, (_, i) => {
        const n = (page - 1) * PAGE_SIZE + i + 1;
        return {
          id: `evt-${String(n).padStart(3, '0')}`,
          message: `#${n} · ${MESSAGES[n % MESSAGES.length]}`,
        };
      });
      resolve({ events, hasMore: page < TOTAL_PAGES });
    }, 400 + Math.random() * 400);
  });
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>Infinite Partner Feed</h2>
      <p className="demo-note">
        Implement <code>InfinitePartnerFeed</code> in{' '}
        <code>infinite_partner_feed.tsx</code> — an IntersectionObserver on a
        bottom sentinel loads the next page, with an in-flight guard against
        duplicate loads. The mock feed serves 5 pages (~400–800ms each) and
        then returns <code>hasMore: false</code>; scroll to the bottom to load
        more.
      </p>
      <div className="demo-stage">
        <div style={{ maxHeight: '20rem', overflowY: 'auto' }}>
          <InfinitePartnerFeed fetchEvents={fetchEvents} />
        </div>
      </div>
    </div>
  );
}
