import { spyOn } from './spy_on_method';

describe('spyOn', () => {
  it('records calls, calls through, and restores', () => {
    const obj = { greet: (name: string) => `hi ${name}` };
    const original = obj.greet;

    const spy = spyOn(obj, 'greet');
    expect(obj.greet('a')).toBe('hi a');
    expect(spy.calls).toEqual([['a']]);

    spy.restore();
    expect(obj.greet).toBe(original);
  });
});
