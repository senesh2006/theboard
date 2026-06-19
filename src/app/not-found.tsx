import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell title="Not found">
      <p className="text-slate-600">This page or listing doesn&apos;t exist.</p>
      <Button href="/listings" variant="secondary" className="mt-4">
        Browse listings
      </Button>
    </PageShell>
  );
}
