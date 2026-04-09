export function formatDuration(totalDurationSec: number) {
  const minutes = Math.floor(totalDurationSec / 60);
  const seconds = totalDurationSec % 60;

  if (minutes === 0) {
    return `${seconds} сек`;
  }

  if (seconds === 0) {
    return `${minutes} мин`;
  }

  return `${minutes} мин ${seconds} сек`;
}

export function formatClock(totalSeconds: number) {
  const safeTotalSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeTotalSeconds / 60);
  const seconds = safeTotalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
