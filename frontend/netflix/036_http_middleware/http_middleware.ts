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
  use(mw: Middleware): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  handle(req: Req, res: Res): void {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
