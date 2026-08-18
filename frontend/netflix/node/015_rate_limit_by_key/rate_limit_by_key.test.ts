import {
  ApiRequest,
  Bucket,
  BucketStore,
  Handler,
  withRateLimit,
} from './rate_limit_by_key';

function req(key: string | null, headerName = 'x-api-key'): ApiRequest {
  return {
    method: 'GET',
    path: '/deliveries',
    headers: key === null ? {} : { [headerName]: key },
    query: {},
  };
}

describe('015 rate limit by key', () => {
  let now: number;
  let calls: number;
  let store: BucketStore;
  let limited: Handler;

  beforeEach(() => {
    now = 0;
    calls = 0;
    store = new Map<string, Bucket>();

    const handler: Handler = () => {
      calls++;
      return {
        status: 200,
        headers: { 'X-Backend': 'v1' },
        body: { ok: true },
      };
    };

    limited = withRateLimit(handler, {
      capacity: 3,
      refillPerSecond: 1,
      clock: () => now,
      store,
    });
  });

  describe('allowing', () => {
    it('lets a fresh key burst up to capacity', async () => {
      for (let i = 0; i < 3; i++) {
        expect((await limited(req('acme'))).status).toBe(200);
      }

      expect(calls).toBe(3);
    });

    it('reports remaining tokens and preserves handler headers', async () => {
      const first = await limited(req('acme'));
      const second = await limited(req('acme'));
      const third = await limited(req('acme'));

      expect(first.headers).toEqual({
        'X-Backend': 'v1',
        'X-RateLimit-Remaining': '2',
      });
      expect(second.headers?.['X-RateLimit-Remaining']).toBe('1');
      expect(third.headers?.['X-RateLimit-Remaining']).toBe('0');
    });

    it('matches the key header case-insensitively', async () => {
      await limited(req('acme', 'X-API-KEY'));
      await limited(req('acme'));

      expect(store.size).toBe(1);
      expect(store.get('acme')?.tokens).toBe(1);
    });
  });

  describe('limiting', () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) await limited(req('acme'));
    });

    it('returns 429 with Retry-After when the bucket is empty', async () => {
      const res = await limited(req('acme'));

      expect(res.status).toBe(429);
      expect(res.headers).toEqual({ 'Retry-After': '1' });
      expect(res.body).toEqual({ error: 'Rate limit exceeded' });
      expect(calls).toBe(3);
    });

    it('rounds Retry-After up to whole seconds', async () => {
      now = 400; // 0.4 tokens refilled → 0.6s until a full token

      const res = await limited(req('acme'));

      expect(res.status).toBe(429);
      expect(res.headers?.['Retry-After']).toBe('1');
    });

    it('scales Retry-After with the refill rate', async () => {
      let t = 0;
      const slow = withRateLimit(() => ({ status: 200 }), {
        capacity: 1,
        refillPerSecond: 0.25,
        clock: () => t,
      });

      await slow(req('acme'));
      const res = await slow(req('acme'));

      expect(res.headers?.['Retry-After']).toBe('4');
    });

    it('does not let refused requests consume tokens', async () => {
      await limited(req('acme'));
      await limited(req('acme'));
      now = 1_000;

      const res = await limited(req('acme'));

      expect(res.status).toBe(200);
      expect(calls).toBe(4);
    });
  });

  describe('refill', () => {
    it('refills one token per second and allows again', async () => {
      for (let i = 0; i < 3; i++) await limited(req('acme'));
      now = 1_000;

      const res = await limited(req('acme'));

      expect(res.status).toBe(200);
      expect(res.headers?.['X-RateLimit-Remaining']).toBe('0');
    });

    it('accumulates fractional refill across requests', async () => {
      for (let i = 0; i < 3; i++) await limited(req('acme'));

      now = 500;
      expect((await limited(req('acme'))).status).toBe(429);

      now = 1_000;
      expect((await limited(req('acme'))).status).toBe(200);
    });

    it('caps refill at capacity', async () => {
      for (let i = 0; i < 3; i++) await limited(req('acme'));
      now = 60_000;

      const statuses = [];
      for (let i = 0; i < 4; i++) {
        statuses.push((await limited(req('acme'))).status);
      }

      expect(statuses).toEqual([200, 200, 200, 429]);
    });
  });

  describe('isolation and policy', () => {
    it('keeps buckets independent across keys', async () => {
      for (let i = 0; i < 3; i++) await limited(req('acme'));

      expect((await limited(req('acme'))).status).toBe(429);
      expect((await limited(req('bmax'))).status).toBe(200);
    });

    it('rejects keyless requests with 401 and touches nothing', async () => {
      const res = await limited(req(null));

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Missing API key' });
      expect(calls).toBe(0);
      expect(store.size).toBe(0);
    });

    it('honours a custom key header', async () => {
      const custom = withRateLimit(() => ({ status: 200 }), {
        capacity: 1,
        refillPerSecond: 1,
        clock: () => now,
        keyHeader: 'x-partner-token',
      });

      expect((await custom(req('acme', 'x-partner-token'))).status).toBe(200);
      expect((await custom(req('acme'))).status).toBe(401);
    });
  });
});
