"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/components/locale-provider";
import { t } from "@/lib/locale";

type NavLink = {
  href: string;
  keyName: "dashboard" | "browse" | "search" | "create" | "timeline" | "admin";
  isActive: (pathname: string) => boolean;
};

const navLinks: NavLink[] = [
  { href: "/dashboard", keyName: "dashboard", isActive: (p) => p === "/dashboard" },
  { href: "/browse", keyName: "browse", isActive: (p) => p === "/browse" || p.startsWith("/entities") },
  { href: "/search", keyName: "search", isActive: (p) => p.startsWith("/search") },
  { href: "/create", keyName: "create", isActive: (p) => p.startsWith("/create") },
  { href: "/timeline", keyName: "timeline", isActive: (p) => p.startsWith("/timeline") },
  { href: "/admin", keyName: "admin", isActive: (p) => p.startsWith("/admin") },
];

export function SiteNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { locale } = useLocale();

  return (
    <motion.header
      className="border-b border-border/60 bg-background/55 backdrop-blur-xl"
      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Matriarchal Shari&apos;ah
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap items-center gap-2">
            {navLinks.map((link, index) => {
              const isActive = link.isActive(pathname);

              return (
                <motion.div
                  key={link.href}
                  initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.06 + index * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    className={[
                      "relative inline-flex items-center justify-center overflow-hidden rounded-full border px-4 py-2 text-sm transition",
                      isActive
                        ? "border-border/80 text-foreground"
                        : "border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground",
                    ].join(" ")}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="site-nav-active-pill"
                        className="absolute inset-0 rounded-full bg-accent/80 shadow-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    ) : null}
                    <span className="relative z-10">{t(locale, link.keyName)}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <LanguageToggle />
        </div>
      </div>
    </motion.header>
  );
}