import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WorkoutForm } from '@/features/workouts/workout-form';
import { deleteWorkout, getWorkoutById, saveWorkout } from '@/lib/db';

export default function EditWorkoutScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = typeof params.id === 'string' ? params.id : '';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [workout, setWorkout] = useState<Awaited<ReturnType<typeof getWorkoutById>>>(null);

  useEffect(() => {
    async function loadWorkout() {
      try {
        const loadedWorkout = await getWorkoutById(db, workoutId);
        setWorkout(loadedWorkout);
      } catch (error) {
        console.error('Failed to load workout', error);
        Alert.alert('Ошибка загрузки', 'Не удалось открыть тренировку.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadWorkout();
  }, [db, workoutId]);

  const initialValue = useMemo(() => {
    if (!workout) {
      return null;
    }

    return {
      name: workout.name,
      warmupSecText: String(workout.warmupSec),
      workSecText: String(workout.workSec),
      restSecText: String(workout.restSec),
      setsText: String(workout.sets),
      cooldownSecText: String(workout.cooldownSec),
    };
  }, [workout]);

  async function handleSave(workoutInput: {
    name: string;
    warmupSec: number;
    workSec: number;
    restSec: number;
    sets: number;
    cooldownSec: number;
  }) {
    if (!workout) {
      return;
    }

    setIsSaving(true);

    try {
      await saveWorkout(db, {
        ...workout,
        ...workoutInput,
      });

      router.back();
    } catch (error) {
      console.error('Failed to update workout', error);
      Alert.alert('Ошибка сохранения', 'Не удалось сохранить изменения.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!workout) {
      return;
    }

    Alert.alert('Удалить тренировку?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void confirmDelete();
        },
      },
    ]);
  }

  async function confirmDelete() {
    if (!workout) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteWorkout(db, workout.id);
      router.back();
    } catch (error) {
      console.error('Failed to delete workout', error);
      Alert.alert('Ошибка удаления', 'Не удалось удалить тренировку.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Редактировать тренировку' }} />

      {isLoading ? (
        <ThemedView style={styles.centerState}>
          <ThemedText>Загружаю тренировку...</ThemedText>
        </ThemedView>
      ) : !initialValue ? (
        <ThemedView style={styles.centerState}>
          <ThemedText type="subtitle">Тренировка не найдена</ThemedText>
          <ThemedText>Возможно, она уже была удалена.</ThemedText>
        </ThemedView>
      ) : (
        <WorkoutForm
          initialValue={initialValue}
          title="Редактировать тренировку"
          description=""
          submitLabel="Сохранить изменения"
          isSubmitting={isSaving}
          onSubmit={handleSave}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

const styles = {
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
} as const;
