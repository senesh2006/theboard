"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeOut, fadeDown, fadeUp } from "@/lib/motion";

type PageShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageShell({ title, description, children, actions }: PageShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.div
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={fadeDown}
        transition={easeOut}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </motion.div>
      <motion.div
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={fadeUp}
        transition={{ ...easeOut, delay: reduceMotion ? 0 : 0.08 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
