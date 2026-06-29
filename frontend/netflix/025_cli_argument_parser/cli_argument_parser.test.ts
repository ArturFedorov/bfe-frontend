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

  it('returns empty groups for empty argv', () => {
    const r = parseArgs([]);
    expect(r.flags).toEqual({});
    expect(r.options).toEqual({});
    expect(r.positionals).toEqual([]);
  });

  it('parses multiple boolean flags', () => {
    expect(parseArgs(['--verbose', '--debug']).flags).toEqual({
      verbose: true,
      debug: true,
    });
  });

  it('parses multiple options', () => {
    expect(parseArgs(['--out', 'dist', '--mode=prod']).options).toEqual({
      out: 'dist',
      mode: 'prod',
    });
  });

  it('treats a flag followed by another flag as boolean', () => {
    const r = parseArgs(['--verbose', '--out=dist']);
    expect(r.flags).toEqual({ verbose: true });
    expect(r.options).toEqual({ out: 'dist' });
  });

  it('treats a trailing flag as boolean', () => {
    const r = parseArgs(['--out=dist', '--verbose']);
    expect(r.flags).toEqual({ verbose: true });
    expect(r.options).toEqual({ out: 'dist' });
  });

  it('consumes the next token as a value, not a positional', () => {
    const r = parseArgs(['--out', 'dist', 'src']);
    expect(r.options).toEqual({ out: 'dist' });
    expect(r.positionals).toEqual(['src']);
  });

  it('keeps positionals appearing after options', () => {
    const r = parseArgs(['--out=dist', 'build', 'src']);
    expect(r.options).toEqual({ out: 'dist' });
    expect(r.positionals).toEqual(['build', 'src']);
  });
});
