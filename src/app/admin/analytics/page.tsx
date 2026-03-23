import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { AdminIndexNav } from "@/components/admin-index-nav";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const locale = await getRequestLocale();
  // This page is request-time analytics, so the query intentionally uses "now".
  // eslint-disable-next-line react-hooks/purity
  const oneWeekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

  const [entityCount, archivedCount, relationshipCount, revisionCount, recentCount] =
    await Promise.all([
      prisma.entity.count(),
      prisma.entity.count({ where: { status: "ARCHIVED" } }),
      prisma.relationship.count(),
      prisma.entityRevision.count(),
      prisma.entity.count({
        where: {
          updatedAt: {
            gte: oneWeekAgo,
          },
        },
      }),
    ]);

  const metrics = [
    { label: t(locale, "totalEntities"), value: entityCount },
    { label: t(locale, "archivedEntities"), value: archivedCount },
    { label: t(locale, "relationships"), value: relationshipCount },
    { label: t(locale, "revisions"), value: revisionCount },
    { label: t(locale, "updatedThisWeek"), value: recentCount },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel">
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "الإدارة / التحليلات" : "Admin / Analytics"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(locale, "analytics")}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "إشارات بنيوية بسيطة وأعداد استخدام عبر الكون."
                : "Simple structural signals and usage counts for the universe."}
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric, index) => (
            <Reveal key={metric.label} delay={index * 0.03}>
              <div className="ms-panel-soft">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
              </div>
            </Reveal>
          ))}
        </section>

        <Reveal delay={0.12}>
          <section className="ms-panel">
            <h2 className="text-lg font-semibold">
              {locale === "ar" ? "الغرض من هذه الصفحة" : "What this page is for"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {locale === "ar"
                ? "هذه هي طبقة التحليلات الأولى: أعداد، ونشاط، ومؤشرات صحة أساسية. ويمكن تطويرها لاحقًا إلى رسوم بيانية واتجاهات نمو وتقسيمات للمحتوى وتنبيهات صيانة."
                : "This is the first analytics layer: counts, activity, and basic health signals. Later it can grow into charts, growth trends, content breakdowns, and maintenance alerts."}
            </p>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
