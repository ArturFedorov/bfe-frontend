import { useId, useRef } from 'react';
import type { ChangeEvent, JSX } from 'react';

/** One lexical unit of a message template. */
export type Token =
  | { type: 'text'; value: string }
  | { type: 'placeholder'; name: string; fallback?: string; raw: string }
  | { type: 'block'; id: string; raw: string }
  | { type: 'error'; message: string; index: number };

export type Channel = 'email' | 'push' | 'sms';

export type TemplateBlock = {
  id: string;
  label: string;
  text: string;
};

export type RenderResult = {
  /** Fully rendered text (unknown placeholders are kept raw). */
  text: string;
  /** Names of placeholders (and `block:<id>` ids) that could not be resolved, once each. */
  unknown: string[];
};

/** Character limit applied to the rendered preview when `channel === 'sms'`. */
export const SMS_LIMIT = 160;

export interface TemplateEditorProps {
  value: string;
  onChange: (next: string) => void;
  /** Sample variables used to render the preview, e.g. `{ first_name: 'Ada' }`. */
  variables: Record<string, string>;
  blocks: TemplateBlock[];
  channel: Channel;
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const OPEN = '{{';
const CLOSE = '}}';
const ESCAPE = '\\{{';
const BLOCK_PREFIX = 'block:';

/**
 * Splits template source into tokens. Syntax: `{{name}}`, `{{name | fallback}}`,
 * `{{block:<id>}}`, `\{{` for a literal `{{`. See README for the exact rules.
 *
 * A hand-written scanner (not a regex replace) so every error carries the index
 * of the offending `{{`, and so an escape can be folded into the surrounding
 * text without splitting it.
 */
export function tokenizeTemplate(src: string): Token[] {
  const tokens: Token[] = [];
  let text = '';

  // Consecutive literal characters accumulate here and are emitted as one
  // token whenever a non-text token (or the end of input) is reached.
  const flushText = () => {
    if (text) tokens.push({ type: 'text', value: text });
    text = '';
  };

  let i = 0;
  while (i < src.length) {
    if (src.startsWith(ESCAPE, i)) {
      text += OPEN;
      i += ESCAPE.length;
      continue;
    }

    if (!src.startsWith(OPEN, i)) {
      text += src[i];
      i += 1;
      continue;
    }

    // At a `{{`: find its `}}`.
    const close = src.indexOf(CLOSE, i + OPEN.length);
    if (close === -1) {
      flushText();
      tokens.push({ type: 'error', message: `Unclosed placeholder at ${i}`, index: i });
      return tokens; // the error swallows the rest of the source
    }

    const raw = src.slice(i, close + CLOSE.length);
    const inner = src.slice(i + OPEN.length, close).trim();
    flushText();

    if (inner === '') {
      tokens.push({ type: 'error', message: `Empty placeholder at ${i}`, index: i });
    } else if (inner.startsWith(BLOCK_PREFIX)) {
      const id = inner.slice(BLOCK_PREFIX.length).trim();
      if (id === '') tokens.push({ type: 'error', message: `Empty placeholder at ${i}`, index: i });
      else tokens.push({ type: 'block', id, raw });
    } else {
      const bar = inner.indexOf('|');
      if (bar === -1) {
        tokens.push({ type: 'placeholder', name: inner, raw });
      } else {
        tokens.push({
          type: 'placeholder',
          name: inner.slice(0, bar).trim(),
          fallback: inner.slice(bar + 1).trim(),
          raw,
        });
      }
    }

    i = close + CLOSE.length;
  }

  flushText();
  return tokens;
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const hasOwn = (obj: Record<string, string>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

/**
 * The literal source an error token stands for. An unclosed `{{` owns the rest
 * of the template; an empty `{{ }}` owns just its own braces (tokens continue
 * after it, so rendering "to the end" there would duplicate the tail).
 */
function errorSlice(src: string, token: Extract<Token, { type: 'error' }>): string {
  const close = src.indexOf(CLOSE, token.index + OPEN.length);
  return close === -1 ? src.slice(token.index) : src.slice(token.index, close + CLOSE.length);
}

/** Renders a template with sample variables and block texts. */
export function renderTemplate(
  src: string,
  vars: Record<string, string>,
  blocks: Record<string, string>,
): RenderResult {
  const unknown: string[] = [];
  const seen = new Set<string>();
  const noteUnknown = (key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    unknown.push(key);
  };

  let text = '';
  for (const token of tokenizeTemplate(src)) {
    switch (token.type) {
      case 'text':
        text += token.value;
        break;
      case 'placeholder':
        if (hasOwn(vars, token.name)) text += vars[token.name];
        else if (token.fallback !== undefined) text += token.fallback;
        else {
          text += token.raw;
          noteUnknown(token.name);
        }
        break;
      case 'block':
        if (hasOwn(blocks, token.id)) text += blocks[token.id];
        else {
          text += token.raw;
          noteUnknown(`${BLOCK_PREFIX}${token.id}`);
        }
        break;
      case 'error':
        text += errorSlice(src, token);
        break;
    }
  }

  return { text, unknown };
}

/**
 * Problem messages in source order: unresolved placeholders / blocks (once per
 * name) and every syntax error. Walks the tokens directly instead of reading
 * `RenderResult.unknown` so errors interleave at their true position.
 */
function collectProblems(tokens: Token[], vars: Record<string, string>, blocks: Record<string, string>): string[] {
  const problems: string[] = [];
  const reported = new Set<string>();
  for (const token of tokens) {
    if (token.type === 'placeholder') {
      if (hasOwn(vars, token.name) || token.fallback !== undefined || reported.has(token.name)) continue;
      reported.add(token.name);
      problems.push(`Unknown placeholder: {{${token.name}}}`);
    } else if (token.type === 'block') {
      const key = `${BLOCK_PREFIX}${token.id}`;
      if (hasOwn(blocks, token.id) || reported.has(key)) continue;
      reported.add(key);
      problems.push(`Unknown block: {{${key}}}`);
    } else if (token.type === 'error') {
      problems.push(token.message);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Fully controlled over `value`: the only local "state" is the textarea ref
 * (to read the caret) and ids for label wiring. Preview, problems and counter
 * are all derived at render time from the same tokenization.
 */
export function TemplateEditor({ value, onChange, variables, blocks, channel }: TemplateEditorProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const textareaId = `${id}-template`;
  const insertId = `${id}-insert`;

  const blocksById = Object.fromEntries(blocks.map((b) => [b.id, b.text]));
  const tokens = tokenizeTemplate(value);
  const { text } = renderTemplate(value, variables, blocksById);
  const problems = collectProblems(tokens, variables, blocksById);

  const length = text.length;
  const isSms = channel === 'sms';
  const over = isSms ? Math.max(0, length - SMS_LIMIT) : 0;
  const counter = !isSms
    ? `${length} characters`
    : over > 0
      ? `${length} / ${SMS_LIMIT} — over by ${over}`
      : `${length} / ${SMS_LIMIT}`;

  const insertBlock = (event: ChangeEvent<HTMLSelectElement>) => {
    const blockId = event.target.value;
    if (!blockId) return;
    // Read the caret synchronously, inside the event: after the parent
    // re-renders the textarea with the new value the selection is reset.
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? start;
    const snippet = `${OPEN}${BLOCK_PREFIX}${blockId}${CLOSE}`;
    onChange(value.slice(0, start) + snippet + value.slice(end));
    // The select is controlled to '' (below), so React snaps it back to the
    // blank option after this handler — it behaves as a command menu, not a value.
  };

  return (
    <div className="template-editor">
      <div>
        <label htmlFor={textareaId}>Template</label>
        <textarea
          id={textareaId}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={over > 0 || undefined}
          rows={6}
        />
      </div>

      <div>
        <label htmlFor={insertId}>Insert block</label>
        <select id={insertId} value="" onChange={insertBlock}>
          <option value=""></option>
          {blocks.map((block) => (
            <option key={block.id} value={block.id}>
              {block.label}
            </option>
          ))}
        </select>
      </div>

      <p role="status">{counter}</p>

      {problems.length > 0 && (
        <ul role="alert">
          {problems.map((problem, index) => (
            // Problems can legitimately repeat (two unclosed errors cannot, but
            // a message is not unique in general), so the index is part of the key.
            <li key={`${index}-${problem}`}>{problem}</li>
          ))}
        </ul>
      )}

      <div role="region" aria-label="Preview" style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  );
}
