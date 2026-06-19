import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";

type LoginPageProps = {
  searchParams: { next?: string; error?: string };
};

function LoginForm({
  next,
  bannerError,
}: {
  next?: string;
  bannerError?: string | null;
}) {
  return <AuthForm mode="login" next={next ?? "/"} bannerError={bannerError} />;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const bannerError =
    searchParams.error === "config"
      ? "Auth is not configured. Check Supabase env vars on Vercel."
      : searchParams.error === "auth"
        ? "Sign-in failed. Try again or use email/password."
        : searchParams.error === "demo"
          ? "Demo login is disabled. Set ENABLE_DEMO_BYPASS=true on Vercel."
          : searchParams.error === "demo-data"
            ? "Demo data missing. Set SEED_DEMO_DATA=true on Vercel or run npm run db:seed."
            : null;

  return (
    <PageShell
      title="Log in"
      description="Access your dashboard, applications, and saved searches."
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <LoginForm next={searchParams.next} bannerError={bannerError} />
      </Suspense>
    </PageShell>
  );
}
