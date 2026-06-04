// app/login/page.tsx
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
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md items-center px-4">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Apotheek Marne
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Inloggen
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Voer de inlogcode in om de takenlijst te bekijken en bij te werken.
          </p>
        </header>

        <LoginForm from={from} />
      </div>
    </main>
  );
}
