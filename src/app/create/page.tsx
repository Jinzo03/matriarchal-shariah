import Link from "next/link";
import { EntityType } from "@/generated/prisma/client";

export default function CreateIndexPage() {
  const createOptions = [
    { label: "Character", href: "/create/character", type: EntityType.CHARACTER },
    { label: "Story", href: "/create/story", type: EntityType.STORY },
    { label: "Institution", href: "/create/institution", type: EntityType.INSTITUTION },
    { label: "Location", href: "/create/location", type: EntityType.LOCATION },
    { label: "Doctrine", href: "/create/doctrine", type: EntityType.DOCTRINE },
    { label: "Event", href: "/create/event", type: EntityType.EVENT },
    { label: "Term", href: "/create/term", type: EntityType.TERM },
    { label: "Artifact", href: "/create/artifact", type: EntityType.ARTIFACT },
    { label: "Other", href: "/create/other", type: EntityType.OTHER },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <section>
          <p className="text-sm text-muted-foreground">Create</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose a type</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Select what kind of entity you want to create in the universe.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {createOptions.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="rounded-2xl border border-border p-5 shadow-sm transition hover:bg-accent"
            >
              <p className="text-lg font-semibold">{option.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">Create a new {option.label.toLowerCase()}.</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
