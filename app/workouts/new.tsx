import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { buildTimeline, getTotalDurationSec } from '@/features/workouts/model';
import { saveWorkout } from '@/lib/db';
import { formatDuration } from '@/lib/format-duration';
import {
  parseNonNegativeInteger,
  parsePositiveInteger,
  sanitizeNumericText,
} from '@/lib/number-input';
import type { Workout } from '@/types';

type WorkoutFormState = {
  name: string;
  warmupSecText: string;
  workSecText: string;
  restSecText: string;
  setsText: string;
  cooldownSecText: string;
};

const INITIAL_FORM_STATE: WorkoutFormState = {
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
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);

  const previewWorkout = useMemo<Workout | null>(() => {
    const normalizedName = form.name.trim();
    const warmupSec = parseNonNegativeInteger(form.warmupSecText);
    const workSec = parsePositiveInteger(form.workSecText);
    const restSec = parsePositiveInteger(form.restSecText);
    const sets = parsePositiveInteger(form.setsText);
    const cooldownSec = parseNonNegativeInteger(form.cooldownSecText);

    if (
      normalizedName.length === 0 ||
      warmupSec === null ||
      workSec === null ||
      restSec === null ||
      sets === null ||
      cooldownSec === null
    ) {
      return null;
    }

    return {
      id: 'preview',
      name: normalizedName,
      createdAt: Date.now(),
      warmupSec,
      workSec,
      restSec,
      sets,
      cooldownSec,
    };
  }, [form]);

  const previewTimeline = previewWorkout ? buildTimeline(previewWorkout) : [];
  const totalDurationSec = getTotalDurationSec(previewTimeline);

  async function handleSave() {
    const normalizedName = form.name.trim();
    const warmupSec = parseNonNegativeInteger(form.warmupSecText);
    const workSec = parsePositiveInteger(form.workSecText);
    const restSec = parsePositiveInteger(form.restSecText);
    const sets = parsePositiveInteger(form.setsText);
    const cooldownSec = parseNonNegativeInteger(form.cooldownSecText);

    if (normalizedName.length === 0) {
      Alert.alert('Нужно название', 'Введите название тренировки.');
      return;
    }

    if (warmupSec === null || cooldownSec === null) {
      Alert.alert('Некорректное значение', 'Разминка и заминка должны быть 0 или больше.');
      return;
    }

    if (workSec === null || restSec === null) {
      Alert.alert('Некорректное значение', 'Работа и отдых должны быть больше 0 секунд.');
      return;
    }

    if (sets === null) {
      Alert.alert('Некорректное значение', 'Количество сетов должно быть больше 0.');
      return;
    }

    setIsSaving(true);

    try {
      await saveWorkout(db, {
        id: createId('workout'),
        name: normalizedName,
        createdAt: Date.now(),
        warmupSec,
        workSec,
        restSec,
        sets,
        cooldownSec,
      });

      router.back();
    } catch (error) {
      console.error('Failed to save workout', error);
      Alert.alert('Ошибка сохранения', 'Не удалось сохранить тренировку.');
    } finally {
      setIsSaving(false);
    }
  }

  function updateField<Key extends keyof WorkoutFormState>(key: Key, value: WorkoutFormState[Key]) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Новая тренировка' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.section}>
            <ThemedText type="title">Новая тренировка</ThemedText>
            <ThemedText>Укажите разминку, рабочий цикл и заминку.</ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Название</ThemedText>
            <TextInput
              value={form.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Например, Табата 8 сетов"
              style={styles.input}
            />
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Разминка</ThemedText>
            <DurationField
              label="Длительность в секундах"
              value={form.warmupSecText}
              onChangeText={(value) => updateField('warmupSecText', sanitizeNumericText(value))}
              placeholder="0"
            />
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Основной цикл</ThemedText>
            <ThemedView style={styles.card}>
              <DurationField
                label="Работа, сек"
                value={form.workSecText}
                onChangeText={(value) => updateField('workSecText', sanitizeNumericText(value))}
                placeholder="20"
              />

              <DurationField
                label="Отдых, сек"
                value={form.restSecText}
                onChangeText={(value) => updateField('restSecText', sanitizeNumericText(value))}
                placeholder="10"
              />

              <DurationField
                label="Сетов, шт"
                value={form.setsText}
                onChangeText={(value) => updateField('setsText', sanitizeNumericText(value))}
                placeholder="8"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Заминка</ThemedText>
            <DurationField
              label="Длительность в секундах"
              value={form.cooldownSecText}
              onChangeText={(value) => updateField('cooldownSecText', sanitizeNumericText(value))}
              placeholder="0"
            />
          </ThemedView>

          <ThemedView style={styles.summary}>
            <ThemedText type="subtitle">Сводка</ThemedText>
            <ThemedText>
              Структура: Разминка - Работа / Отдых x {previewWorkout?.sets ?? '—'} - Заминка
            </ThemedText>
            <ThemedText>Этапов всего: {previewTimeline.length}</ThemedText>
            <ThemedText>
              Общая длительность: {previewWorkout ? formatDuration(totalDurationSec) : 'заполните форму'}
            </ThemedText>
          </ThemedView>

          <Pressable
            style={[styles.primaryButton, isSaving ? styles.primaryButtonDisabled : undefined]}
            onPress={() => void handleSave()}
            disabled={isSaving}>
            <ThemedText style={styles.primaryButtonText}>
              {isSaving ? 'Сохраняю...' : 'Сохранить тренировку'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </>
  );
}

function DurationField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <ThemedView style={styles.field}>
      <ThemedText>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholder={placeholder}
        style={styles.input}
      />
    </ThemedView>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#ffffff',
  },
  container: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  card: {
    padding: 16,
    borderRadius: 8,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.18)',
    backgroundColor: '#ffffff',
  },
  summary: {
    padding: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.18)',
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
