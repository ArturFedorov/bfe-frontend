import { builtinModules } from 'module';

const BUILTINS = new Set(builtinModules);

/**
 * Sort the import statements at the top of a file into three groups, each
 * sorted alphabetically by module specifier, separated by a blank line:
 *   1. Node builtins (e.g. 'fs', 'path', 'node:fs')
 *   2. External packages (bare specifiers)
 *   3. Internal/relative imports ('./', '../')
 * Return the rewritten import block (imports only).
 */
export function sortImports(imports: string[]): string[] {
  const fromNode: string[] = [];
  const fromLibs: string[] = [];
  const fromLocal: string[] = [];

  for (const line of imports) {
    const fromPart = line.split('from ')[1];
    if (!fromPart) {
      fromLocal.push(line);
      continue;
    }

    const packageName = fromPart.replace(/['"]/g, '').replace(';', '');

    if (isBuildIn(packageName)) {
      fromNode.push(line);
    } else if (
      packageName.startsWith('./') ||
      packageName.startsWith('../') ||
      packageName.startsWith('/')
    ) {
      fromLocal.push(line);
    } else {
      fromLibs.push(line);
    }
  }

  const groups = [fromNode, fromLibs, fromLocal]
    .filter((g) => g.length > 0)
    .map((g) =>
      g.sort((a, b) => getSpecifier(a).localeCompare(getSpecifier(b))),
    );

  return groups.flatMap((group, i) =>
    i < groups.length - 1 ? [...group, ''] : group,
  );
}

function isBuildIn(pkg: string): boolean {
  if (pkg.startsWith('node:')) return true;

  return BUILTINS.has(pkg);
}

function getSpecifier(line: string): string {
  const fromPart = line.split('from ')[1];
  if (!fromPart) return line;

  return fromPart.replace(/['";\s]/g, '');
}
