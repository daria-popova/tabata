export type ExerciseIntensity = 'low' | 'medium' | 'high';
const EXERCISE_INTENSITIES = ["low", "medium", "high"] as const;

export function isExerciseIntensity(value: string): value is ExerciseIntensity {
    return EXERCISE_INTENSITIES.includes(value as ExerciseIntensity);
}

export type ExerciseType = 'dynamic' | 'static' | 'cardio';

export type ExerciseKey =
    | 'burpee'
    | 'jumping-jacks'
    | 'mountain-climber'
    | 'high-knees'
    | 'jump-rope'
    | 'push-ups'
    | 'squats'
    | 'lunges'
    | 'crunches'
    | 'plank'
    | 'side-plank'
    | 'wall-sit'
    | 'glute-bridge-hold'
    | 'walking'
    | 'light-running'
    | 'running'
    | 'cycling';


export interface ExerciseDefinition {
    key: ExerciseKey;
    label: string;
    type: ExerciseType;
    met: {
        low?: number;
        medium?: number;
        high?: number;
        fixed?: number;
    };
    supportsIntensity: boolean;
}

