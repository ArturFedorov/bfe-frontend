export function dedupeSubscribers(emails: string[]): number {
  if (emails.length === 0) return 0;

  let write = 1;
  for (let read = 1; read < emails.length; read++) {
    if (emails[read] !== emails[write - 1]) emails[write++] = emails[read];
  }

  return write;
}
