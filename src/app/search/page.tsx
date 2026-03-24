import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EntityType } from "@/generated/prisma/client";
import { getRequestLocale } from "@/lib/locale.server";
import { t } from "@/lib/locale";
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

function hasExternalLinks(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false;

  const value = metadata as Record<string, unknown>;
  const links = value.externalLinks;

  if (!links || typeof links !== "object") return false;

  const record = links as Record<string, unknown>;
  return typeof record.wattpad === "string" || typeof record.ao3 === "string";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const locale = await getRequestLocale();
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
          metadata: true,
        },
      })
    : [];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section>
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "بحث الكون" : "Search Universe"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {locale === "ar" ? "اعثر على أي شيء" : "Find anything"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "ابحث بالعنوان أو الملخص أو النص أو الرابط أو الاسم البديل أو الوسم أو الكلمة المفتاحية."
                : "Search by title, summary, body, slug, alias, tag, or keyword."}
            </p>
          </section>
        </Reveal>

        <Reveal delay={0.06}>
          <form className="flex flex-col gap-3 md:flex-row" action="/search">
            <input
              name="q"
              defaultValue={query}
              placeholder={locale === "ar" ? "ابحث في الكون..." : "Search the universe..."}
              className="ms-input"
            />
            <button type="submit" className="ms-button">
              {locale === "ar" ? "بحث" : "Search"}
            </button>
          </form>
        </Reveal>

        {query ? (
          <Reveal delay={0.1}>
            <section className="ms-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">
                  {locale === "ar" ? "النتائج" : "Results"}
                </h2>
                <span className="text-sm text-muted-foreground">{results.length} found</span>
              </div>

              <div className="mt-4 space-y-3">
                {results.length > 0 ? (
                  results.map((item, index) => {
                    const storyHasExternalLinks =
                      item.type === EntityType.STORY && hasExternalLinks(item.metadata);

                    return (
                      <Reveal key={item.id} delay={index * 0.03}>
                        <Link
                          href={`/entities/${item.slug}`}
                          className="block rounded-xl border border-border p-4 transition hover:bg-accent"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              {storyHasExternalLinks ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                                    {locale === "ar" ? "فصل معاينة" : "Preview chapter"}
                                  </span>
                                  <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                                    {locale === "ar" ? "قراءة خارجية" : "External reading"}
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            <span className="text-xs text-muted-foreground">
                              {typeLabels[item.type]}
                            </span>
                          </div>

                          {item.summary ? (
                            <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                          ) : null}
                        </Link>
                      </Reveal>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    <p>
                      {locale === "ar"
                        ? `لا توجد نتائج لـ “${query}”.`
                        : `No results found for “${query}”.`}
                    </p>
                    <p className="mt-2">
                      {locale === "ar" ? "جرّب مصطلحًا آخر أو " : "Try another term, or "}
                      <Link href="/browse" className="underline">
                        {locale === "ar" ? "تصفح الكون" : "browse the universe"}
                      </Link>
                      {locale === "ar" ? "." : "."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </Reveal>
        ) : (
          <Reveal delay={0.1}>
            <section className="ms-panel p-6 text-sm text-muted-foreground">
              {locale === "ar" ? "أدخل كلمة بحث للبدء، أو " : "Enter a search term to begin, or "}
              <Link href="/browse" className="underline">
                {locale === "ar" ? "تصفح الكون" : "browse the universe"}
              </Link>
              {locale === "ar" ? "." : "."}
            </section>
          </Reveal>
        )}
      </div>
    </main>
  );
}