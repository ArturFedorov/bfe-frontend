import { useState } from 'react';
import { Accordion, AccordionItem } from './accordion_group';

/**
 * Demo harness for Accordion/AccordionItem — auto-discovered by the
 * playground (playground/App.tsx). This file is not part of the task: the
 * spec lives in README.md and the grader is accordion_group.test.tsx.
 */
export default function Demo() {
  const [expanded, setExpanded] = useState<string[]>([]);

  return (
    <div className="demo">
      <h2>Accordion Group</h2>
      <p className="demo-note">
        Implement <code>Accordion</code>/<code>AccordionItem</code> in{' '}
        <code>accordion_group.tsx</code> — single vs multiple mode, controlled
        and uncontrolled. The first accordion is uncontrolled single mode; the
        second runs multiple mode with the demo tracking{' '}
        <code>onExpandedChange</code>.
      </p>
      <div className="demo-stage">
        <h3>Single mode (uncontrolled, Credentials open by default)</h3>
        <Accordion mode="single" defaultExpanded={['credentials']}>
          <AccordionItem id="credentials" title="Credentials">
            <p>API key rotated 3d ago. OAuth scopes: deliveries:write.</p>
          </AccordionItem>
          <AccordionItem id="webhooks" title="Webhooks">
            <p>2 endpoints failing — last 500 at 14:02 UTC.</p>
          </AccordionItem>
          <AccordionItem id="history" title="Delivery history">
            <p>38 deliveries this month, 1 rejected manifest.</p>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="demo-stage">
        <h3>Multiple mode (audit view)</h3>
        <Accordion mode="multiple" onExpandedChange={setExpanded}>
          <AccordionItem id="credentials" title="Credentials">
            <p>API key rotated 3d ago. OAuth scopes: deliveries:write.</p>
          </AccordionItem>
          <AccordionItem id="webhooks" title="Webhooks">
            <p>2 endpoints failing — last 500 at 14:02 UTC.</p>
          </AccordionItem>
          <AccordionItem id="history" title="Delivery history">
            <p>38 deliveries this month, 1 rejected manifest.</p>
          </AccordionItem>
        </Accordion>
        <p className="demo-note">
          Open sections: {expanded.length ? expanded.join(', ') : '(none)'}
        </p>
      </div>
    </div>
  );
}
