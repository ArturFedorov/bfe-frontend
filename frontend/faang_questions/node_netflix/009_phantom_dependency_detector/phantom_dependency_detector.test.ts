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

  describe('import syntax coverage', () => {
    it('detects default imports', () => {
      expect(findPhantomDeps(`import foo from 'foo';`, [])).toEqual(['foo']);
    });

    it('detects named imports', () => {
      expect(findPhantomDeps(`import { a, b } from 'foo';`, [])).toEqual([
        'foo',
      ]);
    });

    it('detects namespace imports', () => {
      expect(findPhantomDeps(`import * as foo from 'foo';`, [])).toEqual([
        'foo',
      ]);
    });

    it('detects side-effect-only imports', () => {
      expect(findPhantomDeps(`import 'foo';`, [])).toEqual(['foo']);
    });

    it('detects default + named combined imports', () => {
      expect(findPhantomDeps(`import def, { a } from 'foo';`, [])).toEqual([
        'foo',
      ]);
    });

    it('detects require() calls', () => {
      expect(findPhantomDeps(`const foo = require('foo');`, [])).toEqual([
        'foo',
      ]);
    });

    it('detects require() not bound to a variable', () => {
      expect(findPhantomDeps(`require('foo');`, [])).toEqual(['foo']);
    });

    it('accepts both single and double quoted specifiers', () => {
      const src = `import a from 'a';\nconst b = require("b");`;
      expect(findPhantomDeps(src, [])).toEqual(['a', 'b']);
    });
  });

  describe('relative and absolute specifiers are never packages', () => {
    it('ignores "./" imports', () => {
      expect(findPhantomDeps(`import x from './x';`, [])).toEqual([]);
    });

    it('ignores "../" imports', () => {
      expect(findPhantomDeps(`import x from '../../lib/x';`, [])).toEqual([]);
    });

    it('ignores absolute "/" imports', () => {
      expect(findPhantomDeps(`const x = require('/etc/x');`, [])).toEqual([]);
    });

    it('ignores relative requires while still flagging bare ones', () => {
      const src = `require('./local');\nrequire('remote');`;
      expect(findPhantomDeps(src, [])).toEqual(['remote']);
    });
  });

  describe('scoped packages and subpaths', () => {
    it('detects scoped packages by their full @scope/name', () => {
      expect(findPhantomDeps(`import x from '@scope/pkg';`, [])).toEqual([
        '@scope/pkg',
      ]);
    });

    it('treats a declared scoped package as satisfied', () => {
      expect(
        findPhantomDeps(`import x from '@scope/pkg';`, ['@scope/pkg']),
      ).toEqual([]);
    });

    it('normalizes a deep import to its owning package', () => {
      // `lodash/fp` is part of the `lodash` package, not a separate dep.
      expect(
        findPhantomDeps(`import fp from 'lodash/fp';`, ['lodash']),
      ).toEqual([]);
    });

    it('flags a deep import when the owning package is undeclared', () => {
      expect(findPhantomDeps(`import fp from 'lodash/fp';`, [])).toEqual([
        'lodash',
      ]);
    });

    it('normalizes a scoped subpath to @scope/name', () => {
      expect(
        findPhantomDeps(`import x from '@scope/pkg/sub/deep';`, ['@scope/pkg']),
      ).toEqual([]);
    });

    it('flags an undeclared scoped subpath as @scope/name', () => {
      expect(findPhantomDeps(`import x from '@scope/pkg/sub';`, [])).toEqual([
        '@scope/pkg',
      ]);
    });
  });

  describe('de-duplication and ordering', () => {
    it('reports each phantom package only once', () => {
      const src = `
        import a from 'dup';
        const b = require('dup');
        import 'dup';
        import { c } from 'dup/sub';
      `;
      expect(findPhantomDeps(src, [])).toEqual(['dup']);
    });

    it('returns the phantom list sorted alphabetically', () => {
      const src = `
        import zebra from 'zebra';
        import apple from 'apple';
        import mango from 'mango';
      `;
      expect(findPhantomDeps(src, [])).toEqual(['apple', 'mango', 'zebra']);
    });

    it('reports only the subset of imports that are undeclared', () => {
      const src = `
        import a from 'declared-1';
        import b from 'phantom-1';
        import c from 'declared-2';
        import d from 'phantom-2';
      `;
      expect(findPhantomDeps(src, ['declared-1', 'declared-2'])).toEqual([
        'phantom-1',
        'phantom-2',
      ]);
    });
  });

  describe('empty and degenerate inputs', () => {
    it('returns [] for empty source', () => {
      expect(findPhantomDeps('', [])).toEqual([]);
    });

    it('returns [] for source with no imports', () => {
      expect(findPhantomDeps('const x = 1 + 2;', ['anything'])).toEqual([]);
    });

    it('flags everything when nothing is declared', () => {
      const src = `import a from 'a';\nimport b from 'b';`;
      expect(findPhantomDeps(src, [])).toEqual(['a', 'b']);
    });
  });
});
