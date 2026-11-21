/**
 * Deduplicates a lexicographically sorted email list in place.
 *
 * After the call, the first `k` slots of `emails` hold each unique email
 * exactly once, in sorted order, where `k` is the returned value.
 * Contents past index `k - 1` are unspecified.
 *
 * @param emails - sorted subscriber emails, mutated in place
 * @returns the number of unique emails
 */
export function dedupeSubscribers(emails: string[]): number {
  if(emails.length === 0) return 0;

  let k = 1;

  for (let read = 1; read < emails.length; read++) {
    if(emails[read] !== emails[k - 1]) emails[k++] = emails[read];
  }

  return k;
}
