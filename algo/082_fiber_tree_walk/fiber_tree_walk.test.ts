import {
  createFiberTree,
  walkFiber,
  findFiber,
  ElementSpec,
  Fiber,
} from './fiber_tree_walk';

const appSpec: ElementSpec = {
  type: 'App',
  children: [
    { type: 'header', children: [{ type: 'h1' }] },
    { type: 'main', children: [{ type: 'p', key: 'intro' }, { type: 'p' }] },
    { type: 'footer' },
  ],
};

/** A chain `c0 -> c1 -> ... -> c{n-1}`, each node the only child of the previous. */
function buildChainSpec(length: number): ElementSpec {
  let spec: ElementSpec = { type: `c${length - 1}` };
  for (let i = length - 2; i >= 0; i--)
    spec = { type: `c${i}`, children: [spec] };
  return spec;
}

/** A root with `width` leaf children `s0 ... s{width-1}`. */
function buildWideSpec(width: number): ElementSpec {
  return {
    type: 'row',
    children: Array.from({ length: width }, (_, i) => ({ type: `s${i}` })),
  };
}

function beginOrder(root: Fiber | null): string[] {
  const out: string[] = [];
  walkFiber(root, {
    beginWork: (f, depth) => void out.push(`${depth}:${f.type}`),
  });
  return out;
}

function completeOrder(root: Fiber | null): string[] {
  const out: string[] = [];
  walkFiber(root, {
    completeWork: (f, depth) => void out.push(`${depth}:${f.type}`),
  });
  return out;
}

describe('createFiberTree', () => {
  it('wires child, sibling and return pointers', () => {
    const root = createFiberTree(appSpec);

    expect(root.type).toBe('App');
    expect(root.return).toBeNull();
    expect(root.sibling).toBeNull();

    const header = root.child!;
    const main = header.sibling!;
    const footer = main.sibling!;
    expect([header.type, main.type, footer.type]).toEqual([
      'header',
      'main',
      'footer',
    ]);
    expect(footer.sibling).toBeNull();
    expect([header.return, main.return, footer.return]).toEqual([
      root,
      root,
      root,
    ]);

    const h1 = header.child!;
    expect(h1.type).toBe('h1');
    expect(h1.child).toBeNull();
    expect(h1.sibling).toBeNull();
    expect(h1.return).toBe(header);

    expect(main.child!.key).toBe('intro');
    expect(main.child!.sibling!.key).toBeNull();
    expect(main.child!.sibling!.return).toBe(main);
  });

  it('builds a single leaf', () => {
    const leaf = createFiberTree({ type: 'span' });
    expect(leaf).toEqual({
      type: 'span',
      key: null,
      child: null,
      sibling: null,
      return: null,
    });
  });

  it('treats an empty children array like a leaf', () => {
    expect(createFiberTree({ type: 'ul', children: [] }).child).toBeNull();
  });
});

describe('walkFiber — beginWork (down phase)', () => {
  it('visits parent before children, siblings left to right, with depths', () => {
    expect(beginOrder(createFiberTree(appSpec))).toEqual([
      '0:App',
      '1:header',
      '2:h1',
      '1:main',
      '2:p',
      '2:p',
      '1:footer',
    ]);
  });

  it('stops the whole walk when beginWork returns false (no completes after)', () => {
    const log: string[] = [];
    walkFiber(createFiberTree(appSpec), {
      beginWork: (f) => {
        log.push(`begin ${f.type}`);
        return f.type !== 'h1';
      },
      completeWork: (f) => void log.push(`complete ${f.type}`),
    });
    expect(log).toEqual(['begin App', 'begin header', 'begin h1']);
  });
});

describe('walkFiber — completeWork (up phase)', () => {
  it('completes a fiber only after all of its descendants', () => {
    expect(completeOrder(createFiberTree(appSpec))).toEqual([
      '2:h1',
      '1:header',
      '2:p',
      '2:p',
      '1:main',
      '1:footer',
      '0:App',
    ]);
  });

  it('interleaves begin and complete exactly like the React work loop', () => {
    const log: string[] = [];
    walkFiber(createFiberTree(appSpec), {
      beginWork: (f) => void log.push(`↓${f.type}`),
      completeWork: (f) => void log.push(`↑${f.type}`),
    });
    expect(log).toEqual([
      '↓App',
      '↓header',
      '↓h1',
      '↑h1',
      '↑header',
      '↓main',
      '↓p',
      '↑p',
      '↓p',
      '↑p',
      '↑main',
      '↓footer',
      '↑footer',
      '↑App',
    ]);
  });

  it('a leaf root is begun and completed once', () => {
    const log: string[] = [];
    walkFiber(createFiberTree({ type: 'solo' }), {
      beginWork: (f) => void log.push(`↓${f.type}`),
      completeWork: (f) => void log.push(`↑${f.type}`),
    });
    expect(log).toEqual(['↓solo', '↑solo']);
  });
});

describe('walkFiber — boundaries and scale', () => {
  it('is a no-op for a null root', () => {
    const beginWork = jest.fn();
    const completeWork = jest.fn();
    walkFiber(null, { beginWork, completeWork });
    expect(beginWork).not.toHaveBeenCalled();
    expect(completeWork).not.toHaveBeenCalled();
  });

  it('never climbs past the given root into the outer tree', () => {
    // `header` has a sibling (`main`) and a parent (`App`): walking the
    // subtree must complete `header` and stop, not continue into `main`.
    const header = createFiberTree(appSpec).child!;
    expect(beginOrder(header)).toEqual(['0:header', '1:h1']);
    expect(completeOrder(header)).toEqual(['1:h1', '0:header']);
  });

  it('survives a 100k-deep chain (recursion would overflow)', () => {
    const root = createFiberTree(buildChainSpec(100_000));
    const begins = beginOrder(root);
    expect(begins).toHaveLength(100_000);
    expect(begins[0]).toBe('0:c0');
    expect(begins[99_999]).toBe('99999:c99999');

    const completes = completeOrder(root);
    expect(completes[0]).toBe('99999:c99999');
    expect(completes[99_999]).toBe('0:c0');
  });

  it('survives a 100k-wide sibling row', () => {
    const result = beginOrder(createFiberTree(buildWideSpec(100_000)));
    expect(result).toHaveLength(100_001);
    expect(result[1]).toBe('1:s0');
    expect(result[100_000]).toBe('1:s99999');
  });
});

describe('findFiber', () => {
  it('returns the first match in beginWork order', () => {
    const root = createFiberTree(appSpec);
    expect(findFiber(root, (f) => f.type === 'p')).toBe(
      root.child!.sibling!.child,
    );
    expect(findFiber(root, (f) => f.key === 'intro')?.type).toBe('p');
  });

  it('returns null when nothing matches or the root is null', () => {
    expect(
      findFiber(createFiberTree(appSpec), (f) => f.type === 'nav'),
    ).toBeNull();
    expect(findFiber(null, () => true)).toBeNull();
  });

  it('stops walking after the match', () => {
    const predicate = jest.fn((f: Fiber) => f.type === 'h1');
    findFiber(createFiberTree(appSpec), predicate);
    expect(predicate).toHaveBeenCalledTimes(3); // App, header, h1
  });
});
