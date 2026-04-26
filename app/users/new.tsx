import {Stack, useRouter} from 'expo-router';
import {useSQLiteContext} from 'expo-sqlite';
import {useState} from 'react';
import {Alert, Pressable, StyleSheet, TextInput} from 'react-native';

import {ThemedText} from '@/components/themed-text';
import {ThemedView} from '@/components/themed-view';
import {useThemeColor} from '@/hooks/use-theme-color';

import {User} from "@/types";
import {saveUser} from "@/lib/db/users-repository";

export default function NewUserScreen() {
    const db = useSQLiteContext();
    const router = useRouter();

    const [name, setName] = useState('');
    const [weightKgText, setWeightKgText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const backgroundColor = useThemeColor({}, 'background');
    const surfaceColor = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
    const mutedTextColor = useThemeColor({}, 'mutedText');

    async function handleSave() {
        try {
            setIsSaving(true);

            const normalizedName = name.trim();
            const weightKg = parseInt(weightKgText, 10);
            if (!normalizedName || weightKg <= 0 || Number.isNaN(weightKg)) {
                Alert.alert('Заполните имя, укажите корректный вес');
                return;
            }

            const user: User = {
                id: createId('user'),
                name: normalizedName,
                weightKg: weightKg,
                createdAt: Date.now()
            };
            await saveUser(db, user);
            router.back();
        } catch (error) {
            console.error('Failed to save user', error);
            Alert.alert('Ошибка сохранения', 'Не удалось сохранить пользователя.');
        } finally {
            setIsSaving(false);
        }
    }

    function handleChangeWeight(value: string) {
        value = value.replace(/[^0-9]/g, '');
        setWeightKgText(value);
    }

    return (
        <>
            <Stack.Screen options={{title: 'Новый пользователь'}}/>

            <ThemedView style={[styles.container, {backgroundColor}]}>
                <ThemedView style={styles.header}>
                    <ThemedText type="title">Новый пользователь</ThemedText>
                    <ThemedText>Введите имя и вес для расчета калорий.</ThemedText>
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
            </ThemedView>
        </>
    );
}

function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
});