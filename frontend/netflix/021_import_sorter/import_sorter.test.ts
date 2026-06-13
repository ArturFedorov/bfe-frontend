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
