import { Component, type ReactNode } from 'react';
import type { Milestone } from './milestones';

interface TaskBoundaryProps {
  milestone: Milestone;
  children: ReactNode;
}

interface TaskBoundaryState {
  error: Error | null;
}

/**
 * Unsolved milestones throw 'Not implemented' on render — show the assignment
 * card instead of a blank screen; any other error shows a crash card. The
 * boundary resets when the milestone changes (App also keys it by area).
 */
export class TaskBoundary extends Component<
  TaskBoundaryProps,
  TaskBoundaryState
> {
  state: TaskBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): TaskBoundaryState {
    return { error };
  }

  componentDidUpdate(prev: TaskBoundaryProps) {
    if (prev.milestone.id !== this.props.milestone.id && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { milestone } = this.props;
    const notImplemented = /not implemented/i.test(error.message);
    const readmeHref = `/milestones/${milestone.folder}/README.md`;

    if (notImplemented) {
      return (
        <section className="card assignment" aria-labelledby="assignment-title">
          <p className="eyebrow">Milestone {milestone.id}</p>
          <h2 id="assignment-title">{milestone.title}</h2>
          <p>
            This area is an assignment. Implement the stubs in{' '}
            <code>milestones/{milestone.folder}/</code> — the spec is in the
            folder&apos;s{' '}
            <a href={readmeHref} target="_blank" rel="noreferrer">
              README.md
            </a>{' '}
            and the grader is its jest suite:
          </p>
          <pre className="command">
            npm run test:campaign -- {milestone.folder}
          </pre>
          <p className="muted">Vite hot-reloads this page as you save.</p>
        </section>
      );
    }

    return (
      <section className="card crash" role="alert">
        <h2>Component crashed</h2>
        <p>
          Milestone {milestone.id} rendered, then threw. Fix the implementation
          in <code>milestones/{milestone.folder}/</code>.
        </p>
        <pre className="error-detail">{error.message}</pre>
        <button type="button" onClick={() => this.setState({ error: null })}>
          Retry
        </button>
      </section>
    );
  }
}
