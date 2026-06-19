"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_LABELS } from "@/lib/validations/application";

type ApplyButtonProps = {
  listingId: string;
  listingStatus: "ACTIVE" | "CLOSED" | "FLAGGED";
  existingStatus?: ApplicationStatus | null;
};

export function ApplyButton({
  listingId,
  listingStatus,
  existingStatus,
}: ApplyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ApplicationStatus | null>(
    existingStatus ?? null,
  );

  if (listingStatus !== "ACTIVE") {
    return (
      <p className="text-sm text-slate-500">This listing is no longer accepting applications.</p>
    );
  }

  if (status) {
    return (
      <div className="rounded-lg bg-indigo-50 px-3 py-2">
        <p className="text-sm font-medium text-indigo-900">You applied</p>
        <p className="text-xs text-indigo-700">
          Status: {APPLICATION_STATUS_LABELS[status]}
        </p>
      </div>
    );
  }

  async function handleApply() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not apply");
      setLoading(false);
      return;
    }

    setStatus(data.application.status);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <Button className="w-full" onClick={handleApply} disabled={loading}>
        {loading ? "Applying…" : "Apply now"}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
