import {User, Workout} from "@/types";
import {getExerciseByKey} from "@/features/calories/exercises";

function getWorkoutActiveDuration(workout: Workout) {
    return workout.sets * workout.workSec;
}

function resolveWorkoutMet(workout: Workout) {
    if (!workout.exerciseKey) {
        return null;
    }
    let exercise = getExerciseByKey(workout.exerciseKey);
    if (!exercise) {
        return null;
    }
    if (exercise.type === "static") {
        return exercise.met.fixed ?? null;
    }
    return workout.intensity ? exercise.met[workout.intensity] : null;
}

export function calculateWorkoutCalories(workout: Workout, user: User | null) {
    return calculateWorkoutCaloriesForSec(workout, user, getWorkoutActiveDuration(workout))
}

export function formatCalories(calories: number) {
    return calories > 0 ? `${Math.round(calories)} ккал` : '';
}

export function calculateWorkoutCaloriesForSec(workout: Workout, user: User | null, sec: number): number {
    //`MET * weightKg * durationHours`
    if (!user) {
        return 0;
    }
    let met = resolveWorkoutMet(workout) ?? 0;
    let durationHours = sec / 3600;
    return met * user.weightKg * durationHours;
}
