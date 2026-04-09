import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION } from '@/lib/db/constants';
import type { PhaseType } from '@/types';

interface LegacyWorkoutRow {
  id: string;
  name: string;
  created_at: number;
}

interface LegacyPhaseRow {
  id: string;
  workout_id: string;
  type: PhaseType;
  duration_sec: number;
  position: number;
}

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await createWorkoutSchemaV2(db);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    return;
  }

  if (currentVersion === 1) {
    await migrateV1ToV2(db);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function createWorkoutSchemaV2(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      warmup_sec INTEGER NOT NULL DEFAULT 0 CHECK (warmup_sec >= 0),
      work_sec INTEGER NOT NULL CHECK (work_sec > 0),
      rest_sec INTEGER NOT NULL CHECK (rest_sec > 0),
      sets INTEGER NOT NULL CHECK (sets > 0),
      cooldown_sec INTEGER NOT NULL DEFAULT 0 CHECK (cooldown_sec >= 0)
    );
  `);
}

async function migrateV1ToV2(db: SQLiteDatabase) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(`
      ALTER TABLE workouts RENAME TO workouts_v1;

      CREATE TABLE workouts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        warmup_sec INTEGER NOT NULL DEFAULT 0 CHECK (warmup_sec >= 0),
        work_sec INTEGER NOT NULL CHECK (work_sec > 0),
        rest_sec INTEGER NOT NULL CHECK (rest_sec > 0),
        sets INTEGER NOT NULL CHECK (sets > 0),
        cooldown_sec INTEGER NOT NULL DEFAULT 0 CHECK (cooldown_sec >= 0)
      );
    `);

    const legacyWorkouts = await tx.getAllAsync<LegacyWorkoutRow>(
      'SELECT id, name, created_at FROM workouts_v1'
    );

    for (const workout of legacyWorkouts) {
      const legacyPhases = await tx.getAllAsync<LegacyPhaseRow>(
        `
          SELECT id, workout_id, type, duration_sec, position
          FROM phases
          WHERE workout_id = ?
          ORDER BY position ASC
        `,
        workout.id
      );

      const migratedWorkout = convertLegacyWorkout(workout, legacyPhases);

      await tx.runAsync(
        `
          INSERT INTO workouts (
            id,
            name,
            created_at,
            warmup_sec,
            work_sec,
            rest_sec,
            sets,
            cooldown_sec
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        migratedWorkout.id,
        migratedWorkout.name,
        migratedWorkout.createdAt,
        migratedWorkout.warmupSec,
        migratedWorkout.workSec,
        migratedWorkout.restSec,
        migratedWorkout.sets,
        migratedWorkout.cooldownSec
      );
    }

    await tx.execAsync(`
      DROP TABLE phases;
      DROP TABLE workouts_v1;
    `);
  });
}

function convertLegacyWorkout(workout: LegacyWorkoutRow, phases: LegacyPhaseRow[]) {
  const warmup = phases[0]?.type === 'warmup' ? phases[0].duration_sec : 0;
  const cooldown = phases.at(-1)?.type === 'cooldown' ? (phases.at(-1)?.duration_sec ?? 0) : 0;

  const corePhases = phases.filter((phase) => phase.type === 'work' || phase.type === 'rest');
  const firstWork = corePhases.find((phase) => phase.type === 'work');
  const firstRest = corePhases.find((phase) => phase.type === 'rest');
  const workCount = corePhases.filter((phase) => phase.type === 'work').length;

  return {
    id: workout.id,
    name: workout.name,
    createdAt: workout.created_at,
    warmupSec: warmup,
    workSec: firstWork?.duration_sec ?? 20,
    restSec: firstRest?.duration_sec ?? 10,
    sets: workCount > 0 ? workCount : 1,
    cooldownSec: cooldown,
  };
}
