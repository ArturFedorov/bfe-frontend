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

  it('returns a config without extends unchanged (minus extends)', () => {
    const only: Record<string, Config> = {
      base: { compilerOptions: { strict: true } } as any,
    };
    expect(resolveConfig(only, 'base')).toEqual({
      compilerOptions: { strict: true },
    });
  });

  it('merges flat top-level keys (README example)', () => {
    const flat: Record<string, Config> = {
      base: { a: 1 } as any,
      child: { extends: 'base', b: 2 } as any,
    };
    expect(resolveConfig(flat, 'child')).toEqual({ a: 1, b: 2 });
  });

  it('child scalar overrides base scalar', () => {
    const c: Record<string, Config> = {
      base: { a: 1, b: 1 } as any,
      child: { extends: 'base', b: 2 } as any,
    };
    expect(resolveConfig(c, 'child')).toEqual({ a: 1, b: 2 });
  });

  it('deep-merges nested objects rather than replacing them', () => {
    const c: Record<string, Config> = {
      base: { nested: { x: 1, y: 1 } } as any,
      child: { extends: 'base', nested: { y: 2, z: 3 } } as any,
    };
    expect(resolveConfig(c, 'child')).toEqual({
      nested: { x: 1, y: 2, z: 3 },
    });
  });

  it('resolves a multi-level chain (grandchild → child → base)', () => {
    const c: Record<string, Config> = {
      base: { a: 1, b: 1, c: 1 } as any,
      child: { extends: 'base', b: 2, c: 2 } as any,
      grandchild: { extends: 'child', c: 3 } as any,
    };
    expect(resolveConfig(c, 'grandchild')).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('supports an array of extends with later entries winning', () => {
    const c: Record<string, Config> = {
      first: { a: 1, shared: 'first' } as any,
      second: { b: 2, shared: 'second' } as any,
      child: { extends: ['first', 'second'], c: 3 } as any,
    };
    expect(resolveConfig(c, 'child')).toEqual({
      a: 1,
      b: 2,
      c: 3,
      shared: 'second',
    });
  });

  it('lets the child override values from array bases', () => {
    const c: Record<string, Config> = {
      first: { shared: 'first' } as any,
      second: { shared: 'second' } as any,
      child: { extends: ['first', 'second'], shared: 'child' } as any,
    };
    expect(resolveConfig(c, 'child')).toEqual({ shared: 'child' });
  });

  it('deep-merges nested objects across array bases', () => {
    const c: Record<string, Config> = {
      first: { opts: { a: 1, common: 'first' } } as any,
      second: { opts: { b: 2, common: 'second' } } as any,
      child: { extends: ['first', 'second'], opts: { c: 3 } } as any,
    };
    expect(resolveConfig(c, 'child')).toEqual({
      opts: { a: 1, b: 2, c: 3, common: 'second' },
    });
  });

  it('drops extends keys throughout the resolved chain', () => {
    const result = resolveConfig(
      {
        base: { a: 1 } as any,
        child: { extends: 'base', b: 2 } as any,
        grandchild: { extends: 'child', c: 3 } as any,
      },
      'grandchild',
    );
    expect(result).not.toHaveProperty('extends');
  });

  it('does not mutate the input configs', () => {
    const input: Record<string, Config> = {
      base: { nested: { x: 1 } } as any,
      child: { extends: 'base', nested: { y: 2 } } as any,
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    resolveConfig(input, 'child');
    expect(input).toEqual(snapshot);
  });
});
