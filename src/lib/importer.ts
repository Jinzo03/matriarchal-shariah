import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  MediaAssetSchema,
  RelationshipTypeSchema,
  UniversePackageSchema,
  type UniversePackage,
} from "@/lib/import-schema";

type CreateUpdateSkip = {
  create: number;
  update: number;
  skip: number;
};

export type ImportPreviewItemKind = "entity" | "media" | "relationship" | "entityMedia";

export type ImportPreviewItem = {
  kind: ImportPreviewItemKind;
  key: string;
  title: string;
  action: "CREATE" | "UPDATE" | "SKIP";
  reason: string;
};

export type ImportPreview = {
  packageId: string;
  packageVersion: string;
  title: string;
  sourcePath?: string;
  counts: {
    entities: CreateUpdateSkip;
    media: CreateUpdateSkip;
    relationships: CreateUpdateSkip;
    entityMedia: CreateUpdateSkip;
  };
  warnings: string[];
  items: ImportPreviewItem[];
};

type NormalizedEntityRecord = {
  slug: string;
  title: string;
  type: UniversePackage["characters"][number]["type"];
  summary?: string | null;
  body?: string | null;
  status: string;
  visibility: string;
  aliases: string[];
  tags: string[];
  searchKeywords: string[];
  metadata?: Record<string, unknown>;
  relations: UniversePackage["characters"][number]["relations"];
  media: UniversePackage["characters"][number]["media"];
};

type NormalizedMediaRecord = {
  slug: string;
  title: string;
  summary?: string | null;
  src: string;
  alt?: string | null;
  mimeType?: string | null;
  width?: number;
  height?: number;
  credit?: string | null;
  tags: string[];
  metadata?: Record<string, unknown>;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "OTHER";
};

type ExistingEntity = {
  id: string;
  slug: string;
  title: string;
  type: string;
  summary: string | null;
  body: string | null;
  status: string;
  visibility: string;
  aliases: string[];
  tags: string[];
  searchKeywords: string[];
  featuredImage: string | null;
};

type ExistingMedia = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  src: string;
  alt: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  credit: string | null;
  tags: string[];
  metadata: unknown;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "OTHER";
};

type ExistingEntityMedia = {
  id: string;
  entity: { slug: string };
  mediaAsset: { slug: string };
  role: string;
  primary: boolean;
  sortOrder: number;
  alt: string | null;
};

type ExistingRelationship = {
  id: string;
  type: string;
  sourceEntity: { slug: string };
  targetEntity: { slug: string };
  notes: string | null;
  directionality: string | null;
};

type DryRunContext = {
  packageData: UniversePackage;
  sourcePath?: string;
};

function normalizeStringArray(values: string[]) {
  return [...values].map((v) => v.trim()).filter(Boolean);
}

function canonicalizeStrings(values: string[]) {
  return normalizeStringArray(values).sort((a, b) => a.localeCompare(b));
}

function sameStringArray(a: string[], b: string[]) {
  const aa = canonicalizeStrings(a);
  const bb = canonicalizeStrings(b);
  return JSON.stringify(aa) === JSON.stringify(bb);
}

function entityPayload(entity: NormalizedEntityRecord) {
  return {
    title: entity.title,
    type: entity.type,
    summary: entity.summary ?? null,
    body: entity.body ?? null,
    status: entity.status,
    visibility: entity.visibility,
    aliases: canonicalizeStrings(entity.aliases),
    tags: canonicalizeStrings(entity.tags),
    searchKeywords: canonicalizeStrings(entity.searchKeywords),
  };
}

function mediaPayload(media: NormalizedMediaRecord) {
  return {
    title: media.title,
    summary: media.summary ?? null,
    src: media.src,
    alt: media.alt ?? null,
    mimeType: media.mimeType ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
    credit: media.credit ?? null,
    tags: canonicalizeStrings(media.tags),
    type: media.type,
  };
}

function entityMediaKey(entitySlug: string, assetSlug: string, role: string) {
  return `${entitySlug}::${assetSlug}::${role}`;
}

function relationshipKey(sourceSlug: string, type: string, targetSlug: string) {
  return `${sourceSlug}::${type}::${targetSlug}`;
}

function flattenPackage(packageData: UniversePackage) {
  const entities: NormalizedEntityRecord[] = [
    ...packageData.characters,
    ...packageData.stories,
    ...packageData.lore,
    ...packageData.timeline,
  ].map((item) => ({
    slug: item.slug,
    title: item.title,
    type: item.type,
    summary: item.summary ?? null,
    body: item.body ?? null,
    status: item.status,
    visibility: item.visibility,
    aliases: item.aliases ?? [],
    tags: item.tags ?? [],
    searchKeywords: item.searchKeywords ?? [],
    metadata: item.metadata as Record<string, unknown> | undefined,
    relations: item.relations ?? [],
    media: item.media ?? [],
  }));

  const media: NormalizedMediaRecord[] = packageData.media.map((item) => ({
    slug: item.slug,
    title: item.title,
    summary: item.summary ?? null,
    src: item.src,
    alt: item.alt ?? null,
    mimeType: item.mimeType ?? null,
    width: item.width,
    height: item.height,
    credit: item.credit ?? null,
    tags: item.tags ?? [],
    metadata: item.metadata as Record<string, unknown> | undefined,
    type: item.type,
  }));

  return { entities, media };
}

