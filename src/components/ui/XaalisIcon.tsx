const ICON_SRC = "/branding/xaalis-icon.png";

export function XaalisIcon({
  size = 32,
  className = "brand-icon-img",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={ICON_SRC}
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      draggable={false}
    />
  );
}
