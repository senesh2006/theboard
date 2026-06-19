"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

type AuthPanelProps = {
  initialMode?: AuthMode;
  next?: string;
  bannerError?: string | null;
};

export function AuthPanel({
  initialMode = "login",
  next,
  bannerError,
}: AuthPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = useCallback(
    (nextMode: AuthMode) => {
      setMode(nextMode);
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", nextMode);
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="mb-6 flex rounded-xl border border-white/10 bg-slate-900/50 p-1"
        role="tablist"
        aria-label="Log in or sign up"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => switchMode("login")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
            mode === "login"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          Log in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => switchMode("signup")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
            mode === "signup"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          Sign up
        </button>
      </div>

      <AuthForm
        key={mode}
        mode={mode}
        next={next}
        bannerError={bannerError}
        showModeToggle={false}
      />

      <p className="mt-6 text-center text-sm text-slate-400">
        No account needed to browse —{" "}
        <Link href="/listings" className="font-medium text-indigo-400 hover:underline">
          view listings
        </Link>
      </p>
    </div>
  );
}
