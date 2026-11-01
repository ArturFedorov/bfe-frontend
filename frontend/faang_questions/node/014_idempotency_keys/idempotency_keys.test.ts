import {
  ApiRequest,
  ApiResponse,
  Handler,
  IdempotencyEntry,
  IdempotencyStore,
  withIdempotency,
} from './idempotency_keys';

function req(key: string | null, body?: unknown): ApiRequest {
  return {
    method: 'POST',
    path: '/reports',
    headers: key === null ? {} : { 'Idempotency-Key': key },
    query: {},
    body,
  };
}

describe('014 idempotency keys', () => {
  let store: IdempotencyStore;
  let calls: number;
  let now: number;
  let post: Handler;

  beforeEach(() => {
    store = new Map<string, IdempotencyEntry>();
    calls = 0;
    now = 1_000;

    const createReport: Handler = (r) => {
      calls++;
      return {
        status: 201,
        headers: { Location: `/reports/r${calls}` },
        body: { id: `r${calls}`, payload: r.body },
      };
    };

    post = withIdempotency(createReport, {
      store,
      clock: () => now,
      ttlMs: 1_000,
    });
  });

  describe('replay', () => {
    it('runs the handler once and replays the stored response', async () => {
      const first = await post(req('k1', { period: 'Q3' }));
      const second = await post(req('k1', { period: 'Q3' }));

      expect(calls).toBe(1);
      expect(first.status).toBe(201);
      expect(second).toEqual({
        status: 201,
        headers: {
          Location: '/reports/r1',
          'Idempotency-Replayed': 'true',
        },
        body: { id: 'r1', payload: { period: 'Q3' } },
      });
    });

    it('does not mark the first response as replayed', async () => {
      const first = await post(req('k1', { period: 'Q3' }));

      expect(first.headers).toEqual({ Location: '/reports/r1' });
    });

    it('treats different keys as independent operations', async () => {
      await post(req('k1', { period: 'Q3' }));
      const other = await post(req('k2', { period: 'Q3' }));

      expect(calls).toBe(2);
      expect((other.body as { id: string }).id).toBe('r2');
    });

    it('reads the header case-insensitively', async () => {
      await post(req('k1', { period: 'Q3' }));
      const replay = await post({
        method: 'POST',
        path: '/reports',
        headers: { 'IDEMPOTENCY-KEY': 'k1' },
        query: {},
        body: { period: 'Q3' },
      });

      expect(calls).toBe(1);
      expect(replay.headers?.['Idempotency-Replayed']).toBe('true');
    });

    it('fingerprints the payload canonically — key order does not matter', async () => {
      await post(req('k1', { a: 1, nested: { x: true, y: [1, 2] } }));
      const replay = await post(
        req('k1', { nested: { y: [1, 2], x: true }, a: 1 }),
      );

      expect(calls).toBe(1);
      expect(replay.headers?.['Idempotency-Replayed']).toBe('true');
    });

    it('replays 4xx responses too', async () => {
      const rejecting = withIdempotency(
        () => {
          calls++;
          return { status: 400, body: { error: 'bad period' } };
        },
        { store, clock: () => now, ttlMs: 1_000 },
      );

      const first = await rejecting(req('k1', { period: '??' }));
      const second = await rejecting(req('k1', { period: '??' }));

      expect(calls).toBe(1);
      expect(first.status).toBe(400);
      expect(second.status).toBe(400);
      expect(second.headers?.['Idempotency-Replayed']).toBe('true');
    });
  });

  describe('payload conflicts', () => {
    it('returns 422 without running the handler on a payload mismatch', async () => {
      await post(req('k1', { period: 'Q3' }));
      const res = await post(req('k1', { period: 'Q4' }));

      expect(calls).toBe(1);
      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        error: 'Idempotency-Key reused with a different payload',
      });
    });

    it('keeps the original entry intact after a conflict', async () => {
      await post(req('k1', { period: 'Q3' }));
      await post(req('k1', { period: 'Q4' }));

      const replay = await post(req('k1', { period: 'Q3' }));

      expect(calls).toBe(1);
      expect(replay.headers?.['Idempotency-Replayed']).toBe('true');
    });
  });

  describe('missing key', () => {
    it('runs the handler every time and stores nothing', async () => {
      const a = await post(req(null, { period: 'Q3' }));
      const b = await post(req(null, { period: 'Q3' }));

      expect(calls).toBe(2);
      expect(store.size).toBe(0);
      expect(a.headers?.['Idempotency-Replayed']).toBeUndefined();
      expect(b.headers?.['Idempotency-Replayed']).toBeUndefined();
    });
  });

  describe('expiry', () => {
    it('replays within the ttl', async () => {
      await post(req('k1', { period: 'Q3' }));
      now += 999;

      await post(req('k1', { period: 'Q3' }));

      expect(calls).toBe(1);
    });

    it('re-executes after the ttl and stores the new response', async () => {
      await post(req('k1', { period: 'Q3' }));
      now += 1_000;

      const fresh = await post(req('k1', { period: 'Q3' }));
      const replay = await post(req('k1', { period: 'Q3' }));

      expect(calls).toBe(2);
      expect(fresh.headers?.['Idempotency-Replayed']).toBeUndefined();
      expect((replay.body as { id: string }).id).toBe('r2');
    });

    it('allows a different payload once the old entry expired', async () => {
      await post(req('k1', { period: 'Q3' }));
      now += 1_500;

      const res = await post(req('k1', { period: 'Q4' }));

      expect(res.status).toBe(201);
      expect(calls).toBe(2);
    });
  });

  describe('failure policy', () => {
    it('does not store 5xx responses — the retry re-executes', async () => {
      let failures = 1;
      const flaky = withIdempotency(
        (): ApiResponse => {
          calls++;
          if (failures-- > 0) return { status: 503, body: { error: 'down' } };
          return { status: 201, body: { id: 'ok' } };
        },
        { store, clock: () => now, ttlMs: 1_000 },
      );

      const first = await flaky(req('k1', { period: 'Q3' }));
      const second = await flaky(req('k1', { period: 'Q3' }));
      const third = await flaky(req('k1', { period: 'Q3' }));

      expect(first.status).toBe(503);
      expect(second.status).toBe(201);
      expect(third.status).toBe(201);
      expect(third.headers?.['Idempotency-Replayed']).toBe('true');
      expect(calls).toBe(2);
    });
  });
});
