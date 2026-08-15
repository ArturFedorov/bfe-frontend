import { PageNode, searchHighlight } from './search_highlight';

describe('searchHighlight', () => {
  const page: PageNode = {
    id: 'root',
    children: [
      { id: 'p1', text: 'the quick brown fox' },
      { id: 'p2', text: 'jumps over' },
      { id: 'p3', text: 'the lazy dog' },
    ],
  };

  it('finds a match fully inside one node', () => {
    expect(searchHighlight(page, 'quick brown')).toEqual(['p1']);
    expect(searchHighlight(page, 'lazy dog')).toEqual(['p3']);
  });

  it('finds a match spanning two sibling nodes', () => {
    expect(searchHighlight(page, 'fox jumps')).toEqual(['p1', 'p2']);
    expect(searchHighlight(page, 'brown fox jumps over the')).toEqual(['p1', 'p2', 'p3']);
  });

  it('finds a match spanning a parent/child boundary', () => {
    const doc: PageNode = {
      id: 'sec',
      text: 'release notes',
      children: [{ id: 'body', text: 'for version two' }],
    };
    expect(searchHighlight(doc, 'notes for')).toEqual(['sec', 'body']);
  });

  it('matches case-insensitively', () => {
    expect(searchHighlight(page, 'QUICK Brown')).toEqual(['p1']);
    const shouty: PageNode = { id: 'n', text: 'HELLO World' };
    expect(searchHighlight(shouty, 'hello world')).toEqual(['n']);
  });

  it('returns [] when the query is longer than the total text', () => {
    const tiny: PageNode = { id: 'only', text: 'two words' };
    expect(searchHighlight(tiny, 'two words and then some')).toEqual([]);
  });

  it('handles repeated words in the query without restarting from scratch', () => {
    const doc: PageNode = {
      id: 'root',
      children: [
        { id: 'n1', text: 'a' },
        { id: 'n2', text: 'a' },
        { id: 'n3', text: 'a b' },
      ],
    };
    // The match is words 2..4 ('a', 'a', 'b') — n1's word is not part of it.
    expect(searchHighlight(doc, 'a a b')).toEqual(['n2', 'n3']);
  });

  it('returns [] when the words exist but not consecutively or in order', () => {
    expect(searchHighlight(page, 'quick fox')).toEqual([]);
    expect(searchHighlight(page, 'brown quick')).toEqual([]);
    expect(searchHighlight(page, 'unicorn')).toEqual([]);
  });

  it('does not match partial words', () => {
    const doc: PageNode = { id: 'n', text: 'foxes jump' };
    expect(searchHighlight(doc, 'fox')).toEqual([]);
  });

  it('returns the union of nodes across multiple matches, ids once each, in document order', () => {
    const doc: PageNode = {
      id: 'root',
      children: [
        { id: 'a', text: 'go west' },
        { id: 'b', text: 'then' },
        { id: 'c', text: 'go west' },
      ],
    };
    expect(searchHighlight(doc, 'go west')).toEqual(['a', 'c']);
  });

  it('skips text-less and whitespace-only nodes but still visits their children', () => {
    const doc: PageNode = {
      id: 'root',
      children: [
        {
          id: 'wrapper',
          text: '   \n\t ',
          children: [{ id: 'inner', text: 'needle in' }],
        },
        { id: 'tail', text: 'a haystack' },
      ],
    };
    expect(searchHighlight(doc, 'needle in a haystack')).toEqual(['inner', 'tail']);
  });

  it('normalizes runs of whitespace within a node', () => {
    const doc: PageNode = { id: 'n', text: '  hello\n\tworld  ' };
    expect(searchHighlight(doc, 'hello world')).toEqual(['n']);
  });

  it('returns [] for an empty or whitespace-only query', () => {
    expect(searchHighlight(page, '')).toEqual([]);
    expect(searchHighlight(page, '   \n ')).toEqual([]);
  });

  it('matches a single-word query in every containing node', () => {
    expect(searchHighlight(page, 'the')).toEqual(['p1', 'p3']);
  });

  it('handles a page of 100_000 nodes in time', () => {
    const children: PageNode[] = [];
    for (let i = 0; i < 100_000; i++) {
      children.push({ id: `f${i}`, text: `w${i % 50}` });
    }
    children.push({ id: 'n1', text: 'alpha' });
    children.push({ id: 'n2', text: 'beta' });
    children.push({ id: 'n3', text: 'gamma' });
    const doc: PageNode = { id: 'root', children };
    expect(searchHighlight(doc, 'alpha beta gamma')).toEqual(['n1', 'n2', 'n3']);
  });
});
