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
  // TODO: implement
  throw new Error('Not implemented');
}
