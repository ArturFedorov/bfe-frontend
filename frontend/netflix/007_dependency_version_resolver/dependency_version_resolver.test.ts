import { resolve, Registry } from './dependency_version_resolver';

const registry: Registry = {
  react: ['16.0.0', '17.0.0', '17.0.2', '18.0.0'],
  lodash: ['4.17.20', '4.17.21'],
};

describe('resolve', () => {
  it('picks the highest satisfying version', () => {
    expect(resolve(registry, { react: '^17.0.0', lodash: '^4.17.0' })).toEqual({
      react: '17.0.2',
      lodash: '4.17.21',
    });
  });

  it('throws when no version satisfies', () => {
    expect(() => resolve(registry, { react: '^19.0.0' })).toThrow();
  });
});
