import {
  resolveDatabaseUrl as resolveDatabaseUrlMjs,
  toMigrationUrl as toMigrationUrlMjs,
} from "./database-url.mjs";

export function getResolvedDatabaseUrl(): string | undefined {
  const { url } = resolveDatabaseUrlMjs(process.env.DATABASE_URL);
  return url || undefined;
}

export { resolveDatabaseUrlMjs as resolveDatabaseUrl, toMigrationUrlMjs as toMigrationUrl };
