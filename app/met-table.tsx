import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EXERCISES } from '@/features/calories/exercises';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ExerciseDefinition } from '@/types';

function IntensityTable({
  exercises,
  borderColor,
  surfaceMutedColor,
  mutedTextColor,
}: {
  exercises: ExerciseDefinition[];
  borderColor: string;
  surfaceMutedColor: string;
  mutedTextColor: string;
}) {
  return (
    <View style={[styles.table, { borderColor }]}>
      <View style={[styles.tableRow, { backgroundColor: surfaceMutedColor }]}>
        <ThemedText style={[styles.cellName, styles.headerText]}>Упражнение</ThemedText>
        <ThemedText style={[styles.cellMet, styles.headerText]}>Низкая</ThemedText>
        <ThemedText style={[styles.cellMet, styles.headerText]}>Средняя</ThemedText>
        <ThemedText style={[styles.cellMet, styles.headerText]}>Высокая</ThemedText>
      </View>
      {exercises.map((ex, i) => (
        <View
          key={ex.key}
          style={[
            styles.tableRow,
            i < exercises.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
          ]}>
          <ThemedText style={styles.cellName}>{ex.label}</ThemedText>
          <ThemedText style={[styles.cellMet, { color: mutedTextColor }]}>{ex.met.low}</ThemedText>
          <ThemedText style={[styles.cellMet, { color: mutedTextColor }]}>{ex.met.medium}</ThemedText>
          <ThemedText style={[styles.cellMet, { color: mutedTextColor }]}>{ex.met.high}</ThemedText>
        </View>
      ))}
    </View>
  );
}

function StaticTable({
  exercises,
  borderColor,
  surfaceMutedColor,
  mutedTextColor,
}: {
  exercises: ExerciseDefinition[];
  borderColor: string;
  surfaceMutedColor: string;
  mutedTextColor: string;
}) {
  return (
    <View style={[styles.table, { borderColor }]}>
      <View style={[styles.tableRow, { backgroundColor: surfaceMutedColor }]}>
        <ThemedText style={[styles.cellName, styles.headerText]}>Упражнение</ThemedText>
        <ThemedText style={[styles.cellMetFixed, styles.headerText]}>MET</ThemedText>
      </View>
      {exercises.map((ex, i) => (
        <View
          key={ex.key}
          style={[
            styles.tableRow,
            i < exercises.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
          ]}>
          <ThemedText style={styles.cellName}>{ex.label}</ThemedText>
          <ThemedText style={[styles.cellMetFixed, { color: mutedTextColor }]}>{ex.met.fixed}</ThemedText>
        </View>
      ))}
    </View>
  );
}

export default function MetTableScreen() {
  const borderColor = useThemeColor({}, 'border');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  const dynamic = EXERCISES.filter((e) => e.type === 'dynamic');
  const statics = EXERCISES.filter((e) => e.type === 'static');
  const cardio = EXERCISES.filter((e) => e.type === 'cardio');

  const tableProps = { borderColor, surfaceMutedColor, mutedTextColor };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Справочник MET' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="subtitle">Динамические</ThemedText>
        <IntensityTable exercises={dynamic} {...tableProps} />

        <ThemedText type="subtitle" style={styles.sectionGap}>Статические</ThemedText>
        <StaticTable exercises={statics} {...tableProps} />

        <ThemedText type="subtitle" style={styles.sectionGap}>Кардио</ThemedText>
        <IntensityTable exercises={cardio} {...tableProps} />

        <ThemedText style={[styles.footnote, { color: mutedTextColor }]}>
          Калории = MET × вес (кг) × время (ч). Значения приблизительные.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingBottom: 32,
    gap: 8,
  },
  sectionGap: {
    marginTop: 16,
  },
  table: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerText: {
    fontWeight: '600',
    fontSize: 13,
  },
  cellName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  cellMet: {
    width: 54,
    textAlign: 'center',
    fontSize: 14,
  },
  cellMetFixed: {
    width: 72,
    textAlign: 'center',
    fontSize: 14,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
  },
});
