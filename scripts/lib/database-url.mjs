/**
 * Build-time copy of src/lib/database-url.ts for scripts/vercel-build.mjs.
 * Keep in sync when changing URL normalization logic.
 */

const DEFAULT_POOLER_HOST = "aws-1-ap-southeast-2.pooler.supabase.com";

export function normalizeEnvUrl(value) {
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

function fixDatabaseUrl(value) {
  if (canParseUrl(value)) {
    return { url: value, fixed: false };
  }

  const parts = parsePostgresUrl(value);
  if (!parts || /%[0-9A-Fa-f]{2}/.test(parts.password)) {
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

export function getSupabaseProjectRef(env = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (match?.[1]) return match[1];

  const dbUrl = env.DATABASE_URL ?? "";
  const directMatch = dbUrl.match(/db\.([^.]+)\.supabase\.co/i);
  return directMatch?.[1] ?? "mpuboebxkugbobspodwd";
}

export function getPoolerHost(env = process.env) {
  return env.SUPABASE_POOLER_HOST?.trim() || DEFAULT_POOLER_HOST;
}

function fixSupabaseDirectToPooler(value, env = process.env) {
  const parts = parsePostgresUrl(value);
  if (!parts) return { url: value, fixed: false };

  const directMatch = parts.hostPath.match(
    /^db\.([^.]+)\.supabase\.co(?::(\d+))?(\/[^?]*)?(\?.*)?$/i,
  );
  if (!directMatch) return { url: value, fixed: false };

  const projectRef = directMatch[1];
  const port = directMatch[2] ?? "5432";
  const path = directMatch[3] ?? "/postgres";
  const query = directMatch[4] ?? "";
  const poolerHost = getPoolerHost(env);

  let user = parts.user;
  if (user === "postgres") {
    user = `postgres.${projectRef}`;
  }

  const fixed = buildPostgresUrl({
    ...parts,
    user,
    hostPath: `${poolerHost}:${port}${path}${query}`,
  });

  return { url: fixed, fixed: true };
}

function fixSupabaseUsername(value, env = process.env) {
  const parts = parsePostgresUrl(value);
  if (!parts || !parts.hostPath.includes("pooler.supabase.com")) {
    return { url: value, fixed: false };
  }

  if (parts.user.startsWith("postgres.") || parts.user !== "postgres") {
    return { url: value, fixed: false };
  }

  const projectRef = getSupabaseProjectRef(env);
  const fixed = buildPostgresUrl({
    ...parts,
    user: `postgres.${projectRef}`,
  });

  return { url: fixed, fixed: true };
}

export function resolveDatabaseUrl(raw, env = process.env) {
  if (!raw) return { url: raw, logs: [] };

  const logs = [];
  let url = normalizeEnvUrl(raw) ?? "";

  const encoded = fixDatabaseUrl(url);
  url = encoded.url;
  if (encoded.fixed) {
    logs.push("Auto-encoded special characters in DATABASE_URL password");
  }

  const pooler = fixSupabaseDirectToPooler(url, env);
  url = pooler.url;
  if (pooler.fixed) {
    logs.push(
      `Converted Supabase direct host to session pooler (${getPoolerHost(env)})`,
    );
  }

  const userFix = fixSupabaseUsername(url, env);
  url = userFix.url;
  if (userFix.fixed) {
    logs.push("Fixed pooler username to postgres.PROJECT_REF format");
  }

  return { url, logs };
}

export function toMigrationUrl(databaseUrl) {
  return databaseUrl
    .replace(":6543/", ":5432/")
    .replace(":6543?", ":5432?")
    .replace(/\?pgbouncer=true&?/, "?")
    .replace(/&pgbouncer=true/, "")
    .replace(/\?$/, "");
}
