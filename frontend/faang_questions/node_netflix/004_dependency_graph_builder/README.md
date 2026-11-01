# N4. Dependency Graph Builder

**Difficulty:** Medium
**Topics:** Graphs, Data Modeling

---

## Description

Given a set of `package.json`-like objects, build a directed graph mapping each
package name to the list of names it depends on.

Each input is a **manifest** with the shape:

```ts
interface PackageManifest {
  name: string;                            // the package's own name
  version: string;                         // its version (not used by the graph)
  dependencies?: Record<string, string>;   // depName -> version range
}
```

In `dependencies`, the **key** is the name of a package being depended on and the
**value** is a version range string (e.g. `'^1.0.0'`, `'~1.2.3'`, or `'*'` for
"any version"). For this task the range value is irrelevant — only the dependency
*name* (the key) ends up in the graph, so `{ b: '*' }` and `{ b: '^1.0.0' }`
produce the same edge `a -> b`.

The result is an **adjacency map**: each package name points to an array of the
names it directly depends on. A package with no outgoing edges maps to `[]`.

## Examples

```ts
buildGraph([
  { name: 'a', version: '1.0.0', dependencies: { b: '^1.0.0' } },
  { name: 'b', version: '1.0.0' },
]);
// { a: ['b'], b: [] }
```

A dependency that is referenced but never declared as its own manifest still
appears as a key:

```ts
buildGraph([
  { name: 'a', version: '1.0.0', dependencies: { ghost: '*' } },
]);
// { a: ['ghost'], ghost: [] }
```

## Constraints

- Every package should appear as a key, including leaves with no dependencies.
- A name that only ever appears as a *dependency* (never as a top-level manifest)
  must still be added as a key, mapping to `[]`.
- Only the dependency names matter for the graph (versions are out of scope here).
- The graph may contain cycles (`a -> b -> a`) and self-references (`a -> a`);
  building the adjacency map should handle these without looping forever.
- An empty input list produces an empty object (`{}`), and an empty
  `dependencies: {}` is treated the same as having no dependencies.
