import { useMemo, useState } from 'react';
import { Alert, Pressable, Modal, FlatList, ScrollView, StyleSheet, TextInput } from 'react-native';

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
import { formatRuCount } from '@/lib/russian-plural';
import type {ExerciseIntensity, User, Workout} from '@/types';
import {EXERCISES, getExerciseByKey} from "@/features/calories/exercises";

const STEP_FORMS = ['этап', 'этапа', 'этапов'] as const;
const INTENSITY_OPTIONS: { key: ExerciseIntensity; label: string }[] = [
  { key: 'low',    label: 'Низкая'   },
  { key: 'medium', label: 'Средняя'  },
  { key: 'high',   label: 'Высокая'  },
];

export type WorkoutFormState = {
  name: string;
  warmupSecText: string;
  workSecText: string;
  restSecText: string;
  setsText: string;
  cooldownSecText: string;
  userId: string|null;
  exerciseKey: string|null;
  intensity: ExerciseIntensity|null;
};

type WorkoutFormProps = {
  initialValue: WorkoutFormState;
  title: string;
  description: string;
  users: User[];
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
  userId: string|null;
  exerciseKey: string|null;
  intensity: ExerciseIntensity|null;
};

export function WorkoutForm({
  initialValue,
  title,
  description,
  submitLabel,
  users,
  isSubmitting,
  onSubmit,
  onDelete,
  isDeleting = false,
}: WorkoutFormProps) {
  const [form, setForm] = useState(initialValue);
  const [openModal, setOpenModal] = useState(false);
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
    const userId = form.userId;

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
      warmupSec: warmupSec,
      workSec: workSec,
      restSec: restSec,
      sets: sets,
      cooldownSec: cooldownSec,
      userId: userId,
      exerciseKey: form.exerciseKey,
      intensity: form.intensity,
    };
  }, [form]);

  const previewTimeline = previewWorkout ? buildTimeline(previewWorkout) : [];
  const totalDurationSec = getTotalDurationSec(previewTimeline);
  const selectedExercise = form.exerciseKey ? getExerciseByKey(form.exerciseKey) : null;

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

    if (form.userId === null) {
      Alert.alert('Выберите пользователя', 'Для тренировки нужно выбрать пользователя.');
      return;
    }

    await onSubmit({
      name: normalizedName,
      warmupSec,
      workSec,
      restSec,
      sets,
      cooldownSec,
      userId: form.userId,
      exerciseKey: form.exerciseKey,
      intensity: form.intensity,
    });
  }

  function updateField<Key extends keyof WorkoutFormState>(key: Key, value: WorkoutFormState[Key]) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  function handleExerciseSelect(key: string | null) {
    const exercise = key ? getExerciseByKey(key) : null;
    updateField('exerciseKey', key);
    if (!exercise?.supportsIntensity) {
      updateField('intensity', null);
    }
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
          <ThemedText type="subtitle">Пользователь</ThemedText>
          {users.length === 0 ? (<ThemedText>Сначала добавьте пользователя в настройках</ThemedText>):
              (
              <ThemedView style={styles.optionsList}>
                {users.map((user) => {
                  const isSelected = form.userId === user.id;

                  return (
                      <Pressable
                          key={user.id}
                          onPress={() => updateField('userId', user.id)}
                          style={[
                            styles.optionCard,
                            {
                              borderColor: isSelected ? '#0a7ea4' : borderColor,
                              backgroundColor: surfaceColor,
                            },
                          ]}>
                        <ThemedText type="subtitle">{user.name}</ThemedText>
                        <ThemedText>{user.weightKg} кг</ThemedText>
                      </Pressable>
                  );
                })}
              </ThemedView>)
          }
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

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Упражнение</ThemedText>
          <Pressable onPress={() => setOpenModal(true)} style={styles.input}>
            <ThemedText>{selectedExercise?.label ?? 'Не выбрано'}</ThemedText>
          </Pressable>
        </ThemedView>
        <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Интенсивность</ThemedText>
        {!selectedExercise ? (<ThemedText>нет</ThemedText>) :
            !selectedExercise?.supportsIntensity ? (<ThemedText>не поддерживается</ThemedText>) :
                (
                    <ThemedView style={[styles.optionsList, styles.intensityRow]}>
                      {INTENSITY_OPTIONS.map((item) => {
                        const isSelected = form.intensity === item.key;
                        return (
                            <Pressable
                                key={item.key}
                                onPress={() => updateField('intensity', item.key)}
                                style={[
                                  styles.intensityButton,
                                  {
                                    borderColor: isSelected ? '#0a7ea4' : borderColor,
                                    backgroundColor: surfaceColor,
                                  },
                                ]}>
                              <ThemedText>{item.label}</ThemedText>
                            </Pressable>
                        );
                      })}

                    </ThemedView>
                )
        }
      </ThemedView>

        <Modal visible={openModal} transparent animationType="slide">
          <Pressable style={styles.backdrop} onPress={() => setOpenModal(false)} />

          <ThemedView style={[styles.sheet, { backgroundColor, borderColor }]}>
            <ThemedView style={[styles.sheetHandle, { backgroundColor: borderColor }]} />

            <ThemedText type="subtitle" style={styles.sheetTitle}>
              Выберите упражнение
            </ThemedText>

            <FlatList
                data={EXERCISES}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                    <Pressable
                        style={[styles.sheetOption, { borderBottomColor: borderColor }]}
                        onPress={() => { handleExerciseSelect(item.key); setOpenModal(false); }}>
                      <ThemedText>{item.label}</ThemedText>
                    </Pressable>
                )}
            />

            <Pressable
                style={styles.sheetOption}
                onPress={() => { handleExerciseSelect(null); setOpenModal(false); }}>
              <ThemedText style={{ color: '#888' }}>Не выбрано</ThemedText>
            </Pressable>
          </ThemedView>
        </Modal>



        <ThemedView style={[styles.summary, { borderColor, backgroundColor: surfaceColor }]}>
          <ThemedText type="subtitle">Сводка</ThemedText>
          <ThemedText>
            Упражнение: {selectedExercise?.label ?? 'Не выбрано'}
          </ThemedText>
          <ThemedText>
            Структура: Разминка - Работа / Отдых x {previewWorkout?.sets ?? '—'} - Заминка
          </ThemedText>
          <ThemedText>Всего: {formatRuCount(previewTimeline.length, STEP_FORMS)}</ThemedText>
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
  optionsList: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  // Полупрозрачный фон поверх экрана.
  // flex: 1 растягивает на весь экран, остальное — затемнение.
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  // Шторка снизу. position: 'absolute' вырывает её из потока,
  // bottom: 0 + left/right: 0 прижимает к низу экрана.
  // borderTopLeftRadius/borderTopRightRadius — скругление только сверху.
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 32, // отступ от home indicator на iPhone
  },
  // Декоративная полоска сверху шторки — стандартный bottom sheet паттерн.
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  sheetTitle: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  // Каждый пункт списка. borderBottomWidth — разделитель между пунктами.
  sheetOption: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,              // каждая кнопка занимает 1/3 строки
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
