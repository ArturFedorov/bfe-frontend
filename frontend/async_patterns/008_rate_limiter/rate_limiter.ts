export function createRateLimiter(maxTokens: number, refillRate: number): {
  acquire: () => Promise<void>;
} {
  return { acquire: () => new Promise(() => {}) };
}
