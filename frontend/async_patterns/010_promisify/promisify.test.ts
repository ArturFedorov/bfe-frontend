import { promisify } from './promisify';

describe('promisify', () => {
  it('should resolve on success callback', async () => {
    function getValue(callback: (err: Error | null, value?: number) => void) {
      callback(null, 42);
    }

    const getValueAsync = promisify<number>(getValue);
    await expect(getValueAsync()).resolves.toBe(42);
  });

  it('should reject on error callback', async () => {
    function failFn(callback: (err: Error | null, value?: string) => void) {
      callback(new Error('something went wrong'));
    }

    const failAsync = promisify<string>(failFn);
    await expect(failAsync()).rejects.toThrow('something went wrong');
  });

  it('should pass arguments through', async () => {
    function add(
      a: number,
      b: number,
      callback: (err: Error | null, result?: number) => void,
    ) {
      callback(null, a + b);
    }

    const addAsync = promisify<number>(add);
    await expect(addAsync(3, 4)).resolves.toBe(7);
  });

  it('should preserve this context', async () => {
    const obj = {
      value: 10,
      getValue(callback: (err: Error | null, result?: number) => void) {
        callback(null, this.value);
      },
    };

    const getValueAsync = promisify<number>(obj.getValue);
    await expect(getValueAsync.call(obj)).resolves.toBe(10);
  });
});
