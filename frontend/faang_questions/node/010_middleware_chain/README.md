# 010. Middleware Chain

**Difficulty:** Medium
**Topics:** REST, Middleware, Composition, Error Handling

---

## Scenario

Every partner API request goes through the same gauntlet: auth check, request
logging, then the actual handler — and when anything blows up mid-chain, one
error handler turns the failure into a clean JSON response instead of a stack
trace leaking to a partner. You are building that composition primitive:
express-style ordering, but framework-free, over pure `(req) => response`
handlers.

## Requirements

- `compose(middlewares, handler, errorMiddleware?)` returns a single
  `Handler: (req) => Promise<ApiResponse>`.
- Each middleware is `(req, next) => ApiResponse | Promise<ApiResponse>` where
  `next()` invokes the rest of the chain and resolves with the downstream
  response (onion model — code after `await next()` runs on the way back out).
- **Order:** middlewares run in array order; the handler runs last. Code after
  `next()` runs in reverse order (first middleware finishes last).
- **Short-circuit:** a middleware that returns a response without calling
  `next()` prevents everything downstream (including the handler) from
  running.
- **Response transformation:** a middleware may await `next()` and return a
  modified response (e.g. add a header).
- **Errors:** if any middleware or the handler throws (or rejects):
  - remaining middlewares and the handler are skipped;
  - the error middleware `(err, req) => ApiResponse | Promise<ApiResponse>`
    receives the original thrown value and its response is returned;
  - with no error middleware provided, the composed handler rejects with the
    original error.
- Calling `next()` more than once in the same middleware MUST reject with an
  error whose message contains `next() called multiple times`.

## Example

```ts
const auth: Middleware = (req, next) =>
  req.headers['x-api-key'] ? next() : { status: 401, body: { error: 'Unauthorized' } };

const handler: Handler = () => ({ status: 200, body: { ok: true } });

const app = compose([auth], handler, (err) => ({
  status: 500,
  body: { error: String(err) },
}));

await app({ method: 'GET', path: '/x', headers: {}, query: {} });
// { status: 401, body: { error: 'Unauthorized' } } — handler never ran
```

## Target

- No mutation-based plumbing: responses flow back through return values.
- ~40 minutes.

## Interviewer follow-up

- How does this compare to express's `(req, res, next)` mutation model — what
  do you gain and lose with the koa-style onion?
- Where would per-route middleware attach if you combined this with the 009
  router?
- How would you add a timeout middleware that cancels downstream work?
