import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

type HomePageProps = {
  searchParams: { mode?: string; next?: string; error?: string };
};

function getBannerError(error?: string) {
  switch (error) {
    case "config":
      return "Auth is not configured. Check Supabase env vars on Vercel.";
    case "auth":
      return "Sign-in failed. Try again or use email/password.";
    case "demo":
      return "Demo login is disabled. Set ENABLE_DEMO_BYPASS=true on Vercel.";
    case "demo-data":
      return "Demo data missing. Set SEED_DEMO_DATA=true on Vercel or run npm run db:seed.";
    default:
      return null;
  }
}

function HomeAuthPanel({
  mode,
  next,
  bannerError,
}: {
  mode: "login" | "signup";
  next?: string;
  bannerError?: string | null;
}) {
  return <AuthPanel initialMode={mode} next={next} bannerError={bannerError} />;
}

export default function HomePage({ searchParams }: HomePageProps) {
  const mode = searchParams.mode === "signup" ? "signup" : "login";
  const bannerError = getBannerError(searchParams.error);

  return (
    <PageShell
      title="Student Job Matching Board"
      description="Find internships and gigs in one place — or post opportunities for students near you."
      actions={
        <Button href="/listings" variant="secondary" size="sm">
          Browse listings
        </Button>
      }
    >
      <Suspense
        fallback={
          <div className="mx-auto h-96 w-full max-w-md animate-pulse rounded-xl bg-slate-800/50" />
        }
      >
        <HomeAuthPanel mode={mode} next={searchParams.next} bannerError={bannerError} />
      </Suspense>
    </PageShell>
  );
}
