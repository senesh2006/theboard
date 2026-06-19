#!/usr/bin/env node

/**
 * Vercel build: validate DATABASE_URL, sync schema, build Next.js.
 * Runtime uses transaction pooler (6543); migrations use direct Postgres host.
 */

import { execSync } from "node:child_process";
import {
  isPoolExhaustedError,
  normalizeEnvUrl,
  resolveDatabaseUrl,
  toDirectMigrationUrl,
  toRuntimeUrl,
} from "./lib/database-url.mjs";

function diagnoseInvalidUrl(value) {
  const atCount = (value.match(/@/g) ?? []).length;
  if (atCount > 1) {
    return "Your password likely contains '@'. Encode it as %40.";
  }
  if (value.includes("#")) {
    return "Your password likely contains '#'. Encode it as %23.";
  }
  if (value.includes(" ")) {
    return "Your URL contains spaces. Remove them or encode as %20.";
  }
  return "URL-encode special characters in your password (@ → %40, # → %23, : → %3A).";
}

function validateDatabaseUrl(name, value) {
  if (!value) {
    return { ok: false, message: `${name} is not set in Vercel environment variables.` };
  }

  let trimmed = normalizeEnvUrl(value);
  if (!trimmed) {
    return { ok: false, message: `${name} is empty.` };
  }

  if (trimmed.includes("[YOUR-PASSWORD]") || trimmed.includes("[PASSWORD]")) {
    return { ok: false, message: `${name} still contains a password placeholder.` };
  }

  const resolved = resolveDatabaseUrl(trimmed);
  for (const line of resolved.logs) {
    console.log(`✓ ${line}`);
  }
  trimmed = resolved.url;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      message: `${name} is not a valid URL. ${diagnoseInvalidUrl(trimmed)}`,
    };
  }

  if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
    return { ok: false, message: `${name} must start with postgresql://` };
  }

  if (!parsed.hostname) {
    return { ok: false, message: `${name} is missing a hostname.` };
  }

  const port = parsed.port;
  if (!port || Number.isNaN(Number(port)) || Number(port) <= 0) {
    return {
      ok: false,
      message: `${name} has an invalid port "${port ?? ""}". Use :5432 or :6543 from Supabase Connect.`,
    };
  }

  if (!parsed.pathname || parsed.pathname === "/") {
    return { ok: false, message: `${name} must end with /postgres` };
  }

  if (parsed.hostname.includes("pooler.supabase.com") && parsed.username === "postgres") {
    return {
      ok: false,
      message: `${name} pooler username must be postgres.PROJECT_REF, not postgres.`,
    };
  }

  return { ok: true, trimmed, port, hostname: parsed.hostname, username: parsed.username };
}

function run(command, env = process.env) {
  console.log(`\n▶ ${command}\n`);
  execSync(command, { stdio: "inherit", env });
}

function syncDatabaseSchema(migrationUrl, directUrl) {
  const env = {
    ...process.env,
    DATABASE_URL: migrationUrl,
    DIRECT_URL: directUrl,
  };

  try {
    run("npx prisma migrate deploy", env);
    console.log("✓ prisma migrate deploy succeeded");
    return;
  } catch (error) {
    if (isPoolExhaustedError(error)) {
      console.error("\n❌ Database pool exhausted during migration.\n");
      console.error(
        "Set DIRECT_URL in Vercel to Supabase → Connect → Direct connection (db.*.supabase.co:5432).",
      );
      console.error(
        "Or pause other apps using the same database and redeploy.",
      );
      throw error;
    }

    console.warn("\n⚠ prisma migrate deploy failed — trying prisma db push...\n");
    if (error instanceof Error && error.message) {
      console.warn(error.message);
    }
  }

  try {
    run("npx prisma db push --skip-generate --accept-data-loss", env);
    console.log("✓ prisma db push succeeded");
  } catch (error) {
    console.error("\n❌ Could not sync database schema.\n");
    console.error("P1001 = cannot reach database — check host and password.");
    console.error("P1000 = wrong password or username.");
    console.error("");
    console.error("Recommended Vercel env vars:");
    console.error("");
    console.error("DATABASE_URL (transaction pooler, port 6543):");
    console.error(
      "postgresql://postgres.mpuboebxkugbobspodwd:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
    );
    console.error("");
    console.error("DIRECT_URL (direct host for migrations, port 5432):");
    console.error(
      "postgresql://postgres:YOUR_PASSWORD@db.mpuboebxkugbobspodwd.supabase.co:5432/postgres",
    );
    throw error;
  }
}

if (process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL) {
  console.warn(
    "⚠ Ignoring POSTGRES_PRISMA_URL/POSTGRES_URL — only DATABASE_URL is used. Delete duplicates in Vercel if stale.",
  );
}

const rawDatabaseUrl = process.env.DATABASE_URL;
const check = validateDatabaseUrl("DATABASE_URL", rawDatabaseUrl);

if (!check.ok) {
  console.error(`\n❌ ${check.message}\n`);
  console.error(`In Vercel → Settings → Environment Variables, set DATABASE_URL for Production.

Use Supabase → Connect → Transaction pooler (port 6543):

postgresql://postgres.mpuboebxkugbobspodwd:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

Optional DIRECT_URL for migrations (Direct connection):

postgresql://postgres:YOUR_PASSWORD@db.mpuboebxkugbobspodwd.supabase.co:5432/postgres
`);
  process.exit(1);
}

const runtimeUrl = toRuntimeUrl(check.trimmed);
const directUrl = toDirectMigrationUrl(check.trimmed);

process.env.DATABASE_URL = runtimeUrl;
process.env.DIRECT_URL = directUrl;

console.log(`✓ Runtime DATABASE_URL → transaction pooler (port 6543)`);
console.log(`✓ Migration DIRECT_URL → ${new URL(directUrl).hostname}:${new URL(directUrl).port || "5432"}`);

try {
  syncDatabaseSchema(directUrl, directUrl);
  run("npx prisma generate");

  if (process.env.SEED_DEMO_DATA === "true") {
    console.log("\n▶ Seeding demo listings and bypass student…\n");
    run("node scripts/seed.mjs", { ...process.env, DATABASE_URL: runtimeUrl });
  }

  run("npx next build");
  console.log("\n✓ Build completed successfully\n");
} catch {
  process.exit(1);
}
