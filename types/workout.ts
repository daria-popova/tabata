export const PHASE_TYPES = ['warmup', 'work', 'rest', 'cooldown'] as const;

export type PhaseType = (typeof PHASE_TYPES)[number];

export interface Workout {
  id: string;
  name: string;
  createdAt: number;
  warmupSec: number;
  workSec: number;
  restSec: number;
  sets: number;
  cooldownSec: number;
}

export interface TimelineItem {
  id: string;
  type: PhaseType;
  durationSec: number;
  order: number;
  setNumber?: number;
}
