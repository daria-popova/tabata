export const PHASE_TYPES = ['warmup', 'work', 'rest', 'cooldown'] as const;

export type PhaseType = (typeof PHASE_TYPES)[number];

export interface Phase {
  id: string;
  type: PhaseType;
  durationSec: number;
}

export interface Workout {
  id: string;
  name: string;
  phases: Phase[];
  createdAt: number;
}

export interface TimelineItem {
  id: string;
  phaseId: string;
  type: PhaseType;
  durationSec: number;
  order: number;
}
