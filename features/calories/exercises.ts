import {ExerciseDefinition} from "@/types";

export const EXERCISES: ExerciseDefinition[] = [
    // Динамические
    {
        key: "burpee",
        label: "Бёрпи",
        type: "dynamic",
        met: { low: 8, medium: 10, high: 12 },
        supportsIntensity: true,
    },
    {
        key: "jumping-jacks",
        label: 'Прыжки "звёздочка"',
        type: "dynamic",
        met: { low: 5, medium: 7, high: 9 },
        supportsIntensity: true,
    },
    {
        key: "mountain-climber",
        label: "Альпинист",
        type: "dynamic",
        met: { low: 6, medium: 8, high: 10 },
        supportsIntensity: true,
    },
    {
        key: "high-knees",
        label: "Бег с высоким подниманием колен",
        type: "dynamic",
        met: { low: 6, medium: 8, high: 10 },
        supportsIntensity: true,
    },
    {
        key: "jump-rope",
        label: "Скакалка",
        type: "dynamic",
        met: { low: 8, medium: 10, high: 12 },
        supportsIntensity: true,
    },
    {
        key: "push-ups",
        label: "Отжимания",
        type: "dynamic",
        met: { low: 3.5, medium: 5, high: 8 },
        supportsIntensity: true,
    },
    {
        key: "squats",
        label: "Приседания",
        type: "dynamic",
        met: { low: 5, medium: 6, high: 8 },
        supportsIntensity: true,
    },
    {
        key: "lunges",
        label: "Выпады",
        type: "dynamic",
        met: { low: 4, medium: 5.5, high: 7 },
        supportsIntensity: true,
    },
    {
        key: "crunches",
        label: "Скручивания",
        type: "dynamic",
        met: { low: 4, medium: 6, high: 8 },
        supportsIntensity: true,
    },
    // Статические
    {
        key: "plank",
        label: "Планка",
        type: "static",
        met: { fixed: 3.3 },
        supportsIntensity: false,
    },
    {
        key: "side-plank",
        label: "Боковая планка",
        type: "static",
        met: { fixed: 3.3 },
        supportsIntensity: false,
    },
    {
        key: "wall-sit",
        label: "Статический присед у стены",
        type: "static",
        met: { fixed: 4 },
        supportsIntensity: false,
    },
    {
        key: "glute-bridge-hold",
        label: "Ягодичный мост (удержание)",
        type: "static",
        met: { fixed: 3 },
        supportsIntensity: false,
    },
    // Кардио
    {
        key: "walking",
        label: "Ходьба",
        type: "cardio",
        met: { low: 2.5, medium: 3.5, high: 4.5 },
        supportsIntensity: true,
    },
    {
        key: "light-running",
        label: "Лёгкий бег",
        type: "cardio",
        met: { low: 6, medium: 7.5, high: 9 },
        supportsIntensity: true,
    },
    {
        key: "running",
        label: "Бег",
        type: "cardio",
        met: { low: 8, medium: 10, high: 12 },
        supportsIntensity: true,
    },
    {
        key: "cycling",
        label: "Велосипед",
        type: "cardio",
        met: { low: 4, medium: 6, high: 8.5 },
        supportsIntensity: true,
    },
];

export function getExerciseByKey(key:string|null){
    if(!key) return null;
    return EXERCISES.find(exercise => exercise.key === key);
}
// function exerciseSupportsIntensity(exercise: ExerciseDefinition) {
//     return exercise.supportsIntensity;
// }