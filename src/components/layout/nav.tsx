import Link from "next/link";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const dbUser = await getSessionUser();

  return (
    <header className="border-b border-slate-200 bg-white">
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
    </header>
  );
}
