import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EntityType } from "@/generated/prisma/client";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const results = query
    ? await prisma.entity.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { aliases: { has: query } },
            { tags: { has: query } },
            { searchKeywords: { has: query } },
          ],
        },
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          summary: true,
        },
      })
    : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <section>
          <p className="text-sm text-muted-foreground">Search Universe</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Find anything</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Search by title, summary, body, slug, alias, tag, or keyword.
          </p>
        </section>

        <form className="flex flex-col gap-3 md:flex-row" action="/search">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search the universe..."
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
          >
            Search
          </button>
        </form>

        {query ? (
          <section className="rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Results</h2>
              <span className="text-sm text-muted-foreground">{results.length} found</span>
            </div>

            <div className="mt-4 space-y-3">
              {results.length > 0 ? (
                results.map((item, index) => (
                  <Reveal key={item.id} delay={index * 0.03}>
                    <Link
                      href={`/entities/${item.slug}`}
                      className="block rounded-xl border border-border p-4 transition hover:bg-accent"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium">{item.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {typeLabels[item.type]}
                        </span>
                      </div>
                      {item.summary ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                      ) : null}
                    </Link>
                  </Reveal>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  <p>No results found for “{query}”.</p>
                  <p className="mt-2">
                    Try another term, or{" "}
                    <Link href="/browse" className="underline">
                      browse the universe
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-border p-6 shadow-sm text-sm text-muted-foreground">
            Enter a search term to begin, or{" "}
            <Link href="/browse" className="underline">
              browse the universe
            </Link>
            .
          </section>
        )}
      </div>
    </main>
  );
}