import Link from "next/link";
import { Role } from "@prisma/client";
import { getAuthUser, getSessionUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { tryCreateClient } from "@/lib/supabase/server";
import { clearDemoSession } from "@/lib/auth/demo-session";
import { redirect } from "next/navigation";
import { LiquidGlassView } from "@/components/ui/liquid-glass";
import { Button } from "@/components/ui/button";

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
      <header className="sticky top-0 z-40 app-nav-enter">
        <LiquidGlassView
          effect="regular"
          className="border-b border-white/10 shadow-sm"
        >
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="text-lg font-semibold text-indigo-400">
            TheBoard
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/listings"
              className="text-sm font-medium text-slate-300 hover:text-indigo-300"
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
                  className="text-sm font-medium text-slate-300 hover:text-indigo-300"
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
                  <Button type="submit" variant="ghost" size="sm">
                    Sign out
                  </Button>
                </form>
              </>
            ) : authUser ? (
              <>
                <Link
                  href="/onboarding"
                  className="text-sm font-medium text-indigo-300 hover:underline"
                >
                  Complete setup
                </Link>
                <form action={signOut}>
                  <Button type="submit" variant="ghost" size="sm">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/?mode=login"
                  className="text-sm font-medium text-slate-300 hover:text-indigo-300"
                >
                  Log in
                </Link>
                <Button href="/?mode=signup" size="sm">
                  Sign up
                </Button>
              </>
            )}
          </nav>
        </div>
        </LiquidGlassView>
      </header>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isExpectedDynamicUsage =
      message.includes("Dynamic server usage") ||
      (error instanceof Error &&
        "digest" in error &&
        (error as Error & { digest?: string }).digest === "DYNAMIC_SERVER_USAGE");

    if (!isExpectedDynamicUsage) {
      console.error("Nav render failed:", error);
    }
    return (
      <header className="sticky top-0 z-40 app-nav-enter">
        <LiquidGlassView effect="regular" className="border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold text-indigo-400">
              TheBoard
            </Link>
            <Link href="/listings" className="text-sm text-slate-300">
              Browse
            </Link>
          </div>
        </LiquidGlassView>
      </header>
    );
  }
}
