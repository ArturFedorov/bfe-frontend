import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react';

// Auto-discover every component playground: `<NNN>_<name>/react/App.tsx`.
// Drop a new folder following that convention and it shows up here automatically.
const modules = import.meta.glob('../*/react/App.tsx') as Record<
  string,
  () => Promise<{ default: ComponentType }>
>;

interface Entry {
  slug: string; // folder name, e.g. "001_autocomplete"
  label: string; // human title, e.g. "1. Autocomplete"
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

export default function App() {
  const current = useHashRoute();
  const active = entries.find((e) => e.slug === current);
  const Active = active ? lazy(active.load) : null;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>UI Components</h1>
        <p className="hint">React playground — pick one to implement.</p>
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
        {Active ? (
          <Suspense fallback={<p>Loading…</p>}>
            <Active />
          </Suspense>
        ) : (
          <div className="placeholder">
            <h2>Select a component</h2>
            <p>
              {entries.length} components available. Each renders a placeholder
              you build out in React. The matching requirements live in each
              folder&apos;s <code>README.md</code>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
