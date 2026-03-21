import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const events = await prisma.entity.findMany({
    where: { type: "EVENT" },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      body: true,
      updatedAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <section>
          <p className="text-sm text-muted-foreground">Timeline</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Historical Flow</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track major events and turning points across the universe.
          </p>
        </section>

        <section className="rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Events</h2>
            <span className="text-sm text-muted-foreground">{events.length} total</span>
          </div>

          <div className="mt-4 space-y-3">
            {events.length > 0 ? (
              events.map((event) => (
                <Link
                  key={event.id}
                  href={`/entities/${event.slug}`}
                  className="block rounded-xl border border-border p-4 transition hover:bg-accent"
                >
                  <p className="font-medium">{event.title}</p>
                  {event.summary ? (
                    <p className="mt-1 text-sm text-muted-foreground">{event.summary}</p>
                  ) : null}
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No events yet. Create your first event to start building the timeline.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
