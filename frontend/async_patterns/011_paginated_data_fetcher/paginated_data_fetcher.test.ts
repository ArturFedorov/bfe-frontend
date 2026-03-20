import { fetchPages, take } from './paginated_data_fetcher';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function mockPageResponse(items: unknown[], nextCursor: string | null) {
  return {
    ok: true,
    json: async () => ({ items, nextCursor }),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchPages', () => {
  it('should yield all items across multiple pages', async () => {
    mockFetch
      .mockResolvedValueOnce(mockPageResponse(['a', 'b'], 'cursor1'))
      .mockResolvedValueOnce(mockPageResponse(['c', 'd'], 'cursor2'))
      .mockResolvedValueOnce(mockPageResponse(['e'], null));

    const results: string[] = [];
    for await (const item of fetchPages<string>('https://api.example.com/data')) {
      results.push(item);
    }

    expect(results).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should pass cursor as query param for subsequent pages', async () => {
    mockFetch
      .mockResolvedValueOnce(mockPageResponse([1], 'abc'))
      .mockResolvedValueOnce(mockPageResponse([2], null));

    const results: number[] = [];
    for await (const item of fetchPages<number>('https://api.example.com/items')) {
      results.push(item);
    }

    expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://api.example.com/items');
    expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://api.example.com/items?cursor=abc');
    expect(results).toEqual([1, 2]);
  });

  it('should stop when nextCursor is null', async () => {
    mockFetch.mockResolvedValueOnce(mockPageResponse([1, 2, 3], null));

    const results: number[] = [];
    for await (const item of fetchPages<number>('https://api.example.com/data')) {
      results.push(item);
    }

    expect(results).toEqual([1, 2, 3]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should stop when items array is empty', async () => {
    mockFetch
      .mockResolvedValueOnce(mockPageResponse([1], 'cursor1'))
      .mockResolvedValueOnce(mockPageResponse([], 'cursor2'));

    const results: number[] = [];
    for await (const item of fetchPages<number>('https://api.example.com/data')) {
      results.push(item);
    }

    expect(results).toEqual([1]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should propagate fetch errors', async () => {
    mockFetch
      .mockResolvedValueOnce(mockPageResponse([1], 'cursor1'))
      .mockRejectedValueOnce(new Error('network error'));

    const results: number[] = [];

    await expect(async () => {
      for await (const item of fetchPages<number>('https://api.example.com/data')) {
        results.push(item);
      }
    }).rejects.toThrow('network error');

    expect(results).toEqual([1]);
  });

  it('should handle single empty page', async () => {
    mockFetch.mockResolvedValueOnce(mockPageResponse([], null));

    const results: unknown[] = [];
    for await (const item of fetchPages('https://api.example.com/data')) {
      results.push(item);
    }

    expect(results).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('take', () => {
  it('should yield only first n items from an async iterable', async () => {
    mockFetch
      .mockResolvedValueOnce(mockPageResponse([1, 2, 3], 'c1'))
      .mockResolvedValueOnce(mockPageResponse([4, 5, 6], null));

    const results: number[] = [];
    for await (const item of take(4, fetchPages<number>('https://api.example.com/data'))) {
      results.push(item);
    }

    expect(results).toEqual([1, 2, 3, 4]);
  });

  it('should yield all items if n is greater than total', async () => {
    mockFetch.mockResolvedValueOnce(mockPageResponse([1, 2], null));

    const results: number[] = [];
    for await (const item of take(10, fetchPages<number>('https://api.example.com/data'))) {
      results.push(item);
    }

    expect(results).toEqual([1, 2]);
  });

  it('should yield nothing when n is 0', async () => {
    async function* source() {
      yield 1;
      yield 2;
    }

    const results: number[] = [];
    for await (const item of take(0, source())) {
      results.push(item);
    }

    expect(results).toEqual([]);
  });

  it('should work with any async iterable', async () => {
    async function* numbers() {
      yield 10;
      yield 20;
      yield 30;
      yield 40;
    }

    const results: number[] = [];
    for await (const item of take(2, numbers())) {
      results.push(item);
    }

    expect(results).toEqual([10, 20]);
  });

  it('should not consume more items than needed from the source', async () => {
    let yielded = 0;
    async function* counted() {
      yielded++;
      yield 'a';
      yielded++;
      yield 'b';
      yielded++;
      yield 'c';
    }

    const results: string[] = [];
    for await (const item of take(2, counted())) {
      results.push(item);
    }

    expect(results).toEqual(['a', 'b']);
    // The generator should not have advanced past the 2nd yield
    expect(yielded).toBeLessThanOrEqual(2);
  });
});
