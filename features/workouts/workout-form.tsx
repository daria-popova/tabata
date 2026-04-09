import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { buildTimeline, getTotalDurationSec } from '@/features/workouts/model';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatDuration } from '@/lib/format-duration';
import {
  parseNonNegativeInteger,
  parsePositiveInteger,
  sanitizeNumericText,
} from '@/lib/number-input';
import type { Workout } from '@/types';

export type WorkoutFormState = {
  name: string;
  warmupSecText: string;
  workSecText: string;
  restSecText: string;
  setsText: string;
  cooldownSecText: string;
};

type WorkoutFormProps = {
  initialValue: WorkoutFormState;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (workoutInput: WorkoutFormInput) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  isDeleting?: boolean;
};

export type WorkoutFormInput = {
  name: string;
  warmupSec: number;
  workSec: number;
  restSec: number;
  sets: number;
  cooldownSec: number;
};

export function WorkoutForm({
  initialValue,
  title,
  description,
  submitLabel,
  isSubmitting,
  onSubmit,
  onDelete,
  isDeleting = false,
}: WorkoutFormProps) {
  const [form, setForm] = useState(initialValue);
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');

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
      createdAt: 0,
      warmupSec,
      workSec,
      restSec,
      sets,
      cooldownSec,
    };
  }, [form]);

  const previewTimeline = previewWorkout ? buildTimeline(previewWorkout) : [];
  const totalDurationSec = getTotalDurationSec(previewTimeline);

  async function handleSubmit() {
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

    await onSubmit({
      name: normalizedName,
      warmupSec,
      workSec,
      restSec,
      sets,
      cooldownSec,
    });
  }

  function updateField<Key extends keyof WorkoutFormState>(key: Key, value: WorkoutFormState[Key]) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.section}>
          <ThemedText type="title">{title}</ThemedText>
          <ThemedText>{description}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Название</ThemedText>
          <TextInput
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Например, Табата 8 сетов"
            placeholderTextColor={mutedTextColor}
            style={[styles.input, { borderColor, backgroundColor: surfaceColor, color: textColor }]}
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
          <ThemedView style={[styles.card, { borderColor, backgroundColor: surfaceColor }]}>
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

        <ThemedView style={[styles.summary, { borderColor, backgroundColor: surfaceColor }]}>
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
          style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : undefined]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting || isDeleting}>
          <ThemedText style={styles.primaryButtonText}>
            {isSubmitting ? 'Сохраняю...' : submitLabel}
          </ThemedText>
        </Pressable>

        {onDelete ? (
          <Pressable
            style={[
              styles.deleteButton,
              { backgroundColor: surfaceColor },
              isDeleting ? styles.primaryButtonDisabled : undefined,
            ]}
            onPress={() => void onDelete()}
            disabled={isSubmitting || isDeleting}>
            <ThemedText style={styles.deleteButtonText}>
              {isDeleting ? 'Удаляю...' : 'Удалить тренировку'}
            </ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
    </ScrollView>
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
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  return (
    <ThemedView style={styles.field}>
      <ThemedText>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={mutedTextColor}
        style={[styles.input, { borderColor, backgroundColor: surfaceColor, color: textColor }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    gap: 16,
    borderWidth: 1,
  },
  summary: {
    padding: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d64545',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#d64545',
    fontWeight: '600',
  },
});
