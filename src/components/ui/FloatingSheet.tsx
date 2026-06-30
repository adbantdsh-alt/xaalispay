"use client";

import { Drawer } from "vaul";

/** Piège de focus, fermeture par Échap et geste de glissement pour fermer
 * viennent gratuitement de vaul (qui encapsule Radix Dialog) — voir le plan
 * d'amélioration UX/UI. Signature externe et classes CSS conservées à
 * l'identique pour ne rien changer côté appelants (OrderDetailSheet…). */
export function FloatingSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={(next) => !next && onClose()} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Content className="sheet-panel" aria-describedby={undefined}>
          <div className="sheet-panel-head">
            <Drawer.Handle className="sheet-handle" />
            <Drawer.Title className="sheet-panel-title">{title}</Drawer.Title>
            <Drawer.Close className="sheet-close" aria-label="Fermer">
              ×
            </Drawer.Close>
          </div>
          <div className="sheet-panel-body" data-vaul-no-drag>{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
