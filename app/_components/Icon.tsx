// app/_components/Icon.tsx
// Gedeelde Material Symbols-icooncomponent (server- en client-veilig).
import type { CSSProperties } from 'react';

export function Icon({
  name,
  className,
  filled,
  style,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`material-symbols-outlined${filled ? ' filled' : ''}${
        className ? ` ${className}` : ''
      }`}
      style={style}
      aria-hidden
    >
      {name}
    </span>
  );
}
