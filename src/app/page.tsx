import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiquidGlassContainerView } from "@/components/ui/liquid-glass";

export default function HomePage() {
  return (
    <PageShell
      title="Student Job Matching Board"
      description="Stop scrolling group chats and DMs. Find internships and gigs in one place — or post opportunities for students near you."
    >
      <LiquidGlassContainerView spacing={16} className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col" interactive>
          <h2 className="text-lg font-semibold text-slate-900">Students</h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            Browse roles filtered by district, remote work, part-time hours, and skills.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href="/listings">Browse listings</Button>
            <Button href="/login" variant="secondary">
              Try demo
            </Button>
            <Button href="/signup" variant="secondary">
              Sign up
            </Button>
          </div>
        </Card>
        <Card className="flex flex-col" interactive>
          <h2 className="text-lg font-semibold text-slate-900">Posters</h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            Publish internships and gigs to reach students with matching skills and location.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href="/signup">Get started</Button>
            <Button href="/login" variant="secondary">
              Log in
            </Button>
          </div>
        </Card>
      </LiquidGlassContainerView>
    </PageShell>
  );
}