export async function loadUniversePackage(input: string | UniversePackage) {
  if (typeof input !== "string") {
    return input;
  }

  const absolutePath = path.resolve(input);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  return UniversePackageSchema.parse(parsed);
}

export async function dryRunImport(
  input: string | UniversePackage,
  sourcePath?: string
): Promise<ImportPreview> {
  const packageData = typeof input === "string" ? await loadUniversePackage(input) : input;
  const validated = UniversePackageSchema.parse(packageData);
  const { entities, media } = flattenPackage(validated);

  const warnings: string[] = [];
  const items: ImportPreviewItem[] = [];

  const entitySlugs = [...new Set(entities.map((e) => e.slug))];
  const mediaSlugs = [...new Set(media.map((m) => m.slug))];

  const existingEntities = await prisma.entity.findMany({
    where: { slug: { in: entitySlugs } },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      summary: true,
      body: true,
      status: true,
      visibility: true,
      aliases: true,
      tags: true,
      searchKeywords: true,
      featuredImage: true,
    },
  });

  const existingMedia = await prisma.mediaAsset.findMany({
    where: { slug: { in: mediaSlugs } },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      src: true,
      alt: true,
      mimeType: true,
      width: true,
      height: true,
      credit: true,
      tags: true,
      metadata: true,
      type: true,
    },
  });

  const existingEntityMap = new Map(existingEntities.map((item) => [item.slug, item]));
  const existingMediaMap = new Map(existingMedia.map((item) => [item.slug, item]));

  const relationTargets = new Set<string>();
  for (const entity of entities) {
    for (const relation of entity.relations) {
      relationTargets.add(relation.targetId);
    }
  }

  const allReferencedSlugs = [...new Set([...entitySlugs, ...relationTargets])];
  const referencedEntities = await prisma.entity.findMany({
    where: { slug: { in: allReferencedSlugs } },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });
  const referencedEntityMap = new Map(referencedEntities.map((item) => [item.slug, item]));

  const existingRelationships = await prisma.relationship.findMany({
    where: {
      OR: [
        { sourceEntity: { slug: { in: entitySlugs } } },
        { targetEntity: { slug: { in: [...relationTargets] } } },
      ],
    },
    select: {
      id: true,
      type: true,
      notes: true,
      directionality: true,
      sourceEntity: { select: { slug: true } },
      targetEntity: { select: { slug: true } },
    },
  });

  const existingRelationshipMap = new Map<string, ExistingRelationship>();
  for (const rel of existingRelationships as ExistingRelationship[]) {
    existingRelationshipMap.set(
      relationshipKey(rel.sourceEntity.slug, rel.type, rel.targetEntity.slug),
      rel
    );
  }

  const existingEntityMedia = await prisma.entityMedia.findMany({
    where: {
      OR: [
        { entity: { slug: { in: entitySlugs } } },
        { mediaAsset: { slug: { in: mediaSlugs } } },
      ],
    },
    select: {
      id: true,
      role: true,
      primary: true,
      sortOrder: true,
      alt: true,
      entity: { select: { slug: true } },
      mediaAsset: { select: { slug: true } },
    },
  });

  const existingEntityMediaMap = new Map<string, ExistingEntityMedia>();
  for (const link of existingEntityMedia as ExistingEntityMedia[]) {
    existingEntityMediaMap.set(
      entityMediaKey(link.entity.slug, link.mediaAsset.slug, link.role),
      link
    );
  }

  const entityCounts: CreateUpdateSkip = { create: 0, update: 0, skip: 0 };
  const mediaCounts: CreateUpdateSkip = { create: 0, update: 0, skip: 0 };
  const relationshipCounts: CreateUpdateSkip = { create: 0, update: 0, skip: 0 };
  const entityMediaCounts: CreateUpdateSkip = { create: 0, update: 0, skip: 0 };

  for (const entity of entities) {
    const existing = existingEntityMap.get(entity.slug);

    if (!existing) {
      entityCounts.create += 1;
      items.push({
        kind: "entity",
        key: entity.slug,
        title: entity.title,
        action: "CREATE",
        reason: "No entity exists with this slug.",
      });
      continue;
    }

    const changed =
      existing.title !== entityPayload(entity).title ||
      existing.type !== entityPayload(entity).type ||
      existing.summary !== entityPayload(entity).summary ||
      existing.body !== entityPayload(entity).body ||
      existing.status !== entityPayload(entity).status ||
      existing.visibility !== entityPayload(entity).visibility ||
      !sameStringArray(existing.aliases, entityPayload(entity).aliases) ||
      !sameStringArray(existing.tags, entityPayload(entity).tags) ||
      !sameStringArray(existing.searchKeywords, entityPayload(entity).searchKeywords);

    if (changed) {
      entityCounts.update += 1;
      items.push({
        kind: "entity",
        key: entity.slug,
        title: entity.title,
        action: "UPDATE",
        reason: "Existing entity differs from imported content.",
      });
    } else {
      entityCounts.skip += 1;
      items.push({
        kind: "entity",
        key: entity.slug,
        title: entity.title,
        action: "SKIP",
        reason: "No content changes detected.",
      });
    }
  }

  for (const asset of media) {
    const existing = existingMediaMap.get(asset.slug);

    if (!existing) {
      mediaCounts.create += 1;
      items.push({
        kind: "media",
        key: asset.slug,
        title: asset.title,
        action: "CREATE",
        reason: "No media asset exists with this slug.",
      });
      continue;
    }

    const changed =
      existing.title !== mediaPayload(asset).title ||
      existing.summary !== mediaPayload(asset).summary ||
      existing.src !== mediaPayload(asset).src ||
      existing.alt !== mediaPayload(asset).alt ||
      existing.mimeType !== mediaPayload(asset).mimeType ||
      existing.width !== mediaPayload(asset).width ||
      existing.height !== mediaPayload(asset).height ||
      existing.credit !== mediaPayload(asset).credit ||
      existing.type !== mediaPayload(asset).type ||
      !sameStringArray(existing.tags, mediaPayload(asset).tags);

    if (changed) {
      mediaCounts.update += 1;
      items.push({
        kind: "media",
        key: asset.slug,
        title: asset.title,
        action: "UPDATE",
        reason: "Existing media differs from imported content.",
      });
    } else {
      mediaCounts.skip += 1;
      items.push({
        kind: "media",
        key: asset.slug,
        title: asset.title,
        action: "SKIP",
        reason: "No media changes detected.",
      });
    }
  }

  for (const entity of entities) {
    const source = referencedEntityMap.get(entity.slug);
    if (!source) {
      warnings.push(`Entity "${entity.slug}" was not found in reference map; relationship preview may be incomplete.`);
      continue;
    }

    for (const relation of entity.relations) {
      const target = referencedEntityMap.get(relation.targetId);
      if (!target) {
        warnings.push(
          `Relation target "${relation.targetId}" referenced by "${entity.slug}" was not found in the package or database.`
        );
        continue;
      }

      const key = relationshipKey(entity.slug, relation.type, relation.targetId);
      const existing = existingRelationshipMap.get(key);

      if (!existing) {
        relationshipCounts.create += 1;
        items.push({
          kind: "relationship",
          key,
          title: `${entity.slug} → ${relation.targetId}`,
          action: "CREATE",
          reason: `Missing relationship ${relation.type}.`,
        });
        continue;
      }

      const changed =
        (existing.notes ?? null) !== (relation.notes ?? null) ||
        (existing.directionality ?? null) !== (relation.directionality ?? null);

      if (changed) {
        relationshipCounts.update += 1;
        items.push({
          kind: "relationship",
          key,
          title: `${entity.slug} → ${relation.targetId}`,
          action: "UPDATE",
          reason: "Existing relationship notes or directionality differs.",
        });
      } else {
        relationshipCounts.skip += 1;
        items.push({
          kind: "relationship",
          key,
          title: `${entity.slug} → ${relation.targetId}`,
          action: "SKIP",
          reason: "Relationship already matches imported content.",
        });
      }
    }

    for (const link of entity.media ?? []) {
      const key = entityMediaKey(entity.slug, link.assetId, link.role);
      const existing = existingEntityMediaMap.get(key);

      if (!existing) {
        entityMediaCounts.create += 1;
        items.push({
          kind: "entityMedia",
          key,
          title: `${entity.slug} ↔ ${link.assetId} (${link.role})`,
          action: "CREATE",
          reason: "Missing entity-media link.",
        });
        continue;
      }

      const changed =
        existing.primary !== (link.primary ?? false) ||
        existing.sortOrder !== (link.sortOrder ?? 0) ||
        (existing.alt ?? null) !== (link.alt ?? null);

      if (changed) {
        entityMediaCounts.update += 1;
        items.push({
          kind: "entityMedia",
          key,
          title: `${entity.slug} ↔ ${link.assetId} (${link.role})`,
          action: "UPDATE",
          reason: "Existing media link differs from imported content.",
        });
      } else {
        entityMediaCounts.skip += 1;
        items.push({
          kind: "entityMedia",
          key,
          title: `${entity.slug} ↔ ${link.assetId} (${link.role})`,
          action: "SKIP",
          reason: "Media link already matches imported content.",
        });
      }
    }
  }

  return {
    packageId: validated.packageId,
    packageVersion: validated.version,
    title: validated.title,
    sourcePath,
    counts: {
      entities: entityCounts,
      media: mediaCounts,
      relationships: relationshipCounts,
      entityMedia: entityMediaCounts,
    },
    warnings,
    items,
  };
}

export async function loadPackageFromFile(filePath: string) {
  const absolutePath = path.resolve(filePath);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  return UniversePackageSchema.parse(parsed);
}

export async function previewPackageFile(filePath: string) {
  const packageData = await loadPackageFromFile(filePath);
  return dryRunImport(packageData, filePath);
}