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
});
