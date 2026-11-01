import { PluginHost, Plugin } from './plugin_system';

describe('PluginHost', () => {
  it('threads transforms in order', () => {
    const host = new PluginHost();
    host.register({ name: 'a', transform: (s) => s + 'A' });
    host.register({ name: 'b', transform: (s) => s + 'B' });
    expect(host.runTransform('x')).toBe('xAB');
  });

  it('runs init in order and cleanup in reverse', () => {
    const order: string[] = [];
    const mk = (name: string): Plugin => ({
      name,
      init: () => order.push('init:' + name),
      cleanup: () => order.push('cleanup:' + name),
    });
    const host = new PluginHost();
    host.register(mk('a'));
    host.register(mk('b'));
    host.runInit();
    host.runCleanup();
    expect(order).toEqual(['init:a', 'init:b', 'cleanup:b', 'cleanup:a']);
  });

  it('returns the host from register for chaining', () => {
    const host = new PluginHost();
    expect(host.register({ name: 'a' })).toBe(host);
  });

  it('returns the input unchanged when no transforms are registered', () => {
    const host = new PluginHost();
    expect(host.runTransform('x')).toBe('x');
  });

  it('skips plugins without a transform hook', () => {
    const host = new PluginHost();
    host.register({ name: 'noop' });
    host.register({ name: 'b', transform: (s) => s + 'B' });
    host.register({ name: 'noop2' });
    expect(host.runTransform('x')).toBe('xB');
  });

  it('threads each transform output into the next', () => {
    const host = new PluginHost();
    host.register({ name: 'upper', transform: (s) => s.toUpperCase() });
    host.register({ name: 'exclaim', transform: (s) => s + '!' });
    expect(host.runTransform('hi')).toBe('HI!');
  });

  it('does not throw when plugins omit init or cleanup', () => {
    const host = new PluginHost();
    host.register({ name: 'a' });
    host.register({ name: 'b', transform: (s) => s });
    expect(() => {
      host.runInit();
      host.runCleanup();
    }).not.toThrow();
  });

  it('only invokes lifecycle hooks on plugins that define them', () => {
    const order: string[] = [];
    const host = new PluginHost();
    host.register({ name: 'a', init: () => order.push('init:a') });
    host.register({ name: 'b' });
    host.register({ name: 'c', cleanup: () => order.push('cleanup:c') });
    host.runInit();
    host.runCleanup();
    expect(order).toEqual(['init:a', 'cleanup:c']);
  });
});
