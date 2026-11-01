import { useRef, useState } from 'react';
import { OptimisticToggle } from './optimistic_toggle';

/**
 * Demo harness for OptimisticToggle — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is optimistic_toggle.test.tsx.
 */

export default function Demo() {
  const [failNext, setFailNext] = useState(false);
  const failNextRef = useRef(false);

  // Mock flag API: ~700ms latency; rejects when "Fail next save" is checked,
  // so the rollback + alert path is demonstrable on demand.
  const updateFlag = (_enabled: boolean): Promise<void> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (failNextRef.current) {
          reject(new Error('409: concurrent write rejected'));
        } else {
          resolve();
        }
      }, 700);
    });

  const onFailNextChange = (checked: boolean) => {
    setFailNext(checked);
    failNextRef.current = checked;
  };

  return (
    <div className="demo">
      <h2>Optimistic Toggle</h2>
      <p className="demo-note">
        Implement <code>OptimisticToggle</code> in{' '}
        <code>optimistic_toggle.tsx</code> — flip instantly, save in the
        background (~700ms), roll back with an announced error on failure.
        Check "Fail next save" to force the mock API to reject and watch the
        switch roll back.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            <input
              type="checkbox"
              checked={failNext}
              onChange={(e) => onFailNextChange(e.target.checked)}
            />{' '}
            Fail next save
          </label>
        </div>
        <div className="demo-controls">
          <OptimisticToggle
            label="Enable auto-QC"
            initialEnabled={false}
            updateFlag={updateFlag}
          />
          <OptimisticToggle
            label="Allow 4K uploads"
            initialEnabled={true}
            updateFlag={updateFlag}
          />
        </div>
      </div>
    </div>
  );
}
