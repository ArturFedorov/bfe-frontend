import { querySelector } from './querySelector';

function createElement(
  tag: string,
  opts: { id?: string; classes?: string[] } = {},
  children: any[] = [],
): any {
  return {
    tagName: tag.toUpperCase(),
    id: opts.id || '',
    classList: {
      contains(cls: string) {
        return (opts.classes || []).includes(cls);
      },
    },
    className: (opts.classes || []).join(' '),
    children,
  };
}

describe('querySelector', () => {
  it('should find element by id selector', () => {
    const target = createElement('p', { id: 'first' });
    const root = createElement('div', {}, [target]);

    expect(querySelector(root, '#first')).toBe(target);
  });

  it('should find element by class selector', () => {
    const target = createElement('p', { classes: ['intro'] });
    const other = createElement('span');
    const root = createElement('div', {}, [other, target]);

    expect(querySelector(root, '.intro')).toBe(target);
  });

  it('should find element by tag selector', () => {
    const span = createElement('span');
    const p = createElement('p');
    const root = createElement('div', {}, [span, p]);

    expect(querySelector(root, 'p')).toBe(p);
  });

  it('should find element with nested selector', () => {
    const innerP = createElement('p', { classes: ['deep'] });
    const innerDiv = createElement('div', {}, [innerP]);
    const topP = createElement('p');
    const root = createElement('section', {}, [topP, innerDiv]);

    expect(querySelector(root, 'div p')).toBe(innerP);
  });

  it('should return first match in document order', () => {
    const first = createElement('p', { classes: ['item'] });
    const second = createElement('p', { classes: ['item'] });
    const root = createElement('div', {}, [first, second]);

    expect(querySelector(root, '.item')).toBe(first);
  });

  it('should return null if no element matches', () => {
    const child = createElement('p');
    const root = createElement('div', {}, [child]);

    expect(querySelector(root, '.missing')).toBeNull();
  });
});
