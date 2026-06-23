"use client";

export function ToggleSwitch({
  checked,
  onClick,
  disabled = false,
  label,
}: {
  checked: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`toggle-switch ${checked ? "toggle-switch-on" : ""}`}
    >
      <span className="toggle-switch-thumb" />
    </button>
  );
}
