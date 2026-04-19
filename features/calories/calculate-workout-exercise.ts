import {User, Workout} from "@/types";
import {getExerciseByKey} from "@/features/calories/exercises";

function getWorkoutActiveDuration(workout: Workout) {
    return workout.sets * workout.workSec;
}

function resolveWorkoutMet(workout: Workout) {
    if (!workout.exerciseKey || !workout.intensity) {
        return null;
    }
    let exercise = getExerciseByKey(workout.exerciseKey);
    if (!exercise) {
        return null;
    }
    if (exercise.type === "static") {
        return exercise.met.fixed ?? null;
    }
    return exercise.met[workout.intensity] ?? null;
}

export function calculateWorkoutCalories(workout: Workout, user: User | null) {
    //`MET * weightKg * durationHours`
    if (!user) {
        return null;
    }
    let met = resolveWorkoutMet(workout) ?? 0;
    let durationHours = getWorkoutActiveDuration(workout) / 3600;
    return met * user.weightKg * durationHours;
}

export function formatCalories(calories: number) {
    return `~${Math.round(calories)} ккал`;
}

//todo считать количество калорий тренировки в процессе