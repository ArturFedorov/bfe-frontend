import { findPhantomDeps } from './phantom_dependency_detector';

const source = `
import express from 'express';
import { join } from 'path';
const lodash = require('lodash');
import helper from './helper';
`;

describe('findPhantomDeps', () => {
  it('flags imports not declared in package.json', () => {
    expect(findPhantomDeps(source, ['express', 'path'])).toEqual(['lodash']);
  });

  it('ignores relative imports', () => {
    expect(findPhantomDeps(`import x from './x';`, [])).toEqual([]);
  });

  it('returns empty when all deps are declared', () => {
    expect(findPhantomDeps(`import a from 'a';`, ['a'])).toEqual([]);
  });
});
