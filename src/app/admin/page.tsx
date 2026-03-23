import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { AdminIndexNav } from "@/components/admin-index-nav";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const locale = await getRequestLocale();
  const [entityCount, archivedCount, relationshipCount, revisionCount] = await Promise.all([
    prisma.entity.count(),
    prisma.entity.count({ where: { status: "ARCHIVED" } }),
    prisma.relationship.count(),
    prisma.entityRevision.count(),
  ]);

  const adminSections = [
    {
      title: t(locale, "dashboard"),
      description:
        locale === "ar"
          ? "نظرة عامة على النظام وروابط الصيانة ومؤشرات سلامة الكون."
          : "System overview, maintenance shortcuts, and universe health.",
      href: "/admin",
    },
    {
      title: t(locale, "content"),
      description:
        locale === "ar"
          ? "تصفح المحتوى وأرشفه واحذفه وافحصه بسرعة."
          : "Browse, archive, delete, and inspect universe content.",
      href: "/admin/content",
    },
    {
      title: t(locale, "analytics"),
      description:
        locale === "ar"
          ? "اعرض الأعداد الأساسية والإشارات البنيوية عبر الكون."
          : "View basic counts and structural signals across the universe.",
      href: "/admin/analytics",
    },
    {
      title: t(locale, "settings"),
      description:
        locale === "ar"
          ? "تفضيلات الصيانة البسيطة وإعدادات الإدارة."
          : "Simple maintenance preferences and admin configuration.",
      href: "/admin/settings",
    },
    {
      title: t(locale, "logs"),
      description:
        locale === "ar"
          ? "راجع التغييرات الأخيرة ونشاط المراجعات وملاحظات النظام."
          : "Inspect recent changes, revision activity, and system notes.",
      href: "/admin/logs",
    },
    {
      title: t(locale, "support"),
      description:
        locale === "ar"
          ? "ملاحظات دعم وصيانة أساسية للمشروع."
          : "Basic support and maintenance notes for the project.",
      href: "/admin/support",
    },
    {
      title: t(locale, "importExport"),
      description:
        locale === "ar"
          ? "أنشئ نسخة احتياطية أو استعد الكون بصيغة JSON."
          : "Backup or restore the universe in JSON form.",
      href: "/admin/import-export",
    },
  ];

  const stats = [
    { label: t(locale, "entities"), value: entityCount },
    { label: t(locale, "archived"), value: archivedCount },
    { label: t(locale, "relationships"), value: relationshipCount },
    { label: t(locale, "revisions"), value: revisionCount },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel">
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "لوحة الإدارة" : "Admin Panel"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {locale === "ar" ? "مركز الصيانة" : "Maintenance Hub"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "مركز تحكم خفيف للمحتوى والبنية والسجلات والإعدادات ومهام التشغيل الأساسية."
                : "A lightweight control center for content, structure, logs, settings, and basic operational tasks."}
            </p>

            <div className="mt-5">
              <AdminIndexNav />
            </div>
          </section>
        </Reveal>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.03}>
              <div className="ms-panel-soft">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              </div>
            </Reveal>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminSections.map((section, index) => (
            <Reveal key={section.href} delay={index * 0.03}>
              <Link href={section.href} className="block ms-panel-soft transition hover:bg-accent">
                <p className="text-lg font-semibold">{section.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
              </Link>
            </Reveal>
          ))}
        </section>
      </div>
    </main>
  );
}
