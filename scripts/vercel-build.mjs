#!/usr/bin/env node

/**
 * Vercel build: validate DATABASE_URL, sync schema, build Next.js.
 * Auto-converts Supabase direct URLs (db.*) to session pooler for Vercel.
 */

import { execSync } from "node:child_process";
import {
  normalizeEnvUrl,
  resolveDatabaseUrl,
  toMigrationUrl,
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

function syncDatabaseSchema(migrationUrl) {
  const env = { ...process.env, DATABASE_URL: migrationUrl };

  try {
    run("npx prisma migrate deploy", env);
    console.log("✓ prisma migrate deploy succeeded");
    return;
  } catch (error) {
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
    console.error("P1001 = cannot reach database — check pooler host and password.");
    console.error("P1000 = wrong password or username.");
    console.error("");
    console.error("Preferred DATABASE_URL on Vercel (Session pooler, port 5432):");
    console.error(
      "postgresql://postgres.mpuboebxkugbobspodwd:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres",
    );
    console.error("");
    console.error(
      "Direct db.*.supabase.co URLs are auto-converted at build/runtime. If sync still fails, paste the pooler URL from Supabase → Connect.",
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

Use Supabase → Connect → Session pooler:

postgresql://postgres.mpuboebxkugbobspodwd:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres

Paste ONLY the URL (no quotes). Direct db.* URLs are auto-converted if your pooler region matches.
`);
  process.exit(1);
}

const runtimeUrl = check.trimmed;
const migrationUrl = toMigrationUrl(runtimeUrl);

process.env.DATABASE_URL = runtimeUrl;

console.log(`✓ DATABASE_URL → ${check.username}@${check.hostname}:${check.port}`);
if (migrationUrl !== runtimeUrl) {
  console.log("✓ Using port 5432 for schema sync during build");
}

try {
  syncDatabaseSchema(migrationUrl);
  run("npx prisma generate");

  if (process.env.SEED_DEMO_DATA === "true") {
    console.log("\n▶ Seeding demo listings and bypass student…\n");
    run("node scripts/seed.mjs");
  }

  run("npx next build");
  console.log("\n✓ Build completed successfully\n");
} catch {
  process.exit(1);
}
