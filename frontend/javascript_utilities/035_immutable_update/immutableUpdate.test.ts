import { getIn, setIn, updateIn } from './immutableUpdate';

type State = {
  user: { name: string; tags: string[]; address?: { city: string } };
  theme: string;
  list: { id: number }[];
};

function makeState(): State {
  return {
    user: { name: 'Ada', tags: ['a'] },
    theme: 'dark',
    list: [{ id: 1 }, { id: 2 }],
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value as object).forEach(deepFreeze);
  }
  return value;
}

describe('getIn', () => {
  test('should read a nested value through objects and arrays', () => {
    const state = makeState();

    expect(getIn(state, ['user', 'name'])).toBe('Ada');
    expect(getIn(state, ['list', 1, 'id'])).toBe(2);
    expect(getIn(state, ['user', 'tags', 0])).toBe('a');
    expect(getIn(state, [])).toBe(state);
  });

  test('should return the default when the path is missing', () => {
    const state = makeState();

    expect(getIn(state, ['user', 'address', 'city'], 'n/a')).toBe('n/a');
    expect(getIn(state, ['nope', 'deeper'])).toBeUndefined();
    expect(getIn(null, ['a'], 0)).toBe(0);
  });
});

describe('setIn', () => {
  test('should return a new root with the value written', () => {
    const state = makeState();
    const next = setIn(state, ['user', 'name'], 'Grace');

    expect(next.user.name).toBe('Grace');
    expect(next).not.toBe(state);
    expect(next.user).not.toBe(state.user);
  });

  test('should keep identity of untouched siblings (structural sharing)', () => {
    const state = makeState();
    const next = setIn(state, ['user', 'name'], 'Grace');

    expect(next.user.tags).toBe(state.user.tags);
    expect(next.list).toBe(state.list);
    expect(next.theme).toBe('dark');
  });

  test('should never mutate the input, even when frozen', () => {
    const state = deepFreeze(makeState());

    expect(() => setIn(state, ['list', 0, 'id'], 99)).not.toThrow();
    expect(state.list[0].id).toBe(1);
    expect(state.user.name).toBe('Ada');
  });

  test('should create intermediate objects for string keys', () => {
    const next = setIn({} as any, ['a', 'b', 'c'], 1);

    expect(next).toEqual({ a: { b: { c: 1 } } });
  });

  test('should create intermediate arrays for numeric keys', () => {
    const next = setIn({} as any, ['items', 1, 'id'], 7);

    expect(Array.isArray(next.items)).toBe(true);
    expect(next.items.length).toBe(2);
    expect(next.items[1]).toEqual({ id: 7 });
  });

  test('should keep existing arrays as arrays when copying along the path', () => {
    const state = makeState();
    const next = setIn(state, ['list', 1, 'id'], 22);

    expect(Array.isArray(next.list)).toBe(true);
    expect(next.list).toEqual([{ id: 1 }, { id: 22 }]);
    expect(next.list[0]).toBe(state.list[0]);
    expect(next.list[1]).not.toBe(state.list[1]);
  });

  test('should return the value itself for an empty path', () => {
    const state = makeState();
    const replacement = { fresh: true };

    expect(setIn(state as unknown, [], replacement)).toBe(replacement);
  });
});

describe('updateIn', () => {
  test('should apply the updater to the current value', () => {
    const state = makeState();
    const next = updateIn(state, ['user', 'tags'], (tags) => [
      ...(tags as string[]),
      'b',
    ]);

    expect(next.user.tags).toEqual(['a', 'b']);
    expect(state.user.tags).toEqual(['a']);
    expect(next.list).toBe(state.list);
  });

  test('should call the updater with undefined for a missing path', () => {
    const updater = jest.fn((n: unknown) => ((n as number) ?? 0) + 1);
    const next = updateIn({ counters: {} } as any, ['counters', 'x'], updater);

    expect(updater).toHaveBeenCalledWith(undefined);
    expect(next.counters.x).toBe(1);
  });

  test('should pass the root to the updater for an empty path', () => {
    const state = makeState();
    const next = updateIn(state, [], (root) => ({
      ...(root as State),
      theme: 'light',
    }));

    expect(next.theme).toBe('light');
    expect(next.user).toBe(state.user);
  });
});
