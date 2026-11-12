/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState, type ComponentType } from 'react';
import { deferred, flush, type Deferred } from '../_helpers/deferred';
import {
  Shell,
  createEventBus,
  type EventBus,
  type RemoteManifest,
  type RemoteModule,
  type RemoteProps,
} from './mfe_shell';

// ---- fake remotes (plain components; `load` is a deferred promise) ----------

const audienceHandler = jest.fn();

const CampaignsRemote: ComponentType<RemoteProps> = ({ bus, user, theme }) => (
  <section>
    <h2>Campaigns</h2>
    <p>
      {user.name} · {theme}
    </p>
    <button type="button" onClick={() => bus.emit('campaign:selected', 'c-42')}>
      Select campaign
    </button>
  </section>
);

const AudiencesRemote: ComponentType<RemoteProps> = ({ bus }) => {
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(
    () =>
      bus.on<string>('campaign:selected', (id) => {
        audienceHandler(id);
        setSelected(id);
      }),
    [bus],
  );
  return (
    <section>
      <h2>Audiences</h2>
      <p>Campaign: {selected ?? 'none'}</p>
    </section>
  );
};

const TemplatesRemote: ComponentType<RemoteProps> = () => <h2>Templates</h2>;

interface FakeRemote {
  manifest: RemoteManifest;
  d: Deferred<RemoteModule>;
  load: jest.Mock<Promise<RemoteModule>, []>;
}

function fakeRemote(id: string, name: string): FakeRemote {
  const d = deferred<RemoteModule>();
  const load = jest.fn<Promise<RemoteModule>, []>(() => d.promise);
  return { manifest: { id, name, route: `/${id}`, load }, d, load };
}

function setup(initialRoute?: string, bus?: EventBus) {
  const campaigns = fakeRemote('campaigns', 'Campaigns');
  const audiences = fakeRemote('audiences', 'Audiences');
  const templates = fakeRemote('templates', 'Templates');
  const remotes = [campaigns.manifest, audiences.manifest, templates.manifest];
  const user = userEvent.setup();
  const utils = render(
    <Shell remotes={remotes} user={{ id: 'u1', name: 'Jordan' }} theme="dark" initialRoute={initialRoute} bus={bus} />,
  );
  return { campaigns, audiences, templates, remotes, user, ...utils };
}

async function resolve(remote: FakeRemote, Component: ComponentType<RemoteProps>) {
  await act(async () => {
    remote.d.resolve({ default: Component });
    await flush();
  });
}

async function reject(remote: FakeRemote, message: string) {
  await act(async () => {
    remote.d.reject(new Error(message));
    await flush();
  });
}

const navButton = (name: string) =>
  within(screen.getByRole('navigation', { name: 'Micro-frontends' })).getByRole('button', { name });

beforeEach(() => {
  audienceHandler.mockClear();
});

describe('createEventBus', () => {
  it('delivers emitted payloads to handlers registered for that type', () => {
    const bus = createEventBus();
    const handler = jest.fn();
    bus.on<string>('campaign:selected', handler);
    bus.emit('campaign:selected', 'c-1');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('c-1');
  });

  it('does not deliver to other types and tolerates emits with no handlers', () => {
    const bus = createEventBus();
    const handler = jest.fn();
    bus.on('audience:selected', handler);
    expect(() => bus.emit('campaign:selected', 'c-1')).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it('fires every handler for a type and stops after unsubscribe; unsubscribing twice is safe', () => {
    const bus = createEventBus();
    const a = jest.fn();
    const b = jest.fn();
    const offA = bus.on('campaign:selected', a);
    bus.on('campaign:selected', b);
    bus.emit('campaign:selected', 1);
    expect(a).toHaveBeenCalledWith(1);
    expect(b).toHaveBeenCalledWith(1);

    offA();
    offA();
    bus.emit('campaign:selected', 2);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenLastCalledWith(2);
  });
});

describe('1. navigation', () => {
  it('renders a navigation landmark with a button per remote and marks the active one', () => {
    setup();
    const nav = screen.getByRole('navigation', { name: 'Micro-frontends' });
    expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Campaigns',
      'Audiences',
      'Templates',
    ]);
    expect(navButton('Campaigns')).toHaveAttribute('aria-current', 'page');
    expect(navButton('Audiences')).not.toHaveAttribute('aria-current');
  });

  it('starts on initialRoute when given', () => {
    const { audiences, campaigns } = setup('/audiences');
    expect(navButton('Audiences')).toHaveAttribute('aria-current', 'page');
    expect(audiences.load).toHaveBeenCalledTimes(1);
    expect(campaigns.load).not.toHaveBeenCalled();
  });
});

