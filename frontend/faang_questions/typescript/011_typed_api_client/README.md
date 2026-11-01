# 011. Typed API Client

**Difficulty:** Medium
**Topics:** Generic API design, lookup types, route→response maps

---

## Scenario

The partner-tools backend exposes a handful of REST routes, and the frontend has been
calling them through `fetchJson(route): Promise<any>` — every call site casts, half of
them wrong. You're asked to wrap it: one `api.get(route)` method where the route string
itself determines the response type. One generic signature — not one overload per route,
because the route map grows every sprint.

## Requirements

- The route→response map (`RouteResponseMap`) is given — it is the single source of truth.
- Design the type for `createApiClient(fetcher)` so that `api.get(route)`:
  - only accepts routes that exist in `RouteResponseMap`;
  - returns `Promise<RouteResponseMap[R]>` for the exact route passed;
  - is **one** generic method — no overload per route.
- At runtime, `get` delegates to the injected `fetcher` and returns its result.
- Adding a new route to the map must require zero changes to the client type.

## Example

```ts
const api = createApiClient(fetchJson);

const partner = await api.get('/partners/:id');           // Partner
const status = await api.get('/integrations/:id/status'); // IntegrationStatus
api.get('/nope');                                          // compile error
```

## Target

~20 min. Done = jest suite green: runtime tests pass **and** every inline type
assertion compiles (the compile errors are part of the test suite). The stub is
deliberately `any`-typed — designing the signature is the task.

## Interviewer follow-up

- Why is a lookup type on a route map better than overloads here? When do overloads win?
- How would you extend the design to carry path params — `get('/partners/:id', { id })` — with the params type derived from the route string?
- Where does the `unknown → RouteResponseMap[R]` trust boundary live, and how would you harden it with a runtime validator?
