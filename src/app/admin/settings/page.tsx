import Link from "next/link";
import { t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { AdminIndexNav } from "@/components/admin-index-nav";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const locale = await getRequestLocale();
  const settingsGroups = [
    {
      title: t(locale, "general"),
      items:
        locale === "ar"
          ? [
              "السمة الافتراضية وتخطيط لوحة التحكم.",
              "مستوى الظهور الافتراضي للعناصر الجديدة.",
              "سلوك الأرشفة وقواعد الصيانة.",
            ]
          : [
              "Dashboard theme and layout defaults",
              "Default visibility for new entries",
              "Archive behavior and maintenance rules",
            ],
    },
    {
      title: t(locale, "content"),
      items:
        locale === "ar"
          ? [
              "الحقول المطلوبة للعناصر.",
              "قواعد العنوان واسم الرابط.",
              "تفضيلات تتبع المراجعات.",
            ]
          : [
              "Required fields for entities",
              "Slug and title conventions",
              "Revision tracking preferences",
            ],
    },
    {
      title: t(locale, "maintenance"),
      items:
        locale === "ar"
          ? [
              "صلاحيات الاستيراد والتصدير.",
              "وسائل الحماية قبل الحذف.",
              "العمليات المخصصة للمشرف.",
            ]
          : [
              "Import/export permissions",
              "Deletion safeguards",
              "Admin-only operations",
            ],
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel">
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "الإدارة / الإعدادات" : "Admin / Settings"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(locale, "settings")}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "تفضيلات الإدارة الأساسية وقواعد صيانة الكون."
                : "Basic admin preferences and maintenance rules for the universe."}
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
          {settingsGroups.map((group, index) => (
            <Reveal key={group.title} delay={index * 0.03}>
              <div className="ms-panel-soft">
                <h2 className="text-lg font-semibold">{group.title}</h2>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item} className="rounded-xl border border-dashed border-border px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </section>
      </div>
    </main>
  );
}
