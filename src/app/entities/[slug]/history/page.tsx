import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EntityHistoryPage({ params }: PageProps) {
  const { slug } = await params;

  const entity = await prisma.entity.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      version: true,
    },
  });

  if (!entity) notFound();

  const revisions = await prisma.entityRevision.findMany({
    where: { entityId: entity.id },
    orderBy: { version: "desc" },
  });

  async function restoreRevision(formData: FormData) {
    "use server";
  if (!entity) return;
    const revisionId = String(formData.get("revisionId") ?? "").trim();
    if (!revisionId) return;

    const revision = await prisma.entityRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision) return;

    const restored = await prisma.$transaction(async (tx) => {
      const updatedEntity = await tx.entity.update({
        where: { id: entity.id },
        data: {
          title: revision.title,
          slug: revision.slug,
          summary: revision.summary,
          body: revision.body,
          status: revision.status,
          visibility: revision.visibility,
          aliases: revision.aliases,
          tags: revision.tags,
          searchKeywords: revision.searchKeywords,
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
    revalidatePath(`/entities/${restored.slug}`);
    revalidatePath(`/entities/${restored.slug}/history`);
    redirect(`/entities/${restored.slug}/history`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">History</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{entity.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Type: {entity.type}</p>
            <p className="mt-1 text-sm text-muted-foreground">Current version: {entity.version}</p>
            <div className="mt-4 flex gap-3">
              <Link href={`/entities/${entity.slug}`} className="text-sm underline">
                Back to entity
              </Link>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Revisions</h2>

            <div className="mt-4 space-y-4">
              {revisions.length > 0 ? (
                revisions.map((revision, index) => (
                  <Reveal key={revision.id} delay={index * 0.03}>
                    <article className="rounded-xl border border-border p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium">Version {revision.version}</p>
                          <p className="text-xs text-muted-foreground">
                            {revision.createdAt.toLocaleString()}
                          </p>
                        </div>

                        <form action={restoreRevision}>
                          <input type="hidden" name="revisionId" value={revision.id} />
                          <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm transition hover:bg-accent"
                          >
                            Restore
                          </button>
                        </form>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">{revision.slug}</p>

                      {revision.summary ? (
                        <p className="mt-2 text-sm">{revision.summary}</p>
                      ) : null}

                      {revision.body ? (
                        <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                          {revision.body}
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border px-3 py-1">
                          {revision.status}
                        </span>
                        <span className="rounded-full border border-border px-3 py-1">
                          {revision.visibility}
                        </span>
                      </div>
                    </article>
                  </Reveal>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No revisions yet.</p>
              )}
            </div>
          </section>
        </Reveal>
      </div>
    </main>
  );
}