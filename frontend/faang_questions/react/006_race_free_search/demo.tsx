import { useState } from 'react';
import { ResultsPanel } from './race_free_search';

/**
 * Demo harness for ResultsPanel — auto-discovered by the playground.
 * The mock search API answers shorter queries SLOWER, so typing quickly
 * ("al" → "alpha") reproduces the out-of-order race the task guards against.
 */
const CATALOG = [
  { id: 'p1', title: 'Alphaline Media' },
  { id: 'p2', title: 'Alpine Post House' },
  { id: 'p3', title: 'Altitude Sound' },
  { id: 'p4', title: 'Pixelworks Studio' },
  { id: 'p5', title: 'Deluxe Digital Post' },
  { id: 'p6', title: 'Iyuno Localization' },
];

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (!url.startsWith('/api/search')) {
    return realFetch(input, init);
  }
  const q = new URLSearchParams(url.split('?')[1] ?? '').get('q') ?? '';
  // Shorter query => slower response: makes stale responses land last.
  const latency = 300 + Math.max(0, 8 - q.length) * 60;
  await new Promise((resolve) => setTimeout(resolve, latency));
  if (q.toLowerCase() === 'fail') {
    return new Response('Search backend unavailable', { status: 500 });
  }
  const results = CATALOG.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default function Demo() {
  const [query, setQuery] = useState('');

  return (
    <div className="demo">
      <h2>Race-Free Search</h2>
      <p className="demo-note">
        Implement <code>ResultsPanel</code> in <code>race_free_search.tsx</code>{' '}
        — a search panel where stale responses never overwrite fresher ones.
        The mock API answers short queries slower: type <code>al</code>, pause a
        beat, finish <code>alpha</code> — a correct panel never flips back.
        Query <code>fail</code> simulates an HTTP 500.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            Search partners{' '}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="try: al … alpha"
            />
          </label>
        </div>
        <ResultsPanel query={query} />
      </div>
    </div>
  );
}
