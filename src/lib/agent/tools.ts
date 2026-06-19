import { prisma } from "@/lib/db";
import { generateJobApplicationAdvice } from "@/lib/agent/advice";
import { formatCvDocument, cvHasContent } from "@/lib/cv/build-cv";
import { buildListingWhere } from "@/lib/listings/queries";
import type {
  AgentListingSummary,
  AgentNavigation,
  AgentStep,
  NimToolDefinition,
} from "@/lib/agent/types";
import type { SessionUser } from "@/lib/auth/session";

export const AGENT_TOOLS: NimToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_listings",
      description:
        "Search active job listings with optional keyword, district, remote, and part-time filters.",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Keyword to match in title or description",
          },
          district: {
            type: "string",
            description: "District or area name",
          },
          remote: {
            type: "boolean",
            description: "Filter to remote-only listings",
          },
          partTime: {
            type: "boolean",
            description: "Filter to part-time listings",
          },
          limit: {
            type: "integer",
            description: "Max results to return (default 5, max 10)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_listing_details",
      description: "Get full details for a specific listing by ID.",
      parameters: {
        type: "object",
        properties: {
          listingId: {
            type: "string",
            description: "The listing ID",
          },
        },
        required: ["listingId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_profile",
      description:
        "Get the current student's profile including district and skills.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_applications",
      description: "List the student's job applications and their statuses.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "match_listings_to_profile",
      description:
        "Find active listings that match the student's skills and district.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Max results (default 5, max 10)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_student_cv",
      description:
        "Get the student's saved CV text built from profile summary, education, and experience.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_application_advice",
      description:
        "Compare the student's CV to a specific job listing and return tailored application advice.",
      parameters: {
        type: "object",
        properties: {
          listingId: {
            type: "string",
            description: "The listing ID to analyze against the CV",
          },
        },
        required: ["listingId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to",
      description:
        "Suggest in-app navigation for the student. Use app paths like /listings, /listings?q=react&remote=true, /listings/{id}, /student/profile, or /student/dashboard.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "In-app path starting with /",
          },
          label: {
            type: "string",
            description: "Short button label for the student",
          },
        },
        required: ["path", "label"],
      },
    },
  },
];

type ToolExecutionContext = {
  user: SessionUser;
  navigation: AgentNavigation[];
  listings: AgentListingSummary[];
  steps: AgentStep[];
};

function toListingSummary(listing: {
  id: string;
  title: string;
  description: string;
  district: string | null;
  isRemote: boolean;
  isPartTime: boolean;
  skillsRequired: string[];
}): AgentListingSummary {
  return {
    id: listing.id,
    title: listing.title,
    district: listing.district,
    isRemote: listing.isRemote,
    isPartTime: listing.isPartTime,
    skillsRequired: listing.skillsRequired,
    excerpt:
      listing.description.length > 160
        ? `${listing.description.slice(0, 160)}…`
        : listing.description,
  };
}

function parseToolArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function executeAgentTool(
  name: string,
  rawArgs: string,
  ctx: ToolExecutionContext,
): Promise<string> {
  const args = parseToolArgs(rawArgs);

  switch (name) {
    case "search_listings": {
      const limit = Math.min(Number(args.limit) || 5, 10);
      const where = buildListingWhere({
        q: typeof args.q === "string" ? args.q : undefined,
        district: typeof args.district === "string" ? args.district : undefined,
        remote: typeof args.remote === "boolean" ? args.remote : undefined,
        partTime: typeof args.partTime === "boolean" ? args.partTime : undefined,
      });

      const results = await prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          district: true,
          isRemote: true,
          isPartTime: true,
          skillsRequired: true,
        },
      });

      for (const listing of results) {
        const summary = toListingSummary(listing);
        if (!ctx.listings.some((item) => item.id === summary.id)) {
          ctx.listings.push(summary);
        }
      }

      ctx.steps.push({
        tool: name,
        summary: `Found ${results.length} listing(s)`,
      });

      return JSON.stringify({
        count: results.length,
        listings: results.map((listing) => ({
          id: listing.id,
          title: listing.title,
          district: listing.district,
          isRemote: listing.isRemote,
          isPartTime: listing.isPartTime,
          skillsRequired: listing.skillsRequired,
        })),
      });
    }

    case "get_listing_details": {
      const listingId = String(args.listingId ?? "");
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          poster: { select: { name: true } },
        },
      });

      if (!listing || listing.status !== "ACTIVE") {
        ctx.steps.push({ tool: name, summary: "Listing not found" });
        return JSON.stringify({ error: "Listing not found or not active" });
      }

      const summary = toListingSummary(listing);
      if (!ctx.listings.some((item) => item.id === summary.id)) {
        ctx.listings.push(summary);
      }

      ctx.steps.push({ tool: name, summary: `Loaded "${listing.title}"` });

      return JSON.stringify({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        district: listing.district,
        isRemote: listing.isRemote,
        isPartTime: listing.isPartTime,
        skillsRequired: listing.skillsRequired,
        deadline: listing.deadline?.toISOString() ?? null,
        posterName: listing.poster.name,
        path: `/listings/${listing.id}`,
      });
    }

    case "get_student_profile": {
      ctx.steps.push({ tool: name, summary: "Loaded student profile" });
      return JSON.stringify({
        name: ctx.user.name,
        email: ctx.user.email,
        district: ctx.user.district,
        skills: ctx.user.skills,
        profilePath: "/student/profile",
      });
    }

    case "get_student_cv": {
      const profile = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          name: true,
          email: true,
          district: true,
          skills: true,
          cvSummary: true,
          cvEducation: true,
          cvExperience: true,
        },
      });

      if (!profile) {
        return JSON.stringify({ error: "Profile not found" });
      }

      const cv = {
        cvSummary: profile.cvSummary,
        cvEducation: profile.cvEducation,
        cvExperience: profile.cvExperience,
      };

      ctx.steps.push({
        tool: name,
        summary: cvHasContent(cv) ? "Loaded student CV" : "CV is empty",
      });

      return JSON.stringify({
        hasCv: cvHasContent(cv),
        cvText: formatCvDocument(profile, cv),
        profilePath: "/student/profile",
      });
    }

    case "get_application_advice": {
      const listingId = String(args.listingId ?? "");
      const profile = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          name: true,
          email: true,
          district: true,
          skills: true,
          cvSummary: true,
          cvEducation: true,
          cvExperience: true,
        },
      });

      if (!profile) {
        return JSON.stringify({ error: "Profile not found" });
      }

      const cv = {
        cvSummary: profile.cvSummary,
        cvEducation: profile.cvEducation,
        cvExperience: profile.cvExperience,
      };

      if (!cvHasContent(cv)) {
        ctx.steps.push({ tool: name, summary: "CV missing" });
        return JSON.stringify({
          error: "CV is empty. Ask the student to add their CV at /student/profile.",
          profilePath: "/student/profile",
        });
      }

      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          description: true,
          district: true,
          isRemote: true,
          isPartTime: true,
          skillsRequired: true,
          status: true,
        },
      });

      if (!listing || listing.status !== "ACTIVE") {
        ctx.steps.push({ tool: name, summary: "Listing not found" });
        return JSON.stringify({ error: "Listing not found or not active" });
      }

      const summary = toListingSummary(listing);
      if (!ctx.listings.some((item) => item.id === summary.id)) {
        ctx.listings.push(summary);
      }

      try {
        const advice = await generateJobApplicationAdvice({
          profile,
          cv,
          listing,
        });

        ctx.steps.push({
          tool: name,
          summary: `Generated advice for "${listing.title}"`,
        });

        ctx.navigation.push({
          path: `/listings/${listing.id}`,
          label: "View job",
        });

        return JSON.stringify({
          listingId: listing.id,
          listingTitle: listing.title,
          advice,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Advice generation failed";
        return JSON.stringify({ error: message });
      }
    }

    case "get_my_applications": {
      const applications = await prisma.application.findMany({
        where: { studentId: ctx.user.id },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              status: true,
              district: true,
            },
          },
        },
      });

      ctx.steps.push({
        tool: name,
        summary: `Loaded ${applications.length} application(s)`,
      });

      return JSON.stringify({
        count: applications.length,
        applications: applications.map((application) => ({
          id: application.id,
          status: application.status,
          listingId: application.listing.id,
          listingTitle: application.listing.title,
          listingStatus: application.listing.status,
          listingPath: `/listings/${application.listing.id}`,
          appliedAt: application.createdAt.toISOString(),
        })),
        dashboardPath: "/student/dashboard",
      });
    }

    case "match_listings_to_profile": {
      const limit = Math.min(Number(args.limit) || 5, 10);
      const skills = ctx.user.skills;
      const district = ctx.user.district;

      const matchConditions: Array<Record<string, unknown>> = [];
      if (skills.length > 0) {
        matchConditions.push({ skillsRequired: { hasSome: skills } });
      }
      if (district) {
        matchConditions.push({
          district: { contains: district, mode: "insensitive" },
        });
      }

      const listings = await prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          ...(matchConditions.length > 0 ? { OR: matchConditions } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        select: {
          id: true,
          title: true,
          description: true,
          district: true,
          isRemote: true,
          isPartTime: true,
          skillsRequired: true,
        },
      });

      const scored = listings
        .map((listing) => {
          const skillOverlap = listing.skillsRequired.filter((skill) =>
            skills.some(
              (userSkill) =>
                userSkill.toLowerCase() === skill.toLowerCase(),
            ),
          ).length;
          const districtMatch =
            district &&
            listing.district?.toLowerCase().includes(district.toLowerCase())
              ? 1
              : 0;
          return { listing, score: skillOverlap * 2 + districtMatch };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      for (const { listing } of scored) {
        const summary = toListingSummary(listing);
        if (!ctx.listings.some((item) => item.id === summary.id)) {
          ctx.listings.push(summary);
        }
      }

      ctx.steps.push({
        tool: name,
        summary: `Matched ${scored.length} listing(s) to profile`,
      });

      return JSON.stringify({
        studentSkills: skills,
        studentDistrict: district,
        matches: scored.map(({ listing, score }) => ({
          id: listing.id,
          title: listing.title,
          score,
          district: listing.district,
          isRemote: listing.isRemote,
          isPartTime: listing.isPartTime,
          skillsRequired: listing.skillsRequired,
          path: `/listings/${listing.id}`,
        })),
      });
    }

    case "navigate_to": {
      const path = String(args.path ?? "");
      const label = String(args.label ?? "Open page");

      if (!path.startsWith("/")) {
        return JSON.stringify({ error: "Path must start with /" });
      }

      ctx.navigation.push({ path, label });
      ctx.steps.push({ tool: name, summary: `Navigate to ${path}` });

      return JSON.stringify({ ok: true, path, label });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

export const AGENT_SYSTEM_PROMPT = `You are TheBoard Job Finder, an AI assistant that helps students discover internships and part-time jobs on TheBoard app.

You can search listings, match jobs to the student's profile, read their CV, generate application advice for a specific job, check their applications, and guide them to relevant pages inside the app.

App routes you can navigate students to:
- /listings — browse all jobs (supports query params: q, district, remote=true, partTime=true)
- /listings/{id} — view a specific job and apply
- /student/dashboard — see application status
- /student/profile — update profile, build CV, use "Add profile to CV"
- /student/agent — this chat (select a job + Get application advice in the sidebar)

Guidelines:
- Start by understanding what the student wants: location, remote preference, skills, application status, or CV advice for a job.
- Use tools before giving specific job recommendations. Do not invent listing IDs or titles.
- For CV or application advice, call get_student_cv first if needed, then get_application_advice with a real listing ID from search results.
- When you find good matches, call navigate_to so the student can open the page.
- Keep responses concise and friendly. Summarize top picks with brief reasons.
- If the student's CV is empty, tell them to open /student/profile and click "Add profile to CV".
- You cannot submit applications on their behalf; tell them to open the listing and click Apply.`;
