import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  buildTimeline,
  getTimelineSnapshot,
  getTotalDurationSec,
} from '@/features/workouts/model';
import { formatDuration } from '@/lib/format-duration';
import { getWorkoutById } from '@/lib/db';

const TICK_MS = 250;

const PHASE_LABELS = {
  warmup: 'Разминка',
  work: 'Работа',
  rest: 'Отдых',
  cooldown: 'Заминка',
} as const;

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export default function WorkoutTimerScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = typeof params.id === 'string' ? params.id : '';
  const [isLoading, setIsLoading] = useState(true);
  const [workout, setWorkout] = useState<Awaited<ReturnType<typeof getWorkoutById>>>(null);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsedBeforeRunMs, setElapsedBeforeRunMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runStartedAtMs, setRunStartedAtMs] = useState<number | null>(null);

  useEffect(() => {
    async function loadWorkout() {
      try {
        const loadedWorkout = await getWorkoutById(db, workoutId);
        setWorkout(loadedWorkout);
      } catch (error) {
        console.error('Failed to load workout for timer', error);
        Alert.alert('Ошибка загрузки', 'Не удалось загрузить тренировку.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadWorkout();
  }, [db, workoutId]);

  const timeline = useMemo(() => (workout ? buildTimeline(workout) : []), [workout]);
  const totalDurationSec = getTotalDurationSec(timeline);
  const snapshot = useMemo(() => getTimelineSnapshot(timeline, elapsedMs), [timeline, elapsedMs]);

  useEffect(() => {
    if (status !== 'running' || runStartedAtMs === null) {
      return;
    }

    const intervalId = setInterval(() => {
      const nextElapsedMs = elapsedBeforeRunMs + (Date.now() - runStartedAtMs);

      if (nextElapsedMs >= snapshot.totalDurationMs) {
        setElapsedMs(snapshot.totalDurationMs);
        setElapsedBeforeRunMs(snapshot.totalDurationMs);
        setRunStartedAtMs(null);
        setStatus('finished');
        return;
      }

      setElapsedMs(nextElapsedMs);
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [elapsedBeforeRunMs, runStartedAtMs, snapshot.totalDurationMs, status]);

  function handleStartOrResume() {
    if (timeline.length === 0) {
      return;
    }

    if (status === 'finished') {
      setElapsedBeforeRunMs(0);
      setElapsedMs(0);
    }

    setRunStartedAtMs(Date.now());
    setStatus('running');
  }

  function handlePause() {
    if (status !== 'running' || runStartedAtMs === null) {
      return;
    }

    const nextElapsedMs = Math.min(
      elapsedBeforeRunMs + (Date.now() - runStartedAtMs),
      snapshot.totalDurationMs
    );

    setElapsedBeforeRunMs(nextElapsedMs);
    setElapsedMs(nextElapsedMs);
    setRunStartedAtMs(null);
    setStatus('paused');
  }

  function handleStop() {
    setRunStartedAtMs(null);
    setElapsedBeforeRunMs(0);
    setElapsedMs(0);
    setStatus('idle');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Таймер' }} />

      {isLoading ? (
        <ThemedView style={styles.centerState}>
          <ThemedText>Загружаю тренировку...</ThemedText>
        </ThemedView>
      ) : !workout || timeline.length === 0 ? (
        <ThemedView style={styles.centerState}>
          <ThemedText type="subtitle">Таймер недоступен</ThemedText>
          <ThemedText>Не удалось построить тренировку для запуска.</ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">{workout.name}</ThemedText>
            <ThemedText>
              {workout.sets} сетов • {timeline.length} этапов • {formatDuration(totalDurationSec)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.timerCard}>
            <ThemedText type="subtitle">
              {snapshot.currentItem ? PHASE_LABELS[snapshot.currentItem.type] : 'Завершено'}
            </ThemedText>
            <ThemedText style={styles.timerValue}>
              {formatClock(Math.ceil(snapshot.currentItemRemainingMs / 1000))}
            </ThemedText>
            <ThemedText>
              Этап {snapshot.currentItemIndex + 1} из {timeline.length}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.progressSection}>
            <ThemedText>Общий прогресс</ThemedText>
            <ThemedView style={styles.progressTrack}>
              <ThemedView style={[styles.progressFill, { width: `${snapshot.progress * 100}%` }]} />
            </ThemedView>
            <ThemedText>
              {formatClock(Math.floor(snapshot.elapsedMs / 1000))} / {formatClock(totalDurationSec)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.controls}>
            {status === 'running' ? (
              <Pressable style={styles.primaryButton} onPress={handlePause}>
                <ThemedText style={styles.primaryButtonText}>Пауза</ThemedText>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryButton} onPress={handleStartOrResume}>
                <ThemedText style={styles.primaryButtonText}>
                  {status === 'idle' ? 'Старт' : status === 'finished' ? 'Повторить' : 'Продолжить'}
                </ThemedText>
              </Pressable>
            )}

            <Pressable style={styles.secondaryButton} onPress={handleStop}>
              <ThemedText>Стоп</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      )}
    </>
  );
}

function formatClock(totalSeconds: number) {
  const safeTotalSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeTotalSeconds / 60);
  const seconds = safeTotalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
    backgroundColor: '#ffffff',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  header: {
    gap: 8,
  },
  timerCard: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.18)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: 12,
  },
  timerValue: {
    fontSize: 56,
    lineHeight: 56,
    fontWeight: '700',
  },
  progressSection: {
    gap: 10,
  },
  progressTrack: {
    height: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(127, 127, 127, 0.18)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0a7ea4',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.18)',
    backgroundColor: '#ffffff',
  },
});
