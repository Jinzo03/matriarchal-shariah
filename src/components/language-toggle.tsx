"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/components/locale-provider";
import { t } from "@/lib/locale";

export function LanguageToggle() {
  const reduceMotion = useReducedMotion();
  const { locale, toggleLocale } = useLocale();

  return (
    <motion.button
      type="button"
      onClick={toggleLocale}
      whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="ms-button-ghost text-xs"
      aria-label={locale === "en" ? "Switch to Arabic" : "Switch to English"}
      title={locale === "en" ? "Switch to Arabic" : "Switch to English"}
    >
      {t(locale, "language")}
    </motion.button>
  );
}