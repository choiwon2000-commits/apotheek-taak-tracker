// app/_components/Logo.tsx
// Het Apotheek Marne-merklogo (public/icon_transparant.png).
import Image from 'next/image';

export function Logo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/icon_transparant.png"
      alt="Apotheek Marne"
      width={size}
      height={size}
      priority
      unoptimized
      className={className}
    />
  );
}
