import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/reveal";

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
          <section className="rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Import / Export</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Export the universe as JSON or paste a JSON backup to restore it.
            </p>
            <div className="mt-4">
              <Link href="/dashboard" className="text-sm underline">
                Back to dashboard
              </Link>
            </div>
          </section>
        </Reveal>

        <section className="grid gap-6 lg:grid-cols-2">
          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Export JSON</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Copy this JSON to keep a backup of the current universe.
              </p>
              <textarea
                readOnly
                value={exportJson}
                className="mt-4 h-[34rem] w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs outline-none"
              />
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Import JSON</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Paste a full export bundle here. This replaces the current data.
              </p>

              <form action={importUniverse} className="mt-4 space-y-4">
                <textarea
                  name="json"
                  rows={24}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs outline-none transition focus:ring-2 focus:ring-ring"
                  placeholder="Paste export JSON here"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
                  >
                    Import Universe
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