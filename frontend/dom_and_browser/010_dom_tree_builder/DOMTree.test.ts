import { DOMTree } from './DOMTree';

describe('DOMTree', () => {
  it('should add a child with appendChild', () => {
    const root = new DOMTree('div');
    const child = new DOMTree('p');

    root.appendChild(child);

    expect(root.children).toContain(child);
    expect(root.children.length).toBe(1);
  });

  it('should set parent when appending', () => {
    const root = new DOMTree('div');
    const child = new DOMTree('p');

    root.appendChild(child);

    expect(child.parent).toBe(root);
  });

  it('should remove a child with removeChild', () => {
    const root = new DOMTree('div');
    const child = new DOMTree('p');

    root.appendChild(child);
    root.removeChild(child);

    expect(root.children).not.toContain(child);
    expect(root.children.length).toBe(0);
  });

  it('should throw when removing a non-child', () => {
    const root = new DOMTree('div');
    const notChild = new DOMTree('p');

    expect(() => root.removeChild(notChild)).toThrow();
  });

  it('should find first matching descendant with querySelector', () => {
    const root = new DOMTree('div');
    const p1 = new DOMTree('p');
    const p2 = new DOMTree('p');

    root.appendChild(p1);
    root.appendChild(p2);

    expect(root.querySelector('p')).toBe(p1);
  });

  it('should find all matching descendants with querySelectorAll', () => {
    const root = new DOMTree('div');
    const p1 = new DOMTree('p');
    const span = new DOMTree('span');
    const p2 = new DOMTree('p');

    root.appendChild(p1);
    root.appendChild(span);
    span.appendChild(p2);

    expect(root.querySelectorAll('p')).toEqual([p1, p2]);
  });

  it('should handle nested structure correctly', () => {
    const root = new DOMTree('html');
    const body = new DOMTree('body');
    const div = new DOMTree('div');
    const p = new DOMTree('p');

    root.appendChild(body);
    body.appendChild(div);
    div.appendChild(p);

    expect(root.querySelector('p')).toBe(p);
    expect(p.parent).toBe(div);
    expect(div.parent).toBe(body);
    expect(body.parent).toBe(root);
  });

  it('should return null from querySelector when no match', () => {
    const root = new DOMTree('div');
    const p = new DOMTree('p');
    root.appendChild(p);

    expect(root.querySelector('span')).toBeNull();
  });

  it('should return empty array from querySelectorAll when no match', () => {
    const root = new DOMTree('div');
    expect(root.querySelectorAll('p')).toEqual([]);
  });
});
