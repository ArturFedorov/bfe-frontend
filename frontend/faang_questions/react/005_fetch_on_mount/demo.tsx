import { useState } from 'react';
import { PartnerList } from './fetch_on_mount';

/**
 * Demo harness for PartnerList — auto-discovered by the playground.
 * A mock fetch intercepts the demo endpoints with 300–800ms latency so all
 * four states (loading / error / empty / success) are reachable.
 */
const SAMPLE_PARTNERS = [
  { id: 'p1', name: 'Pixelworks Studio' },
  { id: 'p2', name: 'Alphaline Media' },
  { id: 'p3', name: 'Iyuno Localization' },
  { id: 'p4', name: 'Deluxe Digital Post' },
];

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (!url.startsWith('/api/partners')) {
    return realFetch(input, init);
  }
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
  if (url.includes('fail=1')) {
    return new Response('Internal Server Error', { status: 500 });
  }
  const body = url.includes('region=emea') ? [] : SAMPLE_PARTNERS;
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const SCENARIOS = [
  { label: 'Success — 4 partners', endpoint: '/api/partners' },
  { label: 'Empty — no partners', endpoint: '/api/partners?region=emea' },
  { label: 'Error — HTTP 500', endpoint: '/api/partners?fail=1' },
];

export default function Demo() {
  const [endpoint, setEndpoint] = useState(SCENARIOS[0].endpoint);
  const [mountKey, setMountKey] = useState(0);
  const [mounted, setMounted] = useState(true);

  return (
    <div className="demo">
      <h2>Fetch on Mount</h2>
      <p className="demo-note">
        Implement <code>PartnerList</code> in <code>fetch_on_mount.tsx</code> —
        fetch once on mount with explicit loading / error / empty / success
        states, ignoring late responses after unmount. The demo mocks{' '}
        <code>fetch</code> with 300–800ms latency; try unmounting mid-request.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            Scenario{' '}
            <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}>
              {SCENARIOS.map((s) => (
                <option key={s.endpoint} value={s.endpoint}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => setMountKey((k) => k + 1)}>Remount (refetch)</button>
          <button onClick={() => setMounted((m) => !m)}>
            {mounted ? 'Unmount mid-request' : 'Mount'}
          </button>
        </div>
        {mounted && <PartnerList key={`${endpoint}:${mountKey}`} endpoint={endpoint} />}
      </div>
    </div>
  );
}
