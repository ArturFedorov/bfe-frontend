# Milestone 05. Templates: Tokenizer, Renderer, Editor

**Difficulty:** Medium
**Estimated time:** 2 evenings (language: 1, editor: 1)
**Topics:** Hand-written tokenizer, recursive expansion with depth guard, error recovery, derived state, live preview, GSM 03.38 / UCS-2 SMS segmentation

---

## Scenario

Every message Campaign Studio sends is a template: `Hi {{first_name | there}},
thanks for joining on the {{plan}} plan. {{block:footer}}`. Content editors
want to see the rendered result as they type, be told about every mistake
(an unclosed tag, a block that does not exist, a variable nobody provides),
and — for SMS — know how many segments they are about to pay for. Build the
template language (`template.ts`) and the editor (`TemplateEditor.tsx`).

## How it plugs into the app

The **Templates** tab in `app/App.tsx` renders `<TemplateEditor />` inside a
`TaskBoundary`. The component reads `listTemplates()` and `listBlocks()` from
`shell/api`, and writes with `saveTemplate(t)`. Fixture templates `t1`–`t6`
exercise every feature; `t6` is deliberately broken. Tests pass their own
`createApi({ latencyMs: 0 })`.

## The language

| Source                    | Meaning                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `{{name}}`                | placeholder, required                                       |
| `{{name \| fallback}}`    | placeholder with a fallback when the var is missing / empty |
| `{{block:id}}`            | CMS block, expanded recursively                             |
| `\{{`                     | escape: emits the literal characters `{{`                   |

Identifiers match `[A-Za-z_][A-Za-z0-9_]*`. Whitespace inside the braces is
ignored (`{{ plan | free }}` → name `plan`, fallback `free`, both trimmed).

## Requirements — `template.ts`

1. `tokenize(source)` returns `Token[]` in source order:
   - consecutive literal text — including the output of `\{{` — is merged into
     one `text` token; the empty string yields `[]`;
   - `placeholder` tokens carry `name`, optional `fallback` (only when a `|` is
     present) and `raw` (the exact source slice `{{…}}`);
   - `block` tokens carry `id` and `raw`;
   - `error` tokens: an unclosed `{{` consumes up to the next `{{` or the end of
     input (message mentions "unclosed"); `{{}}` is an "empty" tag; a name or id
     that is not an identifier reports a bad "identifier"; `{{block:}}` is an
     error. Parsing continues after an error.
2. `placeholders(source)` — unique placeholder names in first-seen order; blocks
   and error tokens are ignored; it does not look inside blocks.
3. `render(source, { vars, blocks, maxDepth = 8 })` returns `{ output, problems }`:
   - `undefined`, `null` and `''` vars use the fallback; without one the tag
     renders as empty text and records `missing_var` (one problem per occurrence);
   - numbers and booleans are stringified;
   - blocks expand recursively with the same `vars`; a block may contain
     placeholders and other blocks;
   - an unknown block renders empty and records `missing_block`;
   - expanding a block when the nesting depth would exceed `maxDepth` records
     `cycle` (once per offending tag) and renders nothing for that tag;
   - error tokens render as their `raw` text and record `syntax`;
   - `problems` follow source order (block problems appear where the block is used).
4. `smsInfo(text)`:
   - `encoding` is `gsm7` when every character is in the GSM 03.38 basic set or
     its extension table (`^{}\[~]|€` and form feed); otherwise `ucs2`;
   - `chars` counts septets for GSM-7 (extension characters cost 2) and UTF-16
     code units for UCS-2;
   - `segments`: 0 for empty; 1 up to 160 / 70; otherwise `ceil(chars / 153)` /
     `ceil(chars / 67)`;
   - `remaining`: characters left in the current segment budget
     (`160 - chars`, or `segments * 153 - chars` once concatenated; 70 / 67 for UCS-2).

## Requirements — `TemplateEditor.tsx`

5. On mount call `listTemplates()` and `listBlocks()` once each. Open the
   template with `templateId`, or the first one when omitted. Show `Loading
   template…` until both resolve.
6. Render `<textarea aria-label="Template body">` with the body; email
   templates also get `<input aria-label="Subject">`.
