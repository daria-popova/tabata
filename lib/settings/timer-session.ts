import Storage from 'expo-sqlite/kv-store';

export type PersistedTimerStatus = 'running' | 'paused';

export type ActiveTimerSession = {
  workoutId: string;
  status: PersistedTimerStatus;
  elapsedBeforeRunMs: number;
  runStartedAtMs: number | null;
  savedAtMs: number;
};

const ACTIVE_TIMER_SESSION_KEY = 'active_timer_session';

export async function getActiveTimerSession(): Promise<ActiveTimerSession | null> {
  const rawValue = await Storage.getItem(ACTIVE_TIMER_SESSION_KEY);

  if (rawValue === null) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!isActiveTimerSession(parsedValue)) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export async function setActiveTimerSession(session: ActiveTimerSession) {
  await Storage.setItem(ACTIVE_TIMER_SESSION_KEY, JSON.stringify(session));
}

export async function clearActiveTimerSession() {
  await Storage.removeItem(ACTIVE_TIMER_SESSION_KEY);
}

function isActiveTimerSession(value: unknown): value is ActiveTimerSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ActiveTimerSession>;

  return (
    typeof candidate.workoutId === 'string' &&
    (candidate.status === 'running' || candidate.status === 'paused') &&
    typeof candidate.elapsedBeforeRunMs === 'number' &&
    (typeof candidate.runStartedAtMs === 'number' || candidate.runStartedAtMs === null) &&
    typeof candidate.savedAtMs === 'number'
  );
}
