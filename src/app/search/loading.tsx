export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <div className="h-6 w-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-xl bg-muted" />

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-11 w-32 animate-pulse rounded-xl bg-muted" />
        </div>

        <div className="h-80 animate-pulse rounded-2xl border border-border bg-muted/40" />
      </div>
    </main>
  );
}