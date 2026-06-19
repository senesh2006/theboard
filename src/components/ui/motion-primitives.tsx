"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { easeOut, fadeUp, staggerContainer } from "@/lib/motion";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article";
};

export function FadeIn({ children, className, delay = 0, as = "div" }: FadeInProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={fadeUp}
      transition={{ ...easeOut, delay }}
      className={className}
    >
      {children}
    </Component>
  );
}

type StaggerGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function StaggerGrid({ children, className }: StaggerGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={reduceMotion ? undefined : fadeUp}
      transition={easeOut}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
