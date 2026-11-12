# 085. Template Tokenizer

**Difficulty:** Medium
**Topics:** Lexing, String Scanning, Error Recovery, Discriminated Unions

---

## Description

Message templates in a marketing-automation platform look like
`Hi {{ first_name | there }}, your {{ plan }} renews on {{ renewal.date }}.`
Marketers type these by hand, so the tokenizer must be forgiving: it never
throws, it reports problems as tokens in the output stream, and it keeps as
much of the original text as possible so the preview still renders.

Write `tokenize(src)` producing a flat list of tokens:

- **Text** — everything outside placeholders. Consecutive text is always
  **one** token: never emit two text tokens back to back.
- **Placeholder** — `{{ name }}` or `{{ name | fallback }}`. Whitespace
  around `name` and `fallback` is trimmed. The **first** `|` splits name
  from fallback; later `|` characters belong to the fallback. No `|` means
  `fallback: null`; `{{ x | }}` means `fallback: ''`. `raw` is the exact
  source slice from `{{` through `}}`. Names must match
  `/^[A-Za-z_][\w.]*$/` (dotted paths like `user.first_name` are fine).
- **Escape** — `\{{` yields a literal `{{` in the text (the backslash is
  dropped). A backslash anywhere else is ordinary text.
- **Error: invalid name** — a well-formed `{{ ... }}` whose name fails the
  regex produces `{ type: 'error', message: 'Invalid placeholder name "<name>"', index }`
  where `index` is the position of the opening `{{`, **and** the raw slice is
  kept as text (merged with neighbouring text) so the preview shows it.
- **Error: unclosed** — a `{{` with no later `}}` produces exactly one
  `{ type: 'error', message: 'Unclosed placeholder at <index>', index }` and
  tokenizing stops; the rest of the source belongs to that error.

Then two helpers on top of the token stream:

- `render(src, vars)` — substitutes placeholders. A name present in `vars`
  (value not `undefined`) is replaced by its value; otherwise the fallback is
  used if there is one; otherwise the `raw` text is kept and the name is
  recorded in `unknown` (once, in first-seen order). Names resolved by a
  fallback are **not** unknown. An unclosed-placeholder error renders the
  remainder of the source verbatim.
- `placeholders(src)` — unique valid placeholder names in order of first
  appearance.

## Examples

```ts
tokenize('Hi {{ first_name | there }}, plan: {{plan}}');
// [
//   { type: 'text', value: 'Hi ' },
//   { type: 'placeholder', name: 'first_name', fallback: 'there', raw: '{{ first_name | there }}' },
//   { type: 'text', value: ', plan: ' },
//   { type: 'placeholder', name: 'plan', fallback: null, raw: '{{plan}}' },
// ]

tokenize('Use \\{{ like this }} and {{ real }}');
// [ text 'Use {{ like this }} and ', placeholder real ]

tokenize('Hello {{ 1st }}!');
// [
//   { type: 'text', value: 'Hello ' },
//   { type: 'error', message: 'Invalid placeholder name "1st"', index: 6 },
//   { type: 'text', value: '{{ 1st }}!' },
// ]

tokenize('Hi {{ name');
// [ text 'Hi ', { type: 'error', message: 'Unclosed placeholder at 3', index: 3 } ]

render('Hi {{ first_name | there }}, {{ plan }} / {{ region }}', { plan: 'Pro' });
// { text: 'Hi there, Pro / {{ region }}', unknown: ['region'] }

placeholders('{{a}} {{ b | x }} {{a}} {{ c.d }}'); // ['a', 'b', 'c.d']
```

## Constraints

- `0 <= src.length <= 100_000`; a single pass over the source.
- `tokenize` never throws; all problems surface as `error` tokens.
- Text tokens are maximal (no two adjacent text tokens, no empty text
  tokens). An empty `src` tokenizes to `[]`.
- `raw` is byte-for-byte the source slice, including inner whitespace.
- `render` substitutes a value even when it is the empty string `''`; only
  `undefined` (or an absent key) counts as missing.

## Target

O(n) time, O(n) output. The shape to reach for:

```
i = 0; buf = ''
while i < n:
  if src starts with '\{{' at i: buf += '{{'; i += 3; continue
  if src starts with '{{' at i:
    close = src.indexOf('}}', i + 2)
    if close < 0: flush(buf); push error(unclosed, i); return tokens
    inner = src.slice(i + 2, close); split on first '|'; trim
    if name is valid: flush(buf); push placeholder
    else: push error(invalid, i)   # after flushing — then raw goes back into buf
    i = close + 2; continue
  buf += src[i]; i++
flush(buf)
```

Senior signal: getting the flush ordering right around an invalid name (the
error token must sit between the text before and the raw text after, and the
raw must merge with whatever text follows), and treating `\{{` as a
three-character escape rather than a lookbehind.

## Interviewer follow-up

Marketers want `{{ first_name | Hi {{ nickname }} }}` — a placeholder inside
a fallback. Your "first `|` splits, first `}}` closes" lexer can't do that.
What would you change: the grammar, the lexer into a recursive descent
parser, or the product ask? What does the error-recovery story become once
nesting exists?
