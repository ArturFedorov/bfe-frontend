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
  register(plugin: Plugin): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  runInit(): void {
    // TODO: implement
    throw new Error('Not implemented');
  }

  runTransform(input: string): string {
    // TODO: implement
    throw new Error('Not implemented');
  }

  runCleanup(): void {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
