/**
 * Seeds demo auth users (Supabase Admin API) and mock app data (Prisma).
 *
 * Required env:
 *   DATABASE_URL
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: npm run db:seed
 */

import { PrismaClient, Role, ListingStatus, ApplicationStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const DEMO_PASSWORD = "Demo1234!";

const ACCOUNTS = {
  student: {
    email: "demo@theboard.app",
    name: "Alex Chen",
    role: Role.STUDENT,
    district: "Colombo",
    skills: ["React", "TypeScript", "Python", "UI Design"],
  },
  poster: {
    email: "employer@theboard.app",
    name: "Lanka Tech Labs",
    role: Role.POSTER,
    district: "Colombo",
    skills: [],
  },
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Add it to .env or Vercel env vars.`);
    process.exit(1);
  }
  return value;
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const prisma = new PrismaClient();

async function findAuthUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function getOrCreateAuthUser(account) {
  const metadata = { role: account.role, name: account.name };
  const existing = await findAuthUserByEmail(account.email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) throw error;
  return data.user.id;
}

async function upsertAppUser(id, account) {
  return prisma.user.upsert({
    where: { id },
    create: {
      id,
      email: account.email,
      name: account.name,
      role: account.role,
      district: account.district,
      skills: account.skills,
    },
    update: {
      email: account.email,
      name: account.name,
      role: account.role,
      district: account.district,
      skills: account.skills,
    },
  });
}

async function clearDemoData(studentId, posterId) {
  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: studentId },
        { application: { studentId } },
        { application: { listing: { posterId } } },
      ],
    },
  });

  await prisma.application.deleteMany({
    where: {
      OR: [{ studentId }, { listing: { posterId } }],
    },
  });

  await prisma.savedSearch.deleteMany({ where: { studentId } });
  await prisma.report.deleteMany({
    where: {
      OR: [{ reporterId: studentId }, { listing: { posterId } }],
    },
  });

  await prisma.listing.deleteMany({ where: { posterId } });
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seedListings(posterId) {
  const listings = [
    {
      title: "Frontend Developer Intern",
      description:
        "Join our product team to build React dashboards for local SMEs. You'll pair with a senior dev, ship small features weekly, and learn our design system.",
      district: "Colombo",
      isRemote: false,
      isPartTime: true,
      skillsRequired: ["React", "TypeScript", "CSS"],
      deadline: daysFromNow(21),
      viewCount: 42,
    },
    {
      title: "Python Data Assistant (Remote)",
      description:
        "Help clean and label datasets for a climate analytics project. Comfortable with pandas and basic statistics. 10–15 hours per week.",
      district: null,
      isRemote: true,
      isPartTime: true,
      skillsRequired: ["Python", "Data Analysis"],
      deadline: daysFromNow(30),
      viewCount: 18,
    },
    {
      title: "UI/UX Design Gig — Mobile App",
      description:
        "We need wireframes and a clickable Figma prototype for a student marketplace app. Portfolio link required in your application.",
      district: "Colombo",
      isRemote: true,
      isPartTime: false,
      skillsRequired: ["UI Design", "Figma"],
      deadline: daysFromNow(14),
      viewCount: 27,
    },
    {
      title: "Part-time React Tutor",
      description:
        "Tutor first-year CS students on React hooks and component patterns. Sessions are 2 evenings per week on campus.",
      district: "Colombo",
      isRemote: false,
      isPartTime: true,
      skillsRequired: ["React", "Teaching"],
      deadline: daysFromNow(45),
      viewCount: 11,
    },
    {
      title: "Marketing & Content Intern",
      description:
        "Write blog posts and social copy for a fintech startup. No coding required — strong writing and curiosity about tech finance.",
      district: "Kandy",
      isRemote: true,
      isPartTime: true,
      skillsRequired: ["Writing", "Social Media"],
      deadline: daysFromNow(20),
      viewCount: 9,
    },
  ];

  const created = [];
  for (const listing of listings) {
    created.push(
      await prisma.listing.create({
        data: {
          posterId,
          status: ListingStatus.ACTIVE,
          ...listing,
        },
      }),
    );
  }
  return created;
}

async function main() {
  console.log("Seeding demo accounts and mock data…\n");

  const studentAuthId = await getOrCreateAuthUser(ACCOUNTS.student);
  const posterAuthId = await getOrCreateAuthUser(ACCOUNTS.poster);

  const student = await upsertAppUser(studentAuthId, ACCOUNTS.student);
  const poster = await upsertAppUser(posterAuthId, ACCOUNTS.poster);

  await clearDemoData(student.id, poster.id);
  const listings = await seedListings(poster.id);

  const [frontendListing, pythonListing, designListing] = listings;

  const appliedApplication = await prisma.application.create({
    data: {
      listingId: frontendListing.id,
      studentId: student.id,
      status: ApplicationStatus.VIEWED,
    },
  });

  await prisma.application.create({
    data: {
      listingId: pythonListing.id,
      studentId: student.id,
      status: ApplicationStatus.APPLIED,
    },
  });

  await prisma.application.create({
    data: {
      listingId: designListing.id,
      studentId: student.id,
      status: ApplicationStatus.INTERVIEW,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        applicationId: appliedApplication.id,
        senderId: poster.id,
        body: "Hi Alex — we liked your profile. Are you available for a quick call this week?",
      },
      {
        applicationId: appliedApplication.id,
        senderId: student.id,
        body: "Thanks! I'm free Thursday after 4pm. Looking forward to it.",
      },
    ],
  });

  await prisma.savedSearch.create({
    data: {
      studentId: student.id,
      filters: {
        district: "Colombo",
        remote: true,
        partTime: true,
        skills: ["React", "TypeScript"],
      },
    },
  });

  console.log("Demo accounts (password for both):", DEMO_PASSWORD);
  console.log("");
  console.log("  Student — log in, browse listings, view applications");
  console.log(`    Email:    ${ACCOUNTS.student.email}`);
  console.log(`    Password: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("  Poster — manage listings and applicants");
  console.log(`    Email:    ${ACCOUNTS.poster.email}`);
  console.log(`    Password: ${DEMO_PASSWORD}`);
  console.log("");
  console.log(`Created ${listings.length} listings, 3 applications, 2 messages, 1 saved search.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
