export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <div className="h-6 w-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-80 animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-xl bg-muted" />

        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-20 animate-pulse rounded-xl bg-muted" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted/40 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>
      </div>
    </main>
  );
}