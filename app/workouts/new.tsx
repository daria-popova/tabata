import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NewWorkoutScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Новая тренировка' }} />

      <ThemedView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="title">Новая тренировка</ThemedText>
          <ThemedText>
            Здесь будет форма создания тренировки: название, этапы и сохранение в SQLite.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    gap: 8,
  },
});
