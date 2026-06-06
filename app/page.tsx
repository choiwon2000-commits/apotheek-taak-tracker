// app/page.tsx
import { createClient } from '@/utils/supabase/server';
import type { TaskWithCategory } from '@/utils/supabase/types';
import { CalendarClient } from './_components/CalendarClient';

// Logs change whenever staff submit on /log, so always read fresh.
export const dynamic = 'force-dynamic';

const MONTH_RE = /^\d{4}-\d{2}$/;

function currentMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Last calendar day of the given month, as 'YYYY-MM-DD'.
function lastDayOfMonth(monthISO: string): string {
  const [year, month] = monthISO.split('-').map(Number);
  const day = new Date(year, month, 0).getDate();
  return `${monthISO}-${String(day).padStart(2, '0')}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.month) ? params.month[0] : params.month;
  const month = requested && MONTH_RE.test(requested) ? requested : currentMonthISO();

  const start = `${month}-01`;
  const end = lastDayOfMonth(month);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, date, category_id, details, logged_by, created_at, category:categories(id, name, icon)',
    )
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  // Supabase types the joined relation loosely; the FK guarantees one category per task.
  const tasks = (data ?? []) as unknown as TaskWithCategory[];

  return (
    <main className="mx-auto max-w-5xl px-margin-mobile pb-28 pt-24 md:px-margin-desktop md:pb-12">
      <header className="mb-lg">
        <h1 className="text-display-lg text-on-surface">Mijn kalender</h1>
        <p className="mt-base text-body-md text-secondary">
          Overzicht van de gelogde taken. Kies een dag voor de details.
        </p>
      </header>

      {error && (
        <div className="mb-lg rounded-lg border border-error/30 bg-error-container px-md py-3 text-label-md text-on-error-container">
          Taken konden niet worden geladen: {error.message}
        </div>
      )}

      <CalendarClient monthISO={month} tasks={tasks} />
    </main>
  );
}
