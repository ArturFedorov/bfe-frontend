/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tab, TabList, TabPanel, Tabs } from './compound_tabs';

function renderTabs() {
  return render(
    <Tabs defaultValue="overview">
      <TabList label="Partner sections">
        <Tab value="overview">Overview</Tab>
        <Tab value="deliveries">Deliveries</Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <TabPanel value="overview">Overview content</TabPanel>
      <TabPanel value="deliveries">Deliveries content</TabPanel>
      <TabPanel value="settings">Settings content</TabPanel>
    </Tabs>,
  );
}

describe('027 compound Tabs', () => {
  it('renders tablist/tab/tabpanel roles with correct labelling', () => {
    renderTabs();
    const tablist = screen.getByRole('tablist', { name: 'Partner sections' });
    expect(tablist).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);

    const activeTab = screen.getByRole('tab', { name: 'Overview' });
    const panel = screen.getByRole('tabpanel', { name: 'Overview' });
    expect(activeTab).toHaveAttribute('aria-controls', panel.id);
  });

  it('marks only the active tab as selected and shows only its panel', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Deliveries' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    expect(screen.queryByText('Deliveries content')).not.toBeInTheDocument();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('selects a tab on click and swaps the visible panel', async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.click(screen.getByRole('tab', { name: 'Deliveries' }));
    expect(screen.getByRole('tab', { name: 'Deliveries' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Deliveries content')).toBeInTheDocument();
    expect(screen.queryByText('Overview content')).not.toBeInTheDocument();
  });

  it('uses a roving tabindex so only the active tab is in the Tab order', async () => {
    const user = userEvent.setup();
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('tab', { name: 'Deliveries' })).toHaveAttribute(
      'tabindex',
      '-1',
    );

    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('moves focus and selection with ArrowRight/ArrowLeft, wrapping at the ends', async () => {
    const user = userEvent.setup();
    renderTabs();
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();

    await user.keyboard('{ArrowRight}');
    const deliveries = screen.getByRole('tab', { name: 'Deliveries' });
    expect(deliveries).toHaveFocus();
    expect(deliveries).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Deliveries content')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    const settings = screen.getByRole('tab', { name: 'Settings' });
    expect(settings).toHaveFocus();
    expect(settings).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}');
    expect(overview).toHaveFocus();
    expect(overview).toHaveAttribute('aria-selected', 'true');
  });

  it('throws a helpful error when Tab or TabPanel is used outside <Tabs>', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Tab value="x">X</Tab>)).toThrow(
      /Tab must be used within <Tabs>/,
    );
    expect(() => render(<TabPanel value="x">X</TabPanel>)).toThrow(
      /TabPanel must be used within <Tabs>/,
    );
    errorSpy.mockRestore();
  });
});
