import { useState } from 'react';
import { Modal } from './modal_portal';

/**
 * Demo harness for Modal — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is modal_portal.test.tsx.
 */
export default function Demo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="demo">
      <h2>Modal Portal</h2>
      <p className="demo-note">
        Implement <code>Modal</code> in <code>modal_portal.tsx</code> — a
        controlled dialog portalled into <code>document.body</code>. Open it,
        then close via Escape or a backdrop click; focus should return to the
        trigger button and body scroll should be restored.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setOpen(true)}>Edit partner settings</button>
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Partner settings"
        >
          <p>Acme Studios · integration pk-104</p>
          <label>
            Webhook URL <input defaultValue="https://acme.example/hooks" />
          </label>
          <div className="demo-controls">
            <button onClick={() => setOpen(false)}>Save</button>
            <button onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
