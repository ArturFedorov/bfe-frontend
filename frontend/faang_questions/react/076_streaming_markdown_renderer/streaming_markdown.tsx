import type { ReactElement } from 'react';

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] }
  | { type: 'link'; href: string; children: InlineNode[] };

export type MarkdownBlock =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3; children: InlineNode[] }
  | { type: 'code'; lang: string; text: string; closed: boolean };

export interface StreamingMarkdownProps {
  /** Markdown text so far; grows token by token while streaming. */
  source: string;
  /** True once the stream has finished. */
  done: boolean;
  /** Called after every render in which the displayed text changed. */
  onCommit?: () => void;
}

export function StreamingMarkdown(props: StreamingMarkdownProps): ReactElement | null {
  void props;
  throw new Error('Not implemented');
}
