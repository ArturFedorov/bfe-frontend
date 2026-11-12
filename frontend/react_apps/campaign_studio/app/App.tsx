import { useMemo, useState } from 'react';
import { SessionProvider, useSession } from '../shell/session';
import {
  createQueryClient,
  QueryClientProvider,
} from '../milestones/02_data_layer/query';
import { CampaignsPage } from '../milestones/02_data_layer/CampaignsPage';
import { SegmentBuilder } from '../milestones/04_audience/SegmentBuilder';
import { TemplateEditor } from '../milestones/05_content/TemplateEditor';
import { SchedulePicker } from '../milestones/06_schedule/SchedulePicker';
import type { Schedule } from '../milestones/06_schedule/schedule';
import { JourneyBuilder } from '../milestones/07_journey/JourneyBuilder';
import { Dashboard } from './Dashboard';
import { AREAS, type Area, type AreaId } from './milestones';
import { TaskBoundary } from './TaskBoundary';

/**
 * Shell layout: header, left nav, content. Navigation is a plain `useState`
 * switch until milestone 3 (router) is solved — see that README for the swap.
 */

function CampaignsArea() {
  // Created lazily *inside* the boundary so an unsolved milestone 2 shows the
  // assignment card instead of crashing the whole app at module load.
  const client = useMemo(() => createQueryClient(), []);
  return (
    <QueryClientProvider client={client}>
      <CampaignsPage />
    </QueryClientProvider>
  );
}

const DEFAULT_SCHEDULE: Schedule = {
  timezone: 'America/New_York',
  startDate: '2026-11-16',
  time: '09:30',
  recurrence: 'weekly',
  weekdays: [1, 3, 5],
  quietHours: [{ days: [], start: '21:00', end: '08:00' }],
};

function ScheduleArea() {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  return <SchedulePicker value={schedule} onChange={setSchedule} />;
}

function AreaContent({ area }: { area: Area }) {
  switch (area.id) {
    case 'dashboard':
      return <Dashboard />;
    case 'campaigns':
      return <CampaignsArea />;
    case 'audiences':
      return <SegmentBuilder />;
    case 'templates':
      return <TemplateEditor />;
    case 'schedule':
      return <ScheduleArea />;
    case 'journeys':
      return <JourneyBuilder />;
  }
}

function Header() {
  const { user, setRole } = useSession();
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo" aria-hidden="true">
          CS
        </span>
        <h1>Campaign Studio</h1>
      </div>
      <div className="whoami">
        <span>{user.name}</span>
        <label>
          <span className="visually-hidden">Role</span>
          <select
            value={user.role}
            onChange={(e) => setRole(e.target.value as typeof user.role)}
          >
            <option value="editor">editor</option>
            <option value="approver">approver</option>
          </select>
        </label>
      </div>
    </header>
  );
}

function Shell() {
  const [current, setCurrent] = useState<AreaId>('dashboard');
  const area = AREAS.find((a) => a.id === current) ?? AREAS[0];

  return (
    <div className="app">
      <Header />
      <div className="body">
        <nav className="sidenav" aria-label="Areas">
          <ul>
            {AREAS.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={a.id === current ? 'active' : ''}
                  aria-current={a.id === current ? 'page' : undefined}
                  onClick={() => setCurrent(a.id)}
                >
                  {a.label}
                  {a.milestone && (
                    <span className="pill">M{a.milestone.id}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="content" aria-live="polite">
          {area.milestone ? (
            <TaskBoundary key={area.id} milestone={area.milestone}>
              <AreaContent area={area} />
            </TaskBoundary>
          ) : (
            <AreaContent area={area} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  );
}
