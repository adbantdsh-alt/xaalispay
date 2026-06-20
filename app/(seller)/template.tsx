"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

/** Anime uniquement le contenu de page — header et bottom-nav vivent dans
 * SellerShellClient, au-dessus de ce template, donc restent stables d'une
 * navigation à l'autre. mode="wait" évite le chevauchement ancien/nouveau ;
 * initial={false} évite un fade-in au premier chargement. */
export default function SellerTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
