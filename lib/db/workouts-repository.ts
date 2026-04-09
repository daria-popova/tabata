import type { SQLiteDatabase } from 'expo-sqlite';

import type { Phase, PhaseType, Workout } from '@/types';

interface WorkoutRow {
  id: string;
  name: string;
  created_at: number;
}

interface PhaseRow {
  id: string;
  workout_id: string;
  type: PhaseType;
  duration_sec: number;
  position: number;
}

export async function listWorkouts(db: SQLiteDatabase): Promise<Workout[]> {
  const workoutRows = await db.getAllAsync<WorkoutRow>(
    'SELECT id, name, created_at FROM workouts ORDER BY created_at DESC'
  );

  if (workoutRows.length === 0) {
    return [];
  }

  const phaseRows = await db.getAllAsync<PhaseRow>(
    `
      SELECT id, workout_id, type, duration_sec, position
      FROM phases
      WHERE workout_id IN (${workoutRows.map(() => '?').join(', ')})
      ORDER BY workout_id, position ASC
    `,
    workoutRows.map((row) => row.id)
  );

  const phasesByWorkoutId = groupPhasesByWorkoutId(phaseRows);

  return workoutRows.map((row) => mapWorkoutRow(row, phasesByWorkoutId.get(row.id) ?? []));
}

export async function getWorkoutById(
  db: SQLiteDatabase,
  workoutId: string
): Promise<Workout | null> {
  const workoutRow = await db.getFirstAsync<WorkoutRow>(
    'SELECT id, name, created_at FROM workouts WHERE id = ?',
    workoutId
  );

  if (!workoutRow) {
    return null;
  }

  const phaseRows = await db.getAllAsync<PhaseRow>(
    `
      SELECT id, workout_id, type, duration_sec, position
      FROM phases
      WHERE workout_id = ?
      ORDER BY position ASC
    `,
    workoutId
  );

  return mapWorkoutRow(workoutRow, phaseRows);
}

export async function saveWorkout(db: SQLiteDatabase, workout: Workout): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `
        INSERT INTO workouts (id, name, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name
      `,
      workout.id,
      workout.name,
      workout.createdAt
    );

    await tx.runAsync('DELETE FROM phases WHERE workout_id = ?', workout.id);

    for (const [index, phase] of workout.phases.entries()) {
      await tx.runAsync(
        `
          INSERT INTO phases (id, workout_id, type, duration_sec, position)
          VALUES (?, ?, ?, ?, ?)
        `,
        phase.id,
        workout.id,
        phase.type,
        phase.durationSec,
        index
      );
    }
  });
}

export async function deleteWorkout(db: SQLiteDatabase, workoutId: string): Promise<void> {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', workoutId);
}

function mapWorkoutRow(row: WorkoutRow, phaseRows: PhaseRow[]): Workout {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    phases: phaseRows.map(mapPhaseRow),
  };
}

function mapPhaseRow(row: PhaseRow): Phase {
  return {
    id: row.id,
    type: row.type,
    durationSec: row.duration_sec,
  };
}

function groupPhasesByWorkoutId(phaseRows: PhaseRow[]) {
  const phasesByWorkoutId = new Map<string, PhaseRow[]>();

  for (const row of phaseRows) {
    const workoutPhases = phasesByWorkoutId.get(row.workout_id) ?? [];
    workoutPhases.push(row);
    phasesByWorkoutId.set(row.workout_id, workoutPhases);
  }

  return phasesByWorkoutId;
}
