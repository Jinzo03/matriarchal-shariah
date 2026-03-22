"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, Sparkles, Orbit } from "lucide-react";


const chips = ["Connected lore", "Creator workspace", "Universe graph"];

const cardItems = [
  {
    title: "Create",
    text: "Add characters, stories, institutions, and concepts.",
  },
  {
    title: "Connect",
    text: "Link every part of the universe into a coherent graph.",
  },
  {
    title: "Preserve",
    text: "Keep revisions, archives, and exports ready for the future.",
  },
];

const floaters = [
  { className: "left-[10%] top-[16%] h-56 w-56" },
  { className: "left-[82%] top-[14%] h-44 w-44" },
  { className: "left-[76%] top-[76%] h-64 w-64" },
  { className: "left-[18%] top-[78%] h-36 w-36" },
];

export default function SplashPage() {
  const reduceMotion = useReducedMotion();

  const pageVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.12,
      },
    },
  };

  const riseVariants = {
    hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_26%),radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_52%)]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={reduceMotion ? undefined : { opacity: [0.55, 0.85, 0.55] }}
        transition={reduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {floaters.map((floater, i) => (
          <motion.div
            key={i}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl ${floater.className}`}
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -18, 0],
                    x: [0, 10, 0],
                    scale: [1, 1.05, 1],
                  }
            }
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6"
        variants={pageVariants}
        initial="hidden"
        animate="show"
      >
        <motion.header
          variants={riseVariants}
          className="flex items-center justify-between rounded-full border border-border/60 bg-background/60 px-5 py-3 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium tracking-wide">Matriarchal Shari&apos;ah</p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
          >
            Enter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.header>

        <section className="grid flex-1 items-center gap-14 py-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div variants={pageVariants} className="space-y-8">
            <motion.div
              variants={riseVariants}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-4 py-2 text-xs text-muted-foreground backdrop-blur-md"
            >
              <Orbit className="h-3.5 w-3.5" />
              A living universe interface
            </motion.div>

            <motion.div variants={pageVariants} className="space-y-5">
              <motion.h1
                variants={riseVariants}
                className="max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl"
              >
                Build a world that remembers itself.
              </motion.h1>
              <motion.p
                variants={riseVariants}
                className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg"
              >
                Create, connect, and navigate your canon through a calm, elegant system designed for lore,
                structure, and long-term growth.
              </motion.p>
            </motion.div>

            <motion.div variants={riseVariants} className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/browse"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-border px-6 text-sm font-medium transition hover:bg-accent"
              >
                Browse Universe
              </Link>
            </motion.div>

            <motion.div variants={riseVariants} className="flex flex-wrap gap-3 pt-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-border/70 bg-background/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur-md"
                >
                  {chip}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div variants={riseVariants} className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-background/70 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Universe at a glance</p>
                  <p className="mt-1 text-2xl font-semibold">Connected, searchable, alive</p>
                </div>
                <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  V1
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {cardItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="rounded-2xl border border-border bg-background/80 p-4"
                    variants={riseVariants}
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                variants={riseVariants}
                className="mt-6 rounded-3xl border border-border bg-foreground p-5 text-background"
              >
                <p className="text-sm/6 text-background/75">A calm threshold before the workspace</p>
                <p className="mt-2 text-xl font-semibold tracking-tight">Step inside when you are ready.</p>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </motion.div>
    </main>
  );
}
