export type RuleLevel = 'off' | 'warn' | 'error';
export interface EslintConfig {
  extends?: string[];
  rules?: Record<string, RuleLevel>;
}

/**
 * Merge an ESLint config's `extends` chain. Follow each preset in order, merging
 * its rules; then apply the config's own rules last. Last write wins per rule.
 */
export function mergeConfig(
  presets: Record<string, EslintConfig>,
  config: EslintConfig,
): Record<string, RuleLevel> {
  // TODO: implement
  throw new Error('Not implemented');
}
