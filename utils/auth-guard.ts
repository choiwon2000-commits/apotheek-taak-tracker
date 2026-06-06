// utils/auth-guard.ts
// Server-side auth-check voor gebruik IN server-acties en route handlers.
// Defense-in-depth: ook al beschermt proxy.ts de routes, elke muterende
// actie controleert hier zelf opnieuw of er een geldige sessie is.
import { cookies } from 'next/headers';
import { AUTH_COOKIE, expectedToken, isConfigured } from './auth';

export async function isAuthenticated(): Promise<boolean> {
  if (!isConfigured()) return false;
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  return !!token && token === (await expectedToken());
}
