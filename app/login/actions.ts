// app/login/actions.ts
'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  AUTH_COOKIE,
  expectedToken,
  isConfigured,
  verifyPassword,
} from '@/utils/auth';

export type LoginState = { error: string } | null;

// ---- Eenvoudige in-memory rate limiting (brute-force-bescherming) ----
// Vergrendelt een IP na te veel mislukte pogingen binnen een tijdvenster.
// Let op: in-memory = per server-instantie. Voor gedistribueerde limiting
// over meerdere instanties is Upstash Redis aan te raden (zie toelichting).
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minuten
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minuten vergrendeld

type Bucket = { count: number; firstAt: number; lockedUntil: number };
const attempts = new Map<string, Bucket>();

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return h.get('x-real-ip') ?? 'unknown';
}

// Aantal minuten dat dit IP nog vergrendeld is (0 = niet vergrendeld).
function lockedMinutes(ip: string): number {
  const b = attempts.get(ip);
  if (!b) return 0;
  const left = b.lockedUntil - Date.now();
  return left > 0 ? Math.ceil(left / 60000) : 0;
}

function recordFailure(ip: string): number {
  const now = Date.now();
  let b = attempts.get(ip);
  if (!b || now - b.firstAt > WINDOW_MS) {
    b = { count: 0, firstAt: now, lockedUntil: 0 };
    attempts.set(ip, b);
  }
  b.count += 1;
  if (b.count >= MAX_ATTEMPTS) b.lockedUntil = now + LOCKOUT_MS;
  // Lichte opschoning om geheugengroei te voorkomen.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) {
      if (v.lockedUntil < now && now - v.firstAt > WINDOW_MS) attempts.delete(k);
    }
  }
  return MAX_ATTEMPTS - b.count; // resterende pogingen
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  const fromRaw = String(formData.get('from') ?? '/');
  // Alleen interne paden toestaan — voorkomt een open redirect.
  const from = fromRaw.startsWith('/') && !fromRaw.startsWith('//') ? fromRaw : '/';

  const ip = await clientIp();
  const locked = lockedMinutes(ip);
  if (locked > 0) {
    return {
      error: `Te veel mislukte pogingen. Probeer het over ${locked} minuten opnieuw.`,
    };
  }

  if (!isConfigured()) {
    return {
      error:
        'De inlogcode is nog niet ingesteld op de server (APP_PASSWORD ontbreekt).',
    };
  }
  if (!(await verifyPassword(password))) {
    const remaining = recordFailure(ip);
    if (remaining <= 0) {
      return {
        error: `Te veel mislukte pogingen. Account ${Math.ceil(
          LOCKOUT_MS / 60000,
        )} minuten vergrendeld.`,
      };
    }
    return {
      error: `Onjuiste inlogcode. Nog ${remaining} ${
        remaining === 1 ? 'poging' : 'pogingen'
      } over.`,
    };
  }

  // Geslaagd — teller resetten.
  attempts.delete(ip);

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
