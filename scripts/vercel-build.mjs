#!/usr/bin/env node

/**
 * Vercel build: validate DATABASE_URL, sync schema, build Next.js.
 * Uses port 5432 for Prisma during build (migrations); runtime keeps your Vercel env.
 */

import { execSync } from "node:child_process";

function normalizeEnvUrl(value) {
  if (!value) return value;
  let trimmed = value.trim();
  if (trimmed.startsWith("DATABASE_URL=")) {
    trimmed = trimmed.slice("DATABASE_URL=".length).trim();
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parsePostgresUrl(value) {
  const match = value.match(/^(postgres(?:ql)?:\/\/)(.+)$/i);
  if (!match) return null;

  const rest = match[2];
  const at = rest.lastIndexOf("@");
  if (at <= 0) return null;

  const userInfo = rest.slice(0, at);
  const hostPath = rest.slice(at + 1);
  const colon = userInfo.indexOf(":");
  if (colon <= 0) return null;

  return {
    protocol: match[1],
    user: userInfo.slice(0, colon),
    password: userInfo.slice(colon + 1),
    hostPath,
  };
}

function buildPostgresUrl(parts) {
  return `${parts.protocol}${parts.user}:${parts.password}@${parts.hostPath}`;
}

function canParseUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Fix passwords with @ # : etc. that break URL parsing. */
function fixDatabaseUrl(value) {
  if (canParseUrl(value)) {
    return { url: value, fixed: false };
  }

  const parts = parsePostgresUrl(value);
  if (!parts) {
    return { url: value, fixed: false };
  }

  // Already percent-encoded — don't double-encode.
  if (/%[0-9A-Fa-f]{2}/.test(parts.password)) {
    return { url: value, fixed: false };
  }

  const encoded = buildPostgresUrl({
    ...parts,
    password: encodeURIComponent(parts.password),
  });

  if (canParseUrl(encoded)) {
    return { url: encoded, fixed: true };
  }

  return { url: value, fixed: false };
}

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

  const fixed = fixDatabaseUrl(trimmed);
  trimmed = fixed.url;
  if (fixed.fixed) {
    console.log(`✓ Auto-encoded special characters in ${name} password`);
  }

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

  return { ok: true, trimmed, port, hostname: parsed.hostname };
}

/** Prisma migrations need session mode (5432), not transaction pooler (6543). */
function toMigrationUrl(databaseUrl) {
  return databaseUrl
    .replace(":6543/", ":5432/")
    .replace(":6543?", ":5432?")
    .replace(/\?pgbouncer=true&?/, "?")
    .replace(/&pgbouncer=true/, "")
    .replace(/\?$/, "");
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
    console.error("Check DATABASE_URL password (URL-encode special chars) and Supabase project status.");
    throw error;
  }
}

const rawDatabaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL;

const check = validateDatabaseUrl("DATABASE_URL", rawDatabaseUrl);

if (!check.ok) {
  console.error(`\n❌ ${check.message}\n`);
  console.error(`In Vercel → Settings → Environment Variables, add DATABASE_URL for Production:

postgresql://postgres.mpuboebxkugbobspodwd:ENCODED_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

Get the string from Supabase → Connect → Session pooler (port 5432).
Paste ONLY the URL (no quotes, no "DATABASE_URL=" prefix).
If your password has @ # : / ? & encode them first (e.g. encodeURIComponent in browser console).
`);
  process.exit(1);
}

const runtimeUrl = check.trimmed;
const migrationUrl = toMigrationUrl(runtimeUrl);

console.log(`✓ DATABASE_URL → ${check.hostname}:${check.port}`);
if (migrationUrl !== runtimeUrl) {
  console.log(`✓ Using port 5432 for schema sync during build`);
}

try {
  syncDatabaseSchema(migrationUrl);
  run("npx prisma generate");
  run("npx next build");
  console.log("\n✓ Build completed successfully\n");
} catch {
  process.exit(1);
}
