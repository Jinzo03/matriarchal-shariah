import { z } from "zod";

export const EntityStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
  "DEPRECATED",
]);

export const VisibilitySchema = z.enum([
  "PRIVATE",
  "SHARED",
  "PUBLIC",
]);

export const EntityTypeSchema = z.enum([
  "CHARACTER",
  "STORY",
  "INSTITUTION",
  "LOCATION",
  "DOCTRINE",
  "EVENT",
  "TERM",
  "ARTIFACT",
  "OTHER",
]);

export const RelationshipTypeSchema = z.enum([
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
]);

export const MediaKindSchema = z.enum([
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "OTHER",
]);

export const MediaRoleSchema = z.enum([
  "PORTRAIT",
  "COVER",
  "ICON",
  "SCENE",
  "GALLERY",
  "TIMELINE_ART",
  "EMBLEM",
  "THUMBNAIL",
]);

const MetadataSchema = z.record(z.string(), z.unknown()).optional();

function addDuplicateIssue(
  ctx: z.RefinementCtx,
  path: (string | number)[],
  message: string
) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });
}

const RelationSchema = z.object({
  type: RelationshipTypeSchema,
  targetId: z.string().min(1),
  notes: z.string().optional(),
  directionality: z.string().optional(),
});

const MediaRefSchema = z.object({
  assetId: z.string().min(1),
  role: MediaRoleSchema,
  alt: z.string().optional(),
  primary: z.boolean().optional().default(false),
  sortOrder: z.number().int().nonnegative().optional().default(0),
});

const BaseContentSchema = z.object({
  id: z.string().min(1),
  type: EntityTypeSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  status: EntityStatusSchema.default("DRAFT"),
  visibility: VisibilitySchema.default("PRIVATE"),
  aliases: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  searchKeywords: z.array(z.string().min(1)).default([]),
  metadata: MetadataSchema,
  relations: z.array(RelationSchema).default([]),
  media: z.array(MediaRefSchema).default([]),
});

export const CharacterSchema = BaseContentSchema.extend({
  type: z.literal("CHARACTER"),
});

export const StorySchema = BaseContentSchema.extend({
  type: z.literal("STORY"),
});

export const LoreSchema = BaseContentSchema.extend({
  type: z.enum([
    "INSTITUTION",
    "DOCTRINE",
    "LOCATION",
    "TERM",
    "ARTIFACT",
    "OTHER",
  ]),
});

export const TimelineEventSchema = BaseContentSchema.extend({
  type: z.literal("EVENT"),
});

export const MediaAssetSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  type: MediaKindSchema.default("IMAGE"),
  title: z.string().min(1),
  summary: z.string().optional().nullable(),
  src: z.string().min(1),
  alt: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  credit: z.string().optional().nullable(),
  tags: z.array(z.string().min(1)).default([]),
  metadata: MetadataSchema,
});

export const UniversePackageSchema = z
  .object({
    packageId: z.string().min(1),
    version: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    source: z.string().optional(),
    characters: z.array(CharacterSchema).default([]),
    stories: z.array(StorySchema).default([]),
    lore: z.array(LoreSchema).default([]),
    timeline: z.array(TimelineEventSchema).default([]),
    media: z.array(MediaAssetSchema).default([]),
    metadata: MetadataSchema,
  })
  .superRefine((pkg, ctx) => {
    const entityCollections = [
      { key: "characters" as const, items: pkg.characters },
      { key: "stories" as const, items: pkg.stories },
      { key: "lore" as const, items: pkg.lore },
      { key: "timeline" as const, items: pkg.timeline },
    ];

    const entityIdOwners = new Map<string, string>();
    const entitySlugOwners = new Map<string, string>();
    const mediaIdOwners = new Map<string, string>();
    const mediaSlugOwners = new Map<string, string>();

    for (const collection of entityCollections) {
      collection.items.forEach((item, index) => {
        const entityLabel = `${item.type} "${item.title}"`;
        const existingIdOwner = entityIdOwners.get(item.id);
        const existingSlugOwner = entitySlugOwners.get(item.slug);

        if (existingIdOwner) {
          addDuplicateIssue(
            ctx,
            [collection.key, index, "id"],
            `Duplicate entity id "${item.id}" is used by both ${existingIdOwner} and ${entityLabel}.`
          );
        } else {
          entityIdOwners.set(item.id, entityLabel);
        }

        if (existingSlugOwner) {
          addDuplicateIssue(
            ctx,
            [collection.key, index, "slug"],
            `Duplicate entity slug "${item.slug}" is used by both ${existingSlugOwner} and ${entityLabel}. Entity slugs must be globally unique across characters, stories, lore, and timeline items.`
          );
        } else {
          entitySlugOwners.set(item.slug, entityLabel);
        }
      });
    }

    pkg.media.forEach((item, index) => {
      const mediaLabel = `media "${item.title}"`;
      const existingIdOwner = mediaIdOwners.get(item.id);
      const existingSlugOwner = mediaSlugOwners.get(item.slug);

      if (existingIdOwner) {
        addDuplicateIssue(
          ctx,
          ["media", index, "id"],
          `Duplicate media id "${item.id}" is used by both ${existingIdOwner} and ${mediaLabel}.`
        );
      } else {
        mediaIdOwners.set(item.id, mediaLabel);
      }

      if (existingSlugOwner) {
        addDuplicateIssue(
          ctx,
          ["media", index, "slug"],
          `Duplicate media slug "${item.slug}" is used by both ${existingSlugOwner} and ${mediaLabel}.`
        );
      } else {
        mediaSlugOwners.set(item.slug, mediaLabel);
      }
    });
  });

export type UniversePackage = z.infer<typeof UniversePackageSchema>;
