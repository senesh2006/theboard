import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";

export default function LoginPage() {
  return (
    <PageShell
      title="Log in"
      description="Access your dashboard, applications, and saved searches."
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <AuthForm mode="login" />
      </Suspense>
    </PageShell>
  );
}
