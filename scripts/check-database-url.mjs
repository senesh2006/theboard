#!/usr/bin/env node

/**
 * Validates Postgres connection strings before Prisma runs on Vercel.
 * Common failure: password contains @ : / # ? & and breaks URL parsing (P1013).
 */

const vars = [
  { name: "DATABASE_URL", value: process.env.DATABASE_URL, required: true },
  { name: "DIRECT_URL", value: process.env.DIRECT_URL, required: false },
];

function validate(name, value) {
  if (!value) {
    return { ok: false, message: `${name} is not set.` };
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
      message: `${name} includes quote characters. Paste only the URL, without wrapping quotes.`,
    };
  }

  if (trimmed.includes("[YOUR-PASSWORD]") || trimmed.includes("[PASSWORD]")) {
    return {
      ok: false,
      message: `${name} still contains a password placeholder. Replace it with your real database password.`,
    };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      message: `${name} is not a valid URL. If your password has special characters (@ : / # ? &), URL-encode them (e.g. @ → %40).`,
    };
  }

  if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
    return {
      ok: false,
      message: `${name} must start with postgresql:// (not ${parsed.protocol}).`,
    };
  }

  if (!parsed.hostname) {
    return {
      ok: false,
      message: `${name} is missing a hostname.`,
    };
  }

  const port = parsed.port;
  if (!port || Number.isNaN(Number(port)) || Number(port) <= 0) {
    return {
      ok: false,
      message: `${name} has an invalid port "${port ?? ""}". Expected :5432 (session/direct) or :6543 (transaction pooler).`,
    };
  }

  if (!parsed.pathname || parsed.pathname === "/") {
    return {
      ok: false,
      message: `${name} is missing the database name. It should end with /postgres`,
    };
  }

  return { ok: true, port, hostname: parsed.hostname };
}

let failed = false;

for (const { name, value, required } of vars) {
  if (!value) {
    if (required) {
      console.error(`❌ ${name} is not set.`);
      failed = true;
    }
    continue;
  }

  const result = validate(name, value);
  if (!result.ok) {
    console.error(`❌ ${name}: ${result.message}`);
    failed = true;
  } else {
    console.log(`✓ ${name} → ${result.hostname}:${result.port}`);
  }
}

if (!process.env.DIRECT_URL) {
  console.error(
    "❌ DIRECT_URL is not set. Supabase migrations need the session pooler on port 5432.\n" +
      "   Set DIRECT_URL separately from DATABASE_URL (6543) in Vercel env vars.",
  );
  failed = true;
}

if (failed) {
  console.error(`
Supabase examples for project mpuboebxkugbobspodwd:

  DIRECT_URL (for migrations — port 5432):
  postgresql://postgres.mpuboebxkugbobspodwd:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

  DATABASE_URL (for the app — port 6543):
  postgresql://postgres.mpuboebxkugbobspodwd:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true

If YOUR_PASSWORD contains special characters, encode them:
  @ → %40   : → %3A   / → %2F   # → %23   ? → %3F   & → %26

In Vercel, paste ONLY the URL value — no quotes, no "DATABASE_URL=" prefix.
`);
  process.exit(1);
}
