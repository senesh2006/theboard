import { OnboardingForm } from "@/components/profile/onboarding-form";
import { PageShell } from "@/components/layout/page-shell";

export default function OnboardingPage() {
  return (
    <PageShell
      title="Set up your profile"
      description="Tell us who you are so we can match you with the right experience."
    >
      <OnboardingForm />
    </PageShell>
  );
}
