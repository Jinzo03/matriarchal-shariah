import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EntityType } from "@/generated/prisma/client";
import { SHOW_ADMIN_UI } from "@/lib/app-flags";
import { getRequestLocale } from "@/lib/locale.server";
import { Reveal } from "@/components/reveal";
import { BrowseSections } from "@/components/browse-sections";

export const dynamic = "force-dynamic";

const typeOrder: EntityType[] = [
  EntityType.CHARACTER,
  EntityType.STORY,
  EntityType.INSTITUTION,
  EntityType.LOCATION,
  EntityType.DOCTRINE,
  EntityType.EVENT,
  EntityType.TERM,
  EntityType.ARTIFACT,
  EntityType.OTHER,
];

const typeLabels: Record<EntityType, string> = {
  CHARACTER: "Characters",
  STORY: "Stories",
  INSTITUTION: "Institutions",
  LOCATION: "Locations",
  DOCTRINE: "Doctrines",
  EVENT: "Events",
  TERM: "Terms",
  ARTIFACT: "Artifacts",
  OTHER: "Other",
};

function getBrowseSectionId(type: EntityType) {
  return `browse-${type.toLowerCase()}`;
}

type BrowseEntity = {
  id: string;
  title: string;
  slug: string;
  type: EntityType;
  summary: string | null;
  metadata: unknown;
  mediaLinks: Array<{
    role: string;
    primary: boolean;
    sortOrder: number;
    mediaAsset: {
      src: string;
      alt: string | null;
      title: string;
      type: "IMAGE" | "VIDEO" | "AUDIO" | "OTHER";
      width: number | null;
      height: number | null;
    };
  }>;
};

export default async function BrowsePage() {
  const locale = await getRequestLocale();

  const entities = (await prisma.entity.findMany({
    orderBy: [{ type: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      summary: true,
      metadata: true,
      mediaLinks: {
        orderBy: [{ primary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          role: true,
          primary: true,
          sortOrder: true,
          mediaAsset: {
            select: {
              src: true,
              alt: true,
              title: true,
              type: true,
              width: true,
              height: true,
            },
          },
        },
      },
    },
  })) as BrowseEntity[];

  const grouped = typeOrder.reduce<Record<string, BrowseEntity[]>>((acc, type) => {
    acc[type] = entities.filter((entity) => entity.type === type);
    return acc;
  }, {});

  const browseSections = typeOrder.map((type) => {
    const items = grouped[type] ?? [];
    const typeLabel = typeLabels[type];
    const hiddenCount = Math.max(items.length - 6, 0);

    return {
      type,
      label: typeLabel,
      itemsLabel: locale === "ar" ? "عنصر" : "items",
      emptyLabel:
        locale === "ar"
          ? `لا توجد ${typeLabel.toLowerCase()} بعد.`
          : `No ${typeLabel.toLowerCase()} yet.`,
      showMoreLabel:
        locale === "ar" ? `عرض ${hiddenCount} أخرى` : `Show ${hiddenCount} more`,
      showLessLabel: locale === "ar" ? "عرض أقل" : "Show less",
      items,
    };
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section>
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "تصفح الكون" : "Browse Universe"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {locale === "ar" ? "كل العناصر" : "All Entities"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {locale === "ar"
                ? "استعرض الكون حسب النوع وافتح أي صفحة عنصر."
                : "Explore the universe by category and jump into any entity page."}
            </p>
          </section>
        </Reveal>

        {entities.length === 0 ? (
          <section className="ms-panel p-8 text-center">
            <h2 className="text-lg font-semibold">
              {locale === "ar" ? "لا يوجد شيء بعد" : "Nothing here yet"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "ar"
                ? "أنشئ أول عنصر لبدء بناء الكون."
                : SHOW_ADMIN_UI
                  ? "Create your first entity to begin building the universe."
                  : "No entities are available yet."}
            </p>
            {SHOW_ADMIN_UI ? (
              <div className="mt-5">
                <Link href="/create" className="ms-button">
                  {locale === "ar" ? "إنشاء أول عنصر" : "Create First Entity"}
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {typeOrder.map((type, index) => (
            <Reveal key={type} delay={index * 0.03}>
              <Link
                href={`#${getBrowseSectionId(type)}`}
                className="ms-panel-soft block p-4 transition hover:bg-accent"
              >
                <p className="text-sm text-muted-foreground">{typeLabels[type]}</p>
                <p className="mt-2 text-2xl font-semibold">{grouped[type]?.length ?? 0}</p>
              </Link>
            </Reveal>
          ))}
        </section>

        <BrowseSections locale={locale} sections={browseSections} />
      </div>
    </main>
  );
}
