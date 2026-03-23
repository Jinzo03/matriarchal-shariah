import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { AdminIndexNav } from "@/components/admin-index-nav";

export const dynamic = "force-dynamic";

type ExportBundle = {
  entities: Array<Record<string, unknown>>;
  relationships: Array<Record<string, unknown>>;
  revisions: Array<Record<string, unknown>>;
};

function safeString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export default async function ImportExportPage() {
  const locale = await getRequestLocale();
  const [entities, relationships, revisions] = await Promise.all([
    prisma.entity.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.relationship.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.entityRevision.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const exportBundle: ExportBundle = {
    entities,
    relationships,
    revisions,
  };

  const exportJson = JSON.stringify(exportBundle, null, 2);

  async function importUniverse(formData: FormData) {
    "use server";

    const raw = safeString(formData.get("json"));
    if (!raw.trim()) return;

    const data = JSON.parse(raw) as ExportBundle;

    await prisma.$transaction(async (tx) => {
      await tx.relationship.deleteMany();
      await tx.entityRevision.deleteMany();
      await tx.entity.deleteMany();

      for (const entity of data.entities ?? []) {
        await tx.entity.create({
          data: {
            ...(entity as Record<string, unknown>),
          } as never,
        });
      }

      for (const revision of data.revisions ?? []) {
        await tx.entityRevision.create({
          data: {
            ...(revision as Record<string, unknown>),
          } as never,
        });
      }

      for (const relationship of data.relationships ?? []) {
        await tx.relationship.create({
          data: {
            ...(relationship as Record<string, unknown>),
          } as never,
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/browse");
    revalidatePath("/search");
    revalidatePath("/timeline");
    revalidatePath("/admin/import-export");
    redirect("/admin/import-export");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel">
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "الإدارة / الاستيراد والتصدير" : "Admin / Import & Export"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(locale, "importExport")}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "صدّر الكون بصيغة JSON أو ألصق نسخة احتياطية لاستعادته."
                : "Export the universe as JSON or paste a JSON backup to restore it."}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <Link href="/admin" className="text-sm underline">
                {t(locale, "backToAdminHub")}
              </Link>
              <AdminIndexNav />
            </div>
          </section>
        </Reveal>

        <section className="grid gap-6 lg:grid-cols-2">
          <Reveal delay={0.08}>
            <div className="ms-panel">
              <h2 className="text-lg font-semibold">{t(locale, "exportJson")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t(locale, "exportBackupHelp")}</p>
              <textarea
                readOnly
                value={exportJson}
                className="mt-4 h-[34rem] w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs outline-none"
              />
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="ms-panel">
              <h2 className="text-lg font-semibold">{t(locale, "importJson")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t(locale, "importBackupHelp")}</p>

              <form action={importUniverse} className="mt-4 space-y-4">
                <textarea
                  name="json"
                  rows={24}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs outline-none transition focus:ring-2 focus:ring-ring"
                  placeholder={t(locale, "importPlaceholder")}
                />

                <div className="flex justify-end">
                  <button type="submit" className="ms-button">
                    {t(locale, "importUniverse")}
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  );
}
