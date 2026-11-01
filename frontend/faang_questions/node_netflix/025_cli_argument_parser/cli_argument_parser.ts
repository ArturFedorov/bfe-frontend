export interface ParsedArgs {
  flags: Record<string, boolean>;
  options: Record<string, string>;
  positionals: string[];
}

/**
 * Parse argv-style tokens:
 *   --verbose            -> flags.verbose = true
 *   --output=dist        -> options.output = 'dist'
 *   --output dist        -> options.output = 'dist'
 *   foo bar              -> positionals: ['foo', 'bar']
 * A `--flag` followed by another `--token` (or end of input) is a boolean flag.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    flags: {},
    options: {},
    positionals: [],
  };

  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];

    if (!hasLeadingDash(arg)) {
      result.positionals.push(arg);
      i++;
      continue;
    }

    if (arg.includes('=')) {
      const [key, value] = splitValue(trimFlag(arg));
      result.options[key] = value;
      i++;
      continue;
    }

    const key = trimFlag(arg);
    const next = argv[i + 1];

    if (next && !hasLeadingDash(next)) {
      result.options[key] = next;
      i += 2;
    } else {
      result.flags[key] = true;
      i++;
    }
  }

  return result;
}

function hasLeadingDash(arg: string): boolean {
  return arg.startsWith('--');
}

function trimFlag(arg: string): string {
  return hasLeadingDash(arg) ? arg.slice(2) : arg;
}

function splitValue(arg: string): string[] {
  return arg.split(/=+/);
}
