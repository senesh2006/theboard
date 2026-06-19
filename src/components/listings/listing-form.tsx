"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export function ListingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [isPartTime, setIsPartTime] = useState(false);
  const [skillsText, setSkillsText] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const skillsRequired = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        district: district || null,
        isRemote,
        isPartTime,
        skillsRequired,
        deadline: deadline || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push(`/listings/${data.listing.id}`);
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            required
            minLength={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="district">District / area</Label>
          <Input
            id="district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="rounded border-slate-300"
            />
            Remote
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPartTime}
              onChange={(e) => setIsPartTime(e.target.checked)}
              className="rounded border-slate-300"
            />
            Part-time
          </label>
        </div>
        <div>
          <Label htmlFor="skills">Skills required (comma-separated)</Label>
          <Input
            id="skills"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="deadline">Application deadline (optional)</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Publishing…" : "Publish listing"}
        </Button>
      </form>
    </Card>
  );
}
