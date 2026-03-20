import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EntityType } from "@/generated/prisma/client";

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

  const grouped = typeOrder.reduce<Record<string, typeof entities>>(
    (acc, type) => {
      acc[type] = entities.filter((entity) => entity.type === type);
      return acc;
    },
    {}
  );

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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {typeOrder.map((type) => (
            <div key={type} className="rounded-2xl border border-border p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{type}</p>
              <p className="mt-2 text-2xl font-semibold">{grouped[type]?.length ?? 0}</p>
            </div>
          ))}
        </section>

        <section className="space-y-8">
          {typeOrder.map((type) => {
            const items = grouped[type] ?? [];

            if (items.length === 0) return null;

            return (
              <div key={type} className="rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold">{type}</h2>
                  <span className="text-sm text-muted-foreground">
                    {items.length} items
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/entities/${item.slug}`}
                      className="rounded-xl border border-border p-4 transition hover:bg-accent"
                    >
                      <p className="font-medium">{item.title}</p>
                      {item.summary ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.summary}
                        </p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}