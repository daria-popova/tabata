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
