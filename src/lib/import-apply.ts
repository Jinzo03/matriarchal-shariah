import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  EntityType,
  EntityStatus,
  ImportJobStatus,
  ImportLogLevel,
  MediaKind,
  MediaRole,
  RelationshipType,
  Visibility,
} from "@/generated/prisma/client";
import { UniversePackageSchema, type UniversePackage } from "@/lib/import-schema";
import {
  buildImportIndexes,
  flattenPackage,
  resolveMediaAsset,
  resolveTargetEntity,
} from "@/lib/import-resolver";
import { isRelationshipAllowed } from "@/lib/relationships";
import type { ImportPreview } from "@/lib/importer";

type ApplyOptions = {
  sourcePath?: string;
  approvedPreview?: ImportPreview;
};

type ApplyResult = {
  jobId: string;
  packageId: string;
  packageVersion: string;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  warnings: string[];
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
    type: entity.type as EntityType,
    title: entity.title,
    summary: entity.summary ?? null,
    body: entity.body ?? null,
    status: entity.status as EntityStatus,
    visibility: entity.visibility as Visibility,
    aliases: canonicalizeStrings(entity.aliases ?? []),
    tags: canonicalizeStrings(entity.tags ?? []),
    searchKeywords: canonicalizeStrings(entity.searchKeywords ?? []),
    metadata: entity.metadata ?? null,
  };
}

