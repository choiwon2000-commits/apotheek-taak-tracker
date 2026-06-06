// app/log/page.tsx
import { createClient } from '@/utils/supabase/server';
import type { Category, Person } from '@/utils/supabase/types';
import { LogClient } from './_components/LogClient';

// Categories/people can change in /admin, so always read them fresh.
export const dynamic = 'force-dynamic';

export default async function LogPage() {
  const supabase = await createClient();
  const [catRes, peopleRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, description, icon, barcode, created_at')
      .order('name', { ascending: true }),
    supabase
      .from('people')
      .select('id, name, created_at')
      .order('name', { ascending: true }),
  ]);

  const categories: Category[] = catRes.data ?? [];
  const people: Person[] = peopleRes.data ?? [];
  const error = catRes.error ?? peopleRes.error;

  return (
    <main className="mx-auto max-w-2xl px-margin-mobile pb-28 pt-24 md:px-margin-desktop md:pb-12">
      <header className="mb-xl">
        <h1 className="text-display-lg text-on-surface">Werk loggen</h1>
        <p className="mt-base text-body-md text-secondary">
          Kies de datum en persoon, en selecteer of scan de taken die zijn
          uitgevoerd.
        </p>
      </header>

      {error && (
        <div className="mb-lg rounded-lg border border-error/30 bg-error-container px-md py-3 text-label-md text-on-error-container">
          Gegevens konden niet worden geladen: {error.message}
        </div>
      )}

      {!error && categories.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center shadow-sm">
          <p className="text-body-md text-secondary">
            Nog geen taken. Voeg ze eerst toe in{' '}
            <a href="/admin" className="font-medium text-primary underline">
              Beheer
            </a>{' '}
            voordat je werk kunt loggen.
          </p>
        </div>
      ) : (
        <LogClient categories={categories} people={people} />
      )}
    </main>
  );
}
