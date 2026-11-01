import {
  parseConfirm,
  applyKey,
  SelectState,
} from './interactive_prompt_system';

describe('parseConfirm', () => {
  it('uses the default on empty input', () => {
    expect(parseConfirm('', true)).toBe(true);
    expect(parseConfirm('', false)).toBe(false);
  });

  it('parses yes/no case-insensitively', () => {
    expect(parseConfirm('Y', false)).toBe(true);
    expect(parseConfirm('no', true)).toBe(false);
  });
});

describe('applyKey', () => {
  const base: SelectState = { index: 0, length: 3, done: false };

  it('moves down and wraps', () => {
    expect(applyKey(base, 'down').index).toBe(1);
    expect(applyKey({ ...base, index: 2 }, 'down').index).toBe(0);
  });

  it('moves up and wraps', () => {
    expect(applyKey(base, 'up').index).toBe(2);
  });

  it('marks done on enter', () => {
    expect(applyKey(base, 'enter').done).toBe(true);
  });
});
