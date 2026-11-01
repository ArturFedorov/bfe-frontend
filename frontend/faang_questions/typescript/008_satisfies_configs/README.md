# 008. Satisfies Configs

**Difficulty:** Medium
**Topics:** `satisfies`, `as const`, Literal Inference, Config Objects

---

## Scenario

The partner-tools SPA keeps its API route table in one config object. Typed as
`Record<string, RouteConfig>`, every lookup returns the widest possible shape —
`method` is a four-way union, route names autocomplete to nothing, and a typo'd
route name compiles fine. Rebuild the table with `as const satisfies` so it is
constraint-checked **and** literally inferred: exact paths, exact methods, and a
`RouteName` union derived from the object itself.

## Requirements

- `RouteConfig` (given): `path` starting with `/` (`` `/${string}` ``),
  `method: 'GET' | 'POST' | 'PUT' | 'DELETE'`, `requiresAuth: boolean`.
- `routes` — a table with entries `partnerList` (`/partners`, GET, auth),
  `partnerDetail` (`/partners/:id`, GET, auth), `createDelivery`
  (`/deliveries`, POST, auth), `healthCheck` (`/health`, GET, no auth) —
  written so that:
  - every entry is checked against `RouteConfig` (wrong shapes are rejected
    at the exact property), and
  - literal types survive: `routes.partnerList.method` is `'GET'`, not the
    union; `routes.healthCheck.requiresAuth` is `false`, not `boolean`.
- `RouteName` — derived with `keyof typeof routes`, giving the exact union
  `'partnerList' | 'partnerDetail' | 'createDelivery' | 'healthCheck'`.
- `getRoute<N extends RouteName>(name: N): (typeof routes)[N]` — returns the
  exact per-name config type; unknown names must not compile.
- Know the failure modes: annotating `: Record<string, RouteConfig>` widens
  every literal; `as const` alone skips constraint checking until first use.

## Example

```ts
routes.partnerList.method;      // type 'GET'  — not the union
getRoute('healthCheck').path;   // type '/health'
getRoute('helthCheck');         // does not compile — typo caught
const m: 'POST' = routes.createDelivery.method; // compiles
```

## Target

The route table is simultaneously constraint-checked against `RouteConfig` and
inferred at full literal precision, with `RouteName` derived — not maintained by
hand.

## Interviewer follow-up

`{ ... } as const satisfies Record<string, RouteConfig>` — walk through what
each of the three pieces contributes, and what silently degrades if you drop
any one of them.
