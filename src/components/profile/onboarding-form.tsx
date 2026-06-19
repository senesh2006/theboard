"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, district: district || null, skills, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push(data.redirectTo);
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label>I am a…</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {([Role.STUDENT, Role.POSTER] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  role === option
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="block font-medium">
                  {option === Role.STUDENT ? "Student" : "Poster"}
                </span>
                <span className="mt-1 block text-xs text-slate-600">
                  {option === Role.STUDENT
                    ? "Find internships and gigs"
                    : "Post opportunities for students"}
                </span>
              </button>
            ))}
          </div>
        </div>

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
            placeholder="e.g. Colombo"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="skills">Skills (comma-separated)</Label>
          <Input
            id="skills"
            placeholder="React, Python, Design"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Complete setup"}
        </Button>
      </form>
    </Card>
  );
}
