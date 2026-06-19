"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const q = String(formData.get("q") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const remote = formData.get("remote");
    const partTime = formData.get("partTime");

    if (q) params.set("q", q);
    if (district) params.set("district", district);
    if (remote) params.set("remote", "true");
    if (partTime) params.set("partTime", "true");

    router.push(`/listings?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/listings");
  }

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="q">Keyword</Label>
            <Input
              id="q"
              name="q"
              placeholder="Search title or description"
              defaultValue={searchParams.get("q") ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              name="district"
              placeholder="e.g. Colombo"
              defaultValue={searchParams.get("district") ?? ""}
            />
          </div>
          <div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="remote"
                defaultChecked={searchParams.get("remote") === "true"}
                className="rounded border-slate-300"
              />
              Remote only
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="partTime"
                defaultChecked={searchParams.get("partTime") === "true"}
                className="rounded border-slate-300"
              />
              Part-time only
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="secondary" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </form>
    </Card>
  );
}
