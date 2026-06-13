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
});
