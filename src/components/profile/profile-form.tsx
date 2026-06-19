"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

type ProfileFormProps = {
  initial: {
    name: string;
    district: string | null;
    skills: string[];
  };
  redirectTo: string;
};

export function ProfileForm({ initial, redirectTo }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [district, setDistrict] = useState(initial.district ?? "");
  const [skillsText, setSkillsText] = useState(initial.skills.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, district: district || null, skills }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
    if (redirectTo) {
      setTimeout(() => router.push(redirectTo), 600);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
        <div>
          <Label htmlFor="skills">Skills (comma-separated)</Label>
          <Input
            id="skills"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? (
          <p className="text-sm text-emerald-600">Profile updated.</p>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </Card>
  );
}
