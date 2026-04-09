import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert } from 'react-native';

import { WorkoutForm } from '@/features/workouts/workout-form';
import { saveWorkout } from '@/lib/db';

const INITIAL_FORM_STATE = {
  name: '',
  warmupSecText: '10',
  workSecText: '30',
  restSecText: '30',
  setsText: '8',
  cooldownSecText: '0',
};

export default function NewWorkoutScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(workoutInput: {
    name: string;
    warmupSec: number;
    workSec: number;
    restSec: number;
    sets: number;
    cooldownSec: number;
  }) {
    setIsSaving(true);

    try {
      await saveWorkout(db, {
        id: createId('workout'),
        createdAt: Date.now(),
        ...workoutInput,
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
      <Stack.Screen options={{ title: 'Новая тренировка' }} />

      <WorkoutForm
        initialValue={INITIAL_FORM_STATE}
        title="Новая тренировка"
        description="Укажите разминку, рабочий цикл и заминку."
        submitLabel="Сохранить тренировку"
        isSubmitting={isSaving}
        onSubmit={handleCreate}
      />
    </>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
