# 11. Async Paginated Data Fetcher

**Difficulty:** Medium
**Topics:** Async Generators, Pagination, AsyncIterator, `for await...of`

---

## Description

Implement an async paginated data fetcher using async generators:

1. **`fetchPages(url)`** — an `async function*` that fetches pages from an API one at a time, yielding each page's items individually. Stops when the API returns an empty page or `nextCursor` is `null`.

2. **`take(n, asyncIterable)`** — an `async function*` that yields only the first `n` items from any async iterable, then returns.

Both must be consumable with `for await...of`.

### API Contract

The API endpoint returns:

```ts
{ items: T[], nextCursor: string | null }
```

Pagination is driven by appending `?cursor=xxx` to the URL.

## Examples

```ts
// fetchPages yields individual items across pages
const items: string[] = [];
for await (const item of fetchPages('https://api.example.com/data')) {
  items.push(item);
}
// items === ['a', 'b', 'c', 'd', 'e'] (from multiple pages)

// take limits how many items are consumed
const first3: string[] = [];
for await (const item of take(3, fetchPages('https://api.example.com/data'))) {
  first3.push(item);
}
// first3 === ['a', 'b', 'c']
```

## Constraints

- `fetchPages` must call the API with `?cursor=<value>` for subsequent pages
- First request has no cursor query param
- Stop fetching when `nextCursor` is `null` or `items` is empty
- `take` must work with any `AsyncIterable`, not just `fetchPages`
- If the fetch fails, the error should propagate to the consumer
- Items are yielded individually, not as arrays

## Approach Hints

<details>
<summary>Hint 1</summary>
Use a `while (true)` loop inside `fetchPages`. Build the URL with or without `?cursor=` depending on whether you have a cursor. Break when `nextCursor` is null or items is empty.
</details>

<details>
<summary>Hint 2</summary>
For `take`, keep a counter. Yield items from the async iterable until you've yielded `n`, then return to close the generator.
</details>

<details>
<summary>Hint 3</summary>
Remember that `return()` is implicitly called on the async iterator when you `break` out of a `for await...of` loop or when `take` finishes early — this cleans up the source generator.
</details>
