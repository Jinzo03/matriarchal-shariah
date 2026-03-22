import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EntityPage({ params }: PageProps) {
  const { slug } = await params;

  const entity = await prisma.entity.findUnique({
    where: { slug },
    include: {
      incomingRelationships: {
        include: { sourceEntity: true },
      },
      outgoingRelationships: {
        include: { targetEntity: true },
      },
    },
  });

  if (!entity) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="rounded-2xl border border-border p-6 shadow-sm">
            <PageHeader
              eyebrow={entity.type}
              title={entity.title}
              description={entity.summary || "No summary yet."}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/entities/${entity.slug}/edit`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm transition hover:bg-accent"
              >
                Edit
              </Link>
              <Link
                href={`/entities/${entity.slug}/relationships`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm transition hover:bg-accent"
              >
                Relationships
              </Link>
              <Link
                href={`/entities/${entity.slug}/archive`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm transition hover:bg-accent"
              >
                Archive
              </Link>
              <Link
                href={`/entities/${entity.slug}/history`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm transition hover:bg-accent"
              >
                History
              </Link>
              <Link
                href={`/entities/${entity.slug}/delete`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm transition hover:bg-accent"
              >
                Delete
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-1">
                {entity.status}
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                {entity.visibility}
              </span>
              {entity.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal delay={0.08} className="lg:col-span-2">
            <section className="rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Content</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                {entity.body || "No body content yet."}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.14}>
            <section className="rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Slug</dt>
                  <dd>{entity.slug}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Aliases</dt>
                  <dd>{entity.aliases.length > 0 ? entity.aliases.join(", ") : "None"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Search Keywords</dt>
                  <dd>
                    {entity.searchKeywords.length > 0
                      ? entity.searchKeywords.join(", ")
                      : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Version</dt>
                  <dd>{entity.version}</dd>
                </div>
              </dl>
            </section>
          </Reveal>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal delay={0.18}>
            <section className="rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Incoming Relationships</h2>
              <div className="mt-4 space-y-3">
                {entity.incomingRelationships.length > 0 ? (
                  entity.incomingRelationships.map((relationship) => (
                    <Link
                      key={relationship.id}
                      href={`/entities/${relationship.sourceEntity.slug}`}
                      className="block rounded-xl border border-border px-4 py-3 transition hover:bg-accent"
                    >
                      <p className="font-medium">{relationship.sourceEntity.title}</p>
                      <p className="text-sm text-muted-foreground">{relationship.type}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No incoming relationships yet.</p>
                )}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.24}>
            <section className="rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Outgoing Relationships</h2>
              <div className="mt-4 space-y-3">
                {entity.outgoingRelationships.length > 0 ? (
                  entity.outgoingRelationships.map((relationship) => (
                    <Link
                      key={relationship.id}
                      href={`/entities/${relationship.targetEntity.slug}`}
                      className="block rounded-xl border border-border px-4 py-3 transition hover:bg-accent"
                    >
                      <p className="font-medium">{relationship.targetEntity.title}</p>
                      <p className="text-sm text-muted-foreground">{relationship.type}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No outgoing relationships yet.</p>
                )}
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </main>
  );
}