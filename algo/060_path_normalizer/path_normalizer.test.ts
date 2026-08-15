import { normalizePath } from './path_normalizer';

describe('normalizePath', () => {
  describe('happy path', () => {
    it('leaves an already-clean path unchanged', () => {
      expect(normalizePath('/a/b/c')).toBe('/a/b/c');
    });

    it('normalizes the kitchen-sink example', () => {
      expect(normalizePath('/a/./b/../c//d')).toBe('/a/c/d');
    });

    it('returns root for root', () => {
      expect(normalizePath('/')).toBe('/');
    });
  });

  describe('dot segments', () => {
    it('removes single-dot segments', () => {
      expect(normalizePath('/a/./b/./c')).toBe('/a/b/c');
    });

    it('resolves a path made only of dots to root', () => {
      expect(normalizePath('/./.')).toBe('/');
    });
  });

  describe('dot-dot segments', () => {
    it('pops the previous segment', () => {
      expect(normalizePath('/a/b/../c')).toBe('/a/c');
    });

    it('pops multiple times', () => {
      expect(normalizePath('/a/b/c/../../d')).toBe('/a/d');
    });

    it('stays at root when .. goes past root', () => {
      expect(normalizePath('/../../a')).toBe('/a');
    });

    it('resolves to root when everything is popped', () => {
      expect(normalizePath('/a/b/../..')).toBe('/');
    });

    it('resolves a lone .. to root', () => {
      expect(normalizePath('/..')).toBe('/');
    });
  });

  describe('duplicate slashes', () => {
    it('collapses repeated slashes', () => {
      expect(normalizePath('/a//b///c')).toBe('/a/b/c');
    });

    it('collapses a run of slashes at the start', () => {
      expect(normalizePath('///a')).toBe('/a');
    });

    it('handles slashes-only input as root', () => {
      expect(normalizePath('////')).toBe('/');
    });
  });

  describe('trailing slash', () => {
    it('drops a trailing slash', () => {
      expect(normalizePath('/home//user/')).toBe('/home/user');
    });

    it('drops a trailing slash after normalization', () => {
      expect(normalizePath('/a/b/../')).toBe('/a');
    });

    it('keeps the bare root when normalization empties the path', () => {
      expect(normalizePath('/../')).toBe('/');
    });
  });

  describe('segments that only look special', () => {
    it('treats ... as an ordinary directory name', () => {
      expect(normalizePath('/a/.../b')).toBe('/a/.../b');
    });

    it('treats ..hidden and .config as ordinary names', () => {
      expect(normalizePath('/..hidden/.config')).toBe('/..hidden/.config');
    });
  });

  describe('error behavior', () => {
    it.each([
      ['empty string', ''],
      ['relative path', 'a/b/c'],
      ['dot-relative path', './a'],
      ['dot-dot-relative path', '../a'],
    ])('throws on %s', (_label, input) => {
      expect(() => normalizePath(input)).toThrow();
    });
  });

  describe('large input', () => {
    it('normalizes a 100_000-segment path in linear time', () => {
      const n = 50_000;
      // n pushes followed by n pops, ending back at root, then one real segment.
      const input = '/' + 'x/'.repeat(n) + '../'.repeat(n) + 'final';
      expect(normalizePath(input)).toBe('/final');
    });

    it('handles a long path that keeps every segment', () => {
      const n = 10_000;
      const segments = Array.from({ length: n }, (_, i) => `d${i}`);
      const input = '/' + segments.join('/');
      expect(normalizePath(input)).toBe(input);
    });
  });
});
