import type {SQLiteDatabase} from 'expo-sqlite';

import type {User} from '@/types';

interface UserRow {
    id: string;
    name: string;
    weight_kg: number;
    created_at: number;
}


export async function listUsers(db: SQLiteDatabase): Promise<User[]> {
    const UserRows: UserRow[] = await db.getAllAsync('select id, name, weight_kg, created_at from users order by created_at desc');

    return UserRows.map(mapUserRow);
}


export async function getUserById(db: SQLiteDatabase, userId: string): Promise<User | null> {
    const UserRow: UserRow | null | undefined = await db.getFirstAsync(`select id, name, weight_kg, created_at
                                                                        from users
                                                                        where id = ?`, [userId]);

    return UserRow ? mapUserRow(UserRow) : null;
}

export async function saveUser(db: SQLiteDatabase, user: User): Promise<void> {
    await db.runAsync(`insert into users (id, name, weight_kg, created_at)
                       values (?, ?, ?, ?) on conflict (id) do update set
                       name = excluded.name,
                       weight_kg = excluded.weight_kg,
                       created_at = excluded.created_at`, [user.id, user.name, user.weightKg, user.createdAt]);
}

export async function deleteUser(db: SQLiteDatabase, userId: string): Promise<void> {
    await db.runAsync('DELETE FROM users WHERE id = ?', userId);
}

function mapUserRow(row: UserRow): User {
    return {
        id: row.id,
        name: row.name,
        weightKg: row.weight_kg,
        createdAt: row.created_at,
    };
}
