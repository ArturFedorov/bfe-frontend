// Type assertions in this file fail to compile until the types are implemented —
// a compile error here IS a failing test.

import { RouteConfig, RouteName, getRoute, routes } from './satisfies_configs';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

// --- Compile-time: literal inference survives -------------------------------

type _cases = [
  Expect<
    Equal<
      RouteName,
      'partnerList' | 'partnerDetail' | 'createDelivery' | 'healthCheck'
    >
  >,
  Expect<Equal<typeof routes.partnerList.method, 'GET'>>,
  Expect<Equal<typeof routes.createDelivery.method, 'POST'>>,
  Expect<Equal<typeof routes.partnerDetail.path, '/partners/:id'>>,
  Expect<Equal<typeof routes.healthCheck.requiresAuth, false>>,
];

// Every entry still conforms to the constraint:
const conforming: Record<string, RouteConfig> = routes;
void conforming;

// --- Compile-time: wrong usage is rejected -----------------------------------

// @ts-expect-error — unknown route names must not compile
getRoute('helthCheck');

function probeGetRoute() {
  const detail = getRoute('partnerDetail');
  type _path = Expect<Equal<typeof detail.path, '/partners/:id'>>;
  // @ts-expect-error — the table is deeply readonly; configs are not mutable
  detail.requiresAuth = false;
}
void probeGetRoute;

// Wrong shapes are rejected by the same satisfies pattern:
const badShapes = {
  // @ts-expect-error — path must start with '/'
  home: { path: 'home', method: 'GET', requiresAuth: false },
  // @ts-expect-error — PATCH is not an allowed method
  patchPartner: { path: '/partners/:id', method: 'PATCH', requiresAuth: true },
} satisfies Record<string, RouteConfig>;
void badShapes;

// A plain annotation type-checks the same object but widens every literal:
const annotated: Record<string, RouteConfig> = {
  partnerList: { path: '/partners', method: 'GET', requiresAuth: true },
};
type _widened = Expect<
  Equal<(typeof annotated)[string]['method'], 'GET' | 'POST' | 'PUT' | 'DELETE'>
>;
void annotated;

// --- Runtime behavior ---------------------------------------------------------

describe('routes', () => {
  it('holds the documented entries', () => {
    expect(routes.partnerList).toEqual({
      path: '/partners',
      method: 'GET',
      requiresAuth: true,
    });
    expect(routes.healthCheck).toEqual({
      path: '/health',
      method: 'GET',
      requiresAuth: false,
    });
  });

  it('has exactly four routes', () => {
    expect(Object.keys(routes).sort()).toEqual([
      'createDelivery',
      'healthCheck',
      'partnerDetail',
      'partnerList',
    ]);
  });
});

describe('getRoute', () => {
  it('returns the config for a name', () => {
    const route = getRoute('createDelivery');
    type _method = Expect<Equal<typeof route.method, 'POST'>>;
    expect(route).toEqual({
      path: '/deliveries',
      method: 'POST',
      requiresAuth: true,
    });
  });

  it('returns the exact object from the table', () => {
    expect(getRoute('partnerDetail')).toBe(routes.partnerDetail);
  });
});
