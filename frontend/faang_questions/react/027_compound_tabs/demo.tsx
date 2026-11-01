import { Tabs, TabList, Tab, TabPanel } from './compound_tabs';

/**
 * Demo harness for the compound Tabs — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is compound_tabs.test.tsx.
 */
export default function Demo() {
  return (
    <div className="demo">
      <h2>Compound Tabs</h2>
      <p className="demo-note">
        Implement <code>Tabs</code>/<code>TabList</code>/<code>Tab</code>/
        <code>TabPanel</code> in <code>compound_tabs.tsx</code> — context-based
        compound components with the WAI-ARIA tabs pattern. Click a tab or
        focus the list and use ArrowLeft/ArrowRight (wrapping, automatic
        activation).
      </p>
      <div className="demo-stage">
        <Tabs defaultValue="overview">
          <TabList label="Partner sections">
            <Tab value="overview">Overview</Tab>
            <Tab value="deliveries">Deliveries</Tab>
            <Tab value="settings">Settings</Tab>
          </TabList>
          <TabPanel value="overview">
            <p>Acme Studios — 14 active titles, 2 pending QC reviews.</p>
          </TabPanel>
          <TabPanel value="deliveries">
            <p>Last delivery: Stranger Assets S5 · drop 12 (delivered).</p>
          </TabPanel>
          <TabPanel value="settings">
            <p>Webhook: /hooks/deliveries · auto-QC enabled · 4K uploads on.</p>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
