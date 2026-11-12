import type { JSX } from 'react';

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

/**
 * Splits template source into tokens. Syntax: `{{name}}`, `{{name | fallback}}`,
 * `{{block:<id>}}`, `\{{` for a literal `{{`. See README for the exact rules.
 */
export function tokenizeTemplate(src: string): Token[] {
  throw new Error('Not implemented');
}

/** Renders a template with sample variables and block texts. */
export function renderTemplate(
  src: string,
  vars: Record<string, string>,
  blocks: Record<string, string>,
): RenderResult {
  throw new Error('Not implemented');
}

export function TemplateEditor(props: TemplateEditorProps): JSX.Element {
  throw new Error('Not implemented');
}
