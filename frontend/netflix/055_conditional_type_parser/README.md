# N55. Conditional type parser (`ParseRoute`)

**Difficulty:** Hard
**Topics:** TypeScript, Template Literal Types, `infer`

---

## Description

Implement `ParseRoute<S>`, a type that extracts the path parameters from a route
string. A segment beginning with `:` is a parameter; others are ignored.

## Examples

```ts
type Params = ParseRoute<'/users/:id/posts/:postId'>;
// { id: string; postId: string }
```

## Constraints

- Use template literal types with `infer` to walk segments.
- Routes with no params resolve to `{}`.
