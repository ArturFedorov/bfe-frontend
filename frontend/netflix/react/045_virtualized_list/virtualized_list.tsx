export type LogViewerProps = {
  /** All log lines (can be 50k+). */
  logs: string[];
  /** Viewport height in px. */
  height: number;
  /** Fixed row height in px — every row must render at exactly this height. */
  rowHeight: number;
  /** Extra rows rendered above and below the visible range. */
  overscan: number;
  /** Render probe: call once per rendered row as `row-<index>`. */
  onRender?: (id: string) => void;
};

// Contract the tests rely on (see README for the full spec):
// - outer scroll container: data-testid="log-viewport", style height = `height`
// - inner spacer: data-testid="log-spacer", role="list",
//   style height = logs.length * rowHeight (this is what makes the scrollbar honest)
// - each rendered row: role="listitem", absolutely positioned at
//   top = index * rowHeight with height = rowHeight, containing logs[index]
// - only rows in [firstVisible - overscan, lastVisible + overscan] exist in the DOM
export function LogViewer(props: LogViewerProps) {
  void props;
  // TODO: implement windowing from scratch — no libraries.
  return null;
}
