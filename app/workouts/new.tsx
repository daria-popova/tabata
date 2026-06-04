import {Stack, useFocusEffect, useRouter} from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {useCallback, useState} from 'react';
import {Alert, StyleSheet} from 'react-native';

import { WorkoutForm, WorkoutFormInput } from '@/features/workouts/workout-form';
import {saveWorkout} from '@/lib/db';
import {User} from "@/types";
import {listUsers} from "@/lib/db/users-repository";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";

const INITIAL_FORM_STATE = {
  name: '',
  warmupSecText: '10',
  workSecText: '30',
  restSecText: '30',
  setsText: '8',
  cooldownSecText: '0',
  userId: null,
  exerciseKey: null,
  intensity: null,
};

export default function NewWorkoutScreen() {
    const db = useSQLiteContext();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    const loadUsers = useCallback(async () => {
        try {
            setErrorMessage(null);
            const nextUsers = await listUsers(db);
            setUsers(nextUsers);
        } catch (error) {
            console.error('Failed to load users', error);
            setErrorMessage('Не удалось загрузить пользователей.');
        } finally {
            setIsLoadingUsers(false);
        }
    }, [db])

    useFocusEffect(useCallback(() => {
        void loadUsers();
    }, [loadUsers]));

  async function handleCreate(workoutInput: WorkoutFormInput) {
    setIsSaving(true);

    try {
      await saveWorkout(db, {
        id: createId('workout'),
        createdAt: Date.now(),
        ...workoutInput
      });

      router.back();
    } catch (error) {
      console.error('Failed to save workout', error);
      Alert.alert('Ошибка сохранения', 'Не удалось сохранить тренировку.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
        <Stack.Screen options={{title: 'Новая тренировка'}}/>

        {errorMessage ? (
                <ThemedView style={styles.centerState}>
                    <ThemedText type="subtitle">Ошибка</ThemedText>
                    <ThemedText>{errorMessage}</ThemedText>
                </ThemedView>
            ) : isLoadingUsers ? (
                <ThemedView style={styles.centerState}><ThemedText>Загрузка пользователей...</ThemedText></ThemedView>
            ) : users.length === 0?(
                <ThemedView style={styles.centerState}>
                    <ThemedText type="subtitle">Нет доступных пользователей</ThemedText>
                    <ThemedText>Добавьте их в настройках</ThemedText>
                </ThemedView>
            ):
            (
                <WorkoutForm
                    initialValue={INITIAL_FORM_STATE}
                    title="Новая тренировка"
                    users={users}
                    description="Укажите разминку, рабочий цикл и заминку."
                    submitLabel="Сохранить тренировку"
                    isSubmitting={isSaving}
                    onSubmit={handleCreate}
                />
            )}


    </>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
