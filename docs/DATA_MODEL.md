# Data Model

## Workout

```ts
export interface Workout {
  id: string;
  name: string;
  phases: Phase[];
  createdAt: number;
}
```

## Phase

```ts
export type PhaseType =
  | "warmup"
  | "work"
  | "rest"
  | "cooldown";

export interface Phase {
  id: string;
  type: PhaseType;
  durationSec: number;
}
```

---

## 🧠 Расширение (будущее)

```ts
export interface WorkoutAdvanced {
  cycles?: number; // повторение блока
}
```

---

## ▶️ Runtime модель (важно)

Перед запуском тренировки:

```ts
export interface TimelineItem {
  id: string;
  type: PhaseType;
  durationSec: number;
}
```

👉 Workout → разворачивается в TimelineItem[]

Пример:

warmup → work → rest (x3) → cooldown
↓
[ warmup, work, rest, work, rest, work, rest, cooldown ]
