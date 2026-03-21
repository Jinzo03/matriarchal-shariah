export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded-xl bg-muted" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted/40 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>
      </div>
    </main>
  );
}