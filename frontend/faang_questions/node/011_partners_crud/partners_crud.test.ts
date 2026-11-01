import {
  ApiRequest,
  Handler,
  Partner,
  PartnerStore,
  createPartnersHandler,
} from './partners_crud';

function req(method: string, path: string, body?: unknown): ApiRequest {
  return { method, path, headers: {}, query: {}, body };
}

describe('011 partners crud', () => {
  let store: PartnerStore;
  let handle: Handler;

  beforeEach(() => {
    store = new Map<string, Partner>();
    let n = 0;
    handle = createPartnersHandler(store, () => `p${++n}`);
  });

  function seed(partner: Partner): void {
    store.set(partner.id, partner);
  }

  const acme: Partner = {
    id: 'p9',
    name: 'Acme',
    email: 'ops@acme.io',
    tier: 'premium',
  };

  describe('POST /partners', () => {
    it('creates with 201, Location header, generated id, and default tier', async () => {
      const res = await handle(
        req('POST', '/partners', { name: 'Acme', email: 'ops@acme.io' }),
      );

      expect(res.status).toBe(201);
      expect(res.headers).toEqual({ Location: '/partners/p1' });
      expect(res.body).toEqual({
        id: 'p1',
        name: 'Acme',
        email: 'ops@acme.io',
        tier: 'standard',
      });
      expect(store.get('p1')).toEqual(res.body);
    });

    it('honours an explicit tier', async () => {
      const res = await handle(
        req('POST', '/partners', {
          name: 'Acme',
          email: 'ops@acme.io',
          tier: 'premium',
        }),
      );

      expect((res.body as Partner).tier).toBe('premium');
    });

    it('returns 400 listing every invalid field', async () => {
      const res = await handle(
        req('POST', '/partners', { name: '', email: 'nope', tier: 'gold' }),
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Validation failed',
        fields: ['name', 'email', 'tier'],
      });
      expect(store.size).toBe(0);
    });

    it('returns 400 for a missing body', async () => {
      const res = await handle(req('POST', '/partners'));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Validation failed',
        fields: ['name', 'email'],
      });
    });

    it('rejects a client-supplied id', async () => {
      const res = await handle(
        req('POST', '/partners', {
          id: 'hacker',
          name: 'Acme',
          email: 'ops@acme.io',
        }),
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Validation failed', fields: ['id'] });
    });

    it('returns 409 for a duplicate email', async () => {
      seed(acme);

      const res = await handle(
        req('POST', '/partners', { name: 'Other', email: 'ops@acme.io' }),
      );

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'Email already exists' });
      expect(store.size).toBe(1);
    });
  });

  describe('GET /partners/:id', () => {
    it('returns 200 with the partner', async () => {
      seed(acme);

      const res = await handle(req('GET', '/partners/p9'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(acme);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await handle(req('GET', '/partners/nope'));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Partner not found' });
    });
  });

  describe('PUT /partners/:id', () => {
    it('replaces the whole resource and returns 200', async () => {
      seed(acme);

      const res = await handle(
        req('PUT', '/partners/p9', {
          name: 'Acme Global',
          email: 'global@acme.io',
          tier: 'standard',
        }),
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 'p9',
        name: 'Acme Global',
        email: 'global@acme.io',
        tier: 'standard',
      });
      expect(store.get('p9')).toEqual(res.body);
    });

    it('requires every field — no PATCH-like defaulting', async () => {
      seed(acme);

      const res = await handle(
        req('PUT', '/partners/p9', { name: 'Acme Global' }),
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Validation failed',
        fields: ['email', 'tier'],
      });
      expect(store.get('p9')).toEqual(acme);
    });

    it('returns 409 when changing email onto another partner', async () => {
      seed(acme);
      seed({ id: 'p2', name: 'Bmax', email: 'ops@bmax.io', tier: 'standard' });

      const res = await handle(
        req('PUT', '/partners/p2', {
          name: 'Bmax',
          email: 'ops@acme.io',
          tier: 'standard',
        }),
      );

      expect(res.status).toBe(409);
    });

    it('allows keeping your own email', async () => {
      seed(acme);

      const res = await handle(
        req('PUT', '/partners/p9', {
          name: 'Acme 2',
          email: 'ops@acme.io',
          tier: 'premium',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 404 before validating the body', async () => {
      const res = await handle(req('PUT', '/partners/ghost', { name: '' }));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /partners/:id', () => {
    it('merges only the provided fields', async () => {
      seed(acme);

      const res = await handle(
        req('PATCH', '/partners/p9', { tier: 'standard' }),
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ...acme, tier: 'standard' });
      expect(store.get('p9')).toEqual({ ...acme, tier: 'standard' });
    });

    it('accepts an empty patch as a no-op', async () => {
      seed(acme);

      const res = await handle(req('PATCH', '/partners/p9', {}));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(acme);
    });

    it('validates the fields it does receive', async () => {
      seed(acme);

      const res = await handle(req('PATCH', '/partners/p9', { email: 'bad' }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Validation failed',
        fields: ['email'],
      });
    });

    it('rejects unknown fields by name', async () => {
      seed(acme);

      const res = await handle(
        req('PATCH', '/partners/p9', { name: 'Ok', discount: 0.5 }),
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'Validation failed',
        fields: ['discount'],
      });
    });

    it('enforces email uniqueness on patch', async () => {
      seed(acme);
      seed({ id: 'p2', name: 'Bmax', email: 'ops@bmax.io', tier: 'standard' });

      const res = await handle(
        req('PATCH', '/partners/p2', { email: 'ops@acme.io' }),
      );

      expect(res.status).toBe(409);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await handle(req('PATCH', '/partners/ghost', {}));

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /partners/:id', () => {
    it('deletes with 204 and no body', async () => {
      seed(acme);

      const res = await handle(req('DELETE', '/partners/p9'));

      expect(res.status).toBe(204);
      expect(res.body).toBeUndefined();
      expect(store.has('p9')).toBe(false);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await handle(req('DELETE', '/partners/ghost'));

      expect(res.status).toBe(404);
    });

    it('frees the email for reuse', async () => {
      seed(acme);
      await handle(req('DELETE', '/partners/p9'));

      const res = await handle(
        req('POST', '/partners', { name: 'New Acme', email: 'ops@acme.io' }),
      );

      expect(res.status).toBe(201);
    });
  });

  describe('routing edges', () => {
    it('404s an unsupported collection method', async () => {
      const res = await handle(req('GET', '/partners'));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not Found' });
    });

    it('404s an unrelated path', async () => {
      const res = await handle(req('GET', '/deliveries/d1'));

      expect(res.status).toBe(404);
    });
  });
});
