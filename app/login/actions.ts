// app/login/actions.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AUTH_COOKIE,
  expectedToken,
  isConfigured,
  verifyPassword,
} from '@/utils/auth';

export type LoginState = { error: string } | null;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  const fromRaw = String(formData.get('from') ?? '/');
  // Alleen interne paden toestaan — voorkomt een open redirect.
  const from = fromRaw.startsWith('/') && !fromRaw.startsWith('//') ? fromRaw : '/';

  if (!isConfigured()) {
    return {
      error:
        'De inlogcode is nog niet ingesteld op de server (APP_PASSWORD ontbreekt).',
    };
  }
  if (!(await verifyPassword(password))) {
    return { error: 'Onjuiste inlogcode. Probeer het opnieuw.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, await expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dagen
  });

  // redirect() gooit intern — buiten de try/catch laten staan.
  redirect(from);
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect('/login');
}
