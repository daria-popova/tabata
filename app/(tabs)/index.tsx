import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { listWorkouts } from '@/lib/db';
import { formatDuration } from '@/lib/format-duration';
import { getTotalDurationSec, buildTimeline } from '@/features/workouts/model';
import type { Workout } from '@/types';

export default function WorkoutsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWorkouts = useCallback(async () => {
    try {
      setErrorMessage(null);
      const nextWorkouts = await listWorkouts(db);
      setWorkouts(nextWorkouts);
    } catch (error) {
      console.error('Failed to load workouts', error);
      setErrorMessage('Не удалось загрузить тренировки.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      void loadWorkouts();
    }, [loadWorkouts])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Тренировки</ThemedText>
          <ThemedText>Сохраняйте свои интервальные тренировки и запускайте их отсюда.</ThemedText>
        </ThemedView>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/workouts/new')}>
          <ThemedText style={styles.primaryButtonText}>Создать тренировку</ThemedText>
        </Pressable>
      </ThemedView>

      {isLoading ? (
        <ThemedView style={styles.centerState}>
          <ActivityIndicator />
          <ThemedText>Загружаю тренировки...</ThemedText>
        </ThemedView>
      ) : errorMessage ? (
        <ThemedView style={styles.centerState}>
          <ThemedText type="subtitle">Ошибка</ThemedText>
          <ThemedText>{errorMessage}</ThemedText>
          <Pressable style={styles.secondaryButton} onPress={() => void loadWorkouts()}>
            <ThemedText>Попробовать снова</ThemedText>
          </Pressable>
        </ThemedView>
      ) : workouts.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <ThemedText type="subtitle">Пока пусто</ThemedText>
          <ThemedText>
            Создайте первую тренировку. Она сохранится локально и появится в этом списке.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <WorkoutListItem workout={item} />}
        />
      )}
    </ThemedView>
  );
}

function WorkoutListItem({ workout }: { workout: Workout }) {
  const router = useRouter();
  const timeline = buildTimeline(workout);
  const totalDurationSec = getTotalDurationSec(timeline);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/workouts/${workout.id}/edit`)}>
      <ThemedText type="subtitle">{workout.name}</ThemedText>
      <ThemedText>
        {workout.sets} сетов • {timeline.length} этапов • {formatDuration(totalDurationSec)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 24,
    gap: 24,
  },
  header: {
    gap: 16,
  },
  titleContainer: {
    gap: 8,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyState: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    gap: 8,
    backgroundColor: 'rgba(127, 127, 127, 0.12)',
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    gap: 6,
    backgroundColor: 'rgba(127, 127, 127, 0.12)',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(127, 127, 127, 0.12)',
  },
});
