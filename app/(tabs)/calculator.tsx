import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EXERCISES } from '@/features/calories/exercises';
import { useThemeColor } from '@/hooks/use-theme-color';
import { listUsers } from '@/lib/db/users-repository';
import type { ExerciseDefinition, ExerciseIntensity, User } from '@/types';

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

const INTENSITY_OPTIONS: { key: ExerciseIntensity; label: string }[] = [
  { key: 'low', label: 'Низкая' },
  { key: 'medium', label: 'Средняя' },
  { key: 'high', label: 'Высокая' },
];

const EXERCISE_SECTIONS = [
  { title: 'Динамические', data: EXERCISES.filter((e) => e.type === 'dynamic') },
  { title: 'Статические', data: EXERCISES.filter((e) => e.type === 'static') },
  { title: 'Кардио', data: EXERCISES.filter((e) => e.type === 'cardio') },
];

export default function CalculatorScreen() {
  const db = useSQLiteContext();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [weightText, setWeightText] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);
  const [durationText, setDurationText] = useState('');
  const [intensity, setIntensity] = useState<ExerciseIntensity>('medium');
  const [pickerVisible, setPickerVisible] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const loaded = await listUsers(db);
          setUsers(loaded);
          if (loaded.length === 1 && !weightText) {
            setWeightText(String(loaded[0].weightKg));
            setSelectedUserId(loaded[0].id);
          }
        } catch {}
      }
      void load();
    }, [db])
  );

  function handleUserChip(user: User) {
    setSelectedUserId(user.id);
    setWeightText(String(user.weightKg));
  }

  function handleWeightChange(text: string) {
    setWeightText(text);
    setSelectedUserId(null);
  }

  function handleSelectExercise(exercise: ExerciseDefinition) {
    setSelectedExercise(exercise);
    if (!exercise.supportsIntensity) {
      setIntensity('medium');
    }
    setPickerVisible(false);
  }

  const weightKg = parseFloat(weightText.replace(',', '.'));

  const met = useMemo(() => {
    if (!selectedExercise) return null;
    if (selectedExercise.type === 'static') return selectedExercise.met.fixed ?? null;
    return selectedExercise.met[intensity] ?? null;
  }, [selectedExercise, intensity]);

  const durationMin = useMemo(() => {
    const n = parseInt(durationText, 10);
    return !isNaN(n) && n > 0 ? n : null;
  }, [durationText]);

  const calories = useMemo(() => {
    if (met === null || durationMin === null || isNaN(weightKg) || weightKg <= 0) return null;
    return met * weightKg * (durationMin / 60);
  }, [met, weightKg, durationMin]);

  const isComplete = calories !== null;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Калькулятор</ThemedText>
        <ThemedText>Расчёт калорий без таймера</ThemedText>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>

        {/* User chips — only when multiple profiles */}
        {users.length > 1 && (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold">Профиль</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {users.map((u) => {
                const active = selectedUserId === u.id;
                return (
                  <Pressable
                    key={u.id}
                    style={[styles.chip, { borderColor }, active && styles.chipActive]}
                    onPress={() => handleUserChip(u)}>
                    <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                      {u.name} · {u.weightKg} кг
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </ThemedView>
        )}

        {/* Weight */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Вес</ThemedText>
          <ThemedView style={[styles.inputRow, { borderColor, backgroundColor: surfaceColor }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={weightText}
              onChangeText={handleWeightChange}
              keyboardType="decimal-pad"
              placeholder="70"
              placeholderTextColor={mutedTextColor}
              returnKeyType="done"
            />
            <ThemedText style={{ color: mutedTextColor }}>кг</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Exercise */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Упражнение</ThemedText>
          <Pressable
            style={[styles.pickerButton, { borderColor, backgroundColor: surfaceColor }]}
            onPress={() => setPickerVisible(true)}>
            <ThemedText style={!selectedExercise ? { color: mutedTextColor } : undefined}>
              {selectedExercise ? selectedExercise.label : 'Выбрать упражнение...'}
            </ThemedText>
            <ThemedText style={{ color: mutedTextColor }}>▾</ThemedText>
          </Pressable>
        </ThemedView>

        {/* Intensity */}
        {selectedExercise?.supportsIntensity && (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold">Интенсивность</ThemedText>
            <ThemedView style={styles.chipRow}>
              {INTENSITY_OPTIONS.map((opt) => {
                const active = intensity === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    style={[styles.chip, { borderColor }, active && styles.chipActive]}
                    onPress={() => setIntensity(opt.key)}>
                    <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>
          </ThemedView>
        )}

        {/* Duration */}
        <ThemedView style={styles.section}>
          <ThemedText type="defaultSemiBold">Длительность</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {DURATION_OPTIONS.map((min) => {
              const active = durationMin === min;
              return (
                <Pressable
                  key={min}
                  style={[styles.chip, { borderColor }, active && styles.chipActive]}
                  onPress={() => setDurationText(String(min))}>
                  <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                    {min} мин
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
          <ThemedView style={[styles.inputRow, { borderColor, backgroundColor: surfaceColor }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={durationText}
              onChangeText={setDurationText}
              keyboardType="number-pad"
              placeholder="другое"
              placeholderTextColor={mutedTextColor}
              returnKeyType="done"
            />
            <ThemedText style={{ color: mutedTextColor }}>мин</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Result */}
        <ThemedView
          style={[
            styles.result,
            { backgroundColor: isComplete ? '#0a7ea415' : surfaceMutedColor },
          ]}>
          {isComplete ? (
            <>
              <ThemedText style={styles.resultLabel}>Сожжено калорий</ThemedText>
              <ThemedText style={styles.resultValue}>~{Math.round(calories!)} ккал</ThemedText>
              {met !== null && (
                <ThemedText style={[styles.resultMeta, { color: mutedTextColor }]}>
                  MET {met} · {weightKg} кг · {durationMin} мин
                </ThemedText>
              )}
            </>
          ) : (
            <ThemedText style={{ color: mutedTextColor, textAlign: 'center' }}>
              Заполните все поля для расчёта
            </ThemedText>
          )}
        </ThemedView>
      </ScrollView>

      {/* Exercise picker modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}>
        <ThemedView style={[styles.modalContainer, { backgroundColor }]}>
          <ThemedView style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <ThemedText type="subtitle">Упражнение</ThemedText>
            <Pressable onPress={() => setPickerVisible(false)}>
              <ThemedText style={styles.modalClose}>Закрыть</ThemedText>
            </Pressable>
          </ThemedView>
          <SectionList
            sections={EXERCISE_SECTIONS}
            keyExtractor={(item) => item.key}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
              <ThemedView style={[styles.modalSectionHeader, { backgroundColor: surfaceMutedColor }]}>
                <ThemedText type="defaultSemiBold">{section.title}</ThemedText>
              </ThemedView>
            )}
            renderItem={({ item }) => {
              const active = selectedExercise?.key === item.key;
              return (
                <Pressable
                  style={[styles.modalItem, { borderBottomColor: borderColor }]}
                  onPress={() => handleSelectExercise(item)}>
                  <ThemedText style={active ? styles.modalItemActive : undefined}>
                    {item.label}
                  </ThemedText>
                  {active && <ThemedText style={styles.modalItemActive}>✓</ThemedText>}
                </Pressable>
              );
            }}
          />
        </ThemedView>
      </Modal>
    </ThemedView>
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
  titleContainer: {
    gap: 8,
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 32,
  },
  section: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  chipText: {
    fontSize: 14,
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  result: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  resultLabel: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
  },
  resultMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalClose: {
    color: '#0a7ea4',
    fontSize: 16,
  },
  modalSectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalItemActive: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
});
