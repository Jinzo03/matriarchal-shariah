import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DeleteEntityPage({ params }: PageProps) {
  const { slug } = await params;

  const entity = await prisma.entity.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
    },
  });

  if (!entity) notFound();

  async function deleteEntity() {
    "use server";
  if (!entity) return;
    await prisma.entity.delete({
      where: { id: entity.id },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/browse");
    revalidatePath("/search");
    revalidatePath("/timeline");
    redirect("/browse");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8">
        <Reveal>
          <section className="rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Delete Entity</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{entity.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Type: {entity.type}</p>
            <div className="mt-4">
              <Link href={`/entities/${entity.slug}`} className="text-sm underline">
                Back to entity
              </Link>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="rounded-2xl border border-red-500/30 p-6 shadow-sm">
            <p className="text-sm text-red-500">
              This action is permanent. The entity will be removed from the universe.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use archive instead if you only want to hide it temporarily.
            </p>

            <form action={deleteEntity} className="mt-5">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-red-500 px-5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Permanently Delete
              </button>
            </form>
          </section>
        </Reveal>
      </div>
    </main>
  );
}