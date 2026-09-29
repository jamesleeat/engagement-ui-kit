/**
 * Sample data for the workbench.
 *
 * Representative rather than exhaustive: build against the shapes, not against
 * these particular ids, counts or orderings. Additional compatible data may be
 * used during review.
 */

export type EngagementStatus = 'READY' | 'PROCESSING' | 'ERROR';

export interface ReviewerOption {
  id: string;
  name: string;
  role: string;
  /** Reviewers who cannot currently be assigned, e.g. on leave. */
  unavailable?: boolean;
}

export interface EngagementRow {
  id: string;
  name: string;
  clientName: string;
  status: EngagementStatus;
  pendingChangeCount: number;
}

export const REVIEWERS: ReviewerOption[] = [
  { id: 'USR-101', name: 'Marta Halvorsen', role: 'Engagement partner' },
  { id: 'USR-102', name: 'Daniel Okonkwo', role: 'Engagement partner' },
  { id: 'USR-103', name: 'Priya Raghunathan', role: 'Audit manager' },
  { id: 'USR-104', name: 'Tomas Lindqvist', role: 'Audit manager' },
  { id: 'USR-105', name: 'Aisha Bello', role: 'Quality reviewer' },
  { id: 'USR-106', name: 'Aidan Brennan', role: 'Quality reviewer' },
  { id: 'USR-107', name: 'Chen Wei', role: 'Senior associate', unavailable: true },
  { id: 'USR-108', name: 'Sofia Marchetti', role: 'Senior associate' },
  { id: 'USR-109', name: 'Jean-Baptiste Moreau-Delacroix', role: 'Senior associate' },
  { id: 'USR-110', name: 'Hannah Whitfield', role: 'Associate' },
  { id: 'USR-111', name: 'Mateo Fernández', role: 'Associate' },
  { id: 'USR-112', name: 'Grace Achieng', role: 'Associate' },
  { id: 'USR-113', name: 'Oliver Nakamura', role: 'Associate' },
  { id: 'USR-114', name: 'Zoe Kaplan', role: 'Associate', unavailable: true },
];

export const CHANGE_GROUPS: string[] = [
  'Client details',
  'Consolidation eliminations',
  'Engagement setup',
  'Engagement team',
  'Group structure',
  'Risk assessment',
  'Trial balance mappings',
];

export const ENGAGEMENTS: EngagementRow[] = [
  {
    id: 'ENG-2041',
    name: 'FY2025 Statutory Audit',
    clientName: 'Harborview Logistics Ltd.',
    status: 'READY',
    pendingChangeCount: 4,
  },
  {
    id: 'ENG-2042',
    name: 'FY2025 Year-End Close',
    clientName: 'Northwind Dairy Co-operative',
    status: 'READY',
    pendingChangeCount: 0,
  },
  {
    id: 'ENG-2043',
    name: 'FY2025 Group Consolidation',
    clientName: 'Cascadia Metals Group',
    status: 'PROCESSING',
    pendingChangeCount: 5,
  },
  {
    id: 'ENG-2044',
    name: 'Q3 Interim Review',
    clientName: 'Lakeside Medical Partners',
    status: 'READY',
    pendingChangeCount: 3,
  },
  {
    id: 'ENG-2045',
    name: 'FY2025 Statutory Audit',
    clientName: 'Pemberton Craft Brewing Co.',
    status: 'ERROR',
    pendingChangeCount: 2,
  },
];
