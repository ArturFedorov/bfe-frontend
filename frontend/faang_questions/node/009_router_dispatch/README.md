# 009. Router Dispatch

**Difficulty:** Easy
**Topics:** REST, Routing, HTTP Semantics

---

## Scenario

The partner API gateway receives raw requests and must hand each one to the
right handler. Partners hit URLs like `GET /partners/p42/deliveries`, and the
router has to know that `p42` is a path parameter — and it has to answer
correctly when a partner calls a path that does not exist versus a path that
exists but does not support that method. Getting 404 vs 405 right is the
difference between "you have a typo" and "use POST instead".

## Requirements

- `Router.add(method, pattern, handler)` registers a route. Patterns are
  `/`-separated; a segment starting with `:` (e.g. `:id`) is a path parameter
  that matches exactly one non-empty segment. Method matching is
  case-insensitive (`get` and `GET` are the same route).
- `Router.dispatch(req)` returns a `Promise<ApiResponse>`:
  - On a match, call the handler with the request and an object of the
    extracted params (`{ id: 'p42' }`) and resolve with its response.
    Handlers may be sync or async.
  - **404** when no registered pattern matches the path, with body
    `{ error: 'Not Found' }`.
  - **405** when at least one pattern matches the path but none with the
    request method. The response MUST carry an `Allow` header listing the
    supported methods for that path, uppercase, alphabetically sorted,
    joined with `', '` (e.g. `'DELETE, GET'`), and body
    `{ error: 'Method Not Allowed' }`.
- A static segment beats a param segment: with both `/partners/self` and
  `/partners/:id` registered, `GET /partners/self` hits the static route —
  regardless of registration order.
- No pattern matches a path with a different number of segments (no implicit
  trailing-slash forgiveness beyond a single trailing `/` being equivalent:
  `/partners/` === `/partners`).

## Example

```ts
const router = new Router();
router.add('GET', '/partners/:id', (req, params) => ({
  status: 200,
  body: { id: params.id },
}));

await router.dispatch({ method: 'GET', path: '/partners/p42', headers: {}, query: {} });
// { status: 200, body: { id: 'p42' } }

await router.dispatch({ method: 'DELETE', path: '/partners/p42', headers: {}, query: {} });
// { status: 405, headers: { Allow: 'GET' }, body: { error: 'Method Not Allowed' } }
```

## Target

- Dispatch is O(routes) or better; no regex-per-request compilation.
- ~30 minutes.

## Interviewer follow-up

- Where would you add wildcard (`*`) segments, and how do they change
  precedence rules?
- How would you return the matched route's pattern for metrics/tracing
  without leaking it to the client?
- What changes if two params must not match the same segment types (e.g.
  `:id` numeric vs `:slug` text)?
