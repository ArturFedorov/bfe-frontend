# 076. Streaming Markdown Renderer

**Difficulty:** Hard
**Estimated time:** 60 min
**Topics:** Tokenizer, Safe Rendering (XSS), Partial Input, requestAnimationFrame Batching, Live Regions

---

## Scenario

The annotation platform's "explain this suggestion" panel shows a model's
rationale as it streams in, token by token. The model writes markdown —
headings, bold labels, inline code for entity names, fenced code blocks with
JSON, and links to the labelling guideline. The first renderer piped the text
through `dangerouslySetInnerHTML`, so a rationale that quoted raw HTML from a
scraped document (`<img src=x onerror=…>`) executed in the QA analyst's
browser; a half-arrived code fence turned the rest of the page into a `<pre>`;
and a fast model emitting 200 tokens a second forced 200 React commits a
second and the panel stuttered. Build `<StreamingMarkdown source done />`:
a safe-subset markdown renderer that is correct on partial input and commits
at most once per animation frame.

## Requirements

1. `<StreamingMarkdown source={string} done={boolean} onCommit?={() => void} />`.
   The root is a `<section aria-label="Model output">` (role `region`).
2. Block syntax: paragraphs (consecutive non-blank lines; blocks separated by
   blank lines), headings `# ` / `## ` / `### ` → `h1`–`h3` (four or more `#`
   is plain paragraph text), fenced code blocks (a line starting with
   ```` ``` ```` optionally followed by a language tag, closed by a line that
   is ```` ``` ````) rendered as `<pre><code>` with the raw lines joined by
   `\n` and no inline parsing inside.
3. Inline syntax inside paragraphs and headings: `**bold**` → `<strong>`,
   `*italic*` → `<em>`, `` `code` `` → `<code>` (content not further parsed),
   `[text](href)` → `<a>`. Bold and italic may nest other inline syntax.
4. Links: only `http:`, `https:` and `mailto:` hrefs (case-insensitive, after
   trimming) become anchors, with `target="_blank"` and
   `rel="noopener noreferrer"`. Any other scheme (`javascript:`, `data:`,
   `vbscript:`) renders the whole `[text](href)` construct as literal text and
   no anchor is created.
5. Sanitization: the source is never inserted as HTML. Raw tags such as
   `<img src=x onerror=alert(1)>` or `<script>` appear as literal text; no
   `img`/`script` element exists in the DOM.
6. Partial input (`done=false`): an unclosed fence renders as a code block
   containing the text so far; an unclosed `**`, `*`, `` ` `` or `[` renders
   literally; nothing throws. When a later `source` closes the fence, the
   block closes and following text becomes a normal paragraph.
7. Batching: the DOM is updated at most once per animation frame. The initial
   mount renders `source` synchronously. Subsequent `source` changes are
   coalesced: schedule one `requestAnimationFrame`; when it fires, commit the
   latest `source`. Between frames the DOM shows the previously committed text.
8. `onCommit` is called after every render in which the displayed text changed
   (including the initial mount). A re-render with identical `source` does not
   call it.
9. When `done` becomes `true`, the latest `source` is committed in that same
   render (no frame wait) and any pending frame is cancelled.
10. Unmount cancels a pending frame (`cancelAnimationFrame` with the handle
    returned by `requestAnimationFrame`).
11. A11y: the root has `aria-live="polite"` while `done=false` and no `polite`
    live region once `done=true`; `aria-busy` is `"true"` while streaming and
    `"false"` when done. Links are reachable by role with their text as name.

## Acceptance Criteria

- [ ] Two paragraphs separated by a blank line render as two `<p>` elements with the right text.
- [ ] `# A`, `## B`, `### C` render headings of level 1, 2, 3; `#### D` renders as paragraph text `#### D`.
- [ ] A closed fence renders `<pre><code>` containing exactly the inner lines; `**` inside stays literal.
- [ ] `**bold**` → `strong`, `*italic*` → `em`, `` `code` `` → `code`; `` `**x**` `` keeps the asterisks literal.
- [ ] `[guideline](https://example.com/g)` → link named `guideline`, href, `target="_blank"`, `rel="noopener noreferrer"`; `mailto:` is allowed.
- [ ] `[click](javascript:alert(1))` renders as literal text and there is no link.
- [ ] `<img src=x onerror=alert(1)>` is visible as text and `querySelector('img')` is null; same for `<script>`.
- [ ] Unclosed fence while `done=false` renders a `<pre>` with the partial text and no `<p>`.
- [ ] Unclosed `**`, backtick and `[` render literally, no `strong`/`code`/link.
- [ ] Closing the fence on a later update yields a `<pre>` plus a `<p>` for the trailing text.
- [ ] Five rapid `source` updates: DOM unchanged and `onCommit` still 1 before the frame; after one frame the final text is shown and `onCommit` is 2.
- [ ] Updates in two separate frames produce two commits.
- [ ] Re-render with identical props → no extra `onCommit`.
- [ ] Flipping `done` to `true` with a new `source` shows it without advancing timers.
- [ ] Unmount with a pending frame calls `cancelAnimationFrame` with that frame's handle.
- [ ] Root is a region named `Model output`, `aria-live="polite"` and `aria-busy="true"` while streaming; `aria-busy="false"` and not `polite` once done.

## Baseline a11y

- Root `region` with an accessible name so screen-reader users can jump to it.
- `aria-live="polite"` only while streaming — a finished answer must not be
  re-announced on unrelated re-renders.
- `aria-busy` mirrors `!done`.
- Headings use real `h1`–`h3`; links are real anchors with visible text.

## Constraints

- No third-party libraries (no `marked`, no `DOMPurify`). Write a small
  block + inline tokenizer yourself.
- Never use `dangerouslySetInnerHTML`.
- Parsing cost should be O(n) in the length of `source` per commit; do not
  re-parse on renders where the committed text did not change.

## Interviewer follow-ups

- Reparsing the full source every frame is O(n) per frame, O(n²) over the
  stream. How would you make the parser incremental (reuse closed blocks,
  reparse only the open tail)?
- Lists and tables are the next most common model output. What changes in
  the block tokenizer, and how do you keep a half-arrived table row from
  breaking layout?
- The analyst wants to copy a code block to the clipboard. Where does the
  button live so it does not get announced by the live region on every token?
- How would you stream into this component from 074's `parseSSE` with 075's
  reconnect semantics, and what does `done` mean when the stream reconnects?

## Say out loud

- State shape first: `MarkdownBlock` and `InlineNode` discriminated unions;
  component state is `committed: string` plus refs for `latestSource` and the
  pending frame handle.
- Name the hazard: a frame callback that fires after unmount (cancel it in
  cleanup), and `done` racing a scheduled frame (flush synchronously, cancel
  the frame).
- Ask one data-shape question: "Do tokens respect line boundaries, or can a
  single token contain a newline and the start of a fence?"
- Ask one failure question: "If the stream errors mid-fence, do we render the
  partial code block as-is or mark it visually as truncated?"
- First test you'd write: `<img onerror>` in the source is visible as text and
  no `img` element exists — the safety property everything else depends on.
