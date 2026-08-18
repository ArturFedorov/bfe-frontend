import {
  ApiRequest,
  CatalogItem,
  CatalogStore,
  Handler,
  computeEtag,
  createCatalogHandler,
} from './etag_caching';

function get(path: string, headers: Record<string, string> = {}): ApiRequest {
  return { method: 'GET', path, headers, query: {} };
}

function put(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): ApiRequest {
  return { method: 'PUT', path, headers, query: {}, body };
}

describe('016 etag caching', () => {
  let store: CatalogStore;
  let handle: Handler;

  const item: CatalogItem = { id: 'tt1', title: 'Dark Fjord', genre: 'drama' };

  beforeEach(() => {
    store = new Map<string, CatalogItem>([['tt1', { ...item }]]);
    handle = createCatalogHandler(store);
  });

  describe('computeEtag', () => {
    it('is a quoted sha256 hex of the representation', async () => {
      const etag = computeEtag(item);

      expect(etag).toMatch(/^"[0-9a-f]{64}"$/);
    });

    it('is stable across key order (canonical representation)', async () => {
      const a = computeEtag({ id: 'tt1', title: 'X', genre: 'g' });
      const b = computeEtag({ genre: 'g', title: 'X', id: 'tt1' });

      expect(a).toBe(b);
    });

    it('changes when any field changes', async () => {
      const a = computeEtag(item);
      const b = computeEtag({ ...item, title: 'Dark Fjord 2' });

      expect(a).not.toBe(b);
    });
  });

  describe('GET with If-None-Match', () => {
    it('serves 200 with the ETag header and body', async () => {
      const res = await handle(get('/catalog/tt1'));

      expect(res.status).toBe(200);
      expect(res.headers).toEqual({ ETag: computeEtag(item) });
      expect(res.body).toEqual(item);
    });

    it('returns 304 with an ETag header and no body on a match', async () => {
      const first = await handle(get('/catalog/tt1'));
      const etag = first.headers!.ETag;

      const res = await handle(get('/catalog/tt1', { 'If-None-Match': etag }));

      expect(res.status).toBe(304);
      expect(res.headers).toEqual({ ETag: etag });
      expect(res.body).toBeUndefined();
    });

    it('serves the full body again when the tag is stale', async () => {
      const res = await handle(
        get('/catalog/tt1', { 'If-None-Match': '"deadbeef"' }),
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(item);
    });

    it('matches within a comma-separated tag list', async () => {
      const etag = computeEtag(item);

      const res = await handle(
        get('/catalog/tt1', { 'If-None-Match': `"deadbeef", ${etag}` }),
      );

      expect(res.status).toBe(304);
    });

    it('treats * as matching any current representation', async () => {
      const res = await handle(get('/catalog/tt1', { 'If-None-Match': '*' }));

      expect(res.status).toBe(304);
    });

    it('reads the header case-insensitively', async () => {
      const res = await handle(
        get('/catalog/tt1', { 'if-none-match': computeEtag(item) }),
      );

      expect(res.status).toBe(304);
    });

    it('never matches weak tags (strong comparison)', async () => {
      const weak = `W/${computeEtag(item)}`;

      const res = await handle(get('/catalog/tt1', { 'If-None-Match': weak }));

      expect(res.status).toBe(200);
    });

    it('404s an unknown id', async () => {
      const res = await handle(get('/catalog/nope'));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not Found' });
    });
  });

  describe('PUT with If-Match', () => {
    const update = { title: 'Dark Fjord: Remastered', genre: 'drama' };

    it('replaces the item when the tag matches and returns the new ETag', async () => {
      const etag = computeEtag(item);

      const res = await handle(
        put('/catalog/tt1', update, { 'If-Match': etag }),
      );

      const expected = { id: 'tt1', ...update };
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expected);
      expect(res.headers).toEqual({ ETag: computeEtag(expected) });
      expect(store.get('tt1')).toEqual(expected);
    });

    it('rejects a stale tag with 412 and leaves the store untouched', async () => {
      const res = await handle(
        put('/catalog/tt1', update, { 'If-Match': '"deadbeef"' }),
      );

      expect(res.status).toBe(412);
      expect(res.body).toEqual({ error: 'Precondition Failed' });
      expect(store.get('tt1')).toEqual(item);
    });

    it('protects against the lost-update race', async () => {
      const read = await handle(get('/catalog/tt1'));
      const sharedTag = read.headers!.ETag;

      const editorA = await handle(
        put(
          '/catalog/tt1',
          { title: 'A cut', genre: 'drama' },
          { 'If-Match': sharedTag },
        ),
      );
      const editorB = await handle(
        put(
          '/catalog/tt1',
          { title: 'B cut', genre: 'drama' },
          { 'If-Match': sharedTag },
        ),
      );

      expect(editorA.status).toBe(200);
      expect(editorB.status).toBe(412);
      expect(store.get('tt1')?.title).toBe('A cut');
    });

    it('requires If-Match — unconditional writes get 428', async () => {
      const res = await handle(put('/catalog/tt1', update));

      expect(res.status).toBe(428);
      expect(res.body).toEqual({ error: 'Precondition Required' });
      expect(store.get('tt1')).toEqual(item);
    });

    it('accepts If-Match: * for an existing item', async () => {
      const res = await handle(
        put('/catalog/tt1', update, { 'If-Match': '*' }),
      );

      expect(res.status).toBe(200);
    });

    it('404s a PUT to an unknown id', async () => {
      const res = await handle(
        put('/catalog/nope', update, { 'If-Match': '*' }),
      );

      expect(res.status).toBe(404);
    });

    it('rejects a non-object body with 400', async () => {
      const res = await handle(
        put('/catalog/tt1', 'title=X', { 'If-Match': computeEtag(item) }),
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid body' });
    });

    it('allows the next write only with the fresh tag', async () => {
      const first = await handle(
        put('/catalog/tt1', update, { 'If-Match': computeEtag(item) }),
      );
      const freshTag = first.headers!.ETag;

      const stale = await handle(
        put(
          '/catalog/tt1',
          { title: 'Again', genre: 'drama' },
          { 'If-Match': computeEtag(item) },
        ),
      );
      const fresh = await handle(
        put(
          '/catalog/tt1',
          { title: 'Again', genre: 'drama' },
          { 'If-Match': freshTag },
        ),
      );

      expect(stale.status).toBe(412);
      expect(fresh.status).toBe(200);
    });
  });

  describe('routing edges', () => {
    it('404s unsupported methods and other paths', async () => {
      const del = await handle({
        method: 'DELETE',
        path: '/catalog/tt1',
        headers: {},
        query: {},
      });
      const other = await handle(get('/partners/tt1'));

      expect(del.status).toBe(404);
      expect(other.status).toBe(404);
    });
  });
});
