/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ChannelTabs } from './channel_tabs';
import { channelWidth, cx } from './tokens';

function Tabs({
  value,
  defaultValue,
  onChange,
  withInAppPanel = true,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  withInAppPanel?: boolean;
}) {
  return (
    <ChannelTabs label="Channel preview" value={value} defaultValue={defaultValue} onChange={onChange}>
      <ChannelTabs.List>
        <ChannelTabs.Tab value="email">Email</ChannelTabs.Tab>
        <ChannelTabs.Tab value="push">Push</ChannelTabs.Tab>
        <ChannelTabs.Tab value="in-app">In-app</ChannelTabs.Tab>
      </ChannelTabs.List>
      <ChannelTabs.Panel value="email" channel="email">
        <p>Email body</p>
      </ChannelTabs.Panel>
      <ChannelTabs.Panel value="push" channel="push">
        <p>Push body</p>
      </ChannelTabs.Panel>
      {withInAppPanel && (
        <ChannelTabs.Panel value="in-app" channel="in-app">
          <p>In-app body</p>
        </ChannelTabs.Panel>
      )}
    </ChannelTabs>
  );
}

function ControlledHarness({ spy }: { spy: (v: string) => void }) {
  const [value, setValue] = useState('email');
  return (
    <Tabs
      value={value}
      onChange={(v) => {
        spy(v);
        setValue(v);
      }}
    />
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });
const visiblePanel = () => screen.getByRole('tabpanel');
const allPanels = () => screen.getAllByRole('tabpanel', { hidden: true });
const panelFor = (name: string) =>
  allPanels().find((p) => p.getAttribute('aria-labelledby') === tab(name).id) as HTMLElement;
const frameIn = (panel: HTMLElement) => panel.querySelector('[data-channel]') as HTMLElement;

describe('tokens: cx', () => {
  it('joins truthy strings and skips false / null / undefined', () => {
    expect(cx('a', false, 'b', null, undefined, 'c')).toBe('a b c');
  });

  it('includes object keys whose value is true', () => {
    expect(cx('tab', { 'tab--active': true, 'tab--disabled': false })).toBe('tab tab--active');
  });

  it('dedupes exact duplicates keeping the first position', () => {
    expect(cx('a', 'b', 'a', { b: true, c: true })).toBe('a b c');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cx()).toBe('');
    expect(cx(false, null, undefined, { x: false })).toBe('');
  });
});

