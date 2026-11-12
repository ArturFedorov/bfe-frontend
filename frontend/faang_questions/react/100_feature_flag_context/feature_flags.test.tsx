/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { memo, useState, type ReactNode } from 'react';
import {
  Feature,
  FlagsProvider,
  OVERRIDES_STORAGE_KEY,
  useFlag,
  useFlagOverride,
  useFlags,
  type Flags,
} from './feature_flags';

/** Minimal in-memory Storage (boundary fake for localStorage). */
function memoryStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, String(v));
    },
  };
}

type Probe = (id: string) => void;

function FlagReader({ name, onRender }: { name: string; onRender?: Probe }) {
  onRender?.(name);
  const on = useFlag(name);
  return (
    <p>
      {name}: {on ? 'on' : 'off'}
    </p>
  );
}

function OverridePanel() {
  const { set, overrides } = useFlagOverride();
  return (
    <div>
      <button type="button" onClick={() => set('b', true)}>
        Override b on
      </button>
      <button type="button" onClick={() => set('b', false)}>
        Override b off
      </button>
      <button type="button" onClick={() => set('b', null)}>
        Clear b
      </button>
      <p>overrides: {JSON.stringify(overrides)}</p>
    </div>
  );
}

function Harness({
  initial,
  storage,
  children,
}: {
  initial: Flags;
  storage?: Storage;
  children: ReactNode;
}) {
  const [flags, setFlags] = useState(initial);
  return (
    <FlagsProvider flags={flags} storage={storage}>
      <button type="button" onClick={() => setFlags((f) => ({ ...f, b: !f.b }))}>
        Flip b
      </button>
      <button type="button" onClick={() => setFlags((f) => ({ ...f, a: !f.a }))}>
        Flip a
      </button>
      {children}
    </FlagsProvider>
  );
}

const text = (name: string) => screen.getByText(new RegExp(`^${name}: `));
const count = (probe: jest.Mock, id: string) => probe.mock.calls.filter(([x]) => x === id).length;

describe('1. effective flags and useFlag', () => {
  it('returns provider values and false for unknown flags', () => {
    render(
      <FlagsProvider flags={{ a: true, b: false }}>
        <FlagReader name="a" />
        <FlagReader name="b" />
        <FlagReader name="missing" />
      </FlagsProvider>,
    );
    expect(text('a')).toHaveTextContent('a: on');
    expect(text('b')).toHaveTextContent('b: off');
    expect(text('missing')).toHaveTextContent('missing: off');
  });
});

describe('7. Feature', () => {
  it('renders children when on, fallback when off, nothing when off without fallback', () => {
    render(
      <FlagsProvider flags={{ on: true, off: false }}>
        <Feature flag="on" fallback={<p>old builder</p>}>
          <p>new builder</p>
        </Feature>
        <Feature flag="off" fallback={<p>old preview</p>}>
          <p>new preview</p>
        </Feature>
        <Feature flag="off">
          <p>hidden entirely</p>
        </Feature>
      </FlagsProvider>,
    );
    expect(screen.getByText('new builder')).toBeInTheDocument();
    expect(screen.queryByText('old builder')).not.toBeInTheDocument();
    expect(screen.getByText('old preview')).toBeInTheDocument();
    expect(screen.queryByText('new preview')).not.toBeInTheDocument();
    expect(screen.queryByText('hidden entirely')).not.toBeInTheDocument();
  });
});

describe('2. useFlags selector', () => {
  const shallow = (x: Record<string, boolean>, y: Record<string, boolean>) => {
    const kx = Object.keys(x);
    return kx.length === Object.keys(y).length && kx.every((k) => x[k] === y[k]);
  };

  function ChannelFlags({ onRender }: { onRender: Probe }) {
    onRender('channels');
    const channels = useFlags((f) => ({ email: f['email'] ?? false, push: f['push'] ?? false }), shallow);
    return <p>channels: {channels.email ? 'email' : '-'}/{channels.push ? 'push' : '-'}</p>;
  }

  it('returns the selected value and re-renders only when the selection changes', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    const Consumers = memo(function Consumers() {
      return <ChannelFlags onRender={probe} />;
    });
    render(
      <Harness initial={{ email: true, push: false, b: false }}>
        <Consumers />
      </Harness>,
    );
    expect(screen.getByText('channels: email/-')).toBeInTheDocument();
    const before = count(probe, 'channels');

    await user.click(screen.getByRole('button', { name: 'Flip b' }));
    expect(count(probe, 'channels')).toBe(before);
    expect(screen.getByText('channels: email/-')).toBeInTheDocument();
  });

  it('re-renders when a selected key changes', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    function Picker({ onRender }: { onRender: Probe }) {
      onRender('picker');
      const a = useFlags((f) => f['a'] ?? false);
      return <p>a is {String(a)}</p>;
    }
    render(
      <Harness initial={{ a: false }}>
        <Picker onRender={probe} />
      </Harness>,
    );
    expect(screen.getByText('a is false')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Flip a' }));
    expect(screen.getByText('a is true')).toBeInTheDocument();
  });
});

