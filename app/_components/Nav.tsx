// app/_components/Nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../login/actions';

const links = [
  { href: '/', label: 'Calendar' },
  { href: '/log', label: 'Log work' },
  { href: '/admin', label: 'Admin' },
];

// Recreation of the Apotheek Marne mark: a cluster of overlapping
// brand-coloured dots. Swap for <Image src="/logo.png" …/> if you add
// the original asset to /public.
function LogoMark() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 40 40"
      role="img"
      aria-label="Apotheek Marne"
      className="shrink-0"
    >
      <g stroke="#ffffff" strokeWidth="1.5">
        <circle cx="24.5" cy="12.2" r="6" fill="#f59e0b" />
        <circle cx="15.5" cy="12.2" r="6" fill="#fb923c" />
        <circle cx="29" cy="20" r="6" fill="#14b8a6" />
        <circle cx="11" cy="20" r="6" fill="#ec4899" />
        <circle cx="24.5" cy="27.8" r="6" fill="#3b82f6" />
        <circle cx="15.5" cy="27.8" r="6" fill="#8b5cf6" />
        <circle cx="20" cy="20" r="6" fill="#22c55e" />
      </g>
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();

  // Geen navigatie op de inlogpagina.
  if (pathname === '/login') return null;

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-blue-900">
              Apotheek Marne
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Pharmacy Task Tracker
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? 'rounded-md bg-teal-50 px-3 py-1.5 font-medium text-teal-700'
                    : 'rounded-md px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'
                }
              >
                {link.label}
              </Link>
            );
          })}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
