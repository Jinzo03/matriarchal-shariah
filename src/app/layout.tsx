import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matriarchal Shari'ah",
  description: "Connected universe dashboard for lore, stories, and navigation.",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/create", label: "Create" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="border-b border-border/60">
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Matriarchal Shari&apos;ah
            </Link>
            <nav className="flex flex-wrap items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-border px-4 py-2 text-sm transition hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </header>
        </div>
        {children}
      </body>
    </html>
  );
}
