"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { Reveal } from "@/components/reveal";
import { EntityMediaFrame } from "@/components/entity-media-frame";

const DEFAULT_VISIBLE_ITEMS = 6;
type BrowseEntityType =
  | "CHARACTER"
  | "STORY"
  | "INSTITUTION"
  | "LOCATION"
  | "DOCTRINE"
  | "EVENT"
  | "TERM"
  | "ARTIFACT"
  | "OTHER";

type BrowseEntity = {
  id: string;
  title: string;
  slug: string;
  type: BrowseEntityType;
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
      width?: number | null;
      height?: number | null;
    };
  }>;
};

type BrowseSection = {
  type: BrowseEntityType;
  label: string;
  itemsLabel: string;
  emptyLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
  items: BrowseEntity[];
};

function hasExternalLinks(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false;

  const value = metadata as Record<string, unknown>;
  const links = value.externalLinks;

  if (!links || typeof links !== "object") return false;

  const record = links as Record<string, unknown>;
  return typeof record.wattpad === "string" || typeof record.ao3 === "string";
}

function getPrimaryMedia(entity: BrowseEntity) {
  return (
    entity.mediaLinks.find((link) => link.primary)?.mediaAsset ??
    entity.mediaLinks[0]?.mediaAsset ??
    null
  );
}

function getPrimaryMediaRole(entity: BrowseEntity) {
  return entity.mediaLinks.find((link) => link.primary)?.role ?? entity.mediaLinks[0]?.role ?? null;
}

function getMediaRoleLabel(locale: string, role: string | null) {
  if (!role) return null;

  switch (role) {
    case "PORTRAIT":
      return locale === "ar" ? "صورة شخصية" : "Portrait";
    case "COVER":
      return locale === "ar" ? "غلاف" : "Cover";
    case "ICON":
      return locale === "ar" ? "أيقونة" : "Icon";
    case "EMBLEM":
      return locale === "ar" ? "شعار" : "Emblem";
    case "SCENE":
      return locale === "ar" ? "مشهد" : "Scene";
    case "TIMELINE_ART":
      return locale === "ar" ? "فن زمني" : "Timeline art";
    case "THUMBNAIL":
      return locale === "ar" ? "مصغّر" : "Thumbnail";
    case "GALLERY":
      return locale === "ar" ? "معرض" : "Gallery";
    default:
      return locale === "ar" ? "وسائط" : "Media";
  }
}

export function BrowseSections({
  locale,
  sections,
}: {
  locale: string;
  sections: BrowseSection[];
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <section className="space-y-8">
      {sections.map((section) => {
        const isExpanded = expanded[section.type] ?? false;
        const visibleItems = isExpanded
          ? section.items
          : section.items.slice(0, DEFAULT_VISIBLE_ITEMS);
        const hiddenCount = Math.max(section.items.length - DEFAULT_VISIBLE_ITEMS, 0);

        return (
          <div
            key={section.type}
            id={`browse-${section.type.toLowerCase()}`}
            className="ms-panel scroll-mt-24 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{section.label}</h2>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {section.items.length} {section.itemsLabel}
                </span>
              </div>

              {hiddenCount > 0 ? (
                <button
                  type="button"
                  className="ms-button-ghost"
                  onClick={() => {
                    startTransition(() => {
                      setExpanded((current) => ({
                        ...current,
                        [section.type]: !isExpanded,
                      }));
                    });
                  }}
                >
                  {isExpanded ? section.showLessLabel : section.showMoreLabel}
                </button>
              ) : null}
            </div>

            {section.items.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {visibleItems.map((item, itemIndex) => {
                  const storyHasExternalLinks =
                    item.type === "STORY" && hasExternalLinks(item.metadata);
                  const primaryMedia = getPrimaryMedia(item);
                  const primaryMediaRole = getPrimaryMediaRole(item);
                  const mediaRoleLabel = getMediaRoleLabel(locale, primaryMediaRole);

                  return (
                    <Reveal key={item.id} delay={itemIndex * 0.03}>
                      <Link
                        href={`/entities/${item.slug}`}
                        className="block overflow-hidden rounded-xl border border-border transition hover:bg-accent"
                      >
                        {primaryMedia && primaryMedia.type === "IMAGE" ? (
                          <EntityMediaFrame
                            src={primaryMedia.src}
                            alt={primaryMedia.alt || primaryMedia.title || item.title}
                            title={primaryMedia.title}
                            width={primaryMedia.width}
                            height={primaryMedia.height}
                          />
                        ) : null}

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">{item.title}</p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {primaryMedia && mediaRoleLabel ? (
                                  <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                                    {mediaRoleLabel}
                                  </span>
                                ) : null}

                                {storyHasExternalLinks ? (
                                  <>
                                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                                      {locale === "ar" ? "فصل معاينة" : "Preview chapter"}
                                    </span>
                                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                                      {locale === "ar" ? "قراءة خارجية" : "External reading"}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {item.summary ? (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {item.summary}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                {section.emptyLabel}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
