"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/components/locale-provider";
import { t } from "@/lib/locale";

type AdminLink = {
  href: string;
  keyName: "dashboard" | "content" | "analytics" | "settings" | "logs" | "support" | "importExport";
  isActive: (pathname: string) => boolean;
};

const adminLinks: AdminLink[] = [
  { href: "/admin", keyName: "dashboard", isActive: (p) => p === "/admin" },
  { href: "/admin/content", keyName: "content", isActive: (p) => p.startsWith("/admin/content") },
  { href: "/admin/analytics", keyName: "analytics", isActive: (p) => p.startsWith("/admin/analytics") },
  { href: "/admin/settings", keyName: "settings", isActive: (p) => p.startsWith("/admin/settings") },
  { href: "/admin/logs", keyName: "logs", isActive: (p) => p.startsWith("/admin/logs") },
  { href: "/admin/support", keyName: "support", isActive: (p) => p.startsWith("/admin/support") },
  {
    href: "/admin/import-export",
    keyName: "importExport",
    isActive: (p) => p.startsWith("/admin/import-export"),
  },
];

export function AdminIndexNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { locale } = useLocale();

  return (
    <motion.nav
      className="flex flex-wrap gap-2"
      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {adminLinks.map((link, index) => {
        const isActive = link.isActive(pathname);

        return (
          <motion.div
            key={link.href}
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.03,
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
                  layoutId="admin-active-pill"
                  className="absolute inset-0 rounded-full bg-accent/80 shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              ) : null}
              <span className="relative z-10">{t(locale, link.keyName)}</span>
            </Link>
          </motion.div>
        );
      })}
    </motion.nav>
  );
}