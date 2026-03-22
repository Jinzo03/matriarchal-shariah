import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EntityForm } from "@/components/entity-form";
import { Reveal } from "@/components/reveal";
import { EntityStatus, EntityType, Visibility } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ type: string }>;
};

const typeMap: Record<string, EntityType> = {
  character: EntityType.CHARACTER,
  story: EntityType.STORY,
  institution: EntityType.INSTITUTION,
  location: EntityType.LOCATION,
  doctrine: EntityType.DOCTRINE,
  event: EntityType.EVENT,
  term: EntityType.TERM,
  artifact: EntityType.ARTIFACT,
  other: EntityType.OTHER,
};

const typeLabels: Record<EntityType, string> = {
  CHARACTER: "Character",
  STORY: "Story",
  INSTITUTION: "Institution",
  LOCATION: "Location",
  DOCTRINE: "Doctrine",
  EVENT: "Event",
  TERM: "Term",
  ARTIFACT: "Artifact",
  OTHER: "Other",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function CreateEntityPage({ params }: PageProps) {
  const { type } = await params;
  const entityType = typeMap[type];

  if (!entityType) notFound();

  async function createEntity(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;

    const slugInput = String(formData.get("slug") ?? "").trim();
    const slug = slugInput || slugify(title);
    const summary = String(formData.get("summary") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const status = String(formData.get("status") ?? "DRAFT") as EntityStatus;
    const visibility = String(formData.get("visibility") ?? "PRIVATE") as Visibility;

    const aliases = splitList(formData.get("aliases"));
    const tags = splitList(formData.get("tags"));
    const searchKeywords = splitList(formData.get("searchKeywords"));

    const entity = await prisma.$transaction(async (tx) => {
      const created = await tx.entity.create({
        data: {
          type: entityType,
          title,
          slug,
          summary: summary || null,
          body: body || null,
          status,
          visibility,
          aliases,
          tags,
          searchKeywords,
          version: 1,
        },
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

      return created;
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/browse");
    revalidatePath("/search");
    redirect(`/entities/${entity.slug}`);
  }

  return (
    <Reveal>
      <EntityForm
        mode="create"
        title={`New ${typeLabels[entityType]}`}
        description={`Add a new ${typeLabels[entityType].toLowerCase()} to the connected universe.`}
        submitLabel={`Create ${typeLabels[entityType]}`}
        onSubmit={createEntity}
      />
    </Reveal>
  );
}