import { Suspense } from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = buildPageMetadata({
  title: "Connexion admin",
  description: "Connexion à la console d'administration XaalisPay.",
  noIndex: true,
});

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
