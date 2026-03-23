import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatLocaleDateTime, t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { AdminIndexNav } from "@/components/admin-index-nav";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const locale = await getRequestLocale();
  const [entities, archived, relationships, revisions] = await Promise.all([
    prisma.entity.count(),
    prisma.entity.count({ where: { status: "ARCHIVED" } }),
    prisma.relationship.count(),
    prisma.entityRevision.count(),
  ]);

  const recent = await prisma.entity.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      status: true,
      updatedAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel">
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "الإدارة / المحتوى" : "Admin / Content"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {locale === "ar" ? "صيانة المحتوى" : "Content Maintenance"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "افحص الكون، وحافظ على المحتوى منظمًا، وانتقل بسرعة إلى صيانة العناصر."
                : "Inspect the universe, keep content clean, and jump into entity maintenance quickly."}
            </p>
            <div className="mt-4">
              <Link href="/admin" className="text-sm underline">
                {t(locale, "backToAdminHub")}
              </Link>
            </div>

            <div className="mt-5">
              <AdminIndexNav />
            </div>
          </section>
        </Reveal>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t(locale, "entities"), value: entities },
            { label: t(locale, "archived"), value: archived },
            { label: t(locale, "relationships"), value: relationships },
            { label: t(locale, "revisions"), value: revisions },
          ].map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.03}>
              <div className="ms-panel-soft">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </div>
            </Reveal>
          ))}
        </section>

        <Reveal delay={0.08}>
          <section className="ms-panel">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{t(locale, "recentContent")}</h2>
              <Link href="/browse" className="text-sm text-muted-foreground hover:underline">
                {t(locale, "openBrowse")}
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recent.map((item, index) => (
                <Reveal key={item.id} delay={index * 0.03}>
                  <Link
                    href={`/entities/${item.slug}`}
                    className="block rounded-xl border border-border p-4 transition hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">{item.title}</p>
                      <span className="text-xs text-muted-foreground">{item.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.status} | {formatLocaleDateTime(locale, item.updatedAt)}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
