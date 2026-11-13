export type Token =
  | { type: 'text'; value: string }
  | { type: 'placeholder'; name: string; fallback: string | null; raw: string }
  | { type: 'error'; message: string; index: number };

export type Vars = { [name: string]: string | undefined };

/**
 * Lexes a message template into text / placeholder / error tokens.
 * `{{ name }}`, `{{ name | fallback }}`, `\{{` escapes a literal `{{`.
 * Never throws: bad names and unclosed placeholders become error tokens.
 */
export function tokenize(src: string): Token[] {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Substitutes placeholders from `vars`; falls back to the placeholder's
 * fallback, else keeps the raw text and records the name in `unknown` once.
 */
export function render(
  src: string,
  vars: Vars,
): { text: string; unknown: string[] } {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Unique valid placeholder names in order of first appearance. */
export function placeholders(src: string): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}
