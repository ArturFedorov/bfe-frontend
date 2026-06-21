import { sortImports } from './import_sorter';

describe('sortImports', () => {
  it('groups builtins, externals, then internals', () => {
    const input = [
      "import express from 'express';",
      "import { join } from 'path';",
      "import { helper } from './helper';",
      "import fs from 'fs';",
      "import axios from 'axios';",
    ];
    expect(sortImports(input)).toEqual([
      "import fs from 'fs';",
      "import { join } from 'path';",
      '',
      "import axios from 'axios';",
      "import express from 'express';",
      '',
      "import { helper } from './helper';",
    ]);
  });
});

describe('sortImports — empty and trivial input', () => {
  it('returns an empty array for no imports', () => {
    expect(sortImports([])).toEqual([]);
  });

  it('returns a single import unchanged', () => {
    expect(sortImports(["import fs from 'fs';"])).toEqual([
      "import fs from 'fs';",
    ]);
  });
});

describe('sortImports — single group (no blank lines)', () => {
  it('sorts only builtins with no separators', () => {
    const input = [
      "import http from 'http';",
      "import fs from 'fs';",
      "import { join } from 'path';",
    ];
    expect(sortImports(input)).toEqual([
      "import fs from 'fs';",
      "import http from 'http';",
      "import { join } from 'path';",
    ]);
  });

  it('sorts only external packages with no separators', () => {
    const input = [
      "import lodash from 'lodash';",
      "import axios from 'axios';",
      "import express from 'express';",
    ];
    expect(sortImports(input)).toEqual([
      "import axios from 'axios';",
      "import express from 'express';",
      "import lodash from 'lodash';",
    ]);
  });

  it('sorts only internal imports with no separators', () => {
    const input = [
      "import { c } from './c';",
      "import { a } from './a';",
      "import { b } from './b';",
    ];
    expect(sortImports(input)).toEqual([
      "import { a } from './a';",
      "import { b } from './b';",
      "import { c } from './c';",
    ]);
  });
});

describe('sortImports — blank-line separation between present groups', () => {
  it('separates builtins and externals when no internals exist', () => {
    const input = ["import axios from 'axios';", "import fs from 'fs';"];
    expect(sortImports(input)).toEqual([
      "import fs from 'fs';",
      '',
      "import axios from 'axios';",
    ]);
  });

  it('separates builtins and internals when no externals exist', () => {
    const input = [
      "import { helper } from './helper';",
      "import fs from 'fs';",
    ];
    expect(sortImports(input)).toEqual([
      "import fs from 'fs';",
      '',
      "import { helper } from './helper';",
    ]);
  });

  it('separates externals and internals when no builtins exist', () => {
    const input = [
      "import { helper } from './helper';",
      "import axios from 'axios';",
    ];
    expect(sortImports(input)).toEqual([
      "import axios from 'axios';",
      '',
      "import { helper } from './helper';",
    ]);
  });
});

describe('sortImports — builtin recognition', () => {
  it('treats node: prefixed specifiers as builtins', () => {
    const input = [
      "import axios from 'axios';",
      "import { readFile } from 'node:fs';",
    ];
    expect(sortImports(input)).toEqual([
      "import { readFile } from 'node:fs';",
      '',
      "import axios from 'axios';",
    ]);
  });

  it('recognizes a variety of known builtins', () => {
    const input = [
      "import os from 'os';",
      "import http from 'http';",
      "import crypto from 'crypto';",
      "import util from 'util';",
    ];
    expect(sortImports(input)).toEqual([
      "import crypto from 'crypto';",
      "import http from 'http';",
      "import os from 'os';",
      "import util from 'util';",
    ]);
  });

  it('sorts node: builtins alongside bare builtins by specifier', () => {
    const input = [
      "import { join } from 'path';",
      "import { readFile } from 'node:fs';",
    ];
    expect(sortImports(input)).toEqual([
      "import { readFile } from 'node:fs';",
      "import { join } from 'path';",
    ]);
  });
});

describe('sortImports — internal classification', () => {
  it('treats ../ parent imports as internal', () => {
    const input = ["import { up } from '../up';", "import axios from 'axios';"];
    expect(sortImports(input)).toEqual([
      "import axios from 'axios';",
      '',
      "import { up } from '../up';",
    ]);
  });

  it('treats absolute / imports as internal', () => {
    const input = [
      "import { root } from '/root';",
      "import lodash from 'lodash';",
    ];
    expect(sortImports(input)).toEqual([
      "import lodash from 'lodash';",
      '',
      "import { root } from '/root';",
    ]);
  });

  it('sorts mixed relative depths alphabetically by specifier', () => {
    const input = [
      "import { b } from './b';",
      "import { a } from '../a';",
      "import { c } from './nested/c';",
    ];
    expect(sortImports(input)).toEqual([
      "import { a } from '../a';",
      "import { b } from './b';",
      "import { c } from './nested/c';",
    ]);
  });
});

describe('sortImports — import statement forms', () => {
  it('handles default, named, namespace, and side-effect imports', () => {
    const input = [
      "import './polyfill';",
      "import * as path from 'path';",
      "import axios, { AxiosError } from 'axios';",
      "import React from 'react';",
    ];
    expect(sortImports(input)).toEqual([
      "import * as path from 'path';",
      '',
      "import axios, { AxiosError } from 'axios';",
      "import React from 'react';",
      '',
      "import './polyfill';",
    ]);
  });

  it('preserves the original statement text verbatim', () => {
    const input = ["import {   spaced   } from 'b';", "import fs from 'fs';"];
    expect(sortImports(input)).toEqual([
      "import fs from 'fs';",
      '',
      "import {   spaced   } from 'b';",
    ]);
  });
});

describe('sortImports — scoped packages', () => {
  it('classifies @scoped packages as external and sorts them', () => {
    const input = [
      "import { render } from '@testing-library/react';",
      "import axios from 'axios';",
      "import config from '@app/config';",
    ];
    expect(sortImports(input)).toEqual([
      "import config from '@app/config';",
      "import { render } from '@testing-library/react';",
      "import axios from 'axios';",
    ]);
  });
});
