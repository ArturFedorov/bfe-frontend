import { batchRequests } from "./batch_requests";

describe("batchRequests", () => {
  it("should batch items correctly", async () => {
    const batches: number[][] = [];

    await batchRequests([1, 2, 3, 4, 5], 2, async (batch) => {
      batches.push(batch);
      return batch;
    });

    expect(batches).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should combine all results in order", async () => {
    const results = await batchRequests(
      [1, 2, 3, 4, 5],
      2,
      async (batch) => batch.map((n) => n * 10)
    );

    expect(results).toEqual([10, 20, 30, 40, 50]);
  });

  it("should handle partial last batch", async () => {
    const batches: string[][] = [];

    await batchRequests(["a", "b", "c"], 2, async (batch) => {
      batches.push(batch);
      return batch;
    });

    expect(batches).toEqual([["a", "b"], ["c"]]);
  });

  it("should handle empty array", async () => {
    const fn = jest.fn();
    const results = await batchRequests([], 3, fn);

    expect(results).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it("should handle batchSize greater than items length", async () => {
    const batches: number[][] = [];

    const results = await batchRequests([1, 2], 10, async (batch) => {
      batches.push(batch);
      return batch.map((n) => n * 2);
    });

    expect(batches).toEqual([[1, 2]]);
    expect(results).toEqual([2, 4]);
  });
});
