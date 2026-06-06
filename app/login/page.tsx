// app/login/page.tsx
import { Icon } from '../_components/Icon';
import { Logo } from '../_components/Logo';
import { LoginForm } from './_components/LoginForm';

export const metadata = {
  title: 'Inloggen — Apotheek Marne',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.from) ? params.from[0] : params.from;
  const from = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[28rem] flex-col justify-center px-4 py-10">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm md:p-xl">
          {/* Logo & titel */}
          <div className="mb-xl flex flex-col items-center">
            <Logo size={80} className="mb-md" />
            <h1 className="text-center text-headline-md text-on-surface">
              Apotheek Marne
            </h1>
            <p className="mt-xs text-label-md text-secondary">
              Personeelsportaal
            </p>
          </div>

          <LoginForm from={from} />

          <div className="mt-xl border-t border-outline-variant pt-lg text-center">
            <p className="text-label-sm text-secondary">
              Hulp nodig bij het inloggen? Neem contact op met de beheerder.
            </p>
          </div>
        </div>

        {/* Vertrouwens-elementen */}
        <div className="mt-lg flex justify-center gap-xl opacity-40">
          <div className="flex items-center gap-xs">
            <Icon name="verified_user" className="text-secondary" style={{ fontSize: 16 }} />
            <span className="text-label-sm text-secondary">
              Beveiligde verbinding
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
