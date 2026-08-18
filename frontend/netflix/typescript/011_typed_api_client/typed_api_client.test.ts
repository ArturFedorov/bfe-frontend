// Hybrid suite: runtime jest tests + inline type assertions.
// Compile errors here ARE failing tests — ts-jest type-checks this file.
import {
  createApiClient,
  DeliveryReport,
  IntegrationStatus,
  Partner,
} from './typed_api_client';

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

const cannedResponses: Record<string, unknown> = {
  '/partners': [{ id: 'p-1', name: 'Acme', tier: 'preferred' }],
  '/partners/:id': { id: 'p-1', name: 'Acme', tier: 'preferred' },
  '/integrations/:id/status': {
    integrationId: 'i-1',
    state: 'healthy',
    checkedAt: 1700000000,
  },
  '/reports/:id': { reportId: 'r-1', rows: 42, generatedAt: 1700000001 },
};

describe('011 typed_api_client — runtime', () => {
  it('delegates to the injected fetcher with the route', async () => {
    const calls: string[] = [];
    const api = createApiClient(async (route) => {
      calls.push(route);
      return cannedResponses[route];
    });

    await api.get('/partners/:id');
    expect(calls).toEqual(['/partners/:id']);
  });

  it('resolves with whatever the fetcher resolves', async () => {
    const api = createApiClient(async (route) => cannedResponses[route]);

    await expect(api.get('/partners/:id')).resolves.toEqual({
      id: 'p-1',
      name: 'Acme',
      tier: 'preferred',
    });
    await expect(api.get('/reports/:id')).resolves.toEqual({
      reportId: 'r-1',
      rows: 42,
      generatedAt: 1700000001,
    });
  });

  it('propagates fetcher rejections', async () => {
    const api = createApiClient(async () => {
      throw new Error('502 from origin');
    });

    await expect(api.get('/partners')).rejects.toThrow('502 from origin');
  });
});

// --- inference contracts (compile-time only; never executed) ---
const _contracts = () => {
  const api = createApiClient(async () => null);

  const partner = api.get('/partners/:id');
  type _PartnerRoute = Expect<Equal<typeof partner, Promise<Partner>>>;

  const list = api.get('/partners');
  type _ListRoute = Expect<Equal<typeof list, Promise<Partner[]>>>;

  const status = api.get('/integrations/:id/status');
  type _StatusRoute = Expect<Equal<typeof status, Promise<IntegrationStatus>>>;

  const report = api.get('/reports/:id');
  type _ReportRoute = Expect<Equal<typeof report, Promise<DeliveryReport>>>;

  // @ts-expect-error — routes outside the map are rejected
  api.get('/nope');

  // @ts-expect-error — close-but-wrong routes are rejected too
  api.get('/partners/');
};
void _contracts;
