import Link from "next/link";
import { Role } from "@prisma/client";
import { getAuthUser, getSessionUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { tryCreateClient } from "@/lib/supabase/server";
import { clearDemoSession } from "@/lib/auth/demo-session";
import { redirect } from "next/navigation";
import { LiquidGlassView } from "@/components/ui/liquid-glass";

async function signOut() {
  "use server";
  await clearDemoSession();
  const supabase = await tryCreateClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function Nav() {
  try {
    const authUser = await getAuthUser();
    const dbUser = await getSessionUser();

    return (
      <header className="sticky top-0 z-40">
        <LiquidGlassView
          effect="regular"
          className="border-b border-white/40 shadow-sm"
        >
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="text-lg font-semibold text-indigo-700">
            TheBoard
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/listings"
              className="text-sm font-medium text-slate-700 hover:text-indigo-700"
            >
              Browse
            </Link>

            {dbUser ? (
              <>
                {(dbUser.role === Role.POSTER || dbUser.role === Role.ADMIN) && (
                  <Link
                    href="/listings/new"
                    className="hidden text-sm font-medium text-slate-700 hover:text-indigo-700 sm:inline"
                  >
                    Post a role
                  </Link>
                )}
                <Link
                  href={ROLE_HOME[dbUser.role]}
                  className="text-sm font-medium text-slate-700 hover:text-indigo-700"
                >
                  Dashboard
                </Link>
                {dbUser.role === Role.STUDENT ? (
                  <Link
                    href="/student/agent"
                    className="hidden text-sm font-medium text-slate-700 hover:text-indigo-700 sm:inline"
                  >
                    Job Agent
                  </Link>
                ) : null}
                <Link
                  href={
                    dbUser.role === Role.STUDENT
                      ? "/student/profile"
                      : dbUser.role === Role.POSTER
                        ? "/poster/profile"
                        : "/admin"
                  }
                  className="hidden text-sm font-medium text-slate-700 hover:text-indigo-700 sm:inline"
                >
                  Profile
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-slate-500 hover:text-slate-800"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : authUser ? (
              <>
                <Link
                  href="/onboarding"
                  className="text-sm font-medium text-indigo-700 hover:underline"
                >
                  Complete setup
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-slate-500 hover:text-slate-800"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-indigo-700"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
        </LiquidGlassView>
      </header>
    );
  } catch (error) {
    console.error("Nav render failed:", error);
    return (
      <header className="sticky top-0 z-40">
        <LiquidGlassView effect="regular" className="border-b border-white/40">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold text-indigo-700">
              TheBoard
            </Link>
            <Link href="/listings" className="text-sm text-slate-700">
              Browse
            </Link>
          </div>
        </LiquidGlassView>
      </header>
    );
  }
}
