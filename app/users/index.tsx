  import {Stack, useFocusEffect, useRouter} from 'expo-router';
  import { useSQLiteContext } from 'expo-sqlite';
  import { useCallback, useState } from 'react';
  import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

  import { ThemedText } from '@/components/themed-text';
  import { ThemedView } from '@/components/themed-view';
  import { useThemeColor } from '@/hooks/use-theme-color';
  import { listUsers } from '@/lib/db/users-repository';
  import type { User } from '@/types';
  import {IconSymbol} from "@/components/ui/icon-symbol";

  export default function UsersScreen() {
    const db = useSQLiteContext();
    const router = useRouter();
    const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
      try {
        setErrorMessage(null);
        const nextUsers = await listUsers(db);
        setUsers(nextUsers);
      } catch (error) {
        console.error('Failed to load users', error);
        setErrorMessage('Не удалось загрузить пользователей.');
      } finally {
        setIsLoading(false);
      }
    }, [db]);

    useFocusEffect(
      useCallback(() => {
        setIsLoading(true);
        void loadUsers();
      }, [loadUsers])
    );

    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Пользователи' }} />
        <ThemedView style={styles.header}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Пользователи</ThemedText>
          </ThemedView>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/users/new')}>
            <ThemedText style={styles.primaryButtonText}>Добавить</ThemedText>
          </Pressable>
        </ThemedView>

        {isLoading ? (
          <ThemedView style={styles.centerState}>
            <ActivityIndicator />
            <ThemedText>Загружаю пользователей...</ThemedText>
          </ThemedView>
        ) : errorMessage ? (
          <ThemedView style={styles.centerState}>
            <ThemedText type="subtitle">Ошибка</ThemedText>
            <ThemedText>{errorMessage}</ThemedText>
            <Pressable style={styles.secondaryButton} onPress={() => void loadUsers()}>
              <ThemedText>Попробовать снова</ThemedText>
            </Pressable>
          </ThemedView>
        ) : users.length === 0 ? (
          <ThemedView style={[styles.emptyState, { backgroundColor: surfaceMutedColor }]}>
            <ThemedText type="subtitle">Пока пусто</ThemedText>
            <ThemedText>
              Добавьте первого пользователя, чтобы потом выбирать его в тренировке.
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <UserListItem user={item} />}
          />
        )}
      </ThemedView>
    );
  }

  function UserListItem({ user }: { user: User }) {
    const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');
    const surfaceColor = useThemeColor({}, 'surface');

    const router = useRouter();
    return (
      <ThemedView style={[styles.card, { backgroundColor: surfaceMutedColor }]}>
        <ThemedView style={styles.cardContent}>
          <ThemedText type="subtitle">{user.name}</ThemedText>
          <ThemedText>{user.weightKg} кг</ThemedText>
        </ThemedView>
        <Pressable
            style={[styles.editButton, { backgroundColor: surfaceColor }]}
            onPress={() => router.push(`/users/${user.id}/edit`)}>
          <IconSymbol name="square.and.pencil" size={20} color="#0a7ea4" />
        </Pressable>
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
    header: {
      gap: 16,
    },
    titleContainer: {
      gap: 8,
    },
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    emptyState: {
      marginTop: 12,
      padding: 16,
      borderRadius: 8,
      gap: 8,
    },
    listContent: {
      gap: 12,
      paddingBottom: 24,
    },
    card: {
      padding: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    cardContent: {
      gap: 6,
      flex: 1,
      backgroundColor: 'transparent'
    },
    primaryButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: '#0a7ea4',
    },
    primaryButtonText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    secondaryButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    },
    editButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
    },
  });