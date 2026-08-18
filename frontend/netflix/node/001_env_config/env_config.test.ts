import { ConfigError, loadConfig } from './env_config';

const spec = {
  dbUrl: { env: 'DELIVERY_DB_URL', type: 'string', required: true },
  port: { env: 'PORT', type: 'number', default: 8080 },
  verbose: { env: 'VERBOSE', type: 'boolean', default: false },
  region: { env: 'REGION', type: 'string' },
} as const;

describe('loadConfig', () => {
  it('loads and coerces a fully-specified environment', () => {
    const config = loadConfig(
      {
        DELIVERY_DB_URL: 'postgres://delivery',
        PORT: '3000',
        VERBOSE: 'true',
        REGION: 'us-east-1',
      },
      spec,
    );
    expect(config).toEqual({
      dbUrl: 'postgres://delivery',
      port: 3000,
      verbose: true,
      region: 'us-east-1',
    });
  });

  it('applies defaults when optional vars are absent', () => {
    const config = loadConfig({ DELIVERY_DB_URL: 'postgres://delivery' }, spec);
    expect(config.port).toBe(8080);
    expect(config.verbose).toBe(false);
  });

  it('leaves optional vars without defaults as undefined', () => {
    const config = loadConfig({ DELIVERY_DB_URL: 'postgres://delivery' }, spec);
    expect(config.region).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(config, 'region')).toBe(true);
  });

  it('never reads process.env — only the injected object', () => {
    process.env.DELIVERY_DB_URL = 'postgres://should-not-be-seen';
    try {
      expect(() => loadConfig({}, spec)).toThrow(ConfigError);
    } finally {
      delete process.env.DELIVERY_DB_URL;
    }
  });

  describe('missing required vars', () => {
    it('throws a ConfigError listing the missing var', () => {
      expect.assertions(3);
      try {
        loadConfig({ PORT: '3000' }, spec);
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigError);
        expect((err as ConfigError).missing).toEqual(['DELIVERY_DB_URL']);
        expect((err as ConfigError).message).toContain('DELIVERY_DB_URL');
      }
    });

    it('treats an empty string as missing', () => {
      expect(() => loadConfig({ DELIVERY_DB_URL: '' }, spec)).toThrow(ConfigError);
    });

    it('aggregates every missing required var, not just the first', () => {
      const multiSpec = {
        a: { env: 'VAR_A', type: 'string', required: true },
        b: { env: 'VAR_B', type: 'number', required: true },
        c: { env: 'VAR_C', type: 'boolean', required: true },
      } as const;
      expect.assertions(2);
      try {
        loadConfig({ VAR_B: '42' }, multiSpec);
      } catch (err) {
        expect((err as ConfigError).missing).toEqual(['VAR_A', 'VAR_C']);
        expect((err as ConfigError).invalid).toEqual([]);
      }
    });
  });

  describe('coercion', () => {
    it('coerces numbers and rejects non-numeric strings', () => {
      const ok = loadConfig({ DELIVERY_DB_URL: 'x', PORT: '9090' }, spec);
      expect(ok.port).toBe(9090);
      expect(() => loadConfig({ DELIVERY_DB_URL: 'x', PORT: 'fast' }, spec)).toThrow(ConfigError);
    });

    it('rejects NaN and Infinity-producing values', () => {
      expect(() => loadConfig({ DELIVERY_DB_URL: 'x', PORT: 'NaN' }, spec)).toThrow(ConfigError);
      expect(() => loadConfig({ DELIVERY_DB_URL: 'x', PORT: 'Infinity' }, spec)).toThrow(
        ConfigError,
      );
    });

    it('accepts true/1/false/0 as booleans, case-insensitively', () => {
      const base = { DELIVERY_DB_URL: 'x' };
      expect(loadConfig({ ...base, VERBOSE: 'true' }, spec).verbose).toBe(true);
      expect(loadConfig({ ...base, VERBOSE: 'TRUE' }, spec).verbose).toBe(true);
      expect(loadConfig({ ...base, VERBOSE: '1' }, spec).verbose).toBe(true);
      expect(loadConfig({ ...base, VERBOSE: 'false' }, spec).verbose).toBe(false);
      expect(loadConfig({ ...base, VERBOSE: '0' }, spec).verbose).toBe(false);
    });

    it('rejects anything else for booleans', () => {
      expect(() => loadConfig({ DELIVERY_DB_URL: 'x', VERBOSE: 'yes' }, spec)).toThrow(
        ConfigError,
      );
    });

    it('reports the failing env var name and reason in invalid[]', () => {
      expect.assertions(2);
      try {
        loadConfig({ DELIVERY_DB_URL: 'x', PORT: 'fast' }, spec);
      } catch (err) {
        const invalid = (err as ConfigError).invalid;
        expect(invalid).toHaveLength(1);
        expect(invalid[0]).toEqual({ key: 'PORT', reason: expect.stringContaining('fast') });
      }
    });
  });

  it('aggregates missing AND invalid into one error', () => {
    expect.assertions(3);
    try {
      loadConfig({ PORT: 'fast', VERBOSE: 'maybe' }, spec);
    } catch (err) {
      const e = err as ConfigError;
      expect(e.missing).toEqual(['DELIVERY_DB_URL']);
      expect(e.invalid.map((i) => i.key)).toEqual(['PORT', 'VERBOSE']);
      expect(e.message).toEqual(expect.stringContaining('PORT'));
    }
  });
});