describe('1. roles and wiring', () => {
  it('renders a labelled tablist with one tab per Tab and aria-selected on the active one', () => {
    render(<Tabs />);
    expect(screen.getByRole('tablist', { name: 'Channel preview' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(tab('Email')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Push')).toHaveAttribute('aria-selected', 'false');
    expect(tab('In-app')).toHaveAttribute('aria-selected', 'false');
  });

  it('wires aria-controls / id / aria-labelledby between each tab and its panel', () => {
    render(<Tabs />);
    for (const name of ['Email', 'Push', 'In-app']) {
      const t = tab(name);
      expect(t.id).not.toBe('');
      const panel = panelFor(name);
      expect(panel).toBeDefined();
      expect(panel.id).not.toBe('');
      expect(t).toHaveAttribute('aria-controls', panel.id);
      expect(panel).toHaveAttribute('aria-labelledby', t.id);
    }
    const ids = new Set(allPanels().map((p) => p.id));
    expect(ids.size).toBe(3);
  });
});

describe('2. roving tabindex', () => {
  it('makes only the active tab tabbable', async () => {
    const user = userEvent.setup();
    render(<Tabs />);
    expect(tab('Email')).toHaveAttribute('tabindex', '0');
    expect(tab('Push')).toHaveAttribute('tabindex', '-1');
    expect(tab('In-app')).toHaveAttribute('tabindex', '-1');

    await user.click(tab('Push'));
    expect(tab('Email')).toHaveAttribute('tabindex', '-1');
    expect(tab('Push')).toHaveAttribute('tabindex', '0');
  });
});

describe('3. keyboard with automatic activation', () => {
  it('ArrowRight / ArrowLeft move focus and activate the neighbouring tab', async () => {
    const user = userEvent.setup();
    render(<Tabs />);
    await user.click(tab('Email'));

    await user.keyboard('{ArrowRight}');
    expect(tab('Push')).toHaveFocus();
    expect(tab('Push')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Push body');

    await user.keyboard('{ArrowLeft}');
    expect(tab('Email')).toHaveFocus();
    expect(tab('Email')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Email body');
  });

  it('Home / End jump to the first / last tab', async () => {
    const user = userEvent.setup();
    render(<Tabs defaultValue="push" />);
    await user.click(tab('Push'));

    await user.keyboard('{End}');
    expect(tab('In-app')).toHaveFocus();
    expect(tab('In-app')).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(tab('Email')).toHaveFocus();
    expect(tab('Email')).toHaveAttribute('aria-selected', 'true');
  });

  it('senior: ArrowRight from the last tab wraps to the first, ArrowLeft from the first wraps to the last', async () => {
    const user = userEvent.setup();
    render(<Tabs defaultValue="in-app" />);
    await user.click(tab('In-app'));

    await user.keyboard('{ArrowRight}');
    expect(tab('Email')).toHaveFocus();
    expect(tab('Email')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Email body');

    await user.keyboard('{ArrowLeft}');
    expect(tab('In-app')).toHaveFocus();
    expect(tab('In-app')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('In-app body');
  });
});

describe('4. panels', () => {
  it('hides inactive panels with the hidden attribute and shows the active one', async () => {
    const user = userEvent.setup();
    render(<Tabs />);
    expect(panelFor('Email')).not.toHaveAttribute('hidden');
    expect(panelFor('Push')).toHaveAttribute('hidden');
    expect(panelFor('In-app')).toHaveAttribute('hidden');
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);

    await user.click(tab('In-app'));
    expect(panelFor('In-app')).not.toHaveAttribute('hidden');
    expect(panelFor('Email')).toHaveAttribute('hidden');
    expect(within(visiblePanel()).getByText('In-app body')).toBeVisible();
  });

  it('renders a preview frame with data-channel and the token width', () => {
    render(<Tabs />);
    const email = frameIn(panelFor('Email'));
    expect(email).toHaveAttribute('data-channel', 'email');
    expect(email).toHaveStyle({ width: `${channelWidth.email}px` });
    expect(email).toHaveStyle({ width: '600px' });

    const push = frameIn(panelFor('Push'));
    expect(push).toHaveAttribute('data-channel', 'push');
    expect(push).toHaveStyle({ width: '360px' });

    const inApp = frameIn(panelFor('In-app'));
    expect(inApp).toHaveAttribute('data-channel', 'in-app');
    expect(inApp).toHaveStyle({ width: '320px' });
  });

  it('a Tab without a matching Panel shows no tabpanel when selected', async () => {
    const user = userEvent.setup();
    render(<Tabs withInAppPanel={false} />);
    expect(allPanels()).toHaveLength(2);
    await user.click(tab('In-app'));
    expect(tab('In-app')).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.queryByText('In-app body')).not.toBeInTheDocument();
  });
});

describe('5. uncontrolled mode', () => {
  it('starts on defaultValue', () => {
    render(<Tabs defaultValue="push" />);
    expect(tab('Push')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Push body');
  });

  it('falls back to the first tab without value or defaultValue', () => {
    render(<Tabs />);
    expect(tab('Email')).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking a tab switches internally and reports onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Tabs onChange={onChange} />);
    await user.click(tab('Push'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('push');
    expect(tab('Push')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('Push body');
  });
});

describe('6. controlled mode', () => {
  it('senior: ignores clicks and keys until the parent updates value', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Tabs value="email" onChange={onChange} />);

    await user.click(tab('Push'));
    expect(onChange).toHaveBeenCalledWith('push');
    expect(tab('Email')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Push')).toHaveAttribute('aria-selected', 'false');
    expect(panelFor('Push')).toHaveAttribute('hidden');
    expect(visiblePanel()).toHaveTextContent('Email body');

    tab('Email').focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('push');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(tab('Email')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Email')).toHaveAttribute('tabindex', '0');
  });

  it('follows the parent when onChange updates value', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<ControlledHarness spy={spy} />);
    await user.click(tab('In-app'));
    expect(spy).toHaveBeenCalledWith('in-app');
    expect(tab('In-app')).toHaveAttribute('aria-selected', 'true');
    expect(visiblePanel()).toHaveTextContent('In-app body');
    expect(panelFor('Email')).toHaveAttribute('hidden');
  });
});
