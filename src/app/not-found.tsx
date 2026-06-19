import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell title="Not found">
      <p className="text-slate-600">This page or listing doesn&apos;t exist.</p>
      <Link href="/listings" className="mt-4 inline-block">
        <Button variant="secondary">Browse listings</Button>
      </Link>
    </PageShell>
  );
}
