import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { PrismaClient, Prisma } from "@/generated/prisma/client";

const JsonValueSchema = z.unknown();

const EntitySchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "CHARACTER",
    "STORY",
    "INSTITUTION",
    "LOCATION",
    "DOCTRINE",
    "EVENT",
    "TERM",
    "ARTIFACT",
    "OTHER",
  ]),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  body: z.string().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "DEPRECATED"]),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]),
  aliases: z.array(z.string()),
  tags: z.array(z.string()),
  searchKeywords: z.array(z.string()),
  featuredImage: z.string().nullable(),
  metadata: JsonValueSchema.nullable(),
  parentId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  version: z.number().int(),
});

const RevisionSchema = z.object({
  id: z.string().min(1),
  entityId: z.string().min(1),
  version: z.number().int(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  body: z.string().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "DEPRECATED"]),
  visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]),
  aliases: z.array(z.string()),
  tags: z.array(z.string()),
  searchKeywords: z.array(z.string()),
  metadata: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
});

const RelationshipSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "BELONGS_TO",
    "APPEARS_IN",
    "LOCATED_IN",
    "RULES_OVER",
    "CREATED_BY",
    "PRECEDES",
    "FOLLOWS",
    "OPPOSES",
    "SUPPORTS",
    "REFERENCES",
    "AFFILIATED_WITH",
    "IS_A",
    "PART_OF",
    "RELATED_TO",
  ]),
  sourceEntityId: z.string().min(1),
  targetEntityId: z.string().min(1),
  notes: z.string().nullable(),
  weight: z.number().int().nullable().optional(),
  directionality: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const ExportSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
  revisions: z.array(RevisionSchema),
});

function toNullableJson(value: unknown | null) {
  return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    throw new Error("DATABASE_URL is required.");
  }

  return url;
}

async function main() {
  const filePath = process.argv[2];
  const shouldClear = process.argv.includes("--clear");

  if (!filePath) {
    console.error("Usage: pnpm run db:restore-export -- <path-to-export.json> [--clear]");
    process.exit(1);
  }

  if (shouldClear && process.env.ALLOW_DESTRUCTIVE_RESTORE !== "true") {
    throw new Error(
      "Clearing existing data is disabled by default. Set ALLOW_DESTRUCTIVE_RESTORE=true to use --clear."
    );
  }

  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const absolutePath = path.resolve(filePath);
    const raw = await readFile(absolutePath, "utf8");
    const parsed = ExportSchema.parse(JSON.parse(raw));

    console.log(`Loaded export from ${absolutePath}`);
    console.log(`Entities: ${parsed.entities.length}`);
    console.log(`Relationships: ${parsed.relationships.length}`);
    console.log(`Revisions: ${parsed.revisions.length}`);

    if (shouldClear) {
      await prisma.relationship.deleteMany();
      await prisma.entityRevision.deleteMany();
      await prisma.entityMedia.deleteMany();
      await prisma.importLog.deleteMany();
      await prisma.importJob.deleteMany();
      await prisma.entity.deleteMany();
      await prisma.mediaAsset.deleteMany();
    }

    for (const entity of parsed.entities) {
      await prisma.entity.upsert({
        where: { id: entity.id },
        create: {
          ...entity,
          parentId: null,
          metadata: toNullableJson(entity.metadata),
        },
        update: {
          type: entity.type,
          title: entity.title,
          slug: entity.slug,
          summary: entity.summary,
          body: entity.body,
          status: entity.status,
          visibility: entity.visibility,
          aliases: entity.aliases,
          tags: entity.tags,
          searchKeywords: entity.searchKeywords,
          featuredImage: entity.featuredImage,
          metadata: toNullableJson(entity.metadata),
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          version: entity.version,
          parentId: null,
        },
      });
    }

    for (const entity of parsed.entities) {
      if (!entity.parentId) continue;

      await prisma.entity.update({
        where: { id: entity.id },
        data: {
          parentId: entity.parentId,
        },
      });
    }

    for (const revision of parsed.revisions) {
      await prisma.entityRevision.upsert({
        where: { id: revision.id },
        create: {
          ...revision,
          metadata: toNullableJson(revision.metadata),
        },
        update: {
          entityId: revision.entityId,
          version: revision.version,
          title: revision.title,
          slug: revision.slug,
          summary: revision.summary,
          body: revision.body,
          status: revision.status,
          visibility: revision.visibility,
          aliases: revision.aliases,
          tags: revision.tags,
          searchKeywords: revision.searchKeywords,
          metadata: toNullableJson(revision.metadata),
          createdAt: revision.createdAt,
        },
      });
    }

    for (const relationship of parsed.relationships) {
      await prisma.relationship.upsert({
        where: { id: relationship.id },
        create: {
          id: relationship.id,
          type: relationship.type,
          sourceEntityId: relationship.sourceEntityId,
          targetEntityId: relationship.targetEntityId,
          notes: relationship.notes,
          weight: relationship.weight ?? null,
          directionality: relationship.directionality,
          createdAt: relationship.createdAt,
          updatedAt: relationship.updatedAt,
        },
        update: {
          type: relationship.type,
          sourceEntityId: relationship.sourceEntityId,
          targetEntityId: relationship.targetEntityId,
          notes: relationship.notes,
          weight: relationship.weight ?? null,
          directionality: relationship.directionality,
          createdAt: relationship.createdAt,
          updatedAt: relationship.updatedAt,
        },
      });
    }

    console.log("Restore complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
