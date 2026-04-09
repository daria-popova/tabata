import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getSoundEnabled, setSoundEnabled } from '@/lib/settings/sound-settings';

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        try {
          const enabled = await getSoundEnabled();
          setSoundEnabledState(enabled);
        } finally {
          setIsLoading(false);
        }
      }

      setIsLoading(true);
      void loadSettings();
    }, [])
  );

  async function handleToggleSound(nextValue: boolean) {
    setSoundEnabledState(nextValue);

    try {
      await setSoundEnabled(nextValue);
    } catch (error) {
      console.error('Failed to save sound setting', error);
      setSoundEnabledState((currentValue) => !currentValue);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Настройки</ThemedText>
        <ThemedText>Управляйте звуковыми сигналами таймера.</ThemedText>
      </ThemedView>

      {isLoading ? (
        <ThemedView style={styles.centerState}>
          <ActivityIndicator />
        </ThemedView>
      ) : (
        <Pressable
          style={[styles.settingCard, { borderColor, backgroundColor: surfaceColor }]}
          onPress={() => void handleToggleSound(!soundEnabled)}>
          <ThemedView style={styles.settingText}>
            <ThemedText type="subtitle">Звук таймера</ThemedText>
            <ThemedText>Сигналы на старте работы и отдыха.</ThemedText>
          </ThemedView>
          <Switch value={soundEnabled} onValueChange={(value) => void handleToggleSound(value)} />
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 72,
    gap: 24,
  },
  titleContainer: {
    gap: 8,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingText: {
    flex: 1,
    gap: 4,
  },
});
