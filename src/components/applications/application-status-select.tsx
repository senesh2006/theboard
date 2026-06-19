"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { APPLICATION_STATUS_LABELS } from "@/lib/validations/application";

const POSTER_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.VIEWED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.REJECTED,
];

type ApplicationStatusSelectProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
  studentName: string;
};

export function ApplicationStatusSelect({
  applicationId,
  currentStatus,
  studentName,
}: ApplicationStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextStatus: ApplicationStatus) {
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update status");
      setLoading(false);
      return;
    }

    setStatus(data.application.status);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-slate-900">{studentName}</p>
        <ApplicationStatusBadge status={status} className="mt-1" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500" htmlFor={`status-${applicationId}`}>
          Update status
        </label>
        <select
          id={`status-${applicationId}`}
          value={status}
          disabled={loading}
          onChange={(e) => handleChange(e.target.value as ApplicationStatus)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm disabled:opacity-50"
        >
          <option value={ApplicationStatus.APPLIED}>
            {APPLICATION_STATUS_LABELS.APPLIED}
          </option>
          {POSTER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {APPLICATION_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
