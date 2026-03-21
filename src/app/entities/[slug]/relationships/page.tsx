import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RelationshipType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const relationshipOptions: RelationshipType[] = [
  RelationshipType.BELONGS_TO,
  RelationshipType.APPEARS_IN,
  RelationshipType.LOCATED_IN,
  RelationshipType.RULES_OVER,
  RelationshipType.CREATED_BY,
  RelationshipType.PRECEDES,
  RelationshipType.FOLLOWS,
  RelationshipType.OPPOSES,
  RelationshipType.SUPPORTS,
  RelationshipType.REFERENCES,
  RelationshipType.AFFILIATED_WITH,
  RelationshipType.IS_A,
  RelationshipType.PART_OF,
  RelationshipType.RELATED_TO,
];

export default async function EntityRelationshipsPage({ params }: PageProps) {
  const { slug } = await params;

  const entity = await prisma.entity.findUnique({
    where: { slug },
    include: {
      outgoingRelationships: { include: { targetEntity: true } },
      incomingRelationships: { include: { sourceEntity: true } },
    },
  });

  if (!entity) return notFound();

  async function addRelationship(formData: FormData) {
    "use server";
  if (!entity) return;
    const relationshipType = String(formData.get("relationshipType") ?? "RELATED_TO") as RelationshipType;
    const targetSlug = String(formData.get("targetSlug") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!targetSlug) return;

    const target = await prisma.entity.findUnique({ where: { slug: targetSlug } });
    if (!target) return;

    await prisma.relationship.create({
      data: {
        type: relationshipType,
        sourceEntityId: entity.id,
        targetEntityId: target.id,
        notes: notes || null,
      },
    });

    revalidatePath(`/entities/${entity.slug}`);
    revalidatePath(`/entities/${entity.slug}/relationships`);
    redirect(`/entities/${entity.slug}/relationships`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <section className="rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Relationships</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{entity.title}</h1>
          <div className="mt-4 flex gap-3">
            <Link href={`/entities/${entity.slug}`} className="text-sm underline">
              Back to entity
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Add Relationship</h2>
          <form action={addRelationship} className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Relationship Type</span>
                <select
                  name="relationshipType"
                  defaultValue="RELATED_TO"
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                >
                  {relationshipOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Target Entity Slug</span>
                <input
                  name="targetSlug"
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  placeholder="the-target-entity"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                placeholder="Optional context for this relationship"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
              >
                Add Relationship
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Outgoing</h2>
            <div className="mt-4 space-y-3">
              {entity.outgoingRelationships.length > 0 ? (
                entity.outgoingRelationships.map((relationship) => (
                  <Link
                    key={relationship.id}
                    href={`/entities/${relationship.targetEntity.slug}`}
                    className="block rounded-xl border border-border p-4 transition hover:bg-accent"
                  >
                    <p className="font-medium">{relationship.targetEntity.title}</p>
                    <p className="text-sm text-muted-foreground">{relationship.type}</p>
                    {relationship.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{relationship.notes}</p>
                    ) : null}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No outgoing relationships yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Incoming</h2>
            <div className="mt-4 space-y-3">
              {entity.incomingRelationships.length > 0 ? (
                entity.incomingRelationships.map((relationship) => (
                  <Link
                    key={relationship.id}
                    href={`/entities/${relationship.sourceEntity.slug}`}
                    className="block rounded-xl border border-border p-4 transition hover:bg-accent"
                  >
                    <p className="font-medium">{relationship.sourceEntity.title}</p>
                    <p className="text-sm text-muted-foreground">{relationship.type}</p>
                    {relationship.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{relationship.notes}</p>
                    ) : null}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No incoming relationships yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
