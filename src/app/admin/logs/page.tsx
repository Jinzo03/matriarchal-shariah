import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatLocaleDateTime, t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { AdminIndexNav } from "@/components/admin-index-nav";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const locale = await getRequestLocale();
  const [recentEntities, recentRevisions, archivedCount, relationshipCount] = await Promise.all([
    prisma.entity.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        version: true,
        updatedAt: true,
        status: true,
      },
    }),
    prisma.entityRevision.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        entityId: true,
        version: true,
        title: true,
        slug: true,
        createdAt: true,
      },
    }),
    prisma.entity.count({ where: { status: "ARCHIVED" } }),
    prisma.relationship.count(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel">
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "الإدارة / السجلات" : "Admin / Logs"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {locale === "ar" ? "سجلات النشاط" : "Activity Logs"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "أحدث التغييرات وعمليات كتابة المراجعات والإشارات البنيوية السريعة للكون."
                : "Recent changes, revision writes, and quick structural signals for the universe."}
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
            { label: t(locale, "archivedEntities"), value: archivedCount },
            { label: t(locale, "relationships"), value: relationshipCount },
            { label: t(locale, "recentUpdates"), value: recentEntities.length },
            { label: t(locale, "recentRevisions"), value: recentRevisions.length },
          ].map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.03}>
              <div className="ms-panel-soft">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </div>
            </Reveal>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal delay={0.08}>
            <section className="ms-panel">
              <h2 className="text-lg font-semibold">{t(locale, "recentEntityUpdates")}</h2>
              <div className="mt-4 space-y-3">
                {recentEntities.map((item, index) => (
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
                        {locale === "ar" ? "الإصدار" : "Version"} {item.version} | {item.status} |{" "}
                        {formatLocaleDateTime(locale, item.updatedAt)}
                      </p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="ms-panel">
              <h2 className="text-lg font-semibold">{t(locale, "recentRevisions")}</h2>
              <div className="mt-4 space-y-3">
                {recentRevisions.map((item, index) => (
                  <Reveal key={item.id} delay={index * 0.03}>
                    <div className="rounded-xl border border-border p-4">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {locale === "ar" ? "الإصدار" : "Version"} {item.version} |{" "}
                        {formatLocaleDateTime(locale, item.createdAt)}
                      </p>
                      <Link
                        href={`/entities/${item.slug}/history`}
                        className="mt-2 inline-block text-sm underline"
                      >
                        {t(locale, "openHistory")}
                      </Link>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
