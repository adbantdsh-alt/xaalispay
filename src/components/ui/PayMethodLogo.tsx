export function PayMethodLogo({
  method,
  className = "",
}: {
  method: "wave" | "orange";
  className?: string;
}) {
  if (method === "wave") {
    return (
      <svg
        className={className}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        role="presentation"
      >
        <rect width="48" height="48" rx="12" fill="#3DD5FF" />
        <ellipse cx="24" cy="31" rx="11" ry="10" fill="#111" />
        <ellipse cx="24" cy="33" rx="7" ry="7.5" fill="#fff" />
        <circle cx="24" cy="19" r="10" fill="#111" />
        <circle cx="20.5" cy="18" r="2" fill="#fff" />
        <circle cx="27.5" cy="18" r="2" fill="#fff" />
        <path d="M24 21 L28 24 L24 27 L20 24 Z" fill="#FF7900" />
        <ellipse cx="17" cy="28" rx="4" ry="6" fill="#111" transform="rotate(-20 17 28)" />
        <ellipse cx="31" cy="26" rx="4" ry="5" fill="#111" transform="rotate(25 31 26)" />
        <ellipse cx="20" cy="40" rx="3" ry="2" fill="#FF7900" />
        <ellipse cx="28" cy="40" rx="3" ry="2" fill="#FF7900" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <rect width="48" height="48" rx="12" fill="#FF7900" />
      <path
        d="M30 14 L18 34 L22 34 L16 38 L26 22 L22 22 Z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
