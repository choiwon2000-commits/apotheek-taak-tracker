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
    .select('id, date, category_id, details, created_at, category:categories(id, name)')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  // Supabase types the joined relation loosely; the FK guarantees one category per task.
  const tasks = (data ?? []) as unknown as TaskWithCategory[];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Calendar
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Task overview
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          A month-by-month view of logged tasks. Select a day to see its details.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load tasks: {error.message}
        </div>
      )}

      <CalendarClient monthISO={month} tasks={tasks} />
    </main>
  );
}
