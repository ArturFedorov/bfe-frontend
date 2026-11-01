import { PageCard } from './layout_slots';

/**
 * Demo harness for PageCard — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is layout_slots.test.tsx.
 */
export default function Demo() {
  return (
    <div className="demo">
      <h2>Layout Slots</h2>
      <p className="demo-note">
        Implement <code>PageCard</code> in <code>layout_slots.tsx</code> — a
        labelled <code>section</code> with title, actions toolbar, content,
        and footer slots. Every slot is optional; the second card below passes
        only children.
      </p>
      <div className="demo-stage">
        <PageCard
          title="Delivery summary"
          actions={
            <>
              <button>Retry sync</button>
              <button>Download manifest</button>
            </>
          }
          footer={<span>Last synced 2m ago · partner Acme Studios</span>}
        >
          <p>All 14 assets delivered. 0 validation warnings.</p>
        </PageCard>
      </div>
      <div className="demo-stage">
        <PageCard>
          <p>Bare card: no title, actions, or footer — just content.</p>
        </PageCard>
      </div>
    </div>
  );
}
