"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AuthForm } from "@/components/auth/auth-form";
import { cn } from "@/lib/utils";
import { easeOut, fadeUp, slideFromLeft, slideFromRight, springSnappy } from "@/lib/motion";

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
  const reduceMotion = useReducedMotion();
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

  const formVariants = mode === "login" ? slideFromLeft : slideFromRight;

  return (
    <motion.div
      className="mx-auto w-full max-w-md"
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={fadeUp}
      transition={{ ...easeOut, delay: 0.05 }}
    >
      <div
        className="relative mb-6 flex rounded-xl border border-white/10 bg-slate-900/50 p-1"
        role="tablist"
        aria-label="Log in or sign up"
      >
        {!reduceMotion ? (
          <motion.span
            layoutId="auth-tab-pill"
            className="absolute inset-y-1 rounded-lg bg-indigo-600 shadow-sm"
            style={{
              width: "calc(50% - 4px)",
              left: mode === "login" ? 4 : "calc(50% + 0px)",
            }}
            transition={springSnappy}
            aria-hidden
          />
        ) : null}
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => switchMode("login")}
          className={cn(
            "relative z-10 flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
            mode === "login" ? "text-white" : "text-slate-400 hover:text-slate-200",
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
            "relative z-10 flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
            mode === "signup" ? "text-white" : "text-slate-400 hover:text-slate-200",
          )}
        >
          Sign up
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          exit={reduceMotion ? undefined : "exit"}
          variants={formVariants}
          transition={easeOut}
        >
          <AuthForm
            mode={mode}
            next={next}
            bannerError={bannerError}
            showModeToggle={false}
          />
        </motion.div>
      </AnimatePresence>

      <motion.p
        className="mt-6 text-center text-sm text-slate-400"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...easeOut, delay: 0.2 }}
      >
        No account needed to browse —{" "}
        <Link href="/listings" className="font-medium text-indigo-400 hover:underline">
          view listings
        </Link>
      </motion.p>
    </motion.div>
  );
}
