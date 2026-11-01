/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { StreamingMarkdown, type StreamingMarkdownProps } from './streaming_markdown';

function setup(props: Partial<StreamingMarkdownProps> = {}) {
  const onCommit = jest.fn();
  const utils = render(<StreamingMarkdown source="" done={false} onCommit={onCommit} {...props} />);
  const update = (next: Partial<StreamingMarkdownProps>) => {
    utils.rerender(<StreamingMarkdown source="" done={false} onCommit={onCommit} {...props} {...next} />);
  };
  return { onCommit, update, ...utils };
}

/** Render `source` and let the initial synchronous commit settle. */
function renderDone(source: string) {
  return setup({ source, done: true });
}

function frame() {
  act(() => {
    jest.advanceTimersByTime(16);
  });
}

const region = () => screen.getByRole('region', { name: 'Model output' });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('StreamingMarkdown', () => {
  describe('block syntax', () => {
    it('renders paragraphs separated by blank lines', () => {
      const { container } = renderDone('First rationale line.\n\nSecond paragraph here.');
      const ps = container.querySelectorAll('p');
      expect(ps).toHaveLength(2);
      expect(ps[0]).toHaveTextContent('First rationale line.');
      expect(ps[1]).toHaveTextContent('Second paragraph here.');
    });

    it('renders headings for one to three hashes and plain text for four', () => {
      renderDone('# Summary\n\n## Evidence\n\n### Span\n\n#### Not a heading');
      expect(screen.getByRole('heading', { level: 1, name: 'Summary' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Evidence' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Span' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
      expect(screen.getByText('#### Not a heading', { selector: 'p' })).toBeInTheDocument();
    });

    it('renders a closed fence as pre > code with raw content and no inline parsing', () => {
      const { container } = renderDone('Before\n\n```json\n{"label": "**DRUG**"}\nline 2\n```\n\nAfter');
      const code = container.querySelector('pre > code');
      expect(code).not.toBeNull();
      expect(code!.textContent).toBe('{"label": "**DRUG**"}\nline 2');
      expect(container.querySelector('strong')).toBeNull();
      expect(container.querySelectorAll('p')).toHaveLength(2);
    });
  });

  describe('inline syntax', () => {
    it('renders bold, italic and inline code', () => {
      renderDone('The **MEDICATION** label fits *because* `aspirin` is a drug.');
      expect(screen.getByText('MEDICATION', { selector: 'strong' })).toBeInTheDocument();
      expect(screen.getByText('because', { selector: 'em' })).toBeInTheDocument();
      expect(screen.getByText('aspirin', { selector: 'code' })).toBeInTheDocument();
    });

    it('does not parse markup inside inline code', () => {
      const { container } = renderDone('Use `**literal**` here');
      expect(screen.getByText('**literal**', { selector: 'code' })).toBeInTheDocument();
      expect(container.querySelector('strong')).toBeNull();
    });

    it('supports inline markup inside headings', () => {
      renderDone('## Label: **DRUG**');
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Label: DRUG');
      expect(heading.querySelector('strong')).toHaveTextContent('DRUG');
    });
  });

  describe('links', () => {
    it('renders http(s) and mailto links that open safely in a new tab', () => {
      renderDone('See [guideline](https://example.com/g) or [write](mailto:qa@example.com).');
      const link = screen.getByRole('link', { name: 'guideline' });
      expect(link).toHaveAttribute('href', 'https://example.com/g');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByRole('link', { name: 'write' })).toHaveAttribute('href', 'mailto:qa@example.com');
    });

    it('renders links with unsafe schemes as literal text', () => {
      renderDone('Try [click](javascript:alert(1)) and [data](data:text/html,x).');
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(region()).toHaveTextContent('[click](javascript:alert(1))');
      expect(region()).toHaveTextContent('[data](data:text/html,x)');
    });
  });

  describe('sanitization', () => {
    it('shows raw HTML as text and never creates the elements', () => {
      const { container } = renderDone('Quoted: <img src=x onerror=alert(1)> and <script>alert(2)</script>');
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('script')).toBeNull();
      expect(region()).toHaveTextContent('<img src=x onerror=alert(1)>');
      expect(region()).toHaveTextContent('<script>alert(2)</script>');
    });

    it('does not let HTML inside a code fence become markup either', () => {
      const { container } = renderDone('```\n<img src=x onerror=alert(1)>\n```');
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('pre > code')!.textContent).toBe('<img src=x onerror=alert(1)>');
    });
  });

  describe('partial input while streaming', () => {
    it('renders an unclosed fence as a code block with the partial text', () => {
      const { container } = setup({ source: 'Result:\n\n```json\n{"label": "DR', done: false });
      const pre = container.querySelector('pre > code');
      expect(pre).not.toBeNull();
      expect(pre!.textContent).toBe('{"label": "DR');
      expect(container.querySelectorAll('p')).toHaveLength(1);
    });

    it('renders unclosed bold, code and link openers literally', () => {
      const { container } = setup({ source: 'This is **import and `cod and [guide', done: false });
      expect(container.querySelector('strong')).toBeNull();
      expect(container.querySelector('code')).toBeNull();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(region()).toHaveTextContent('This is **import and `cod and [guide');
    });

    it('closes the fence on a later update and renders trailing text as a paragraph', () => {
      const { container, update } = setup({ source: '```\nconst a = 1;', done: false });
      expect(container.querySelector('pre > code')!.textContent).toBe('const a = 1;');
      expect(container.querySelectorAll('p')).toHaveLength(0);

      update({ source: '```\nconst a = 1;\n```\n\nDone.' });
      frame();
      expect(container.querySelector('pre > code')!.textContent).toBe('const a = 1;');
      expect(screen.getByText('Done.', { selector: 'p' })).toBeInTheDocument();
    });
  });

  describe('frame batching', () => {
    it('coalesces five rapid updates into one commit after a single frame', () => {
      const { onCommit, update } = setup({ source: 'Hel', done: false });
      expect(region()).toHaveTextContent('Hel');
      expect(onCommit).toHaveBeenCalledTimes(1);

      ['Hell', 'Hello', 'Hello,', 'Hello, w', 'Hello, world'].forEach((source) => update({ source }));
      expect(region()).toHaveTextContent('Hel');
      expect(region()).not.toHaveTextContent('Hello');
      expect(onCommit).toHaveBeenCalledTimes(1);

      frame();
      expect(region()).toHaveTextContent('Hello, world');
      expect(onCommit).toHaveBeenCalledTimes(2);
    });

    it('commits once per frame when updates arrive in separate frames', () => {
      const { onCommit, update } = setup({ source: 'a', done: false });
      update({ source: 'ab' });
      frame();
      expect(region()).toHaveTextContent('ab');
      update({ source: 'abc' });
      frame();
      expect(region()).toHaveTextContent('abc');
      expect(onCommit).toHaveBeenCalledTimes(3);
    });

    it('does not call onCommit when re-rendered with identical props', () => {
      const { onCommit, update } = setup({ source: 'same', done: false });
      update({ source: 'same' });
      frame();
      update({ source: 'same' });
      frame();
      expect(onCommit).toHaveBeenCalledTimes(1);
    });

    it('flushes the latest source synchronously when done becomes true', () => {
      const { update } = setup({ source: 'partial', done: false });
      update({ source: 'partial text' });
      update({ source: 'partial text, complete.', done: true });
      expect(region()).toHaveTextContent('partial text, complete.');
      expect(region()).toHaveAttribute('aria-busy', 'false');
    });

    it('cancels a pending frame on unmount', () => {
      const raf = jest.spyOn(window, 'requestAnimationFrame');
      const caf = jest.spyOn(window, 'cancelAnimationFrame');
      const { update, unmount } = setup({ source: 'a', done: false });
      update({ source: 'ab' });
      expect(raf).toHaveBeenCalled();
      const handle = raf.mock.results[raf.mock.results.length - 1].value as number;

      unmount();
      expect(caf).toHaveBeenCalledWith(handle);
      raf.mockRestore();
      caf.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('is a polite, busy live region while streaming', () => {
      setup({ source: 'streaming…', done: false });
      expect(region()).toHaveAttribute('aria-live', 'polite');
      expect(region()).toHaveAttribute('aria-busy', 'true');
    });

    it('stops being busy and polite once done', () => {
      const { update } = setup({ source: 'streaming…', done: false });
      update({ done: true });
      expect(region()).toHaveAttribute('aria-busy', 'false');
      expect(region()).not.toHaveAttribute('aria-live', 'polite');
    });
  });
});
