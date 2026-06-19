export type SupabaseConfig = {
  url: string;
  key: string;
};

export function tryGetSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return { url, key };
}

/** Supabase publishable key (new) or legacy anon JWT — safe for browser use */
export function getSupabasePublishableKey(): string {
  const config = tryGetSupabaseConfig();
  if (!config) {
    throw new Error(
      "Missing Supabase config: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return config.key;
}

export function getSupabaseUrl(): string {
  const config = tryGetSupabaseConfig();
  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return config.url;
}
