#!/usr/bin/env node

/**
 * Vercel build entrypoint.
 * Validates DATABASE_URL, derives DIRECT_URL for migrations if needed,
 * then runs prisma migrate deploy → generate → next build.
 */

import { execSync } from "node:child_process";

function validateDatabaseUrl(name, value) {
  if (!value) {
    return { ok: false, message: `${name} is not set in Vercel environment variables.` };
  }

  const trimmed = value.trim();
  if (trimmed !== value) {
    return { ok: false, message: `${name} has leading/trailing spaces.` };
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return {
      ok: false,
      message: `${name} includes quote characters. Paste only the URL, without quotes.`,
    };
  }

  if (trimmed.includes("[YOUR-PASSWORD]") || trimmed.includes("[PASSWORD]")) {
    return {
      ok: false,
      message: `${name} still contains a password placeholder.`,
    };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      message: `${name} is not a valid URL. URL-encode special characters in your password (@ → %40, # → %23, : → %3A).`,
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
      message: `${name} has an invalid port. Use :5432 (session) or :6543 (transaction pooler).`,
    };
  }

  if (!parsed.pathname || parsed.pathname === "/") {
    return { ok: false, message: `${name} must end with /postgres` };
  }

  return { ok: true, trimmed, port, hostname: parsed.hostname };
}

function deriveDirectUrl(databaseUrl) {
  return databaseUrl
    .replace(":6543/", ":5432/")
    .replace(":6543?", ":5432?")
    .replace(/\?pgbouncer=true&?/, "?")
    .replace(/&pgbouncer=true/, "")
    .replace(/\?$/, "");
}

function run(command) {
  console.log(`\n▶ ${command}\n`);
  execSync(command, { stdio: "inherit", env: process.env });
}

const check = validateDatabaseUrl("DATABASE_URL", process.env.DATABASE_URL);

if (!check.ok) {
  console.error(`\n❌ ${check.message}\n`);
  console.error(`Set DATABASE_URL in Vercel → Settings → Environment Variables.

Use Supabase Connect → Transaction pooler (port 6543), for example:
postgresql://postgres.mpuboebxkugbobspodwd:ENCODED_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true

Or Session pooler (port 5432):
postgresql://postgres.mpuboebxkugbobspodwd:ENCODED_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

Paste ONLY the URL — no quotes, no "DATABASE_URL=" prefix.
Encode special password characters: @ %40  # %23  : %3A  / %2F  ? %3F  & %26
`);
  process.exit(1);
}

process.env.DATABASE_URL = check.trimmed;
console.log(`✓ DATABASE_URL → ${check.hostname}:${check.port}`);

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = deriveDirectUrl(check.trimmed);
  console.log(`✓ DIRECT_URL auto-set for migrations (port 5432)`);
} else {
  const directCheck = validateDatabaseUrl("DIRECT_URL", process.env.DIRECT_URL);
  if (!directCheck.ok) {
    console.error(`\n❌ ${directCheck.message}\n`);
    process.exit(1);
  }
  process.env.DIRECT_URL = directCheck.trimmed;
  console.log(`✓ DIRECT_URL → ${directCheck.hostname}:${directCheck.port}`);
}

try {
  run("npx prisma migrate deploy");
  run("npx prisma generate");
  run("npx next build");
} catch {
  process.exit(1);
}
