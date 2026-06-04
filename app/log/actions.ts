// app/log/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export type LogEntry = {
  categoryId: string;
  details: string | null;
};

// Matches the DB column `tasks.date` (ISO 'YYYY-MM-DD').
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DETAILS = 300;

export async function logTasks(
  date: string,
  entries: LogEntry[],
): Promise<ActionResult> {
  if (!DATE_RE.test(date)) {
    return { ok: false, error: 'Kies een geldige datum.' };
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    return { ok: false, error: 'Selecteer minstens één taak.' };
  }

  const rows = [];
  for (const entry of entries) {
    if (!entry?.categoryId) {
      return { ok: false, error: 'Een van de geselecteerde taken is ongeldig.' };
    }
    const details =
      typeof entry.details === 'string' ? entry.details.trim() : '';
    if (details.length > MAX_DETAILS) {
      return {
        ok: false,
        error: `Details zijn te lang (max. ${MAX_DETAILS} tekens).`,
      };
    }
    rows.push({
      date,
      category_id: entry.categoryId,
      details: details || null,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('tasks').insert(rows);

  if (error) {
    // Foreign key violation — a category was deleted mid-session.
    if (error.code === '23503') {
      return {
        ok: false,
        error:
          'Een geselecteerde categorie bestaat niet meer. Herlaad de pagina en probeer opnieuw.',
      };
    }
    return {
      ok: false,
      error: 'Taken konden niet worden opgeslagen. Probeer het opnieuw.',
    };
  }

  // The calendar dashboard reads from this data.
  revalidatePath('/');
  return { ok: true };
}
