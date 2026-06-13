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
});
