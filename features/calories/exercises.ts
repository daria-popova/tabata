import {ExerciseDefinition} from "@/types";

export const EXERCISES: ExerciseDefinition[] = [
    {
        key: "burpee",
        label: "Бёрпи",
        type: "dynamic",
        met: {
            low: 8,
            medium: 10,
            high: 12,
        },
        supportsIntensity: true
    },
    {
        key: "plank",
        label: "Планка",
        type: "static",
        met: {
            fixed: 3.3,
        },
        supportsIntensity: false
    }
];

export function getExerciseByKey(key:string|null){
    if(!key) return null;
    return EXERCISES.find(exercise => exercise.key === key);
}
// function exerciseSupportsIntensity(exercise: ExerciseDefinition) {
//     return exercise.supportsIntensity;
// }