import { rename } from './find_and_replace_codemod';

describe('rename', () => {
  it('renames whole identifiers', () => {
    expect(rename('foo(); foo;', 'foo', 'bar')).toBe('bar(); bar;');
  });

  it('does not touch substrings of larger identifiers', () => {
    expect(rename('foobar; barfoo;', 'foo', 'bar')).toBe('foobar; barfoo;');
  });
});
