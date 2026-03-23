import Link from "next/link";
import { t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { AdminIndexNav } from "@/components/admin-index-nav";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const locale = await getRequestLocale();
  const supportBlocks = [
    {
      title: locale === "ar" ? "قائمة الصيانة" : "Maintenance checklist",
      items:
        locale === "ar"
          ? [
              "استخدم الأرشفة قبل الحذف كلما أمكن.",
              "راجع العلاقات بعد التعديلات الكبيرة.",
              "احتفظ بنسخ JSON الاحتياطية في مكان آمن.",
              "افحص المراجعات قبل استعادة الحالات القديمة.",
            ]
          : [
              "Use archive before delete whenever possible.",
              "Review relationships after major edits.",
              "Keep imports/export JSON backups in a safe place.",
              "Check revisions before restoring old states.",
            ],
    },
    {
      title: locale === "ar" ? "سير العمل المقترح" : "Recommended workflow",
      items:
        locale === "ar"
          ? [
              "أنشئ العناصر أولًا.",
              "اربطها داخل مخطط الكون.",
              "استخدم السجل عند الحاجة لاسترجاع التعديلات.",
              "استخدم السجلات لمراجعة التغييرات البنيوية الأخيرة.",
            ]
          : [
              "Create entities first.",
              "Link them into the universe graph.",
              "Use history when edits need recovery.",
              "Use logs to review recent structural changes.",
            ],
    },
    {
      title: locale === "ar" ? "إجراءات الطوارئ" : "Emergency actions",
      items:
        locale === "ar"
          ? [
              "استعد من سجل المراجعات.",
              "أعد استيراد نسخة JSON محفوظة.",
              "أرشف المحتوى غير المستقر بدلًا من حذفه.",
              "استخدم التصفح أو البحث للتحقق من سلامة البيانات بسرعة.",
            ]
          : [
              "Restore from revision history.",
              "Re-import a saved JSON export.",
              "Archive unstable content instead of deleting it.",
              "Use browse/search to verify data health quickly.",
            ],
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel">
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "الإدارة / الدعم" : "Admin / Support"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(locale, "support")}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "ملاحظات عملية للصيانة والاستعادة والتحرير الآمن داخل الكون."
                : "Practical notes for maintenance, recovery, and safe universe editing."}
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
          {supportBlocks.map((block, index) => (
            <Reveal key={block.title} delay={index * 0.03}>
              <div className="ms-panel-soft">
                <h2 className="text-lg font-semibold">{block.title}</h2>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {block.items.map((item) => (
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
