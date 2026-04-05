import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Configure a hosted Postgres connection string in your environment variables."
    );
  }

  let hostname: string;

  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("DATABASE_URL is not a valid database connection string.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    ["127.0.0.1", "localhost", "::1"].includes(hostname)
  ) {
    throw new Error(
      "DATABASE_URL points to localhost in production. Update your Vercel environment variables to use your hosted Postgres database."
    );
  }

  return databaseUrl;
}

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
