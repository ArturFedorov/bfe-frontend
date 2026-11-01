# 014. Paginated Wrapper

**Difficulty:** Medium
**Topics:** Generic interfaces, generic defaults, type-preserving transforms

---

## Scenario

Every list endpoint in the partner tools returns the same envelope — items, page, page
size, total — and some add endpoint-specific metadata (a cursor, a freshness timestamp).
You're defining `Paginated<T, Meta>` once, with a sensible default so the 90% case is
just `Paginated<Partner>`, plus helpers to build a page and to map its items without
losing the envelope's types.

## Requirements

- `Paginated<T, Meta = undefined>` — an envelope with `items: T[]`, `page`, `pageSize`,
  `total`, and `meta: Meta`. The `Meta` default means `Paginated<Partner>` needs no second argument.
- `paginate(items, page, pageSize)` builds one page from a full list: correct slice,
  `total` = full list length, `meta` is `undefined`.
- `mapPaginated(page, fn)` transforms `items` and returns `Paginated<U, Meta>` — the new
  item type is inferred from `fn`, the `Meta` type is preserved, envelope fields untouched.
- `fn` receives `(item, index)`; a mapper whose parameter doesn't match the item type must not compile.

## Example

```ts
const page = paginate(partners, 1, 2);          // Paginated<Partner>
const names = mapPaginated(page, (p) => p.name); // Paginated<string>
names.total;                                     // still the full count
```

## Target

~15 min. Done = jest suite green: runtime tests pass **and** every inline type
assertion compiles (the compile errors are part of the test suite).

## Interviewer follow-up

- Why default `Meta` to `undefined` rather than `{}` or `unknown`? What do the alternatives do to `page.meta` at use sites?
- Should `items` be `readonly T[]`? What ripples through `mapPaginated` if it is?
- How would you type a cursor-based envelope so page-number and cursor pagination can share `mapPaginated`?
