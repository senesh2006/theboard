import { AuthForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/layout/page-shell";

export default function SignupPage() {
  return (
    <PageShell
      title="Create an account"
      description="Join as a student looking for work or a poster sharing opportunities."
    >
      <AuthForm mode="signup" />
    </PageShell>
  );
}
