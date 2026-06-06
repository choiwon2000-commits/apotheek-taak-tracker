// app/admin/page.tsx
import { createClient } from '@/utils/supabase/server';
import type { Category, Person } from '@/utils/supabase/types';
import { AdminClient } from './_components/AdminClient';

// Always fetch fresh categories — they change rarely but we want
// admin actions to reflect immediately.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
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
    <main className="mx-auto max-w-5xl px-margin-mobile pb-28 pt-24 md:px-margin-desktop md:pb-12">
      <header className="mb-xl">
        <h1 className="text-display-lg text-on-surface">Beheer</h1>
        <p className="mt-base text-body-md text-secondary">
          Beheer de taakcategorieën die het personeel dagelijks kan loggen. Een
          categorie verwijderen wist ook alle gelogde taken die deze gebruikten.
        </p>
      </header>

      {error && (
        <div className="mb-lg rounded-lg border border-error/30 bg-error-container px-md py-3 text-label-md text-on-error-container">
          Gegevens konden niet worden geladen: {error.message}
        </div>
      )}

      <AdminClient initialCategories={categories} initialPeople={people} />
    </main>
  );
}