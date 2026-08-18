import { useState } from 'react';
import { useFetch } from './use_fetch';

/**
 * Demo harness for useFetch — auto-discovered by the playground.
 * The mock fetch honors AbortController: switching partners mid-flight
 * aborts the old request (rejecting with AbortError), just like the network.
 */
interface Partner {
  id: string;
  name: string;
  region: string;
  status: string;
}

const PARTNERS: Record<string, Partner> = {
  'p-100': { id: 'p-100', name: 'Pixelworks Studio', region: 'AMER', status: 'connected' },
  'p-200': { id: 'p-200', name: 'Alphaline Media', region: 'EMEA', status: 'degraded' },
  'p-300': { id: 'p-300', name: 'Iyuno Localization', region: 'APAC', status: 'connected' },
};

const realFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (!url.startsWith('/api/partners/')) {
    return realFetch(input, init);
  }
  return new Promise<Response>((resolve, reject) => {
    const id = url.slice('/api/partners/'.length);
    const timer = setTimeout(() => {
      const partner = PARTNERS[id];
      if (!partner) {
        resolve(new Response('Partner not found', { status: 404 }));
        return;
      }
      resolve(
        new Response(JSON.stringify(partner), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }, 300 + Math.random() * 500);
    init?.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    });
  });
};

function PartnerDetail({ partnerId }: { partnerId: string }) {
  const { data, error, loading, refetch } = useFetch<Partner>(`/api/partners/${partnerId}`);

  if (loading) return <p role="status">Loading partner…</p>;
  if (error) return <button onClick={refetch}>Retry: {error.message}</button>;
  return (
    <div>
      <h3>{data?.name}</h3>
      <p>
        Region: {data?.region} — status: {data?.status}
      </p>
      <button onClick={refetch}>Refetch</button>
    </div>
  );
}

export default function Demo() {
  const [partnerId, setPartnerId] = useState('p-100');

  return (
    <div className="demo">
      <h2>useFetch</h2>
      <p className="demo-note">
        Implement <code>useFetch</code> in <code>use_fetch.ts</code> — fetch
        with AbortController cancellation, so clicking partner A then B never
        lets A's slow response stomp B's data. The mock API adds 300–800ms
        latency; <code>p-404</code> returns HTTP 404. Click between partners
        fast to exercise the abort path.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          {[...Object.keys(PARTNERS), 'p-404'].map((id) => (
            <button key={id} onClick={() => setPartnerId(id)} disabled={id === partnerId}>
              {id}
            </button>
          ))}
        </div>
        <PartnerDetail partnerId={partnerId} />
      </div>
    </div>
  );
}
