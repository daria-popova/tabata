import type { TimelineItem, Workout } from '@/types';

export function buildTimeline(workout: Workout): TimelineItem[] {
  return workout.phases.map((phase, index) => ({
    id: `${workout.id}:${phase.id}:${index}`,
    phaseId: phase.id,
    type: phase.type,
    durationSec: phase.durationSec,
    order: index,
  }));
}

export function getTotalDurationSec(timeline: TimelineItem[]): number {
  return timeline.reduce((total, item) => total + item.durationSec, 0);
}
