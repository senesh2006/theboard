/**
 * Seeds fake listings + a Prisma-only demo student (no Supabase auth).
 *
 * Required: DATABASE_URL
 * Run: npm run db:seed
 * Vercel: set SEED_DEMO_DATA=true to run automatically on deploy
 */

import { PrismaClient, Role, ListingStatus, ApplicationStatus } from "@prisma/client";

export const DEMO_STUDENT_ID = "theboard-demo-student";

const EMPLOYERS = [
  { id: "poster-acme-labs", name: "Acme Labs", email: "jobs@acmelabs.lk", district: "Colombo" },
  { id: "poster-wave-analytics", name: "Wave Analytics", email: "careers@wave.lk", district: "Colombo" },
  { id: "poster-kandy-digital", name: "Kandy Digital", email: "hello@kandydigital.lk", district: "Kandy" },
  { id: "poster-ceylon-creative", name: "Ceylon Creative", email: "studio@ceyloncreative.lk", district: "Colombo" },
  { id: "poster-fintech-lanka", name: "FinTech Lanka", email: "talent@fintechlanka.lk", district: "Colombo" },
  { id: "poster-greencode", name: "GreenCode", email: "team@greencode.io", district: "Colombo" },
  { id: "poster-campus-connect", name: "Campus Connect", email: "ops@campusconnect.lk", district: "Colombo" },
  { id: "poster-pixel-studios", name: "Pixel Studios", email: "work@pixelstudios.lk", district: "Galle" },
  { id: "poster-databridge", name: "DataBridge", email: "hr@databridge.lk", district: "Colombo" },
  { id: "poster-spark-marketing", name: "Spark Marketing", email: "join@sparkmarketing.lk", district: "Negombo" },
];

const JOB_TEMPLATES = [
  {
    title: "Frontend Developer Intern",
    description: "Build React features for our customer dashboard. Pair with a senior engineer twice a week.",
    skillsRequired: ["React", "TypeScript", "CSS"],
  },
  {
    title: "Backend API Gig",
    description: "Help maintain Node.js REST endpoints and write integration tests. 10–12 hours per week.",
    skillsRequired: ["Node.js", "PostgreSQL", "API Design"],
  },
  {
    title: "UI/UX Design Assistant",
    description: "Create wireframes and high-fidelity screens in Figma for mobile and web products.",
    skillsRequired: ["UI Design", "Figma", "Prototyping"],
  },
  {
    title: "Python Data Intern",
    description: "Clean datasets, run exploratory analysis, and document findings for the product team.",
    skillsRequired: ["Python", "Data Analysis", "Pandas"],
  },
  {
    title: "Content & Social Media Intern",
    description: "Draft blog posts, schedule social content, and track engagement metrics.",
    skillsRequired: ["Writing", "Social Media", "Canva"],
  },
  {
    title: "Mobile App Tester",
    description: "Run test plans on Android builds, log bugs, and verify fixes before release.",
    skillsRequired: ["QA", "Mobile Testing", "Attention to Detail"],
  },
  {
    title: "DevOps Helper (Part-time)",
    description: "Assist with CI pipelines, Docker configs, and staging deployments.",
    skillsRequired: ["Docker", "Git", "Linux"],
  },
  {
    title: "Customer Support Associate",
    description: "Answer user tickets, update help docs, and escalate bugs to engineering.",
    skillsRequired: ["Communication", "Customer Service", "Documentation"],
  },
  {
    title: "Machine Learning Research Assistant",
    description: "Label data, reproduce baseline models, and summarize papers for the ML team.",
    skillsRequired: ["Python", "Machine Learning", "Research"],
  },
  {
    title: "Video Editing Gig",
    description: "Edit short-form product demos and event recaps for YouTube and Instagram.",
    skillsRequired: ["Video Editing", "Premiere Pro", "Storytelling"],
  },
];

const DISTRICTS = ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo", null];

const prisma = new PrismaClient();

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function pick(array, index) {
  return array[index % array.length];
}

