"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  demoLoginAction,
  loginAction,
  signupAction,
  type AuthActionState,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { easeOut } from "@/lib/motion";

type AuthFormProps = {
  mode: "login" | "signup";
  next?: string;
  bannerError?: string | null;
  showModeToggle?: boolean;
};

const initialState: AuthActionState = {};

function SubmitButton({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? loadingLabel : label}
    </Button>
  );
}

export function AuthForm({
  mode,
  next = "/",
  bannerError,
  showModeToggle = true,
}: AuthFormProps) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction] = useFormState(action, initialState);
  const [oauthError, setOauthError] = useState<string | null>(null);

  async function handleGoogle() {
    setOauthError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      mode === "login" ? next : "/onboarding",
    )}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setOauthError(error.message);
  }

  const error = bannerError ?? state.error ?? oauthError;
  const message = state.message;

  return (
    <Card className="mx-auto w-full max-w-md">
        <form action={formAction} className="space-y-4">
          {mode === "login" ? <input type="hidden" name="next" value={next} /> : null}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...easeOut, delay: 0.05 }}
          >
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...easeOut, delay: 0.1 }}
          >
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.p
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-sm text-red-400"
              >
                {error}
              </motion.p>
            ) : null}
            {message ? (
              <motion.p
                key="message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-sm text-emerald-400"
              >
                {message}
              </motion.p>
            ) : null}
          </AnimatePresence>

        <SubmitButton
          label={mode === "login" ? "Log in" : "Create account"}
          loadingLabel="Please wait…"
        />
      </form>

      {mode === "login" ? (
        <form action={demoLoginAction} className="mt-3">
          <Button type="submit" variant="secondary" className="w-full">
            Try demo student (no email)
          </Button>
        </form>
      ) : null}

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle}>
        Continue with Google
      </Button>

      {showModeToggle ? (
        <p className="mt-4 text-center text-sm text-slate-400">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href="/?mode=signup" className="font-medium text-indigo-400 hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/?mode=login" className="font-medium text-indigo-400 hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
      ) : null}
    </Card>
  );
}
