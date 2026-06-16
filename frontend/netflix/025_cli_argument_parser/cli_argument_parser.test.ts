import { parseArgs } from './cli_argument_parser';

describe('parseArgs', () => {
  it('parses boolean flags', () => {
    expect(parseArgs(['--verbose']).flags).toEqual({ verbose: true });
  });

  it('parses --key=value options', () => {
    expect(parseArgs(['--output=dist']).options).toEqual({ output: 'dist' });
  });

  it('parses --key value options', () => {
    expect(parseArgs(['--output', 'dist']).options).toEqual({ output: 'dist' });
  });

  it('collects positionals', () => {
    expect(parseArgs(['build', 'src']).positionals).toEqual(['build', 'src']);
  });

  it('handles a realistic mix', () => {
    const r = parseArgs(['build', '--verbose', '--out=dist', 'src']);
    expect(r.flags).toEqual({ verbose: true });
    expect(r.options).toEqual({ out: 'dist' });
    expect(r.positionals).toEqual(['build', 'src']);
  });
});
