"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ElementType, ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 16,
  className,
  once = true,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
} & Omit<HTMLMotionProps<"div">, "children" | "ref">) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  if (reduce) {
    const Tag = as as ElementType;
    return (
      <Tag className={className} {...(rest as Record<string, unknown>)}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
