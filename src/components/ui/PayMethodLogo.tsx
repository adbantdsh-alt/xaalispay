export function PayMethodLogo({ method }: { method: "wave" | "orange" }) {
  if (method === "wave") {
    return (
      <svg className="pay-method-logo" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="20" fill="#00D4FF" />
        <path
          d="M12 20c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8"
          stroke="#0F1F66"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="3" fill="#0F1F66" />
      </svg>
    );
  }
  return (
    <svg className="pay-method-logo" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#FF6600" />
      <path d="M20 11v18M11 20h18" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
