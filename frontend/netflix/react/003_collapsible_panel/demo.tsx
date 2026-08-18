import { CollapsiblePanel } from './collapsible_panel';

/**
 * Demo harness for CollapsiblePanel — auto-discovered by the playground.
 * Type into the QC notes textarea, collapse, reopen: mode="hidden" keeps the
 * draft, mode="unmount" wipes it.
 */
export default function Demo() {
  return (
    <div className="demo">
      <h2>Collapsible Panel</h2>
      <p className="demo-note">
        Implement <code>CollapsiblePanel</code> in{' '}
        <code>collapsible_panel.tsx</code> — collapse either unmounts children
        (state destroyed) or hides them with the <code>hidden</code> attribute
        (state survives). Draft a note, collapse, reopen — compare the modes.
      </p>
      <div className="demo-stage">
        <CollapsiblePanel title="Encoding profile">
          <p>Codec: H.265 | Bitrate ladder: netflix-4k-hdr | Audio: Atmos 5.1</p>
        </CollapsiblePanel>
        <CollapsiblePanel title="QC notes (mode=hidden — draft survives collapse)" mode="hidden" defaultOpen>
          <textarea aria-label="Notes" rows={3} placeholder="Draft a QC note, then collapse and reopen…" />
        </CollapsiblePanel>
        <CollapsiblePanel title="Delivery history (mode=unmount — draft is wiped)">
          <textarea aria-label="History filter" rows={2} placeholder="Type here, collapse, reopen — gone." />
        </CollapsiblePanel>
      </div>
    </div>
  );
}
