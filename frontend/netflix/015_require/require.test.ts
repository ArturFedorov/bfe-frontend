import { createRequire, FileSystem } from './require';

const fs: FileSystem = {
  '/index.js': "module.exports = require('./math.js').add(1, 2);",
  '/math.js': 'module.exports = { add: (a, b) => a + b };',
  '/data.json': '{ "answer": 42 }',
  '/lib/index.js': "module.exports = 'lib-index';",
};

describe('createRequire', () => {
  it('resolves relative .js modules', () => {
    const req = createRequire(fs);
    expect(req('/index.js')).toBe(3);
  });

  it('parses .json files', () => {
    const req = createRequire(fs);
    expect(req('/data.json')).toEqual({ answer: 42 });
  });

  it('falls back to index.js for directories', () => {
    const req = createRequire(fs);
    expect(req('/lib')).toBe('lib-index');
  });

  it('caches modules (same exports object)', () => {
    const req = createRequire(fs);
    expect(req('/math.js')).toBe(req('/math.js'));
  });
});
