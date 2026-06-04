import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState} from 'react';
import {Alert, Pressable, StyleSheet, TextInput} from 'react-native';

import {deleteUser, getUserById, saveUser} from "@/lib/db/users-repository";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {useThemeColor} from "@/hooks/use-theme-color";


export default function EditUserScreen() {
    const db = useSQLiteContext();
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string }>();
    const userId = typeof params.id === 'string' ? params.id : '';
    const [user, setUser] = useState<Awaited<ReturnType<typeof getUserById>>>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState('');
    const [weightKgText, setWeightKgText] = useState('');
    const backgroundColor = useThemeColor({}, 'background');
    const surfaceColor = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');

    useEffect(() => {
        async function loadUser() {
            try {
                setIsLoading(true);
                const loadedUser = await getUserById(db, userId);
                setUser(loadedUser);
            } catch (error) {
                console.error('Failed to load user', error);
                Alert.alert('Ошибка загрузки', 'Не удалось загрузить пользователя.');
            } finally {
                setIsLoading(false);
            }
        }

        void loadUser();
    }, [db, userId]);


    useEffect(() => {
        if (user) {
            setName(user.name);
            setWeightKgText(String(user.weightKg));
        }
    }, [user]);

    function handleChangeWeight(value: string) {
        value = value.replace(/[^0-9]/g, '');
        setWeightKgText(value);
    }

    async function handleSave() {
        if (!user) return;
        try {
            const normalizedName = name.trim();
            const weightKg = parseInt(weightKgText, 10);
            if (!normalizedName || weightKg <= 0 || Number.isNaN(weightKg)) {
                Alert.alert('Заполните имя, укажите корректный вес');
                return;
            }
            setIsSaving(true);
            await saveUser(db, {
                    ...user,
                    name: normalizedName,
                    weightKg: weightKg
                }
            );
            router.back();
        } catch (error) {
            console.error('Failed to save user', error);
            Alert.alert('Ошибка сохранения', 'Не удалось сохранить пользователя.');
        } finally {
            setIsSaving(false);
        }
    }

    function handleDelete() {
        Alert.alert('Удалить пользователя?', 'Это действие нельзя отменить.', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Удалить', style: 'destructive', onPress: () => void confirmDelete() },
        ]);
    }

    async function confirmDelete() {
        if (!user) return;
        try {
            await deleteUser(db, user.id);
            router.back();
        } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (message.includes('FOREIGN KEY')) {
                Alert.alert('Нельзя удалить', 'У этого пользователя есть тренировки. Сначала удалите их.');
            } else {
                Alert.alert('Ошибка', 'Не удалось удалить пользователя.');
            }
        }
    }

    return (
        <>
            <Stack.Screen options={{title: 'Редактирование пользователя'}}/>

            {isLoading ? (
                <ThemedView style={styles.centerState}>
                    <ThemedText>Загружаю...</ThemedText>
                </ThemedView>
            ) : !user ? (
                <ThemedView style={styles.centerState}>
                    <ThemedText>Пользователь не найден</ThemedText>
                </ThemedView>
            ) : (

            <ThemedView style={[styles.container, {backgroundColor}]}>
                <ThemedView style={styles.header}>
                    <ThemedText type="title">Редактирование пользователя</ThemedText>
                    <ThemedText>Вес влияет на расчет калорий.</ThemedText>
                </ThemedView>

                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle">Имя</ThemedText>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Например, Даша"
                        placeholderTextColor={mutedTextColor}
                        style={[
                            styles.input,
                            {
                                borderColor,
                                backgroundColor: surfaceColor,
                                color: textColor,
                            },
                        ]}
                    />
                </ThemedView>

                <ThemedView style={styles.section}>
                    <ThemedText type="subtitle">Вес</ThemedText>
                    <TextInput
                        value={weightKgText}
                        onChangeText={handleChangeWeight}
                        placeholder="Например, 60"
                        placeholderTextColor={mutedTextColor}
                        keyboardType="numeric"
                        style={[
                            styles.input,
                            {
                                borderColor,
                                backgroundColor: surfaceColor,
                                color: textColor,
                            },
                        ]}
                    />
                </ThemedView>

                <Pressable
                    style={[styles.primaryButton, isSaving ? styles.primaryButtonDisabled : undefined]}
                    onPress={() => void handleSave()}
                    disabled={isSaving}>
                    <ThemedText style={styles.primaryButtonText}>
                        {isSaving ? 'Сохраняю...' : 'Сохранить'}
                    </ThemedText>
                </Pressable>

                <Pressable
                    style={[styles.deleteButton, {backgroundColor: surfaceColor}]}
                    onPress={() => void handleDelete()}>
                    <ThemedText style={styles.deleteButtonText}>
                        Удалить пользователя
                    </ThemedText>
                </Pressable>
            </ThemedView>
            )}
        </>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 72,
        gap: 24,
    },
    header: {
        gap: 8,
    },
    section: {
        gap: 12,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    },
    primaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#0a7ea4',
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
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
    deleteButtonText: {
        color: '#d64545',
        fontWeight: '600',
    },
});