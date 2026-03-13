import { streamData } from "./async_generator";

describe("streamData", () => {
  it("should yield all items from multiple batches", async () => {
    let call = 0;
    const fetcher = async () => {
      call++;
      if (call === 1) return { data: [1, 2], done: false };
      if (call === 2) return { data: [3, 4], done: false };
      return { data: [5], done: true };
    };

    const results: number[] = [];
    for await (const item of streamData(fetcher)) {
      results.push(item);
    }

    expect(results).toEqual([1, 2, 3, 4, 5]);
  });

  it("should stop when done is true", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({ data: [1], done: false })
      .mockResolvedValueOnce({ data: [2], done: true });

    const results: number[] = [];
    for await (const item of streamData(fetcher)) {
      results.push(item);
    }

    expect(results).toEqual([1, 2]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("should propagate fetcher errors", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({ data: [1], done: false })
      .mockRejectedValueOnce(new Error("network error"));

    const results: number[] = [];

    await expect(async () => {
      for await (const item of streamData(fetcher)) {
        results.push(item);
      }
    }).rejects.toThrow("network error");

    expect(results).toEqual([1]);
  });

  it("should handle empty first batch", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({ data: [], done: false })
      .mockResolvedValueOnce({ data: [1, 2], done: true });

    const results: number[] = [];
    for await (const item of streamData(fetcher)) {
      results.push(item);
    }

    expect(results).toEqual([1, 2]);
  });
});
