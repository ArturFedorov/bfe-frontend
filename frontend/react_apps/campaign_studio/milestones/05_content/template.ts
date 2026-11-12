/**
 * Milestone 5a — message template language: tokenizer, renderer, SMS counter.
 * See README.md in this folder. Tests: template.test.ts.
 *
 * Syntax
 *   {{name}}                 placeholder, required
 *   {{name | fallback text}} placeholder with a fallback when the var is missing/empty
 *   {{block:id}}             CMS block, expanded recursively (blocks may use placeholders and other blocks)
 *   \{{                      escaped: emits the literal characters `{{`
 */

export type Token =
  | { type: 'text'; value: string }
  | { type: 'placeholder'; name: string; fallback?: string; raw: string }
  | { type: 'block'; id: string; raw: string }
  /** Something that looked like a tag but is malformed (unclosed `{{`, empty name, bad identifier). */
  | { type: 'error'; message: string; raw: string };

/** Identifiers: `[A-Za-z_][A-Za-z0-9_]*`. Whitespace inside the braces is ignored. */
export function tokenize(source: string): Token[] {
  void source;
  throw new Error('Not implemented');
}

/** Unique placeholder names in first-seen order (does not descend into blocks). */
export function placeholders(source: string): string[] {
  void source;
  throw new Error('Not implemented');
}

export type ProblemKind = 'syntax' | 'missing_var' | 'missing_block' | 'cycle';

export interface Problem {
  kind: ProblemKind;
  message: string;
  /** The raw tag text that caused it, e.g. `{{first_name}}` or `{{block:footer}}`. */
  raw: string;
}

export type Vars = Record<string, string | number | boolean | null | undefined>;

export interface RenderOptions {
  vars: Vars;
  /** Block id → block source. */
  blocks: Record<string, string>;
  /** Maximum block nesting before a `cycle` problem is reported. Default 8. */
  maxDepth?: number;
}

export interface RenderResult {
  output: string;
  /** Empty when the render is clean. Order follows the source. */
  problems: Problem[];
}

/**
 * Renders the template.
 *  - a var that is `undefined`, `null` or `''` uses the fallback; without one it
 *    renders as empty text and records a `missing_var` problem;
 *  - numbers and booleans are stringified;
 *  - an unknown block renders as empty text and records `missing_block`;
 *  - blocks nested deeper than `maxDepth` stop expanding and record `cycle`;
 *  - error tokens render as their raw text and record `syntax`.
 */
export function render(source: string, options: RenderOptions): RenderResult {
  void source;
  void options;
  throw new Error('Not implemented');
}

export interface SmsInfo {
  chars: number;
  /** `gsm7` when every char is in the GSM 03.38 basic set (+ extension), else `ucs2`. */
  encoding: 'gsm7' | 'ucs2';
  /** 160 / 70 for one segment, 153 / 67 per segment when concatenated. 0 for the empty string. */
  segments: number;
  /** Characters left before another segment is needed. */
  remaining: number;
}

export function smsInfo(text: string): SmsInfo {
  void text;
  throw new Error('Not implemented');
}
