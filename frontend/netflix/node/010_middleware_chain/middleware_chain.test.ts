import { ApiRequest, Handler, Middleware, compose } from './middleware_chain';

function makeReq(headers: Record<string, string> = {}): ApiRequest {
  return { method: 'GET', path: '/reports', headers, query: {} };
}

describe('010 middleware chain', () => {
  describe('ordering', () => {
    it('runs middlewares in array order, handler last', async () => {
      const log: string[] = [];
      const mw =
        (name: string): Middleware =>
        (req, next) => {
          log.push(name);
          return next();
        };
      const handler: Handler = () => {
        log.push('handler');
        return { status: 200 };
      };

      const app = compose([mw('auth'), mw('logging')], handler);
      await app(makeReq());

      expect(log).toEqual(['auth', 'logging', 'handler']);
    });

    it('runs post-next code in reverse (onion) order', async () => {
      const log: string[] = [];
      const mw =
        (name: string): Middleware =>
        async (req, next) => {
          log.push(`${name}:in`);
          const res = await next();
          log.push(`${name}:out`);
          return res;
        };
      const handler: Handler = () => {
        log.push('handler');
        return { status: 200 };
      };

      const app = compose([mw('a'), mw('b')], handler);
      await app(makeReq());

      expect(log).toEqual(['a:in', 'b:in', 'handler', 'b:out', 'a:out']);
    });

    it('works with an empty middleware array', async () => {
      const app = compose([], () => ({ status: 204 }));

      expect(await app(makeReq())).toEqual({ status: 204 });
    });
  });

  describe('next() semantics', () => {
    it('resolves next() with the downstream response', async () => {
      let seen: unknown;
      const spy: Middleware = async (req, next) => {
        const res = await next();
        seen = res.body;
        return res;
      };

      const app = compose([spy], () => ({ status: 200, body: 'payload' }));
      await app(makeReq());

      expect(seen).toBe('payload');
    });

    it('lets a middleware transform the response on the way out', async () => {
      const addHeader: Middleware = async (req, next) => {
        const res = await next();
        return { ...res, headers: { ...res.headers, 'x-request-id': 'r1' } };
      };

      const app = compose([addHeader], () => ({ status: 200 }));
      const res = await app(makeReq());

      expect(res).toEqual({ status: 200, headers: { 'x-request-id': 'r1' } });
    });

    it('rejects when next() is called twice', async () => {
      const double: Middleware = async (req, next) => {
        await next();
        return next();
      };

      const app = compose([double], () => ({ status: 200 }));

      await expect(app(makeReq())).rejects.toThrow(
        'next() called multiple times',
      );
    });
  });

  describe('short-circuit', () => {
    it('stops the chain when a middleware returns without calling next', async () => {
      const log: string[] = [];
      const auth: Middleware = (req, next) => {
        if (!req.headers['x-api-key']) {
          return { status: 401, body: { error: 'Unauthorized' } };
        }
        return next();
      };
      const logging: Middleware = (req, next) => {
        log.push('logging');
        return next();
      };
      const handler: Handler = () => {
        log.push('handler');
        return { status: 200 };
      };

      const app = compose([auth, logging], handler);
      const denied = await app(makeReq());

      expect(denied).toEqual({ status: 401, body: { error: 'Unauthorized' } });
      expect(log).toEqual([]);

      const allowed = await app(makeReq({ 'x-api-key': 'k1' }));
      expect(allowed.status).toBe(200);
      expect(log).toEqual(['logging', 'handler']);
    });
  });

  describe('errors', () => {
    it('routes a middleware throw to the error middleware with the original error', async () => {
      const boom = new Error('auth backend down');
      const failing: Middleware = () => {
        throw boom;
      };
      const seen: unknown[] = [];

      const app = compose(
        [failing],
        () => ({ status: 200 }),
        (err, req) => {
          seen.push(err, req.path);
          return { status: 500, body: { error: 'Internal' } };
        },
      );
      const res = await app(makeReq());

      expect(res).toEqual({ status: 500, body: { error: 'Internal' } });
      expect(seen).toEqual([boom, '/reports']);
    });

    it('skips remaining middlewares and the handler after a throw', async () => {
      const log: string[] = [];
      const failing: Middleware = () => {
        log.push('failing');
        throw new Error('boom');
      };
      const after: Middleware = (req, next) => {
        log.push('after');
        return next();
      };
      const handler: Handler = () => {
        log.push('handler');
        return { status: 200 };
      };

      const app = compose([failing, after], handler, () => ({ status: 500 }));
      await app(makeReq());

      expect(log).toEqual(['failing']);
    });

    it('catches an async rejection from the handler', async () => {
      const app = compose(
        [],
        async () => {
          throw new Error('db timeout');
        },
        (err) => ({ status: 503, body: { error: (err as Error).message } }),
      );

      expect(await app(makeReq())).toEqual({
        status: 503,
        body: { error: 'db timeout' },
      });
    });

    it('rejects with the original error when no error middleware is given', async () => {
      const boom = new Error('unhandled');
      const app = compose([], () => {
        throw boom;
      });

      await expect(app(makeReq())).rejects.toBe(boom);
    });

    it('lets upstream middlewares finish unwinding before the error middleware sees anything thrown on the way out', async () => {
      const throwOnWayOut: Middleware = async (req, next) => {
        await next();
        throw new Error('post-processing failed');
      };

      const app = compose(
        [throwOnWayOut],
        () => ({ status: 200 }),
        (err) => ({
          status: 500,
          body: { error: (err as Error).message },
        }),
      );

      expect(await app(makeReq())).toEqual({
        status: 500,
        body: { error: 'post-processing failed' },
      });
    });
  });
});
