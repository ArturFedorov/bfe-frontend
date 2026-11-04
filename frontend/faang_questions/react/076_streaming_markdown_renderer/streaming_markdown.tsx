import {ReactElement, ReactNode, useEffect, useRef, useState} from 'react';
import {flush} from '../_helpers/deferred';

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

const SAFE_SCHEME = /^(https?:|mailto:)/i;

export function parseLine(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let literal = '';
  const flush = () => {
    if(literal) nodes.push({ type: 'text', value: literal });
    literal = '';
  }

  let i = 0;
  while(i < text.length) {
    const rest = text.slice(i);

    if(rest.startsWith('`')) {
      const end = text.indexOf('`', i + 1);
      if(end !== -1) {
        flush();
        nodes.push({ type: 'code', value: text.slice(i + 1, end)});
        i = end + 1;
        continue;
      }
    } else if(rest.startsWith('**')) {
      const end = text.indexOf('**', i + 2);
      if(end !== -1 && end > i + 2) {
        flush();
        nodes.push({ type: 'bold', children: parseLine(text.slice(i + 2, end))});
        i = end + 2;
        continue;
      }
    } else if(rest.startsWith('*')) {
      const end = text.indexOf('*', i + 1);
      if(end !== -1 && end > i + 1) {
        flush();
        nodes.push({ type: 'italic', children: parseLine(text.slice(i + 1, end))});
        i = end + 1;
        continue;
      }
    } else if(rest.startsWith('[')) {
      const match = /^\[([^\]]*)\]\(([^)]*)\)/.exec(rest);

      if(match) {
        const [whole, label, href] = match;

        if(SAFE_SCHEME.test(href.trim())) {
          flush();
          nodes.push({ type: 'link', href: href.trim(), children: parseLine(label)})
        } else {
          literal += whole;
        }
        i += whole.length;
        continue;
      }
    }

    literal += text[i];
    i += 1;
  }

  flush();
  return nodes;
}

export function parseBlocks(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = source.split('\n');
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if(paragraph.length) blocks.push({ type: 'paragraph', children: parseLine(paragraph.join('\n'))});
    paragraph = [];
  }

  for(let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if(line.startsWith('```')) {
      flushParagraph();
      const lang = line.slice(3).trim();
      const body: string[] = [];
      let closed = false;
      for(i += 1; i < lines.length; i++) {
        if(lines[i].trim() === '```') {
          closed = true;
          break;
        }
        body.push(lines[i]);
      }

      blocks.push({ type: 'code', lang, text: body.join('\n'), closed });
      continue;
    }

    if(line.trim() === '') {
      flushParagraph();
      continue;
    }

    const heading = /^(#{1,3}) (.*)$/.exec(line);

    if(heading) {
      flushParagraph();
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, children: parseLine(heading[2])});
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function renderInline(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return node.value;
      case 'code':
        return <code key={i}>{node.value}</code>;
      case 'bold':
        return <strong key={i}>{renderInline(node.children)}</strong>;
      case 'italic':
        return <em key={i}>{renderInline(node.children)}</em>
      case 'link':
        return (
          <a key={i} href={node.href} target="_blank" rel="noopener noreferrer">
            {renderInline(node.children)}
          </a>
        )
    }
  })
}

function renderBlock(block: MarkdownBlock, i: number): ReactElement {
  switch (block.type) {
    case "paragraph":
      return <p key={i}>{renderInline(block.children)}</p>
    case "heading":
      const Tag = `h${block.level}` as const;
      return <Tag key={i}>{renderInline(block.children)}</Tag>;
    case 'code':
      return (
        <pre key={i} data-lang={block.lang || undefined} data-open={block.closed ? undefined : 'true'}>
          <code>{block.text}</code>
        </pre>
      )
  }
}

export function StreamingMarkdown({ source, done, onCommit }: StreamingMarkdownProps): ReactElement | null {
  const [committed, setCommited] = useState(source);
  const latestRef = useRef(source);
  latestRef.current = source;
  const frameRef = useRef<number | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const displayed = done ? source : committed;

  useEffect(() => {
    if(done) {
      if(frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      return;
    }

    if(source !== committed && frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        setCommited(latestRef.current);
      })
    }
  }, [source, done, committed]);

  useEffect(() => () => {
    if(frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  useEffect(() => {
    onCommitRef.current?.();
  }, [displayed]);

  return (
    <section aria-label="Model output" aria-live={done ? undefined : 'polite'} aria-busy={!done}>
      {parseBlocks(displayed).map(renderBlock)}
    </section>
  )
}
