import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { UniversePackageSchema, type UniversePackage } from "@/lib/import-schema";
import {
  buildImportIndexes,
  flattenPackage,
  resolveMediaAsset,
  resolveTargetEntity,
} from "@/lib/import-resolver";

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

type NormalizedEntity = UniversePackage["characters"][number] |
  UniversePackage["stories"][number] |
  UniversePackage["lore"][number] |
  UniversePackage["timeline"][number];

type NormalizedMedia = UniversePackage["media"][number];

function normalizeStrings(values: string[] = []) {
  return values.map((v) => v.trim()).filter(Boolean);
}

function canonicalizeStrings(values: string[] = []) {
  return normalizeStrings(values).sort((a, b) => a.localeCompare(b));
}

function sameStringArray(a: string[] = [], b: string[] = []) {
  return JSON.stringify(canonicalizeStrings(a)) === JSON.stringify(canonicalizeStrings(b));
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function entityPayload(entity: NormalizedEntity) {
  return {
    title: entity.title,
    type: entity.type,
    summary: entity.summary ?? null,
    body: entity.body ?? null,
    status: entity.status,
    visibility: entity.visibility,
    aliases: canonicalizeStrings(entity.aliases ?? []),
    tags: canonicalizeStrings(entity.tags ?? []),
    searchKeywords: canonicalizeStrings(entity.searchKeywords ?? []),
    metadata: entity.metadata ?? null,
  };
}

function mediaPayload(asset: NormalizedMedia) {
  return {
    title: asset.title,
    summary: asset.summary ?? null,
    src: asset.src,
    alt: asset.alt ?? null,
    mimeType: asset.mimeType ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    credit: asset.credit ?? null,
    tags: canonicalizeStrings(asset.tags ?? []),
    metadata: asset.metadata ?? null,
    type: asset.type,
  };
}

function relationshipKey(sourceSlug: string, type: string, targetSlug: string) {
  return `${sourceSlug}::${type}::${targetSlug}`;
}

function entityMediaKey(entitySlug: string, assetSlug: string, role: string) {
  return `${entitySlug}::${assetSlug}::${role}`;
}

function resolveRelationTargetSlug(
  targetId: string,
  indexes: ReturnType<typeof buildImportIndexes>
) {
  return resolveTargetEntity(targetId, indexes)?.slug ?? targetId;
}

function resolveMediaAssetSlug(
  assetId: string,
  indexes: ReturnType<typeof buildImportIndexes>
) {
  return resolveMediaAsset(assetId, indexes)?.slug ?? assetId;
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

export async function loadPackageFromFile(filePath: string) {
  return loadUniversePackage(filePath);
}

export async function dryRunImport(
  input: string | UniversePackage,
  sourcePath?: string
): Promise<ImportPreview> {
  const packageData = await loadUniversePackage(input);
  const validated = UniversePackageSchema.parse(packageData);
  const indexes = buildImportIndexes(validated);
  const { entities, media } = flattenPackage(validated);

  const warnings: string[] = [];
  const items: ImportPreviewItem[] = [];

  const entitySlugs = [...new Set(entities.map((entity) => entity.slug))];
  const mediaSlugs = [...new Set(media.map((asset) => asset.slug))];

  const relationTargetSlugs = new Set<string>();
  const entityMediaAssetSlugs = new Set<string>();

  for (const entity of entities) {
    for (const relation of entity.relations ?? []) {
      relationTargetSlugs.add(resolveRelationTargetSlug(relation.targetId, indexes));
    }

    for (const link of entity.media ?? []) {
      entityMediaAssetSlugs.add(resolveMediaAssetSlug(link.assetId, indexes));
    }
  }

  const [existingEntities, existingMedia, existingTargetEntities, existingTargetMedia] =
    await Promise.all([
      prisma.entity.findMany({
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
          metadata: true,
        },
      }),
      prisma.mediaAsset.findMany({
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
      }),
      prisma.entity.findMany({
        where: { slug: { in: [...relationTargetSlugs] } },
        select: {
          id: true,
          slug: true,
          title: true,
          version: true,
          type: true,
        },
      }),
      prisma.mediaAsset.findMany({
        where: { slug: { in: [...entityMediaAssetSlugs] } },
        select: {
          id: true,
          slug: true,
        },
      }),
    ]);

  const existingEntityMap = new Map(existingEntities.map((item) => [item.slug, item]));
  const existingMediaMap = new Map(existingMedia.map((item) => [item.slug, item]));
  const existingTargetEntityMap = new Map(existingTargetEntities.map((item) => [item.slug, item]));
  const existingTargetMediaMap = new Map(existingTargetMedia.map((item) => [item.slug, item]));

  const existingRelationships = await prisma.relationship.findMany({
    where: {
      sourceEntity: { slug: { in: entitySlugs } },
      targetEntity: { slug: { in: [...relationTargetSlugs] } },
    },
    select: {
      id: true,
      type: true,
      sourceEntity: { select: { slug: true } },
      targetEntity: { select: { slug: true } },
      notes: true,
      directionality: true,
    },
  });

  const existingEntityMedia = await prisma.entityMedia.findMany({
    where: {
      entity: { slug: { in: entitySlugs } },
      mediaAsset: { slug: { in: [...entityMediaAssetSlugs] } },
    },
    select: {
      id: true,
      entity: { select: { slug: true } },
      mediaAsset: { select: { slug: true } },
      role: true,
      primary: true,
      sortOrder: true,
      alt: true,
    },
  });

  const existingRelationshipMap = new Map<string, (typeof existingRelationships)[number]>();
  for (const rel of existingRelationships) {
    existingRelationshipMap.set(
      relationshipKey(rel.sourceEntity.slug, rel.type, rel.targetEntity.slug),
      rel
    );
  }

  const existingEntityMediaMap = new Map<string, (typeof existingEntityMedia)[number]>();
  for (const link of existingEntityMedia) {
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
    const next = entityPayload(entity);

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
      existing.type !== next.type ||
      existing.title !== next.title ||
      existing.summary !== next.summary ||
      existing.body !== next.body ||
      existing.status !== next.status ||
      existing.visibility !== next.visibility ||
      !sameStringArray(existing.aliases, next.aliases) ||
      !sameStringArray(existing.tags, next.tags) ||
      !sameStringArray(existing.searchKeywords, next.searchKeywords) ||
      !sameJson(existing.metadata, next.metadata);

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
    const next = mediaPayload(asset);

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
      existing.title !== next.title ||
      existing.summary !== next.summary ||
      existing.src !== next.src ||
      existing.alt !== next.alt ||
      existing.mimeType !== next.mimeType ||
      existing.width !== next.width ||
      existing.height !== next.height ||
      existing.credit !== next.credit ||
      existing.type !== next.type ||
      !sameStringArray(existing.tags, next.tags) ||
      !sameJson(existing.metadata, next.metadata);

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
    for (const relation of entity.relations ?? []) {
      const targetSlug = resolveRelationTargetSlug(relation.targetId, indexes);
      const target = existingTargetEntityMap.get(targetSlug);

      if (!target) {
        warnings.push(
          `Relation target "${relation.targetId}" referenced by "${entity.slug}" was not found in the package or database.`
        );
        continue;
      }

      const key = relationshipKey(entity.slug, relation.type, target.slug);
      const existing = existingRelationshipMap.get(key);

      if (!existing) {
        relationshipCounts.create += 1;
        items.push({
          kind: "relationship",
          key,
          title: `${entity.slug} → ${target.slug}`,
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
          title: `${entity.slug} → ${target.slug}`,
          action: "UPDATE",
          reason: "Existing relationship notes or directionality differs.",
        });
      } else {
        relationshipCounts.skip += 1;
        items.push({
          kind: "relationship",
          key,
          title: `${entity.slug} → ${target.slug}`,
          action: "SKIP",
          reason: "Relationship already matches imported content.",
        });
      }
    }

    for (const link of entity.media ?? []) {
      const assetSlug = resolveMediaAssetSlug(link.assetId, indexes);
      const asset = existingTargetMediaMap.get(assetSlug);

      if (!asset) {
        warnings.push(
          `Media asset "${link.assetId}" referenced by "${entity.slug}" was not found in the package or database.`
        );
        continue;
      }

      const key = entityMediaKey(entity.slug, asset.slug, link.role);
      const existing = existingEntityMediaMap.get(key);

      if (!existing) {
        entityMediaCounts.create += 1;
        items.push({
          kind: "entityMedia",
          key,
          title: `${entity.slug} ↔ ${asset.slug} (${link.role})`,
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
          title: `${entity.slug} ↔ ${asset.slug} (${link.role})`,
          action: "UPDATE",
          reason: "Existing media link differs from imported content.",
        });
      } else {
        entityMediaCounts.skip += 1;
        items.push({
          kind: "entityMedia",
          key,
          title: `${entity.slug} ↔ ${asset.slug} (${link.role})`,
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

export async function previewPackageFile(filePath: string) {
  const packageData = await loadPackageFromFile(filePath);
  return dryRunImport(packageData, filePath);
}
