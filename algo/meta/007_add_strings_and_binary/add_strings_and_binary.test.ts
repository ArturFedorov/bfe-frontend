import { addBinary, addStrings } from './add_strings_and_binary';

describe('addStrings', () => {
  it('examples', () => {
    expect(addStrings('11', '123')).toBe('134');
    expect(addStrings('456', '77')).toBe('533');
    expect(addStrings('0', '0')).toBe('0');
  });

  it('adds zero to a number', () => {
    expect(addStrings('0', '987')).toBe('987');
    expect(addStrings('987', '0')).toBe('987');
  });

  it('propagates a carry into a new leading digit', () => {
    expect(addStrings('999', '1')).toBe('1000');
    expect(addStrings('1', '9999')).toBe('10000');
  });

  it('handles single digits', () => {
    expect(addStrings('9', '9')).toBe('18');
    expect(addStrings('3', '4')).toBe('7');
  });

  it('handles numbers beyond Number precision', () => {
    expect(addStrings('9007199254740993', '9007199254740993')).toBe(
      '18014398509481986',
    );
    expect(
      addStrings('123456789123456789123456789', '987654321987654321987654321'),
    ).toBe('1111111111111111111111111110');
  });

  it('handles very long inputs', () => {
    const n = 100_000;
    expect(addStrings('9'.repeat(n), '1')).toBe('1' + '0'.repeat(n));
    expect(addStrings('1'.repeat(n), '8'.repeat(n))).toBe('9'.repeat(n));
  });
});

describe('addBinary', () => {
  it('examples', () => {
    expect(addBinary('11', '1')).toBe('100');
    expect(addBinary('1010', '1011')).toBe('10101');
  });

  it('adds zeros', () => {
    expect(addBinary('0', '0')).toBe('0');
    expect(addBinary('0', '101')).toBe('101');
  });

  it('propagates a carry through all ones', () => {
    expect(addBinary('1111', '1')).toBe('10000');
    expect(addBinary('1', '1')).toBe('10');
  });

  it('handles different lengths', () => {
    expect(addBinary('100', '110010')).toBe('110110');
  });

  it('handles numbers beyond Number precision', () => {
    const a = '1' + '0'.repeat(60); // 2^60
    expect(addBinary(a, a)).toBe('1' + '0'.repeat(61));
    expect(addBinary('1'.repeat(64), '1')).toBe('1' + '0'.repeat(64));
  });

  it('handles very long inputs', () => {
    const n = 100_000;
    expect(addBinary('1'.repeat(n), '1')).toBe('1' + '0'.repeat(n));
    expect(addBinary('10'.repeat(n / 2), '01'.repeat(n / 2))).toBe(
      '1'.repeat(n),
    );
  });
});