describe('2. lazy loading with Suspense', () => {
  it('loads only the active remote and shows the status fallback until it resolves', async () => {
    const { campaigns, audiences, templates } = setup();
    expect(campaigns.load).toHaveBeenCalledTimes(1);
    expect(audiences.load).not.toHaveBeenCalled();
    expect(templates.load).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Loading Campaigns…');

    await resolve(campaigns, CampaignsRemote);
    expect(screen.getByRole('heading', { name: 'Campaigns' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('passes user and theme to the remote', async () => {
    const { campaigns } = setup();
    await resolve(campaigns, CampaignsRemote);
    expect(screen.getByText('Jordan · dark')).toBeInTheDocument();
  });
});

describe('3. single-flight cache per remote', () => {
  it('does not call load again on re-render or when clicking the active button while pending', async () => {
    const { campaigns, remotes, user, rerender } = setup();
    expect(campaigns.load).toHaveBeenCalledTimes(1);

    rerender(<Shell remotes={remotes} user={{ id: 'u1', name: 'Jordan' }} theme="dark" />);
    await user.click(navButton('Campaigns'));
    expect(campaigns.load).toHaveBeenCalledTimes(1);

    await resolve(campaigns, CampaignsRemote);
    await user.click(navButton('Campaigns'));
    expect(campaigns.load).toHaveBeenCalledTimes(1);
  });

  it('navigating away and back reuses the cached module', async () => {
    const { campaigns, audiences, user } = setup();
    await resolve(campaigns, CampaignsRemote);

    await user.click(navButton('Audiences'));
    expect(screen.getByRole('status')).toHaveTextContent('Loading Audiences…');
    expect(audiences.load).toHaveBeenCalledTimes(1);
    await resolve(audiences, AudiencesRemote);
    expect(screen.getByRole('heading', { name: 'Audiences' })).toBeInTheDocument();

    await user.click(navButton('Campaigns'));
    expect(screen.getByRole('heading', { name: 'Campaigns' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(campaigns.load).toHaveBeenCalledTimes(1);
    expect(audiences.load).toHaveBeenCalledTimes(1);

    await user.click(navButton('Audiences'));
    expect(screen.getByRole('heading', { name: 'Audiences' })).toBeInTheDocument();
    expect(audiences.load).toHaveBeenCalledTimes(1);
  });
});

describe('4. error isolation and Retry', () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('shows a per-remote alert with a Retry button and keeps the nav working', async () => {
    const { campaigns, audiences, user } = setup();
    await reject(campaigns, 'ChunkLoadError');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Campaigns failed to load');
    expect(within(alert).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.click(navButton('Audiences'));
    expect(audiences.load).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading Audiences…');
  });

  it('Retry re-invokes load and renders the remote once it resolves', async () => {
    const { campaigns, user } = setup();
    await reject(campaigns, 'ChunkLoadError');
    expect(campaigns.load).toHaveBeenCalledTimes(1);

    const second = deferred<RemoteModule>();
    campaigns.load.mockImplementationOnce(() => second.promise);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(campaigns.load).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading Campaigns…');

    await act(async () => {
      second.resolve({ default: CampaignsRemote });
      await flush();
    });
    expect(screen.getByRole('heading', { name: 'Campaigns' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(campaigns.load).toHaveBeenCalledTimes(2);
  });
});

describe('5. shared event bus', () => {
  it('an emit from a remote reaches a host subscription on the shared bus', async () => {
    const bus = createEventBus();
    const hostHandler = jest.fn();
    bus.on<string>('campaign:selected', hostHandler);
    const { campaigns, user } = setup(undefined, bus);
    await resolve(campaigns, CampaignsRemote);

    await user.click(screen.getByRole('button', { name: 'Select campaign' }));
    expect(hostHandler).toHaveBeenCalledTimes(1);
    expect(hostHandler).toHaveBeenCalledWith('c-42');
  });

  it('a mounted remote receives events emitted on the bus', async () => {
    const bus = createEventBus();
    const { audiences } = setup('/audiences', bus);
    await resolve(audiences, AudiencesRemote);
    expect(screen.getByText('Campaign: none')).toBeInTheDocument();

    act(() => bus.emit('campaign:selected', 'c-7'));
    expect(audienceHandler).toHaveBeenCalledWith('c-7');
    expect(screen.getByText('Campaign: c-7')).toBeInTheDocument();
  });

  it('senior: subscriptions are removed when the remote unmounts', async () => {
    const bus = createEventBus();
    const { audiences, campaigns, user } = setup('/audiences', bus);
    await resolve(audiences, AudiencesRemote);

    await user.click(navButton('Campaigns'));
    await resolve(campaigns, CampaignsRemote);
    expect(screen.queryByRole('heading', { name: 'Audiences' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select campaign' }));
    act(() => bus.emit('campaign:selected', 'c-99'));
    expect(audienceHandler).not.toHaveBeenCalled();
  });
});

describe('6. late resolution after unmount', () => {
  it('senior: resolving or rejecting a load after the shell unmounted throws nothing and logs no error', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const first = setup();
      expect(first.campaigns.load).toHaveBeenCalledTimes(1);
      first.unmount();
      await act(async () => {
        first.campaigns.d.resolve({ default: CampaignsRemote });
        await flush();
      });

      const second = setup('/templates');
      second.unmount();
      await act(async () => {
        second.templates.d.reject(new Error('late ChunkLoadError'));
        await flush();
      });

      expect(consoleError).not.toHaveBeenCalled();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