describe('5. provider prop changes propagate', () => {
  it('updates consumers when the flags object is replaced', async () => {
    const user = userEvent.setup();
    render(
      <Harness initial={{ a: true, b: false }}>
        <FlagReader name="a" />
        <FlagReader name="b" />
      </Harness>,
    );
    expect(text('b')).toHaveTextContent('b: off');
    await user.click(screen.getByRole('button', { name: 'Flip b' }));
    expect(text('b')).toHaveTextContent('b: on');
    expect(text('a')).toHaveTextContent('a: on');
  });

  it('works with rerender of the provider element itself', () => {
    const { rerender } = render(
      <FlagsProvider flags={{ a: false }}>
        <FlagReader name="a" />
      </FlagsProvider>,
    );
    expect(text('a')).toHaveTextContent('a: off');
    rerender(
      <FlagsProvider flags={{ a: true }}>
        <FlagReader name="a" />
      </FlagsProvider>,
    );
    expect(text('a')).toHaveTextContent('a: on');
  });
});

describe('6. overrides', () => {
  it('override wins over the provider flag and null clears it', async () => {
    const user = userEvent.setup();
    render(
      <FlagsProvider flags={{ b: false }}>
        <FlagReader name="b" />
        <OverridePanel />
      </FlagsProvider>,
    );
    expect(text('b')).toHaveTextContent('b: off');

    await user.click(screen.getByRole('button', { name: 'Override b on' }));
    expect(text('b')).toHaveTextContent('b: on');
    expect(screen.getByText('overrides: {"b":true}')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear b' }));
    expect(text('b')).toHaveTextContent('b: off');
    expect(screen.getByText('overrides: {}')).toBeInTheDocument();
  });

  it('an override of false beats a provider flag of true', async () => {
    const user = userEvent.setup();
    render(
      <FlagsProvider flags={{ b: true }}>
        <FlagReader name="b" />
        <OverridePanel />
      </FlagsProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Override b off' }));
    expect(text('b')).toHaveTextContent('b: off');
  });

  it('persists overrides to storage as JSON under flag-overrides', async () => {
    const user = userEvent.setup();
    const storage = memoryStorage();
    render(
      <FlagsProvider flags={{ b: false }} storage={storage}>
        <OverridePanel />
      </FlagsProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Override b on' }));
    expect(JSON.parse(storage.getItem(OVERRIDES_STORAGE_KEY)!)).toEqual({ b: true });
    await user.click(screen.getByRole('button', { name: 'Clear b' }));
    expect(JSON.parse(storage.getItem(OVERRIDES_STORAGE_KEY)!)).toEqual({});
    expect(OVERRIDES_STORAGE_KEY).toBe('flag-overrides');
  });

  it('restores overrides from storage on mount', () => {
    const storage = memoryStorage({ [OVERRIDES_STORAGE_KEY]: JSON.stringify({ b: true }) });
    render(
      <FlagsProvider flags={{ b: false }} storage={storage}>
        <FlagReader name="b" />
        <OverridePanel />
      </FlagsProvider>,
    );
    expect(text('b')).toHaveTextContent('b: on');
    expect(screen.getByText('overrides: {"b":true}')).toBeInTheDocument();
  });

  it('ignores invalid JSON in storage', () => {
    const storage = memoryStorage({ [OVERRIDES_STORAGE_KEY]: '{not json' });
    render(
      <FlagsProvider flags={{ b: true }} storage={storage}>
        <FlagReader name="b" />
        <OverridePanel />
      </FlagsProvider>,
    );
    expect(text('b')).toHaveTextContent('b: on');
    expect(screen.getByText('overrides: {}')).toBeInTheDocument();
  });
});

describe('3/4. useSyncExternalStore render isolation', () => {
  it('senior: a consumer of `a` does not re-render when `b` changes via prop or override', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    // memo() keeps the parent's re-render from reaching the readers: only the
    // store subscription can re-render them.
    const Consumers = memo(function Consumers() {
      return (
        <>
          <FlagReader name="a" onRender={probe} />
          <FlagReader name="b" onRender={probe} />
        </>
      );
    });
    render(
      <Harness initial={{ a: true, b: false }}>
        <Consumers />
        <OverridePanel />
      </Harness>,
    );
    expect(count(probe, 'a')).toBe(1);
    expect(count(probe, 'b')).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Flip b' }));
    expect(text('b')).toHaveTextContent('b: on');
    expect(count(probe, 'a')).toBe(1);
    expect(count(probe, 'b')).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Override b off' }));
    expect(text('b')).toHaveTextContent('b: off');
    expect(count(probe, 'a')).toBe(1);
    expect(count(probe, 'b')).toBe(3);

    // Setting an override that does not change the effective value of `b`
    // either (b is already off via override) must not re-render `a`.
    await user.click(screen.getByRole('button', { name: 'Override b off' }));
    expect(count(probe, 'a')).toBe(1);
    expect(count(probe, 'b')).toBe(3);
  });
});

describe('8. without a provider', () => {
  it('senior: useFlag returns false and warns once per flag name', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <>
          <FlagReader name="no-provider-x" />
          <FlagReader name="no-provider-x" />
          <FlagReader name="no-provider-y" />
        </>,
      );
      expect(screen.getAllByText('no-provider-x: off')).toHaveLength(2);
      expect(screen.getByText('no-provider-y: off')).toBeInTheDocument();
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn.mock.calls[0][0]).toMatch(/no-provider-x/);
      expect(warn.mock.calls[1][0]).toMatch(/no-provider-y/);
    } finally {
      warn.mockRestore();
    }
  });

  it('useFlagOverride throws a descriptive error', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(<OverridePanel />)).toThrow(/FlagsProvider/);
    } finally {
      consoleError.mockRestore();
    }
  });
});
