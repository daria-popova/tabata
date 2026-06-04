# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tabata** — мобильный таймер интервальных тренировок (HIIT). Приложение на Expo/React Native с локальной SQLite-базой данных, без бэкенда.

## Commands

```bash
# Разработка
make start          # docker compose up (expo start внутри контейнера)
npm run android     # запустить на Android
npm run ios         # запустить на iOS

# Проверка кода
make lint           # ESLint
make typecheck      # tsc --noEmit

# Сборка
make build          # Android APK через EAS (preview)
```

Для локальной разработки без Docker: `npx expo start`.

## Architecture

### Framework & Navigation
Expo Router (file-based routing). Экраны в `app/` — это маршруты. Tab-навигация: `(tabs)/index.tsx` (список тренировок), `(tabs)/settings.tsx`.

### Database (SQLite)
`expo-sqlite` v16 через `lib/db/provider.tsx` — `SQLiteProvider` оборачивает всё приложение в `app/_layout.tsx`. Миграции запускаются при монтировании провайдера: `lib/db/migrate.ts`. Текущая версия схемы: **v3** (`lib/db/constants.ts`).

CRUD-операции инкапсулированы в репозитории: `lib/db/workouts-repository.ts`, `lib/db/users-repository.ts`. Репозитории принимают `db: SQLiteDatabase` как первый аргумент.

### Feature Modules (`features/`)
- **workouts/** — логика таймера (`use-workout-timer.ts`), звуки (`use-timer-sounds.ts`), форма (`workout-form.tsx`), построение таймлайна из параметров тренировки (`model/build-timeline.ts`)
- **calories/** — расчёт калорий по формуле MET × вес (кг) × время (ч); справочник упражнений с коэффициентами MET в `exercises.ts`

### State Persistence
Активная сессия таймера сохраняется в device storage через `lib/settings/timer-session.ts` — это позволяет восстановить таймер после сворачивания приложения.

### Types
Центральные типы — в `types/`: `Workout`, `PhaseType`, `TimelineItem`, `User`, `ExerciseDefinition`. Не дублировать в feature-модулях.

### Path Alias
`@/*` → корень репозитория (настроено в `tsconfig.json`).

### No Tests
Тестового фреймворка нет.

## Key Conventions

- **UI компоненты**: `ThemedText` и `ThemedView` из `components/` вместо стандартных `Text`/`View` для поддержки тем
- **Стилизация**: React Native `StyleSheet`, без Tailwind
- **Локализация**: весь UI на русском языке, в `lib/russian-plural.ts` — хелпер склонений
- **Числовой ввод**: использовать `lib/number-input.ts` для парсинга и валидации числовых полей форм
