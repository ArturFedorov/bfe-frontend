import { rename } from './find_and_replace_codemod';

describe('rename', () => {
  it('renames whole identifiers', () => {
    expect(rename('foo(); foo;', 'foo', 'bar')).toBe('bar(); bar;');
  });

  it('does not touch substrings of larger identifiers', () => {
    expect(rename('foobar; barfoo;', 'foo', 'bar')).toBe('foobar; barfoo;');
  });
});

describe('rename — multiple occurrences and boundaries', () => {
  it('replaces every whole-identifier occurrence', () => {
    expect(rename('foo + foo * foo', 'foo', 'bar')).toBe('bar + bar * bar');
  });

  it('recognizes boundaries formed by punctuation', () => {
    expect(rename('(foo);[foo],{foo}', 'foo', 'bar')).toBe('(bar);[bar],{bar}');
  });

  it('recognizes boundaries across newlines and tabs', () => {
    expect(rename('foo\n\tfoo', 'foo', 'bar')).toBe('bar\n\tbar');
  });

  it('renames inside call expressions and argument lists', () => {
    expect(rename('foo(foo, foo)', 'foo', 'bar')).toBe('bar(bar, bar)');
  });

  it('renames matching identifiers while leaving other identifiers alone', () => {
    expect(rename('foo(bar, foo)', 'foo', 'baz')).toBe('baz(bar, baz)');
  });

  it('renames a standalone identifier next to a substring match', () => {
    expect(rename('foobar(foo)', 'foo', 'baz')).toBe('foobar(baz)');
  });

  it('renames property access and variable references alike', () => {
    expect(rename('obj.foo = foo', 'foo', 'baz')).toBe('obj.baz = baz');
  });

  it('renames a multi-character identifier in a realistic statement', () => {
    expect(rename('const oldName = oldName + 1;', 'oldName', 'newName')).toBe(
      'const newName = newName + 1;',
    );
  });
});

describe('rename — non-matches', () => {
  it('does not match when followed by a digit', () => {
    expect(rename('foo1 foo2', 'foo', 'bar')).toBe('foo1 foo2');
  });

  it('does not match when followed or preceded by an underscore', () => {
    expect(rename('foo_ _foo foo_bar', 'foo', 'bar')).toBe('foo_ _foo foo_bar');
  });

  it('does not match when preceded by a digit', () => {
    expect(rename('1foo 2foo', 'foo', 'bar')).toBe('1foo 2foo');
  });

  it('leaves code untouched when the identifier is absent', () => {
    expect(rename('hello world', 'foo', 'bar')).toBe('hello world');
  });
});

describe('rename — no-op and edge inputs', () => {
  it('returns an empty string unchanged', () => {
    expect(rename('', 'foo', 'bar')).toBe('');
  });

  it('renames a string that is exactly the identifier', () => {
    expect(rename('foo', 'foo', 'bar')).toBe('bar');
  });
});

describe('rename — replacement text', () => {
  it('handles a replacement longer than the original', () => {
    expect(rename('foo;', 'foo', 'longerName')).toBe('longerName;');
  });

  it('handles a replacement shorter than the original', () => {
    expect(rename('oldName;', 'oldName', 'x')).toBe('x;');
  });

  it('replaces in a single pass when the new name contains the old name', () => {
    expect(rename('a foo b', 'foo', 'foofoo')).toBe('a foofoo b');
  });
});

describe('rename — string and comment awareness (AST-level)', () => {
  it('does not rename occurrences inside string literals', () => {
    expect(rename("const s = 'foo'; foo();", 'foo', 'bar')).toBe(
      "const s = 'foo'; bar();",
    );
  });

  it('does not rename a string literal that is exactly the identifier', () => {
    expect(rename("const s = 'foo';", 'foo', 'baz')).toBe("const s = 'foo';");
  });

  it('does not rename occurrences inside line comments', () => {
    expect(rename('// foo is great\nfoo()', 'foo', 'baz')).toBe(
      '// foo is great\nbaz()',
    );
  });
});
