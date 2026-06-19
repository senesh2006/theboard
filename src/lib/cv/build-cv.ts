export type CvFields = {
  cvSummary: string | null;
  cvEducation: string | null;
  cvExperience: string | null;
};

export type ProfileForCv = {
  name: string;
  email: string;
  district: string | null;
  skills: string[];
};

export function mergeProfileIntoCv(
  profile: ProfileForCv,
  current: CvFields = {
    cvSummary: null,
    cvEducation: null,
    cvExperience: null,
  },
): CvFields {
  const location = profile.district ? ` based in ${profile.district}` : "";
  const skillsLine =
    profile.skills.length > 0 ?
      profile.skills.join(", ")
    : "general problem-solving and teamwork";

  return {
    cvSummary:
      current.cvSummary?.trim() ||
      `${profile.name}${location}. Student seeking internships and part-time opportunities. Core skills: ${skillsLine}.`,
    cvEducation:
      current.cvEducation?.trim() ||
      "Education\n— Add your degree, university, and expected graduation year.",
    cvExperience:
      current.cvExperience?.trim() ||
      (profile.skills.length > 0 ?
        `Relevant skills\n— ${profile.skills.map((skill) => `Proficient in ${skill}`).join("\n— ")}`
      : "Experience\n— Add projects, internships, or volunteer work."),
  };
}

export function formatCvDocument(
  profile: ProfileForCv,
  cv: CvFields,
): string {
  const merged = mergeProfileIntoCv(profile, cv);
  const sections = [
    `# ${profile.name}`,
    profile.email,
    profile.district ? `Location: ${profile.district}` : null,
    "",
    "## Summary",
    merged.cvSummary ?? "",
    "",
    "## Education",
    merged.cvEducation ?? "",
    "",
    "## Experience & skills",
    merged.cvExperience ?? "",
  ];

  if (profile.skills.length > 0) {
    sections.push("", "## Skills", profile.skills.join(", "));
  }

  return sections.filter((line) => line !== null).join("\n").trim();
}

export function cvHasContent(cv: CvFields): boolean {
  return Boolean(
    cv.cvSummary?.trim() || cv.cvEducation?.trim() || cv.cvExperience?.trim(),
  );
}
