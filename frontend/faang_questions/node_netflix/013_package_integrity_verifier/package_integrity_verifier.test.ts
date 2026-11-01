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

  it('accepts an empty string against its own hash', () => {
    expect(verifyIntegrity('', computeIntegrity(''))).toBe(true);
  });

  it('verifies Buffer contents', () => {
    const buf = Buffer.from([0x00, 0x01, 0x02, 0xff]);
    expect(verifyIntegrity(buf, computeIntegrity(buf))).toBe(true);
  });

  it('treats a string and a Buffer of the same bytes as equivalent', () => {
    const text = 'hello world';
    const fromString = computeIntegrity(text);
    expect(verifyIntegrity(Buffer.from(text, 'utf8'), fromString)).toBe(true);
  });

  it('verifies unicode content round-trips', () => {
    const contents = 'こんにちは 🌍 — café';
    expect(verifyIntegrity(contents, computeIntegrity(contents))).toBe(true);
  });

  it('rejects when a single byte of the payload changes', () => {
    const integrity = computeIntegrity('package-v1.0.0');
    expect(verifyIntegrity('package-v1.0.1', integrity)).toBe(false);
  });

  it('matches a known sha512 integrity value for "hello world"', () => {
    const golden =
      'sha512-MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXbw==';
    expect(verifyIntegrity('hello world', golden)).toBe(true);
  });
});

describe('verifyIntegrity — malformed or mismatched integrity strings', () => {
  it('rejects an integrity string with the wrong algorithm prefix', () => {
    // correct sha256 digest of the contents, but the verifier expects sha512
    const sha256 = 'sha256-uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=';
    expect(verifyIntegrity('hello world', sha256)).toBe(false);
  });

  it('rejects an integrity string missing the "sha512-" prefix', () => {
    const withPrefix = computeIntegrity('hello world');
    const withoutPrefix = withPrefix.replace(/^sha512-/, '');
    expect(verifyIntegrity('hello world', withoutPrefix)).toBe(false);
  });

  it('rejects a base64 hash that differs by a single character', () => {
    const integrity = computeIntegrity('hello world');
    // flip the first base64 character (M -> N)
    const corrupted = integrity.replace('sha512-M', 'sha512-N');
    expect(integrity).not.toEqual(corrupted);
    expect(verifyIntegrity('hello world', corrupted)).toBe(false);
  });

  it('is case-sensitive about the base64 hash', () => {
    const integrity = computeIntegrity('hello world');
    expect(verifyIntegrity('hello world', integrity.toUpperCase())).toBe(false);
  });

  it('rejects an integrity string with trailing whitespace', () => {
    const integrity = computeIntegrity('hello world');
    expect(verifyIntegrity('hello world', `${integrity} `)).toBe(false);
  });

  it('rejects an empty integrity string', () => {
    expect(verifyIntegrity('hello world', '')).toBe(false);
  });
});

describe('computeIntegrity', () => {
  it('is deterministic for identical input', () => {
    expect(computeIntegrity('repeatable')).toBe(computeIntegrity('repeatable'));
  });

  it('produces a "sha512-" prefixed, base64-encoded digest', () => {
    const integrity = computeIntegrity('hello world');
    expect(integrity.startsWith('sha512-')).toBe(true);
    const body = integrity.slice('sha512-'.length);
    // sha512 = 64 bytes -> 88 base64 characters (with padding)
    expect(body).toHaveLength(88);
    expect(body).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  });

  it('produces different digests for different inputs', () => {
    expect(computeIntegrity('a')).not.toBe(computeIntegrity('b'));
  });

  it('matches the known digest for "hello world"', () => {
    expect(computeIntegrity('hello world')).toBe(
      'sha512-MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXbw==',
    );
  });

  it('produces equal digests for a string and an equivalent Buffer', () => {
    expect(computeIntegrity('hello world')).toBe(
      computeIntegrity(Buffer.from('hello world', 'utf8')),
    );
  });
});
