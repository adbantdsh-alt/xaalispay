export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "brand-sm", md: "brand-md", lg: "brand-lg" };
  return (
    <div className={`brand-mark ${sizes[size]}`}>
      <span className="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="10" fill="url(#xpGrad)" />
          <path
            d="M9 16.5L14 21.5L23 11.5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="xpGrad" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#1a4fd6" />
              <stop offset="1" stopColor="#0F1F66" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="brand-name">XaalisPay</span>
    </div>
  );
}
