/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionProps } from './accordion_group';

function renderAccordion(props: Partial<AccordionProps> = {}) {
  return render(
    <Accordion {...props}>
      <AccordionItem id="credentials" title="Credentials">
        <p>API key rotated 3d ago.</p>
      </AccordionItem>
      <AccordionItem id="webhooks" title="Webhooks">
        <p>2 endpoints failing.</p>
      </AccordionItem>
      <AccordionItem id="history" title="Delivery history">
        <p>14 deliveries this week.</p>
      </AccordionItem>
    </Accordion>,
  );
}

describe('028 Accordion group', () => {
  it('renders header buttons with aria-expanded and labelled region panels', async () => {
    const user = userEvent.setup();
    renderAccordion();
    const header = screen.getByRole('button', { name: 'Credentials' });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('API key rotated 3d ago.')).not.toBeInTheDocument();

    await user.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('region', { name: 'Credentials' });
    expect(panel).toHaveTextContent('API key rotated 3d ago.');
    expect(header).toHaveAttribute('aria-controls', panel.id);
  });

  it('single mode: opening one item collapses the others, and reclicking closes it', async () => {
    const user = userEvent.setup();
    renderAccordion({ mode: 'single', defaultExpanded: ['credentials'] });
    expect(screen.getByText('API key rotated 3d ago.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Webhooks' }));
    expect(screen.getByText('2 endpoints failing.')).toBeInTheDocument();
    expect(screen.queryByText('API key rotated 3d ago.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Webhooks' }));
    expect(screen.queryByText('2 endpoints failing.')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('multiple mode: items expand and collapse independently', async () => {
    const user = userEvent.setup();
    renderAccordion({ mode: 'multiple' });
    await user.click(screen.getByRole('button', { name: 'Credentials' }));
    await user.click(screen.getByRole('button', { name: 'Webhooks' }));
    expect(screen.getByText('API key rotated 3d ago.')).toBeInTheDocument();
    expect(screen.getByText('2 endpoints failing.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Credentials' }));
    expect(screen.queryByText('API key rotated 3d ago.')).not.toBeInTheDocument();
    expect(screen.getByText('2 endpoints failing.')).toBeInTheDocument();
  });

  it('uncontrolled: seeds from defaultExpanded and reports changes via onExpandedChange', async () => {
    const user = userEvent.setup();
    const onExpandedChange = jest.fn();
    renderAccordion({
      mode: 'multiple',
      defaultExpanded: ['history'],
      onExpandedChange,
    });
    expect(screen.getByText('14 deliveries this week.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Credentials' }));
    expect(onExpandedChange).toHaveBeenCalledWith(['history', 'credentials']);
    expect(screen.getByText('API key rotated 3d ago.')).toBeInTheDocument();
  });

  it('controlled: display follows the expanded prop, toggles only call onExpandedChange', async () => {
    const user = userEvent.setup();
    const onExpandedChange = jest.fn();
    renderAccordion({ expanded: ['webhooks'], onExpandedChange });
    expect(screen.getByText('2 endpoints failing.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Credentials' }));
    expect(onExpandedChange).toHaveBeenCalledWith(['credentials']);
    // parent did not update the prop, so the display must not change
    expect(screen.queryByText('API key rotated 3d ago.')).not.toBeInTheDocument();
    expect(screen.getByText('2 endpoints failing.')).toBeInTheDocument();
  });

  it('controlled: works end-to-end with a stateful parent', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [expanded, setExpanded] = useState<string[]>([]);
      return (
        <Accordion mode="single" expanded={expanded} onExpandedChange={setExpanded}>
          <AccordionItem id="credentials" title="Credentials">
            <p>API key rotated 3d ago.</p>
          </AccordionItem>
          <AccordionItem id="webhooks" title="Webhooks">
            <p>2 endpoints failing.</p>
          </AccordionItem>
        </Accordion>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Credentials' }));
    expect(screen.getByText('API key rotated 3d ago.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Webhooks' }));
    expect(screen.getByText('2 endpoints failing.')).toBeInTheDocument();
    expect(screen.queryByText('API key rotated 3d ago.')).not.toBeInTheDocument();
  });

  it('throws a helpful error when AccordionItem is used outside <Accordion>', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <AccordionItem id="x" title="X">
          content
        </AccordionItem>,
      ),
    ).toThrow(/AccordionItem must be used within <Accordion>/);
    errorSpy.mockRestore();
  });
});
