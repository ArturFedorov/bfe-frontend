/**
 * A find-and-replace codemod. Replace whole-identifier occurrences of `from`
 * with `to`, WITHOUT matching substrings inside larger identifiers or strings.
 * e.g. renaming `foo` should change `foo()` but not `foobar` or `'foo'`.
 *
 * (Interview discussion: regex word-boundary approach vs. a real AST/tokenizer.)
 */
export function rename(code: string, from: string, to: string): string {
  // TODO: implement
  throw new Error('Not implemented');
}
