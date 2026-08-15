import { dedupeSubscribers } from './dedupe_subscribers';

describe('dedupeSubscribers', () => {
  it('collapses consecutive duplicates and returns the unique count', () => {
    const emails = ['a@x.com', 'a@x.com', 'b@x.com', 'c@x.com', 'c@x.com', 'c@x.com'];
    const k = dedupeSubscribers(emails);
    expect(k).toBe(3);
    expect(emails.slice(0, k)).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
  });

  it('mutates the same array reference in place', () => {
    const emails = ['a@x.com', 'a@x.com', 'b@x.com'];
    const ref = emails;
    const k = dedupeSubscribers(emails);
    expect(ref).toBe(emails);
    expect(ref.slice(0, k)).toEqual(['a@x.com', 'b@x.com']);
  });

  it('returns 0 for an empty list', () => {
    const emails: string[] = [];
    expect(dedupeSubscribers(emails)).toBe(0);
  });

  it('returns 1 for a single subscriber', () => {
    const emails = ['solo@x.com'];
    const k = dedupeSubscribers(emails);
    expect(k).toBe(1);
    expect(emails.slice(0, k)).toEqual(['solo@x.com']);
  });

  it('leaves a list without duplicates untouched', () => {
    const emails = ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com'];
    const k = dedupeSubscribers(emails);
    expect(k).toBe(4);
    expect(emails.slice(0, k)).toEqual(['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com']);
  });

  it('collapses a list where every entry is the same email', () => {
    const emails = ['dup@x.com', 'dup@x.com', 'dup@x.com', 'dup@x.com', 'dup@x.com'];
    const k = dedupeSubscribers(emails);
    expect(k).toBe(1);
    expect(emails.slice(0, k)).toEqual(['dup@x.com']);
  });

  it('handles duplicates only at the start', () => {
    const emails = ['a@x.com', 'a@x.com', 'a@x.com', 'b@x.com', 'c@x.com'];
    const k = dedupeSubscribers(emails);
    expect(k).toBe(3);
    expect(emails.slice(0, k)).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
  });

  it('handles duplicates only at the end', () => {
    const emails = ['a@x.com', 'b@x.com', 'c@x.com', 'c@x.com', 'c@x.com'];
    const k = dedupeSubscribers(emails);
    expect(k).toBe(3);
    expect(emails.slice(0, k)).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
  });

  it('deduplicates 200_000 entries (100_000 unique) in linear time', () => {
    const unique = 100_000;
    const emails: string[] = [];
    for (let i = 0; i < unique; i++) {
      const email = `user${String(i).padStart(6, '0')}@example.com`;
      emails.push(email, email);
    }
    const k = dedupeSubscribers(emails);
    expect(k).toBe(unique);
    expect(emails[0]).toBe('user000000@example.com');
    expect(emails[k - 1]).toBe('user099999@example.com');
    for (let i = 1; i < k; i++) {
      expect(emails[i] > emails[i - 1]).toBe(true);
    }
  });
});
