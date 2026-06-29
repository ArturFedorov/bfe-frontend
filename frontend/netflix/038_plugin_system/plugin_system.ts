export interface Plugin {
  name: string;
  init?: () => void;
  transform?: (input: string) => string;
  cleanup?: () => void;
}

/**
 * A plugin host with lifecycle hooks. Register plugins, then:
 *   - runInit(): call each plugin's init() in registration order
 *   - runTransform(input): thread input through every transform() in order
 *   - runCleanup(): call cleanup() in REVERSE registration order
 */
export class PluginHost {
  private plugins: Plugin[] = [];

  register(plugin: Plugin): this {
    if (!plugin) return this;

    this.plugins.push(plugin);

    return this;
  }

  runInit(): void {
    this.plugins.forEach(({ init }) => {
      init?.();
    });
  }

  runTransform(input: string): string {
    return this.plugins.reduce((acc, plugin) => {
      if (plugin && plugin.transform) {
        acc = plugin.transform(acc);
        return acc;
      }

      return acc;
    }, input || '');
  }

  runCleanup(): void {
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      this.plugins[i]?.cleanup?.();
    }
  }
}
