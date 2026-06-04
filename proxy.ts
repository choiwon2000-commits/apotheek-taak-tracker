// proxy.ts
// In Next.js 16 is `middleware` hernoemd naar `proxy` (draait standaard op
// Node.js). Dit beschermt elke pagina: zonder geldige inlogcookie wordt de
// bezoeker naar /login gestuurd.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, expectedToken, isConfigured } from '@/utils/auth';

export async function proxy(request: NextRequest) {
  // Alleen doorlaten als er een wachtwoord is ingesteld én de cookie klopt.
  // Ontbreekt APP_PASSWORD, dan komt niemand binnen (fail-closed).
  if (isConfigured()) {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (token && token === (await expectedToken())) {
      return NextResponse.next();
    }
  }

  const loginUrl = new URL('/login', request.url);
  // Onthoud waar de bezoeker heen wilde, zodat we na het inloggen terugkeren.
  const { pathname, search } = request.nextUrl;
  if (pathname !== '/') {
    loginUrl.searchParams.set('from', pathname + search);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Draai overal behalve op de inlogpagina zelf, statische bestanden en
  // metadata. Server Functions posten naar hun eigen route en vallen dus
  // ook onder deze bescherming.
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};
