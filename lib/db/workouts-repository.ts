import type { SQLiteDatabase } from 'expo-sqlite';

import type { Workout } from '@/types';

interface WorkoutRow {
  id: string;
  name: string;
  created_at: number;
  warmup_sec: number;
  work_sec: number;
  rest_sec: number;
  sets: number;
  cooldown_sec: number;
}

export async function listWorkouts(db: SQLiteDatabase): Promise<Workout[]> {
  const workoutRows = await db.getAllAsync<WorkoutRow>(
    `
      SELECT
        id,
        name,
        created_at,
        warmup_sec,
        work_sec,
        rest_sec,
        sets,
        cooldown_sec
      FROM workouts
      ORDER BY created_at DESC
    `
  );

  return workoutRows.map(mapWorkoutRow);
}

export async function getWorkoutById(
  db: SQLiteDatabase,
  workoutId: string
): Promise<Workout | null> {
  const workoutRow = await db.getFirstAsync<WorkoutRow>(
    `
      SELECT
        id,
        name,
        created_at,
        warmup_sec,
        work_sec,
        rest_sec,
        sets,
        cooldown_sec
      FROM workouts
      WHERE id = ?
    `,
    workoutId
  );

  return workoutRow ? mapWorkoutRow(workoutRow) : null;
}

export async function saveWorkout(db: SQLiteDatabase, workout: Workout): Promise<void> {
  await db.runAsync(
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
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        warmup_sec = excluded.warmup_sec,
        work_sec = excluded.work_sec,
        rest_sec = excluded.rest_sec,
        sets = excluded.sets,
        cooldown_sec = excluded.cooldown_sec
    `,
    workout.id,
    workout.name,
    workout.createdAt,
    workout.warmupSec,
    workout.workSec,
    workout.restSec,
    workout.sets,
    workout.cooldownSec
  );
}

export async function deleteWorkout(db: SQLiteDatabase, workoutId: string): Promise<void> {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', workoutId);
}

function mapWorkoutRow(row: WorkoutRow): Workout {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    warmupSec: row.warmup_sec,
    workSec: row.work_sec,
    restSec: row.rest_sec,
    sets: row.sets,
    cooldownSec: row.cooldown_sec,
  };
}
