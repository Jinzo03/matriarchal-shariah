export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <div className="h-6 w-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-72 animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-xl bg-muted" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>

        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-56 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-56 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>
      </div>
    </main>
  );
}