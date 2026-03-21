import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">404</p>
          <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            The page you tried to open does not exist in this universe.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}