export interface Req {
  url: string;
  [key: string]: unknown;
}
export interface Res {
  body?: unknown;
  [key: string]: unknown;
}
export type Next = () => void;
export type Middleware = (req: Req, res: Res, next: Next) => void;

/**
 * An Express-style middleware pipeline. `use` registers middleware; `handle`
 * runs them in order, each calling `next()` to pass control. Middleware that
 * does not call `next()` halts the chain.
 */
export class App {
  private readonly middlewares: Middleware[];

  constructor() {
    this.middlewares = [];
  }

  use(mw: Middleware): this {
    this.middlewares.push(mw);
    return this;
  }

  handle(req: Req, res: Res): void {
    let index = 0;

    const next = () => {
      if(index >= this.middlewares.length) return;
      const mw = this.middlewares[index++];
      mw(req, res, next);
    };

    next();
  }
}
