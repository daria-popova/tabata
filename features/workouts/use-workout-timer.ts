import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import {
  clearActiveTimerSession,
  getActiveTimerSession,
  setActiveTimerSession,
} from '@/lib/settings/timer-session';

const TICK_MS = 250;

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

type UseWorkoutTimerParams = {
  workoutId: string;
  totalDurationMs: number;
  isReady: boolean;
};

type TimerStateSnapshot = {
  status: TimerStatus;
  elapsedBeforeRunMs: number;
  elapsedMs: number;
  runStartedAtMs: number | null;
};

export function useWorkoutTimer({ workoutId, totalDurationMs, isReady }: UseWorkoutTimerParams) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsedBeforeRunMs, setElapsedBeforeRunMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runStartedAtMs, setRunStartedAtMs] = useState<number | null>(null);
  const stateRef = useRef<TimerStateSnapshot>({
    status: 'idle',
    elapsedBeforeRunMs: 0,
    elapsedMs: 0,
    runStartedAtMs: null,
  });

  const updateTimerState = useCallback((nextState: TimerStateSnapshot) => {
    stateRef.current = nextState;
    setStatus(nextState.status);
    setElapsedBeforeRunMs(nextState.elapsedBeforeRunMs);
    setElapsedMs(nextState.elapsedMs);
    setRunStartedAtMs(nextState.runStartedAtMs);
  }, []);

  const clearPersistedSession = useCallback(() => {
    void clearActiveTimerSession();
  }, []);

  const persistSession = useCallback(
    (nextState: TimerStateSnapshot) => {
      if (nextState.status !== 'running' && nextState.status !== 'paused') {
        void clearActiveTimerSession();
        return;
      }

      void setActiveTimerSession({
        workoutId,
        status: nextState.status,
        elapsedBeforeRunMs: nextState.elapsedBeforeRunMs,
        runStartedAtMs: nextState.runStartedAtMs,
        savedAtMs: Date.now(),
      });
    },
    [workoutId]
  );

  const finish = useCallback(() => {
    const finishedState = {
      status: 'finished',
      elapsedBeforeRunMs: totalDurationMs,
      elapsedMs: totalDurationMs,
      runStartedAtMs: null,
    } satisfies TimerStateSnapshot;

    updateTimerState(finishedState);
    clearPersistedSession();
  }, [clearPersistedSession, totalDurationMs, updateTimerState]);

  const getCurrentElapsedMs = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.status !== 'running' || currentState.runStartedAtMs === null) {
      return currentState.elapsedMs;
    }

    return Math.min(
      currentState.elapsedBeforeRunMs + (Date.now() - currentState.runStartedAtMs),
      totalDurationMs
    );
  }, [totalDurationMs]);

  const syncElapsedToNow = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.status !== 'running') {
      return;
    }

    const nextElapsedMs = getCurrentElapsedMs();

    if (nextElapsedMs >= totalDurationMs) {
      finish();
      return;
    }

    const nextState = {
      ...currentState,
      elapsedMs: nextElapsedMs,
    };

    updateTimerState(nextState);
  }, [finish, getCurrentElapsedMs, totalDurationMs, updateTimerState]);

  useEffect(() => {
    if (!isReady || !workoutId || totalDurationMs <= 0) {
      return;
    }

    let isCancelled = false;

    async function restoreSession() {
      const session = await getActiveTimerSession();

      if (isCancelled || session?.workoutId !== workoutId) {
        return;
      }

      if (session.status === 'running' && session.runStartedAtMs !== null) {
        const nextElapsedMs = Math.min(
          session.elapsedBeforeRunMs + (Date.now() - session.runStartedAtMs),
          totalDurationMs
        );

        if (nextElapsedMs >= totalDurationMs) {
          finish();
          return;
        }

        updateTimerState({
          status: 'running',
          elapsedBeforeRunMs: session.elapsedBeforeRunMs,
          elapsedMs: nextElapsedMs,
          runStartedAtMs: session.runStartedAtMs,
        });
        return;
      }

      const nextElapsedMs = Math.min(session.elapsedBeforeRunMs, totalDurationMs);

      updateTimerState({
        status: 'paused',
        elapsedBeforeRunMs: nextElapsedMs,
        elapsedMs: nextElapsedMs,
        runStartedAtMs: null,
      });
    }

    void restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [finish, isReady, totalDurationMs, updateTimerState, workoutId]);

  useEffect(() => {
    if (status !== 'running') {
      return;
    }

    const intervalId = setInterval(syncElapsedToNow, TICK_MS);

    return () => clearInterval(intervalId);
  }, [status, syncElapsedToNow]);

  useEffect(() => {
    function handleAppStateChange(nextAppState: AppStateStatus) {
      if (nextAppState === 'active') {
        syncElapsedToNow();
        return;
      }

      if (nextAppState === 'inactive' || nextAppState === 'background') {
        persistSession(stateRef.current);
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription.remove();
  }, [persistSession, syncElapsedToNow]);

  useEffect(() => {
    return () => {
      persistSession(stateRef.current);
    };
  }, [persistSession]);

  const startOrResume = useCallback(() => {
    if (totalDurationMs <= 0) {
      return;
    }

    const currentState = stateRef.current;
    const nextElapsedBeforeRunMs = currentState.status === 'finished' ? 0 : currentState.elapsedMs;
    const nextState = {
      status: 'running',
      elapsedBeforeRunMs: nextElapsedBeforeRunMs,
      elapsedMs: nextElapsedBeforeRunMs,
      runStartedAtMs: Date.now(),
    } satisfies TimerStateSnapshot;

    updateTimerState(nextState);
    persistSession(nextState);
  }, [persistSession, totalDurationMs, updateTimerState]);

  const pause = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.status !== 'running') {
      return;
    }

    const nextElapsedMs = getCurrentElapsedMs();
    const nextState = {
      status: 'paused',
      elapsedBeforeRunMs: nextElapsedMs,
      elapsedMs: nextElapsedMs,
      runStartedAtMs: null,
    } satisfies TimerStateSnapshot;

    updateTimerState(nextState);
    persistSession(nextState);
  }, [getCurrentElapsedMs, persistSession, updateTimerState]);

  const stop = useCallback(() => {
    updateTimerState({
      status: 'idle',
      elapsedBeforeRunMs: 0,
      elapsedMs: 0,
      runStartedAtMs: null,
    });
    clearPersistedSession();
  }, [clearPersistedSession, updateTimerState]);

  return {
    elapsedMs,
    pause,
    startOrResume,
    status,
    stop,
  };
}
