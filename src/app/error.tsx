"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-sm text-slate-600">
        This is usually a missing env var or database connection issue on Vercel. Check{" "}
        <code className="rounded bg-slate-100 px-1">DATABASE_URL</code>,{" "}
        <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>, and{" "}
        <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="secondary">
          Go home
        </Button>
      </div>
    </div>
  );
}
