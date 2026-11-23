import { useMemo, useState } from 'react';
import { DownloadButton } from './download_button';
import { createMockExportSource } from './mock_export_source';

/**
 * Demo harness for DownloadButton — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the graders are the two *.test.ts(x) files.
 */

const CSV = 'partner,views\nacme,1200\nglobex,860\n';
const CSV_URL = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV)}`;

export default function Demo() {
  const [waitingCount, setWaitingCount] = useState(3);
  const [fail, setFail] = useState(false);
  const [runKey, setRunKey] = useState(0);

  // A new mock per settings change, so job numbering and counts start fresh.
  const api = useMemo(
    () =>
      createMockExportSource({
        waitingCount,
        url: CSV_URL,
        fileName: 'partner-report.csv',
        failWith: fail ? 'disk full' : undefined,
        delayMs: 300,
      }),
    [waitingCount, fail, runKey],
  );

  return (
    <div className="demo">
      <h2>Download Export Button</h2>
      <p className="demo-note">
        Implement <code>createMockExportSource</code> in{' '}
        <code>mock_export_source.ts</code> and <code>DownloadButton</code> in{' '}
        <code>download_button.tsx</code>. The mock answers <em>waiting</em>{' '}
        {waitingCount} times (300 ms latency each), then succeeds with a small
        CSV — the browser should download <code>partner-report.csv</code>.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            Waiting answers{' '}
            <input
              type="number"
              min={0}
              value={waitingCount}
              onChange={(e) => setWaitingCount(Number(e.target.value))}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={fail}
              onChange={(e) => setFail(e.target.checked)}
            />{' '}
            Fail instead of succeed
          </label>
          <button onClick={() => setRunKey((k) => k + 1)}>Reset</button>
        </div>
        <DownloadButton
          key={runKey}
          api={api}
          label="Download report"
          intervalMs={1000}
          maxPolls={10}
        />
      </div>
    </div>
  );
}
