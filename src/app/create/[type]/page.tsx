import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

    const entity = await prisma.entity.create({
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
      },
    });

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/search");
    redirect(`/entities/${entity.slug}`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
        <section>
          <p className="text-sm text-muted-foreground">Create Entity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            New {typeLabels[entityType]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add a new {typeLabels[entityType].toLowerCase()} to the connected universe.
          </p>
        </section>

        <form action={createEntity} className="space-y-6 rounded-2xl border border-border p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Title</span>
              <input
                name="title"
                required
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder={`Enter ${typeLabels[entityType].toLowerCase()} title`}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Slug</span>
              <input
                name="slug"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="optional-slug"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Summary</span>
            <textarea
              name="summary"
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              placeholder="Short description"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Body</span>
            <textarea
              name="body"
              rows={10}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              placeholder="Main content"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <select
                name="status"
                defaultValue="DRAFT"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="DEPRECATED">Deprecated</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Visibility</span>
              <select
                name="visibility"
                defaultValue="PRIVATE"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              >
                <option value="PRIVATE">Private</option>
                <option value="SHARED">Shared</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Aliases</span>
              <input
                name="aliases"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="Comma-separated aliases"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Tags</span>
              <input
                name="tags"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="Comma-separated tags"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Search Keywords</span>
            <input
              name="searchKeywords"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              placeholder="Comma-separated keywords"
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Create {typeLabels[entityType]}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
