import type { PropsWithChildren } from 'react';
import { SQLiteProvider } from 'expo-sqlite';

import { DATABASE_NAME } from '@/lib/db/constants';
import { migrateDbIfNeeded } from '@/lib/db/migrate';

export function AppDbProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      {children}
    </SQLiteProvider>
  );
}
