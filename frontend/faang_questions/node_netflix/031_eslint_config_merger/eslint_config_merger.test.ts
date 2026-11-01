import { mergeConfig, EslintConfig } from './eslint_config_merger';

const presets: Record<string, EslintConfig> = {
  recommended: { rules: { 'no-unused': 'error', 'no-console': 'warn' } },
  strict: { extends: ['recommended'], rules: { 'no-console': 'error' } },
};

describe('mergeConfig', () => {
  it('merges presets with last-wins per rule', () => {
    const result = mergeConfig(presets, {
      extends: ['strict'],
      rules: { 'no-unused': 'warn' },
    });
    expect(result).toEqual({
      'no-unused': 'warn', // own rule wins over preset
      'no-console': 'error', // strict overrode recommended
    });
  });
});
