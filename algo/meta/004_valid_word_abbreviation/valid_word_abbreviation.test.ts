import { validWordAbbreviation } from './valid_word_abbreviation';

describe('validWordAbbreviation', () => {
  it('example: internationalization', () => {
    expect(validWordAbbreviation('internationalization', 'i12iz4n')).toBe(true);
  });

  it('example: apple / a2e is too short', () => {
    expect(validWordAbbreviation('apple', 'a2e')).toBe(false);
  });

  it('rejects leading zeros', () => {
    expect(validWordAbbreviation('substitution', 's010n')).toBe(false);
  });

  it('rejects a zero-length replacement', () => {
    expect(validWordAbbreviation('a', 'a0')).toBe(false);
    expect(validWordAbbreviation('ab', 'a0b')).toBe(false);
  });

  it('accepts the whole word replaced by its length', () => {
    expect(validWordAbbreviation('word', '4')).toBe(true);
    expect(validWordAbbreviation('substitution', '12')).toBe(true);
  });

  it('accepts the word itself', () => {
    expect(validWordAbbreviation('substitution', 'substitution')).toBe(true);
  });

  it('accepts multi-part abbreviations', () => {
    expect(validWordAbbreviation('substitution', 's10n')).toBe(true);
    expect(validWordAbbreviation('substitution', 'sub4u4')).toBe(true);
    expect(validWordAbbreviation('substitution', 's55n')).toBe(false);
  });

  it('rejects a number that overshoots the word', () => {
    expect(validWordAbbreviation('word', '5')).toBe(false);
    expect(validWordAbbreviation('word', 'w4')).toBe(false);
  });

  it('rejects when the word has leftover characters', () => {
    expect(validWordAbbreviation('word', 'w2')).toBe(false);
  });

  it('rejects when the abbreviation has leftover characters', () => {
    expect(validWordAbbreviation('word', 'w3x')).toBe(false);
    expect(validWordAbbreviation('word', 'word1')).toBe(false);
  });

  it('rejects mismatched letters', () => {
    expect(validWordAbbreviation('hello', 'h3x')).toBe(false);
  });

  it('handles single-character words', () => {
    expect(validWordAbbreviation('a', '1')).toBe(true);
    expect(validWordAbbreviation('a', 'a')).toBe(true);
    expect(validWordAbbreviation('a', 'b')).toBe(false);
    expect(validWordAbbreviation('a', '2')).toBe(false);
  });

  it('parses multi-digit numbers', () => {
    expect(validWordAbbreviation('abcdefghijklmnop', 'a14p')).toBe(true);
    expect(validWordAbbreviation('abcdefghijklmnop', 'a1')).toBe(false);
  });
});
