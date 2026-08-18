import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';

// Auto-discover every task demo: `../<NNN>_<name>/demo.tsx`.
// Drop a demo.tsx into a task folder and it shows up here automatically.
const modules = import.meta.glob('../*/demo.tsx') as Record<
  string,
  () => Promise<{ default: ComponentType }>
>;

interface Entry {
  slug: string; // folder name, e.g. "001_status_badge"
  label: string; // human title, e.g. "1. Status Badge"
  load: () => Promise<{ default: ComponentType }>;
}

function toLabel(slug: string): string {
  const m = slug.match(/^(\d+)_(.+)$/);
  if (!m) return slug;
  const [, num, rest] = m;
  const words = rest
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `${parseInt(num, 10)}. ${words}`;
}

const entries: Entry[] = Object.entries(modules)
  .map(([path, load]) => {
    const slug = path.split('/')[1];
    return { slug, label: toLabel(slug), load };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

function useHashRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash.slice(2));
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.slice(2));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

interface BoundaryProps {
  slug: string;
  children: ReactNode;
}

// Unsolved tasks throw 'Not implemented' on render — show the assignment
// instead of a crash, and recover when the user navigates elsewhere.
class TaskBoundary extends Component<BoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (prev.slug !== this.props.slug && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const notImplemented = /not implemented/i.test(error.message);
    return (
      <div className="placeholder">
        <h2>{notImplemented ? 'Not implemented yet' : 'Component crashed'}</h2>
        {notImplemented ? (
          <p>
            Solve it in <code>{this.props.slug}</code>: implement the stub,
            check the folder&apos;s <code>README.md</code>, and validate with{' '}
            <code>npx jest frontend/netflix/react/{this.props.slug}</code>.
            Vite hot-reloads this page as you save.
          </p>
        ) : (
          <pre className="error-detail">{error.message}</pre>
        )}
      </div>
    );
  }
}

export default function App() {
  const current = useHashRoute();
  const active = entries.find((e) => e.slug === current);
  const Active = active ? lazy(active.load) : null;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>POSA React Track</h1>
        <p className="hint">
          {entries.length} task demos — implement the stub, watch it come
          alive.
        </p>
        <nav>
          <ul>
            {entries.map((e) => (
              <li key={e.slug}>
                <a
                  href={`#/${e.slug}`}
                  className={e.slug === current ? 'active' : ''}
                >
                  {e.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="content">
        {Active && active ? (
          <TaskBoundary slug={active.slug} key={active.slug}>
            <Suspense fallback={<p>Loading…</p>}>
              <Active />
            </Suspense>
          </TaskBoundary>
        ) : (
          <div className="placeholder">
            <h2>Select a task</h2>
            <p>
              Each entry renders the demo harness from its folder&apos;s{' '}
              <code>demo.tsx</code>. Unsolved tasks show an assignment card
              until you implement the stub — the jest suite in the same folder
              is the grader.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
