import { nextVersion } from './version_bump_calculator';

describe('nextVersion', () => {
  it('bumps patch for fixes', () => {
    expect(nextVersion('1.2.3', ['fix: a bug'])).toBe('1.2.4');
  });

  it('bumps minor for features', () => {
    expect(nextVersion('1.2.3', ['feat: a feature', 'fix: a bug'])).toBe(
      '1.3.0',
    );
  });

  it('bumps major for breaking changes', () => {
    expect(nextVersion('1.2.3', ['feat!: drop node 14'])).toBe('2.0.0');
  });

  it('bumps patch for non-feat, non-breaking commit types', () => {
    expect(nextVersion('1.2.3', ['chore: update deps'])).toBe('1.2.4');
    expect(nextVersion('1.2.3', ['docs: fix typo'])).toBe('1.2.4');
    expect(nextVersion('1.2.3', ['refactor: cleanup'])).toBe('1.2.4');
  });

  it('bumps major for a breaking fix (! on a non-feat type)', () => {
    expect(nextVersion('1.2.3', ['fix!: change error shape'])).toBe('2.0.0');
  });

  it('bumps major when BREAKING CHANGE appears in the commit body', () => {
    expect(
      nextVersion('1.2.3', [
        'feat: add new option\n\nBREAKING CHANGE: old option removed',
      ]),
    ).toBe('2.0.0');
  });

  it('detects a breaking change anywhere in the commit list, not just the first', () => {
    expect(
      nextVersion('1.2.3', [
        'fix: a bug',
        'feat: a feature',
        'fix!: drop legacy support',
      ]),
    ).toBe('2.0.0');
  });

  it('resets both minor and patch on a major bump', () => {
    expect(nextVersion('0.5.7', ['feat!: rewrite core'])).toBe('1.0.0');
  });

  it('resets patch on a minor bump', () => {
    expect(nextVersion('2.5.9', ['feat: add option'])).toBe('2.6.0');
  });

  it('does not bump minor or major for a plain fix even amongst several commits', () => {
    expect(nextVersion('1.2.3', ['fix: a', 'fix: b', 'chore: c'])).toBe(
      '1.2.4',
    );
  });

  it('picks the highest-precedence bump when multiple types are present', () => {
    expect(
      nextVersion('1.2.3', ['chore: cleanup', 'fix: a bug', 'feat: a feature']),
    ).toBe('1.3.0');
  });
});