function mediaPayload(asset: NormalizedMedia) {
  return {
    slug: asset.slug,
    type: asset.type as MediaKind,
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

async function loadPackage(input: string | UniversePackage) {
  if (typeof input !== "string") {
    return UniversePackageSchema.parse(input);
  }

  const absolutePath = path.resolve(input);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  return UniversePackageSchema.parse(parsed);
}

export async function applyUniverseImport(
  input: string | UniversePackage,
  options: ApplyOptions = {}
): Promise<ApplyResult> {
  const packageData = await loadPackage(input);
  const preview = options.approvedPreview;

  if (preview && preview.packageId !== packageData.packageId) {
    throw new Error(
      `Approved preview package mismatch. Expected ${preview.packageId}, got ${packageData.packageId}.`
    );
  }

  const indexes = buildImportIndexes(packageData);
  const { entities, media } = flattenPackage(packageData);
  const sourcePath = options.sourcePath;

  const job = await prisma.importJob.create({
    data: {
      packageId: packageData.packageId,
      packageVersion: packageData.version,
      title: packageData.title,
      sourcePath,
      status: ImportJobStatus.RUNNING,
      dryRun: false,
      summary: {
        startedAt: new Date().toISOString(),
        mode: "write",
      },
    },
  });

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const warnings: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      await tx.importLog.create({
        data: {
          importJobId: job.id,
          level: ImportLogLevel.INFO,
          stage: "START",
          message: `Import started for package ${packageData.packageId}`,
          details: {
            packageId: packageData.packageId,
            version: packageData.version,
          },
        },
      });

      const entityRecordBySlug = new Map<
        string,
        { id: string; slug: string; version: number; type: EntityType }
      >();

      const mediaRecordBySlug = new Map<string, { id: string; slug: string }>();

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

      // 1) Media assets first
      for (const asset of media) {
        const next = mediaPayload(asset);
        const existing = await tx.mediaAsset.findUnique({
          where: { slug: next.slug },
        });

        if (!existing) {
          const created = await tx.mediaAsset.create({
            data: {
              slug: next.slug,
              type: next.type,
              title: next.title,
              summary: next.summary,
              src: next.src,
              alt: next.alt,
              mimeType: next.mimeType,
              width: next.width,
              height: next.height,
              credit: next.credit,
              tags: next.tags,
              metadata: next.metadata,
            },
          });

          mediaRecordBySlug.set(created.slug, { id: created.id, slug: created.slug });
          createdCount += 1;

          await tx.importLog.create({
            data: {
              importJobId: job.id,
              level: ImportLogLevel.INFO,
              stage: "MEDIA_CREATE",
              message: `Created media asset ${asset.slug}`,
              entitySlug: asset.slug,
            },
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

        if (!changed) {
          mediaRecordBySlug.set(existing.slug, { id: existing.id, slug: existing.slug });
          skippedCount += 1;
          continue;
        }

        const updated = await tx.mediaAsset.update({
          where: { slug: next.slug },
          data: {
            type: next.type,
            title: next.title,
            summary: next.summary,
            src: next.src,
            alt: next.alt,
            mimeType: next.mimeType,
            width: next.width,
            height: next.height,
            credit: next.credit,
            tags: next.tags,
            metadata: next.metadata,
          },
        });

        mediaRecordBySlug.set(updated.slug, { id: updated.id, slug: updated.slug });
        updatedCount += 1;

        await tx.importLog.create({
          data: {
            importJobId: job.id,
            level: ImportLogLevel.INFO,
            stage: "MEDIA_UPDATE",
            message: `Updated media asset ${asset.slug}`,
            entitySlug: asset.slug,
          },
        });
      }

      // 2) Entities
      for (const entity of entities) {
        const next = entityPayload(entity);
        const existing = await tx.entity.findUnique({
          where: { slug: entity.slug },
        });

        if (!existing) {
          const created = await tx.entity.create({
            data: {
              type: next.type,
              title: next.title,
              slug: entity.slug,
              summary: next.summary,
              body: next.body,
              status: next.status,
              visibility: next.visibility,
              aliases: next.aliases,
              tags: next.tags,
              searchKeywords: next.searchKeywords,
              metadata: next.metadata,
              version: 1,
            },
          });

          entityRecordBySlug.set(created.slug, {
            id: created.id,
            slug: created.slug,
            version: created.version,
            type: created.type,
          });

          await tx.entityRevision.create({
            data: {
              entityId: created.id,
              version: 1,
              title: created.title,
              slug: created.slug,
              summary: created.summary,
              body: created.body,
              status: created.status,
              visibility: created.visibility,
              aliases: created.aliases,
              tags: created.tags,
              searchKeywords: created.searchKeywords,
            },
          });

          createdCount += 1;

          await tx.importLog.create({
            data: {
              importJobId: job.id,
              level: ImportLogLevel.INFO,
              stage: "ENTITY_CREATE",
              message: `Created entity ${entity.slug}`,
              entitySlug: entity.slug,
            },
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

        if (!changed) {
          entityRecordBySlug.set(existing.slug, {
            id: existing.id,
            slug: existing.slug,
            version: existing.version,
            type: existing.type,
          });

          skippedCount += 1;
          continue;
        }

        const updated = await tx.entity.update({
          where: { slug: entity.slug },
          data: {
            type: next.type,
            title: next.title,
            summary: next.summary,
            body: next.body,
            status: next.status,
            visibility: next.visibility,
            aliases: next.aliases,
            tags: next.tags,
            searchKeywords: next.searchKeywords,
            metadata: next.metadata,
            version: { increment: 1 },
          },
        });

        entityRecordBySlug.set(updated.slug, {
          id: updated.id,
          slug: updated.slug,
          version: updated.version,
          type: updated.type,
        });

        await tx.entityRevision.create({
          data: {
            entityId: updated.id,
            version: updated.version,
            title: updated.title,
            slug: updated.slug,
            summary: updated.summary,
            body: updated.body,
            status: updated.status,
            visibility: updated.visibility,
            aliases: updated.aliases,
            tags: updated.tags,
            searchKeywords: updated.searchKeywords,
          },
        });

        updatedCount += 1;

        await tx.importLog.create({
          data: {
            importJobId: job.id,
            level: ImportLogLevel.INFO,
            stage: "ENTITY_UPDATE",
            message: `Updated entity ${entity.slug}`,
            entitySlug: entity.slug,
          },
        });
      }

      const existingTargetEntities = await tx.entity.findMany({
        where: { slug: { in: [...relationTargetSlugs] } },
        select: {
          id: true,
          slug: true,
          title: true,
          version: true,
          type: true,
        },
      });
      const existingTargetEntityMap = new Map(
        existingTargetEntities.map((item) => [item.slug, item])
      );

      const existingTargetMedia = await tx.mediaAsset.findMany({
        where: { slug: { in: [...entityMediaAssetSlugs] } },
        select: {
          id: true,
          slug: true,
        },
      });
      const existingTargetMediaMap = new Map(existingTargetMedia.map((item) => [item.slug, item]));

      const importedEntitySlugs = [...entityRecordBySlug.keys()];

      const existingRelationships = await tx.relationship.findMany({
        where: {
          sourceEntity: { slug: { in: importedEntitySlugs } },
          targetEntity: { slug: { in: [...relationTargetSlugs] } },
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

      const existingRelationshipMap = new Map<string, (typeof existingRelationships)[number]>();
      for (const rel of existingRelationships) {
        existingRelationshipMap.set(
          relationshipKey(rel.sourceEntity.slug, rel.type, rel.targetEntity.slug),
          rel
        );
      }

      const existingEntityMedia = await tx.entityMedia.findMany({
        where: {
          entity: { slug: { in: importedEntitySlugs } },
          mediaAsset: { slug: { in: [...entityMediaAssetSlugs] } },
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

      const existingEntityMediaMap = new Map<string, (typeof existingEntityMedia)[number]>();
      for (const link of existingEntityMedia) {
        existingEntityMediaMap.set(
          entityMediaKey(link.entity.slug, link.mediaAsset.slug, link.role),
          link
        );
      }

      // 3) Relationships
      for (const entity of entities) {
        const sourceRecord = entityRecordBySlug.get(entity.slug);
        if (!sourceRecord) {
          warnings.push(`Source entity missing in DB after import: ${entity.slug}`);
          failedCount += 1;
          continue;
        }

        for (const relation of entity.relations ?? []) {
          const targetPackageEntity = resolveTargetEntity(relation.targetId, indexes);
          const targetSlug = targetPackageEntity?.slug ?? relation.targetId;

          const targetRecord =
            entityRecordBySlug.get(targetSlug) ?? existingTargetEntityMap.get(targetSlug);

          if (!targetRecord) {
            warnings.push(
              `Unresolved relation target "${relation.targetId}" in entity "${entity.slug}".`
            );

            await tx.importLog.create({
              data: {
                importJobId: job.id,
                level: ImportLogLevel.WARN,
                stage: "RELATION_SKIP",
                message: `Unresolved relation target ${relation.targetId}`,
                entitySlug: entity.slug,
                details: {
                  relationType: relation.type,
                  targetId: relation.targetId,
                },
              },
            });

            failedCount += 1;
            continue;
          }

          if (
            !isRelationshipAllowed(
              relation.type as RelationshipType,
              sourceRecord.type,
              targetRecord.type
            )
          ) {
            warnings.push(
              `Invalid ${relation.type} relationship from "${entity.slug}" (${sourceRecord.type}) to "${targetSlug}" (${targetRecord.type}).`
            );

            await tx.importLog.create({
              data: {
                importJobId: job.id,
                level: ImportLogLevel.WARN,
                stage: "RELATION_SKIP",
                message: `Invalid relationship ${relation.type} for ${entity.slug} -> ${targetSlug}`,
                entitySlug: entity.slug,
                details: {
                  relationType: relation.type,
                  sourceType: sourceRecord.type,
                  targetSlug,
                  targetType: targetRecord.type,
                },
              },
            });

            failedCount += 1;
            continue;
          }

          const key = relationshipKey(sourceRecord.slug, relation.type, targetRecord.slug);
          const existing = existingRelationshipMap.get(key);

          if (!existing) {
            await tx.relationship.create({
              data: {
                type: relation.type as RelationshipType,
                sourceEntityId: sourceRecord.id,
                targetEntityId: targetRecord.id,
                notes: relation.notes ?? null,
                directionality: relation.directionality ?? null,
              },
            });

            createdCount += 1;

            await tx.importLog.create({
              data: {
                importJobId: job.id,
                level: ImportLogLevel.INFO,
                stage: "RELATION_CREATE",
                message: `Created relationship ${sourceRecord.slug} -> ${targetRecord.slug}`,
                entitySlug: entity.slug,
                details: {
                  targetSlug: targetRecord.slug,
                  relationType: relation.type,
                },
              },
            });

            continue;
          }

          const relationChanged =
            (existing.notes ?? null) !== (relation.notes ?? null) ||
            (existing.directionality ?? null) !== (relation.directionality ?? null);

          if (!relationChanged) {
            skippedCount += 1;
            continue;
          }

          await tx.relationship.update({
            where: { id: existing.id },
            data: {
              notes: relation.notes ?? null,
              directionality: relation.directionality ?? null,
            },
          });

          updatedCount += 1;

          await tx.importLog.create({
            data: {
              importJobId: job.id,
              level: ImportLogLevel.INFO,
              stage: "RELATION_UPDATE",
              message: `Updated relationship ${sourceRecord.slug} -> ${targetRecord.slug}`,
              entitySlug: entity.slug,
              details: {
                targetSlug: targetRecord.slug,
                relationType: relation.type,
              },
            },
          });
        }
      }

      // 4) Entity-media links
      for (const entity of entities) {
        const sourceRecord = entityRecordBySlug.get(entity.slug);
        if (!sourceRecord) {
          continue;
        }

        for (const link of entity.media ?? []) {
          const assetPackage = resolveMediaAsset(link.assetId, indexes);
          const assetSlug = assetPackage?.slug ?? link.assetId;

          const mediaRecord =
            mediaRecordBySlug.get(assetSlug) ?? existingTargetMediaMap.get(assetSlug);

          if (!mediaRecord) {
            warnings.push(
              `Unresolved media asset "${link.assetId}" referenced by entity "${entity.slug}".`
            );

            await tx.importLog.create({
              data: {
                importJobId: job.id,
                level: ImportLogLevel.WARN,
                stage: "ENTITY_MEDIA_SKIP",
                message: `Unresolved media asset ${link.assetId}`,
                entitySlug: entity.slug,
                details: {
                  assetId: link.assetId,
                  role: link.role,
                },
              },
            });

            failedCount += 1;
            continue;
          }

          const key = entityMediaKey(sourceRecord.slug, mediaRecord.slug, link.role);
          const existingLink = existingEntityMediaMap.get(key);

          if (!existingLink) {
            await tx.entityMedia.create({
              data: {
                entityId: sourceRecord.id,
                mediaAssetId: mediaRecord.id,
                role: link.role as MediaRole,
                primary: link.primary ?? false,
                sortOrder: link.sortOrder ?? 0,
                alt: link.alt ?? null,
              },
            });

            createdCount += 1;

            await tx.importLog.create({
              data: {
                importJobId: job.id,
                level: ImportLogLevel.INFO,
                stage: "ENTITY_MEDIA_CREATE",
                message: `Created entity-media link ${sourceRecord.slug} -> ${mediaRecord.slug}`,
                entitySlug: entity.slug,
                details: {
                  assetSlug: mediaRecord.slug,
                  role: link.role,
                },
              },
            });

            continue;
          }

          const linkChanged =
            existingLink.primary !== (link.primary ?? false) ||
            existingLink.sortOrder !== (link.sortOrder ?? 0) ||
            (existingLink.alt ?? null) !== (link.alt ?? null);

          if (!linkChanged) {
            skippedCount += 1;
            continue;
          }

          await tx.entityMedia.update({
            where: { id: existingLink.id },
            data: {
              primary: link.primary ?? false,
              sortOrder: link.sortOrder ?? 0,
              alt: link.alt ?? null,
            },
          });

          updatedCount += 1;

          await tx.importLog.create({
            data: {
              importJobId: job.id,
              level: ImportLogLevel.INFO,
              stage: "ENTITY_MEDIA_UPDATE",
              message: `Updated entity-media link ${sourceRecord.slug} -> ${mediaRecord.slug}`,
              entitySlug: entity.slug,
              details: {
                assetSlug: mediaRecord.slug,
                role: link.role,
              },
            },
          });
        }
      }

      await tx.importJob.update({
        where: { id: job.id },
        data: {
          status: ImportJobStatus.SUCCEEDED,
          finishedAt: new Date(),
          createdCount,
          updatedCount,
          skippedCount,
          failedCount,
          summary: {
            packageId: packageData.packageId,
            packageVersion: packageData.version,
            title: packageData.title,
            sourcePath,
            warnings,
          },
        },
      });

      await tx.importLog.create({
        data: {
          importJobId: job.id,
          level: warnings.length > 0 ? ImportLogLevel.WARN : ImportLogLevel.INFO,
          stage: "FINISH",
          message: `Import finished for package ${packageData.packageId}`,
          details: {
            createdCount,
            updatedCount,
            skippedCount,
            failedCount,
            warnings,
          },
        },
      });
    });

    return {
      jobId: job.id,
      packageId: packageData.packageId,
      packageVersion: packageData.version,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount,
      warnings,
    };
  } catch (error) {
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: ImportJobStatus.FAILED,
        finishedAt: new Date(),
        failedCount: failedCount + 1,
        summary: {
          packageId: packageData.packageId,
          packageVersion: packageData.version,
          title: packageData.title,
          sourcePath,
          warnings,
          error: error instanceof Error ? error.message : String(error),
        },
      },
    });

    await prisma.importLog.create({
      data: {
        importJobId: job.id,
        level: ImportLogLevel.ERROR,
        stage: "ERROR",
        message: error instanceof Error ? error.message : "Unknown import failure",
        details: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
    });

    throw error;
  }
}

export async function applyUniverseImportFromFile(filePath: string) {
  return applyUniverseImport(filePath, { sourcePath: filePath });
}
