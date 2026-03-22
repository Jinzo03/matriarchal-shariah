"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.main
      className="min-h-screen bg-background text-foreground"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.08 }}
      >
        {children}
      </motion.div>
    </motion.main>
  );
}