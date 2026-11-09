const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function attemptLoop<T>(
  fn: () => Promise<T>,
  retries: number,
  initialDelay: number,
  factor: number,
): Promise<T> {
  let delay = initialDelay;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries) throw error;
      await sleep(delay);
      delay *= factor;
    }
  }
}

export function retry<T>(
  fn: () => Promise<T>,
  options: { retries: number; initialDelay: number; factor?: number },
): Promise<T> {
  const { retries, initialDelay, factor = 2 } = options;
  const result = attemptLoop(fn, retries, initialDelay, factor);

  result.catch(() => undefined);
  return result;
}
