import { typedInputsEqual } from './typed_input_compare';

describe('typedInputsEqual', () => {
  it('treats a single backspace as erasing the previous character', () => {
    expect(typedInputsEqual('ab#c', 'ad#c')).toBe(true); // both render 'ac'
  });

  it('detects different rendered text', () => {
    expect(typedInputsEqual('a#c', 'b')).toBe(false); // 'c' vs 'b'
    expect(typedInputsEqual('abc', 'abd')).toBe(false);
  });

  it('compares recordings with no backspaces at all', () => {
    expect(typedInputsEqual('hello', 'hello')).toBe(true);
    expect(typedInputsEqual('hello', 'hell')).toBe(false);
  });

  it('handles everything being erased', () => {
    expect(typedInputsEqual('ab##', 'c#d#')).toBe(true); // both render ''
    expect(typedInputsEqual('abc###', '')).toBe(true);
  });

  it('treats backspace on an empty input as a no-op', () => {
    expect(typedInputsEqual('####a', 'a')).toBe(true);
    expect(typedInputsEqual('#', '')).toBe(true);
    expect(typedInputsEqual('##', '#')).toBe(true);
  });

  it('handles consecutive backspaces mid-string', () => {
    expect(typedInputsEqual('abcd##e', 'abe')).toBe(true); // 'abcd' minus 'cd' plus 'e'
    expect(typedInputsEqual('xy##xy', 'xy')).toBe(true);
  });

  it('handles two empty recordings', () => {
    expect(typedInputsEqual('', '')).toBe(true);
  });

  it('distinguishes empty render from non-empty render', () => {
    expect(typedInputsEqual('a#', 'a')).toBe(false);
    expect(typedInputsEqual('', 'a')).toBe(false);
  });

  it('handles recordings of very different lengths that render equally', () => {
    expect(typedInputsEqual('a'.repeat(10) + '#'.repeat(9), 'a')).toBe(true);
  });

  it('fails fast on a trailing character difference', () => {
    expect(typedInputsEqual('abcx#z', 'abcy#z')).toBe(true); // both render 'abcz'
    expect(typedInputsEqual('abcx#z', 'abcy#w')).toBe(false);
  });

  it('compares 200_000-keystroke recordings in linear time', () => {
    const n = 200_000;
    const pieces: string[] = [];
    for (let i = 0; i < n / 4; i++) {
      pieces.push('ab#c'); // renders 'ac' per chunk
    }
    const a = pieces.join('');
    const b = 'ac'.repeat(n / 4) + 'zz##'; // same render, different keystrokes
    expect(typedInputsEqual(a, b)).toBe(true);

    const c = 'ac'.repeat(n / 4 - 1) + 'ad';
    expect(typedInputsEqual(a, c)).toBe(false);
  });
});
