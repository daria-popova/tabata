import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION } from '@/lib/db/constants';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS phases (
        id TEXT PRIMARY KEY NOT NULL,
        workout_id TEXT NOT NULL,
        type TEXT NOT NULL,
        duration_sec INTEGER NOT NULL CHECK (duration_sec > 0),
        position INTEGER NOT NULL,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_phases_workout_id_position
      ON phases (workout_id, position);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