7. The preview (`aria-label="Preview"`, a `<pre>`) shows `render(body, {
   vars: sampleVars, blocks })` using the real CMS blocks and updates on every
   keystroke. `sampleVars` defaults to `DEFAULT_SAMPLE_VARS`.
8. When `render` reports problems, show a `role="alert"` containing a list with
   one `<li>` per problem (message + raw tag). Remove the alert when the body is
   clean again.
9. `<select aria-label="Insert block">` lists every block by name with an empty
   "Insert block…" option selected. Choosing a block appends `{{block:<id>}}`
   to the end of the body and resets the select to the empty option.
10. For `sms` templates show `role="status"` with
    `${chars} chars · ${segments} segment(s) · GSM-7|UCS-2` computed from the
    **rendered** output. Email and push templates have no counter.
11. `Save` calls `api.saveTemplate({ ...template, body, subject })` and then
    `onSaved(saved)`; a failed save shows the error, the body stays editable.

## Acceptance Criteria

- [ ] `tokenize` handles text, placeholders ± fallback, blocks, `\{{`, and
      whitespace inside braces; `''` → `[]`.
- [ ] Error tokens for unclosed tags (raw up to the next `{{`), empty tags, bad
      identifiers, `{{block:}}`; parsing continues afterwards.
- [ ] `placeholders` unique, ordered, ignores blocks/errors.
- [ ] `render` fallbacks for `undefined`/`null`/`''`, `missing_var` per occurrence,
      stringified numbers/booleans.
- [ ] Fixture `t1` with the fixture blocks renders exactly
      `=== Campaign Studio ===\nHi Ava,\n\nThanks for joining on the pro plan.\n\nSent by Campaign Studio. Reply STOP to unsubscribe.`
- [ ] Fixture `t6` yields one `syntax` and one `missing_block` problem, in that order.
- [ ] A self-referencing block with `maxDepth: 3` terminates with one `cycle` problem.
- [ ] `smsInfo`: `''` → 0 segments / 160 remaining; 160 → 1 segment; 161 → 2
      segments, 145 remaining; `€` costs 2; `😀` or CJK → UCS-2 with 70/67.
- [ ] Editor loads `t1` (or the first template), previews with real blocks, shows
      no alert for a clean body.
- [ ] Alert appears with the problem list while the body is broken and disappears when fixed.
- [ ] Insert block appends `{{block:footer}}` and resets the select.
- [ ] SMS counter present for `t2` only, text format exact; `Save` persists and calls `onSaved`.

## Baseline a11y

- Body is a labelled `<textarea>` (`Template body`); subject a labelled `<input>`.
- Problems in a `role="alert"` (assertive) so a broken tag is announced; the
  SMS counter in a `role="status"` (polite).
- The preview region is labelled `Preview`; the block picker is a real
  `<select>` labelled `Insert block`; `Save` is a `<button>`.

## Constraints

- React + TypeScript only; no template libraries, no `eval`, no `RegExp`
  built from user input.
- Keep the exported types and signatures as given (`app/App.tsx` renders
  `<TemplateEditor />` with no props).
- `tokenize` must be a single left-to-right pass; `render` must terminate for
  any input (that is what `maxDepth` is for).

## Interviewer follow-ups (talk-through, not implemented)

- Editors want `{{first_name | upper}}` style filters. Where does the grammar
  change, and how do you keep `fallback` and `filter` unambiguous?
- Blocks are edited by another team. What happens to a cached rendered
  preview when a block changes — and how would milestone 2's `invalidateQueries`
  help?
- `smsInfo` counts the rendered output with *sample* vars. How would you report
  a worst-case segment count across real customers?
- The preview re-renders on every keystroke. When does that become a problem,
  and what would you memoise or defer (`useDeferredValue`, a worker)?

## Say out loud

- Tokenizer strategy first: "scan for `\{{` and `{{`; on `{{` find the closing
  `}}`, but if another `{{` comes first the tag is unclosed."
- Name the error-recovery rule before writing it: an unclosed tag consumes up
  to the next `{{` so the rest of the template still renders.
- Name the termination guarantee: block expansion is recursive, so `maxDepth`
  turns an infinite loop into a `cycle` problem.
- For SMS: "GSM-7 vs UCS-2 is decided by the worst character; one emoji halves
  the budget."
- First test you would write: "`{{plan | free}}` with `plan: ''` renders `free`."
