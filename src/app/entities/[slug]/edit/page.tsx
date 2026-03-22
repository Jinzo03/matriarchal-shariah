import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EntityForm } from "@/components/entity-form";
import { Reveal } from "@/components/reveal";
import { EntityStatus, EntityType, Visibility } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
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

export default async function EditEntityPage({ params }: PageProps) {
  const { slug } = await params;

  const entity = await prisma.entity.findUnique({
    where: { slug },
  });

  if (!entity) notFound();

  async function updateEntity(formData: FormData) {
    "use server";
  if (!entity) return;

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    
    const slugInput = String(formData.get("slug") ?? "").trim();
    const nextSlug = slugInput || slugify(title);
    const summary = String(formData.get("summary") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const status = String(formData.get("status") ?? "DRAFT") as EntityStatus;
    const visibility = String(formData.get("visibility") ?? "PRIVATE") as Visibility;

    const aliases = splitList(formData.get("aliases"));
    const tags = splitList(formData.get("tags"));
    const searchKeywords = splitList(formData.get("searchKeywords"));

    const updated = await prisma.$transaction(async (tx) => {
      const updatedEntity = await tx.entity.update({
        where: { id: entity.id },
        data: {
          title,
          slug: nextSlug,
          summary: summary || null,
          body: body || null,
          status,
          visibility,
          aliases,
          tags,
          searchKeywords,
          version: { increment: 1 },
        },
      });

      await tx.entityRevision.create({
        data: {
          entityId: updatedEntity.id,
          version: updatedEntity.version,
          title: updatedEntity.title,
          slug: updatedEntity.slug,
          summary: updatedEntity.summary,
          body: updatedEntity.body,
          status: updatedEntity.status,
          visibility: updatedEntity.visibility,
          aliases: updatedEntity.aliases,
          tags: updatedEntity.tags,
          searchKeywords: updatedEntity.searchKeywords,
        },
      });

      return updatedEntity;
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/browse");
    revalidatePath("/search");
    revalidatePath(`/entities/${slug}`);
    revalidatePath(`/entities/${updated.slug}`);
    revalidatePath(`/entities/${updated.slug}/history`);
    redirect(`/entities/${updated.slug}`);
  }

  return (
    <Reveal>
      <EntityForm
        mode="edit"
        title={`Edit ${typeLabels[entity.type]}`}
        description="Update this entity and keep the universe connected."
        submitLabel="Save Changes"
        onSubmit={updateEntity}
        values={{
          title: entity.title,
          slug: entity.slug,
          summary: entity.summary,
          body: entity.body,
          status: entity.status,
          visibility: entity.visibility,
          aliases: entity.aliases,
          tags: entity.tags,
          searchKeywords: entity.searchKeywords,
        }}
      />
    </Reveal>
  );
}