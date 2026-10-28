"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
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
  // Toujours le même composant motion, y compris en « mouvement réduit » :
  // rendre un <Tag> brut à la place cassait l'hydratation (le HTML serveur
  // porte déjà opacity:0, que React ne corrige pas) — sections invisibles.
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

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
