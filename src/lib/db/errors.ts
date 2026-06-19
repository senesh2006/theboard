import { Prisma } from "@prisma/client";

export function databaseErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Database is not configured. Set DATABASE_URL on Vercel and redeploy.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return "Database tables are missing. Run prisma migrate deploy on your database.";
    }
  }

  console.error("Database error:", error);
  return "Could not reach the database. Check DATABASE_URL and try again.";
}

export async function withDatabase<T>(
  fn: () => Promise<T>,
): Promise<{ data: T } | { error: string }> {
  try {
    return { data: await fn() };
  } catch (error) {
    return { error: databaseErrorMessage(error) };
  }
}
