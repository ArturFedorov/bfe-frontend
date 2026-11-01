import { ApiRequest, ApiResponse, Router } from './router_dispatch';

function makeReq(method: string, path: string): ApiRequest {
  return { method, path, headers: {}, query: {} };
}

describe('009 router dispatch', () => {
  describe('static routes', () => {
    it('dispatches an exact method+path match to its handler', async () => {
      const router = new Router();
      router.add('GET', '/partners', () => ({ status: 200, body: ['p1'] }));

      const res = await router.dispatch(makeReq('GET', '/partners'));

      expect(res).toEqual({ status: 200, body: ['p1'] });
    });

    it('passes the original request through to the handler', async () => {
      const router = new Router();
      const seen: ApiRequest[] = [];
      router.add('GET', '/partners', (req) => {
        seen.push(req);
        return { status: 200 };
      });

      const req = makeReq('GET', '/partners');
      req.query = { active: 'true' };
      await router.dispatch(req);

      expect(seen).toHaveLength(1);
      expect(seen[0]).toBe(req);
    });

    it('matches methods case-insensitively', async () => {
      const router = new Router();
      router.add('get', '/partners', () => ({ status: 200 }));

      const res = await router.dispatch(makeReq('GET', '/partners'));

      expect(res.status).toBe(200);
    });

    it('treats a single trailing slash as equivalent', async () => {
      const router = new Router();
      router.add('GET', '/partners', () => ({ status: 200 }));

      const res = await router.dispatch(makeReq('GET', '/partners/'));

      expect(res.status).toBe(200);
    });

    it('supports async handlers', async () => {
      const router = new Router();
      router.add('GET', '/partners', async () => ({
        status: 200,
        body: 'async',
      }));

      const res = await router.dispatch(makeReq('GET', '/partners'));

      expect(res.body).toBe('async');
    });
  });

  describe('path params', () => {
    it('extracts a single :param', async () => {
      const router = new Router();
      router.add('GET', '/partners/:id', (_req, params) => ({
        status: 200,
        body: params,
      }));

      const res = await router.dispatch(makeReq('GET', '/partners/p42'));

      expect(res.body).toEqual({ id: 'p42' });
    });

    it('extracts multiple params from one pattern', async () => {
      const router = new Router();
      router.add(
        'GET',
        '/partners/:id/deliveries/:deliveryId',
        (_req, params) => ({
          status: 200,
          body: params,
        }),
      );

      const res = await router.dispatch(
        makeReq('GET', '/partners/p42/deliveries/d7'),
      );

      expect(res.body).toEqual({ id: 'p42', deliveryId: 'd7' });
    });

    it('does not match when segment counts differ', async () => {
      const router = new Router();
      router.add('GET', '/partners/:id', () => ({ status: 200 }));

      const res = await router.dispatch(
        makeReq('GET', '/partners/p42/deliveries'),
      );

      expect(res.status).toBe(404);
    });

    it('prefers a static segment over a param regardless of order', async () => {
      const routerA = new Router();
      routerA.add('GET', '/partners/:id', () => ({
        status: 200,
        body: 'param',
      }));
      routerA.add('GET', '/partners/self', () => ({
        status: 200,
        body: 'static',
      }));

      const routerB = new Router();
      routerB.add('GET', '/partners/self', () => ({
        status: 200,
        body: 'static',
      }));
      routerB.add('GET', '/partners/:id', () => ({
        status: 200,
        body: 'param',
      }));

      expect(
        (await routerA.dispatch(makeReq('GET', '/partners/self'))).body,
      ).toBe('static');
      expect(
        (await routerB.dispatch(makeReq('GET', '/partners/self'))).body,
      ).toBe('static');
      expect(
        (await routerA.dispatch(makeReq('GET', '/partners/p42'))).body,
      ).toBe('param');
    });
  });

  describe('404 vs 405', () => {
    let router: Router;

    beforeEach(() => {
      router = new Router();
      router.add('GET', '/partners/:id', () => ({ status: 200 }));
      router.add('PUT', '/partners/:id', () => ({ status: 200 }));
      router.add('POST', '/partners', () => ({ status: 201 }));
    });

    it('returns 404 for an unknown path', async () => {
      const res = await router.dispatch(makeReq('GET', '/unknown'));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not Found' });
    });

    it('returns 405 when the path exists but the method does not', async () => {
      const res = await router.dispatch(makeReq('DELETE', '/partners/p42'));

      expect(res.status).toBe(405);
      expect(res.body).toEqual({ error: 'Method Not Allowed' });
    });

    it('lists supported methods in the Allow header, sorted and comma-joined', async () => {
      const res = await router.dispatch(makeReq('DELETE', '/partners/p42'));

      expect(res.headers).toEqual({ Allow: 'GET, PUT' });
    });

    it('computes Allow per path, not globally', async () => {
      const res = await router.dispatch(makeReq('DELETE', '/partners'));

      expect(res.status).toBe(405);
      expect(res.headers).toEqual({ Allow: 'POST' });
    });

    it('does not send Allow on a 404', async () => {
      const res = await router.dispatch(makeReq('GET', '/nope'));

      expect(res.headers?.Allow).toBeUndefined();
    });
  });
});
