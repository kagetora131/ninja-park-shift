interface ShurikenIconProps {
  size?: number;
  className?: string;
  color?: string;
}

export function ShurikenIcon({ size = 20, className = '', color = 'var(--color-gold)' }: ShurikenIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <path
        d="M12 2 L14 9 L21 6 L15 12 L21 18 L14 15 L12 22 L10 15 L3 18 L9 12 L3 6 L10 9 Z"
        fill={color}
        stroke="var(--color-void)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.6" fill="var(--color-void)" />
    </svg>
  );
}
