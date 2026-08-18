import { useState } from 'react';
import { MetricDelta } from './metric_delta';

/**
 * Demo harness for MetricDelta / usePrevious — auto-discovered by the
 * playground. The buttons simulate the polling layer pushing new props;
 * "Re-render (same value)" forces a render without changing the metric,
 * which must show a delta of 0.
 */
export default function Demo() {
  const [delivered, setDelivered] = useState(128);
  const [errors, setErrors] = useState(3);
  const [, forceRender] = useState(0);

  const pushUpdate = () => {
    setDelivered((v) => Math.max(0, v + Math.round(Math.random() * 14 - 5)));
    setErrors((v) => Math.max(0, v + Math.round(Math.random() * 4 - 2)));
  };

  return (
    <div className="demo">
      <h2>Metric Delta</h2>
      <p className="demo-note">
        Implement <code>usePrevious</code> and <code>MetricDelta</code> in{' '}
        <code>metric_delta.tsx</code> — remember the previous render's value in
        a ref and show <code>+N</code>/<code>-N</code>/<code>0</code> (first
        render shows <code>—</code>).
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={pushUpdate}>Push polling update</button>
          <button onClick={() => setDelivered((v) => v + 3)}>Delivered +3</button>
          <button onClick={() => setDelivered((v) => Math.max(0, v - 2))}>Delivered -2</button>
          <button onClick={() => forceRender((n) => n + 1)}>Re-render (same value)</button>
        </div>
        <div className="demo-controls">
          <MetricDelta label="Assets delivered" value={delivered} />
          <MetricDelta label="Delivery errors" value={errors} />
        </div>
      </div>
    </div>
  );
}
