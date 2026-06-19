"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { mergeProfileIntoCv } from "@/lib/cv/build-cv";
import { readJsonResponse } from "@/lib/read-json-response";

type StudentProfileEditorProps = {
  initial: {
    name: string;
    email: string;
    district: string | null;
    skills: string[];
    cvSummary: string | null;
    cvEducation: string | null;
    cvExperience: string | null;
  };
  redirectTo: string;
};

export function StudentProfileEditor({ initial, redirectTo }: StudentProfileEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [district, setDistrict] = useState(initial.district ?? "");
  const [skillsText, setSkillsText] = useState(initial.skills.join(", "));
  const [cvSummary, setCvSummary] = useState(initial.cvSummary ?? "");
  const [cvEducation, setCvEducation] = useState(initial.cvEducation ?? "");
  const [cvExperience, setCvExperience] = useState(initial.cvExperience ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleImportProfileToCv() {
    const skills = skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const merged = mergeProfileIntoCv(
      {
        name,
        email: initial.email,
        district: district || null,
        skills,
      },
      {
        cvSummary: cvSummary || null,
        cvEducation: cvEducation || null,
        cvExperience: cvExperience || null,
      },
    );

    setCvSummary(merged.cvSummary ?? "");
    setCvEducation(merged.cvEducation ?? "");
    setCvExperience(merged.cvExperience ?? "");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const skills = skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        district: district || null,
        skills,
        cvSummary: cvSummary.trim() || null,
        cvEducation: cvEducation.trim() || null,
        cvExperience: cvExperience.trim() || null,
      }),
    });

    const data = await readJsonResponse<{ error?: string }>(res);
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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Profile</h2>
            <p className="mt-1 text-sm text-slate-600">
              Used for job matching and to pre-fill your CV.
            </p>
          </div>

          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="district">District / area</Label>
            <Input
              id="district"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">CV</h2>
                <p className="mt-1 text-sm text-slate-600">
                  The Job Agent reads this when you ask for application advice.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={handleImportProfileToCv}>
                Add profile to CV
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="cvSummary">Summary</Label>
            <Textarea
              id="cvSummary"
              value={cvSummary}
              onChange={(event) => setCvSummary(event.target.value)}
              placeholder="Short intro about you and what you are looking for…"
            />
          </div>

          <div>
            <Label htmlFor="cvEducation">Education</Label>
            <Textarea
              id="cvEducation"
              value={cvEducation}
              onChange={(event) => setCvEducation(event.target.value)}
              placeholder="Degree, school, graduation year…"
            />
          </div>

          <div>
            <Label htmlFor="cvExperience">Experience & projects</Label>
            <Textarea
              id="cvExperience"
              value={cvExperience}
              onChange={(event) => setCvExperience(event.target.value)}
              placeholder="Internships, projects, volunteer work…"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">Profile and CV saved.</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save profile & CV"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
