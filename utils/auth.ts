// utils/auth.ts
// Eenvoudige gedeelde-wachtwoordbeveiliging voor de hele app.
// Eén vast wachtwoord (instelbaar via de env-variabele APP_PASSWORD).

export const AUTH_COOKIE = 'pharma_auth';

// Het wachtwoord komt UITSLUITEND uit de omgevingsvariabele APP_PASSWORD en
// staat nooit in de broncode — zo lekt het niet naar Git/GitHub/Vercel.
// Stel APP_PASSWORD in:
//   - lokaal in .env.local (staat in .gitignore)
//   - online in de Environment Variables van je host (bijv. Vercel)
function rawPassword(): string {
  return process.env.APP_PASSWORD ?? '';
}

// Is de inlogcode op de server geconfigureerd? Zo niet, dan laten we niemand
// door (fail-closed) i.p.v. een gat open te laten.
export function isConfigured(): boolean {
  return rawPassword().length > 0;
}

export async function verifyPassword(input: string): Promise<boolean> {
  return isConfigured() && input === rawPassword();
}

// De cookiewaarde is de SHA-256-hash van het wachtwoord, niet het wachtwoord
// zelf. Zo staat de inlogcode nooit leesbaar in de browsercookie. Werkt zowel
// in de Node.js- als in de Edge-runtime (Web Crypto is in beide beschikbaar).
export async function expectedToken(): Promise<string> {
  const data = new TextEncoder().encode(`pharma-marne:${rawPassword()}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
