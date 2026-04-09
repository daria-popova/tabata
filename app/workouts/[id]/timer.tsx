import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  buildTimeline,
  getTimelineSnapshot,
  getTotalDurationSec,
} from '@/features/workouts/model';
import { useTimerSounds } from '@/features/workouts/use-timer-sounds';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getWorkoutById } from '@/lib/db';
import { formatClock, formatDuration } from '@/lib/format-duration';
import { formatRuCount } from '@/lib/russian-plural';
import { getSoundEnabled } from '@/lib/settings/sound-settings';
import type { TimelineItem, Workout } from '@/types';

const TICK_MS = 250;

const PHASE_LABELS = {
  warmup: 'Разминка',
  work: 'Работа',
  rest: 'Отдых',
  cooldown: 'Заминка',
} as const;

const SET_FORMS = ['сет', 'сета', 'сетов'] as const;
const STEP_FORMS = ['этап', 'этапа', 'этапов'] as const;

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
  const currentSetLabel = workout
    ? getCurrentSetLabel(workout, snapshot.currentItem, isFinished)
    : null;
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

  async function handleShare() {
    if (!workout) {
      return;
    }

    try {
      await Share.share({
        message: buildShareMessage(workout, totalDurationSec),
      });
    } catch (error) {
      console.error('Failed to share workout result', error);
      Alert.alert('Ошибка', 'Не удалось открыть меню отправки.');
    }
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
              {formatRuCount(workout.sets, SET_FORMS)} • {formatRuCount(timeline.length, STEP_FORMS)}{' '}
              • {formatDuration(totalDurationSec)}
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
            {currentSetLabel ? (
              <ThemedText style={[styles.currentSet, { color: timerCardTheme.textColor }]}>
                {currentSetLabel}
              </ThemedText>
            ) : null}
            <ThemedText style={{ color: timerCardTheme.secondaryTextColor }}>
              {isFinished
                ? 'Тренировка завершена'
                : `Этап ${snapshot.currentItemIndex + 1} из ${formatRuCount(timeline.length, STEP_FORMS)}`}
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
              <ThemedText style={styles.secondaryButtonText}>Стоп</ThemedText>
            </Pressable>
          </ThemedView>

          {isFinished ? (
            <Pressable style={styles.shareButton} onPress={() => void handleShare()}>
              <ThemedText style={styles.shareButtonText}>Поделиться</ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>
      )}
    </>
  );
}

function getCurrentSetLabel(
  workout: Workout,
  currentItem: TimelineItem | null,
  isFinished: boolean
): string {
  if (isFinished) {
    return `${formatRuCount(workout.sets, SET_FORMS)} завершено`;
  }

  const currentSetNumber =
    currentItem?.setNumber ?? (currentItem?.type === 'cooldown' ? workout.sets : 1);

  return `Сет ${currentSetNumber} из ${workout.sets}`;
}

function buildShareMessage(workout: Workout, totalDurationSec: number): string {
  return `#спорт Тренировка ${workout.name} за ${formatDuration(totalDurationSec)}, ${formatRuCount(
    workout.sets,
    SET_FORMS
  )} (работа ${formatDuration(workout.workSec)}, отдых ${formatDuration(workout.restSec)}).`;
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
  currentSet: {
    fontSize: 26,
    lineHeight: 32,
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
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#11181c',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
