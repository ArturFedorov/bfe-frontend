import { firstUniqueEvent } from './first_unique_event';

describe('firstUniqueEvent', () => {
  it('returns the first id that occurs exactly once', () => {
    expect(firstUniqueEvent(['login', 'click', 'login', 'scroll'])).toBe(
      'click',
    );
  });

  it('returns the id when it is the first element', () => {
    expect(firstUniqueEvent(['boot', 'ping', 'ping'])).toBe('boot');
  });

  it('returns the id when it is the last element', () => {
    expect(firstUniqueEvent(['ping', 'ping', 'shutdown'])).toBe('shutdown');
  });

  it('returns the earliest unique id when several are unique', () => {
    expect(firstUniqueEvent(['a', 'b', 'c', 'a'])).toBe('b');
  });

  it('returns null when every id repeats', () => {
    expect(firstUniqueEvent(['a', 'b', 'a', 'b'])).toBeNull();
  });

  it('returns null for an empty batch', () => {
    expect(firstUniqueEvent([])).toBeNull();
  });

  it('returns the id for a single-element batch', () => {
    expect(firstUniqueEvent(['only'])).toBe('only');
  });

  it('treats ids occurring three or more times as non-unique', () => {
    expect(firstUniqueEvent(['x', 'x', 'x', 'y'])).toBe('y');
    expect(firstUniqueEvent(['x', 'x', 'x'])).toBeNull();
  });

  it('is case-sensitive', () => {
    expect(firstUniqueEvent(['Login', 'login', 'login'])).toBe('Login');
  });

  it('handles ids that collide with object prototype keys', () => {
    expect(firstUniqueEvent(['constructor', 'toString', 'constructor'])).toBe(
      'toString',
    );
  });

  describe('large input', () => {
    it('finds a unique id near the end of a 100k batch quickly', () => {
      const events: string[] = [];
      for (let i = 0; i < 100_000; i++) {
        events.push(`evt_${i % 50_000}`); // every id appears exactly twice
      }
      events.push('needle');
      expect(firstUniqueEvent(events)).toBe('needle');
    });

    it('returns null quickly when a 100k batch has no unique id', () => {
      const events: string[] = [];
      for (let i = 0; i < 100_000; i++) {
        events.push(`evt_${i % 50_000}`);
      }
      expect(firstUniqueEvent(events)).toBeNull();
    });
  });
});
