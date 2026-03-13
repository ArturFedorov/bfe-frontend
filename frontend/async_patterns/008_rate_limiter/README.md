# 8. Token Bucket Rate Limiter

**Difficulty:** Hard
**Topics:** Rate Limiting, Token Bucket, Timers, Queuing

---

## Description

Implement a `createRateLimiter` that uses the token bucket algorithm. The limiter starts with `maxTokens` tokens. Each call to `acquire` consumes one token. If no tokens are available, the call blocks (returns a pending promise) until a token is refilled. Tokens refill at `refillRate` tokens per second.

## Examples

```ts
const limiter = createRateLimiter(3, 1); // 3 max tokens, refill 1/sec

await limiter.acquire(); // instant (2 tokens left)
await limiter.acquire(); // instant (1 token left)
await limiter.acquire(); // instant (0 tokens left)
await limiter.acquire(); // blocks ~1 second until refill
```

## Constraints

- `maxTokens` is a positive integer
- `refillRate` is tokens per second (positive number)
- `acquire` returns a promise that resolves when a token is available
- Tokens should not exceed `maxTokens` when refilling
- Queued requests should be served in FIFO order

## Approach Hints

<details>
<summary>Hint 1</summary>
Maintain a counter for available tokens and a queue (array) of pending resolve callbacks. When acquire is called and tokens > 0, decrement and resolve immediately. Otherwise, push the resolve callback to the queue.
</details>

<details>
<summary>Hint 2</summary>
Use `setInterval` to add tokens at the refill rate. On each refill tick, if the queue has waiting requests, resolve the first one instead of incrementing the token count.
</details>

<details>
<summary>Hint 3</summary>
The refill interval should be `1000 / refillRate` milliseconds. Be careful not to exceed `maxTokens` when refilling and no requests are queued.
</details>
