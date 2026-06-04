// app/admin/page.tsx
import { createClient } from '@/utils/supabase/server';
import type { Category } from '@/utils/supabase/types';
import { AdminClient } from './_components/AdminClient';

// Always fetch fresh categories — they change rarely but we want
// admin actions to reflect immediately.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
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
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Manage categories
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Add or remove the task types staff can log each day. Deleting a
          category also removes every logged task that used it.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load categories: {error.message}
        </div>
      )}

      <AdminClient initialCategories={categories} />
    </main>
  );
}