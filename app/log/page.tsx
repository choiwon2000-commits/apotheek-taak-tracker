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
    .select('id, name, description, icon, created_at')
    .order('name', { ascending: true });

  const categories: Category[] = data ?? [];

  return (
    <main className="mx-auto max-w-2xl px-margin-mobile pb-28 pt-24 md:px-margin-desktop md:pb-12">
      <header className="mb-xl">
        <h1 className="text-display-lg text-on-surface">Werk loggen</h1>
        <p className="mt-base text-body-md text-secondary">
          Kies een datum, selecteer de taken die je hebt uitgevoerd en voeg
          eventueel details toe.
        </p>
      </header>

      {error && (
        <div className="mb-lg rounded-lg border border-error/30 bg-error-container px-md py-3 text-label-md text-on-error-container">
          Categorieën konden niet worden geladen: {error.message}
        </div>
      )}

      {!error && categories.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center shadow-sm">
          <p className="text-body-md text-secondary">
            Nog geen categorieën. Voeg ze eerst toe in{' '}
            <a href="/admin" className="font-medium text-primary underline">
              Beheer
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
