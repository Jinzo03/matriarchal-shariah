import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { AdminIndexNav } from "@/components/admin-index-nav";
import { FilePicker } from "@/components/file-picker";
import { dryRunImport, type ImportPreview } from "@/lib/importer";
import { applyUniverseImport } from "@/lib/import-apply";
import { UniversePackageSchema, type UniversePackage } from "@/lib/import-schema";
import { ImportJobStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type PreviewSummary = {
  payload: UniversePackage;
  preview: ImportPreview;
  sourceName?: string;
  createdAt: string;
  confirmedAt?: string;
  appliedImportJobId?: string;
};

function isPreviewSummary(value: unknown): value is PreviewSummary {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    !!record.payload &&
    !!record.preview &&
    typeof record.createdAt === "string"
  );
}

function formatCountsBlock(counts: { create: number; update: number; skip: number }) {
  return `create=${counts.create} update=${counts.update} skip=${counts.skip}`;
}

export default async function ImportExportPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const locale = await getRequestLocale();
  const { job } = await searchParams;

  const [entities, relationships, revisions, previewJob] = await Promise.all([
    prisma.entity.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.relationship.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.entityRevision.findMany({ orderBy: { createdAt: "asc" } }),
    job
      ? prisma.importJob.findUnique({
          where: { id: job },
        })
      : Promise.resolve(null),
  ]);

  const exportBundle = {
    entities,
    relationships,
    revisions,
  };

  const exportJson = JSON.stringify(exportBundle, null, 2);

  const previewSummary =
    previewJob?.summary && isPreviewSummary(previewJob.summary)
      ? previewJob.summary
      : null;

  async function createPreview(formData: FormData) {
    "use server";

    const file = formData.get("package");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Please upload a valid JSON package file.");
    }

    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const packageData = UniversePackageSchema.parse(parsed);
    const preview = await dryRunImport(packageData, file.name);

    const jobRow = await prisma.importJob.create({
      data: {
        packageId: packageData.packageId,
        packageVersion: packageData.version,
        title: packageData.title,
        sourcePath: file.name,
        status: ImportJobStatus.DRAFT,
        dryRun: true,
        summary: {
          payload: packageData,
          preview,
          sourceName: file.name,
          createdAt: new Date().toISOString(),
        } satisfies PreviewSummary,
      },
    });

    revalidatePath("/admin/import-export");
    redirect(`/admin/import-export?job=${jobRow.id}`);
  }

  async function confirmImport(formData: FormData) {
    "use server";

    const jobId = String(formData.get("jobId") ?? "").trim();
    if (!jobId) return;

    const jobRow = await prisma.importJob.findUnique({
      where: { id: jobId },
    });

    if (!jobRow) notFound();

    const summaryValue = jobRow.summary;
    if (!summaryValue || !isPreviewSummary(summaryValue)) {
      throw new Error("This import job does not contain a valid preview payload.");
    }

    const result = await applyUniverseImport(summaryValue.payload, {
      sourcePath: jobRow.sourcePath ?? undefined,
      approvedPreview: summaryValue.preview,
    });

    await prisma.importJob.update({
      where: { id: jobRow.id },
      data: {
        status: ImportJobStatus.SUCCEEDED,
        finishedAt: new Date(),
        summary: {
          ...summaryValue,
          confirmedAt: new Date().toISOString(),
          appliedImportJobId: result.jobId,
        },
      },
    });

    revalidatePath("/admin/import-export");
    revalidatePath("/admin/logs");
    revalidatePath("/admin/content");
    revalidatePath("/browse");
    revalidatePath("/search");
    revalidatePath("/timeline");
    redirect("/admin/logs");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel p-6">
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "الإدارة / الاستيراد والتصدير" : "Admin / Import & Export"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {t(locale, "importExport")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "صدّر الكون بصيغة JSON أو ارفع حزمة محتوى، راجع المعاينة، ثم أكّد الكتابة."
                : "Export the universe as JSON, or upload a content package, review the dry-run, and confirm the write import."}
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
            <div className="ms-panel p-6">
              <h2 className="text-lg font-semibold">{t(locale, "exportJson")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "exportBackupHelp")}
              </p>
              <textarea
                readOnly
                value={exportJson}
                className="mt-4 h-[34rem] w-full rounded-xl border border-border bg-background/70 px-4 py-3 font-mono text-xs outline-none"
              />
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="ms-panel p-6">
              <h2 className="text-lg font-semibold">
                {locale === "ar" ? "استيراد حزمة محتوى" : "Import Package"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "ارفع ملف JSON للحزمة، ستظهر لك المعاينة أولاً، ثم يمكنك تأكيد الكتابة."
                  : "Upload a JSON package file. The app will show a dry-run preview first, then allow you to confirm the write import."}
              </p>

              <form action={createPreview} className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">
                    {locale === "ar" ? "ملف الحزمة" : "Package file"}
                  </span>
                  <FilePicker
                    name="package"
                    accept="application/json,.json"
                    label={locale === "ar" ? "\u0627\u062e\u062a\u0631 \u0645\u0644\u0641\u064b\u0627" : "Choose File"}
                    emptyLabel={
                      locale === "ar"
                        ? "\u0644\u0645 \u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0644\u0641 \u0628\u0639\u062f"
                        : "No file selected"
                    }
                  />
                </label>

                <div className="flex justify-end">
                  <button type="submit" className="ms-button">
                    {locale === "ar" ? "تشغيل المعاينة" : "Run Dry-Run"}
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </section>

        <Reveal delay={0.16}>
          <section className="ms-panel p-6">
            <h2 className="text-lg font-semibold">
              {locale === "ar" ? "حالة المعاينة" : "Preview Status"}
            </h2>

            {previewJob && previewSummary ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "الحزمة" : "Package"}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{previewJob.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {previewJob.packageId} · {previewJob.packageVersion}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "العناصر" : "Entities"}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatCountsBlock(previewSummary.preview.counts.entities)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "الوسائط" : "Media"}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatCountsBlock(previewSummary.preview.counts.media)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "العلاقات" : "Relationships"}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatCountsBlock(previewSummary.preview.counts.relationships)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar" ? "روابط الوسائط بالعناصر" : "Entity Media"}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatCountsBlock(previewSummary.preview.counts.entityMedia)}
                    </p>
                  </div>
                </div>

                {previewSummary.preview.warnings.length > 0 ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm font-medium">
                      {locale === "ar" ? "تحذيرات" : "Warnings"}
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {previewSummary.preview.warnings.map((warning) => (
                        <li key={warning}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                    {locale === "ar"
                      ? "لا توجد تحذيرات في هذه المعاينة."
                      : "No warnings in this preview."}
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
                  <p className="text-sm font-medium">
                    {locale === "ar" ? "عناصر المعاينة" : "Preview items"}
                  </p>
                  <div className="mt-3 space-y-2">
                    {previewSummary.preview.items.slice(0, 12).map((item) => (
                      <div
                        key={`${item.kind}-${item.key}-${item.action}`}
                        className="rounded-xl border border-border/70 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.kind} · {item.action}
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form action={confirmImport}>
                  <input type="hidden" name="jobId" value={previewJob.id} />
                  <div className="flex justify-end">
                    <button type="submit" className="ms-button">
                      {locale === "ar" ? "تأكيد الاستيراد" : "Confirm Write Import"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد معاينة بعد. ارفع حزمة لتشغيل المعاينة أولاً."
                  : "No preview loaded yet. Upload a package to run a dry-run first."}
              </div>
            )}
          </section>
        </Reveal>
      </div>
    </main>
  );
}
