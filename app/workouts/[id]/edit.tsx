import { Pressable, Alert, StyleSheet } from 'react-native';
import {Stack, useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {useCallback, useEffect, useMemo, useState} from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WorkoutForm, WorkoutFormInput } from '@/features/workouts/workout-form';
import { deleteWorkout, getWorkoutById, saveWorkout } from '@/lib/db';
import { User} from "@/types";
import {listUsers} from "@/lib/db/users-repository";

export default function EditWorkoutScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = typeof params.id === 'string' ? params.id : '';
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [workout, setWorkout] = useState<Awaited<ReturnType<typeof getWorkoutById>>>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setErrorMessage(null);
      const nextUsers = await listUsers(db);
      setUsers(nextUsers);
    } catch (error) {
      console.error('Failed to load workouts', error);
      setErrorMessage('Не удалось загрузить пользователей.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [db])

  useFocusEffect(useCallback(() => {
    void loadUsers();
  }, [loadUsers]));


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
      userId: workout.userId,
      exerciseKey: workout.exerciseKey,
      intensity: workout.intensity
    };
  }, [workout]);

  async function handleSave(workoutInput: WorkoutFormInput) {
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
      <Stack.Screen
        options={{
          title: 'Редактировать тренировку',
          headerRight: () =>
            workout ? (
              <Pressable onPress={() => router.push(`/workouts/${workout.id}/timer`)}>
                <ThemedText type="defaultSemiBold">Запустить</ThemedText>
              </Pressable>
            ) : null,
        }}
      />

      {isLoading ? (
        <ThemedView style={styles.centerState}>
          <ThemedText>Загружаю тренировку...</ThemedText>
        </ThemedView>
      )  : isLoadingUsers ? (
          <ThemedView><ThemedText>Загрузка пользователей...</ThemedText></ThemedView>
      ): !initialValue ? (
        <ThemedView style={styles.centerState}>
          <ThemedText type="subtitle">Тренировка не найдена</ThemedText>
          <ThemedText>Возможно, она уже была удалена.</ThemedText>
        </ThemedView>
      ) : (
        <WorkoutForm
          initialValue={initialValue}
          title="Редактировать тренировку"
          description=""
          users={users}
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

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});
