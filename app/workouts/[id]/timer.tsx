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
import { useTimerSounds } from '@/features/workouts/use-timer-sounds';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatClock, formatDuration } from '@/lib/format-duration';
import { getWorkoutById } from '@/lib/db';
import { getSoundEnabled } from '@/lib/settings/sound-settings';

const TICK_MS = 250;

const PHASE_LABELS = {
  warmup: 'Разминка',
  work: 'Работа',
  rest: 'Отдых',
  cooldown: 'Заминка',
} as const;

type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

const TIMER_CARD_THEME = {
  work: {
    backgroundColor: '#b42318',
    borderColor: '#b42318',
    textColor: '#fff8f7',
    secondaryTextColor: '#ffe2de',
    accentColor: '#b42318',
  },
  rest: {
    backgroundColor: '#067647',
    borderColor: '#067647',
    textColor: '#f4fff8',
    secondaryTextColor: '#d1fadf',
    accentColor: '#067647',
  },
} as const;

export default function WorkoutTimerScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = typeof params.id === 'string' ? params.id : '';
  const [isLoading, setIsLoading] = useState(true);
  const [workout, setWorkout] = useState<Awaited<ReturnType<typeof getWorkoutById>>>(null);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [elapsedBeforeRunMs, setElapsedBeforeRunMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runStartedAtMs, setRunStartedAtMs] = useState<number | null>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const trackColor = useThemeColor({}, 'surfaceMuted');

  useEffect(() => {
    async function loadSoundSetting() {
      try {
        const enabled = await getSoundEnabled();
        setSoundEnabled(enabled);
      } catch (error) {
        console.error('Failed to load sound setting', error);
      }
    }

    void loadSoundSetting();
  }, []);

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
  const isFinished = status === 'finished' || snapshot.isFinished;
  const timerCardTheme =
    !isFinished && snapshot.currentItem?.type === 'work'
      ? TIMER_CARD_THEME.work
      : !isFinished && snapshot.currentItem?.type === 'rest'
        ? TIMER_CARD_THEME.rest
        : {
            backgroundColor: surfaceColor,
            borderColor,
            textColor,
            secondaryTextColor: mutedTextColor,
            accentColor: '#0a7ea4',
          };

  useTimerSounds({
    currentItemId: snapshot.currentItem?.id ?? null,
    currentItemType: snapshot.currentItem?.type ?? null,
    currentItemRemainingMs: snapshot.currentItemRemainingMs,
    currentItemDurationMs: snapshot.currentItem ? snapshot.currentItem.durationSec * 1000 : 0,
    status,
    soundEnabled,
  });

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
        <ThemedView style={[styles.container, { backgroundColor }]}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">{workout.name}</ThemedText>
            <ThemedText>
              {workout.sets} сетов • {timeline.length} этапов • {formatDuration(totalDurationSec)}
            </ThemedText>
          </ThemedView>

          <ThemedView
            style={[
              styles.timerCard,
              {
                backgroundColor: timerCardTheme.backgroundColor,
                borderColor: timerCardTheme.borderColor,
              },
            ]}>
            <ThemedText type="subtitle" style={{ color: timerCardTheme.textColor }}>
              {isFinished
                ? 'Готово'
                : snapshot.currentItem
                  ? PHASE_LABELS[snapshot.currentItem.type]
                  : 'Готово'}
            </ThemedText>
            <ThemedText style={[styles.timerValue, { color: timerCardTheme.textColor }]}>
              {isFinished ? '00:00' : formatClock(Math.ceil(snapshot.currentItemRemainingMs / 1000))}
            </ThemedText>
            <ThemedText style={{ color: timerCardTheme.secondaryTextColor }}>
              {isFinished
                ? 'Тренировка завершена'
                : `Этап ${snapshot.currentItemIndex + 1} из ${timeline.length}`}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.progressSection}>
            <ThemedText>Общий прогресс</ThemedText>
            <ThemedView style={[styles.progressTrack, { backgroundColor: trackColor }]}>
              <ThemedView
                style={[
                  styles.progressFill,
                  {
                    width: `${snapshot.progress * 100}%`,
                    backgroundColor: timerCardTheme.accentColor,
                  },
                ]}
              />
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

            <Pressable
              style={[styles.secondaryButton, { borderColor, backgroundColor: surfaceColor }]}
              onPress={handleStop}>
              <ThemedText>Стоп</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
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
  },
  progressFill: {
    height: '100%',
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
  },
});
