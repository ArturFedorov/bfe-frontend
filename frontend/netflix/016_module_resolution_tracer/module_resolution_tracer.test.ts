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
