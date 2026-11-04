/**
 * Reference solution for 076 — keep streaming_markdown.tsx blank for redo
 * practice; this file is for comparison after your own attempt.
 */
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

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
  source: string;
  done: boolean;
  onCommit?: () => void;
}

// ---------------------------------------------------------------------------
// Parsing — pure functions, no DOM. Unclosed constructs degrade to literal text.
// ---------------------------------------------------------------------------

const SAFE_SCHEME = /^(https?:|mailto:)/i;

/** Inline markup for one paragraph/heading. Recursive so bold/italic can nest. */
export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let literal = '';
  const flush = () => {
    if (literal) nodes.push({ type: 'text', value: literal });
    literal = '';
  };

  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);

    if (rest.startsWith('`')) {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        flush();
        nodes.push({ type: 'code', value: text.slice(i + 1, end) }); // raw, not parsed
        i = end + 1;
        continue;
      }
    } else if (rest.startsWith('**')) {
      const end = text.indexOf('**', i + 2);
      if (end !== -1 && end > i + 2) {
        flush();
        nodes.push({ type: 'bold', children: parseInline(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    } else if (rest.startsWith('*')) {
      const end = text.indexOf('*', i + 1);
      if (end !== -1 && end > i + 1) {
        flush();
        nodes.push({ type: 'italic', children: parseInline(text.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    } else if (rest.startsWith('[')) {
      const match = /^\[([^\]]*)\]\(([^)]*)\)/.exec(rest);
      if (match) {
        const [whole, label, href] = match;
        if (SAFE_SCHEME.test(href.trim())) {
          flush();
          nodes.push({ type: 'link', href: href.trim(), children: parseInline(label) });
        } else {
          literal += whole; // unsafe scheme: the whole construct stays visible as text
        }
        i += whole.length;
        continue;
      }
    }

    // No construct matched at this position (or it was unclosed): literal character.
    literal += text[i];
    i += 1;
  }
  flush();
  return nodes;
}

/** Block structure: paragraphs, headings, fenced code (possibly still open). */
export function parseBlocks(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = source.split('\n');
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', children: parseInline(paragraph.join('\n')) });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      flushParagraph();
      const lang = line.slice(3).trim();
      const body: string[] = [];
      let closed = false;
      for (i += 1; i < lines.length; i++) {
        if (lines[i].trim() === '```') {
          closed = true;
          break;
        }
        body.push(lines[i]);
      }
      blocks.push({ type: 'code', lang, text: body.join('\n'), closed });
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    const heading = /^(#{1,3}) (.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        children: parseInline(heading[2]),
      });
      continue;
    }

    paragraph.push(line); // includes "#### …": four or more hashes are plain text
  }
  flushParagraph();
  return blocks;
}

// ---------------------------------------------------------------------------
// Rendering — React escapes every string, so raw HTML in the source is inert.
// ---------------------------------------------------------------------------

function renderInline(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        return node.value;
      case 'code':
        return <code key={i}>{node.value}</code>;
      case 'bold':
        return <strong key={i}>{renderInline(node.children)}</strong>;
      case 'italic':
        return <em key={i}>{renderInline(node.children)}</em>;
      case 'link':
        return (
          <a key={i} href={node.href} target="_blank" rel="noopener noreferrer">
            {renderInline(node.children)}
          </a>
        );
    }
  });
}

function renderBlock(block: MarkdownBlock, i: number): ReactElement {
  switch (block.type) {
    case 'paragraph':
      return <p key={i}>{renderInline(block.children)}</p>;
    case 'heading': {
      const Tag = `h${block.level}` as const;
      return <Tag key={i}>{renderInline(block.children)}</Tag>;
    }
    case 'code':
      return (
        <pre key={i} data-lang={block.lang || undefined} data-open={block.closed ? undefined : 'true'}>
          <code>{block.text}</code>
        </pre>
      );
  }
}

// ---------------------------------------------------------------------------
// Component — frame batching with a synchronous flush on `done`.
// ---------------------------------------------------------------------------

export function StreamingMarkdown({ source, done, onCommit }: StreamingMarkdownProps): ReactElement | null {
  // The text currently on screen. Lags `source` by at most one frame while streaming.
  const [committed, setCommitted] = useState(source);
  const latestRef = useRef(source);
  latestRef.current = source;
  const frameRef = useRef<number | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Done means "show the latest now": derived in render, so no frame wait.
  const displayed = done ? source : committed;

  useEffect(() => {
    if (done) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      return;
    }
    // One frame coalesces every update that arrives before it fires.
    if (source !== committed && frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        setCommitted(latestRef.current);
      });
    }
  }, [source, done, committed]);

  // Unmount: never let a frame fire into an unmounted component.
  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    },
    [],
  );

  // Fires after every render where the visible text changed — including mount.
  useEffect(() => {
    onCommitRef.current?.();
  }, [displayed]);

  return (
    <section aria-label="Model output" aria-live={done ? undefined : 'polite'} aria-busy={!done}>
      {parseBlocks(displayed).map(renderBlock)}
    </section>
  );
}
