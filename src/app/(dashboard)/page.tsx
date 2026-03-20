import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [characters, stories, institutions, locations, recentItems] = await Promise.all([
    prisma.entity.count({ where: { type: "CHARACTER" } }),
    prisma.entity.count({ where: { type: "STORY" } }),
    prisma.entity.count({ where: { type: "INSTITUTION" } }),
    prisma.entity.count({ where: { type: "LOCATION" } }),
    prisma.entity.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        updatedAt: true,
      },
    }),
  ]);

  const quickStats = [
    { label: "Characters", value: characters },
    { label: "Stories", value: stories },
    { label: "Institutions", value: institutions },
    { label: "Locations", value: locations },
  ];

  const quickActions = [
    { label: "New Character", href: "/create/character" },
    { label: "New Story", href: "/create/story" },
    { label: "New Institution", href: "/create/institution" },
    { label: "Open Timeline", href: "/timeline" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <section className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Matriarchal Shari&apos;ah</p>
            <h1 className="text-3xl font-semibold tracking-tight">Universe Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              A central place to create, connect, and navigate the universe.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              aria-label="Search universe"
              placeholder="Search characters, stories, institutions..."
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
            <Link
              href="/create"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Create New
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Recent Items</h2>
              <Link href="/browse" className="text-sm text-muted-foreground hover:underline">
                Browse all
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/entities/${item.slug}`}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 transition hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">Open</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <div className="mt-4 flex flex-col gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-accent"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
