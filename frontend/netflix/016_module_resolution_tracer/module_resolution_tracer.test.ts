import { traceResolution } from './module_resolution_tracer';

describe('traceResolution', () => {
  it('stops at the first existing candidate', () => {
    const files = new Set(['/app/util.js']);
    const trace = traceResolution(files, '/app', './util');
    expect(trace[trace.length - 1]).toBe('/app/util.js');
    expect(trace[0]).toBe('/app/util');
  });

  it('falls through to index.js', () => {
    const files = new Set(['/app/util/index.js']);
    const trace = traceResolution(files, '/app', './util');
    expect(trace[trace.length - 1]).toBe('/app/util/index.js');
  });
});

describe('traceResolution — candidate ordering', () => {
  it('produces candidates in the exact, .js, .json, index.js order', () => {
    // Nothing exists, so every candidate is tried in order.
    const trace = traceResolution(new Set(), '/app', './util');
    expect(trace).toEqual([
      '/app/util',
      '/app/util.js',
      '/app/util.json',
      '/app/util/index.js',
    ]);
  });

  it('always begins with the extensionless exact path', () => {
    const trace = traceResolution(
      new Set(['/app/util/index.js']),
      '/app',
      './util',
    );
    expect(trace[0]).toBe('/app/util');
  });

  it('preserves the .js-before-.json preference', () => {
    const trace = traceResolution(new Set(), '/app', './util');
    expect(trace.indexOf('/app/util.js')).toBeLessThan(
      trace.indexOf('/app/util.json'),
    );
  });
});

describe('traceResolution — exact match', () => {
  it('returns a single-entry trace when the exact path exists', () => {
    const files = new Set(['/app/util']);
    const trace = traceResolution(files, '/app', './util');
    expect(trace).toEqual(['/app/util']);
  });

  it('does not try extensions once the exact path is found', () => {
    const files = new Set(['/app/util', '/app/util.js']);
    const trace = traceResolution(files, '/app', './util');
    expect(trace).not.toContain('/app/util.js');
    expect(trace[trace.length - 1]).toBe('/app/util');
  });
});

describe('traceResolution — extension resolution', () => {
  it('resolves a .js file requested without its extension', () => {
    const files = new Set(['/app/util.js']);
    const trace = traceResolution(files, '/app', './util');
    expect(trace).toEqual(['/app/util', '/app/util.js']);
  });

  it('resolves a .json file when no .js sibling exists', () => {
    const files = new Set(['/app/data.json']);
    const trace = traceResolution(files, '/app', './data');
    expect(trace).toEqual(['/app/data', '/app/data.js', '/app/data.json']);
  });

  it('prefers .js over .json when both exist', () => {
    const files = new Set(['/app/util.js', '/app/util.json']);
    const trace = traceResolution(files, '/app', './util');
    expect(trace[trace.length - 1]).toBe('/app/util.js');
    expect(trace).not.toContain('/app/util.json');
  });
});

describe('traceResolution — index.js fallback', () => {
  it('only reaches index.js after exhausting file candidates', () => {
    const files = new Set(['/app/util/index.js']);
    const trace = traceResolution(files, '/app', './util');
    expect(trace).toEqual([
      '/app/util',
      '/app/util.js',
      '/app/util.json',
      '/app/util/index.js',
    ]);
  });

  it('prefers a same-name file over a directory index', () => {
    const files = new Set(['/app/util.js', '/app/util/index.js']);
    const trace = traceResolution(files, '/app', './util');
    expect(trace[trace.length - 1]).toBe('/app/util.js');
    expect(trace).not.toContain('/app/util/index.js');
  });
});

describe('traceResolution — relative path normalization', () => {
  it('resolves a parent-directory specifier via "../"', () => {
    const files = new Set(['/app/util.js']);
    const trace = traceResolution(files, '/app/deep', '../util');
    expect(trace[0]).toBe('/app/util');
    expect(trace[trace.length - 1]).toBe('/app/util.js');
  });

  it('resolves a nested specifier with subdirectories', () => {
    const files = new Set(['/app/a/b.js']);
    const trace = traceResolution(files, '/app', './a/b');
    expect(trace[0]).toBe('/app/a/b');
    expect(trace[trace.length - 1]).toBe('/app/a/b.js');
  });

  it('treats "./" segments as the current directory', () => {
    const files = new Set(['/app/util.js']);
    const trace = traceResolution(files, '/app', './././util');
    expect(trace[trace.length - 1]).toBe('/app/util.js');
  });

  it('climbs multiple parent levels', () => {
    const files = new Set(['/util/index.js']);
    const trace = traceResolution(files, '/app/x/y', '../../../util');
    expect(trace[0]).toBe('/util');
    expect(trace[trace.length - 1]).toBe('/util/index.js');
  });
});

describe('traceResolution — unresolved specifiers', () => {
  it('records every candidate when nothing exists', () => {
    const trace = traceResolution(new Set(['/app/other.js']), '/app', './util');
    expect(trace).toEqual([
      '/app/util',
      '/app/util.js',
      '/app/util.json',
      '/app/util/index.js',
    ]);
  });

  it('does not end on an existing file when the specifier is unresolved', () => {
    const files = new Set(['/app/other.js']);
    const trace = traceResolution(files, '/app', './util');
    expect(files.has(trace[trace.length - 1])).toBe(false);
  });
});

describe('traceResolution — purity', () => {
  it('does not mutate the input files set', () => {
    const files = new Set(['/app/util.js']);
    const before = files.size;
    traceResolution(files, '/app', './util');
    expect(files.size).toBe(before);
  });
});
