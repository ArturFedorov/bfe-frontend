import { resolveConfig, Config } from './config_extends_resolver';

const configs: Record<string, Config> = {
  base: { compilerOptions: { strict: true, target: 'ES5' } } as any,
  child: {
    extends: 'base',
    compilerOptions: { target: 'ES2020' },
  } as any,
};

describe('resolveConfig', () => {
  it('deep-merges with child overriding base', () => {
    expect(resolveConfig(configs, 'child')).toEqual({
      compilerOptions: { strict: true, target: 'ES2020' },
    });
  });

  it('drops the extends key', () => {
    expect(resolveConfig(configs, 'child')).not.toHaveProperty('extends');
  });
});
