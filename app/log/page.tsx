// app/log/page.tsx
import { createClient } from '@/utils/supabase/server';
import type { Category } from '@/utils/supabase/types';
import { LogClient } from './_components/LogClient';

// Categories can change in /admin, so always read them fresh.
export const dynamic = 'force-dynamic';

export default async function LogPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, created_at')
    .order('name', { ascending: true });

  const categories: Category[] = data ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Werk loggen
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Dagelijkse taken loggen
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Kies een datum, selecteer de taken die je hebt uitgevoerd en voeg
          eventueel details toe. Alles wordt opgeslagen in het logboek van die
          dag.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Categorieën konden niet worden geladen: {error.message}
        </div>
      )}

      {!error && categories.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-600">
            Nog geen categorieën. Voeg ze eerst toe in{' '}
            <a href="/admin" className="font-medium text-teal-700 underline">
              Admin
            </a>{' '}
            voordat je werk kunt loggen.
          </p>
        </div>
      ) : (
        <LogClient categories={categories} />
      )}
    </main>
  );
}
