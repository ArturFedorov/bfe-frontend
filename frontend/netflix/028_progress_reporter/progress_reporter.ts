/**
 * Render a single-line CLI progress bar string.
 *   renderBar(3, 10, 10) -> '[###-------] 30%'
 * - `current`/`total` give the ratio (clamp to [0, total]).
 * - `width` is the number of cells in the bar.
 * Use '#' for filled and '-' for empty cells; append ' NN%' (rounded).
 */
export function renderBar(
  current: number,
  total: number,
  width: number,
): string {
  const clamped = Math.max(0, Math.min(current, total));
  const ratio = total === 0 ? 0 : clamped / total;
  const percentage = Math.round(ratio * 100);
  const filled = Math.round(ratio * width);

  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${percentage}%`;
}
