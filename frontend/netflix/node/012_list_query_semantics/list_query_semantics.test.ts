import {
  ApiRequest,
  ApiResponse,
  Delivery,
  DeliveriesPage,
  DeliveryStore,
  Handler,
  createDeliveriesHandler,
} from './list_query_semantics';

function req(query: Record<string, string> = {}): ApiRequest {
  return { method: 'GET', path: '/deliveries', headers: {}, query };
}

function page(res: ApiResponse): DeliveriesPage {
  expect(res.status).toBe(200);
  return res.body as DeliveriesPage;
}

function ids(res: ApiResponse): string[] {
  return page(res).items.map((d) => d.id);
}

const d = (
  id: string,
  partnerId: string,
  status: Delivery['status'],
  createdAt: number,
): Delivery => ({ id, partnerId, status, createdAt });

describe('012 list query semantics', () => {
  let store: DeliveryStore;
  let handle: Handler;

  const seed = [
    d('d1', 'pA', 'pending', 100),
    d('d2', 'pB', 'delivered', 200),
    d('d6', 'pB', 'delivered', 200), // createdAt tie with d2
    d('d3', 'pA', 'failed', 300),
    d('d4', 'pB', 'pending', 400),
    d('d5', 'pA', 'pending', 500),
  ];

  beforeEach(async () => {
    store = new Map(seed.map((item) => [item.id, item]));
    handle = createDeliveriesHandler(store);
  });

  describe('sorting', () => {
    it('defaults to createdAt asc with id asc as tiebreaker', async () => {
      expect(ids(await handle(req()))).toEqual([
        'd1',
        'd2',
        'd6',
        'd3',
        'd4',
        'd5',
      ]);
    });

    it('sorts descending, still tiebreaking by id asc', async () => {
      expect(ids(await handle(req({ sort: 'createdAt:desc' })))).toEqual([
        'd5',
        'd4',
        'd3',
        'd2',
        'd6',
        'd1',
      ]);
    });

    it('sorts by multiple fields with mixed directions', async () => {
      expect(
        ids(await handle(req({ sort: 'status:asc,createdAt:desc' }))),
      ).toEqual(['d2', 'd6', 'd3', 'd5', 'd4', 'd1']);
    });
  });

  describe('filtering', () => {
    it('filters by partnerId', async () => {
      expect(ids(await handle(req({ partnerId: 'pA' })))).toEqual([
        'd1',
        'd3',
        'd5',
      ]);
    });

    it('filters by status', async () => {
      expect(ids(await handle(req({ status: 'pending' })))).toEqual([
        'd1',
        'd4',
        'd5',
      ]);
    });

    it('ANDs filters together', async () => {
      expect(
        ids(await handle(req({ partnerId: 'pA', status: 'pending' }))),
      ).toEqual(['d1', 'd5']);
    });

    it('returns an empty page for a filter with no matches', async () => {
      const body = page(await handle(req({ partnerId: 'ghost' })));

      expect(body).toEqual({ items: [], nextCursor: null });
    });
  });

  describe('cursor pagination', () => {
    it('walks all pages in order without overlap', async () => {
      const p1 = page(await handle(req({ limit: '2' })));
      expect(p1.items.map((x) => x.id)).toEqual(['d1', 'd2']);
      expect(typeof p1.nextCursor).toBe('string');

      const p2 = page(
        await handle(req({ limit: '2', cursor: p1.nextCursor as string })),
      );
      expect(p2.items.map((x) => x.id)).toEqual(['d6', 'd3']);

      const p3 = page(
        await handle(req({ limit: '2', cursor: p2.nextCursor as string })),
      );
      expect(p3.items.map((x) => x.id)).toEqual(['d4', 'd5']);
      expect(p3.nextCursor).toBeNull();
    });

    it('keeps filters and sort applied across pages', async () => {
      const q = { partnerId: 'pA', sort: 'createdAt:desc', limit: '2' };
      const p1 = page(await handle(req(q)));
      const p2 = page(
        await handle(req({ ...q, cursor: p1.nextCursor as string })),
      );

      expect(p1.items.map((x) => x.id)).toEqual(['d5', 'd3']);
      expect(p2.items.map((x) => x.id)).toEqual(['d1']);
      expect(p2.nextCursor).toBeNull();
    });

    it('does not duplicate already-served items when an insert lands before the cursor', async () => {
      const p1 = page(await handle(req({ limit: '2' })));
      expect(p1.items.map((x) => x.id)).toEqual(['d1', 'd2']);

      // sorts between d1 and d2 — a position the client has already passed
      store.set('dEarly', d('dEarly', 'pA', 'pending', 150));

      const p2 = page(
        await handle(req({ limit: '10', cursor: p1.nextCursor as string })),
      );

      expect(p2.items.map((x) => x.id)).toEqual(['d6', 'd3', 'd4', 'd5']);
    });

    it('serves an item inserted after the cursor exactly once', async () => {
      const p1 = page(await handle(req({ limit: '2' })));

      store.set('dLate', d('dLate', 'pB', 'pending', 250));

      const collected = [...p1.items.map((x) => x.id)];
      let cursor = p1.nextCursor;
      while (cursor !== null) {
        const p = page(await handle(req({ limit: '2', cursor })));
        collected.push(...p.items.map((x) => x.id));
        cursor = p.nextCursor;
      }

      expect(collected).toEqual(['d1', 'd2', 'd6', 'dLate', 'd3', 'd4', 'd5']);
      expect(new Set(collected).size).toBe(collected.length);
    });

    it('returns null nextCursor on a full final page', async () => {
      const p1 = page(await handle(req({ limit: '6' })));

      expect(p1.items).toHaveLength(6);
      expect(p1.nextCursor).toBeNull();
    });
  });

  describe('validation', () => {
    it('rejects an unknown sort field', async () => {
      const res = await handle(req({ sort: 'sizeMb:asc' }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Unknown sort field: sizeMb' });
    });

    it.each(['0', '-1', 'abc'])('rejects limit=%s', async (limit) => {
      const res = await handle(req({ limit }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid limit' });
    });

    it('rejects a garbage cursor', async () => {
      const res = await handle(req({ cursor: '!!!not-a-cursor!!!' }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid cursor' });
    });

    it('rejects a well-encoded cursor with the wrong shape', async () => {
      const cursor = Buffer.from('"just a string"').toString('base64url');

      const res = await handle(req({ cursor }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid cursor' });
    });

    it('rejects a cursor issued under a different sort', async () => {
      const p1 = page(await handle(req({ sort: 'createdAt:asc', limit: '2' })));

      const res = await handle(
        req({ sort: 'createdAt:desc', cursor: p1.nextCursor as string }),
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Cursor does not match sort' });
    });

    it('rejects unknown query parameters', async () => {
      const res = await handle(req({ offset: '20' }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Unknown query parameter: offset' });
    });
  });

  describe('routing edges', () => {
    it('404s other paths and methods', async () => {
      const wrongPath = await handle({
        method: 'GET',
        path: '/partners',
        headers: {},
        query: {},
      });
      const wrongMethod = await handle({
        method: 'POST',
        path: '/deliveries',
        headers: {},
        query: {},
      });

      expect(wrongPath.status).toBe(404);
      expect(wrongMethod.status).toBe(404);
    });
  });
});
