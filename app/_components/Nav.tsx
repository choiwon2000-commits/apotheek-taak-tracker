// app/_components/Nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../login/actions';
import { Icon } from './Icon';
import { Logo } from './Logo';

type NavLink = { href: string; label: string; icon: string };

const links: NavLink[] = [
  { href: '/', label: 'Kalender', icon: 'calendar_today' },
  { href: '/log', label: 'Werk loggen', icon: 'edit_note' },
  { href: '/admin', label: 'Beheer', icon: 'admin_panel_settings' },
];

export function Nav() {
  const pathname = usePathname();

  // Geen navigatie op de inlogpagina.
  if (pathname === '/login') return null;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Bovenbalk */}
      <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile shadow-sm md:px-margin-desktop">
        <Link href="/" className="flex items-center gap-sm">
          <Logo size={32} />
          <span className="text-headline-sm-mobile font-bold text-primary">
            Apotheek Marne
          </span>
        </Link>

        <div className="flex items-center gap-md">
          <nav className="hidden h-full items-center gap-sm md:flex">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? 'rounded-lg px-3 py-2 text-label-md font-bold text-primary border-b-2 border-primary'
                      : 'rounded-lg px-3 py-2 text-label-md text-secondary transition-colors hover:bg-surface-container-high'
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <form action={logout}>
            <button
              type="submit"
              title="Uitloggen"
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high"
            >
              <Icon name="logout" />
            </button>
          </form>
        </div>
      </header>

      {/* Onderbalk (mobiel) */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-sm shadow-sm md:hidden">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? 'flex flex-col items-center gap-1 rounded-xl bg-primary-container px-4 py-1.5 text-on-primary-container transition-transform active:scale-95'
                  : 'flex flex-col items-center gap-1 px-4 py-1.5 text-secondary transition-colors active:scale-95'
              }
            >
              <Icon name={link.icon} filled={active} />
              <span className="text-label-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
