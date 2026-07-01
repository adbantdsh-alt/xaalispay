export function XaalisIcon({
  size = 32,
  className = "brand-icon-img",
  light = false,
}: {
  size?: number;
  className?: string;
  light?: boolean;
}) {
  return (
    <img
      src={light ? "/branding/xaalis-mark-light.png" : "/branding/xaalis-mark.png"}
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      draggable={false}
    />
  );
}
