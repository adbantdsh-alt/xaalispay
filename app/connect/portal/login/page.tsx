import { Suspense } from "react";
import { PortalLoginForm } from "@/components/connect-portal/PortalLoginForm";

export default function ConnectPortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm />
    </Suspense>
  );
}
