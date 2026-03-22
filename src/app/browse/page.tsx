import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EntityType } from "@/generated/prisma/client";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

const typeOrder: EntityType[] = [
  EntityType.CHARACTER,
  EntityType.STORY,
  EntityType.INSTITUTION,
  EntityType.LOCATION,
  EntityType.DOCTRINE,
  EntityType.EVENT,
  EntityType.TERM,
  EntityType.ARTIFACT,
  EntityType.OTHER,
];

const typeLabels: Record<EntityType, string> = {
  CHARACTER: "Characters",
  STORY: "Stories",
  INSTITUTION: "Institutions",
  LOCATION: "Locations",
  DOCTRINE: "Doctrines",
  EVENT: "Events",
  TERM: "Terms",
  ARTIFACT: "Artifacts",
  OTHER: "Other",
};

export default async function BrowsePage() {
  const entities = await prisma.entity.findMany({
    orderBy: [{ type: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      summary: true,
      updatedAt: true,
    },
  });

  const grouped = typeOrder.reduce<Record<string, typeof entities>>((acc, type) => {
    acc[type] = entities.filter((entity) => entity.type === type);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <section>
          <p className="text-sm text-muted-foreground">Browse Universe</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">All Entities</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Explore the universe by category and jump into any entity page.
          </p>
        </section>

        {entities.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold">Nothing here yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first entity to begin building the universe.
            </p>
            <div className="mt-5">
              <Link
                href="/create"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
              >
                Create First Entity
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {typeOrder.map((type, index) => (
            <Reveal key={type} delay={index * 0.03}>
              <div className="rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{typeLabels[type]}</p>
                <p className="mt-2 text-2xl font-semibold">{grouped[type]?.length ?? 0}</p>
              </div>
            </Reveal>
          ))}
        </section>

        <section className="space-y-8">
          {typeOrder.map((type, typeIndex) => {
            const items = grouped[type] ?? [];

            return (
              <div key={type} className="rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold">{typeLabels[type]}</h2>
                  <span className="text-sm text-muted-foreground">{items.length} items</span>
                </div>

                {items.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {items.map((item, itemIndex) => (
                      <Reveal key={item.id} delay={itemIndex * 0.03}>
                        <Link
                          href={`/entities/${item.slug}`}
                          className="block rounded-xl border border-border p-4 transition hover:bg-accent"
                        >
                          <p className="font-medium">{item.title}</p>
                          {item.summary ? (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {item.summary}
                            </p>
                          ) : null}
                        </Link>
                      </Reveal>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                    No {typeLabels[type].toLowerCase()} yet.
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}