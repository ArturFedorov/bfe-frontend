/**
 * Removes leading and trailing whitespace without using the built-in
 * trim / trimStart / trimEnd.
 *
 * `\s` in JS regex covers the same set the spec's `trim` uses: space, \t, \n,
 * \r, \f, \v, NBSP, the Unicode Zs category, and line/paragraph separators.
 * `﻿` (BOM) is also included in `\s`.
 *
 * Two anchored alternations are used rather than one greedy `^\s*|\s*$`
 * with lazy matching to keep it linear and obvious.
 */
export function myTrim(str: string): string {
  return str.replace(/^\s+/, '').replace(/\s+$/, '');
}
