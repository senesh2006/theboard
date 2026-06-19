"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
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

type AuthFormProps = {
  mode: "login" | "signup";
  next?: string;
  bannerError?: string | null;
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

export function AuthForm({ mode, next = "/", bannerError }: AuthFormProps) {
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
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

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
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle}>
        Continue with Google
      </Button>

      <p className="mt-4 text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
