import type { TimelineItem, Workout } from '@/types';

export function buildTimeline(workout: Workout): TimelineItem[] {
  const timeline: TimelineItem[] = [];
  let order = 0;

  if (workout.warmupSec > 0) {
    timeline.push({
      id: `${workout.id}:warmup`,
      type: 'warmup',
      durationSec: workout.warmupSec,
      order,
    });
    order += 1;
  }

  for (let setIndex = 0; setIndex < workout.sets; setIndex += 1) {
    timeline.push({
      id: `${workout.id}:work:${setIndex}`,
      type: 'work',
      durationSec: workout.workSec,
      order,
    });
    order += 1;

    timeline.push({
      id: `${workout.id}:rest:${setIndex}`,
      type: 'rest',
      durationSec: workout.restSec,
      order,
    });
    order += 1;
  }

  if (workout.cooldownSec > 0) {
    timeline.push({
      id: `${workout.id}:cooldown`,
      type: 'cooldown',
      durationSec: workout.cooldownSec,
      order,
    });
  }

  return timeline;
}

export function getTotalDurationSec(timeline: TimelineItem[]): number {
  return timeline.reduce((total, item) => total + item.durationSec, 0);
}
