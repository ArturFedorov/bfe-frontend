/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { PageCard } from './layout_slots';

describe('025 PageCard layout slots', () => {
  it('renders a region named by the title with the title as a heading', () => {
    render(<PageCard title="Delivery summary">content</PageCard>);
    const card = screen.getByRole('region', { name: 'Delivery summary' });
    expect(
      within(card).getByRole('heading', { name: 'Delivery summary' }),
    ).toBeInTheDocument();
  });

  it('renders actions inside the "Card actions" toolbar', () => {
    render(
      <PageCard title="Delivery summary" actions={<button>Retry sync</button>}>
        content
      </PageCard>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Card actions' });
    expect(
      within(toolbar).getByRole('button', { name: 'Retry sync' }),
    ).toBeInTheDocument();
  });

  it('renders footer content inside the "Card footer" group after the main content', () => {
    render(
      <PageCard title="Delivery summary" footer={<span>Last synced 2m ago</span>}>
        <p>All assets delivered.</p>
      </PageCard>,
    );
    const footer = screen.getByRole('group', { name: 'Card footer' });
    expect(within(footer).getByText('Last synced 2m ago')).toBeInTheDocument();
    const content = screen.getByText('All assets delivered.');
    expect(
      content.compareDocumentPosition(footer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('always renders children in the main content area', () => {
    render(
      <PageCard title="Delivery summary">
        <p>All 14 assets delivered.</p>
      </PageCard>,
    );
    const card = screen.getByRole('region', { name: 'Delivery summary' });
    expect(
      within(card).getByText('All 14 assets delivered.'),
    ).toBeInTheDocument();
  });

  it('omits toolbar and footer from the DOM when those slots are not passed', () => {
    render(<PageCard title="Delivery summary">content</PageCard>);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: '' })).toBeNull();
  });

  it('falls back to the accessible name "Card" when no title is given', () => {
    render(<PageCard>just content</PageCard>);
    const card = screen.getByRole('region', { name: 'Card' });
    expect(within(card).getByText('just content')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
