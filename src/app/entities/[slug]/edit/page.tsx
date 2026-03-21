import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  EntityStatus,
  EntityType,
  Visibility,
} from "@/generated/prisma/client";

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

export default async function EditEntityPage({ params }: PageProps) {
  const { slug } = await params;

  const entity = await prisma.entity.findUnique({
    where: { slug },
  });

  if (!entity) notFound();

  async function updateEntity(formData: FormData) {
    "use server";

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

    const updated = await prisma.entity.update({
      where: { slug },
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

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/search");
    revalidatePath(`/entities/${slug}`);
    revalidatePath(`/entities/${updated.slug}`);
    redirect(`/entities/${updated.slug}`);
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
        <section>
          <p className="text-sm text-muted-foreground">Edit Entity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Edit {typeLabels[entity.type]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Update this entity and keep the universe connected.
          </p>
        </section>

        <form action={updateEntity} className="space-y-6 rounded-2xl border border-border p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Title</span>
              <input
                name="title"
                defaultValue={entity.title}
                required
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Slug</span>
              <input
                name="slug"
                defaultValue={entity.slug}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Summary</span>
            <textarea
              name="summary"
              rows={3}
              defaultValue={entity.summary ?? ""}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Body</span>
            <textarea
              name="body"
              rows={10}
              defaultValue={entity.body ?? ""}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <select
                name="status"
                defaultValue={entity.status}
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
                defaultValue={entity.visibility}
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
                defaultValue={entity.aliases.join(", ")}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="Comma-separated aliases"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Tags</span>
              <input
                name="tags"
                defaultValue={entity.tags.join(", ")}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="Comma-separated tags"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Search Keywords</span>
            <input
              name="searchKeywords"
              defaultValue={entity.searchKeywords.join(", ")}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              placeholder="Comma-separated keywords"
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
