import {
  computeIntegrity,
  verifyIntegrity,
} from './package_integrity_verifier';

describe('verifyIntegrity', () => {
  it('accepts a matching hash', () => {
    const contents = 'hello world';
    const integrity = computeIntegrity(contents);
    expect(verifyIntegrity(contents, integrity)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const integrity = computeIntegrity('original');
    expect(verifyIntegrity('tampered', integrity)).toBe(false);
  });
});
