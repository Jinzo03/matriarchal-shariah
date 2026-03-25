import { EntityType, RelationshipType } from "@/generated/prisma/client";
import type { Locale } from "@/lib/locale";

type Direction = "outgoing" | "incoming";

const allEntityTypes: EntityType[] = [
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

const nonStoryEntityTypes = allEntityTypes.filter((type) => type !== EntityType.STORY);

const relationshipLabels: Record<
  RelationshipType,
  {
    outgoing: { en: string; ar: string };
    incoming: { en: string; ar: string };
  }
> = {
  BELONGS_TO: {
    outgoing: { en: "Belongs to", ar: "ينتمي إلى" },
    incoming: { en: "Contains", ar: "يضم" },
  },
  APPEARS_IN: {
    outgoing: { en: "Appears in", ar: "يظهر في" },
    incoming: { en: "Features", ar: "يتضمن" },
  },
  LOCATED_IN: {
    outgoing: { en: "Located in", ar: "يقع في" },
    incoming: { en: "Contains", ar: "يحتوي على" },
  },
  RULES_OVER: {
    outgoing: { en: "Rules over", ar: "يحكم" },
    incoming: { en: "Ruled by", ar: "محكوم من" },
  },
  CREATED_BY: {
    outgoing: { en: "Created by", ar: "أنشأه" },
    incoming: { en: "Created", ar: "أنشأ" },
  },
  PRECEDES: {
    outgoing: { en: "Precedes", ar: "يسبق" },
    incoming: { en: "Follows", ar: "يتبع" },
  },
  FOLLOWS: {
    outgoing: { en: "Follows", ar: "يتبع" },
    incoming: { en: "Preceded by", ar: "يسبقه" },
  },
  OPPOSES: {
    outgoing: { en: "Opposes", ar: "يعارض" },
    incoming: { en: "Opposed by", ar: "مُعارَض من" },
  },
  SUPPORTS: {
    outgoing: { en: "Supports", ar: "يدعم" },
    incoming: { en: "Supported by", ar: "مدعوم من" },
  },
  REFERENCES: {
    outgoing: { en: "References", ar: "يشير إلى" },
    incoming: { en: "Referenced by", ar: "مشار إليه من" },
  },
  AFFILIATED_WITH: {
    outgoing: { en: "Affiliated with", ar: "منتسب إلى" },
    incoming: { en: "Affiliated with", ar: "منتسب إلى" },
  },
  IS_A: {
    outgoing: { en: "Is a", ar: "هو" },
    incoming: { en: "Includes", ar: "يتضمن" },
  },
  PART_OF: {
    outgoing: { en: "Part of", ar: "جزء من" },
    incoming: { en: "Has part", ar: "له جزء" },
  },
  RELATED_TO: {
    outgoing: { en: "Related to", ar: "مرتبط بـ" },
    incoming: { en: "Related to", ar: "مرتبط بـ" },
  },
};

const relationshipRules: Partial<
  Record<
    RelationshipType,
    {
      sources?: EntityType[];
      targets?: EntityType[];
    }
  >
> = {
  APPEARS_IN: {
    sources: nonStoryEntityTypes,
    targets: [EntityType.STORY],
  },
};

export function isRelationshipType(value: string): value is RelationshipType {
  return Object.values(RelationshipType).includes(value as RelationshipType);
}

export function isRelationshipAllowed(
  type: RelationshipType,
  sourceType: EntityType,
  targetType: EntityType
) {
  const rule = relationshipRules[type];

  if (!rule) {
    return true;
  }

  const sourceAllowed = rule.sources ? rule.sources.includes(sourceType) : true;
  const targetAllowed = rule.targets ? rule.targets.includes(targetType) : true;

  return sourceAllowed && targetAllowed;
}

export function getRelationshipLabel(
  type: RelationshipType,
  locale: Locale,
  direction: Direction = "outgoing"
) {
  return relationshipLabels[type][direction][locale];
}
