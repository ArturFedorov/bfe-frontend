# 095. Message Template Editor

**Difficulty:** Medium
**Estimated time:** 45–60 min
**Topics:** Tokenizer, pure rendering, controlled textarea, caret insertion, live validation, a11y status/alert

---

## Scenario

Marketing ops staff write message templates for email, push and SMS campaigns in an internal
engagement tool. A template mixes literal text with `{{first_name}}` placeholders, optional
fallbacks (`{{first_name | there}}`) and reusable content blocks (`{{block:hero-1}}`) that the
content team maintains separately. The first editor rendered placeholders with a regex, so a
typo like `{{first_nam}}` silently went out as raw braces, an unclosed `{{` ate the rest of the
message, and nobody noticed an SMS had grown past 160 characters until the carrier split it.
Build a tokenizer, a pure renderer, and a controlled `TemplateEditor` with a live preview,
problem list, block insertion at the caret, and a channel-aware character counter.

## Requirements

1. `tokenizeTemplate(src): Token[]` splits the source into tokens of the shape exported from
   `template_editor.tsx`:
   - `{{name}}` → `{ type: 'placeholder', name, raw }`; `{{name | fallback text}}` →
     the same with `fallback`. `name` and `fallback` are trimmed; `raw` is the exact source
     slice including both brace pairs.
   - `{{block:hero-1}}` → `{ type: 'block', id: 'hero-1', raw }` (id trimmed).
   - `\{{` is an escape: it produces the literal text `{{` and is **not** the start of a
     placeholder. A backslash anywhere else is ordinary text.
   - An unclosed `{{` (no `}}` after it) produces one
     `{ type: 'error', message: 'Unclosed placeholder at N', index: N }` where `N` is the
     index of the `{{` in `src`; the error consumes the rest of the source (no tokens follow).
   - `{{}}` or a whitespace-only name produces `{ type: 'error', message: 'Empty placeholder
     at N', index: N }` and tokenizing continues after the `}}`.
   - Consecutive text is merged into a single `text` token (an escape never splits text).
     The empty string tokenizes to `[]`.
2. `renderTemplate(src, vars, blocks): { text, unknown }`:
   - A placeholder whose `name` is a key of `vars` renders `vars[name]`; otherwise its
     `fallback` if present; otherwise it is kept **raw** and `name` is added to `unknown`.
   - A block renders `blocks[id]`; an unknown block is kept raw and `block:<id>` is added to
     `unknown`.
   - `unknown` lists each name once, in order of first appearance.
   - An error token renders the remaining source literally (from `index` to the end).
3. `<TemplateEditor value onChange variables blocks channel />` is **fully controlled**: the
   textarea labelled `Template` shows `value`; typing calls `onChange(nextValue)` and the
   textarea never shows text the parent did not pass back.
4. A `role="region"` named `Preview` shows `renderTemplate(value, variables, blocksById).text`,
   where `blocksById` maps each block's `id` to its `text`.
5. A `role="alert"` list (`<ul>` with one `<li>` per problem) shows, in source order:
   `Unknown placeholder: {{x}}` for each unresolved placeholder (once per name),
   `Unknown block: {{block:x}}` for each unresolved block, and the `message` of every error
   token (`Unclosed placeholder at N`, `Empty placeholder at N`). When there are no problems
   the alert element is **not rendered**.
6. A `<select>` labelled `Insert block` has a blank first option and one option per block
   showing its `label`. Choosing a block inserts `{{block:<id>}}` at the textarea caret
   (`selectionStart`), **replacing the current selection** (`selectionStart..selectionEnd`),
   calls `onChange` once with the new string, and resets the select to the blank option.
7. A `role="status"` character counter counts the **rendered preview text** (`text.length`):
   - `channel === 'sms'`: `N / 160`. When `N > 160` the status reads
     `N / 160 — over by K` (K = N − 160) and the textarea has `aria-invalid="true"`.
   - any other channel: `N characters`, and the textarea never has `aria-invalid`.

## Acceptance criteria

- [ ] `tokenizeTemplate` handles plain text, placeholder, placeholder with fallback, block,
      escaped braces, unclosed `{{`, empty name, and the empty string as specified.
- [ ] `renderTemplate` substitutes vars, falls back, keeps unknown raw and lists them once,
      renders blocks and lists unknown blocks as `block:<id>`, renders error remainder raw.
- [ ] Textarea labelled `Template` shows `value`; typing calls `onChange` with the new value;
      with a parent that ignores changes the textarea still shows the original `value`.
- [ ] Preview region named `Preview` shows the rendered text with sample variables and blocks.
- [ ] Alert lists `Unknown placeholder: {{x}}`, `Unknown block: {{block:x}}` and
      `Unclosed placeholder at N`; no alert when the template is clean.
- [ ] Insert block select inserts at the caret and calls `onChange` once, then resets.
- [ ] SMS counter `N / 160`; over limit → `over by K` + `aria-invalid="true"`; email →
      `N characters` and no `aria-invalid`.
- [ ] Senior: with the caret in the middle of the text (`setSelectionRange(6, 6)`), insertion
      lands between the two halves; with a non-empty selection it replaces the selected text.
- [ ] Senior: `\{{first_name}}` renders the literal `{{first_name}}`, produces **no**
      `Unknown placeholder` problem and no alert, and `tokenizeTemplate` yields a single text
      token for `a \{{ b`.

## Baseline a11y

- Textarea and select are associated with visible `<label>`s (`Template`, `Insert block`).
- Preview is a landmark: `role="region"` with `aria-label="Preview"`.
- Problems are announced: the list element itself carries `role="alert"`.
- The counter is `role="status"` (polite); the over-limit state is also exposed via
  `aria-invalid` on the textarea, not only by colour or text.

## Constraints

- No third-party libraries. No regex-based single-pass "replace all" — the tokenizer is a
  hand-written scanner so errors carry indices.
- `tokenizeTemplate` and `renderTemplate` are pure and synchronous.
- The component holds no copy of `value` in state (derive everything at render time).

## Interviewer follow-ups

- Nested or recursive blocks: a block's text may itself contain placeholders. Would you render
  recursively, and how do you stop `{{block:a}}` → `{{block:b}}` → `{{block:a}}`?
- Caret restoration: after inserting a block the caret should land after the inserted text.
  Why can't that be done in the same event handler in a controlled component, and where would
  you do it?
- SMS length is really about GSM-7 vs UCS-2 encoding (an emoji halves the limit to 70). How
  would you model "segments" rather than characters, and what changes in the UI?
- Per-channel validation: push titles have a hard cap, email allows HTML. Where does
  channel-specific policy live so the editor stays generic?

## Say out loud

- **State shape first:** the component is stateless over `value`; the only local state is
  the textarea ref (for the caret) and the select's displayed option. `Token` is a
  discriminated union on `type`.
- **Race / cleanup hazard:** insertion reads `selectionStart` synchronously in the change
  handler of the select — reading it later (after a re-render) gives a stale or reset caret.
- **One data-shape question:** "Are block ids globally unique, and can a block's text contain
  placeholders that must be rendered too?"
- **One failure-handling question:** "Should an unknown placeholder block sending, or is a
  raw `{{x}}` in the preview plus a warning enough for the first version?"
- **First test you'd write:** `tokenizeTemplate('Hi {{first_name | there}}!')` returns
  text / placeholder-with-fallback / text — the pure scanner before any DOM.
