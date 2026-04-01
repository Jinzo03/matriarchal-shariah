import { prisma } from "@/lib/prisma";
import { EntityMediaFrame } from "@/components/entity-media-frame";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

type CreatorLink = {
  label: string;
  href: string;
  note: string;
};

type CreatorMedia = {
  id: string;
  title: string;
  summary: string | null;
  src: string;
  alt: string | null;
  width?: number;
  height?: number;
  tags: string[];
  metadata: unknown;
};
const ABOUT_ME_MEDIA_TAGS = ["about-me", "creator-media"];

const creatorLinks: CreatorLink[] = [
  {
    label: "X",
    href: "https://x.com/dommatriarch",
    note: "Short thoughts, updates, and whatever I feel like posting publicly.",
  },
  {
    label: "Wattpad",
    href: "https://www.wattpad.com/user/dommatriarch",
    note: "My serialized stories and drafts.",
  },
  {
    label: "AO3",
    href: "https://archiveofourown.org/users/dommatriarch",
    note: "Same as Wattpad but with more smut and content that might get me banned on other platforms.",
  },
];

const creatorNotes = [
  {
    title: "Who I Am",
    body:
      "I’m the one who’s obsessed with matriarchal power, the soft but absolute kind. I love writing worlds where women rule completely, where men submit beautifully, and where things like breastfeeding, obedience, and ritual sex become sacred instead of shameful.I spend my days coding this archive and my nights (and a lot of days too) writing the stories and building the lore. This project is where my coding brain and my filthy devotional brain finally get to fuck around together. I'm also into macrophilia so I LOVE giantesses a lot !",
  },
  {
    title: "What This Space Holds",
    body: [
    "Random thoughts and updates about the universe as I keep adding to it",
    "Behind-the-scenes shit about writing, worldbuilding, and coding this thing",
    "Whatever personal feelings or ideas I don't want to shove into canon" ,
    "Occasional unfiltered rambling when I feel like it",
    ]
  },
  {
    title: "What Comes Next",
    body:
      "More canon is coming, new Sheikhas, deeper doctrines, longer timeline stuff, all of it.I’ll start adding more images and media soon.And yeah… you’ll be seeing a lot more of my mascot (the girl from my X profile pic). I love her stupidly much and I use her expressions when I want to say something without saying it directly.",
  },
];

function normalizePlacement(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPlacementFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const value = metadata as Record<string, unknown>;
  const placement = value.aboutMePlacement;

  return typeof placement === "string" && placement.trim().length > 0
    ? normalizePlacement(placement)
    : null;
}

function getPlacementFromTags(tags: string[]) {
  const placementTag = tags.find((tag) => tag.startsWith("about-me:"));

  if (!placementTag) {
    return null;
  }

  return normalizePlacement(placementTag.replace("about-me:", ""));
}

function getMediaPlacement(media: CreatorMedia) {
  return (
    getPlacementFromMetadata(media.metadata) ??
    getPlacementFromTags(media.tags) ??
    "introduction"
  );
}

function getSectionPlacement(title: string) {
  return normalizePlacement(title);
}

function renderMediaGroup(items: CreatorMedia[]) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-5">
      {items.map((item) => (
        <div key={item.id}>
          <EntityMediaFrame
            src={item.src}
            alt={item.alt || item.title}
            title={item.title}
            width={item.width}
            height={item.height}
            variant="full"
          />
        </div>
      ))}
    </div>
  );
}

function renderNoteBody(body: string | string[]) {
  if (Array.isArray(body)) {
    return (
      <ul className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        {body.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-current/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>;
}

export default async function AboutMePage() {
  const creatorMedia: CreatorMedia[] = await prisma.mediaAsset.findMany({
    where: {
      type: "IMAGE",
      tags: {
        hasSome: ABOUT_ME_MEDIA_TAGS,
      },
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      summary: true,
      src: true,
      alt: true,
      width: true,
      height: true,
      tags: true,
      metadata: true,
    },
  });

  const mediaByPlacement = creatorMedia.reduce<Map<string, CreatorMedia[]>>((map, item) => {
    const placement = getMediaPlacement(item);
    const existing = map.get(placement) ?? [];
    existing.push(item);
    map.set(placement, existing);
    return map;
  }, new Map());

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <PageHeader
            eyebrow="About Me"
            title="About the Creator"
            description="A personal page for my own notes, links, media, and whatever I want to share outside the archive structure."
            framed={false}
          />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Reveal delay={0.08}>
            <section className="ms-panel p-6 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Introduction
              </p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-foreground/90">
                <p>
                  Hi there, I&apos;m the creator of this project. You can call me
                  {" "}&quot;dommatriarch,&quot; and it&apos;s also my handle on other social and
                  writing platforms, so no need to be shy. I don&apos;t bite!
                </p>
                <p>
                   I built this whole thing because I wanted one spot that feels personal instead of purely archival. Somewhere I can dump thoughts, updates, random brain rot, and whatever else is on my mind without forcing it into a character or story .
                </p>
              </div>
              {renderMediaGroup(mediaByPlacement.get("introduction") ?? [])}
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="ms-panel-soft p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Find Me
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {creatorLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-border bg-background/70 p-4 transition hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">{link.label}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        External
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{link.note}</p>
                  </a>
                ))}
              </div>
              {renderMediaGroup(mediaByPlacement.get("find-me") ?? [])}
            </section>
          </Reveal>

          <Reveal delay={0.16}>
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {creatorNotes.map((note) => (
                <article key={note.title} className="ms-panel p-5">
                  <h2 className="text-lg font-semibold tracking-tight">{note.title}</h2>
                  {renderNoteBody(note.body)}
                  {renderMediaGroup(mediaByPlacement.get(getSectionPlacement(note.title)) ?? [])}
                </article>
              ))}
            </section>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
