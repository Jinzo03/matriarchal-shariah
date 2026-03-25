import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/locale";
import { getRequestLocale } from "@/lib/locale.server";
import {
  getRelationshipLabel,
  isRelationshipAllowed,
  isRelationshipType,
} from "@/lib/relationships";
import { Reveal } from "@/components/reveal";
import { RelationshipType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const relationshipOptions: RelationshipType[] = [
  RelationshipType.BELONGS_TO,
  RelationshipType.APPEARS_IN,
  RelationshipType.LOCATED_IN,
  RelationshipType.RULES_OVER,
  RelationshipType.CREATED_BY,
  RelationshipType.PRECEDES,
  RelationshipType.FOLLOWS,
  RelationshipType.OPPOSES,
  RelationshipType.SUPPORTS,
  RelationshipType.REFERENCES,
  RelationshipType.AFFILIATED_WITH,
  RelationshipType.IS_A,
  RelationshipType.PART_OF,
  RelationshipType.RELATED_TO,
];

export default async function EntityRelationshipsPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const { slug } = await params;

  const entity = await prisma.entity.findUnique({
    where: { slug },
    include: {
      outgoingRelationships: { include: { targetEntity: true } },
      incomingRelationships: { include: { sourceEntity: true } },
    },
  });

  if (!entity) notFound();

  async function addRelationship(formData: FormData) {
    "use server";

    const relationshipType = String(
      formData.get("relationshipType") ?? "RELATED_TO"
    ).trim();
    const targetSlug = String(formData.get("targetSlug") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!targetSlug) return;
    if (!isRelationshipType(relationshipType)) return;

    const target = await prisma.entity.findUnique({ where: { slug: targetSlug } });
    if (!target) return;
    if (!entity) return;
    if (!isRelationshipAllowed(relationshipType, entity.type, target.type)) return;

    await prisma.relationship.create({
      data: {
        type: relationshipType,
        sourceEntityId: entity.id,
        targetEntityId: target.id,
        notes: notes || null,
      },
    });

    revalidatePath(`/entities/${entity.slug}`);
    revalidatePath(`/entities/${entity.slug}/relationships`);
    redirect(`/entities/${entity.slug}/relationships`);
  }

  async function removeRelationship(formData: FormData) {
    "use server";
    if (!entity) return;

    const relationshipId = String(formData.get("relationshipId") ?? "").trim();
    if (!relationshipId) return;

    await prisma.relationship.delete({
      where: { id: relationshipId },
    });

    revalidatePath(`/entities/${entity.slug}`);
    revalidatePath(`/entities/${entity.slug}/relationships`);
    redirect(`/entities/${entity.slug}/relationships`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="ms-panel">
            <p className="text-sm text-muted-foreground">{t(locale, "relationships")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{entity.title}</h1>
            <div className="mt-4 flex gap-3">
              <Link href={`/entities/${entity.slug}`} className="text-sm underline">
                {t(locale, "backToEntity")}
              </Link>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="ms-panel">
            <h2 className="text-lg font-semibold">{t(locale, "addRelationship")}</h2>
            <form action={addRelationship} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium">{t(locale, "relationshipType")}</span>
                  <select
                    name="relationshipType"
                    defaultValue="RELATED_TO"
                    className="ms-input"
                  >
                    {relationshipOptions.map((option) => (
                      <option key={option} value={option}>
                        {getRelationshipLabel(option, locale, "outgoing")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">{t(locale, "targetEntitySlug")}</span>
                  <input
                    name="targetSlug"
                    className="ms-input"
                    placeholder={locale === "ar" ? "معرف-العنصر-الهدف" : "the-target-entity"}
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium">{t(locale, "notes")}</span>
                <textarea
                  name="notes"
                  rows={3}
                  className="ms-textarea"
                  placeholder={t(locale, "optionalRelationshipContext")}
                />
              </label>

              <div className="flex justify-end">
                <button type="submit" className="ms-button">
                  {t(locale, "addRelationship")}
                </button>
              </div>
            </form>
          </section>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal delay={0.12}>
            <section className="ms-panel">
              <h2 className="text-lg font-semibold">{t(locale, "outgoing")}</h2>
              <div className="mt-4 space-y-3">
                {entity.outgoingRelationships.length > 0 ? (
                  entity.outgoingRelationships.map((relationship, index) => (
                    <Reveal key={relationship.id} delay={index * 0.03}>
                      <div className="rounded-xl border border-border p-4 transition hover:bg-accent">
                        <Link href={`/entities/${relationship.targetEntity.slug}`}>
                          <p className="font-medium">{relationship.targetEntity.title}</p>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {getRelationshipLabel(relationship.type, locale, "outgoing")}
                        </p>
                        {relationship.notes ? (
                          <p className="mt-1 text-sm text-muted-foreground">{relationship.notes}</p>
                        ) : null}

                        <form action={removeRelationship} className="mt-3">
                          <input type="hidden" name="relationshipId" value={relationship.id} />
                          <button type="submit" className="text-sm text-red-500 underline">
                            {t(locale, "remove")}
                          </button>
                        </form>
                      </div>
                    </Reveal>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar"
                      ? "لا توجد علاقات صادرة بعد."
                      : "No outgoing relationships yet."}
                  </p>
                )}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.18}>
            <section className="ms-panel">
              <h2 className="text-lg font-semibold">{t(locale, "incoming")}</h2>
              <div className="mt-4 space-y-3">
                {entity.incomingRelationships.length > 0 ? (
                  entity.incomingRelationships.map((relationship, index) => (
                    <Reveal key={relationship.id} delay={index * 0.03}>
                      <div className="rounded-xl border border-border p-4 transition hover:bg-accent">
                        <Link href={`/entities/${relationship.sourceEntity.slug}`}>
                          <p className="font-medium">{relationship.sourceEntity.title}</p>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {getRelationshipLabel(relationship.type, locale, "incoming")}
                        </p>
                        {relationship.notes ? (
                          <p className="mt-1 text-sm text-muted-foreground">{relationship.notes}</p>
                        ) : null}

                        <form action={removeRelationship} className="mt-3">
                          <input type="hidden" name="relationshipId" value={relationship.id} />
                          <button type="submit" className="text-sm text-red-500 underline">
                            {t(locale, "remove")}
                          </button>
                        </form>
                      </div>
                    </Reveal>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar"
                      ? "لا توجد علاقات واردة بعد."
                      : "No incoming relationships yet."}
                  </p>
                )}
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
