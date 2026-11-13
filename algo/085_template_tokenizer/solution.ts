/**
 * 085. Template Tokenizer — reference solution
 *
 * tokenize(src)
 *   A single left-to-right scan with an index `i` and a pending text buffer
 *   `buf`. At each position, in priority order:
 *     1. `\{{`  → three-character escape: append a literal `{{` to `buf`.
 *     2. `{{`   → find the next `}}`.
 *          - none: flush `buf`, push the "Unclosed" error and STOP — the rest
 *            of the source belongs to that error.
 *          - found: split the inner slice on the FIRST `|`, trim both parts.
 *            Valid name → flush `buf`, push a placeholder (raw = exact slice).
 *            Invalid name → flush `buf`, push the error, then put the raw
 *            slice back into `buf` so it merges with any following text.
 *     3. otherwise the character is plain text → append to `buf`.
 *   `flush` only emits when `buf` is non-empty, so text tokens are maximal
 *   and never empty / adjacent. The function never throws: every problem
 *   becomes an error token.
 *
 * render(src, vars)
 *   Walks the token stream: text is copied, a placeholder is replaced by
 *   `vars[name]` when that is not `undefined`, else by its fallback when
 *   present, else its raw text is kept and the name recorded once in
 *   `unknown`. An invalid-name error contributes nothing (its raw is already
 *   in the text stream); an unclosed error appends the remainder of the
 *   source verbatim.
 *
 * placeholders(src)
 *   Unique placeholder names in first-seen order (invalid / escaped /
 *   unclosed ones never become placeholder tokens, so they are excluded for
 *   free).
 *
 * Time: O(n) — each character is visited once; `indexOf('}}')` scans only
 * the region that is then consumed. Space: O(n) output.
 */

export type Token =
  | { type: 'text'; value: string }
  | { type: 'placeholder'; name: string; fallback: string | null; raw: string }
  | { type: 'error'; message: string; index: number };

export type Vars = { [name: string]: string | undefined };

const NAME_RE = /^[A-Za-z_][\w.]*$/;

const invalidNameMessage = (name: string): string =>
  `Invalid placeholder name "${name}"`;
const unclosedMessage = (index: number): string =>
  `Unclosed placeholder at ${index}`;

/**
 * Lexes a message template into text / placeholder / error tokens.
 * `{{ name }}`, `{{ name | fallback }}`, `\{{` escapes a literal `{{`.
 * Never throws: bad names and unclosed placeholders become error tokens.
 */
export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let buf = '';
  let i = 0;
  const n = src.length;

  const flush = (): void => {
    if (buf.length > 0) {
      tokens.push({ type: 'text', value: buf });
      buf = '';
    }
  };

  while (i < n) {
    // 1. Escape: `\{{` → literal `{{`, backslash dropped.
    if (src.startsWith('\\{{', i)) {
      buf += '{{';
      i += 3;
      continue;
    }

    // 2. Placeholder opener.
    if (src.startsWith('{{', i)) {
      const close = src.indexOf('}}', i + 2);
      if (close < 0) {
        flush();
        tokens.push({ type: 'error', message: unclosedMessage(i), index: i });
        return tokens; // the remainder belongs to this error
      }

      const raw = src.slice(i, close + 2);
      const inner = src.slice(i + 2, close);
      const bar = inner.indexOf('|');
      const name = (bar < 0 ? inner : inner.slice(0, bar)).trim();
      const fallback = bar < 0 ? null : inner.slice(bar + 1).trim();

      flush(); // text before the placeholder / error comes first
      if (NAME_RE.test(name)) {
        tokens.push({ type: 'placeholder', name, fallback, raw });
      } else {
        tokens.push({
          type: 'error',
          message: invalidNameMessage(name),
          index: i,
        });
        buf += raw; // keep the raw text for the preview, merged with what follows
      }
      i = close + 2;
      continue;
    }

    // 3. Ordinary text (including a lone `{`, `}` or `\`).
    buf += src[i];
    i += 1;
  }

  flush();
  return tokens;
}

/**
 * Substitutes placeholders from `vars`; falls back to the placeholder's
 * fallback, else keeps the raw text and records the name in `unknown` once.
 */
export function render(
  src: string,
  vars: Vars,
): { text: string; unknown: string[] } {
  const tokens = tokenize(src);
  const parts: string[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        parts.push(token.value);
        break;
      case 'placeholder': {
        const value = vars[token.name];
        if (value !== undefined) {
          parts.push(value); // '' counts as present
        } else if (token.fallback !== null) {
          parts.push(token.fallback);
        } else {
          parts.push(token.raw);
          if (!seen.has(token.name)) {
            seen.add(token.name);
            unknown.push(token.name);
          }
        }
        break;
      }
      case 'error':
        // An unclosed placeholder swallowed the rest of the source: emit it
        // verbatim. Invalid-name errors already left their raw in the text.
        if (token.message === unclosedMessage(token.index)) {
          parts.push(src.slice(token.index));
        }
        break;
    }
  }

  return { text: parts.join(''), unknown };
}

/** Unique valid placeholder names in order of first appearance. */
export function placeholders(src: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const token of tokenize(src)) {
    if (token.type === 'placeholder' && !seen.has(token.name)) {
      seen.add(token.name);
      names.push(token.name);
    }
  }
  return names;
}
