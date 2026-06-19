import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";

export async function createClient() {
  const config = tryGetSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — safe to ignore
        }
      },
    },
  });
}

export async function tryCreateClient() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}