function buildListingSeed(posterId, posterDistrict, index) {
  const template = pick(JOB_TEMPLATES, index);
  const isRemote = index % 3 === 0;
  const isPartTime = index % 2 === 0;
  const district = isRemote ? (index % 4 === 0 ? posterDistrict : pick(DISTRICTS, index)) : posterDistrict;

  return {
    posterId,
    title: `${template.title}${index > 9 ? ` (#${index + 1})` : ""}`,
    description: template.description,
    district,
    isRemote,
    isPartTime,
    skillsRequired: template.skillsRequired,
    deadline: daysFromNow(7 + (index % 45)),
    viewCount: 5 + ((index * 17) % 120),
    status: ListingStatus.ACTIVE,
  };
}

async function clearSeedData(posterIds) {
  await prisma.message.deleteMany({
    where: { application: { studentId: DEMO_STUDENT_ID } },
  });
  await prisma.application.deleteMany({
    where: { OR: [{ studentId: DEMO_STUDENT_ID }, { listing: { posterId: { in: posterIds } } }] },
  });
  await prisma.savedSearch.deleteMany({ where: { studentId: DEMO_STUDENT_ID } });
  await prisma.report.deleteMany({
    where: {
      OR: [{ reporterId: DEMO_STUDENT_ID }, { listing: { posterId: { in: posterIds } } }],
    },
  });
  await prisma.listing.deleteMany({ where: { posterId: { in: posterIds } } });
  await prisma.user.deleteMany({
    where: { id: { in: [DEMO_STUDENT_ID, ...posterIds] } },
  });
}

async function seedEmployers() {
  for (const employer of EMPLOYERS) {
    await prisma.user.create({
      data: {
        id: employer.id,
        email: employer.email,
        name: employer.name,
        role: Role.POSTER,
        district: employer.district,
        skills: [],
      },
    });
  }
}

async function seedListings() {
  const rows = [];
  let index = 0;

  for (const employer of EMPLOYERS) {
    for (let i = 0; i < 6; i += 1) {
      rows.push(buildListingSeed(employer.id, employer.district, index));
      index += 1;
    }
  }

  await prisma.listing.createMany({ data: rows });
  return prisma.listing.findMany({
    where: { posterId: { in: EMPLOYERS.map((e) => e.id) } },
    orderBy: { createdAt: "asc" },
  });
}

async function seedDemoStudent() {
  return prisma.user.create({
    data: {
      id: DEMO_STUDENT_ID,
      email: "guest@theboard.app",
      name: "Jordan Smith",
      role: Role.STUDENT,
      district: "Colombo",
      skills: ["React", "TypeScript", "Python", "UI Design"],
      cvSummary:
        "Jordan Smith based in Colombo. Final-year CS student seeking frontend internships and part-time dev gigs. Strong in React, TypeScript, and UI design.",
      cvEducation:
        "BSc Computer Science — University of Colombo (expected 2026)\nRelevant coursework: Web development, databases, algorithms",
      cvExperience:
        "Personal projects — Built a student marketplace UI with React and Next.js\nVolunteer — Tutored juniors on HTML/CSS basics",
    },
  });
}

async function seedApplications(studentId, listings) {
  const picks = listings.filter((_, i) => i % 7 === 0).slice(0, 8);
  const statuses = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.VIEWED,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
  ];

  for (let i = 0; i < picks.length; i += 1) {
    await prisma.application.create({
      data: {
        listingId: picks[i].id,
        studentId,
        status: pick(statuses, i),
      },
    });
  }

  const firstApplication = await prisma.application.findFirst({
    where: { studentId },
    orderBy: { createdAt: "asc" },
  });

  if (firstApplication) {
    const posterId = listings[0].posterId;
    await prisma.message.createMany({
      data: [
        {
          applicationId: firstApplication.id,
          senderId: posterId,
          body: "Hi Jordan — thanks for applying. Can you share a link to something you have built?",
        },
        {
          applicationId: firstApplication.id,
          senderId: studentId,
          body: "Sure — I will send my portfolio link. I am free for a call Thursday afternoon.",
        },
      ],
    });
  }

  await prisma.savedSearch.create({
    data: {
      studentId,
      filters: {
        district: "Colombo",
        remote: true,
        partTime: true,
        skills: ["React", "TypeScript"],
      },
    },
  });
}

async function main() {
  const posterIds = EMPLOYERS.map((e) => e.id);

  console.log("Seeding sample employers, listings, and demo student…\n");

  await clearSeedData(posterIds);
  await seedEmployers();
  const listings = await seedListings();
  const student = await seedDemoStudent();
  await seedApplications(student.id, listings);

  console.log(`Created ${EMPLOYERS.length} employers`);
  console.log(`Created ${listings.length} active listings (browse /listings — no login needed)`);
  console.log("");
  console.log("Demo student (cookie login — no Supabase):");
  console.log("  Log in page → Try demo student (no email)");
  console.log("  Requires ENABLE_DEMO_BYPASS=true on Vercel");
  console.log("");
  console.log(`Demo profile: ${student.name} · ${student.district}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
