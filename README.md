# Tabata

Mobile interval timer app built with Expo, React Native, and TypeScript.

## Development

Run npm commands through Docker Compose to avoid changing the system Node/npm setup:

```bash
docker compose run --rm app npm install
docker compose run --rm app
docker compose run --rm app npm run lint
```

The default container command starts Expo:

```bash
docker compose run --rm app
```

## Project Structure

```text
app/                Expo Router screens
components/         Shared UI components
features/workouts/  Workout feature code
lib/db/             Local database access
types/              Shared TypeScript types
docs/               Product notes and MVP scope
```

## MVP

See `docs/README.md`, `docs/MVP.md`, and `docs/DATA_MODEL.md`.
