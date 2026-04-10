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
      setNumber: setIndex + 1,
    });
    order += 1;

    if (setIndex < workout.sets - 1) {
      timeline.push({
        id: `${workout.id}:rest:${setIndex}`,
        type: 'rest',
        durationSec: workout.restSec,
        order,
        setNumber: setIndex + 1,
      });
      order += 1;
    }
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

export function getTimelineSnapshot(timeline: TimelineItem[], elapsedMs: number) {
  const totalDurationMs = getTotalDurationSec(timeline) * 1000;
  const boundedElapsedMs = Math.max(0, Math.min(elapsedMs, totalDurationMs));

  if (timeline.length === 0) {
    return {
      currentItem: null,
      currentItemIndex: -1,
      currentItemElapsedMs: 0,
      currentItemRemainingMs: 0,
      totalDurationMs: 0,
      elapsedMs: 0,
      progress: 0,
      isFinished: true,
    };
  }

  if (boundedElapsedMs >= totalDurationMs) {
    const lastItem = timeline[timeline.length - 1];

    return {
      currentItem: lastItem,
      currentItemIndex: timeline.length - 1,
      currentItemElapsedMs: lastItem.durationSec * 1000,
      currentItemRemainingMs: 0,
      totalDurationMs,
      elapsedMs: totalDurationMs,
      progress: 1,
      isFinished: true,
    };
  }

  let accumulatedMs = 0;

  for (const [index, item] of timeline.entries()) {
    const itemDurationMs = item.durationSec * 1000;
    const nextAccumulatedMs = accumulatedMs + itemDurationMs;

    if (boundedElapsedMs < nextAccumulatedMs) {
      const currentItemElapsedMs = boundedElapsedMs - accumulatedMs;

      return {
        currentItem: item,
        currentItemIndex: index,
        currentItemElapsedMs,
        currentItemRemainingMs: itemDurationMs - currentItemElapsedMs,
        totalDurationMs,
        elapsedMs: boundedElapsedMs,
        progress: totalDurationMs === 0 ? 0 : boundedElapsedMs / totalDurationMs,
        isFinished: false,
      };
    }

    accumulatedMs = nextAccumulatedMs;
  }

  const lastItem = timeline[timeline.length - 1];

  return {
    currentItem: lastItem,
    currentItemIndex: timeline.length - 1,
    currentItemElapsedMs: lastItem.durationSec * 1000,
    currentItemRemainingMs: 0,
    totalDurationMs,
    elapsedMs: totalDurationMs,
    progress: 1,
    isFinished: true,
  };
}
