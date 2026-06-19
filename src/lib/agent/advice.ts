import type { Listing } from "@prisma/client";
import { createNimCompletion } from "@/lib/agent/nim-client";
import { formatCvDocument, type CvFields, type ProfileForCv } from "@/lib/cv/build-cv";

const ADVICE_SYSTEM_PROMPT = `You are a career coach helping students apply for internships and part-time jobs in Sri Lanka.

You will receive the student's CV and a job listing. Give practical, specific application advice.

Structure your response with these sections (use plain text headings):
1. Fit score — rate match 1-10 with one sentence why
2. Strengths — 2-3 bullets where the CV aligns with the job
3. Gaps — 2-3 bullets on missing skills or experience
4. CV tweaks — concrete edits to summary, education, or experience sections
5. Application tips — cover letter angle and interview prep (3 short bullets)

Be encouraging but honest. Do not invent experience the student does not have. Keep the total response under 400 words.`;

export async function generateJobApplicationAdvice(input: {
  profile: ProfileForCv;
  cv: CvFields;
  listing: Pick<
    Listing,
    | "title"
    | "description"
    | "district"
    | "isRemote"
    | "isPartTime"
    | "skillsRequired"
  >;
}): Promise<string> {
  const cvDocument = formatCvDocument(input.profile, input.cv);

  const jobDetails = [
    `Title: ${input.listing.title}`,
    `District: ${input.listing.district ?? "Not specified"}`,
    `Remote: ${input.listing.isRemote ? "Yes" : "No"}`,
    `Part-time: ${input.listing.isPartTime ? "Yes" : "No"}`,
    `Skills required: ${input.listing.skillsRequired.join(", ") || "Not specified"}`,
    "",
    "Description:",
    input.listing.description,
  ].join("\n");

  const userPrompt = `## Student CV\n\n${cvDocument}\n\n## Job listing\n\n${jobDetails}\n\nAnalyze the CV against this job and provide application advice.`;

  return createNimCompletion(ADVICE_SYSTEM_PROMPT, userPrompt, { maxTokens: 900 });
}
