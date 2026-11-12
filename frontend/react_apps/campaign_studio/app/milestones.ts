/** Nav areas and the milestone that implements each one. */

export type AreaId =
  | 'dashboard'
  | 'campaigns'
  | 'audiences'
  | 'templates'
  | 'schedule'
  | 'journeys';

export interface Milestone {
  /** Two-digit number, matches the folder prefix. */
  id: string;
  folder: string;
  title: string;
}

export interface Area {
  id: AreaId;
  label: string;
  /** Undefined for areas that ship with the shell (milestone 1). */
  milestone?: Milestone;
}

export const MILESTONES: Record<string, Milestone> = {
  '02': {
    id: '02',
    folder: '02_data_layer',
    title: 'Data layer: LRU cache + query client',
  },
  '03': { id: '03', folder: '03_router', title: 'Router' },
  '04': {
    id: '04',
    folder: '04_audience',
    title: 'Audience rules + segment builder',
  },
  '05': {
    id: '05',
    folder: '05_content',
    title: 'Templates: tokenizer, renderer, editor',
  },
  '06': {
    id: '06',
    folder: '06_schedule',
    title: 'Scheduling: quiet hours + recurrence',
  },
  '07': {
    id: '07',
    folder: '07_journey',
    title: 'Journeys: graph validation + event log',
  },
};

export const AREAS: Area[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'campaigns', label: 'Campaigns', milestone: MILESTONES['02'] },
  { id: 'audiences', label: 'Audiences', milestone: MILESTONES['04'] },
  { id: 'templates', label: 'Templates', milestone: MILESTONES['05'] },
  { id: 'schedule', label: 'Schedule', milestone: MILESTONES['06'] },
  { id: 'journeys', label: 'Journeys', milestone: MILESTONES['07'] },
];
