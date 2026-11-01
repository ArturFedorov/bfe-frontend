import { App, Req, Res } from './http_middleware';

describe('App middleware', () => {
  it('runs middleware in order', () => {
    const app = new App();
    const order: number[] = [];
    app.use((_req, _res, next) => {
      order.push(1);
      next();
    });
    app.use((_req, _res, next) => {
      order.push(2);
      next();
    });
    app.handle({ url: '/' }, {});
    expect(order).toEqual([1, 2]);
  });

  it('halts when next() is not called', () => {
    const app = new App();
    const order: number[] = [];
    app.use((_req, res) => {
      order.push(1);
      res.body = 'done';
    });
    app.use((_req, _res, next) => {
      order.push(2);
      next();
    });
    const res: Res = {};
    app.handle({ url: '/' }, res);
    expect(order).toEqual([1]);
    expect(res.body).toBe('done');
  });

  it('does not throw when handling with no middleware registered', () => {
    const app = new App();
    expect(() => app.handle({ url: '/' }, {})).not.toThrow();
  });

  it('halts immediately when the very first middleware does not call next()', () => {
    const app = new App();
    const second = jest.fn((_req: Req, _res: Res, next: () => void) => next());
    app.use((_req, _res) => {
      /* does not call next */
    });
    app.use(second);
    app.handle({ url: '/' }, {});
    expect(second).not.toHaveBeenCalled();
  });

  it('stops a three-middleware chain at the one that halts', () => {
    const app = new App();
    const order: number[] = [];
    app.use((_req, _res, next) => {
      order.push(1);
      next();
    });
    app.use((_req, _res) => {
      order.push(2);
    });
    app.use((_req, _res, next) => {
      order.push(3);
      next();
    });
    app.handle({ url: '/' }, {});
    expect(order).toEqual([1, 2]);
  });

  it('lets middleware mutate the request and later middleware observe it', () => {
    const app = new App();
    app.use((req, _res, next) => {
      req.user = 'alice';
      next();
    });
    let seenUser: unknown;
    app.use((req, _res, next) => {
      seenUser = req.user;
      next();
    });
    app.handle({ url: '/' }, {});
    expect(seenUser).toBe('alice');
  });

  it('passes the same req and res references through the whole chain', () => {
    const app = new App();
    const seenReqs: Req[] = [];
    const seenResponses: Res[] = [];
    app.use((req, res, next) => {
      seenReqs.push(req);
      seenResponses.push(res);
      next();
    });
    app.use((req, res, next) => {
      seenReqs.push(req);
      seenResponses.push(res);
      next();
    });
    const req: Req = { url: '/' };
    const res: Res = {};
    app.handle(req, res);
    expect(seenReqs[0]).toBe(req);
    expect(seenReqs[1]).toBe(req);
    expect(seenResponses[0]).toBe(res);
    expect(seenResponses[1]).toBe(res);
  });

  it('returns the app instance from use() to allow chaining', () => {
    const app = new App();
    const order: number[] = [];
    const result = app
      .use((_req, _res, next) => {
        order.push(1);
        next();
      })
      .use((_req, _res, next) => {
        order.push(2);
        next();
      });
    expect(result).toBe(app);
    result.handle({ url: '/' }, {});
    expect(order).toEqual([1, 2]);
  });

  it('runs the full chain independently on each handle() call', () => {
    const app = new App();
    const calls: number[] = [];
    app.use((_req, _res, next) => {
      calls.push(1);
      next();
    });
    app.use((_req, _res, next) => {
      calls.push(2);
      next();
    });
    app.handle({ url: '/a' }, {});
    app.handle({ url: '/b' }, {});
    expect(calls).toEqual([1, 2, 1, 2]);
  });

  it('runs a single registered middleware that calls next()', () => {
    const app = new App();
    const mw = jest.fn((_req: Req, _res: Res, next: () => void) => next());
    app.use(mw);
    app.handle({ url: '/' }, {});
    expect(mw).toHaveBeenCalledTimes(1);
  });
});
