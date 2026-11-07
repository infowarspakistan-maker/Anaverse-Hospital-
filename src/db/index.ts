import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

function resolveActiveSqlHost(): string | undefined {
  const configuredHost = process.env.SQL_HOST;
  if (!configuredHost) return undefined;

  // When Google Drive OAuth switches the container's GCP project, check if an active
  // Cloud SQL socket directory exists under /app/cloudsql
  const cloudSqlRoot = '/app/cloudsql';
  try {
    if (fs.existsSync(cloudSqlRoot)) {
      const entries = fs.readdirSync(cloudSqlRoot);
      for (const entry of entries) {
        if (entry.startsWith('gen-lang-client-')) {
          const candidate = path.join(cloudSqlRoot, entry);
          const socketFile = path.join(candidate, '.s.PGSQL.5432');
          if (fs.existsSync(socketFile)) {
            return candidate;
          }
        }
      }
    }
  } catch {
    // Ignore filesystem inspection errors
  }

  return configuredHost;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: resolveActiveSqlHost(),
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 5,
      connectionTimeoutMillis: 1200,
    });

    global._postgresPool.on('error', () => {
      // Handled gracefully by repository fallback store
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
